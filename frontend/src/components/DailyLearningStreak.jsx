import React, { useState, useEffect } from 'react';
import { Flame, Calendar } from 'lucide-react';

const DailyLearningStreak = ({ learnerData }) => {
  const [streakData, setStreakData] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    // Generate mock streak data for 14 days
    // In production, this would come from backend
    const generateStreakData = () => {
      const today = new Date();
      const data = [];
      
      // Create data for last 14 days
      for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Mock: simulate learning activity (higher chance for recent days)
        const hasActivity = Math.random() > (0.3 + i * 0.02);
        const hours = hasActivity ? Math.floor(Math.random() * 4) + 1 : 0;
        
        data.push({
          date: date.toISOString().split('T')[0],
          dateObj: new Date(date),
          hours: hours,
          hasActivity: hours > 0,
        });
      }

      // Calculate current streak
      let streak = 0;
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].hasActivity) {
          streak++;
        } else {
          break;
        }
      }
      setCurrentStreak(streak);

      // Calculate longest streak
      let maxStreak = 0;
      let tempStreak = 0;
      data.forEach(day => {
        if (day.hasActivity) {
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      });
      setLongestStreak(maxStreak);

      setStreakData(data);
    };

    generateStreakData();
  }, [learnerData]);

  // Get intensity color based on activity
  const getBlockColor = (day) => {
    if (!day.hasActivity) {
      return 'bg-slate-700/40 dark:bg-slate-600/30';
    }

    // Intensity based on hours
    const intensity = Math.min(day.hours / 4, 1);
    if (intensity >= 0.75) {
      return 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/40';
    } else if (intensity >= 0.5) {
      return 'bg-gradient-to-br from-blue-500/80 to-blue-600/80 shadow-md shadow-blue-500/30';
    } else {
      return 'bg-gradient-to-br from-blue-500/60 to-blue-600/60 shadow-sm shadow-blue-500/20';
    }
  };

  // Format date for tooltip
  const formatDate = (dateObj) => {
    return dateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Streak Info */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={24} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Daily Learning Streak
            </h3>
          </div>
          <div className="flex items-center gap-4">
            {currentStreak > 0 && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 dark:from-orange-600/30 dark:to-red-600/30 px-4 py-2 rounded-full border border-orange-400/50 dark:border-orange-600/50">
                <Flame className="text-orange-500 dark:text-orange-400 animate-bounce" size={20} />
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {currentStreak}-day streak
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Streak Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-center items-center text-center">
            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Current Streak</p>
            <p className="text-4xl font-black text-blue-600 dark:text-blue-400 mt-2 leading-none">{currentStreak}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">days</p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-center items-center text-center">
            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Longest Streak</p>
            <p className="text-4xl font-black text-purple-600 dark:text-purple-400 mt-2 leading-none">{longestStreak}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">days</p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-center items-center text-center">
            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">This Week</p>
            <p className="text-4xl font-black text-green-600 dark:text-green-400 mt-2 leading-none">
              {streakData.slice(-7).filter(d => d.hasActivity).length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">days active</p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-center items-center text-center">
            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Total Hours</p>
            <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mt-2 leading-none">
              {streakData.reduce((sum, day) => sum + day.hours, 0)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">14 days</p>
          </div>
        </div>
      </div>

      {/* Streak Graph */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <div className="mb-2">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">
            Last 14 Days
          </p>
        </div>

        {/* Streak Blocks - Responsive Grid */}
        <div className="flex flex-wrap gap-2 justify-start">
          {streakData.map((day, idx) => (
            <div key={day.date} className="group relative">
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 dark:bg-slate-950 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-10 shadow-lg transition-opacity duration-200">
                <div className="font-semibold">{formatDate(day.dateObj)}</div>
                <div className="text-slate-300">
                  {day.hasActivity ? `${day.hours}h learning` : 'No activity'}
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-950 transform rotate-45"></div>
              </div>

              {/* Block */}
              <div
                className={`
                  w-8 h-8 md:w-10 md:h-10 rounded-lg transition-all duration-300 cursor-pointer
                  hover:scale-125 hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500
                  ${getBlockColor(day)}
                  animate-in fade-in slide-in-from-bottom-4
                `}
                style={{
                  animationDelay: `${idx * 30}ms`,
                  animationFillMode: 'both',
                }}
              />
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-6 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-700/40 dark:bg-slate-600/30"></div>
              <span className="text-slate-600 dark:text-slate-400">No activity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500/60 to-blue-600/60"></div>
              <span className="text-slate-600 dark:text-slate-400">1-2 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500/80 to-blue-600/80"></div>
              <span className="text-slate-600 dark:text-slate-400">2-3 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-blue-600"></div>
              <span className="text-slate-600 dark:text-slate-400">3+ hours</span>
            </div>
          </div>
        </div>

        {/* Motivation Message */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {currentStreak === 0 
              ? "🚀 Start your first learning session today and build a streak!"
              : currentStreak < 3
              ? `🌟 Keep it up! You're on a ${currentStreak}-day streak. Just ${3 - currentStreak} more days to reach your first milestone!`
              : currentStreak < 7
              ? `⭐ Amazing consistency! You're on a ${currentStreak}-day streak. Keep pushing towards 7 days!`
              : `🔥 Incredible dedication! You've achieved a ${currentStreak}-day streak. You're a learning machine!`
            }
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
        Last updated today • Keep learning to maintain your streak!
      </div>
    </div>
  );
};

export default DailyLearningStreak;