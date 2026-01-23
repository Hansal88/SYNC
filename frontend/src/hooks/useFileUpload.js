import { useState, useCallback, useRef } from 'react';
import { validateFile } from '../utils/fileUpload';

/**
 * Hook to manage file upload state and progress
 * Handles upload progress, errors, and cleanup
 */
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * Handle file selection from input or drag-drop
   */
  const handleFileSelect = useCallback((file) => {
    // Reset previous error and progress
    setUploadError(null);
    setUploadProgress(0);

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      return false;
    }

    setSelectedFile(file);
    return true;
  }, []);

  /**
   * Upload file to server
   * @param {File} file - File to upload
   * @param {string} conversationId - Target conversation
   * @returns {Promise<{fileUrl, fileName, fileSize, success}>}
   */
  const uploadFile = useCallback(async (file, conversationId) => {
    if (!file) {
      setUploadError('No file selected');
      return { success: false };
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      // Handle completion/errors via Promise
      return new Promise((resolve) => {
        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);
            
            if (xhr.status === 200 || xhr.status === 201) {
              setUploadProgress(100);
              setUploading(false);
              setSelectedFile(null);
              console.log('✅ File uploaded:', response.fileName);
              resolve({
                success: true,
                fileUrl: response.fileUrl,
                fileName: response.fileName,
                fileSize: response.fileSize,
              });
            } else {
              const errorMsg = response.error || response.message || 'Upload failed';
              setUploadError(errorMsg);
              console.error('❌ Upload error:', errorMsg);
              setUploading(false);
              resolve({ success: false });
            }
          } catch (parseError) {
            console.error('Parse error:', parseError, xhr.responseText);
            setUploadError('Failed to parse server response');
            setUploading(false);
            resolve({ success: false });
          }
        });

        xhr.addEventListener('error', (e) => {
          console.error('XHR error:', e);
          setUploadError('Network error during upload');
          setUploading(false);
          resolve({ success: false });
        });

        xhr.addEventListener('abort', () => {
          console.log('Upload cancelled');
          setUploadError('Upload cancelled');
          setUploading(false);
          resolve({ success: false });
        });

        // Start upload with full URL
        const conversationPath = conversationId.replace(/\//g, '_').replace(/\:/g, '_');
        const uploadUrl = `http://localhost:5000/api/messages/upload/${encodeURIComponent(conversationPath)}`;
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        console.log('📤 Uploading to:', uploadUrl);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message);
      setUploading(false);
      return { success: false };
    }
  }, []);

  /**
   * Cancel ongoing upload
   */
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
  }, []);

  /**
   * Clear selected file
   */
  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadError(null);
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setUploadError(null);
  }, []);

  return {
    uploading,
    uploadProgress,
    uploadError,
    selectedFile,
    handleFileSelect,
    uploadFile,
    cancelUpload,
    clearFile,
    clearError,
  };
}
