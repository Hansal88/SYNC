# 🎓 Tutor Rating & Review System - Complete Implementation Guide

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Backend API Endpoints](#backend-api-endpoints)
4. [React Components](#react-components)
5. [Auto-Trigger Logic](#auto-trigger-logic)
6. [Integration Points](#integration-points)
7. [Edge Cases & Security](#edge-cases--security)
8. [Implementation Steps](#implementation-steps)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    My Bookings Page                      │
│  (Tutor completes session → Session Status = COMPLETED)  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │ Socket Event Emitted   │
          │ "session_completed"    │
          └────────────┬───────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
   ┌─────────────────┐      ┌──────────────────┐
   │ Learner Hears   │      │ Tutor Updates    │
   │ Socket Event    │      │ Session Record   │
   └─────────┬───────┘      └──────────────────┘
             │
             ▼
   ┌──────────────────────┐
   │ ReviewModal Auto-Open│
   │ (Auto-Focus on Star) │
   └─────────┬────────────┘
             │
    ┌────────┴──────────────────┐
    │                           │
    ▼                           ▼
┌─────────────────┐    ┌──────────────────┐
│ Select Rating   │    │ Write Review Text│
│ (Mandatory)     │    │ (Optional)       │
└────────┬────────┘    └─────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Submit Review Button   │
        │ (Enabled after rating) │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ API POST /submit-review│
        │ Backend Validation     │
        │ - One review per sesh  │
        │ - Prevent self-rating  │
        │ - Session = COMPLETED  │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Lock UI / Show Success │
        │ Update Tutor Stats     │
        │ Emit Socket Event      │
        └────────────────────────┘
```

---

## Database Schema

### 1. **Review Model** (NEW)
```javascript
// backend/models/Review.js
const reviewSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    reviewText: {
      type: String,
      maxlength: 500,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'published', 'flagged'],
      default: 'published'
    }
  },
  { timestamps: true }
);

// Prevent duplicate reviews for same session
reviewSchema.index({ sessionId: 1, learnerId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
```

### 2. **Update Session Model**
```javascript
// In backend/models/Session.js - ADD these fields:

sessionSchema.add({
  hasReview: {
    type: Boolean,
    default: false,
    index: true
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    default: null
  }
});
```

### 3. **Update Tutor Profile Model**
```javascript
// In backend/models/TutorProfile.js - ADD these fields:

tutorProfileSchema.add({
  ratingStats: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    ratingBreakdown: {
      // For analytics
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  }
});
```

---

## Backend API Endpoints

### 1. **POST /api/reviews/submit-review**
```javascript
/**
 * Submit a new review for a completed session
 * 
 * Validation:
 * - Session must exist and status = COMPLETED
 * - Learner must be the person in the session
 * - Only one review per session (unique index)
 * - Tutor cannot rate themselves
 */

router.post('/submit-review', requireAuth, async (req, res) => {
  try {
    const { sessionId, rating, reviewText = '' } = req.body;
    const learnerId = req.userId; // From JWT

    // Validate input
    if (!sessionId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Invalid rating or sessionId' 
      });
    }

    // Find session
    const session = await Session.findById(sessionId)
      .populate('tutorId')
      .populate('learnerId');
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Validate session state
    if (session.status !== 'COMPLETED') {
      return res.status(403).json({ 
        error: 'Can only review completed sessions' 
      });
    }

    // Validate learner is the one in the session
    if (session.learnerId._id.toString() !== learnerId) {
      return res.status(403).json({ 
        error: 'Only the learner can review this session' 
      });
    }

    // Prevent self-rating
    if (session.tutorId._id.toString() === learnerId) {
      return res.status(403).json({ 
        error: 'Tutors cannot rate themselves' 
      });
    }

    // Check if review already exists (duplicate prevention)
    const existingReview = await Review.findOne({
      sessionId,
      learnerId
    });

    if (existingReview) {
      return res.status(409).json({ 
        error: 'Review already submitted for this session' 
      });
    }

    // Create review
    const review = new Review({
      sessionId,
      tutorId: session.tutorId._id,
      learnerId,
      rating,
      reviewText: reviewText.trim().slice(0, 500) // Sanitize
    });

    await review.save();

    // Update session
    session.hasReview = true;
    session.reviewId = review._id;
    await session.save();

    // Update tutor stats (recalculate)
    await updateTutorRatingStats(session.tutorId._id);

    // Emit socket event to tutor
    io.to(`tutor_${session.tutorId._id}`).emit('review_received', {
      reviewId: review._id,
      rating: review.rating,
      reviewText: review.reviewText,
      learnerName: session.learnerId.name
    });

    res.json({
      success: true,
      message: 'Review submitted successfully',
      review: {
        id: review._id,
        rating: review.rating,
        createdAt: review.createdAt
      }
    });

  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});
```

### 2. **GET /api/reviews/session/:sessionId**
```javascript
/**
 * Get review for a specific session (if exists)
 * Used to check if learner already reviewed
 */

router.get('/session/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    const review = await Review.findOne({
      sessionId,
      learnerId: userId
    });

    res.json({
      hasReview: !!review,
      review: review || null
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});
```

### 3. **GET /api/reviews/tutor/:tutorId/stats**
```javascript
/**
 * Get tutor's rating aggregated statistics
 * Used in tutor profiles and listing
 */

router.get('/tutor/:tutorId/stats', async (req, res) => {
  try {
    const { tutorId } = req.params;

    const stats = await Review.aggregate([
      { $match: { tutorId: mongoose.Types.ObjectId(tutorId) } },
      {
        $group: {
          _id: '$tutorId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingBreakdown: {
            5: {
              $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
            },
            4: {
              $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
            },
            3: {
              $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] }
            },
            2: {
              $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] }
            },
            1: {
              $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }
            }
          }
        }
      }
    ]);

    const ratingData = stats[0] || {
      averageRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };

    res.json(ratingData);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tutor stats' });
  }
});
```

### 4. **GET /api/reviews/tutor/:tutorId/all**
```javascript
/**
 * Get all reviews for a tutor (paginated)
 * For tutor profile reviews list
 */

