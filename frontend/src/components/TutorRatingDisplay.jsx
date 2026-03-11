import React, { useEffect, useState } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import reviewService from '../services/reviewService';

/**
 * TutorRatingDisplay - Shows tutor's rating statistics
 * Displays average rating, total reviews, and rating breakdown
 * Used in tutor profiles and tutor listing pages
 */
const TutorRatingDisplay = ({ tutorId, onStatsLoaded }) => {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await reviewService.getTutorStats(tutorId);
        setStats(data);
        onStatsLoaded?.(data);
      } catch (err) {
        console.error('Failed to fetch tutor stats:', err);
        setError(err.message || 'Failed to load ratings');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    if (tutorId) {
      fetchStats();
    }
  }, [tutorId, onStatsLoaded]);

  if (loading) {
    return (
      <div className={`p-4 rounded-lg animate-pulse ${
        isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
      }`}>
        <div className={`h-8 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className={`p-4 rounded-lg border-2 ${
        isDarkMode
          ? 'bg-slate-800/50 border-slate-700 text-slate-400'
          : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <p className="text-sm font-semibold">No ratings yet</p>
        <p className="text-xs mt-1">Be the first to rate this tutor!</p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${
      isDarkMode
        ? 'bg-slate-800/50 border-slate-700'
        : 'bg-blue-50/50 border-blue-200'
    }`}>
      
      {/* Main Rating Section */}
      <div className="flex items-center gap-4 mb-6">
        {/* Average Rating */}
        <div className="flex-shrink-0">
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {stats.averageRating?.toFixed(1) || '0.0'}
            </span>
            <span className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              / 5
            </span>
          </div>
        </div>

        {/* Star Display */}
        <div className="flex-1">
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={18}
                className={`${
                  star <= Math.round(stats.averageRating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : isDarkMode
                    ? 'text-slate-600'
                    : 'text-slate-300'
                }`}
              />
            ))}
          </div>
          <p className={`text-xs font-semibold ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        {/* Trend Indicator */}
        <div className={`p-2 rounded-lg ${
          isDarkMode ? 'bg-slate-700' : 'bg-white'
        }`}>
          <TrendingUp 
            size={20} 
            className={stats.averageRating >= 4 ? 'text-green-500' : 'text-yellow-500'} 
          />
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className={`space-y-2 pt-4 border-t ${
        isDarkMode ? 'border-slate-700' : 'border-slate-200'
      }`}>
        <p className={`text-xs font-semibold mb-3 ${
          isDarkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Rating Breakdown
        </p>

        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.ratingBreakdown?.[star] || 0;
          const percentage = stats.totalReviews > 0 
            ? Math.round((count / stats.totalReviews) * 100)
            : 0;

          return (
            <div key={star} className="flex items-center gap-3">
              {/* Star Label */}
              <span className="text-xs font-semibold w-8 flex items-center gap-1">
                <span>{star}</span>
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
              </span>

              {/* Progress Bar */}
              <div className={`flex-1 h-2 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
              }`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Count */}
              <span className={`text-xs font-semibold w-8 text-right ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Quality Indicator */}
      <div className="mt-4 pt-4 border-t flex items-center gap-2">
        {stats.averageRating >= 4.5 && (
          <>
            <span className="text-lg">🌟</span>
            <p className={`text-xs font-semibold ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              Excellent ratings
            </p>
          </>
        )}
        {stats.averageRating >= 3.5 && stats.averageRating < 4.5 && (
          <>
            <span className="text-lg">👍</span>
            <p className={`text-xs font-semibold ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              Good tutor
            </p>
          </>
        )}
        {stats.averageRating < 3.5 && stats.totalReviews > 0 && (
          <>
            <span className="text-lg">📈</span>
            <p className={`text-xs font-semibold ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`}>
              Room for improvement
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default TutorRatingDisplay;
