import { useEffect, useRef, useCallback } from 'react';
import { useNotifications } from '../context/NotificationContext';

/**
 * Hook to manage message delivery status and read receipts
 * Tracks: sending → delivered → read
 * No backend schema changes required
 */
export function useMessageDelivery() {
  const messageStatusRef = useRef(new Map()); // Map<messageId, status>
  const { addNotification } = useNotifications();

  /**
   * Set message status locally
   * @param {string} messageId - Message ID
   * @param {string} status - 'sending' | 'delivered' | 'read' | 'failed'
   */
  const setMessageStatus = useCallback((messageId, status) => {
    if (!messageId) return;
    messageStatusRef.current.set(messageId, status);
  }, []);

  /**
   * Get message status
   * @param {string} messageId - Message ID
   * @returns {string} Current status
   */
  const getMessageStatus = useCallback((messageId) => {
    return messageStatusRef.current.get(messageId) || 'delivered';
  }, []);

  /**
   * Mark message as sent (optimistic update)
   * @param {string} messageId - Message ID
   */
  const markAsSending = useCallback((messageId) => {
    setMessageStatus(messageId, 'sending');
  }, [setMessageStatus]);

  /**
   * Mark message as delivered
   * @param {string} messageId - Message ID
   */
  const markAsDelivered = useCallback((messageId) => {
    const currentStatus = getMessageStatus(messageId);
    if (currentStatus !== 'read') {
      setMessageStatus(messageId, 'delivered');
    }
  }, [setMessageStatus, getMessageStatus]);

  /**
   * Mark message as read
   * @param {string} messageId - Message ID
   */
  const markAsRead = useCallback((messageId) => {
    setMessageStatus(messageId, 'read');
  }, [setMessageStatus]);

  /**
   * Mark message as failed
   * @param {string} messageId - Message ID
   */
  const markAsFailed = useCallback((messageId) => {
    setMessageStatus(messageId, 'failed');
  }, [setMessageStatus]);

  /**
   * Clear message status when message is removed
   * @param {string} messageId - Message ID
   */
  const clearStatus = useCallback((messageId) => {
    messageStatusRef.current.delete(messageId);
  }, []);

  /**
   * Reset all statuses when conversation changes
   */
  const resetAllStatuses = useCallback(() => {
    messageStatusRef.current.clear();
  }, []);

  return {
    setMessageStatus,
    getMessageStatus,
    markAsSending,
    markAsDelivered,
    markAsRead,
    markAsFailed,
    clearStatus,
    resetAllStatuses,
  };
}
