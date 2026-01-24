import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, Play, Trash2, AlertCircle } from "lucide-react";
import studyMaterialService from "../../services/studyMaterialService";
import UploadFileModal from "./UploadFileModal";

export default function FolderView({ folder, onBack }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingFile, setDeletingFile] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    fetchFiles();
  }, [folder._id]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await studyMaterialService.getFilesByFolder(folder._id);
      console.log('📁 Files response:', response);
      const filesList = response.data || response || [];
      setFiles(Array.isArray(filesList) ? filesList : []);
      setError("");
    } catch (err) {
      console.error('❌ Error loading files:', err);
      setError(err.response?.data?.message || err.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const groupFilesByType = () => ({
    videos: files.filter((f) => f.fileType === "video"),
    ppts: files.filter((f) => f.fileType === "ppt"),
    notes: files.filter((f) => f.fileType === "note"),
  });

  const handleDeleteFile = async (fileId) => {
    if (!confirm("Delete this file?")) return;

    setDeletingFile(fileId);
    try {
      await studyMaterialService.deleteFile(fileId);
      console.log('✅ File deleted:', fileId);
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
    } catch (err) {
      console.error('❌ Error deleting file:', err);
      setError(err.response?.data?.message || err.message || "Failed to delete file");
    } finally {
      setDeletingFile(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const grouped = groupFilesByType();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {folder.icon} {folder.title}
          </h1>
          {folder.description && (
            <p className="text-gray-600 dark:text-gray-400">{folder.description}</p>
          )}
          {folder.courseId && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Course ID: {folder.courseId}
            </p>
          )}
        </div>
      </div>

      {/* Upload Button (Tutor Only) */}
      {userRole === "tutor" && (
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
        >
          Add File to Folder
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && files.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            {userRole === "tutor"
              ? "No files yet. Upload your first file to get started!"
              : "No files available yet."}
          </p>
        </div>
      )}

      {/* File Sections */}
      {!loading && files.length > 0 && (
        <div className="space-y-8">
          {/* Videos */}
          {grouped.videos.length > 0 && (
            <FileSection
              title={`📹 Videos (${grouped.videos.length})`}
              files={grouped.videos}
              onDelete={handleDeleteFile}
              deletingFile={deletingFile}
              formatSize={formatFileSize}
              userRole={userRole}
              onPlayVideo={(file) => setSelectedVideo(file)}
            />
          )}

          {/* PPTs */}
          {grouped.ppts.length > 0 && (
            <FileSection
              title={`📊 Presentations (${grouped.ppts.length})`}
              files={grouped.ppts}
              onDelete={handleDeleteFile}
              deletingFile={deletingFile}
              formatSize={formatFileSize}
              userRole={userRole}
            />
          )}

          {/* Notes */}
          {grouped.notes.length > 0 && (
            <FileSection
              title={`📄 Notes (${grouped.notes.length})`}
              files={grouped.notes}
              onDelete={handleDeleteFile}
              deletingFile={deletingFile}
              formatSize={formatFileSize}
              userRole={userRole}
            />
          )}
        </div>
      )}

      {/* Video Player Modal */}
      <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />

      {/* Upload Modal */}
      <UploadFileModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        folderId={folder._id}
        onSuccess={fetchFiles}
      />
    </div>
  );
}

function FileSection({
  title,
  files,
  onDelete,
  deletingFile,
  formatSize,
  userRole,
  onPlayVideo,
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
          <FileCard
            key={file._id}
            file={file}
            onDelete={() => onDelete(file._id)}
            isDeleting={deletingFile === file._id}
            formatSize={formatSize}
            userRole={userRole}
            onPlayVideo={onPlayVideo}
          />
        ))}
      </div>
    </div>
  );
}

function FileCard({
  file,
  onDelete,
  isDeleting,
  formatSize,
  userRole,
  onPlayVideo,
}) {
  const getIcon = () => {
    switch (file.fileType) {
      case "video":
        return "🎬";
      case "ppt":
        return "📊";
      case "note":
        return "📄";
      default:
        return "📎";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow hover:shadow-lg transition border border-gray-200 dark:border-slate-700"
    >
      <div className="mb-3">
        <p className="text-2xl">{getIcon()}</p>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
          {file.fileName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {formatSize(file.fileSize)}
        </p>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-500 mb-3 space-y-1">
        <p>👁️ {file.views} views</p>
        <p>⬇️ {file.downloads} downloads</p>
      </div>

      <div className="flex gap-2">
        {file.fileType === "video" && onPlayVideo && (
          <button
            onClick={() => onPlayVideo(file)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition text-sm font-medium"
          >
            <Play size={16} />
            Play
          </button>
        )}

        <a
          href={file.fileUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition text-sm font-medium"
        >
          <Download size={16} />
          Download
        </a>

        {userRole === "tutor" && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition text-sm font-medium disabled:opacity-50"
          >
            <Trash2 size={16} />
            Delete
          </button>
        )}
      </div>
    </motion.div>
  );
}

function VideoPlayerModal({ video, onClose }) {
  if (!video) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition"
          >
            ✕
          </button>
          <video
            src={video.fileUrl}
            controls
            autoPlay
            className="w-full h-full rounded-lg"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
