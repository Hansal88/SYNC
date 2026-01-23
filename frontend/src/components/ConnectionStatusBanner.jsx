import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RotateCcw } from 'lucide-react';

/**
 * Connection Status Banner Component
 * Shows current WebSocket/network connection status
 */
export function ConnectionStatusBanner({ status, isVisible, onClose }) {
  const statusConfig = {
    connected: {
      icon: Wifi,
      label: 'Connected',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      dotColor: 'bg-emerald-500',
    },
    reconnecting: {
      icon: RotateCcw,
      label: 'Reconnecting...',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
      dotColor: 'bg-amber-500',
    },
    offline: {
      icon: WifiOff,
      label: 'Offline',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      dotColor: 'bg-red-500',
    },
  };

  const config = statusConfig[status] || statusConfig.connected;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg backdrop-blur-md ${config.bgColor} border ${config.borderColor} flex items-center gap-2.5 cursor-pointer hover:opacity-75 transition-opacity duration-200`}
        >
          {/* Status indicator dot */}
          <motion.div
            className={`w-2 h-2 rounded-full ${config.dotColor}`}
            animate={status === 'reconnecting' ? { scale: [1, 1.2, 1] } : {}}
            transition={status === 'reconnecting' ? { duration: 1, repeat: Infinity } : {}}
          />

          {/* Status icon */}
          {status === 'reconnecting' ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, linear: true }}>
              <Icon size={16} className={config.textColor} />
            </motion.div>
          ) : (
            <Icon size={16} className={config.textColor} />
          )}

          {/* Status label */}
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.label}
          </span>

          {/* Close hint (only on desktop) */}
          <span className="hidden sm:inline text-xs opacity-60 ml-2">
            {status === 'connected' ? '(auto-hide)' : ''}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
