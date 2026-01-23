const mongoose = require('mongoose');
const crypto = require('crypto');

const phoneOTPSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete after expiry
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Method to compare OTP
phoneOTPSchema.methods.compareOTP = function(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex') === this.otpHash;
};

// Method to check if OTP is expired
phoneOTPSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to check if max attempts exceeded
phoneOTPSchema.methods.isMaxAttemptsExceeded = function() {
  return this.attempts >= this.maxAttempts;
};

const PhoneOTP = mongoose.model('PhoneOTP', phoneOTPSchema);
module.exports = PhoneOTP;
