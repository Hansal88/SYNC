import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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

// Send a request to a tutor
export const sendRequest = async (tutorId, subject, message) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/requests`, {
      tutorId,
      subject,
      message,
    }, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error sending request:', error);
    throw error;
  }
};

// Get incoming requests (for tutors)
export const getIncomingRequests = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/requests/tutor/incoming`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching incoming requests:', error);
    throw error;
  }
};

// Get sent requests (for learners)
export const getSentRequests = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/requests/learner/sent`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    throw error;
  }
};

// Accept a request
export const acceptRequest = async (requestId) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/requests/${requestId}/accept`, {}, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error accepting request:', error);
    throw error;
  }
};

// Reject a request
export const rejectRequest = async (requestId, reason = '') => {
  try {
    const response = await axios.put(`${API_BASE_URL}/requests/${requestId}/reject`, {
      reason,
    }, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error rejecting request:', error);
    throw error;
  }
};

// Get single request
export const getRequest = async (requestId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/requests/${requestId}`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching request:', error);
    throw error;
  }
};
