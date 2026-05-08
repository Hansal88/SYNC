import axios from 'axios';
import { API_BASE_URL as BASE_API_URL } from '../config/api';
const API_BASE_URL = `${BASE_API_URL}/bookings`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
  };
};

const bookingService = {
  // Create a booking
  createBooking: async (tutorId, startTime, endTime, subject, price, notes) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/create`,
        { tutorId, startTime, endTime, subject, price, notes },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Get learner's bookings
  getLearnerBookings: async (status = null) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/learner/bookings`,
        {
          headers: getAuthHeader(),
          params: { status },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  // Get tutor's bookings
  getTutorBookings: async (status = null) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tutor/bookings`,
        {
          headers: getAuthHeader(),
          params: { status },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  // Update booking status
  updateBookingStatus: async (bookingId, status, cancellationReason = null) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/${bookingId}/status`,
        { status, cancellationReason },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  // Get available slots for tutor
  getTutorAvailability: async (tutorId, date) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tutor/${tutorId}/availability`,
        {
          params: { date },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }
  },

  // Delete booking
  deleteBooking: async (bookingId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/${bookingId}`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  },
};

export default bookingService;
