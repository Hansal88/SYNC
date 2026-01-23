const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
require('dotenv').config();
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const chatRoutes = require('./routes/chatRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const requestRoutes = require('./routes/requestRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  },
});
const PORT = process.env.PORT || 5000;

// Store active users
const activeUsers = new Map(); // userId -> { socketId, role, isOnline, isInSession }

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Increase payload limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to Database
connectDB();

// Test Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Tutoring Backend API',
    version: '1.0.0',
    endpoints: {
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        verify: 'GET /api/auth/verify',
      },
      users: {
        getAll: 'GET /api/users',
        getOne: 'GET /api/users/:id',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id',
      },
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Initialize profile routes with io instance
const profileRoutesModule = require('./routes/profileRoutes');
profileRoutesModule.setIO(io);
profileRoutesModule.setActiveUsers(activeUsers);
app.use('/api/profile', profileRoutes);

app.use('/api/tutors', tutorRoutes);

// Initialize chat routes with io instance
const chatRoutesModule = require('./routes/chatRoutes');
chatRoutesModule.setIO(io);
chatRoutesModule.setActiveUsers(activeUsers);
app.use('/api/messages', chatRoutes);

app.use('/api/bookings', bookingRoutes);

// Initialize request routes with io instance
const requestRoutesModule = require('./routes/requestRoutes');
requestRoutesModule.setIO(io);
requestRoutesModule.setActiveUsers(activeUsers);
app.use('/api/requests', requestRoutes);

