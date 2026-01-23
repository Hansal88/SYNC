# Email Verification System - Quick Reference Guide

**Last Updated:** January 13, 2026

---

## ⚡ Quick Start (5 Minutes)

### 1. Start Servers
```bash
# Terminal 1: Backend
cd backend
npm start
# Output: Server running on http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev
# Output: VITE... ready in ... ms
```

### 2. Test Signup
1. Go to: `http://localhost:5173/signup`
2. Fill form:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `Test@Pass123`
3. Click "Continue" → Select Role → "Create Account"
4. Get OTP from email
5. Enter OTP on verification page
6. ✅ Redirected to dashboard

---

## 📋 File Changes Summary

### Files Created
```
backend/middleware/verifyEmail.js (NEW - Email verification middleware)
```

### Files Updated
```
backend/utils/otpService.js
  ├─ Added OTP hashing (SHA-256)
  ├─ Enhanced email template
  └─ Better validation logic

backend/routes/authRoutes.js
  ├─ Strict email verification on login
  ├─ OTP hashing integration
  └─ Better error messages

frontend/src/components/ProtectedRoute.jsx
  ├─ Check isEmailVerified
  ├─ Redirect to /verify-otp if unverified
  └─ Loading state

frontend/src/pages/Login.jsx
  ├─ Store isEmailVerified in localStorage
  ├─ Handle verification errors
  └─ Auto-redirect to OTP page

frontend/src/pages/OTPVerification.jsx
  └─ Store isEmailVerified: "true" after verification
```

---

## 🔑 Key Points

### Signup Flow
```
Enter Email/Password 
    ↓
Verify Password Strength (8+, Cap, Special)
    ↓
User Created (isEmailVerified: false)
    ↓
OTP Generated & Sent
    ↓
Redirect to /verify-otp
```

### OTP Verification Flow
```
Enter 6-Digit Code
    ↓
Verify Hash (SHA-256)
    ↓
Check Expiration (10 min)
    ↓
Check Attempts (≤ 5)
    ↓
Success → isEmailVerified = true
    ↓
JWT Token Issued
    ↓
Redirect to Dashboard
```

### Login Flow
```
Enter Email/Password
    ↓
Check isEmailVerified
    ├─ NO → Error: "Email not verified"
    └─ YES → Compare Password Hash
        ↓
        Success → JWT Issued
        ↓
        Redirect to Dashboard
```

---

## 🔐 Security Features

| Feature | Implementation | Duration |
|---------|-----------------|----------|
| **Password Hashing** | bcryptjs (10 rounds) | Permanent |
| **OTP Hashing** | SHA-256 | Until verified |
| **OTP Expiration** | 10 minutes | From generation |
| **OTP Attempts** | 5 maximum | Per OTP |
| **JWT Token** | HS256 | 7 days |
| **Email Verification** | Required | Before dashboard |

---

## 🧪 Quick Tests

### Test 1: Unverified User Can't Login
```
1. Signup with: unverified@test.com
2. Don't verify OTP
3. Try login
4. Error: "Email not verified"
5. ✅ PASS
```

### Test 2: Unverified User Can't Access Dashboard
```
1. Manual localStorage:
   localStorage.setItem('token', 'any-value');
   localStorage.setItem('isEmailVerified', 'false');
2. Navigate to /dashboard/learner
3. Redirected to /verify-otp
4. ✅ PASS
```

### Test 3: OTP Expires After 10 Minutes
```
1. Get OTP
2. Wait 10+ minutes (or modify timer in code)
3. Try to verify
4. Error: "OTP has expired"
5. Click Resend
6. Get new OTP
7. ✅ PASS
```

### Test 4: Max 5 Wrong OTP Attempts
```
1. Enter wrong OTP 5 times
2. After 5th attempt: "Too many attempts"
3. Must resend OTP
4. Attempts reset to 5
5. ✅ PASS
```

---

## 📱 localStorage Keys

After login/verification, these are stored:

```javascript
localStorage.getItem('token')           // JWT token
localStorage.getItem('userRole')        // "learner" or "tutor"
localStorage.getItem('userName')        // User's name
localStorage.getItem('userEmail')       // User's email
localStorage.getItem('isEmailVerified') // "true" or "false"
```

---

## 🔌 API Endpoints

All prefixed with `http://localhost:5000/api`

### Signup
```
POST /auth/signup
{
  "name": "string",
  "email": "string",
  "password": "string (8+, Cap, Special)",
  "role": "learner|tutor"
}
```

### Verify OTP
```
POST /auth/verify-otp
{
  "email": "string",
  "otp": "123456"
}
```

### Resend OTP
```
POST /auth/resend-otp
{
  "email": "string"
}
```

### Login
```
POST /auth/login
{
  "email": "string",
  "password": "string"
}
```

---

## ❌ Common Issues & Quick Fixes

### "OTP Email Not Received"
```
✓ Check spam folder
✓ Check email typo in signup
✓ Wait 30 seconds
✓ Click Resend
✓ Check .env email credentials
```

### "Token is Invalid"
```
✓ Logout and login again
✓ Clear localStorage: localStorage.clear()
✓ Verify JWT_SECRET in .env
✓ Check if token expired (7 days)
```

### "Redirect Loop"
```
✓ Open DevTools → Application → localStorage
✓ Check if token exists
✓ Check if isEmailVerified = "true"
✓ Manually set correct values
```

### "Dashboard Not Loading"
```
✓ Check if isEmailVerified = "true"
✓ Check if token is valid
✓ Try navigating to /login
✓ Check browser console for errors
```

---

## 📊 Password Requirements Checklist