router.get('/tutor/:tutorId/all', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const reviews = await Review.find({ tutorId })
      .populate('learnerId', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ tutorId });

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});
```

### 5. **Helper: Update Tutor Rating Stats**
```javascript
/**
 * Recalculate tutor's average rating and stats
 * Called after each new review
 */

async function updateTutorRatingStats(tutorId) {
  try {
    const stats = await Review.aggregate([
      { $match: { tutorId: mongoose.Types.ObjectId(tutorId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingBreakdown: {
            5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
          }
        }
      }
    ]);

    if (stats.length > 0) {
      const ratingData = stats[0];
      
      await TutorProfile.findByIdAndUpdate(
        tutorId,
        {
          'ratingStats.averageRating': parseFloat(ratingData.averageRating.toFixed(2)),
          'ratingStats.totalReviews': ratingData.totalReviews,
          'ratingStats.ratingBreakdown': ratingData.ratingBreakdown
        }
      );

      // Emit update to connected clients
      io.emit('tutor_rating_updated', {
        tutorId,
        averageRating: ratingData.averageRating,
        totalReviews: ratingData.totalReviews
      });
    }
  } catch (error) {
    console.error('Error updating tutor rating stats:', error);
  }
}

module.exports = { updateTutorRatingStats };
```

---

## React Components

### 1. **ReviewModal.jsx** (Auto-Opening Modal)
```javascript
// frontend/src/components/ReviewModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import reviewService from '../services/reviewService';

const ReviewModal = ({ 
  session, 
  onClose, 
  onSubmitSuccess,
  isOpen = false 
}) => {
  const { isDarkMode } = useTheme();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const firstStarRef = useRef(null);

  // Auto-focus on first star when modal opens
  useEffect(() => {
    if (isOpen && firstStarRef.current) {
      firstStarRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating) {
      setError('Please select a rating before submitting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await reviewService.submitReview({
        sessionId: session._id,
        rating,
        reviewText
      });

      setSubmitted(true);
      
      // Show success state for 2 seconds, then close
      setTimeout(() => {
        onSubmitSuccess?.();
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.message || 'Failed to submit review');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${
        isDarkMode 
          ? 'bg-slate-900 border border-slate-700' 
          : 'bg-white border border-slate-200'
      } rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            ⭐ Rate Your Session
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-slate-800 text-slate-400' 
                : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {submitted ? (
            // Success State
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✨</div>
              <h3 className={`text-xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Thank you for your feedback!
              </h3>
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Your review helps improve our tutoring quality.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Tutor Info */}
              <div className="flex items-center gap-4">
                <img 
                  src={session.tutorId?.profilePhoto || '👨‍🏫'} 
                  alt="tutor"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {session.tutorId?.name}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {session.subject}
                  </p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="space-y-3">
                <label className={`text-sm font-semibold ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  How was your experience? *
                </label>
                <div className="flex gap-3 justify-center py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      ref={star === 1 ? firstStarRef : null}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowRight' && star < 5) {
                          setRating(star + 1);
                        } else if (e.key === 'ArrowLeft' && star > 1) {
                          setRating(star - 1);
                        }
                      }}
                      className="focus:outline-none transition-transform hover:scale-125"
                    >
                      <Star
                        size={40}
                        className={`transition-all ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : isDarkMode
                            ? 'text-slate-600'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className={`text-center text-sm font-semibold ${
                    rating >= 4 
                      ? 'text-green-500' 
                      : rating >= 3 
                      ? 'text-yellow-500' 
                      : 'text-red-500'
                  }`}>
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                  </p>
                )}
              </div>

              {/* Review Text */}
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Share your feedback (optional)
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
                  placeholder="What did you think of this session? What could be improved?"
                  className={`w-full p-4 rounded-lg border-2 transition-colors resize-none focus:outline-none ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'
                  }`}
                  rows={4}
                />
                <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {reviewText.length}/500 characters
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!rating || isSubmitting}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  !rating || isSubmitting
                    ? `${isDarkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-200 text-slate-400'} cursor-not-allowed`
                    : `${
                        isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
```

### 2. **StarRating.jsx** (Reusable Component)
```javascript
// frontend/src/components/StarRating.jsx
import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
    if (interactive) onRatingChange?.(star);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className={`transition-transform ${interactive ? 'hover:scale-125 cursor-pointer' : 'cursor-default'}`}
            disabled={!interactive}
          >
            <Star
              size={size}
              className={`transition-all ${
                star <= (hoverRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : isDarkMode
                  ? 'text-slate-600'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
      {showLabel && rating > 0 && (
        <p className={`text-sm font-semibold ${
          rating >= 4 
            ? 'text-green-500' 
            : rating >= 3 
            ? 'text-yellow-500' 
            : 'text-red-500'
        }`}>
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
        </p>
      )}
    </div>
  );
};

export default StarRating;
```

### 3. **TutorRatingDisplay.jsx** (For Tutor Profiles)
```javascript
// frontend/src/components/TutorRatingDisplay.jsx
import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import reviewService from '../services/reviewService';

const TutorRatingDisplay = ({ tutorId }) => {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await reviewService.getTutorStats(tutorId);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch tutor stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [tutorId]);

  if (loading) {
    return <div>Loading ratings...</div>;
  }

  if (!stats) {
    return (
      <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
        No ratings yet
      </p>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode
        ? 'bg-slate-800 border-slate-700'
        : 'bg-blue-50 border-blue-200'
    }`}>
      
      {/* Main Rating */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">
              {stats.averageRating?.toFixed(1) || 'N/A'}
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={`${
                    star <= Math.round(stats.averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : isDarkMode
                      ? 'text-slate-600'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.ratingBreakdown?.[star] || 0;
          const percentage = stats.totalReviews > 0 
            ? (count / stats.totalReviews) * 100 
            : 0;

          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs font-semibold w-12">{star}⭐</span>
              <div className={`flex-1 h-2 rounded-full ${
                isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
              }`}>
                <div
                  className="h-full rounded-full bg-yellow-400 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TutorRatingDisplay;
```

### 4. **CompletedSessionCard.jsx** (With Review Status)
```javascript
// frontend/src/components/CompletedSessionCard.jsx
import React, { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ReviewModal from './ReviewModal';

const CompletedSessionCard = ({ session, onReviewSubmitted }) => {
  const { isDarkMode } = useTheme();
  const [showReviewModal, setShowReviewModal] = useState(false);

  return (
    <>
      <div className={`p-4 rounded-lg border-2 transition-all ${
        isDarkMode
          ? 'bg-slate-800 border-slate-700 hover:border-blue-600'
          : 'bg-white border-slate-200 hover:border-blue-400'
      }`}>
        
        {/* Session Details */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {session.subject}
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              with {session.tutorId?.name}
            </p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
            ✓ Completed
          </span>
        </div>

        {/* Review Status */}
        {session.hasReview ? (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
          }`}>
            <Star size={16} className="fill-current" />
            <span className="text-sm font-semibold">You've reviewed this session</span>
          </div>
        ) : (
          <button
            onClick={() => setShowReviewModal(true)}
            className={`w-full py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <MessageSquare size={16} />
            Leave a Review
          </button>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        session={session}
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmitSuccess={() => onReviewSubmitted?.()}
      />
    </>
  );
};

export default CompletedSessionCard;
```

---

## Auto-Trigger Logic

### Socket Service - Add Review Events
```javascript
// frontend/src/services/socketService.js - ADD THESE

export const onSessionCompleted = (callback) => {
  getSocket().on('session_completed', callback);
};

export const offSessionCompleted = () => {
  getSocket().off('session_completed');
};

export const onReviewRequested = (callback) => {
  getSocket().on('review_requested', callback);
};

export const offReviewRequested = () => {
  getSocket().off('review_requested');
};
```

### Review Service
```javascript
// frontend/src/services/reviewService.js (NEW)
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/reviews';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
};

const reviewService = {
  submitReview: async (data) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/submit-review`,
        data,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getSessionReview: async (sessionId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/session/${sessionId}`,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getTutorStats: async (tutorId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tutor/${tutorId}/stats`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getTutorReviews: async (tutorId, page = 1) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tutor/${tutorId}/all?page=${page}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default reviewService;
```

### Hook for Auto-Trigger
```javascript
// frontend/src/hooks/useSessionReviewTrigger.js (NEW)
import { useEffect, useState } from 'react';
import {
  onSessionCompleted,
  offSessionCompleted,
  onReviewRequested,
  offReviewRequested
} from '../services/socketService';

export const useSessionReviewTrigger = () => {
  const [pendingReviewSession, setPendingReviewSession] = useState(null);

  useEffect(() => {
    // Listen for session completion
    onSessionCompleted((data) => {
      console.log('📢 Session completed, review requested:', data);
      // Auto-open review modal
      setPendingReviewSession(data.session);
    });

    // Listen for review request (if tutor sends signal)
    onReviewRequested((data) => {
      console.log('📢 Tutor requested review:', data);
      setPendingReviewSession(data.session);
    });

    return () => {
      offSessionCompleted();
      offReviewRequested();
    };
  }, []);

  const clearPendingReview = () => {
    setPendingReviewSession(null);
  };

  return {
    pendingReviewSession,
    clearPendingReview
  };
};
```

---

## Integration Points

### In My Bookings Component
```javascript
// frontend/src/pages/MyBookings.jsx - UPDATE THIS

import ReviewModal from '../components/ReviewModal';
import { useSessionReviewTrigger } from '../hooks/useSessionReviewTrigger';

const MyBookings = () => {
  const { pendingReviewSession, clearPendingReview } = useSessionReviewTrigger();
  const [sessions, setSessions] = useState([]);

  // ... existing code ...

  const handleSessionCompleted = async (sessionId) => {
    try {
      // Your existing completion logic
      await bookingService.completeSession(sessionId);
      
      // This will trigger socket event from backend
      // which will auto-open the review modal
      
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      {/* Existing bookings list */}
      <div className="space-y-4">
        {sessions.map(session => (
          <SessionCard 
            key={session._id} 
            session={session}
            onComplete={() => handleSessionCompleted(session._id)}
          />
        ))}
      </div>

      {/* Auto-trigger review modal */}
      <ReviewModal
        session={pendingReviewSession}
        isOpen={!!pendingReviewSession}
        onClose={clearPendingReview}
        onSubmitSuccess={() => {
          clearPendingReview();
          // Refresh sessions list
          fetchSessions();
        }}
      />
    </div>
  );
};

export default MyBookings;
```

### Backend - Emit Socket Event on Session Completion
```javascript
// backend/routes/bookingRoutes.js or sessionRoutes.js - UPDATE

router.post('/session/:sessionId/complete', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const tutorId = req.userId;

    const session = await Session.findByIdAndUpdate(
      sessionId,
      { status: 'COMPLETED', endTime: new Date() },
      { new: true }
    ).populate(['tutorId', 'learnerId']);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 🔴 CRITICAL: Emit socket event to trigger review modal
    io.to(`learner_${session.learnerId._id}`).emit('session_completed', {
      session,
      message: 'Please rate your tutor for this session'
    });

    // Also notify tutor
    io.to(`tutor_${tutorId}`).emit('session_marked_complete', {
      sessionId,
      learnerId: session.learnerId._id
    });

    res.json({
      success: true,
      message: 'Session marked as completed',
      session
    });

  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});
```

---

## Edge Cases & Security

### 1. **Page Refresh After Submission**
```javascript
// In ReviewModal.jsx - check if already reviewed before showing

useEffect(() => {
  const checkExistingReview = async () => {
    if (isOpen && session?._id) {
      try {
        const { hasReview } = await reviewService.getSessionReview(session._id);
        if (hasReview) {
          setSubmitted(true);
          setTimeout(() => onClose(), 1000);
        }
      } catch (error) {
        console.error('Error checking review status:', error);
      }
    }
  };

  checkExistingReview();
}, [isOpen, session]);
```

### 2. **Prevent Self-Ratings**
```javascript
// Backend validation (already in submit-review endpoint)
if (session.tutorId._id.toString() === learnerId) {
  return res.status(403).json({ 
    error: 'Tutors cannot rate themselves' 
  });
}
```

### 3. **Network Failure Handling**
```javascript
// In ReviewModal.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError('');

  try {
    await reviewService.submitReview({
      sessionId: session._id,
      rating,
      reviewText
    });
    setSubmitted(true);
    // ... success flow
  } catch (err) {
    setError(err.message || 'Failed to submit review. Please try again.');
    setIsSubmitting(false); // Allow retry
  }
};
```

### 4. **Duplicate Prevention (Database Level)**
```javascript
// Already handled by unique index in Review schema:
reviewSchema.index({ sessionId: 1, learnerId: 1 }, { unique: true });
```

### 5. **Session Status Validation**
```javascript
// Backend checks session status before allowing review
if (session.status !== 'COMPLETED') {
  return res.status(403).json({ 
    error: 'Can only review completed sessions' 
  });
}
```

---

## Implementation Steps

### Phase 1: Backend Setup
1. [ ] Create Review model (`backend/models/Review.js`)
2. [ ] Update Session model to add `hasReview` and `reviewId`
3. [ ] Update TutorProfile model to add `ratingStats`
4. [ ] Create review routes in `backend/routes/reviewRoutes.js`
5. [ ] Add socket event emission on session completion
6. [ ] Test API endpoints with Postman

### Phase 2: Frontend Components
1. [ ] Create `ReviewModal.jsx`
2. [ ] Create `StarRating.jsx`
3. [ ] Create `TutorRatingDisplay.jsx`
4. [ ] Create `reviewService.js`
5. [ ] Create `useSessionReviewTrigger.js` hook

### Phase 3: Integration
1. [ ] Add socket event listeners to `socketService.js`
2. [ ] Integrate ReviewModal into `MyBookings.jsx`
3. [ ] Add review display to tutor profile page
4. [ ] Add rating stats to tutor listing/search

### Phase 4: Testing
1. [ ] Test single review submission per session
2. [ ] Test page refresh after submission
3. [ ] Test auto-open on session completion
4. [ ] Test tutor rating aggregation
5. [ ] Test network failure handling
6. [ ] Test mobile responsiveness
7. [ ] Test theme (light/dark) compatibility

---

## Database Indexes
```javascript
// backend/models/Review.js - ensure these indexes exist

reviewSchema.index({ sessionId: 1, learnerId: 1 }, { unique: true });
reviewSchema.index({ tutorId: 1, createdAt: -1 }); // For tutor's review list
reviewSchema.index({ learnerId: 1, createdAt: -1 }); // For learner's review history
```

---

## Socket Events Summary

| Event | Emitted By | Received By | Payload |
|-------|-----------|------------|---------|
| `session_completed` | Backend | Learner | `{ session, message }` |
| `review_requested` | Backend | Learner | `{ session }` |
| `review_received` | Backend | Tutor | `{ reviewId, rating, reviewText, learnerName }` |
| `tutor_rating_updated` | Backend | All | `{ tutorId, averageRating, totalReviews }` |

---

## Testing Checklist

- [ ] Submit review for completed session
- [ ] Prevent duplicate review for same session
- [ ] Page refresh after submission → review locked
- [ ] Cannot rate non-completed sessions
- [ ] Cannot rate self
- [ ] Tutor stats update on new review
- [ ] Modal auto-opens on session completion
- [ ] Works in light and dark mode
- [ ] Mobile responsive
- [ ] Network error handling

---

This is a production-grade implementation ready for your hackathon! 🚀
