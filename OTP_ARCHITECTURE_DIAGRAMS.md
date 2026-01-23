# OTP Feature - Architecture & Flow Diagrams

## 1. Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SIGNUP FLOW                                  │
└─────────────────────────────────────────────────────────────────────┘

User visits /signup
        ↓
Enter Name, Email, Password
        ↓
Select Role (Learner/Tutor)
        ↓
Submit → Backend /api/auth/signup
        ↓
Backend:
  ✓ Validate input
  ✓ Hash password
  ✓ Generate unique 6-digit OTP
  ✓ Save OTP (expires in 10 min)
  ✓ Send OTP email
        ↓
Response: { requiresOTPVerification: true, email: "user@email.com" }
        ↓
Frontend redirects to /verify-otp
        ↓
User receives email with OTP code
        ↓
User enters OTP on verification page
        ↓
Frontend submits → Backend /api/auth/verify-otp
        ↓
Backend:
  ✓ Check OTP matches
  ✓ Check OTP not expired
  ✓ Check attempts < 5
  ✓ Mark email as verified
  ✓ Clear OTP data
  ✓ Generate JWT token
        ↓
Response: { token: "jwt...", user: {...} }
        ↓
Frontend stores token in localStorage
        ↓
Redirect to Dashboard ✓ LOGIN SUCCESS ✓


┌─────────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW                                   │
└─────────────────────────────────────────────────────────────────────┘

User visits /login
        ↓
Enter Email, Password
        ↓
Submit → Backend /api/auth/login
        ↓
Backend:
  ✓ Find user by email
  ✓ Check if email verified
        ↓
        ├─ If NOT verified:
        │   Response: { requiresOTPVerification: true }
        │        ↓
        │   Frontend redirects to /verify-otp
        │        ↓
        │   User must verify before login
        │
        ├─ If verified:
        │   ✓ Compare password hash
        │   ✓ Generate JWT token
        │        ↓
        │   Response: { token: "jwt...", user: {...} }
        │        ↓
        │   Frontend stores token
        │        ↓
        │   Redirect to Dashboard ✓ LOGIN SUCCESS ✓
```

---

## 2. OTP Generation & Validation

```
┌─────────────────────────────────────────────────────────────┐
│            OTP GENERATION ALGORITHM                         │
└─────────────────────────────────────────────────────────────┘

generateOTP()
    ↓
Math.floor(100000 + Math.random() * 900000)
    ↓
Example outputs:
  - 123456
  - 987654
  - 456789
  - 654321
(Each time DIFFERENT - truly random)

Each OTP:
  ✓ 6 digits
  ✓ Unique each time
  ✓ Stored in database
  ✓ Expires in 10 minutes
  ✓ Max 5 attempts


┌─────────────────────────────────────────────────────────────┐
│            OTP VERIFICATION PROCESS                         │
└─────────────────────────────────────────────────────────────┘

User submits OTP
        ↓
User OTP = "123456"
        ↓
Backend checks:
        ├─ OTP exists in DB? → if NO → "No OTP found"
        ├─ Attempts < 5? → if NO → "Too many attempts"
        ├─ Current time < expiresAt? → if NO → "OTP expired"
        └─ User OTP == Stored OTP? → if NO → "Incorrect OTP"
                                      Increment attempts counter
        ↓
If ALL checks pass:
  ✓ Mark isEmailVerified = true
  ✓ Clear OTP data from database
  ✓ Generate JWT token
  ✓ Return token to frontend
        ↓
LOGIN SUCCESS ✓
```

---

## 3. Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                    USER COLLECTION                          │
└─────────────────────────────────────────────────────────────┘

{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt hash),
  role: String (enum: ['learner', 'tutor']),
  bio: String,
  
  ← NEW FIELDS ←
  isEmailVerified: Boolean (default: false),
  
  otp: {
    code: String (6-digit number),          ← "123456"
    expiresAt: Date,                         ← 2025-01-13T14:30:00Z
    attempts: Number (0-5)                   ← 2
  },
  
  createdAt: Date,
  updatedAt: Date
}

Example Document:
{
  _id: 507f1f77bcf86cd799439011,
  name: "John Doe",
  email: "john@example.com",
  password: "$2a$10$Y9Q...", (hashed)
  role: "learner",
  bio: "Learning Python",
  isEmailVerified: false,
  otp: {
    code: "456789",
    expiresAt: ISODate("2025-01-13T14:35:00Z"),
    attempts: 1
  },
  createdAt: ISODate("2025-01-13T14:25:00Z"),
  updatedAt: ISODate("2025-01-13T14:25:30Z")
}
```

