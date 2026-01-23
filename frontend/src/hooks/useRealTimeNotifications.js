import { useEffect, useCallback } from 'react';
import { useNotifications } from '../context/NotificationContext';
import {
  onNewMessage,
  offNewMessage,
  onTutorAvailabilityChanged,
  offTutorAvailabilityChanged,
  onNotification,
  offNotification,
} from '../services/socketService';
import { playNotificationSound } from '../utils/soundNotification';

/**
 * Hook that sets up real-time notification listeners
 * Listens for new messages, tutor availability changes, and general notifications
 */
export const useRealTimeNotifications = () => {
  const { addNotification, soundEnabled } = useNotifications();

  // Handle new message notifications
  const handleNewMessage = useCallback(
    (data) => {
      const { senderName, senderId, conversationId, preview } = data;

      // Play sound if enabled
      if (soundEnabled) {
        playNotificationSound('message');
      }

      // Add notification
      addNotification({
        type: 'message',
        title: `New message from ${senderName}`,
        message: preview || 'You have received a new message',
        duration: 6000,
        metadata: { senderName, senderId, conversationId },
        action: () => {
          // Navigate to chat would happen at a higher level
          window.location.href = `/chat/${senderId}`;
        },
        actionLabel: 'View Message',
      });

      console.log('📬 New message notification:', senderName);
    },
    [addNotification, soundEnabled]
  );

  // Handle tutor availability change notifications
  const handleTutorAvailabilityChanged = useCallback(
    (data) => {
      const { tutorName, tutorId, isAvailable, subject } = data;

      // Play sound if enabled
      if (soundEnabled) {
        playNotificationSound('availability');
      }

      const statusText = isAvailable ? 'is now available' : 'is now unavailable';

      // Add notification
      addNotification({
        type: 'tutor-availability',
        title: `${tutorName} ${statusText}`,
        message: subject
          ? `${tutorName} is ${isAvailable ? 'available' : 'unavailable'} for ${subject}`
          : `${tutorName} is ${isAvailable ? 'available' : 'unavailable'} for tutoring`,
        duration: 5000,
        metadata: { tutorName, tutorId, isAvailable, subject },
        action: isAvailable
          ? () => {
              window.location.href = `/tutor/${tutorId}`;
            }
          : null,
        actionLabel: isAvailable ? 'View Profile' : '',
      });

      console.log(
        `👨‍🏫 Tutor availability changed: ${tutorName} - ${isAvailable ? 'Available' : 'Unavailable'}`
      );
    },
    [addNotification, soundEnabled]
  );

  // Handle general notifications
  const handleNotification = useCallback(
    (data) => {
      const { type, title, message, action, actionLabel, metadata = {} } = data;

      // Play sound if enabled and type requires it
      if (soundEnabled && (type === 'request-accepted' || type === 'error')) {
        playNotificationSound(type);
      }

      addNotification({
        type,
        title,
        message,
        duration: 6000,
        metadata,
        action:
          action === 'redirect'
            ? () => {
                if (metadata.redirect) {
                  window.location.href = metadata.redirect;
                }
              }
            : null,
        actionLabel,
      });

      console.log(`📢 General notification: ${title}`);
    },
    [addNotification, soundEnabled]
  );

  // Setup listeners
  useEffect(() => {
    onNewMessage(handleNewMessage);
    onTutorAvailabilityChanged(handleTutorAvailabilityChanged);
    onNotification(handleNotification);

    // Cleanup
    return () => {
      offNewMessage();
      offTutorAvailabilityChanged();
      offNotification();
    };
  }, [handleNewMessage, handleTutorAvailabilityChanged, handleNotification]);
};
