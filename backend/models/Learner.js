const mongoose = require('mongoose');

const learnerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      default: '',
    },
    learningGoals: {
      type: [String], // e.g., ["Learn React", "Master JavaScript"]
      default: [],
    },
    enrolledCourses: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Course',
      default: [],
    },
    completedCourses: {
      type: Number,
      default: 0,
    },
    hoursLearned: {
      type: Number,
      default: 0,
    },
    weeklyHourGoal: {
      type: Number,
      default: 10,
    },
    currentWeekHours: {
      type: Number,
      default: 0,
    },
    skillLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    profileImage: {
      type: String,
      default: '',
    },
    badges: {
      type: [String], // e.g., ["Consistent Learner", "Quick Learner"]
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Learner = mongoose.model('Learner', learnerSchema);
module.exports = Learner;
