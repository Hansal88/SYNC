import React, { useEffect } from 'react';
import { X, Bell, AlertCircle, CheckCircle2, MessageCircle, Users } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

// Individual notification item component
const NotificationItem = ({ notification, onClose, onAction }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageCircle size={20} />;
      case 'tutor-availability':
        return <Users size={20} />;
      case 'request-accepted':
      case 'success':
        return <CheckCircle2 size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getStyles = (type) => {
    const baseStyles = 'rounded-lg shadow-lg p-4 max-w-sm border';
    switch (type) {
      case 'message':
        return {
          container: `${baseStyles} bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800`,
          icon: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
          title: 'text-blue-900 dark:text-blue-100',
          message: 'text-blue-800 dark:text-blue-200',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      case 'tutor-availability':
        return {
          container: `${baseStyles} bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800`,
          icon: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300',
          title: 'text-purple-900 dark:text-purple-100',
          message: 'text-purple-800 dark:text-purple-200',
          button: 'bg-purple-600 hover:bg-purple-700 text-white',
        };
      case 'request-accepted':
      case 'success':
        return {
          container: `${baseStyles} bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800`,
          icon: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
          title: 'text-green-900 dark:text-green-100',
          message: 'text-green-800 dark:text-green-200',
          button: 'bg-green-600 hover:bg-green-700 text-white',
        };
      case 'error':
        return {
          container: `${baseStyles} bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800`,
          icon: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300',
          title: 'text-red-900 dark:text-red-100',
          message: 'text-red-800 dark:text-red-200',
          button: 'bg-red-600 hover:bg-red-700 text-white',
        };
      default:
        return {
          container: `${baseStyles} bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800`,
          icon: 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300',
          title: 'text-gray-900 dark:text-gray-100',
          message: 'text-gray-800 dark:text-gray-200',
          button: 'bg-gray-600 hover:bg-gray-700 text-white',
        };
    }
  };

  const styles = getStyles(notification.type);

  const handleAction = () => {
    if (notification.action) {
      notification.action();
    }
    onAction();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 400, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 400, y: -20 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      className={styles.container}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`rounded-full p-2 flex-shrink-0 ${styles.icon}`}>
          {getIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm ${styles.title}`}>
            {notification.title}
          </h3>
          <p className={`text-sm mt-1 ${styles.message} break-words`}>
            {notification.message}
          </p>

          {/* Action Button */}
          {notification.action && (
            <button
              onClick={handleAction}
              className={`mt-3 font-medium py-1.5 px-3 rounded text-xs transition-colors ${styles.button}`}
            >
              {notification.actionLabel}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onClose(notification.id)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 mt-0.5"
          aria-label="Close notification"
        >
          <X size={18} />
        </button>
      </div>

      {/* Progress bar for auto-close */}
      {notification.duration > 0 && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: notification.duration / 1000, ease: 'linear' }}
          className={`absolute bottom-0 left-0 right-0 h-1 origin-left bg-gradient-to-r`}
          style={{
            backgroundImage: `linear-gradient(to right, 
              ${notification.type === 'message' ? 'rgb(37, 99, 235)' :
                notification.type === 'tutor-availability' ? 'rgb(147, 51, 234)' :
                notification.type === 'request-accepted' ? 'rgb(34, 197, 94)' :
                notification.type === 'error' ? 'rgb(239, 68, 68)' :
                'rgb(107, 114, 128)'})`,
          }}
          onAnimationComplete={() => onClose(notification.id)}
        />
      )}
    </motion.div>
  );
};

// Main container component
export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationItem
              notification={notification}
              onClose={removeNotification}
              onAction={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
