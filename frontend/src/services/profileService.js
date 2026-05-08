import axios from 'axios';
import { API_BASE_URL as BASE_API_URL } from '../config/api';
const API_BASE_URL = `${BASE_API_URL}`;

// Get token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
};

// Profile API Calls
export const profileAPI = {
  // Get current user profile
  getProfile: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/profile`, getAuthHeader());
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get tutor profile
  getTutorProfile: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/profile/tutor/profile`, getAuthHeader());
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update tutor profile
  updateTutorProfile: async (data) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/profile/tutor/profile`, data, getAuthHeader());
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get learner profile
  getLearnerProfile: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/profile/learner/profile`, getAuthHeader());
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update learner profile
  updateLearnerProfile: async (data) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/profile/learner/profile`, data, getAuthHeader());
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/profile/logout`, {}, getAuthHeader());
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      return response.data;
    } catch (error) {
      // Still clear localStorage even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      throw error.response?.data || error;
    }
  },
};

export default profileAPI;