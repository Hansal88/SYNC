import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useRequests } from '../context/RequestContext';

const LiveLearnerStats = () => {
  const { isDark } = useTheme();
  const { liveStats, incomingRequests } = useRequests();
  const [isExpanded, setIsExpanded] = useState(false);

  const pendingRequests = incomingRequests.filter(
    (req) => req.status === 'pending'
  ).length;

  return (
    <div
      className={`rounded-lg border-2 transition-all cursor-pointer ${
        isDark
          ? 'border-purple-700 bg-gradient-to-br from-purple-900 to-purple-800'
          : 'border-purple-300 bg-gradient-to-br from-purple-100 to-purple-50'
      } ${isExpanded ? 'p-4' : 'p-4'}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`text-2xl p-2 rounded-lg ${
              isDark ? 'bg-purple-700' : 'bg-purple-200'
            }`}
          >
            🧑‍🎓
          </div>
          <div>
            <h3
              className={`font-bold text-lg ${
                isDark ? 'text-white' : 'text-purple-900'
              }`}
            >
              Learner Activity
            </h3>
            <p
              className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'}`}
            >
              Dashboard overview
            </p>
          </div>
        </div>
        <span
          className={`text-2xl font-bold ${
            isDark ? 'text-purple-300' : 'text-purple-700'
          }`}
        >
          {liveStats.onlineLearners}
        </span>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="mt-4 space-y-3 border-t-2 pt-4">
          <div
            className={`flex items-center justify-between p-3 rounded-lg ${
              isDark ? 'bg-purple-700/50' : 'bg-purple-100'
            }`}
          >
            <span className={isDark ? 'text-purple-200' : 'text-purple-800'}>
              🟢 Online Now
            </span>
            <span
              className={`font-bold text-lg ${
                isDark ? 'text-green-300' : 'text-green-700'
              }`}
            >
              {liveStats.onlineLearners}
            </span>
          </div>
          <div
            className={`flex items-center justify-between p-3 rounded-lg ${
              isDark ? 'bg-purple-700/50' : 'bg-purple-100'
            }`}
          >
            <span className={isDark ? 'text-purple-200' : 'text-purple-800'}>
              🔵 In Session
            </span>
            <span
              className={`font-bold text-lg ${
                isDark ? 'text-blue-300' : 'text-blue-700'
              }`}
            >
              {liveStats.learnersInSession}
            </span>
          </div>
          <div
            className={`flex items-center justify-between p-3 rounded-lg ${
              isDark ? 'bg-purple-700/50' : 'bg-purple-100'
            }`}
          >
            <span className={isDark ? 'text-purple-200' : 'text-purple-800'}>
              ⏳ Waiting Requests
            </span>
            <span
              className={`font-bold text-lg ${
                isDark ? 'text-yellow-300' : 'text-yellow-700'
              }`}
            >
              {pendingRequests}
            </span>
          </div>
        </div>
      )}

      {/* Collapse Indicator */}
      <div className="text-center mt-2">
        <span
          className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}
        >
          {isExpanded ? '▲ Collapse' : '▼ Expand'}
        </span>
      </div>
    </div>
  );
};

export default LiveLearnerStats;
