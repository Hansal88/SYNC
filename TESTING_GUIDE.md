# Email Verification System - Complete Testing Guide

## System Overview

This guide provides step-by-step instructions for testing the complete email verification system with strict enforcement. The system ensures that:
- ✅ New users must verify their email before accessing ANY page
- ✅ Login is blocked for unverified users
- ✅ All protected routes require both valid JWT and email verification
- ✅ OTP expires after 10 minutes
- ✅ OTP attempts are limited to 5 per OTP generation

---

## Prerequisites

### Servers Running
```bash
# Terminal 1: Backend
cd backend
npm start
# Expected output: Server running on http://localhost:5000

# Terminal 2: Frontend  
cd frontend
npm run dev
# Expected output: VITE v... ready in ... ms
```

### Email Service
- Email configured: `hansalpanchal2406@gmail.com`
- App password: `efre oqwp wccv tfyg`
- Service: Gmail with Nodemailer

---

## Test Scenario 1: Complete Registration & Verification Flow

### Step 1: Access Signup Page
1. Navigate to `http://localhost:5173/signup`
2. You should see the signup form with three steps

### Step 2: Fill Initial Registration (Step 1)
```
Name: Test User
Email: testuser@example.com
Password: TestPassword@123
Confirm Password: TestPassword@123
```

**Password validation rules:**
- ✅ Minimum 8 characters
- ✅ At least one capital letter (A-Z)
- ✅ At least one special character (!@#$%^&*()_+\-=...)

### Step 3: Select Role (Step 2)
- Select either "Learner" or "Tutor"
- If Tutor selected, add skills (optional for learner)

### Step 4: Submit Signup
- Click "Create Account" or "Complete Setup"
- Expected: Automatically redirected to `/verify-otp`
- Expected: Backend sends OTP email to `testuser@example.com`

### Step 5: Verify Email
1. Check email inbox for OTP (usually arrives within 30 seconds)
2. Look for email from: `"Tutoring Platform" <hansalpanchal2406@gmail.com>`
3. Copy the 6-digit OTP code

### Step 6: Enter OTP
1. On the OTP verification page, enter the 6-digit code
2. Fields auto-advance to next digit
3. Click Submit or let form auto-submit

**Expected Response:**
```json
{
  "message": "Email verified successfully!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "testuser@example.com",
    "role": "learner",
    "isEmailVerified": true
  }
}
```

### Step 7: Verify Redirect
- Learner: Redirected to `/dashboard/learner`
- Tutor: Redirected to `/TutorDashboard`
- Token stored in localStorage

---

## Test Scenario 2: Login With Verified Email

### Step 1: Navigate to Login
1. Go to `http://localhost:5173/login`
2. Use credentials from Test Scenario 1

### Step 2: Submit Login
```
Email: testuser@example.com
Password: TestPassword@123
```

**Expected:**
- ✅ Login successful
- ✅ Redirected to dashboard
- ✅ Token stored in localStorage

---

## Test Scenario 3: Login With Unverified Email

### Step 1: Create Unverified User (Backend)
Use Postman or curl:

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unverified User",
    "email": "unverified@example.com",
    "password": "Password@123",
    "role": "learner"
  }'
```

### Step 2: Attempt Login (Without Verifying OTP)
```
Email: unverified@example.com
Password: Password@123
```

**Expected Error:**
```json
{
  "message": "Email not verified. Please verify your email first.",
  "requiresOTPVerification": true,
  "userId": "...",
  "email": "unverified@example.com"
}
```

**Frontend Response:**
- Red error message displayed
- Button to go to OTP verification (auto-redirects after 2 seconds)

---

## Test Scenario 4: Protected Route Access

### Step 1: Try Accessing Dashboard Without Login
1. Clear localStorage:
   ```javascript
   localStorage.clear()
   ```
2. Navigate to `http://localhost:5173/dashboard/learner`

**Expected:** Redirected to `/login`

### Step 2: Try Accessing Dashboard Without Email Verification
1. Manually set localStorage:
   ```javascript
   localStorage.setItem('token', 'fake-token-value');
   localStorage.setItem('isEmailVerified', 'false');
   ```
2. Navigate to `http://localhost:5173/dashboard/learner`

**Expected:** Redirected to `/verify-otp`

### Step 3: Access Dashboard With Valid Verification
1. Login with verified user (from Test Scenario 1)
2. Token and `isEmailVerified: true` are set
3. Navigate to `/dashboard/learner`

**Expected:** Dashboard loads successfully

---

## Test Scenario 5: OTP Expiration

### Step 1: Start OTP Verification
1. Complete signup up to OTP verification page
2. Observe 10-minute countdown timer

### Step 2: Wait or Simulate Expiration
- **Real test:** Wait 10 minutes
- **Simulation:** 
  ```javascript
  // In browser console
  localStorage.setItem('otpExpireTime', Date.now() - 1000);
  ```

### Step 3: Submit Expired OTP
1. Enter any 6-digit code
2. Click Submit

