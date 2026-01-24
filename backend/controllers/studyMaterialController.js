const StudyFolder = require('../models/StudyFolder');
const StudyFile = require('../models/StudyFile');
const path = require('path');
const fs = require('fs');
const { getFileTypeFromMimeOrExt } = require('../middleware/studyMaterialUpload');

/**
 * CREATE FOLDER
 * POST /api/study-material/folders
 * Tutor only
 */
exports.createFolder = async (req, res) => {
  try {
    const { title, description, courseId, icon } = req.body;
    const tutorId = req.userId;

    // Validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Folder title is required' });
    }

    const folder = new StudyFolder({
      title: title.trim(),
      description: description?.trim() || '',
      createdBy: tutorId,
      courseId: courseId || null,
      icon: icon || '📁',
    });

    const savedFolder = await folder.save();

    console.log(`✅ Folder created: ${title} by tutor ${tutorId}`);

    res.status(201).json({
      message: 'Folder created successfully',
      data: savedFolder,
    });
  } catch (error) {
    console.error('❌ Folder creation error:', error.message);
    res.status(500).json({
      message: 'Error creating folder',
      error: error.message,
    });
  }
};

/**
 * GET ALL FOLDERS
 * GET /api/study-material/folders
 * Tutor sees their own, Learner sees all public folders
 */
exports.getFolders = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    let query = {};

    if (userRole === 'tutor') {
      // Tutors see only their own folders
      query.createdBy = userId;
    } else if (userRole === 'learner') {
      // Learners see all public folders
      query.isPublic = true;
    }

    const folders = await StudyFolder.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Folders retrieved successfully',
      count: folders.length,
      data: folders,
    });
  } catch (error) {
    console.error('❌ Folder retrieval error:', error.message);
    res.status(500).json({
      message: 'Error retrieving folders',
      error: error.message,
    });
  }
};

/**
 * GET FOLDER BY ID
 * GET /api/study-material/folders/:folderId
 */
exports.getFolderById = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const folder = await StudyFolder.findById(folderId).populate('createdBy', 'name email');

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Authorization check
    if (userRole === 'tutor' && folder.createdBy._id.toString() !== userId) {
      // Tutors can only see their own folders
      return res.status(403).json({ message: 'Access denied' });
    }

    if (userRole === 'learner' && !folder.isPublic) {
      return res.status(403).json({ message: 'This folder is not accessible' });
    }

    res.status(200).json({
      message: 'Folder retrieved',
      data: folder,
    });
  } catch (error) {
    console.error('❌ Folder fetch error:', error.message);
    res.status(500).json({
      message: 'Error fetching folder',
      error: error.message,
    });
  }
};

/**
 * UPDATE FOLDER
 * PUT /api/study-material/folders/:folderId
 * Tutor only (owner only)
 */
exports.updateFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { title, description, courseId, icon, isPublic } = req.body;
    const userId = req.userId;

    const folder = await StudyFolder.findById(folderId);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Authorization: Only owner can update
    if (folder.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'You can only update your own folders' });
    }

    // Update fields
    if (title) folder.title = title.trim();
    if (description) folder.description = description.trim();
    if (courseId) folder.courseId = courseId;
    if (icon) folder.icon = icon;
    if (typeof isPublic === 'boolean') folder.isPublic = isPublic;

    const updatedFolder = await folder.save();

    console.log(`✅ Folder updated: ${folderId}`);

    res.status(200).json({
      message: 'Folder updated successfully',
      data: updatedFolder,
    });
  } catch (error) {
    console.error('❌ Folder update error:', error.message);
    res.status(500).json({
      message: 'Error updating folder',
      error: error.message,
    });
  }
};

/**
 * DELETE FOLDER
 * DELETE /api/study-material/folders/:folderId
 * Tutor only (owner only)
 */
exports.deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.userId;

    const folder = await StudyFolder.findById(folderId);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Authorization: Only owner can delete
    const folderId_str = folder.createdBy.toString();
    const userId_str = userId.toString();
    
    console.log(`🔐 Delete Auth Check - Folder owner: ${folderId_str}, Current user: ${userId_str}`);
    
    if (folderId_str !== userId_str) {
      console.log(`❌ Delete Denied - User ${userId_str} is not the owner of folder created by ${folderId_str}`);
      return res.status(403).json({ message: 'You can only delete your own folders' });
    }

    console.log(`✅ Delete Auth passed - User is folder owner`);

    // Delete all files in folder
    const files = await StudyFile.find({ folderId });
    console.log(`🗑️ Deleting ${files.length} files from folder`);
    
    for (const file of files) {
      const filePath = file.fileUrl.replace('/api/uploads/study-material/', 
        path.join(__dirname, '../uploads/study-material/'));
      
      // Try to delete physical file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`✅ Deleted physical file: ${filePath}`);
        }
      } catch (err) {
        console.warn(`⚠️ Warning: Could not delete file ${filePath}`, err.message);
      }
    }

    // Delete all StudyFiles
    await StudyFile.deleteMany({ folderId });

    // Delete folder
    await StudyFolder.findByIdAndDelete(folderId);

    console.log(`✅ Folder deleted: ${folderId} with all files`);

    res.status(200).json({
      message: 'Folder and all its files deleted successfully',
    });
  } catch (error) {
    console.error('❌ Folder deletion error:', error.message);
    res.status(500).json({
      message: 'Error deleting folder',
      error: error.message,
    });
  }
};

