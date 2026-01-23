const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Message = require('../models/Message');
const { verifyToken } = require('../middleware/authMiddleware');

// Import io instance from server
let io = null;
let activeUsers = null;

exports.setIO = (ioInstance) => {
  io = ioInstance;
};

exports.setActiveUsers = (activeUsersMap) => {
  activeUsers = activeUsersMap;
};

// Send a request from learner to tutor
router.post('/', verifyToken, async (req, res) => {
  try {
    const { tutorId, subject, message } = req.body;
    const learnerId = req.user.id;

    if (!tutorId || !subject || !message) {
      return res.status(400).json({
        error: 'Missing required fields: tutorId, subject, message',
      });
    }

    // Check if request already exists (pending/accepted)
    const existingRequest = await Request.findOne({
      learnerId,
      tutorId,
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingRequest) {
      return res.status(400).json({
        error: 'You already have an active request with this tutor',
      });
    }

    const newRequest = new Request({
      learnerId,
      tutorId,
      subject,
      message,
      status: 'pending',
    });

    await newRequest.save();
    const populatedRequest = await newRequest.populate([
      { path: 'learnerId', select: 'name email profilePhoto' },
      { path: 'tutorId', select: 'name email profilePhoto' },
    ]);

    res.status(201).json({
      message: 'Request sent successfully',
      request: populatedRequest,
    });
  } catch (error) {
    console.error('Error sending request:', error);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// Get incoming requests for tutor
router.get('/tutor/incoming', verifyToken, async (req, res) => {
  try {
    const tutorId = req.user.id;

    const requests = await Request.find({ tutorId })
      .populate('learnerId', 'name email profilePhoto')
      .sort({ createdAt: -1 });

    res.json({
      requests,
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
    });
  } catch (error) {
    console.error('Error fetching incoming requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Get sent requests for learner
router.get('/learner/sent', verifyToken, async (req, res) => {
  try {
    const learnerId = req.user.id;

    const requests = await Request.find({ learnerId })
      .populate('tutorId', 'name email profilePhoto')
      .sort({ createdAt: -1 });

    res.json({
      requests,
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
    });
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Accept a request
router.put('/:requestId/accept', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const tutorId = req.user.id;

    const request = await Request.findById(requestId).populate(
      'learnerId',
      'name email'
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.tutorId.toString() !== tutorId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        error: 'Cannot accept a request that is not pending',
      });
    }

    request.status = 'accepted';
    await request.save();

    // Create chat conversation
    const learnerId = request.learnerId._id.toString();
    const conversationId = [tutorId, learnerId].sort().join('_');

    // Check if conversation already exists
    let existingChat = await Message.findOne({ conversationId });
    let chatCreated = false;

    if (!existingChat) {
      // Create initial system message
      const systemMessage = new Message({
        senderId: tutorId,
        receiverId: learnerId,
        conversationId,
        content: `Chat started from request: "${request.subject}"`,
        messageType: 'system',
        isRead: false,
      });

      await systemMessage.save();
      chatCreated = true;
      console.log('✅ Chat conversation created for request:', requestId);
    }

    // Emit socket events to both users if chat was created and io is available
    if (io && activeUsers && chatCreated) {
      const learnerUser = activeUsers.get(learnerId);
      const tutorUser = activeUsers.get(tutorId);

      // Emit to learner (if online)
      if (learnerUser && learnerUser.isOnline) {
        io.to(learnerUser.socketId).emit('chat_created', {
          chatId: conversationId,
          tutorId,
          requestId,
        });
        
        // Send notification to learner
        io.to(learnerUser.socketId).emit('notification', {
          type: 'request-accepted',
          title: 'Request Accepted',
          message: `${request.tutorId.name} accepted your tutoring request`,
          metadata: { 
            redirect: `/chat/${tutorId}`,
            requestId,
            tutorId 
          }
        });
        console.log(`📬 Emitted chat_created and notification to learner: ${learnerId}`);
      }

      // Emit to tutor
      if (tutorUser) {
        io.to(tutorUser.socketId).emit('chat_created', {
          chatId: conversationId,
          learnerId,
          requestId,
        });
        console.log(`📬 Emitted chat_created to tutor: ${tutorId}`);
      }
    }

    res.json({
      message: 'Request accepted',
      request,
      chatId: conversationId,
    });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Reject a request
router.put('/:requestId/reject', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const tutorId = req.user.id;

    const request = await Request.findById(requestId).populate(
      'learnerId',
      'name email'
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.tutorId.toString() !== tutorId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        error: 'Cannot reject a request that is not pending',
      });
    }

    request.status = 'rejected';
    if (reason) {
      request.rejectionReason = reason;
    }
    await request.save();

    // Emit notification to learner if online
    if (io && activeUsers) {
      const learnerUser = activeUsers.get(request.learnerId._id);
      if (learnerUser && learnerUser.isOnline) {
        io.to(learnerUser.socketId).emit('notification', {
          type: 'request-rejected',
          title: 'Request Rejected',
          message: `${request.tutorId.name} declined your tutoring request${reason ? ': ' + reason : ''}`,
          metadata: { 
            requestId,
            tutorId: request.tutorId._id 
          }
        });
        console.log(`📬 Emitted notification to learner: ${request.learnerId._id}`);
      }
    }

    res.json({
      message: 'Request rejected',
      request,
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// Get single request
router.get('/:requestId', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findById(requestId).populate([
      { path: 'learnerId', select: 'name email profilePhoto' },
      { path: 'tutorId', select: 'name email profilePhoto' },
    ]);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// Export router and utility functions
router.setIO = (ioInstance) => {
  io = ioInstance;
};

router.setActiveUsers = (activeUsersMap) => {
  activeUsers = activeUsersMap;
};

module.exports = router;
