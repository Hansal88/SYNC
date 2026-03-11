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
const studyMaterialRoutes = require('./routes/studyMaterialRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const aiChatRoutes = require('./routes/aiChatRoutes'); // 🤖 AI CHAT ROUTE

const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// ================= ACTIVE USERS =================
const activeUsers = new Map();

// ================= MIDDLEWARE =================
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static uploads
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= DATABASE =================
connectDB();

// ================= ROOT TEST ROUTE =================
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Tutoring Backend API',
    version: '1.0.0'
  });
});

// ================= API ROUTES =================

// Auth
app.use('/api/auth', authRoutes);

// Profile
const profileRoutesModule = require('./routes/profileRoutes');
profileRoutesModule.setIO(io);
profileRoutesModule.setActiveUsers(activeUsers);
app.use('/api/profile', profileRoutes);

// Tutors
app.use('/api/tutors', tutorRoutes);

// Messages / Chat
const chatRoutesModule = require('./routes/chatRoutes');
chatRoutesModule.setIO(io);
chatRoutesModule.setActiveUsers(activeUsers);
app.use('/api/messages', chatRoutes);

// Bookings
app.use('/api/bookings', bookingRoutes);

// Study Materials
app.use('/api/study-material', studyMaterialRoutes);

// Requests
const requestRoutesModule = require('./routes/requestRoutes');
requestRoutesModule.setIO(io);
requestRoutesModule.setActiveUsers(activeUsers);
app.use('/api/requests', requestRoutes);

// Reviews
const reviewRoutesModule = require('./routes/reviewRoutes');
reviewRoutesModule.setIO(io);
reviewRoutesModule.setActiveUsers(activeUsers);
app.use('/api/reviews', reviewRoutes);

// 🤖 AI CHATBOT ROUTE
app.use('/api/ai-chat', aiChatRoutes);

// Users
app.use('/api', userRoutes);

// ================= SOCKET.IO =================
io.on('connection', (socket) => {

  console.log(`✅ User connected: ${socket.id}`);

  socket.on('user_online', ({ userId, role }) => {

    activeUsers.set(userId, {
      socketId: socket.id,
      role,
      isOnline: true,
      isInSession: false
    });

    console.log(`📱 User online: ${userId} (${role})`);

    io.emit('live_stats_update', getLiveStats());
  });

  socket.on('disconnect', () => {

    console.log(`❌ User disconnected: ${socket.id}`);

    for (const [userId, user] of activeUsers.entries()) {

      if (user.socketId === socket.id) {
        activeUsers.delete(userId);
        break;
      }

    }

    io.emit('live_stats_update', getLiveStats());
  });

});

// ================= LIVE STATS =================
function getLiveStats() {

  let onlineTutors = 0;
  let onlineLearners = 0;
  let tutorsInSession = 0;
  let learnersInSession = 0;

  for (const user of activeUsers.values()) {

    if (user.isOnline) {

      if (user.role === 'tutor') {
        onlineTutors++;
        if (user.isInSession) tutorsInSession++;
      }

      if (user.role === 'learner') {
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
    totalOnline: onlineTutors + onlineLearners
  };

}

// ================= HEALTH CHECK =================
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {

  console.error(err.stack);

  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  });

});

// ================= START SERVER =================
server.listen(PORT, () => {

  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`⚡ Socket.IO ready`);

});

module.exports = { app, io, activeUsers };