const mongoose = require('mongoose');

const StudyFileSchema = new mongoose.Schema(
  {
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyFolder',
      required: [true, 'File must belong to a folder'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'File must be uploaded by someone'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    fileType: {
      type: String,
      enum: ['video', 'ppt', 'note'],
      required: [true, 'File type must be: video, ppt, or note'],
      lowercase: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    mimeType: {
      type: String,
      default: null,
    },
    visibleToLearners: {
      type: Boolean,
      default: true,
    },
    duration: {
      // For videos: duration in seconds
      type: Number,
      default: null,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    views: {
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
StudyFileSchema.index({ folderId: 1, visibleToLearners: 1 });
StudyFileSchema.index({ uploadedBy: 1 });
StudyFileSchema.index({ fileType: 1 });
StudyFileSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StudyFile', StudyFileSchema);
