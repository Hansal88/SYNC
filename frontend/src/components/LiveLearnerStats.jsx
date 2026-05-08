import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useRequests } from '../context/RequestContext';
import GlassCard from './GlassCard';

const LiveLearnerStats = () => {
  const { isDarkMode } = useTheme();
  const { liveStats, incomingRequests } = useRequests();

  const pendingRequests = incomingRequests.filter(
    (req) => req.status === 'pending'
  ).length;

  return (
    <GlassCard className="rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`text-2xl p-2 rounded-lg ${
              isDarkMode ? 'bg-purple-700' : 'bg-purple-200'
            }`}
          >
            🧑‍🎓
          </div>
          <div>
            <h3
              className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            >
              Learner Activity
            </h3>
            <p
              className={`text-sm ${isDarkMode ? 'text-blue-100' : 'text-slate-600'}`}
            >
              Dashboard overview
            </p>
          </div>
        </div>
        <span
          className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
        >
          {liveStats.onlineLearners}
        </span>
      </div>

      {/* Stats View */}
      <motion.div
        className={`mt-4 space-y-3 border-t-2 pt-4 ${isDarkMode ? 'border-slate-600' : 'border-blue-100'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-blue-50'}`}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
            🟢 Online Now
          </span>
          <span
            className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
          >
            {liveStats.onlineLearners}
          </span>
        </motion.div>
        <motion.div
          className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-blue-50'}`}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
            ⏳ Waiting Requests
          </span>
          <span
            className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
          >
            {pendingRequests}
          </span>
        </motion.div>
      </motion.div>
    </GlassCard>
  );
};

export default LiveLearnerStats;