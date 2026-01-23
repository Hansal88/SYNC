const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Message = require('../models/Message');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Import io instance from server
let io = null;
let activeUsers = null;

exports.setIO = (ioInstance) => {
  io = ioInstance;
};

exports.setActiveUsers = (activeUsersMap) => {
  activeUsers = activeUsersMap;
};

// SEND MESSAGE
router.post('/send', verifyToken, async (req, res) => {
  try {
    const { receiverId, content, messageType, fileUrl, fileName, fileSize } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Create conversation ID (sorted for consistency)
    const conversationId = [req.userId, receiverId].sort().join('_');

    // Create message with optional file data
    const messageData = {
      senderId: req.userId,
      receiverId,
      conversationId,
      content,
    };

    // Add file metadata if present
    if (messageType) {
      messageData.messageType = messageType;
    }
    if (fileUrl) {
      messageData.fileUrl = fileUrl;
    }
    if (fileName) {
      messageData.fileName = fileName;
    }
    if (fileSize) {
      messageData.fileSize = fileSize;
    }

    const message = new Message(messageData);

    await message.save();

    // Populate sender and receiver info
    await message.populate('senderId', 'name email');
    await message.populate('receiverId', 'name email');

    // ===== REAL-TIME NOTIFICATION =====
    // Emit new_message event to recipient
    if (activeUsers) {
      const receiverUser = activeUsers.get(receiverId);
      if (receiverUser && io) {
        io.to(receiverUser.socketId).emit('new_message', {
          senderName: message.senderId.name || message.senderId.email,
          senderId: message.senderId._id.toString(),
          conversationId: conversationId,
          preview: messageType === 'file' 
            ? `📎 ${fileName || 'File'}`
            : content.substring(0, 50)
        });
        console.log(`📬 Notification sent to ${receiverId}`);
      }
    }

    res.status(201).json({
      message: 'Message sent',
      data: message,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// UPLOAD FILE
router.post('/upload/:conversationId', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { conversationId } = req.params;
    if (!conversationId) {
      console.error('❌ No conversationId provided');
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    // Generate file URL
    const fileUrl = `/api/uploads/${conversationId}/${req.file.filename}`;
    
    console.log('✅ File uploaded successfully:', {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileUrl
    });
    
    res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    console.error('❌ Upload handler error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
});

// GET CONVERSATION MESSAGES
router.get('/conversation/:otherUserId', verifyToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const limit = req.query.limit || 50;
    const page = req.query.page || 1;
    const skip = (page - 1) * limit;

    // Validate otherUserId
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if other user exists
    const otherUser = await User.findById(otherUserId).select('name email role');
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create conversation ID
    const conversationId = [req.userId, otherUserId].sort().join('_');

    // Get messages
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark as read
    await Message.updateMany(
      { conversationId, receiverId: req.userId, isRead: false },
      { isRead: true }
    );

    // Get total count
    const total = await Message.countDocuments({ conversationId });

    res.status(200).json({
      message: 'Messages retrieved',
      count: messages.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: messages.reverse(), // Reverse to show oldest first
      otherUser: {
        _id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        role: otherUser.role,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// GET ALL CONVERSATIONS (for chat list)
router.get('/conversations/list', verifyToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Get all messages where user is sender or receiver
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
    ]);

    // Populate user details for each conversation
    const conversations = await Promise.all(
      messages.map(async (msg) => {
        const otherUserId = msg.lastMessage.senderId.toString() === req.userId 
          ? msg.lastMessage.receiverId 
          : msg.lastMessage.senderId;

        const otherUser = await User.findById(otherUserId).select('name email role');
        
        if (!otherUser) {
          return null; // Skip if user not found
        }

        // Calculate unread count for this conversation
        const unreadCount = await Message.countDocuments({
          conversationId: msg._id,
          receiverId: req.userId,
          isRead: false,
        });

        return {
          conversationId: msg._id,
          otherUser: {
            _id: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
            role: otherUser.role,
          },
          lastMessage: msg.lastMessage.content,
          lastMessageTime: msg.lastMessage.createdAt,
          isRead: msg.lastMessage.isRead,
          unreadCount,
        };
      })
    );

    // Filter out null conversations (deleted users)
    const validConversations = conversations.filter(conv => conv !== null);

    res.status(200).json({
      message: 'Conversations retrieved',
      count: validConversations.length,
      data: validConversations,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
});

// INITIATE CONVERSATION (create initial system message when request is accepted)
router.post('/initiate', verifyToken, async (req, res) => {
  try {
    const { otherUserId, requestId, subject } = req.body;

    if (!otherUserId || !requestId) {
      return res.status(400).json({ message: 'otherUserId and requestId are required' });
    }

    // Validate other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'Other user not found' });
    }

    // Create conversation ID
    const conversationId = [req.userId, otherUserId].sort().join('_');

    // Check if conversation already exists
    const existingMessages = await Message.findOne({ conversationId });
    if (existingMessages) {
      return res.status(200).json({
        message: 'Conversation already exists',
        conversationId,
      });
    }

    // Create initial system message
    const systemMessage = new Message({
      senderId: req.userId,
      receiverId: otherUserId,
      conversationId,
      content: `Chat started from request: "${subject || 'Tutoring Request'}"`,
      messageType: 'system',
      isRead: false,
    });

    await systemMessage.save();
    await systemMessage.populate('senderId', 'name email');
    await systemMessage.populate('receiverId', 'name email');

    res.status(201).json({
      message: 'Conversation initiated',
      conversationId,
      systemMessage,
    });
  } catch (error) {
    console.error('Error initiating conversation:', error);
    res.status(500).json({ message: 'Error initiating conversation', error: error.message });
  }
});

// GET UNREAD COUNT
router.get('/unread/count', verifyToken, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiverId: req.userId,
      isRead: false,
    });

    res.status(200).json({
      message: 'Unread count retrieved',
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
});

// DELETE MESSAGE
router.delete('/:messageId', verifyToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this message' });
    }

    await Message.findByIdAndDelete(req.params.messageId);

    res.status(200).json({
      message: 'Message deleted',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
});

module.exports = router;
module.exports.setIO = exports.setIO;
module.exports.setActiveUsers = exports.setActiveUsers;
