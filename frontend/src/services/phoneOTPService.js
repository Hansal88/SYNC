import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const phoneOTPService = {
  /**
   * Send OTP to phone number
   * @param {string} phone - Phone number in E.164 format (+91XXXXXXXXXX)
   * @returns {Promise}
   */
  sendPhoneOTP: async (phone) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/send-phone-otp`, {
        phone: phone.trim(),
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Verify OTP for phone number
   * @param {string} phone - Phone number in E.164 format
   * @param {string} otp - 6-digit OTP
   * @param {string} userId - User ID (optional, for linking OTP to user)
   * @returns {Promise}
   */
  verifyPhoneOTP: async (phone, otp, userId = null) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-phone-otp`, {
        phone: phone.trim(),
        otp: otp.trim(),
        userId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Resend OTP to phone number
   * @param {string} phone - Phone number in E.164 format
   * @returns {Promise}
   */
  resendPhoneOTP: async (phone) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/resend-phone-otp`, {
        phone: phone.trim(),
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default phoneOTPService;
