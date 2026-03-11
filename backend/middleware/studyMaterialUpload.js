const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define storage paths for different file types
const studyMaterialDir = path.join(__dirname, '../uploads/study-material');
const videosDir = path.join(studyMaterialDir, 'videos');
const pptsDir = path.join(studyMaterialDir, 'ppts');
const notesDir = path.join(studyMaterialDir, 'notes');

// Ensure directories exist
[studyMaterialDir, videosDir, pptsDir, notesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File type configurations
const FILE_TYPES = {
  video: {
    mimeTypes: ['video/mp4', 'video/x-matroska'],
    extensions: ['.mp4', '.mkv'],
    maxSize: 100 * 1024 * 1024, // 100MB
    folder: videosDir,
  },
  ppt: {
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    extensions: ['.ppt', '.pptx'],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: pptsDir,
  },
  note: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    extensions: ['.pdf', '.doc', '.docx'],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: notesDir,
  },
};

// Determine file type from request or MIME type
function getFileTypeFromMimeOrExt(mimetype, originalname) {
  const ext = path.extname(originalname).toLowerCase();

  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (config.mimeTypes.includes(mimetype) || config.extensions.includes(ext)) {
      return type;
    }
  }
  return null;
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const fileType = getFileTypeFromMimeOrExt(file.mimetype, file.originalname);

      if (!fileType) {
        return cb(
          new Error(
            `Unsupported file type. Allowed: video (mp4, mkv), ppt (ppt, pptx), note (pdf, doc, docx)`
          ),
          false
        );
      }

      const config = FILE_TYPES[fileType];
      const destination = config.folder;

      if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
      }

      cb(null, destination);
    } catch (error) {
      cb(error, false);
    }
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  try {
    const fileType = getFileTypeFromMimeOrExt(file.mimetype, file.originalname);

    if (!fileType) {
      return cb(
        new Error(
          'Invalid file type. Allowed types: video (mp4, mkv), ppt (ppt, pptx), note (pdf, doc, docx)'
        ),
        false
      );
    }

    const config = FILE_TYPES[fileType];

    // Check file size before upload
    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);
      return cb(
        new Error(`${fileType.toUpperCase()} files must not exceed ${maxSizeMB}MB`),
        false
      );
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max overall
  },
});

module.exports = {
  upload: upload.single('file'),
  FILE_TYPES,
  getFileTypeFromMimeOrExt,
  studyMaterialDir,
};
