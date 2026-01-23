import { useEffect } from 'react';
import { useRealTimeNotifications } from '../hooks/useRealTimeNotifications';
import { initAudioContext, requestAudioPermission } from '../utils/soundNotification';

/**
 * App initializer component
 * Sets up real-time notifications and audio context
 * Should be placed inside NotificationProvider
 */
export default function AppInitializer({ children }) {
  // Initialize real-time notifications
  useRealTimeNotifications();

  // Initialize audio context on first user interaction
  useEffect(() => {
    const handleUserInteraction = async () => {
      initAudioContext();
      await requestAudioPermission();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  return children;
}
