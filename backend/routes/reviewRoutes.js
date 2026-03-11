const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Tutor = require('../models/Tutor');
const { verifyToken } = require('../middleware/authMiddleware');

let io = null;
let activeUsers = null;

// Initialize Socket.IO instance and active users map
router.setIO = (socketIO) => {
  io = socketIO;
};

router.setActiveUsers = (users) => {
  activeUsers = users;
};

// ============================================
// HELPER: Update Tutor Rating Statistics
// ============================================
async function updateTutorRatingStats(tutorId, io) {
  try {
    const stats = await Review.aggregate([
      { 
        $match: { 
          tutorId: mongoose.Types.ObjectId(tutorId),
          status: 'published'
        } 
      },
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
      
      // Update tutor profile
      const updatedProfile = await Tutor.findByIdAndUpdate(
        tutorId,
        {
          rating: parseFloat(ratingData.averageRating.toFixed(2)),
          reviews: ratingData.totalReviews
        },
        { new: true }
      );

      // 📢 Emit socket event to update all connected clients
      if (io) {
        io.emit('tutor_rating_updated', {
          tutorId: tutorId.toString(),
          averageRating: parseFloat(ratingData.averageRating.toFixed(2)),
          totalReviews: ratingData.totalReviews,
          ratingBreakdown: ratingData.ratingBreakdown
        });
      }

      console.log(`✅ Updated tutor ${tutorId} rating stats: ${ratingData.averageRating.toFixed(2)}/5 (${ratingData.totalReviews} reviews)`);
      
      return updatedProfile;
    }
  } catch (error) {
    console.error('❌ Error updating tutor rating stats:', error);
  }
}

// ============================================
// POST /api/reviews/submit-review
// Submit a new review for a completed session
// ============================================
router.post('/submit-review', verifyToken, async (req, res) => {
  try {
    const { sessionId, rating, reviewText = '' } = req.body;
    const learnerId = req.userId; // From JWT

    // ✅ INPUT VALIDATION
    if (!sessionId) {
      return res.status(400).json({ 
        success: false,
        error: 'sessionId is required' 
      });
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        error: 'Rating must be a number between 1 and 5' 
      });
    }

    // ✅ FIND BOOKING
    const booking = await Booking.findById(sessionId)
      .populate('tutorId', 'name email')
      .populate('learnerId', 'name email');
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        error: 'Booking not found' 
      });
    }

    // ✅ VALIDATE BOOKING STATUS
    if (booking.status !== 'completed') {
      return res.status(403).json({ 
        success: false,
        error: `Cannot review bookings with status: ${booking.status}. Only completed bookings can be reviewed.` 
      });
    }

    // ✅ VALIDATE LEARNER IS IN THE BOOKING
    if (booking.learnerId._id.toString() !== learnerId) {
      return res.status(403).json({ 
        success: false,
        error: 'Only the learner in this booking can submit a review' 
      });
    }

    // ✅ PREVENT SELF-RATING (Security)
    if (booking.tutorId._id.toString() === learnerId) {
      return res.status(403).json({ 
        success: false,
        error: 'Tutors cannot rate themselves' 
      });
    }

    // ✅ CHECK FOR DUPLICATE REVIEW (Prevent re-submission)
    const existingReview = await Review.findOne({
      sessionId,
      learnerId
    });

    if (existingReview) {
      return res.status(409).json({ 
        success: false,
        error: 'You have already submitted a review for this session',
        existingReview: existingReview._id
      });
    }

    // ✅ CREATE REVIEW
    const review = new Review({
      sessionId,
      tutorId: booking.tutorId._id,
      learnerId,
      rating,
      reviewText: reviewText.trim().slice(0, 500) // Sanitize
    });

    await review.save();

    // ✅ UPDATE BOOKING
    booking.hasReview = true;
    booking.reviewId = review._id;
    await booking.save();

    // ✅ UPDATE TUTOR RATING STATS
    await updateTutorRatingStats(booking.tutorId._id, io);

    // ✅ EMIT SOCKET EVENT TO TUTOR (Review received notification)
    if (io && activeUsers) {
      const tutorUser = activeUsers.get(booking.tutorId._id.toString());
      if (tutorUser) {
        io.to(tutorUser.socketId).emit('review_completed', {
          reviewId: review._id,
          rating: review.rating,
          reviewText: review.reviewText,
          learnerName: booking.learnerId.name,
          sessionId: booking._id,
          subject: booking.subject,
          message: `New review received! ${review.rating}★ from ${booking.learnerId.name}`
        });
        console.log(`📬 Review notification sent to tutor ${booking.tutorId._id}`);
      }
    }

    res.json({
      success: true,
      message: 'Review submitted successfully! Thank you for your feedback.',
      review: {
        id: review._id,
        rating: review.rating,
        reviewText: review.reviewText,
        createdAt: review.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Review submission error:', error.message);

    // Handle duplicate key error (MongoDB unique constraint)
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false,
        error: 'You have already submitted a review for this session' 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to submit review' 
    });
  }
});

// ============================================
// GET /api/reviews/session/:sessionId
// Get review for a specific session (check if already reviewed)
// ============================================
router.get('/session/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    const review = await Review.findOne({
      sessionId,
      learnerId: userId
    });

    res.json({
      success: true,
      hasReview: !!review,
      review: review || null
    });

  } catch (error) {
    console.error('❌ Error fetching review:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch review' 
    });
  }
});

// ============================================
// GET /api/reviews/tutor/:tutorId/stats
// Get tutor's rating aggregated statistics
// ============================================
router.get('/tutor/:tutorId/stats', async (req, res) => {
  try {
    const { tutorId } = req.params;

    // Validate tutorId is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid tutorId' 
      });
    }

    const stats = await Review.aggregate([
      { 
        $match: { 
          tutorId: mongoose.Types.ObjectId(tutorId),
          status: 'published'
        } 
      },
      {
        $group: {
          _id: '$tutorId',
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

    const ratingData = stats[0] || {
      _id: tutorId,
      averageRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };

    res.json({
      success: true,
      tutorId,
      averageRating: parseFloat(ratingData.averageRating?.toFixed(2)) || 0,
      totalReviews: ratingData.totalReviews,
      ratingBreakdown: ratingData.ratingBreakdown
    });

  } catch (error) {
    console.error('❌ Error fetching tutor stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tutor stats' 
    });
  }
});

// ============================================
// GET /api/reviews/tutor/:tutorId/all
// Get all reviews for a tutor (paginated)
// ============================================
router.get('/tutor/:tutorId/all', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;

    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid tutorId' 
      });
    }

    const reviews = await Review.find({ 
      tutorId,
      status: 'published'
    })
      .populate('learnerId', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Review.countDocuments({ 
      tutorId,
      status: 'published'
    });

    res.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching tutor reviews:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tutor reviews' 
    });
  }
});

// ============================================
// GET /api/reviews/learner/:learnerId/all
// Get all reviews submitted by a learner
// ============================================
router.get('/learner/:learnerId/all', verifyToken, async (req, res) => {
  try {
    const { learnerId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;

    // Only learner can view their own reviews, or admin
    if (req.userId !== learnerId && req.userRole !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'You can only view your own reviews' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(learnerId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid learnerId' 
      });
    }

    const reviews = await Review.find({ learnerId })
      .populate('tutorId', 'name profilePhoto')
      .populate('sessionId', 'subject')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Review.countDocuments({ learnerId });

    res.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching learner reviews:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch your reviews' 
    });
  }
});

module.exports = router;
