import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Reusable Star Rating Component
 * @param {number} rating - Current rating (0-5)
 * @param {function} onRatingChange - Callback when rating changes
 * @param {number} size - Icon size in pixels (default: 24)
 * @param {boolean} interactive - Whether user can click to change (default: true)
 * @param {boolean} showLabel - Show text label like "Good" (default: true)
 */
const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  size = 24,
  interactive = true,
  showLabel = true
}) => {
  const { isDarkMode } = useTheme();
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (star) => {
    if (interactive) {
      onRatingChange?.(star);
    }
  };

  const handleKeyDown = (e, star) => {
    if (!interactive) return;
    
    // Arrow keys to change rating
    if (e.key === 'ArrowRight' && star < 5) {
      onRatingChange?.(star + 1);
    } else if (e.key === 'ArrowLeft' && star > 1) {
      onRatingChange?.(star - 1);
    } else if (e.key === 'Enter') {
      onRatingChange?.(star);
    }
  };

  const getRatingLabel = (value) => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
    return labels[value] || '';
  };

  const getRatingColor = (value) => {
    if (value <= 2) return 'text-red-500';
    if (value === 3) return 'text-yellow-500';
    if (value >= 4) return 'text-green-500';
    return '';
  };

  return (
    <div className="space-y-3">
      {/* Star Rating Container */}
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onKeyDown={(e) => handleKeyDown(e, star)}
            className={`transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 ${
              interactive 
                ? 'hover:scale-125 cursor-pointer active:scale-95' 
                : 'cursor-default'
            }`}
            disabled={!interactive}
            aria-label={`Rate ${star} stars`}
            tabIndex={interactive ? 0 : -1}
          >
            <Star
              size={size}
              className={`transition-all duration-100 ${
                star <= (hoverRating || rating)
                  ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg'
                  : isDarkMode
                  ? 'text-slate-600'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Rating Label */}
      {showLabel && rating > 0 && (
        <p className={`text-center text-sm font-semibold transition-colors ${getRatingColor(rating)}`}>
          {getRatingLabel(rating)}
        </p>
      )}

      {/* Helper Text */}
      {interactive && (
        <p className={`text-center text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          Use arrow keys to select • Enter to confirm
        </p>
      )}
    </div>
  );
};

export default StarRating;
