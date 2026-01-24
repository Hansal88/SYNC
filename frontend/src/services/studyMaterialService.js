import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/study-material';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  console.log('🔐 Auth Debug:', { token: token ? '✓ exists' : '✗ missing', userRole });
  if (!token) {
    console.warn('⚠️ No token found in localStorage');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

const studyMaterialService = {
  // ============ FOLDER OPERATIONS ============

  // Create folder
  createFolder: async (title, description = '', courseId = null, icon = '📁') => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/folders`,
        { title, description, courseId, icon },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error creating folder:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create folder';
      const err = new Error(errorMessage);
      err.response = error.response;
      throw err;
    }
  },

  // Get all folders
  getFolders: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/folders`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  },

  // Get folder by ID
  getFolderById: async (folderId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/folders/${folderId}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching folder:', error);
      throw error;
    }
  },

  // Update folder
  updateFolder: async (folderId, updateData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/folders/${folderId}`, updateData, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating folder:', error);
      throw error;
    }
  },

  // Delete folder
  deleteFolder: async (folderId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/folders/${folderId}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting folder:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete folder';
      const err = new Error(errorMessage);
      err.response = error.response;
      throw err;
    }
  },

  // ============ FILE OPERATIONS ============

  // Upload file
  uploadFile: async (file, folderId, onProgress = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', folderId);

      const response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Get files by folder
  getFilesByFolder: async (folderId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/files/${folderId}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  },

  // Delete file
  deleteFile: async (fileId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/files/${fileId}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting file:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete file';
      const err = new Error(errorMessage);
      err.response = error.response;
      throw err;
    }
  },

  // Record file view
  recordView: async (fileId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/files/${fileId}/view`,
        {},
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error recording view:', error);
      throw error;
    }
  },
};

export default studyMaterialService;
