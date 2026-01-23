OTP Email Verification - Quick Setup Guide

## What Was Implemented?

✅ **Email Verification with OTP** - When users sign up or try to login, they must verify their email with a 6-digit OTP sent to their email address.

✅ **Unique OTP Generation** - Each OTP is different and generated randomly. Users get 5 attempts to enter the correct OTP.

✅ **OTP Expiration** - OTPs expire after 10 minutes for security.

✅ **Beautiful UI** - Custom OTP input page with countdown timer, attempt counter, and resend functionality.

---

## Step-by-Step Setup

### 1. Get Gmail App Password (Recommended)

Since Gmail doesn't allow regular passwords in apps, you need an App Password:

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Google will generate a 16-character password
4. Copy this password

### 2. Update `.env` File

Edit `backend/.env` and add your email credentials:

```env
# Email Configuration (for OTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password

# Example:
# EMAIL_USER=janedoe@gmail.com
# EMAIL_PASSWORD=abcd efgh ijkl mnop
```

### 3. Restart Backend Server

```bash
cd backend
npm start
```

You should see: `✓ MongoDB Atlas Connected`

### 4. Test the Feature

#### Scenario A: New User Signup
1. Go to `http://localhost:3000/signup` (or your frontend URL)
2. Fill in: Name, Email, Password, select Role
3. Click "Continue" → Select Role → Submit
4. You'll be redirected to `/verify-otp`
5. Check your email for the OTP
6. Enter the 6-digit code
7. If correct, you'll be logged in automatically

#### Scenario B: User Tries to Login Without Email Verification
1. User signup OTP expired or skipped
2. Try to login with those credentials
3. You'll get: "Email not verified. Please verify your email first."
4. Resend OTP and verify

---

## API Endpoints

### 1. Signup (Create Account)
```
POST /api/auth/signup
Body: {
  name: "John Doe",
  email: "john@example.com",
  password: "securePassword123",
  role: "learner" // or "tutor"
}

Response: {
  message: "User registered successfully! OTP sent to your email.",
  userId: "user_id",
  email: "john@example.com",
  requiresOTPVerification: true
}
```

### 2. Verify OTP
```
POST /api/auth/verify-otp
Body: {
  email: "john@example.com",
  otp: "123456"
}

Response: {
  message: "Email verified successfully!",
  token: "jwt_token",
  user: { id, name, email, role, isEmailVerified: true }
}
```

### 3. Resend OTP
```
POST /api/auth/resend-otp
Body: {
  email: "john@example.com"
}

Response: {
  message: "OTP resent successfully to your email",
  email: "john@example.com"
}
```

### 4. Login
```
POST /api/auth/login
Body: {
  email: "john@example.com",
  password: "securePassword123"
}

Response: {
  message: "Login successful",
  token: "jwt_token",
  user: { id, name, email, role }
}
```

---

## Features Explained

### OTP Generation
- **6 digits** for easy input
- **Truly random** - each OTP is different
- **Cryptographically secure** using Math.random()

### Security Features
- **10-minute expiration** - OTP becomes invalid after 10 minutes
- **5-attempt limit** - After 5 wrong attempts, OTP is disabled
- **Email verification required** - Can't login without verifying email first
- **Password hashing** - Passwords stored as bcrypt hashes

### User Experience
- **Auto-focus** - When you type in one field, focus moves to next
- **Paste support** - Can paste all 6 digits at once
- **Countdown timer** - Shows time remaining for OTP validity
- **Clear error messages** - Tells you what went wrong
- **Resend button** - Get new OTP if you missed it
- **Attempt counter** - Shows how many attempts remaining

---

## Troubleshooting

### Problem: "Failed to send OTP email"
**Solution:** Check your `.env` file:
- Make sure `EMAIL_USER` and `EMAIL_PASSWORD` are correct
- If using Gmail, make sure it's an App Password (not your regular password)
- Check if 2FA is enabled on your Gmail account

### Problem: "Incorrect OTP" (but it's correct)
**Possible causes:**
- OTP expired (get a new one)
- You entered it wrong
- Check for extra spaces in your input

### Problem: Backend server won't start
**Solution:**
- Make sure `nodemailer` is installed: `npm install nodemailer`
- Restart the server: `npm start`
- Check `.env` file has `MONGO_URI` and `PORT`

### Problem: MongoDB not connected
**Solution:**
- Make sure `MONGO_URI` in `.env` is correct
- Check MongoDB Atlas IP whitelist includes your IP
- Verify connection string format

---

## Email Template Customization

To customize the OTP email appearance, edit `backend/utils/otpService.js` in the `sendOTPEmail` function:

```javascript
const mailOptions = {
  from: process.env.EMAIL_USER,
  to: email,
  subject: 'Your Email Verification OTP', // ← Customize subject
  html: `
    <!-- Customize HTML here -->
    <p>Hello ${userName},</p>
    <p>Your OTP is: ${otp}</p>
  `,
};
```

---

## Test Credentials

If you want to test without real email:

**Option 1: Use Nodemailer Test Account**
```javascript
// In otpService.js, replace transporter:
const transporter = nodemailer.createTestAccount().then(testAccount => {
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
});
```

**Option 2: Use MailHog (Local testing)**
- Install: https://github.com/mailhog/MailHog
- Run MailHog
- Access UI at `http://localhost:1025`

---

## What's Next?

After OTP is working, here are some quick improvements:

1. **Add SMS OTP option** - Use Twilio for SMS
2. **Add Password Reset** - Email link with token
3. **Add 2FA** - After email verification
4. **Add Login Notifications** - Alert user of new login
5. **Add IP Whitelisting** - Restrict login locations

See `OTP_FEATURE_AND_IMPROVEMENTS.md` for full list of enhancement ideas!

---

## File Structure

```
backend/
├── utils/
│   └── otpService.js          ← New: OTP generation & email
├── models/
│   └── User.js                ← Updated: Added OTP fields
├── routes/
│   └── authRoutes.js          ← Updated: New OTP endpoints
├── .env                        ← Updated: Email config

frontend/
├── src/
│   ├── pages/
│   │   ├── OTPVerification.jsx ← New: OTP input page
│   │   └── Signup.jsx          ← Updated: Redirects to OTP
│   └── App.jsx                 ← Updated: New route
```

---

## Summary

✅ **OTP Feature Complete** - Users must verify email on signup
✅ **Unique OTPs** - Each code is different
✅ **Security** - 10-minute expiration, 5-attempt limit
✅ **Beautiful UI** - Professional-looking OTP input page
✅ **Error Handling** - Clear messages for all scenarios
✅ **Resend Option** - Get new OTP if needed

Enjoy your enhanced authentication system! 🎉