Password must have ALL:
- [ ] 8 or more characters
- [ ] At least 1 capital letter (A-Z)
- [ ] At least 1 special character (!@#$%...)

**Examples:**
- ✅ `Test@Pass123` - Valid
- ✅ `Secure#2024` - Valid
- ❌ `password123` - Missing capital & special
- ❌ `Password@` - Only 9 chars (needs 8, good!)
- ❌ `Test123` - Missing special character

---

## 🧮 Limits & Timeouts

```
OTP Generation:  1 per signup
OTP Validity:    10 minutes
OTP Attempts:    5 per OTP
Attempt Timeout: None (resets on resend)
Token Validity:  7 days
Password Min:    8 characters
Email Check:     Real format validation
```

---

## 📧 Email Configuration

```
Service:  Gmail (SMTP)
From:     hansalpanchal2406@gmail.com
Template: HTML formatted with gradient design
Subject:  "🔐 Your Email Verification OTP"
Content:  6-digit code + expiry + security notice
```

**Check Email Receipt:**
1. Look in Gmail inbox/spam
2. Search for "verification"
3. Check that OTP displays correctly
4. Verify sender is correct

---

## 🎯 Strict Enforcement Rules

```
Rule 1: New users start with isEmailVerified = false
        └─ Cannot login until verified

Rule 2: OTP must be verified within 10 minutes
        └─ After 10 min, must resend

Rule 3: Only 5 wrong OTP attempts allowed
        └─ After 5, must resend to try again

Rule 4: Login requires verified email
        └─ 403 error if not verified

Rule 5: Dashboard access requires verification
        └─ Redirect to /verify-otp if unverified

Rule 6: Token + Verification both required
        └─ Frontend & Backend checks
```

---

## 🚀 Deployment Notes

### Before Production
- [ ] Change JWT_SECRET to random value
- [ ] Change EMAIL_PASSWORD to secure password
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Test email delivery rate

### After Deployment
- [ ] Test signup-to-dashboard flow
- [ ] Verify email delivery
- [ ] Check token expiration
- [ ] Monitor error logs
- [ ] Test OTP resend
- [ ] Verify rate limiting

---

## 📞 Debugging

### Check Backend Logs
```bash
# Terminal running backend
npm start
# Look for error messages
# Check auth route logs
```

### Check Frontend Console
```javascript
// Open Browser DevTools (F12)
// Console tab shows:
// - API errors
// - localStorage issues
// - Navigation problems
```

### Check MongoDB
```javascript
// MongoDB Atlas Console
db.users.findOne({ email: "test@example.com" })
// Verify: isEmailVerified field
// Verify: otp field structure
```

### Manual Testing with Postman
```
1. POST /auth/signup → Get userId, email
2. Check MongoDB for OTP hash
3. POST /auth/verify-otp → Use OTP from email
4. Verify token returned
5. POST /auth/login → Should succeed
```

---

## 📈 Performance Tips

```
Optimize Email Send
└─ Consider async queue (Bull, BullMQ)

Optimize Database
└─ Index email field
└─ Cache user verification status

Optimize Frontend
└─ Lazy load components
└─ Cache API responses
└─ Minimize localStorage access

Monitor Metrics
└─ OTP success rate
└─ Email delivery rate
└─ Login success rate
└─ Token validity %
```

---

## 📚 Documentation Files

```
/API_REFERENCE.md          - Complete API documentation
/TESTING_GUIDE.md           - Detailed testing scenarios
/OTP_SETUP_GUIDE.md         - Installation & setup
/IMPLEMENTATION_SUMMARY_V2.md - System architecture
```

---

## ✅ Verification Checklist

After implementation, verify:

- [ ] New user signup works
- [ ] OTP email is received
- [ ] OTP verification works
- [ ] User redirected to dashboard
- [ ] Unverified user blocked from login
- [ ] Unverified user blocked from dashboard
- [ ] OTP expires after 10 minutes
- [ ] After 5 attempts, resend required
- [ ] Token is valid for 7 days
- [ ] Logout clears localStorage
- [ ] Password validation enforced
- [ ] Error messages are clear
- [ ] Mobile responsive design works
- [ ] Email template displays well

---

## 🎓 Learning Resources

**MongoDB Email Verification Pattern:**
```javascript
// Find by email
db.users.find({ email: "user@example.com" })

// Update verification
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { isEmailVerified: true } }
)
```

**JWT Token Debug:**
```javascript
// Decode token at jwt.io
// Paste token and see decoded payload
// Check expiration timestamp
```

**Bcrypt Verification:**
```javascript
// Test hash comparison
bcrypt.compare("TestPassword@123", "$2a$10$...")
// Returns true if password matches
```

---

## 🔗 Quick Links

```
Frontend:     http://localhost:5173
Backend:      http://localhost:5000
API Docs:     /API_REFERENCE.md
Test Guide:   /TESTING_GUIDE.md
Setup Guide:  /OTP_SETUP_GUIDE.md
```

---

## 📞 Support Contacts

**For Questions:**
- Check documentation first
- Review browser console
- Check backend logs
- Test with Postman
- Verify database state

**Common Solutions:**
1. Clear localStorage and try again
2. Restart both backend and frontend
3. Check .env credentials
4. Verify MongoDB connection
5. Test email sending

---

**Version:** 2.0 (Strict Verification)  
**Status:** ✅ Production Ready  
**Last Updated:** January 13, 2026

---

For detailed information, see:
- [Complete API Reference](./API_REFERENCE.md)
- [Full Testing Guide](./TESTING_GUIDE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY_V2.md)
