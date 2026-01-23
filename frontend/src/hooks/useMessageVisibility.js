import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to detect when messages become visible in viewport
 * Triggers callback when message is fully or partially visible
 * Used for read receipt tracking and lazy loading
 */
export function useMessageVisibility(elementRef, onVisible, dependencies = []) {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!elementRef?.current) return;

    // Reset trigger flag when dependencies change
    hasTriggeredRef.current = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Trigger when element enters viewport (at least 50% visible)
          if (entry.isIntersecting && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            onVisible?.();
          }
          // Reset when element leaves viewport
          else if (!entry.isIntersecting) {
            hasTriggeredRef.current = false;
          }
        });
      },
      {
        threshold: [0.5], // Trigger when 50% visible
        rootMargin: '50px', // Start observing 50px before entering viewport
      }
    );

    observer.observe(elementRef.current);

    return () => {
      if (elementRef?.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [onVisible, ...dependencies]);
}

/**
 * Hook to batch process visible messages
 * More efficient than checking each message individually
 */
export function useVisibleMessages(messagesRef, onMessagesVisible) {
  useEffect(() => {
    if (!messagesRef?.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleIds = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target.getAttribute('data-message-id'))
          .filter(Boolean);

        if (visibleIds.length > 0) {
          onMessagesVisible(visibleIds);
        }
      },
      {
        threshold: 0.5,
        rootMargin: '50px',
      }
    );

    // Observe all message elements
    const messageElements = messagesRef.current.querySelectorAll('[data-message-id]');
    messageElements.forEach((el) => observer.observe(el));

    return () => {
      messageElements.forEach((el) => observer.unobserve(el));
    };
  }, [onMessagesVisible]);
}
