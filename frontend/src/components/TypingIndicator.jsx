import { motion } from 'framer-motion';

/**
 * Typing Indicator Component
 * Shows "User is typing..." with animated dots
 */
export function TypingIndicator({ userName, isVisible }) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-2 items-center px-4 py-2 rounded-2xl bg-slate-700/50 border border-slate-600/30 w-fit"
    >
      {/* Animated typing dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-slate-400 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: index * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Typing text */}
      <span className="text-sm text-slate-300 font-medium">
        {userName || 'Someone'} is typing...
      </span>
    </motion.div>
  );
}
