import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import studyMaterialService from '../../services/studyMaterialService';

export default function UploadFileModal({ isOpen, folderId, onClose, onSuccess }) {
  const { isDarkMode } = useTheme();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const FILE_LIMITS = {
    video: { max: 100, ext: ['mp4', 'mkv'] },
    ppt: { max: 50, ext: ['ppt', 'pptx'] },
    note: { max: 50, ext: ['pdf', 'doc', 'docx'] },
  };

  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const sizeMB = file.size / (1024 * 1024);

    for (const [type, limits] of Object.entries(FILE_LIMITS)) {
      if (limits.ext.includes(ext)) {
        if (sizeMB > limits.max) {
          return `${type.toUpperCase()} files must not exceed ${limits.max}MB`;
        }
        return null;
      }
    }

    return 'Unsupported file type. Allowed: video (mp4, mkv), ppt (ppt, pptx), note (pdf, doc, docx)';
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const err = validateFile(selectedFile);
      if (err) {
        setError(err);
        setFile(null);
      } else {
        setError('');
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      setUploading(true);
      setError('');
      await studyMaterialService.uploadFile(
        file,
        folderId,
        (percent) => setProgress(percent)
      );

      setFile(null);
      setProgress(0);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to upload file'
      );
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl shadow-2xl p-8 ${
          isDarkMode ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Upload File
          </h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-5">
          {/* File Input */}
          <div className="relative">
            <input
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id="file-input"
              accept=".mp4,.mkv,.ppt,.pptx,.pdf,.doc,.docx"
            />
            <label
              htmlFor="file-input"
              className={`block p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
                file
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {file ? (
                <>
                  <p className="text-green-600 dark:text-green-400 font-bold">
                    ✓ {file.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <p className="text-slate-700 dark:text-slate-300 font-bold">
                    Click to browse or drag files here
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Video (mp4, mkv - max 100MB) | PPT (max 50MB) | Notes (pdf,
                    doc, docx - max 50MB)
                  </p>
                </>
              )}
            </label>
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                />
              </div>
              <p className="text-sm text-center font-semibold text-slate-600 dark:text-slate-400">
                {progress}%
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-semibold">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {uploading ? `Uploading... ${progress}%` : 'Upload'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
