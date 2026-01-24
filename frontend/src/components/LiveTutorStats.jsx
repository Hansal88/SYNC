import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useRequests } from '../context/RequestContext';

const LiveTutorStats = () => {
  const { isDark } = useTheme();
  const { liveStats } = useRequests();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border-2 transition-all cursor-pointer ${
        isDark
          ? 'border-blue-700 bg-gradient-to-br from-blue-900 to-blue-800'
          : 'border-blue-300 bg-gradient-to-br from-blue-100 to-blue-50'
      } ${isExpanded ? 'p-4' : 'p-4'}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`text-2xl p-2 rounded-lg ${
              isDark ? 'bg-blue-700' : 'bg-blue-200'
            }`}
          >
            👨‍🏫
          </div>
          <div>
            <h3
              className={`font-bold text-lg ${
                isDark ? 'text-white' : 'text-blue-900'
              }`}
            >
              Live Tutors
            </h3>
            <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              Real-time availability
            </p>
          </div>
        </div>
        <span
          className={`text-2xl font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}
        >
          {liveStats.onlineTutors}
        </span>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="mt-4 space-y-3 border-t-2 pt-4">
          <div
            className={`flex items-center justify-between p-3 rounded-lg ${
              isDark ? 'bg-blue-700/50' : 'bg-blue-100'
            }`}
          >
            <span className={isDark ? 'text-blue-200' : 'text-blue-800'}>
              🟢 Online Now
            </span>
            <span
              className={`font-bold text-lg ${
                isDark ? 'text-green-300' : 'text-green-700'
              }`}
            >
              {liveStats.onlineTutors}
            </span>
          </div>
          <div
            className={`flex items-center justify-between p-3 rounded-lg ${
              isDark ? 'bg-blue-700/50' : 'bg-blue-100'
            }`}
          >
            <span className={isDark ? 'text-blue-200' : 'text-blue-800'}>
              🔴 In Session
            </span>
            <span
              className={`font-bold text-lg ${
                isDark ? 'text-red-300' : 'text-red-700'
              }`}
            >
              {liveStats.tutorsInSession}
            </span>
          </div>
          <div
            className={`flex items-center justify-between p-3 rounded-lg ${
              isDark ? 'bg-blue-700/50' : 'bg-blue-100'
            }`}
          >
            <span className={isDark ? 'text-blue-200' : 'text-blue-800'}>
              ⏳ Available for New
            </span>
            <span
              className={`font-bold text-lg ${
                isDark ? 'text-yellow-300' : 'text-yellow-700'
              }`}
            >
              {Math.max(0, liveStats.onlineTutors - liveStats.tutorsInSession)}
            </span>
          </div>
        </div>
      )}

      {/* Collapse Indicator */}
      <div className="text-center mt-2">
        <span
          className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
        >
          {isExpanded ? '▲ Collapse' : '▼ Expand'}
        </span>
      </div>
    </div>
  );
};

export default LiveTutorStats;