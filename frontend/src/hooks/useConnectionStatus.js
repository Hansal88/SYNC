import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '../services/socketService';

/**
 * Hook to monitor socket.io connection status
 * Returns: 'connected' | 'reconnecting' | 'offline'
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState('connected');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setStatus('connected');
      setIsVisible(true);
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleDisconnect = () => {
      setStatus('offline');
      setIsVisible(true);
    };

    const handleConnectError = () => {
      setStatus('reconnecting');
      setIsVisible(true);
    };

    const handleReconnectAttempt = () => {
      setStatus('reconnecting');
      setIsVisible(true);
    };

    // Listen for connection events
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnect_attempt', handleReconnectAttempt);

    // Check initial state
    if (socket.connected) {
      setStatus('connected');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect_attempt', handleReconnectAttempt);
    };
  }, []);

  const manualHide = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    status, // 'connected' | 'reconnecting' | 'offline'
    isVisible,
    hide: manualHide,
  };
}
