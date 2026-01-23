import { useEffect, useState, useRef, useCallback } from 'react';
import { emitTyping, emitStopTyping } from '../services/socketService';

/**
 * Hook to manage typing indicator functionality
 * Handles:
 * - Debounced typing emission
 * - Auto-clear after inactivity
 * - Efficient event emission
 */
export function useTypingIndicator(conversationId, currentUserId, otherUserId) {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const lastEmitTimeRef = useRef(0);
  const isTypingRef = useRef(false);

  /**
   * Emit typing event (debounced)
   */
  const handleUserTyping = useCallback(() => {
    const now = Date.now();
    const timeSinceLastEmit = now - lastEmitTimeRef.current;

    // Emit at most every 1 second to avoid spam
    if (timeSinceLastEmit > 1000) {
      emitTyping(conversationId, currentUserId, otherUserId);
      lastEmitTimeRef.current = now;
      isTypingRef.current = true;
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        emitStopTyping(conversationId, currentUserId, otherUserId);
        isTypingRef.current = false;
        setIsTyping(false);
      }
    }, 3000);
  }, [conversationId, currentUserId, otherUserId]);

  /**
   * Explicitly stop typing
   */
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTypingRef.current) {
      emitStopTyping(conversationId, currentUserId, otherUserId);
      isTypingRef.current = false;
      setIsTyping(false);
    }
  }, [conversationId, currentUserId, otherUserId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [stopTyping]);

  return {
    isTyping,
    handleUserTyping,
    stopTyping,
  };
}
