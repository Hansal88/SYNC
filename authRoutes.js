const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PhoneOTP = require('../models/PhoneOTP');
const { generateOTP, sendOTPEmail, sendVerificationEmail, resendOTPEmail, verifyOTP, hashOTP } = require('../utils/otpService');
const { generateOTP: generatePhoneOTP, hashOTP: hashPhoneOTP, sendSMS, isValidPhoneNumber } = require('../utils/smsService');

const router = express.Router();

// SECRET KEY for JWT (use environment variable in production!)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Password validation function
const validatePassword = (password) => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isLongEnough = password.length >= 8;

  if (!isLongEnough) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!hasUpperCase) {
    return { valid: false, message: 'Password must contain at least one capital letter (A-Z)' };
  }
  if (!hasSpecialChar) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
  }
  return { valid: true };
};

// SIGNUP - Register a new user
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, bio } = req.body;

    // Validate input - check for empty strings too
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate role
    const validRoles = ['learner', 'tutor'];
    const userRole = (role && role.trim()) ? role.trim().toLowerCase() : 'learner';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ message: 'Invalid role. Must be either "learner" or "tutor"' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: userRole,
      bio: (bio && bio.trim()) ? bio.trim() : '',
      isEmailVerified: false,
      otp: {
        code: hashedOTP,
        expiresAt: otpExpiresAt,
        attempts: 0,
      },
    });

    await newUser.save();

    // Send OTP to email
    try {
      console.log(`\n📧 Attempting to send OTP email to: ${newUser.email}`);
      console.log(`📧 OTP Code (plain): ${otp}`);
      console.log(`📧 Email Service: ${process.env.EMAIL_SERVICE}`);
      console.log(`📧 Email User: ${process.env.EMAIL_USER}`);
      
      await sendOTPEmail(newUser.email, otp, newUser.name);
      
      console.log(`✅ OTP email sent successfully to ${newUser.email}\n`);
    } catch (emailError) {
      console.error(`\n❌ Error sending OTP email:`, emailError.message);
      console.error(`📧 Full error:`, emailError);
      console.error(`\n`);
      return res.status(500).json({ 
        message: 'User created but failed to send OTP email. Please try again or contact support.',
        email: newUser.email,
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }

    res.status(201).json({
      message: 'User registered successfully! OTP sent to your email.',
      userId: newUser._id,
      email: newUser.email,
      requiresOTPVerification: true,
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.join(', ') 
      });
    }
    
    // Handle duplicate key error (unique email)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    console.error('Signup error:', error);
    res.status(500).json({ 
      message: 'Error creating user', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
  }
});

// VERIFY OTP - Verify user's email with OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified. Please login.' });
    }

    // Verify OTP
    const otpVerification = verifyOTP(
      user.otp.code,
      user.otp.expiresAt,
      otp.trim(),
      user.otp.attempts
    );

    if (!otpVerification.valid) {
      // Increment attempts
      user.otp.attempts += 1;
      await user.save();
      return res.status(400).json({ 
        message: otpVerification.message,
        attemptsRemaining: Math.max(0, 5 - user.otp.attempts)
      });
    }

    // Mark email as verified and clear OTP
    user.isEmailVerified = true;
    user.otp = {
      code: null,
      expiresAt: null,
      attempts: 0,
    };
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Email verified successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      message: 'Error verifying OTP', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
  }
});

// RESEND OTP - Resend OTP to user's email
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified. Please login.' });
    }

    // Generate new OTP
    const newOtp = generateOTP();
    const hashedOTP = hashOTP(newOtp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = {
      code: hashedOTP,
      expiresAt: otpExpiresAt,
      attempts: 0,
    };
    await user.save();

    // Send new OTP
    try {
      await resendOTPEmail(user.email, newOtp, user.name);
    } catch (emailError) {
      console.error('Error sending OTP:', emailError);
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    res.status(200).json({
      message: 'OTP resent successfully to your email',
      email: user.email,
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      message: 'Error resending OTP', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
  }
});

// LOGIN - Authenticate user and return token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input - check for empty strings too
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Normalize email (trim and lowercase) to match how it's stored
    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email (email is stored in lowercase from signup)
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: 'Email not verified. Please verify your email first.',
        requiresOTPVerification: true,
        userId: user._id,
        email: user.email,
      });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Error logging in', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
  }
});

// VERIFY TOKEN - Check if token is valid
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({
      message: 'Token is valid',
      user: decoded,
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
});

// ==================== PHONE OTP ENDPOINTS ====================

