const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema(
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
    specialization: {
      type: [String], // e.g., ["React", "JavaScript", "Web Development"]
      default: [],
    },
    experience: {
      type: Number, // years of experience
      default: 0,
    },
    hourlyRate: {
      type: Number,
      default: 0,
    },
    students: {
      type: Number,
      default: 0,
    },
    completedSessions: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    availability: {
      type: [String], // e.g., ["Monday", "Tuesday", "Wednesday"]
      default: [],
    },
    certificates: {
      type: [String], // URLs or names of certificates
      default: [],
    },
    profileImage: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Tutor = mongoose.model('Tutor', tutorSchema);
module.exports = Tutor;
