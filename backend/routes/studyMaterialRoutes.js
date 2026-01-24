const express = require('express');
const router = express.Router();
const {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  uploadFile,
  getFilesByFolder,
  deleteFile,
  incrementView,
} = require('../controllers/studyMaterialController');
const { requireTutor, verifyStudyMaterial } = require('../middleware/studyMaterialAuth');
const { upload } = require('../middleware/studyMaterialUpload');

/**
 * FOLDER ROUTES
 */

// Create folder (Tutor only)
router.post('/folders', requireTutor, createFolder);

// Get all folders (Tutor sees own, Learner sees public)
router.get('/folders', verifyStudyMaterial, getFolders);

// Get folder by ID
router.get('/folders/:folderId', verifyStudyMaterial, getFolderById);

// Update folder (Tutor/owner only)
router.put('/folders/:folderId', requireTutor, updateFolder);

// Delete folder (Tutor/owner only)
router.delete('/folders/:folderId', requireTutor, deleteFolder);

/**
 * FILE ROUTES
 */

// Upload file (Tutor only)
router.post('/files/upload', requireTutor, upload, uploadFile);

// Get files by folder
router.get('/files/:folderId', verifyStudyMaterial, getFilesByFolder);

// Delete file (Tutor/uploader only)
router.delete('/files/:fileId', requireTutor, deleteFile);

// Increment file views (for analytics)
router.post('/files/:fileId/view', verifyStudyMaterial, incrementView);

module.exports = router;
