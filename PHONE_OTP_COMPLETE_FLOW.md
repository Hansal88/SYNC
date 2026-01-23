# Phone OTP Integration - Complete User Flow (Updated)

## Registration Flow Sequence

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION FLOW                           │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: SIGNUP
├─ User enters: Name, Email, Phone (+91XXXXXXXXXX), Password
├─ Phone stored in formData
└─ Redirects to: /verify-otp

STEP 2: EMAIL OTP VERIFICATION
├─ User receives 6-digit OTP to email
├─ User enters OTP in 6 input boxes
├─ Backend verifies OTP, creates user, returns token
├─ localStorage: token, userId, isEmailVerified=true, isPhoneVerified=false
├─ Phone number passed via location.state
└─ Redirects to: /verify-phone-otp (fromSignup=true)

STEP 3: PHONE OTP VERIFICATION
├─ Phone number pre-filled from signup or location state
├─ User receives SMS OTP to phone number
├─ User enters 6-digit OTP
├─ Backend verifies phone OTP, updates user.isPhoneVerified
├─ localStorage: isPhoneVerified=true
└─ Redirects to: /role-selection (fromPhoneOTP=true)

STEP 4: ROLE SELECTION
├─ User selects: Learner OR Tutor
├─ If Tutor: Select programming languages and technical skills
├─ Backend updates user role and skills
├─ localStorage: userRole, tutorSkills, tutorLanguages (if tutor)
└─ Redirects to: /TutorDashboard OR /dashboard/learner

STEP 5: DASHBOARD ACCESS
└─ User is now fully registered with:
   ✅ Email verified
   ✅ Phone verified
   ✅ Role selected
   ✅ Skills selected (if tutor)

```

## New Route Additions

### Created Files:
- `frontend/src/pages/RoleSelection.jsx` - Handles role and skill selection

### Updated Files:
- `frontend/src/pages/Signup.jsx` - Added phone pass-through to OTP page
- `frontend/src/pages/OTPVerification.jsx` - Redirects to phone OTP after email verification
- `frontend/src/pages/PhoneOTPVerification.jsx` - Redirects to role selection after phone verification
- `frontend/src/App.jsx` - Added RoleSelection import and `/role-selection` route

## Route Map

```
Public Routes:
  / ...................... HomePage
  /login .................. Login
  /signup ................. Signup
  /verify-otp ............. OTPVerification (Email OTP)
  /verify-phone-otp ....... PhoneOTPVerification (Phone OTP)
  /role-selection ......... RoleSelection (NEW!)
  /chat ................... Chat
  /tutors ................. TutorsList
  
Protected Routes:
  /TutorDashboard ......... TutorDashboard (requires: email + phone verified)
  /dashboard/learner ...... LearnerDashboard (requires: email + phone verified)
```

## Data Flow Through Registration

### Signup → Email OTP
```javascript
// Signup.jsx
navigate("/verify-otp", { 
  state: { 
    email: trimmedEmail,
    userId: userId,
    phone: formData.phone,  // ← Phone passed
    isSignup: true
  }
});

// localStorage
pendingEmail: "user@example.com"
pendingUserId: "user123"
pendingPhone: "+91XXXXXXXXXX"  // ← Stored for next step
```

### Email OTP → Phone OTP
```javascript
// OTPVerification.jsx - After verification
navigate("/verify-phone-otp", { 
  replace: true,
  state: { 
    fromSignup: true,
    email: email,
    phone: phone,  // ← Phone passed
    userId: response.data.user._id
  }
});

// localStorage
token: "JWT_TOKEN"
userId: "user123"
userRole: "learner"  // default role
isEmailVerified: "true"  // ← Email marked verified
isPhoneVerified: "false"  // ← Phone not yet verified
```

### Phone OTP → Role Selection
```javascript
// PhoneOTPVerification.jsx - After verification
navigate('/role-selection', { 
  replace: true,
  state: { fromPhoneOTP: true }
});

// localStorage
isPhoneVerified: "true"  // ← Phone marked verified
```

### Role Selection → Dashboard
```javascript
// RoleSelection.jsx - After role selection
localStorage.setItem('userRole', selectedRole);
if (selectedRole === 'tutor') {
  localStorage.setItem('tutorSkills', JSON.stringify(skills));
  localStorage.setItem('tutorLanguages', JSON.stringify(languages));
}

navigate(selectedRole === 'tutor' ? '/TutorDashboard' : '/dashboard/learner', { 
  replace: true 
});
```

## Protected Route Check

```javascript
// ProtectedRoute.jsx
const isEmailVerified = localStorage.getItem('isEmailVerified') === 'true';
const isPhoneVerified = localStorage.getItem('isPhoneVerified') === 'true';

if (!isEmailVerified) {
  return <Navigate to="/verify-otp" />;
}

if (!isPhoneVerified) {
  return <Navigate to="/verify-phone-otp" />;
}

// Both verified - allow access to dashboard
return <Outlet />;
```

## Testing Checklist

- [ ] **Signup Flow**
  - [ ] Enter valid email and phone (+91XXXXXXXXXX format)
  - [ ] Verify phone field is passed through to next steps
  - [ ] Phone stored in localStorage as pendingPhone

- [ ] **Email OTP Step**
  - [ ] Receive OTP email
  - [ ] Enter OTP successfully
  - [ ] Redirected to phone OTP verification page
  - [ ] Phone number pre-filled (or available from state)

- [ ] **Phone OTP Step**
  - [ ] Receive OTP SMS (after Twilio credentials added)
  - [ ] Enter OTP successfully
  - [ ] isPhoneVerified marked as true
  - [ ] Redirected to role selection

- [ ] **Role Selection**
  - [ ] Can select Learner role
  - [ ] Can select Tutor role
  - [ ] If Tutor: can select multiple languages and skills
  - [ ] Role saved to localStorage
  - [ ] Redirected to appropriate dashboard

- [ ] **Dashboard Access**
  - [ ] Can access dashboard after completing all steps
  - [ ] ProtectedRoute allows access when both verified
  - [ ] Correct dashboard shown based on role (Tutor vs Learner)

## What's Next?

1. **Get Twilio Credentials**
   - Visit https://www.twilio.com/console
   - Copy Account SID and Auth Token
   - Purchase/verify a phone number
   - Add to backend/.env

2. **Test Backend Endpoints**
   - Use Phone_OTP_Postman_Collection.json
   - Test send, verify, and resend endpoints
   - Verify SMS delivery works

3. **Test Complete Flow**
   - Go through entire signup → email → phone → role → dashboard
   - Verify redirects work correctly
   - Confirm both verifications required for dashboard access

4. **Optional Enhancements**
   - Add phone field validation in Signup form
   - Show formatted phone in profile
   - Allow phone number changes with re-verification
