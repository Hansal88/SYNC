import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  Trash2,
  Download,
  Play,
  FileText,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import studyMaterialService from '../../services/studyMaterialService';
import UploadFileModal from './UploadFileModal';

export default function FolderView({ folder, onBack, onFolderUpdated, showUploadModal, setShowUploadModal }) {
  const { isDarkMode } = useTheme();
  const userRole = localStorage.getItem('userRole') || 'learner';
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingFile, setDeletingFile] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, [folder._id]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await studyMaterialService.getFilesByFolder(folder._id);
      setFiles(response.data || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load files. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      setDeletingFile(fileId);
      await studyMaterialService.deleteFile(fileId);
      setFiles(files.filter((f) => f._id !== fileId));
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(
        err.response?.data?.message ||
          'Failed to delete file. Please try again.'
      );
    } finally {
      setDeletingFile(null);
    }
  };

  const handleUploadSuccess = async () => {
    await fetchFiles();
    onFolderUpdated?.();
  };

  const groupFilesByType = () => {
    return {
      videos: files.filter((f) => f.fileType === 'video'),
      ppts: files.filter((f) => f.fileType === 'ppt'),
      notes: files.filter((f) => f.fileType === 'note'),
    };
  };

  const grouped = groupFilesByType();

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDarkMode
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100'
    }`}>
      {/* Background Orbs */}
      <div className="fixed top-20 -left-40 w-80 h-80 bg-blue-300/20 dark:bg-blue-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="fixed bottom-20 -right-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      {/* Header */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50 p-8 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            <ArrowLeft size={20} />
            Back to Folders
          </button>

          <div className="flex items-center gap-4 mb-2">
            <div className="text-5xl">{folder.icon || '📁'}</div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white">
                {folder.title}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
                {folder.description || 'No description provided'}
              </p>
            </div>
          </div>

          {folder.courseId && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              📚 Course ID: <strong>{folder.courseId}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4 mb-8 flex items-center gap-3 text-red-700 dark:text-red-400"
          >
            <AlertCircle size={24} className="flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </motion.div>
        )}

        {/* Upload Button (Tutor only) */}
        {userRole === 'tutor' && (
          <div className="mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full font-bold transition-all transform shadow-lg hover:shadow-xl"
            >
              <Upload size={20} />
              Add File to Folder
            </motion.button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader size={48} className="text-blue-600 animate-spin" />
            <p className="text-slate-600 dark:text-slate-400 font-semibold">
              Loading files...
            </p>
          </div>
        ) : files.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800/50 rounded-3xl p-16 text-center transform transition-all hover:scale-105">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-slate-800 dark:text-slate-100 text-xl font-bold mb-2">
              No files yet
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-base">
              {userRole === 'tutor'
                ? 'Start by uploading videos, presentations, or notes'
                : 'Your tutor will share files here soon'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Videos Section */}
            {grouped.videos.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Play size={28} className="text-red-600" />
                  Videos ({grouped.videos.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {grouped.videos.map((file, index) => (
                      <FileCard
                        key={file._id}
                        file={file}
                        onDelete={() => handleDeleteFile(file._id)}
                        canDelete={userRole === 'tutor'}
                        isDeleting={deletingFile === file._id}
                        onPlay={() => setSelectedVideo(file)}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* PPTs Section */}
            {grouped.ppts.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={28} className="text-orange-600" />
                  Presentations ({grouped.ppts.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {grouped.ppts.map((file, index) => (
                      <FileCard
                        key={file._id}
                        file={file}
                        onDelete={() => handleDeleteFile(file._id)}
                        canDelete={userRole === 'tutor'}
                        isDeleting={deletingFile === file._id}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Notes Section */}
            {grouped.notes.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={28} className="text-blue-600" />
                  Notes & Documents ({grouped.notes.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {grouped.notes.map((file, index) => (
                      <FileCard
                        key={file._id}
                        file={file}
                        onDelete={() => handleDeleteFile(file._id)}
                        canDelete={userRole === 'tutor'}
                        isDeleting={deletingFile === file._id}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadFileModal
        isOpen={showUploadModal}
        folderId={folder._id}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}

function FileCard({
  file,
  onDelete,
  canDelete,
  isDeleting,
  onPlay,
  index,
}) {
  const getIcon = (fileType) => {
    switch (fileType) {
      case 'video':
        return '🎬';
      case 'ppt':
        return '📊';
      case 'note':
        return '📄';
      default:
        return '📁';
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
    >
      <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-900/30 dark:to-purple-900/30">
        <div className="text-4xl mb-4">{getIcon(file.fileType)}</div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 mb-1">
          {file.fileName}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {formatSize(file.fileSize)} • {file.views || 0} views
        </p>
      </div>

      <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
        <div className="flex-1 flex gap-2">
          {file.fileType === 'video' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPlay}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:from-red-700 hover:to-red-800 transition-all"
            >
              <Play size={16} />
              Play
            </motion.button>
          )}

          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={file.fileUrl}
            download
            className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            <Download size={16} />
            Download
          </motion.a>
        </div>

        {canDelete && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

function VideoPlayerModal({ video, onClose }) {
  const { isDarkMode } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="relative bg-black">
          <video
            src={video.fileUrl}
            controls
            autoPlay
            className="w-full h-auto max-h-[80vh]"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
          >
            <X size={24} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function X(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6l-12 12M6 6l12 12" />
    </svg>
  );
}
