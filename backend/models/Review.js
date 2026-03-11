const mongoose = require('mongoose');

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
      required: [true, 'Rating is required'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number between 1 and 5'
      }
    },
    reviewText: {
      type: String,
      maxlength: [500, 'Review cannot exceed 500 characters'],
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'published', 'flagged'],
      default: 'published'
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ⚠️ CRITICAL: Prevent duplicate reviews for same session + learner
// Ensures one review per session per learner
reviewSchema.index(
  { sessionId: 1, learnerId: 1 }, 
  { 
    unique: true,
    name: 'unique_review_per_session',
    errmsg: 'A review already exists for this session by this learner'
  }
);

// Additional indexes for efficient queries
reviewSchema.index({ tutorId: 1, createdAt: -1 }, { name: 'tutor_reviews_recent' });
reviewSchema.index({ learnerId: 1, createdAt: -1 }, { name: 'learner_reviews_recent' });
reviewSchema.index({ tutorId: 1, rating: 1 }, { name: 'tutor_ratings_lookup' });

// Prevent modification of existing reviews (business rule)
reviewSchema.pre('save', async function(next) {
  if (!this.isNew) {
    return next(new Error('Reviews cannot be edited after submission'));
  }
  next();
});

// Populate tutor and learner info when fetching
reviewSchema.pre(/^find/, function(next) {
  if (this.options._recursed) {
    return next();
  }

  // Only auto-populate for explicit queries, not in aggregation
  this.populate([
    {
      path: 'tutorId',
      select: 'name email profilePhoto'
    },
    {
      path: 'learnerId',
      select: 'name email profilePhoto'
    }
  ]);

  next();
});

module.exports = mongoose.model('Review', reviewSchema);
