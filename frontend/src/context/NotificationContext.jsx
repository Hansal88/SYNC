import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const notificationIdRef = useRef(0);

  /**
   * Add a notification to the queue
   * @param {Object} config - Notification configuration
   * @param {string} config.type - Type: 'message', 'tutor-availability', 'request-accepted', 'request-rejected', 'success', 'error'
   * @param {string} config.title - Notification title
   * @param {string} config.message - Notification message
   * @param {number} config.duration - Duration in ms (0 = manual close, default 5000)
   * @param {Object} config.metadata - Additional data (userId, chatId, etc.)
   * @param {Function} config.action - Optional action callback
   * @param {string} config.actionLabel - Label for action button
   */
  const addNotification = useCallback((config) => {
    const {
      type = 'info',
      title,
      message,
      duration = 5000,
      metadata = {},
      action = null,
      actionLabel = 'View',
    } = config;

    const id = notificationIdRef.current++;
    const notification = {
      id,
      type,
      title,
      message,
      duration,
      metadata,
      action,
      actionLabel,
      timestamp: new Date(),
    };

    setNotifications((prev) => [notification, ...prev]);

    // Auto-remove notification after duration (unless duration is 0)
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeNotification(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
    // Persist to localStorage
    localStorage.setItem('notificationSoundEnabled', String(!soundEnabled));
  }, [soundEnabled]);

  // Load sound preference from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('notificationSoundEnabled');
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    soundEnabled,
    toggleSound,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