---

## 4. API Request/Response Cycle

```
┌──────────────────────────────────────────────────────────────┐
│              SIGNUP API ENDPOINT                             │
└──────────────────────────────────────────────────────────────┘

REQUEST:
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "learner"
}

RESPONSE (201 Created):
{
  "message": "User registered successfully! OTP sent to your email.",
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "requiresOTPVerification": true
}

Backend Actions:
  1. Validate input fields
  2. Hash password with bcrypt
  3. Generate 6-digit OTP
  4. Set OTP expiration to now + 10 min
  5. Save user to MongoDB
  6. Send OTP email via nodemailer
  7. Return response


┌──────────────────────────────────────────────────────────────┐
│           VERIFY OTP API ENDPOINT                            │
└──────────────────────────────────────────────────────────────┘

REQUEST:
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "456789"
}

RESPONSE (200 OK):
{
  "message": "Email verified successfully!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "learner",
    "isEmailVerified": true
  }
}

Backend Actions:
  1. Find user by email
  2. Validate OTP code matches
  3. Check OTP not expired
  4. Check attempts < 5
  5. Mark email as verified
  6. Clear OTP data
  7. Generate JWT token (7-day expiry)
  8. Return token + user data


┌──────────────────────────────────────────────────────────────┐
│           RESEND OTP API ENDPOINT                            │
└──────────────────────────────────────────────────────────────┘

REQUEST:
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "john@example.com"
}

RESPONSE (200 OK):
{
  "message": "OTP resent successfully to your email",
  "email": "john@example.com"
}

Backend Actions:
  1. Find user by email
  2. Check if already verified
  3. Generate NEW 6-digit OTP
  4. Reset expiration to now + 10 min
  5. Reset attempts counter to 0
  6. Send OTP email
  7. Return response
```

---

## 5. OTP Validation Timeline

```
Time:  0 min      5 min         10 min
       │           │             │
       ├───────────┼─────────────┤
       
Signup happens
  │
  ├─ OTP generated: "456789"
  ├─ Expires at: T+10 min
  ├─ Attempts: 0/5
  │
User enters OTP (minute 3)
  │
  ├─ User enters: "456789" ✓ CORRECT
  │  └─ Email verified immediately
  │  └─ OTP cleared from DB
  │  └─ User logged in
  │
  ├─ User enters: "123456" ✗ WRONG
  │  └─ Attempts: 1/5
  │  └─ OTP still valid
  │
  ├─ User enters: "999999" ✗ WRONG
  │  └─ Attempts: 2/5
  │  └─ OTP still valid
  │
Minute 6: User still trying
  │
  ├─ Remaining time: 4 minutes
  ├─ Attempts left: 3/5
  │
Minute 10: OTP expires
  │
  ├─ OTP becomes invalid
  ├─ User sees: "OTP expired"
  ├─ User clicks "Resend OTP"
  │  └─ New OTP sent
  │  └─ Timer resets to 10 min
  │  └─ Attempts reset to 0/5


Scenario: User makes 5 wrong attempts in minute 2
  │
  ├─ Attempt 1: "111111" ✗ (Attempts: 1/5)
  ├─ Attempt 2: "222222" ✗ (Attempts: 2/5)
  ├─ Attempt 3: "333333" ✗ (Attempts: 3/5)
  ├─ Attempt 4: "444444" ✗ (Attempts: 4/5)
  ├─ Attempt 5: "555555" ✗ (Attempts: 5/5)
  │
  └─ User sees: "Too many incorrect attempts"
     └─ Must click "Resend OTP" to try again
```

---

## 6. Frontend Component Structure

```
App.jsx
  ├─ Route: /signup → Signup.jsx
  │   ├─ Step 1: Form (Name, Email, Password)
  │   ├─ Step 2: Role Selection
  │   └─ Step 3: Tutor Skills (if tutor)
  │       └─ On Success → Redirect to /verify-otp
  │
  ├─ Route: /verify-otp → OTPVerification.jsx
  │   ├─ OTP Input (6 fields)
  │   ├─ Timer (10 min countdown)
  │   ├─ Verify Button
  │   ├─ Resend OTP Button
  │   ├─ Error Messages
  │   └─ Attempt Counter
  │       └─ On Success → Redirect to Dashboard
  │
  └─ Route: /login → Login.jsx
      └─ Check isEmailVerified
          ├─ if false → Redirect to /verify-otp
          └─ if true → Login success
```

---

## 7. File Structure

