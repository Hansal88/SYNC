const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Multer file upload middleware
 * Handles file validation, storage, and limits
 */

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Define storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Extract conversationId from URL parameter
    const conversationId = req.params.conversationId || 'general';
    const conversationDir = path.join(uploadsDir, conversationId);
    
    console.log('📁 Creating upload dir:', conversationDir);
    
    // Ensure directory exists
    try {
      if (!fs.existsSync(conversationDir)) {
        fs.mkdirSync(conversationDir, { recursive: true });
      }
      cb(null, conversationDir);
    } catch (err) {
      console.error('Error creating directory:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}-${uniqueSuffix}${ext}`;
    console.log('📄 File saved as:', filename);
    cb(null, filename);
  }
});

// Define file filter
const fileFilter = (req, file, cb) => {
  // Supported MIME types
  const supportedMimes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];

  if (supportedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

// Create multer instance with limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  }
});

module.exports = {
  upload,
  uploadsDir
};
