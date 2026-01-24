import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/reviews';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
};

const reviewService = {
  /**
   * Submit a new review for a session
   * @param {Object} data - { sessionId, rating, reviewText }
   * @returns {Promise}
   */
  submitReview: async (data) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/submit-review`,
        data,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to submit review';
      throw new Error(errorMsg);
    }
  },

  /**
   * Check if learner already reviewed a session
   * @param {string} sessionId
   * @returns {Promise}
   */
  getSessionReview: async (sessionId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/session/${sessionId}`,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch review status';
      throw new Error(errorMsg);
    }
  },

  /**
   * Get tutor's rating statistics
   * @param {string} tutorId
   * @returns {Promise} - { averageRating, totalReviews, ratingBreakdown }
   */
  getTutorStats: async (tutorId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tutor/${tutorId}/stats`
      );
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch tutor stats';
      throw new Error(errorMsg);
    }
  },

  /**
   * Get all reviews for a tutor (paginated)
   * @param {string} tutorId
   * @param {number} page - Page number (default: 1)
   * @returns {Promise} - { reviews: [], pagination }
   */
  getTutorReviews: async (tutorId, page = 1) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tutor/${tutorId}/all?page=${page}`
      );
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch tutor reviews';
      throw new Error(errorMsg);
    }
  },

  /**
   * Get all reviews submitted by a learner
   * @param {string} learnerId
   * @param {number} page - Page number (default: 1)
   * @returns {Promise} - { reviews: [], pagination }
   */
  getLearnerReviews: async (learnerId, page = 1) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/learner/${learnerId}/all?page=${page}`,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch your reviews';
      throw new Error(errorMsg);
    }
  }
};

export default reviewService;
