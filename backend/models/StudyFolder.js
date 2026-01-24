const mongoose = require('mongoose');

const StudyFolderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Folder title is required'],
      trim: true,
      maxlength: [100, 'Folder title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Folder must be created by a tutor'],
    },
    courseId: {
      type: String,
      trim: true,
      default: null,
    },
    icon: {
      type: String,
      default: '📁', // Default folder emoji
    },
    isPublic: {
      type: Boolean,
      default: true, // Visible to all learners
    },
    fileCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for quick lookups
StudyFolderSchema.index({ createdBy: 1, isPublic: 1 });
StudyFolderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StudyFolder', StudyFolderSchema);
