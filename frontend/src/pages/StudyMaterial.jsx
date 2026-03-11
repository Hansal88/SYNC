import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Folder,
  FileText,
  Video,
  Settings,
  Trash2,
  Upload,
  AlertCircle,
  Loader,
} from 'lucide-react';
import studyMaterialService from '../services/studyMaterialService';
import CreateFolderModal from './StudyMaterial/CreateFolderModal';
import FolderView from './StudyMaterial/FolderView';
import UploadFileModal from './StudyMaterial/UploadFileModal';
import { useTheme } from '../context/ThemeContext';

export default function StudyMaterial() {
  const { isDarkMode } = useTheme();
  const userRole = localStorage.getItem('userRole') || 'learner';
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState(null);

  // Fetch folders on mount
  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await studyMaterialService.getFolders();
      setFolders(response.data || []);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load folders. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (folderData) => {
    try {
      await studyMaterialService.createFolder(
        folderData.title,
        folderData.description,
        folderData.courseId,
        folderData.icon
      );
      setShowCreateModal(false);
      await fetchFolders();
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(
        err.response?.data?.message ||
          'Failed to create folder. Please try again.'
      );
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (
      !window.confirm(
        'Are you sure? This will delete the folder and all its files.'
      )
    ) {
      return;
    }

    try {
      setDeletingFolder(folderId);
      await studyMaterialService.deleteFolder(folderId);
      console.log('✅ Folder deleted:', folderId);
      setSelectedFolder(null);
      await fetchFolders();
    } catch (err) {
      console.error('❌ Error deleting folder:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete folder. Please try again.';
      setError(errorMsg);
    } finally {
      setDeletingFolder(null);
    }
  };

  const handleUploadSuccess = async () => {
    setShowUploadModal(false);
    if (selectedFolder) {
      // The FolderView component will handle refresh
    }
  };

  // If folder is selected, show folder view
  if (selectedFolder) {
    return (
      <FolderView
        folder={selectedFolder}
        onBack={() => setSelectedFolder(null)}
        onFolderUpdated={fetchFolders}
        showUploadModal={showUploadModal}
        setShowUploadModal={setShowUploadModal}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDarkMode
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100'
    }`}>
      {/* Animated Background Orbs */}
      <div className="fixed top-20 -left-40 w-80 h-80 bg-blue-300/20 dark:bg-blue-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="fixed bottom-20 -right-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      {/* Header */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50 p-8 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <BookIcon size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Study Material
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
                {userRole === 'tutor'
                  ? '📚 Manage your course materials and resources'
                  : '📖 Access learning resources shared by your tutors'}
              </p>
            </div>
          </div>
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

        {/* Create Folder Button (Tutor only) */}
        {userRole === 'tutor' && (
          <div className="mb-8 flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full font-bold transition-all transform shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              New Folder
            </motion.button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader size={48} className="text-blue-600 animate-spin" />
            <p className="text-slate-600 dark:text-slate-400 font-semibold">
              Loading study materials...
            </p>
          </div>
        ) : folders.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800/50 rounded-3xl p-16 text-center transform transition-all hover:scale-105">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-slate-800 dark:text-slate-100 text-xl font-bold mb-2">
              {userRole === 'tutor'
                ? 'No folders yet'
                : 'No study materials available'}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-base mb-6">
              {userRole === 'tutor'
                ? 'Create your first folder to start organizing your course materials'
                : 'Check back soon! Your tutors will share materials here'}
            </p>
            {userRole === 'tutor' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full font-bold transition-all"
              >
                <Plus size={20} />
                Create First Folder
              </motion.button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {folders.map((folder, index) => (
                <motion.div
                  key={folder._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <FolderCard
                    folder={folder}
                    onSelect={() => setSelectedFolder(folder)}
                    onDelete={() => handleDeleteFolder(folder._id)}
                    canDelete={userRole === 'tutor'}
                    isDeleting={deletingFolder === folder._id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchFolders();
        }}
      />
    </div>
  );
}

function FolderCard({ folder, onSelect, onDelete, canDelete, isDeleting }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, translateY: -5 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group"
    >
      <div
        onClick={onSelect}
        className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-900/30 dark:to-purple-900/30 relative"
      >
        <div className="text-5xl mb-4">{folder.icon || '📁'}</div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
          {folder.title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">
          {folder.description || 'No description'}
        </p>
      </div>

      <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {folder.fileCount || 0} file{folder.fileCount !== 1 ? 's' : ''}
        </span>

        {canDelete && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
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

// Icon component (Placeholder)
function BookIcon(props) {
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
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