/**
 * UPLOAD FILE TO FOLDER
 * POST /api/study-material/files/upload
 * Tutor only
 */
exports.uploadFile = async (req, res) => {
  try {
    const { folderId } = req.body;
    const userId = req.userId;

    // Validation
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    if (!folderId) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Folder ID is required' });
    }

    // Check if folder exists and belongs to tutor
    const folder = await StudyFolder.findById(folderId);

    if (!folder) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Folder not found' });
    }

    if (folder.createdBy.toString() !== userId) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'You can only upload to your own folders' });
    }

    // Determine file type
    const fileType = getFileTypeFromMimeOrExt(req.file.mimetype, req.file.originalname);

    if (!fileType) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: 'Invalid file type. Allowed: video (mp4, mkv), ppt (ppt, pptx), note (pdf, doc, docx)',
      });
    }

    // Create file record
    const fileUrl = `/api/uploads/study-material/${fileType}s/${req.file.filename}`;

    const studyFile = new StudyFile({
      folderId,
      uploadedBy: userId,
      fileName: req.file.originalname,
      fileType,
      fileSize: req.file.size,
      fileUrl,
      mimeType: req.file.mimetype,
      visibleToLearners: true,
    });

    const savedFile = await studyFile.save();

    // Increment folder file count
    folder.fileCount = (folder.fileCount || 0) + 1;
    await folder.save();

    console.log(`✅ File uploaded: ${req.file.originalname} (${fileType})`);

    res.status(201).json({
      message: 'File uploaded successfully',
      data: {
        fileId: savedFile._id,
        fileName: savedFile.fileName,
        fileType: savedFile.fileType,
        fileUrl: savedFile.fileUrl,
        fileSize: savedFile.fileSize,
      },
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('❌ File upload error:', error.message);
    res.status(500).json({
      message: 'Error uploading file',
      error: error.message,
    });
  }
};

/**
 * GET FILES BY FOLDER
 * GET /api/study-material/files/:folderId
 */
exports.getFilesByFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    // Check folder access
    const folder = await StudyFolder.findById(folderId);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Authorization check
    if (userRole === 'tutor' && folder.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (userRole === 'learner' && !folder.isPublic) {
      return res.status(403).json({ message: 'This folder is not accessible' });
    }

    // Get files
    let query = { folderId };

    if (userRole === 'learner') {
      query.visibleToLearners = true;
    }

    const files = await StudyFile.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Files retrieved successfully',
      count: files.length,
      data: files,
    });
  } catch (error) {
    console.error('❌ Files retrieval error:', error.message);
    res.status(500).json({
      message: 'Error retrieving files',
      error: error.message,
    });
  }
};

/**
 * DELETE FILE
 * DELETE /api/study-material/files/:fileId
 * Tutor only (uploader only)
 */
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const file = await StudyFile.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Authorization: Only uploader (tutor) can delete
    const fileUploaderId_str = file.uploadedBy.toString();
    const userId_str = userId.toString();
    
    console.log(`🔐 Delete File Auth - File uploader: ${fileUploaderId_str}, Current user: ${userId_str}, Role: ${userRole}`);
    
    if (fileUploaderId_str !== userId_str) {
      console.log(`❌ Delete Denied - User ${userId_str} is not the uploader of file ${fileId}`);
      return res.status(403).json({ message: 'You can only delete your own files' });
    }

    console.log(`✅ File Delete Auth passed - User is file uploader`);

    // Delete physical file
    try {
      const filePath = file.fileUrl.replace('/api/uploads/study-material/', 
        path.join(__dirname, '../uploads/study-material/'));
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Deleted physical file: ${filePath}`);
      }
    } catch (err) {
      console.warn(`⚠️ Warning: Could not delete physical file`, err.message);
    }

    // Decrement folder file count
    const folder = await StudyFolder.findById(file.folderId);
    if (folder && folder.fileCount > 0) {
      folder.fileCount -= 1;
      await folder.save();
      console.log(`📊 Updated folder fileCount: ${folder.fileCount}`);
    }

    // Delete database record
    await StudyFile.findByIdAndDelete(fileId);

    console.log(`✅ File deleted: ${fileId}`);

    res.status(200).json({
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('❌ File deletion error:', error.message);
    res.status(500).json({
      message: 'Error deleting file',
      error: error.message,
    });
  }
};

/**
 * INCREMENT FILE VIEWS (for analytics)
 * POST /api/study-material/files/:fileId/view
 */
exports.incrementView = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await StudyFile.findByIdAndUpdate(
      fileId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.status(200).json({
      message: 'View recorded',
      views: file.views,
    });
  } catch (error) {
    console.error('❌ View increment error:', error.message);
    res.status(500).json({
      message: 'Error recording view',
      error: error.message,
    });
  }
};