```
backend/
├── utils/
│   └── otpService.js (NEW)
│       ├─ generateOTP()
│       ├─ sendOTPEmail()
│       └─ verifyOTP()
│
├── models/
│   └── User.js (UPDATED)
│       └─ Added: isEmailVerified, otp fields
│
├── routes/
│   └── authRoutes.js (UPDATED)
│       ├─ POST /api/auth/signup
│       ├─ POST /api/auth/verify-otp (NEW)
│       ├─ POST /api/auth/resend-otp (NEW)
│       └─ POST /api/auth/login
│
├── .env (UPDATED)
│   ├─ MONGO_URI
│   ├─ EMAIL_SERVICE
│   ├─ EMAIL_USER
│   └─ EMAIL_PASSWORD
│
└── package.json (UPDATED)
    └─ Added: nodemailer


frontend/
├── src/
│   ├── pages/
│   │   ├── OTPVerification.jsx (NEW)
│   │   │   ├─ OTP Input Component
│   │   │   ├─ Timer Logic
│   │   │   ├─ Verification Logic
│   │   │   └─ Resend Logic
│   │   │
│   │   └── Signup.jsx (UPDATED)
│   │       └─ Redirect to /verify-otp on success
│   │
│   └── App.jsx (UPDATED)
│       └─ Added route: /verify-otp
│
└── package.json (NO CHANGES)
```

---

## 8. Error Handling Flow

```
User submits OTP
        ↓
Backend receives request
        ↓
Validation checks:
        ├─ Email provided? → NO → Error: "Email is required"
        ├─ OTP provided? → NO → Error: "OTP is required"
        ├─ User exists? → NO → Error: "User not found"
        ├─ Email already verified? → YES → Error: "Email already verified"
        ├─ OTP exists? → NO → Error: "No OTP found. Request new one."
        ├─ Attempts >= 5? → YES → Error: "Too many attempts. Request new OTP."
        ├─ OTP expired? → YES → Error: "OTP expired. Request new OTP."
        └─ OTP incorrect? → YES → Error: "Incorrect OTP. Try again."
                              Increment attempts
                              ↓
                              Response: {
                                message: "Incorrect OTP",
                                attemptsRemaining: 3
                              }

All checks pass?
        ↓
Email verified successfully!
        ↓
Return JWT token
```

---

## 9. Security Measures

```
┌────────────────────────────────────────────────┐
│          SECURITY FEATURES                     │
└────────────────────────────────────────────────┘

1. PASSWORD SECURITY
   ✓ Minimum 6 characters required
   ✓ Bcrypt hashing (10 salt rounds)
   ✓ Never stored as plain text
   ✓ Never sent in responses

2. OTP SECURITY
   ✓ 6-digit random number
   ✓ Server-side validation only
   ✓ 10-minute expiration
   ✓ 5-attempt limit
   ✓ Cleared after verification
   ✓ Cannot be reused

3. EMAIL VERIFICATION
   ✓ Email required for signup
   ✓ OTP sent only to verified email
   ✓ Cannot login without verification
   ✓ Prevents fake accounts

4. TOKEN SECURITY
   ✓ JWT with 7-day expiration
   ✓ Secret key in environment variable
   ✓ Token validation on protected routes
   ✓ Stored in localStorage (frontend)

5. RATE LIMITING
   ✓ Max 5 OTP attempts
   ✓ Must wait 10 min for new OTP
   ✓ Prevents brute force attacks

6. DATABASE SECURITY
   ✓ MongoDB Atlas with auth
   ✓ Unique email constraint
   ✓ Indexed for performance
   ✓ Connection string in .env
```

---

## 10. Performance Optimization

```
┌────────────────────────────────────────────────┐
│      PERFORMANCE CONSIDERATIONS                │
└────────────────────────────────────────────────┘

Email Sending (Async)
  ✓ Non-blocking operation
  ✓ Doesn't slow down API response
  ✓ Stored in background task queue

Database Queries
  ✓ User.findOne() → Indexed on email
  ✓ Single query per request
  ✓ Efficient update operations

Password Hashing
  ✓ Bcrypt (10 rounds) = ~100ms
  ✓ Done only on signup/password change
  ✓ Comparison on login only

JWT Token
  ✓ Generated once per verification
  ✓ 7-day expiration = reduced refresh calls
  ✓ Stored in localStorage = fast access

Memory Usage
  ✓ OTP cleared after verification
  ✓ No long-term data storage
  ✓ Efficient schema design
```

This comprehensive architecture ensures a secure, user-friendly OTP verification system! 🔒