app.use('/api', userRoutes);

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // User comes online
  socket.on('user_online', (data) => {
    const { userId, role } = data;
    activeUsers.set(userId, {
      socketId: socket.id,
      role,
      isOnline: true,
      isInSession: false,
    });
    console.log(`📱 User online: ${userId} (Role: ${role})`);

    // Broadcast live counts
    io.emit('live_stats_update', getLiveStats());
  });

  // Learner sends a request
  socket.on('send_request', (data) => {
    const { tutorId, learnerId, request } = data;
    console.log(
      `📬 Request sent from ${learnerId} to tutor ${tutorId}:`,
      request
    );

    // Get tutor's socket
    const tutorUser = activeUsers.get(tutorId);
    if (tutorUser && tutorUser.isOnline) {
      io.to(tutorUser.socketId).emit('receive_request', {
        request,
        learnerId,
      });
      console.log(`✉️ Request delivered to tutor ${tutorId}`);
    } else {
      console.log(`⚠️ Tutor ${tutorId} is offline`);
    }

    // Update live stats
    io.emit('live_stats_update', getLiveStats());
  });

  // Tutor accepts request and creates chat
  socket.on('accept_request', (data) => {
    const { requestId, tutorId, learnerId } = data;
    console.log(
      `✅ Request accepted by tutor ${tutorId} for learner ${learnerId}`
    );

    // Update status for both tutor and learner
    const tutorUser = activeUsers.get(tutorId);
    const learnerUser = activeUsers.get(learnerId);

    if (tutorUser) {
      tutorUser.isInSession = true;
    }
    if (learnerUser && learnerUser.isOnline) {
      learnerUser.isInSession = true;
      io.to(learnerUser.socketId).emit('request_accepted', {
        requestId,
        tutorId,
      });
      console.log(`🎉 Learner ${learnerId} notified of acceptance`);
    }

    // Notify both users about new chat
    const conversationId = [tutorId, learnerId].sort().join('_');
    if (tutorUser) {
      io.to(tutorUser.socketId).emit('chat_created', {
        conversationId,
        otherUserId: learnerId,
        requestId,
      });
    }
    if (learnerUser && learnerUser.isOnline) {
      io.to(learnerUser.socketId).emit('chat_created', {
        conversationId,
        otherUserId: tutorId,
        requestId,
      });
    }
    console.log(`💬 Chat created for conversation: ${conversationId}`);

    // Broadcast updated live stats
    io.emit('live_stats_update', getLiveStats());
  });

  // Tutor rejects request
  socket.on('reject_request', (data) => {
    const { requestId, tutorId, learnerId, reason } = data;
    console.log(
      `❌ Request rejected by tutor ${tutorId} for learner ${learnerId}`
    );

    const learnerUser = activeUsers.get(learnerId);
    if (learnerUser && learnerUser.isOnline) {
      io.to(learnerUser.socketId).emit('request_rejected', {
        requestId,
        tutorId,
        reason,
      });
      console.log(`📢 Learner ${learnerId} notified of rejection`);
    }

    // Broadcast updated live stats
    io.emit('live_stats_update', getLiveStats());
  });

  // Session ended
  socket.on('session_ended', (data) => {
    const { userId } = data;
    const user = activeUsers.get(userId);
    if (user) {
      user.isInSession = false;
    }
    console.log(`🏁 Session ended for ${userId}`);

    // Broadcast updated live stats
    io.emit('live_stats_update', getLiveStats());
  });

  // ========== MESSAGE DELIVERY & READ RECEIPTS ==========
  // Message delivered - sender sent it successfully
  socket.on('message_delivered', (data) => {
    const { conversationId, messageId, receiverId } = data;
    const receiverUser = activeUsers.get(receiverId);
    
    if (receiverUser && io) {
      io.to(receiverUser.socketId).emit('message_delivered_confirmation', {
        messageId,
        conversationId,
        deliveredAt: new Date().toISOString(),
      });
      console.log(`📦 Message delivered confirmation sent for: ${messageId}`);
    }
  });

  // Message read - receiver saw it
  socket.on('message_read', (data) => {
    const { conversationId, messageId, receiverId } = data;
    const senderUser = activeUsers.get(receiverId);
    
    if (senderUser && io) {
      io.to(senderUser.socketId).emit('message_read_confirmation', {
        messageId,
        conversationId,
        readAt: new Date().toISOString(),
      });
      console.log(`✓ Message read confirmation sent for: ${messageId}`);
    }
  });

  // ========== TYPING INDICATORS ==========
  // User is typing
  socket.on('user_typing', (data) => {
    const { conversationId, userId, recipientId } = data;
    const recipientUser = activeUsers.get(recipientId);

    if (recipientUser && io) {
      io.to(recipientUser.socketId).emit('user_typing_notification', {
        conversationId,
        userId,
        userName: socket.userName || 'Someone',
      });
      console.log(`✍️ Typing notification sent from ${userId} to ${recipientId}`);
    }
  });

  // User stopped typing
  socket.on('user_stop_typing', (data) => {
    const { conversationId, userId, recipientId } = data;
    const recipientUser = activeUsers.get(recipientId);

    if (recipientUser && io) {
      io.to(recipientUser.socketId).emit('user_stop_typing_notification', {
        conversationId,
        userId,
      });
      console.log(`⏹️ Stop typing notification sent from ${userId} to ${recipientId}`);
    }
  });

  // User goes offline
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);

    // Find and remove user
    for (const [userId, user] of activeUsers.entries()) {
      if (user.socketId === socket.id) {
        activeUsers.delete(userId);
        console.log(`🔌 Removed user ${userId} from active list`);
        break;
      }
    }

    // Broadcast updated live stats
    io.emit('live_stats_update', getLiveStats());
  });
});

// Helper function to calculate live stats
function getLiveStats() {
  let onlineTutors = 0;
  let onlineLearners = 0;
  let tutorsInSession = 0;
  let learnersInSession = 0;
  let waitingRequests = 0; // Will be updated via database query later

  for (const [userId, user] of activeUsers.entries()) {
    if (user.isOnline) {
      if (user.role === 'tutor') {
        onlineTutors++;
        if (user.isInSession) tutorsInSession++;
      } else if (user.role === 'learner') {
        onlineLearners++;
        if (user.isInSession) learnersInSession++;
      }
    }
  }

  return {
    onlineTutors,
    onlineLearners,
    tutorsInSession,
    learnersInSession,
    totalOnline: onlineTutors + onlineLearners,
  };
}

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API Docs: http://localhost:${PORT}`);
  console.log(`⚡ Socket.IO ready for real-time communication`);
});

// Export io for use in other modules if needed
module.exports = { app, io, activeUsers };
