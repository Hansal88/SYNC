const express = require('express');
const User = require('../models/User');
const Tutor = require('../models/Tutor');
const Learner = require('../models/Learner');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Import io instance from server
let io = null;
let activeUsers = null;

exports.setIO = (ioInstance) => {
  io = ioInstance;
};

exports.setActiveUsers = (activeUsersMap) => {
  activeUsers = activeUsersMap;
};

// GET USER PROFILE - Get current user details
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'Profile retrieved',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// GET TUTOR PROFILE
router.get('/tutor/profile', verifyToken, async (req, res) => {
  try {
    let tutor = await Tutor.findOne({ userId: req.userId }).populate('userId', 'name email bio');
    
    // If no tutor profile exists, create one
    if (!tutor) {
      const user = await User.findById(req.userId);
      tutor = new Tutor({
        userId: req.userId,
        bio: user.bio || '',
      });
      await tutor.save();
      tutor = await tutor.populate('userId', 'name email bio');
    }

    res.status(200).json({
      message: 'Tutor profile retrieved',
      tutor,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tutor profile', error: error.message });
  }
});

// UPDATE TUTOR PROFILE
router.put('/tutor/profile', verifyToken, async (req, res) => {
  try {
    const { bio, specialization, experience, hourlyRate, availability, certificates, profileImage, isAvailable, subject } = req.body;

    let tutor = await Tutor.findOne({ userId: req.userId });

    if (!tutor) {
      tutor = new Tutor({
        userId: req.userId,
      });
    }

    const wasAvailableBefore = tutor.isAvailable;

    if (bio) tutor.bio = bio;
    if (specialization) tutor.specialization = specialization;
    if (experience) tutor.experience = experience;
    if (hourlyRate) tutor.hourlyRate = hourlyRate;
    if (availability) tutor.availability = availability;
    if (certificates) tutor.certificates = certificates;
    if (profileImage) tutor.profileImage = profileImage;
    if (isAvailable !== undefined) tutor.isAvailable = isAvailable;
    if (subject) tutor.subject = subject;

    await tutor.save();

    // Populate user info for response and notifications
    await tutor.populate('userId', 'name email');

    // ===== TUTOR AVAILABILITY NOTIFICATION =====
    // Emit availability change notification if isAvailable was updated
    if (isAvailable !== undefined && isAvailable !== wasAvailableBefore && io) {
      io.emit('tutor_availability_changed', {
        tutorName: tutor.userId.name || tutor.userId.email,
        tutorId: tutor.userId._id.toString(),
        isAvailable: tutor.isAvailable,
        subject: tutor.subject || 'General'
      });
      console.log(`👨‍🏫 Tutor availability changed: ${tutor.userId.name} - ${tutor.isAvailable ? 'Available' : 'Unavailable'}`);
    }

    res.status(200).json({
      message: 'Tutor profile updated',
      tutor,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating tutor profile', error: error.message });
  }
});

// GET LEARNER PROFILE
router.get('/learner/profile', verifyToken, async (req, res) => {
  try {
    let learner = await Learner.findOne({ userId: req.userId }).populate('userId', 'name email bio');

    // If no learner profile exists, create one
    if (!learner) {
      const user = await User.findById(req.userId);
      learner = new Learner({
        userId: req.userId,
        bio: user.bio || '',
      });
      await learner.save();
      learner = await learner.populate('userId', 'name email bio');
    }

    res.status(200).json({
      message: 'Learner profile retrieved',
      learner,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching learner profile', error: error.message });
  }
});

// UPDATE LEARNER PROFILE
router.put('/learner/profile', verifyToken, async (req, res) => {
  try {
    const { bio, learningGoals, skillLevel, weeklyHourGoal, profileImage } = req.body;

    let learner = await Learner.findOne({ userId: req.userId });

    if (!learner) {
      learner = new Learner({
        userId: req.userId,
      });
    }

    if (bio) learner.bio = bio;
    if (learningGoals) learner.learningGoals = learningGoals;
    if (skillLevel) learner.skillLevel = skillLevel;
    if (weeklyHourGoal) learner.weeklyHourGoal = weeklyHourGoal;
    if (profileImage) learner.profileImage = profileImage;

    await learner.save();

    res.status(200).json({
      message: 'Learner profile updated',
      learner,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating learner profile', error: error.message });
  }
});

// LOGOUT - Just for frontend reference (token is deleted on frontend)
router.post('/logout', verifyToken, (req, res) => {
  res.status(200).json({
    message: 'Logout successful',
  });
});

module.exports = router;
module.exports.setIO = exports.setIO;
module.exports.setActiveUsers = exports.setActiveUsers;