**Expected Error:**
```json
{
  "message": "OTP has expired. Please request a new one.",
  "expired": true
}
```

---

## Test Scenario 6: OTP Resend

### Step 1: On OTP Verification Page
- Click "Resend OTP" button
- Should see loading state

**Expected:**
- Success message: "OTP resent successfully to your email"
- Timer resets to 10 minutes
- Attempt counter resets to 5

### Step 2: Check Email
- New OTP arrives in inbox
- Different code from previous OTP
- Same email address

---

## Test Scenario 7: Maximum OTP Attempts

### Step 1: Start OTP Verification
1. Complete signup
2. Receive OTP

### Step 2: Enter Wrong OTP 5 Times
- Enter any random 6-digit code
- Click Submit
- Repeat 5 times

**Expected on attempts 1-4:**
```json
{
  "message": "Incorrect OTP. Please try again.",
  "attemptsRemaining": 4
}
```

**Expected on attempt 5:**
```json
{
  "message": "Too many incorrect attempts. Please request a new OTP.",
  "attemptsRemaining": 0
}
```

### Step 3: Resend OTP
- Click "Resend OTP"
- Attempt counter resets to 5

---

## Postman Testing Collection

### Setup
1. Import into Postman
2. Set base URL: `http://localhost:5000/api`

### Endpoints

#### 1. Signup
```http
POST /auth/signup
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Password@123",
  "role": "learner",
  "bio": ""
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully! OTP sent to your email.",
  "userId": "...",
  "email": "test@example.com",
  "requiresOTPVerification": true
}
```

**Error Response (400):**
```json
{
  "message": "User already exists with this email"
}
```

---

#### 2. Verify OTP
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "test@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "message": "Email verified successfully!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "learner",
    "isEmailVerified": true
  }
}
```

**Error Response (400):**
```json
{
  "message": "Incorrect OTP. Please try again.",
  "attemptsRemaining": 4
}
```

---

#### 3. Resend OTP
```http
POST /auth/resend-otp
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "OTP resent successfully to your email",
  "email": "test@example.com"
}
```

---

#### 4. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password@123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "learner",
    "isEmailVerified": true
  }
}
```

**Error Response (403):**
```json
{
  "message": "Email not verified. Please verify your email first.",
  "requiresOTPVerification": true,
  "userId": "...",
  "email": "test@example.com"
}
```

---

## Database Verification

### Check User in MongoDB

```javascript
// In MongoDB Atlas Console
db.users.findOne({ email: "test@example.com" })

// Expected output:
{
  "_id": ObjectId("..."),
  "name": "Test User",
  "email": "test@example.com",
  "password": "$2a$10/...", // bcrypt hash
  "role": "learner",
  "bio": "",
  "isEmailVerified": true,
  "otp": {
    "code": null,
    "expiresAt": null,
    "attempts": 0
  },
  "createdAt": ISODate("2026-01-13T..."),
  "updatedAt": ISODate("2026-01-13T...")
}
```

---

## Common Issues & Solutions

### Issue: OTP Email Not Received

**Check:**
1. Email address typo in signup
2. Check spam/junk folder
3. Verify email credentials in `.env`
4. Check backend logs for email errors

**Solution:**
```bash
# Restart backend with verbose logging
NODE_ENV=development npm start
```

---

### Issue: "Invalid Token" Error

**Causes:**
- Token expired (7-day expiration)
- Wrong JWT_SECRET in backend

**Solution:**
1. Login again to get fresh token
2. Clear localStorage: `localStorage.clear()`
3. Verify JWT_SECRET in `.env` matches backend code

---

### Issue: Redirect Loop

**Causes:**
- localStorage keys not set correctly
- Token valid but `isEmailVerified` = false

**Solution:**
```javascript
// Check localStorage values
console.log('Token:', localStorage.getItem('token'));
console.log('IsEmailVerified:', localStorage.getItem('isEmailVerified'));
console.log('UserEmail:', localStorage.getItem('userEmail'));
```

---

## Security Validation

### ✅ Verify These Security Features

1. **Password Hashing**
   - Password stored as bcrypt hash (starts with `$2a$`)
   - Password never logged or exposed

2. **OTP Hashing**
   - OTP stored as SHA-256 hash
   - Plain OTP only sent in email
   - OTP never logged or exposed

3. **Token Security**
   - JWT with 7-day expiration
   - Token verified on each protected request
   - No sensitive data in token payload

4. **Email Verification**
   - User cannot access dashboard without verification
   - OTP sent via secure email
   - OTP expires after 10 minutes

---

## Performance Testing

### Load Testing Signup
```bash
# Using Apache Bench
ab -n 100 -c 10 -p payload.json \
   -T application/json \
   http://localhost:5000/api/auth/signup
```

### Check Database Performance
```javascript
// MongoDB query to check indexes
db.users.getIndexes()

// Expected: indexes on email field for fast lookups
```

---

## Checklist for Production Readiness

