import { Check, CheckCheck, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Message Status Indicator Component
 * Shows: sending (clock) → delivered (single check) → read (double check)
 * Or shows failed state with retry button
 */
export function MessageStatusIndicator({ 
  status, 
  timestamp, 
  isCurrentUser, 
  onRetry,
  messageId 
}) {
  if (!isCurrentUser) return null;

  const statusConfigs = {
    sending: {
      icon: Clock,
      color: 'text-slate-300',
      tooltip: 'Sending...',
      animate: true,
    },
    delivered: {
      icon: Check,
      color: 'text-cyan-200',
      tooltip: 'Delivered',
      animate: false,
    },
    read: {
      icon: CheckCheck,
      color: 'text-cyan-100',
      tooltip: 'Read',
      animate: false,
    },
    failed: {
      icon: AlertCircle,
      color: 'text-red-400',
      tooltip: 'Failed to send',
      animate: false,
    },
  };

  const config = statusConfigs[status] || statusConfigs.delivered;
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-end gap-1.5">
      <span className="text-xs font-medium">
        {timestamp}
      </span>
      
      <motion.div
        key={status}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative"
        title={config.tooltip}
      >
        {status === 'sending' && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Icon size={14} className={config.color} />
          </motion.div>
        )}
        
        {status !== 'sending' && (
          <Icon size={14} className={config.color} />
        )}
      </motion.div>

      {status === 'failed' && onRetry && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ml-1 p-1 hover:bg-white/10 rounded transition-colors"
          onClick={() => onRetry(messageId)}
          title="Retry sending message"
        >
          <RotateCcw size={12} className="text-red-400 hover:text-red-300" />
        </motion.button>
      )}
    </div>
  );
}