// SEND PHONE OTP - Generate and send OTP via SMS
router.post('/send-phone-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const trimmedPhone = phone.trim();

    // Validate phone format (E.164)
    if (!isValidPhoneNumber(trimmedPhone)) {
      return res.status(400).json({ 
        message: 'Invalid phone number format. Use E.164 format (e.g., +91XXXXXXXXXX)' 
      });
    }

    // Check if phone is already verified
    const existingUser = await User.findOne({ phone: trimmedPhone });
    if (existingUser && existingUser.isPhoneVerified) {
      return res.status(400).json({ message: 'This phone number is already registered and verified' });
    }

    // Rate limiting: Check if OTP was sent recently (within 1 minute)
    const recentOTP = await PhoneOTP.findOne({ 
      phone: trimmedPhone,
      verified: false,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) } // Last 1 minute
    });

    if (recentOTP) {
      return res.status(429).json({ 
        message: 'Please wait before requesting a new OTP. Try again in 1 minute.' 
      });
    }

    // Generate OTP
    const otp = generatePhoneOTP();
    const hashedOTP = hashPhoneOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to database
    let phoneOTPRecord = await PhoneOTP.findOne({ 
      phone: trimmedPhone,
      verified: false 
    });

    if (phoneOTPRecord) {
      // Update existing unverified OTP
      phoneOTPRecord.otpHash = hashedOTP;
      phoneOTPRecord.expiresAt = expiresAt;
      phoneOTPRecord.attempts = 0;
      phoneOTPRecord.createdAt = new Date();
      await phoneOTPRecord.save();
    } else {
      // Create new OTP record
      phoneOTPRecord = new PhoneOTP({
        phone: trimmedPhone,
        otpHash: hashedOTP,
        expiresAt,
        verified: false,
        attempts: 0,
      });
      await phoneOTPRecord.save();
    }

    // Send OTP via SMS
    const smsSent = await sendSMS(trimmedPhone, otp);

    if (!smsSent) {
      await PhoneOTP.deleteOne({ _id: phoneOTPRecord._id });
      return res.status(500).json({ 
        message: 'Failed to send SMS. Please try again later.' 
      });
    }

    // Log for development (OTP in response only for testing)
    console.log(`\n📱 Phone OTP sent to: ${trimmedPhone}`);
    console.log(`📱 OTP (dev only): ${otp}`);

    res.status(200).json({ 
      message: 'OTP sent successfully to your phone',
      expiresIn: 300, // 5 minutes in seconds
      // In production, don't send OTP in response
      ...(process.env.NODE_ENV === 'development' && { otp }) 
    });
  } catch (error) {
    console.error('Error sending phone OTP:', error);
    res.status(500).json({ 
      message: 'Error sending OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// VERIFY PHONE OTP - Verify OTP and mark phone as verified
router.post('/verify-phone-otp', async (req, res) => {
  try {
    const { phone, otp, userId } = req.body;

    // Validate inputs
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    if (!otp || !otp.trim()) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const trimmedPhone = phone.trim();
    const trimmedOTP = otp.trim();

    // Validate phone format
    if (!isValidPhoneNumber(trimmedPhone)) {
      return res.status(400).json({ 
        message: 'Invalid phone number format' 
      });
    }

    // Find OTP record
    const phoneOTPRecord = await PhoneOTP.findOne({ 
      phone: trimmedPhone,
      verified: false 
    });

    if (!phoneOTPRecord) {
      return res.status(400).json({ 
        message: 'No OTP found for this phone number. Please request a new OTP.' 
      });
    }

    // Check if OTP is expired
    if (phoneOTPRecord.isExpired()) {
      return res.status(400).json({ 
        message: 'OTP has expired. Please request a new OTP.' 
      });
    }

    // Check max attempts
    if (phoneOTPRecord.isMaxAttemptsExceeded()) {
      return res.status(429).json({ 
        message: 'Too many failed attempts. Please request a new OTP.' 
      });
    }

    // Verify OTP
    if (!phoneOTPRecord.compareOTP(trimmedOTP)) {
      phoneOTPRecord.attempts += 1;
      await phoneOTPRecord.save();
      
      const remainingAttempts = phoneOTPRecord.maxAttempts - phoneOTPRecord.attempts;
      return res.status(400).json({ 
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.` 
      });
    }

    // Mark OTP as verified
    phoneOTPRecord.verified = true;
    phoneOTPRecord.attempts = 0;
    await phoneOTPRecord.save();

    // Update user's phone verification status
    if (userId) {
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          phone: trimmedPhone,
          isPhoneVerified: true,
          phoneOTP: null
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate JWT token for the user
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        message: 'Phone verified successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
        },
      });
    }

    res.status(200).json({ 
      message: 'Phone verified successfully' 
    });
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    res.status(500).json({ 
      message: 'Error verifying OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// RESEND PHONE OTP - Resend OTP to phone
router.post('/resend-phone-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const trimmedPhone = phone.trim();

    if (!isValidPhoneNumber(trimmedPhone)) {
      return res.status(400).json({ 
        message: 'Invalid phone number format' 
      });
    }

    // Check if OTP exists and not verified
    const phoneOTPRecord = await PhoneOTP.findOne({ 
      phone: trimmedPhone,
      verified: false 
    });

    if (!phoneOTPRecord) {
      return res.status(400).json({ 
        message: 'No pending OTP found. Please send a new OTP first.' 
      });
    }

    // Check if can resend (not expired yet)
    if (!phoneOTPRecord.isExpired()) {
      const timeRemaining = Math.ceil((phoneOTPRecord.expiresAt - new Date()) / 1000);
      if (timeRemaining > 240) { // Allow resend only after 1 minute (5 min - 4 min = 1 min)
        return res.status(429).json({ 
          message: `Please wait ${Math.ceil((phoneOTPRecord.expiresAt - new Date() - 60 * 1000) / 1000)} seconds before resending` 
        });
      }
    }

    // Generate new OTP
    const otp = generatePhoneOTP();
    const hashedOTP = hashPhoneOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Update OTP record
    phoneOTPRecord.otpHash = hashedOTP;
    phoneOTPRecord.expiresAt = expiresAt;
    phoneOTPRecord.attempts = 0;
    phoneOTPRecord.createdAt = new Date();
    await phoneOTPRecord.save();

    // Send OTP via SMS
    const smsSent = await sendSMS(trimmedPhone, otp);

    if (!smsSent) {
      return res.status(500).json({ 
        message: 'Failed to send SMS. Please try again later.' 
      });
    }

    console.log(`\n📱 Phone OTP resent to: ${trimmedPhone}`);
    console.log(`📱 OTP (dev only): ${otp}`);

    res.status(200).json({ 
      message: 'OTP resent successfully',
      expiresIn: 300,
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    console.error('Error resending phone OTP:', error);
    res.status(500).json({ 
      message: 'Error resending OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

