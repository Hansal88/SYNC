const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Generate a unique 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash OTP for secure storage
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

// Verify OTP by comparing with stored hash
const verifyOTPHash = (plainOTP, hashedOTP) => {
  return hashOTP(plainOTP) === hashedOTP;
};

// Configure email service
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send OTP via email with improved template
const sendOTPEmail = async (email, otp, userName) => {
  try {
    console.log(`\n🔐 [OTP Service] Starting email send process...`);
    console.log(`📧 To: ${email}`);
    console.log(`👤 User: ${userName}`);
    console.log(`📧 From: ${process.env.EMAIL_USER}`);
    console.log(`🔧 Service: ${process.env.EMAIL_SERVICE}`);
    
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'Tutoring Platform'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your Email Verification OTP',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #333; font-size: 28px; margin: 0;">Email Verification</h2>
              <p style="color: #666; font-size: 14px; margin-top: 5px;">Secure your account with email verification</p>
            </div>

            <!-- Main Content -->
            <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${userName},</p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Thank you for registering with our platform! To complete your email verification and unlock full access to all features, please use the OTP code below.
            </p>

            <!-- OTP Display -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
              <p style="color: rgba(255,255,255,0.8); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 15px 0;">Your Verification Code</p>
              <p style="color: white; font-size: 48px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                ${otp}
              </p>
              <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 15px 0 0 0;">⏱️ Valid for 10 minutes only</p>
            </div>

            <!-- Instructions -->
            <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #555; font-size: 14px; margin: 0;"><strong>How to use:</strong></p>
              <ol style="color: #666; font-size: 14px; padding-left: 20px; margin: 10px 0 0 0;">
                <li>Copy the 6-digit code above</li>
                <li>Go back to the verification page</li>
                <li>Paste the code and submit</li>
              </ol>
            </div>

            <!-- Security Notice -->
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #856404; font-size: 13px; margin: 0;">
                🔒 <strong>Security Notice:</strong> Never share this OTP with anyone. We will never ask for your OTP via email or phone.
              </p>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                If you didn't create this account, you can safely ignore this email.
              </p>
              <p style="color: #999; font-size: 12px; margin-top: 10px;">
                © 2026 Tutoring Platform. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      `,
    };

    console.log(`📨 Email options prepared, sending via ${process.env.EMAIL_SERVICE}...`);
    await transporter.sendMail(mailOptions);
    console.log(`✅ [OTP Service] Email sent successfully!\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ [OTP Service] Error sending OTP email:`, error.message);
    console.error(`📧 Error code:`, error.code);
    console.error(`📧 Error details:`, error);
    console.error(`\n`);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

// OTP verification with time check and attempt limit
const verifyOTP = (storedOTPHash, storedExpiresAt, providedOTP, attempts) => {
  if (!storedOTPHash) {
    return { valid: false, message: 'No OTP found. Please request a new one.' };
  }

  if (attempts >= 5) {
    return { valid: false, message: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  if (new Date() > new Date(storedExpiresAt)) {
    return { valid: false, message: 'OTP has expired. Please request a new one.', expired: true };
  }

  if (!verifyOTPHash(providedOTP.trim(), storedOTPHash)) {
    return { valid: false, message: 'Incorrect OTP. Please try again.' };
  }

  return { valid: true, message: 'OTP verified successfully' };
};

// Send verification email (wrapper for initial signup)
const sendVerificationEmail = async (email, otp, userName) => {
  return sendOTPEmail(email, otp, userName);
};

// Resend OTP email
const resendOTPEmail = async (email, otp, userName) => {
  return sendOTPEmail(email, otp, userName);
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTPHash,
  sendOTPEmail,
  sendVerificationEmail,
  resendOTPEmail,
  verifyOTP,
};
