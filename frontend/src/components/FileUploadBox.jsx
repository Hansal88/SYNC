import { useState, useRef } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatFileSize, isImage } from '../utils/fileUpload';

/**
 * FileUploadBox component
 * Handles file selection with drag-drop and file input
 * Shows preview for images, metadata for documents
 */
export function FileUploadBox({ 
  selectedFile, 
  previewUrl,
  onFileSelect, 
  onClear, 
  disabled = false,
  error = null 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  if (!selectedFile) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
        />

        <motion.div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className="flex flex-col items-center gap-2"
        >
          <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Drag and drop file here
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              or click to browse
            </p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Images (5MB) • PDFs, Documents (10MB) • Archives (20MB)
          </p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border border-gray-300 dark:border-gray-600 rounded-lg p-4"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Preview Section */}
        <div className="flex-1 flex items-start gap-3">
          {previewUrl && isImage(selectedFile.name, selectedFile.type) ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
          )}

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
        </div>

        {/* Clear Button */}
        <button
          onClick={onClear}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title="Remove file"
        >
          <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
        </button>
      </div>
    </motion.div>
  );
}

/**
 * UploadProgressBar component
 * Shows upload progress with percentage
 */
export function UploadProgressBar({ progress, isUploading }) {
  return (
    <AnimatePresence>
      {isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-10 text-right">
              {progress}%
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Uploading...</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * FileUploadError component
 * Displays upload errors with dismiss option
 */
export function FileUploadError({ error, onDismiss }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
          <button
            onClick={onDismiss}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
