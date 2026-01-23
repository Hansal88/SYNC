import { useState } from 'react';
import { Download, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize, isImage, isPDF } from '../utils/fileUpload';

/**
 * FileMessage component
 * Displays file attachments in chat messages
 * Shows preview for images, download button for documents
 */
export function FileMessage({ 
  fileUrl, 
  fileName, 
  fileSize, 
  isOwn = false,
  isLoading = false 
}) {
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const handleDownload = (e) => {
    e.preventDefault();
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImageFile = isImage(fileName, '');
  const isPDFFile = isPDF(fileName, '');

  if (isImageFile) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          relative rounded-lg overflow-hidden group cursor-pointer
          max-w-xs ${isOwn ? '' : ''}
          border border-gray-200 dark:border-gray-700
        `}
      >
        {loadingPreview && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-blue-500" />
          </div>
        )}

        <img
          src={fileUrl}
          alt={fileName}
          onLoad={() => setLoadingPreview(false)}
          onError={() => {
            setLoadingPreview(false);
            setPreviewError(true);
          }}
          onLoadingCapture={() => setLoadingPreview(true)}
          className="max-w-xs max-h-96 object-cover"
        />

        {previewError && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* Hover overlay with download */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center"
        >
          <button
            onClick={handleDownload}
            className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            title="Download image"
          >
            <Download className="w-5 h-5 text-gray-900" />
          </button>
        </motion.div>

        {/* File name tooltip */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
          {fileName}
        </div>
      </motion.div>
    );
  }

  // Document/PDF display
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        flex items-center gap-3 p-3 rounded-lg
        bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700
        hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
        w-full max-w-xs cursor-pointer
      `}
      onClick={handleDownload}
    >
      {/* File Icon */}
      <div className="flex-shrink-0">
        {isPDFFile ? (
          <div className="w-10 h-10 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="text-lg font-bold text-red-600 dark:text-red-400">PDF</span>
          </div>
        ) : (
          <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
          {fileName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {formatFileSize(fileSize)}
        </p>
      </div>

      {/* Download Icon */}
      <div className="flex-shrink-0">
        <Download className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" />
      </div>
    </motion.div>
  );
}

/**
 * FileMessageSkeleton component
 * Loading placeholder for file messages
 */
export function FileMessageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="animate-pulse"
    >
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg max-w-xs" />
    </motion.div>
  );
}
