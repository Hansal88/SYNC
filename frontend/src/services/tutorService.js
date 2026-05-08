import axios from 'axios';
import { API_BASE_URL as BASE_API_URL } from '../config/api';
const API_BASE_URL = `${BASE_API_URL}/tutors`;

// Get token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };
};

// Tutor API Calls
export const tutorAPI = {
  // Get all tutors with pagination
  getAllTutors: async (page = 1, limit = 10) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tutors?page=${page}&limit=${limit}`,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search tutors with filters
  searchTutors: async (params) => {
    try {
      const query = new URLSearchParams();
      if (params.keyword) query.append('keyword', params.keyword);
      if (params.specialization) query.append('specialization', params.specialization);
      if (params.minRating) query.append('minRating', params.minRating);
      if (params.maxPrice) query.append('maxPrice', params.maxPrice);
      if (params.sort) query.append('sort', params.sort);

      const response = await axios.get(
        `${API_BASE_URL}/tutors/search?${query}`,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single tutor profile
  getTutorById: async (id) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tutors/${id}`,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all specializations
  getSpecializations: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tutors/specializations/all`,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default tutorAPI;
