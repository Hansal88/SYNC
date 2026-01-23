const express = require('express');
const User = require('../models/User');
const Tutor = require('../models/Tutor');
const { optionalVerifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Use optional token verification for tutor routes (public search, but can personalize with auth)
const verifyToken = optionalVerifyToken;

// SEARCH TUTORS - With filters (MUST BE BEFORE /:id)
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { keyword, specialization, minRating, maxPrice, sort } = req.query;

    // Build filter object
    let filter = {};

    if (keyword) {
      filter.$or = [
        { 'userId.name': { $regex: keyword, $options: 'i' } },
        { bio: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (specialization) {
      filter.specialization = { $in: [specialization] };
    }

    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }

    if (maxPrice) {
      filter.hourlyRate = { $lte: parseFloat(maxPrice) };
    }

    // Build sort object
    let sortObj = {};
    if (sort === 'rating') sortObj.rating = -1;
    if (sort === 'price') sortObj.hourlyRate = 1;
    if (sort === 'experience') sortObj.experience = -1;

    // Query
    let query = Tutor.find(filter).populate('userId', 'name email bio');

    if (Object.keys(sortObj).length > 0) {
      query = query.sort(sortObj);
    }

    const tutors = await query.limit(20);

    res.status(200).json({
      message: 'Tutors found',
      count: tutors.length,
      tutors,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching tutors', error: error.message });
  }
});

// GET SPECIALIZATIONS - For filter dropdown (MUST BE BEFORE /:id)
router.get('/specializations/all', async (req, res) => {
  try {
    const tutors = await Tutor.find({ specialization: { $exists: true, $ne: [] } });
    const specializations = new Set();
    
    tutors.forEach(tutor => {
      tutor.specialization.forEach(spec => specializations.add(spec));
    });

    res.status(200).json({
      message: 'Specializations retrieved',
      specializations: Array.from(specializations).sort(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching specializations', error: error.message });
  }
});

// GET ALL TUTORS - With pagination
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit;

    const tutors = await Tutor.find()
      .populate('userId', 'name email bio')
      .skip(skip)
      .limit(limit)
      .sort({ rating: -1 });

    const total = await Tutor.countDocuments();

    res.status(200).json({
      message: 'Tutors retrieved',
      count: tutors.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      tutors,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tutors', error: error.message });
  }
});

// GET SINGLE TUTOR PROFILE (MUST BE LAST)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id).populate('userId', 'name email bio');

    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    res.status(200).json({
      message: 'Tutor profile retrieved',
      tutor,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tutor', error: error.message });
  }
});

module.exports = router;
