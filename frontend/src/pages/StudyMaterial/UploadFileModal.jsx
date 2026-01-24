import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import studyMaterialService from "../../services/studyMaterialService";

const FILE_LIMITS = {
  video: { maxSize: 100 * 1024 * 1024, extensions: [".mp4", ".mkv", ".webm"] },
  ppt: { maxSize: 50 * 1024 * 1024, extensions: [".ppt", ".pptx"] },
  note: { maxSize: 50 * 1024 * 1024, extensions: [".pdf", ".doc", ".docx"] },
};

export default function UploadFileModal({ isOpen, onClose, folderId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const validateFile = (selectedFile) => {
    const ext = selectedFile.name.slice(selectedFile.name.lastIndexOf(".")).toLowerCase();

    for (const [type, limits] of Object.entries(FILE_LIMITS)) {
      if (limits.extensions.includes(ext)) {
        if (selectedFile.size > limits.maxSize) {
          return `File too large. Max ${limits.maxSize / (1024 * 1024)}MB for ${type}s`;
        }
        return null;
      }
    }
    return "Unsupported file type. Allowed: MP4/MKV/WEBM, PPT/PPTX, PDF/DOC/DOCX";
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setError("");
    setFile(selectedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      await studyMaterialService.uploadFile(file, folderId, (prog) => {
        setProgress(prog);
      });
      setFile(null);
      setProgress(0);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Upload File
              </h2>
              <button
                onClick={onClose}
                disabled={uploading}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded disabled:opacity-50"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select File
                </label>
                <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition">
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {file ? file.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      MP4, MKV (100MB) | PPT, PPTX (50MB) | PDF, DOC, DOCX (50MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Uploading: {progress}%
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 font-medium"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
