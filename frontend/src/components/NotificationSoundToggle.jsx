import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { playNotificationSound } from '../utils/soundNotification';

/**
 * Notification sound toggle component
 * Can be placed in the navbar or settings menu
 */
export default function NotificationSoundToggle() {
  const { soundEnabled, toggleSound } = useNotifications();

  const handleToggle = () => {
    toggleSound();
    // Play a preview sound if enabling
    if (!soundEnabled) {
      playNotificationSound('success');
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="relative group p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
    >
      {soundEnabled ? (
        <Volume2 size={20} className="text-gray-700 dark:text-gray-300" />
      ) : (
        <VolumeX size={20} className="text-gray-400 dark:text-gray-600" />
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {soundEnabled ? 'Notifications: On' : 'Notifications: Off'}
      </div>
    </button>
  );
}
