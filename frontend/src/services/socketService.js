import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Socket event emitters
export const emitUserOnline = (userId, role) => {
  getSocket().emit('user_online', { userId, role });
  console.log(`📱 Emitted user_online: ${userId} (${role})`);
};

export const emitSendRequest = (tutorId, learnerId, request) => {
  getSocket().emit('send_request', { tutorId, learnerId, request });
  console.log(`📬 Emitted send_request to tutor: ${tutorId}`);
};

export const emitAcceptRequest = (requestId, tutorId, learnerId) => {
  getSocket().emit('accept_request', { requestId, tutorId, learnerId });
  console.log(`✅ Emitted accept_request: ${requestId}`);
};

export const emitRejectRequest = (requestId, tutorId, learnerId, reason = '') => {
  getSocket().emit('reject_request', { requestId, tutorId, learnerId, reason });
  console.log(`❌ Emitted reject_request: ${requestId}`);
};

export const emitSessionEnded = (userId) => {
  getSocket().emit('session_ended', { userId });
  console.log(`🏁 Emitted session_ended: ${userId}`);
};

// Socket event listeners
export const onReceiveRequest = (callback) => {
  getSocket().on('receive_request', callback);
};

export const onRequestAccepted = (callback) => {
  getSocket().on('request_accepted', callback);
};

export const onRequestRejected = (callback) => {
  getSocket().on('request_rejected', callback);
};

export const onLiveStatsUpdate = (callback) => {
  getSocket().on('live_stats_update', callback);
};

export const onChatCreated = (callback) => {
  getSocket().on('chat_created', callback);
};

// Remove listeners
export const offReceiveRequest = () => {
  getSocket().off('receive_request');
};

export const offRequestAccepted = () => {
  getSocket().off('request_accepted');
};

export const offRequestRejected = () => {
  getSocket().off('request_rejected');
};

export const offLiveStatsUpdate = () => {
  getSocket().off('live_stats_update');
};

export const offChatCreated = () => {
  getSocket().off('chat_created');
};

// ========== REAL-TIME NOTIFICATION LISTENERS ==========
// These are for real-time notifications (new messages, tutor availability)

export const onNewMessage = (callback) => {
  getSocket().on('new_message', callback);
};

export const offNewMessage = () => {
  getSocket().off('new_message');
};

export const onTutorAvailabilityChanged = (callback) => {
  getSocket().on('tutor_availability_changed', callback);
};

export const offTutorAvailabilityChanged = () => {
  getSocket().off('tutor_availability_changed');
};

export const onNotification = (callback) => {
  getSocket().on('notification', callback);
};

export const offNotification = () => {
  getSocket().off('notification');
};

// ========== MESSAGE DELIVERY & READ RECEIPTS ==========
// These events track message delivery status and read receipts

export const emitMessageDelivered = (conversationId, messageId, receiverId) => {
  getSocket().emit('message_delivered', { conversationId, messageId, receiverId });
  console.log(`📦 Emitted message_delivered: ${messageId}`);
};

export const emitMessageRead = (conversationId, messageId, receiverId) => {
  getSocket().emit('message_read', { conversationId, messageId, receiverId });
  console.log(`✓ Emitted message_read: ${messageId}`);
};

// Listen for delivery confirmation from receiver
export const onMessageDelivered = (callback) => {
  getSocket().on('message_delivered_confirmation', callback);
};

export const offMessageDelivered = () => {
  getSocket().off('message_delivered_confirmation');
};

// Listen for read receipt from receiver
export const onMessageReadReceipt = (callback) => {
  getSocket().on('message_read_confirmation', callback);
};

export const offMessageReadReceipt = () => {
  getSocket().off('message_read_confirmation');
};

// Listen for delivery failures
export const onMessageDeliveryFailed = (callback) => {
  getSocket().on('message_delivery_failed', callback);
};

export const offMessageDeliveryFailed = () => {
  getSocket().off('message_delivery_failed');
};

// ========== TYPING INDICATORS ==========
// Emit typing and stop typing events

export const emitTyping = (conversationId, userId, recipientId) => {
  getSocket().emit('user_typing', {
    conversationId,
    userId,
    recipientId,
  });
  console.log(`✍️ Emitted user_typing: ${userId}`);
};

export const emitStopTyping = (conversationId, userId, recipientId) => {
  getSocket().emit('user_stop_typing', {
    conversationId,
    userId,
    recipientId,
  });
  console.log(`⏹️ Emitted user_stop_typing: ${userId}`);
};

// Listen for typing events
export const onUserTyping = (callback) => {
  getSocket().on('user_typing_notification', callback);
};

export const offUserTyping = () => {
  getSocket().off('user_typing_notification');
};

// Listen for stop typing events
export const onUserStopTyping = (callback) => {
  getSocket().on('user_stop_typing_notification', callback);
};

export const offUserStopTyping = () => {
  getSocket().off('user_stop_typing_notification');
};
