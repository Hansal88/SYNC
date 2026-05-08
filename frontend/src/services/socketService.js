import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'https://YOUR_RENDER_BACKEND_URL.onrender.com';
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

export const emitTyping = (conversationId, userId, otherUserId) => {
  getSocket().emit('typing', { conversationId, userId, otherUserId });
  console.log(`⌨️ Emitted typing: ${userId} in conversation ${conversationId}`);
};

export const emitStopTyping = (conversationId, userId, otherUserId) => {
  getSocket().emit('stop_typing', { conversationId, userId, otherUserId });
  console.log(`⏹️ Emitted stop_typing: ${userId}`);
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

export const emitMessageDelivered = (conversationId, userId, recipientId) => {
  getSocket().emit('message_delivered', { conversationId, userId, recipientId });
  console.log(`📬 Emitted message_delivered to ${recipientId}`);
};

export const emitMessageRead = (conversationId, userId) => {
  getSocket().emit('message_read', { conversationId, userId });
  console.log(`👁️ Emitted message_read by ${userId}`);
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

export const onUserTyping = (callback) => {
  getSocket().on('typing', callback);
};

export const onUserStopTyping = (callback) => {
  getSocket().on('stop_typing', callback);
};

export const onMessageDelivered = (callback) => {
  getSocket().on('message_delivered', callback);
};

export const onMessageReadReceipt = (callback) => {
  getSocket().on('message_read', callback);
};

export const onNewMessage = (callback) => {
  getSocket().on('new_message', callback);
};

export const onTutorAvailabilityChanged = (callback) => {
  getSocket().on('tutor_availability_changed', callback);
};

export const onNotification = (callback) => {
  getSocket().on('notification', callback);
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

export const offUserTyping = () => {
  getSocket().off('typing');
};

export const offUserStopTyping = () => {
  getSocket().off('stop_typing');
};

export const offMessageDelivered = () => {
  getSocket().off('message_delivered');
};

export const offMessageReadReceipt = () => {
  getSocket().off('message_read');
};

// ============================================
// Review System Events (Rating & Feedback)
// ============================================

export const onSessionCompleted = (callback) => {
  getSocket().on('session_completed', callback);
};

export const offSessionCompleted = () => {
  getSocket().off('session_completed');
};

export const onReviewModalTrigger = (callback) => {
  getSocket().on('review_modal_trigger', callback);
};

export const offReviewModalTrigger = () => {
  getSocket().off('review_modal_trigger');
};

export const onReviewRequested = (callback) => {
  getSocket().on('review_requested', callback);
};

export const offReviewRequested = () => {
  getSocket().off('review_requested');
};

export const onReviewReceived = (callback) => {
  getSocket().on('review_received', callback);
};

export const offReviewReceived = () => {
  getSocket().off('review_received');
};

export const onReviewCompleted = (callback) => {
  getSocket().on('review_completed', callback);
};

export const offReviewCompleted = () => {
  getSocket().off('review_completed');
};

export const onReviewReceivedNotification = (callback) => {
  getSocket().on('review_received_notification', callback);
};

export const offReviewReceivedNotification = () => {
  getSocket().off('review_received_notification');
};

export const onTutorRatingUpdated = (callback) => {
  getSocket().on('tutor_rating_updated', callback);
};

export const offTutorRatingUpdated = () => {
  getSocket().off('tutor_rating_updated');
};

export const offNewMessage = () => {
  getSocket().off('new_message');
};

export const offTutorAvailabilityChanged = () => {
  getSocket().off('tutor_availability_changed');
};

export const offNotification = () => {
  getSocket().off('notification');
};