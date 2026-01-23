# Backend Integration Guide - Real-Time Notifications

## Overview

This guide shows how to modify backend socket handlers to emit real-time notifications for:
1. **New Messages** - Notify when user receives a message
2. **Tutor Availability Changes** - Notify when tutor status changes

## Implementation

### 1. New Message Notifications

#### Location: Chat/Message Routes or Message Handler

**In `backend/routes/chatRoutes.js` or wherever messages are saved:**

```javascript
const express = require('express');
const router = express.Router();
const Message = require('../models/Message'); // Adjust path
const User = require('../models/User');

// Assuming you have access to io (socket.io instance)
let io;

// Function to set io instance (called from server.js)
function setIO(socketIOInstance) {
  io = socketIOInstance;
}

// POST: Send a message
router.post('/:conversationId/send', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { senderId, content } = req.body;

    // Validate inputs
    if (!senderId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get sender info
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Extract recipient ID from conversation ID
    // Assuming format: "tutor_id_learner_id"
    const [id1, id2] = conversationId.split('_');
    const recipientId = senderId === id1 ? id2 : id1;

    // Save message to database
    const message = new Message({
      conversationId,
      senderId,
      content,
      timestamp: new Date(),
    });
    await message.save();

    // ===== EMIT REAL-TIME NOTIFICATION =====
    // Find recipient's socket
    const activeUsers = new Map(); // Assuming you have this in server.js
    const recipientUser = activeUsers.get(recipientId);

    if (recipientUser) {
      io.to(recipientUser.socketId).emit('new_message', {
        senderName: sender.name || sender.email,           // Display name
        senderId: sender._id.toString(),                   // User ID
        conversationId: conversationId,                    // Chat ID
        preview: content.substring(0, 50)                 // Message preview
      });
      console.log(`📬 Notification sent to ${recipientId}`);
    } else {
      console.log(`⚠️ Recipient ${recipientId} not online`);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, setIO };
```

**Export the setIO function in `backend/server.js`:**

```javascript
const chatRoutesModule = require('./routes/chatRoutes');
chatRoutesModule.setIO(io);
app.use('/api/messages', chatRoutesModule.router);
```

---

### 2. Tutor Availability Notifications

#### Location: Tutor Profile Update Route

**In `backend/routes/profileRoutes.js` or wherever tutor updates are handled:**

