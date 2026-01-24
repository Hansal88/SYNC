import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useRequests } from '../context/RequestContext';

const LiveLearnerStats = () => {
  const { isDarkMode } = useTheme();
  const { liveStats, incomingRequests } = useRequests();

  const pendingRequests = incomingRequests.filter(
    (req) => req.status === 'pending'
  ).length;

  return (
    <div
      className={`rounded-lg border-2 p-4 ${isDarkMode ? 'border-slate-700 bg-transparent' : 'border-blue-200 bg-transparent'}`}
    >
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
      <div className={`mt-4 space-y-3 border-t-2 pt-4 ${isDarkMode ? 'border-slate-600' : 'border-blue-100'}`}>
          <div
            className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-blue-50'}`}
          >
            <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
              🟢 Online Now
            </span>
            <span
              className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            >
              {liveStats.onlineLearners}
            </span>
          </div>
          <div
            className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-blue-50'}`}
          >
            <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
              ⏳ Waiting Requests
            </span>
            <span
              className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            >
              {pendingRequests}
            </span>
          </div>
          </div>
    </div>
  );
};

export default LiveLearnerStats;