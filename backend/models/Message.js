const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    conversationId: {
      type: String, // Format: "userId1_userId2" (sorted for consistency)
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // Advanced features - ready for future implementation
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
    },
    // File attachment fields
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
    // For typing indicators (future feature)
    isTyping: {
      type: Boolean,
      default: false,
    },
    // For message reactions (future feature)
    reactions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      emoji: String,
    }],
    // For message editing (future feature)
    editedAt: {
      type: Date,
    },
    // For admin moderation (future feature)
    isModerated: {
      type: Boolean,
      default: false,
    },
    moderationReason: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create index for faster queries
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