```javascript
router.put('/tutor/:tutorId', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { isAvailable, subject, ...otherUpdates } = req.body;

    // Update tutor profile
    const tutor = await User.findByIdAndUpdate(
      tutorId,
      {
        isAvailable: isAvailable !== undefined ? isAvailable : undefined,
        subject: subject || undefined,
        ...otherUpdates
      },
      { new: true, runValidators: true }
    );

    if (!tutor) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    // ===== EMIT AVAILABILITY CHANGE NOTIFICATION =====
    if (isAvailable !== undefined) {
      // Broadcast to all connected users
      io.emit('tutor_availability_changed', {
        tutorName: tutor.name || tutor.email,            // Tutor's display name
        tutorId: tutor._id.toString(),                   // Tutor's ID
        isAvailable: tutor.isAvailable,                  // true or false
        subject: tutor.subject || 'General'              // Subject specialty
      });

      const status = isAvailable ? 'available' : 'unavailable';
      console.log(`👨‍🏫 Tutor availability changed: ${tutorName} is now ${status}`);
    }

    res.json({
      success: true,
      message: 'Profile updated',
      data: tutor
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### 3. Optional: Generic Notification System

For more complex events, use a generic notification handler:

**In `backend/routes/requestRoutes.js` or similar:**

```javascript
// When request is accepted
router.post('/:requestId/accept', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { tutorId, learnerId } = req.body;

    // Update request status
    const request = await TutoringRequest.findByIdAndUpdate(
      requestId,
      { status: 'accepted', acceptedAt: new Date() },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Get tutor name for notification
    const tutor = await User.findById(tutorId);
    const learner = await User.findById(learnerId);

    // ===== EMIT GENERIC NOTIFICATION =====
    const learnerUser = activeUsers.get(learnerId);
    if (learnerUser) {
      io.to(learnerUser.socketId).emit('notification', {
        type: 'request-accepted',
        title: 'Request Accepted! 🎉',
        message: `${tutor.name || 'Your tutor'} has accepted your tutoring request`,
        metadata: {
          requestId: request._id.toString(),
          tutorId: tutor._id.toString(),
          action: 'redirect',
          redirect: `/chat/${tutorId}` // Optional: redirect on click
        }
      });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Complete Example: Chat Routes with Notifications

```javascript
// backend/routes/chatRoutes.js

const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();
let io = null;
let activeUsers = null;

// Set io and activeUsers from server.js
function initialize(socketIO, users) {
  io = socketIO;
  activeUsers = users;
}

// GET all messages in a conversation
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .sort({ timestamp: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST send a message
router.post('/:conversationId/send', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { senderId, content } = req.body;

    if (!senderId || !content) {
      return res.status(400).json({ error: 'Missing senderId or content' });
    }

    // Get sender info
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Extract recipient ID
    const [id1, id2] = conversationId.split('_');
    const recipientId = senderId === id1 ? id2 : id1;

    // Save message
    const message = new Message({
      conversationId,
      senderId,
      content,
      timestamp: new Date(),
    });
    await message.save();

    // ===== REAL-TIME NOTIFICATION =====
    const recipientUser = activeUsers.get(recipientId);
    if (recipientUser && io) {
      io.to(recipientUser.socketId).emit('new_message', {
        senderName: sender.name || sender.email,
        senderId: sender._id.toString(),
        conversationId: conversationId,
        preview: content.substring(0, 50)
      });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, initialize };
```

**Update `backend/server.js`:**

```javascript
const { router: chatRouter, initialize: initChat } = require('./routes/chatRoutes');

// Initialize chat routes with io and activeUsers
initChat(io, activeUsers);
app.use('/api/messages', chatRouter);
```

---

## Testing the Integration

### 1. Test New Message Notification

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Test API call
curl -X POST http://localhost:5000/api/messages/user1_user2/send \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "user1",
    "content": "Hello! Are you available?"
  }'
```

**Expected**: Recipient (user2) connected via Socket.IO should receive `new_message` event

### 2. Test Tutor Availability

```bash
curl -X PUT http://localhost:5000/api/profile/tutor/tutor_123 \
  -H "Content-Type: application/json" \
  -d '{
    "isAvailable": true,
    "subject": "Mathematics"
  }'
```

**Expected**: All connected clients should receive `tutor_availability_changed` event

---

## Key Points

✅ **Socket.IO Integration**: Uses existing Socket.IO connection (no new setup needed)

✅ **Event Names Matter**: Must match exactly:
- `new_message` (not `newMessage` or `message`)
- `tutor_availability_changed` (not `tutorAvailabilityChanged`)
- `notification` (for generic events)

✅ **Data Structure**: Frontend expects specific field names:
- `senderName`, `senderId`, `conversationId`, `preview`
- `tutorName`, `tutorId`, `isAvailable`, `subject`

✅ **Active Users Map**: Use the existing `activeUsers` map to find socket IDs

✅ **Logging**: Add console logs for debugging

✅ **Error Handling**: Check if user is online before emitting (graceful fallback)

---

## Troubleshooting

### "io is not defined"
- Make sure `io` is passed to your route module
- Call `initialize()` or `setIO()` function before using

### Events not received in frontend
- Check Socket.IO connection is established
- Verify event names match exactly (case-sensitive)
- Check browser console for socket errors
- Verify user is in `activeUsers` map

### Message saved but notification not sent
- Check if recipient is online (`activeUsers.get(recipientId)`)
- Verify socket ID exists on recipient user
- Check server console for emit errors

---

## Next Steps

1. Update your chat/message routes with notification emit (see example above)
2. Update your tutor profile routes with availability change emit
3. Test with two browser windows
4. Add to request acceptance/rejection handlers as needed
5. Fine-tune notification messages and metadata as needed

For frontend integration, see [NOTIFICATIONS_QUICK_REFERENCE.md](./NOTIFICATIONS_QUICK_REFERENCE.md)
