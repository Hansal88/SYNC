/**
 * File upload utilities for chat
 * Handles validation, type detection, and size checking
 */

// Supported file types and their MIME types
export const SUPPORTED_FILE_TYPES = {
  // Images
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    category: 'image',
  },
  // Documents
  pdf: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
    category: 'document',
  },
  // Office documents
  doc: {
    extensions: ['.doc', '.docx'],
    mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 10 * 1024 * 1024, // 10MB
    category: 'document',
  },
  xls: {
    extensions: ['.xls', '.xlsx'],
    mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    maxSize: 10 * 1024 * 1024, // 10MB
    category: 'document',
  },
  ppt: {
    extensions: ['.ppt', '.pptx'],
    mimeTypes: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    maxSize: 10 * 1024 * 1024, // 10MB
    category: 'document',
  },
  // Text files
  txt: {
    extensions: ['.txt'],
    mimeTypes: ['text/plain'],
    maxSize: 5 * 1024 * 1024, // 5MB
    category: 'document',
  },
  // Archives
  zip: {
    extensions: ['.zip', '.rar', '.7z'],
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    maxSize: 20 * 1024 * 1024, // 20MB
    category: 'archive',
  },
};

/**
 * Flatten supported types for easy lookup
 */
export const ALL_SUPPORTED_TYPES = Object.values(SUPPORTED_FILE_TYPES).reduce((acc, type) => {
  type.extensions.forEach(ext => {
    acc[ext.toLowerCase()] = type;
  });
  type.mimeTypes.forEach(mime => {
    acc[mime.toLowerCase()] = type;
  });
  return acc;
}, {});

/**
 * Get file type info by extension or MIME type
 */
export const getFileTypeInfo = (fileName, mimeType) => {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return ALL_SUPPORTED_TYPES[extension.toLowerCase()] || ALL_SUPPORTED_TYPES[mimeType?.toLowerCase()];
};

/**
 * Validate file for upload
 * @returns { valid: boolean, error: string | null }
 */
export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file type
  const typeInfo = getFileTypeInfo(file.name, file.type);
  if (!typeInfo) {
    return { 
      valid: false, 
      error: `File type not supported. Supported: images, PDFs, Word, Excel, PowerPoint, text files` 
    };
  }

  // Check file size
  if (file.size > typeInfo.maxSize) {
    const maxMB = typeInfo.maxSize / (1024 * 1024);
    return { 
      valid: false, 
      error: `File is too large. Maximum size is ${maxMB}MB` 
    };
  }

  return { valid: true, error: null };
};

/**
 * Format file size to human readable
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Check if file is an image
 */
export const isImage = (fileName, mimeType) => {
  const typeInfo = getFileTypeInfo(fileName, mimeType);
  return typeInfo?.category === 'image';
};

/**
 * Check if file is a PDF
 */
export const isPDF = (fileName, mimeType) => {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return extension === '.pdf' || mimeType === 'application/pdf';
};

/**
 * Create preview URL for file
 * For images: uses blob URL
 * For documents: uses icon/placeholder
 */
export const createFilePreview = (file) => {
  if (isImage(file.name, file.type)) {
    return URL.createObjectURL(file);
  }
  // For documents, we'll show icon-based preview
  return null;
};

/**
 * Get file icon based on type
 */
export const getFileIcon = (fileName, mimeType) => {
  const typeInfo = getFileTypeInfo(fileName, mimeType);
  if (!typeInfo) return 'file';
  
  const category = typeInfo.category;
  if (category === 'image') return 'image';
  if (category === 'document') {
    if (fileName.endsWith('.pdf')) return 'file-pdf';
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'file-text';
    if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return 'table';
    if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return 'presentation';
    return 'file-text';
  }
  if (category === 'archive') return 'archive';
  return 'file';
};

/**
 * Revoke object URL to free memory
 */
export const revokeFilePreview = (previewUrl) => {
  if (previewUrl && previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl);
  }
};

/**
 * Get accepted file types for input element
 */
export const getAcceptedFileTypes = () => {
  const mimeTypes = Object.values(SUPPORTED_FILE_TYPES)
    .flatMap(type => type.mimeTypes)
    .join(',');
  
  const extensions = Object.values(SUPPORTED_FILE_TYPES)
    .flatMap(type => type.extensions)
    .join(',');
  
  return `${mimeTypes},${extensions}`;
};
