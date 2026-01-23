const crypto = require('crypto');
require('dotenv').config();

// Initialize Twilio client
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Generate a 6-digit numeric OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash OTP for secure storage
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Send OTP via SMS using Twilio
 * @param {string} phoneNumber - E.164 format phone number (+91XXXXXXXXXX)
 * @param {string} otp - The OTP to send
 * @returns {Promise<boolean>} - True if sent successfully
 */
const sendSMS = async (phoneNumber, otp) => {
  try {
    if (!TWILIO_PHONE_NUMBER) {
      console.error('TWILIO_PHONE_NUMBER not configured');
      return false;
    }

    const message = await client.messages.create({
      body: `Your verification code is ${otp}. It will expire in 5 minutes. Do not share this code with anyone.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`SMS sent successfully. SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

/**
 * Validate phone number format (E.164)
 */
const isValidPhoneNumber = (phone) => {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
};

module.exports = {
  generateOTP,
  hashOTP,
  sendSMS,
  isValidPhoneNumber,
};