- [ ] All OTP endpoints tested
- [ ] Email delivery verified
- [ ] Protected routes return 403 for unverified users
- [ ] OTP expires correctly after 10 minutes
- [ ] Attempt limit enforced (5 attempts)
- [ ] Password strength validation works
- [ ] Tokens issued only after verification
- [ ] localStorage properly stores verification status
- [ ] Redirect flows work correctly
- [ ] Error messages are user-friendly
- [ ] Database migration completed for existing users
- [ ] Email credentials in `.env` are correct

---

## End-to-End Test Summary

**✅ System is working correctly when:**

1. New user can signup with strong password
2. OTP email arrives within 30 seconds
3. User can verify email with OTP code
4. User is redirected to dashboard after verification
5. Unverified user cannot login
6. Token issued contains `isEmailVerified: true`
7. All protected routes check verification status
8. OTP expires after 10 minutes
9. After 5 wrong attempts, resend is required
10. Logout clears localStorage properly

---

**Last Updated:** January 13, 2026
**System Version:** 2.0 (Strict Verification Enforcement)
   - **Email**: john@example.com
   - **Password**: password123
3. Click **"Enter Dashboard"**

### Step 5: Verify It Worked
- ✅ Should redirect to Dashboard
- ✅ Check localStorage: Open DevTools (F12) → Application → Local Storage
- ✅ Should see: `token`, `userRole`, `userName`

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "User already exists" | Use a different email (add timestamp: john+123@example.com) |
| Blank page after signup | Check console (F12) for errors |
| Backend not responding | Verify backend is running on port 5000 |
| CORS error | Backend CORS is enabled, should work |
| "Invalid credentials" on login | Check email & password match exactly |

---

## 🔍 Check Backend Logs

Watch the backend terminal - you should see:
```
POST /api/auth/signup
POST /api/auth/login
```

---

## 📊 MongoDB Verification

1. Go to [atlas.mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Click "Browse Collections"
3. Navigate to `tutoring-db` → `users`
4. You should see your created user with:
   - name: "John Doe"
   - email: "john@example.com"
   - password: (hashed/encrypted)
   - role: "tutor" or "learner"
   - timestamps

---

## 💾 Test Data Created

After signup, you'll have:
```javascript
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john@example.com",
  password: "$2a$10$...", // bcryptjs hashed
  role: "tutor",
  bio: "",
  createdAt: ISODate("2026-01-12T12:30:00Z"),
  updatedAt: ISODate("2026-01-12T12:30:00Z"),
  __v: 0
}
```

---

## ✨ Try Different Scenarios

### Scenario 1: Multiple Users
1. Signup with: alice@example.com (role: learner)
2. Signup with: bob@example.com (role: tutor)
3. Both should work and redirect

### Scenario 2: Login with Different User
1. Signup with: alice@example.com
2. Logout (clear localStorage or close browser)
3. Go to login
4. Login with: alice@example.com
5. Should redirect to learner dashboard

### Scenario 3: Wrong Password
1. Login with correct email
2. Wrong password
3. Should show error: "Invalid email or password"

### Scenario 4: Non-existent Email
1. Login with: nonexistent@example.com
2. Should show error: "Invalid email or password"

---

## 🔐 Security Check

✅ Your system has:
- Passwords hashed with bcryptjs
- JWT tokens for authentication
- Password stored securely
- Token expires in 7 days

⚠️ Future improvements:
- Email verification
- Password reset
- 2-factor authentication
- Rate limiting

---

## 📈 Flow Diagram

```
Signup Flow:
────────────────────────
User fills form
    ↓
Validates passwords match
    ↓
POST /api/auth/signup
    ↓
Backend hashes password
    ↓
Saves to MongoDB
    ↓
Generates JWT token
    ↓
Returns token + user data
    ↓
Frontend stores in localStorage
    ↓
Redirects to dashboard ✅

Login Flow:
────────────────────────
User enters email & password
    ↓
POST /api/auth/login
    ↓
Backend finds user by email
    ↓
Compares password with hash
    ↓
Match? Yes → Generate JWT token
    ↓
Returns token + user data
    ↓
Frontend stores in localStorage
    ↓
Redirects to dashboard ✅
```

---

## 🎯 Next Steps After Testing

1. **Test all error scenarios** (wrong password, duplicate email, etc.)
2. **Check MongoDB** to verify data
3. **Test dashboard redirects** (tutor vs learner)
4. **Add more features**:
   - Profile page
   - Logout functionality
   - Update profile
   - Password reset

---

## 📝 Test Checklist

- [ ] Signup works
- [ ] User saved in MongoDB
- [ ] Token generated and stored
- [ ] Redirects to correct dashboard
- [ ] Login works with same user
- [ ] Wrong password shows error
- [ ] Different role redirects correctly
- [ ] DevTools shows token in localStorage

---

## 🎉 Success Criteria

Your signup/login is working when:
1. ✅ Can create new account
2. ✅ Data appears in MongoDB
3. ✅ Token stored in localStorage
4. ✅ Can login with correct credentials
5. ✅ Wrong password shows error
6. ✅ Redirects to correct dashboard based on role

**Start testing now!** 🚀
