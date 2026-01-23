# Email Verification System - Complete API Reference

## Authentication Endpoints

All authentication endpoints are prefixed with `/api/auth`

---

## 1. User Signup

**Endpoint:** `POST /auth/signup`

**Purpose:** Register a new user and send OTP to their email

### Request

```http
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "role": "learner",
  "bio": "Optional bio text"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | String | Yes | User's full name (1-100 chars) |
| `email` | String | Yes | Valid email address |
| `password` | String | Yes | Min 8 chars, 1 capital, 1 special char |
| `role` | String | Yes | Either "learner" or "tutor" |
| `bio` | String | No | User biography (tutors) |

### Password Requirements

- **Minimum 8 characters**
- **At least one uppercase letter (A-Z)**
- **At least one special character (!@#$%^&*()_+\-=[]{}...)**

Examples:
- ✅ `TestPassword@123` - Valid
- ✅ `Secure#Pass2024` - Valid
- ❌ `password123` - No capital letter
- ❌ `Password123` - No special character
- ❌ `Test@12` - Too short (7 chars)

### Success Response (201 Created)

```json
{
  "message": "User registered successfully! OTP sent to your email.",
  "userId": "67a1b2c3d4e5f6g7h8i9j0k1",
  "email": "john@example.com",
  "requiresOTPVerification": true
}
```

**What Happens:**
1. Validates input data
2. Checks email uniqueness
3. Hashes password with bcryptjs
4. Generates 6-digit OTP
5. Saves user with `isEmailVerified: false`
6. Sends OTP email (10-minute validity)
7. Returns success response

### Error Responses

#### 400 - Invalid Input

```json
{
  "message": "Password must be at least 8 characters long"
}
```

**Possible Messages:**
- "Name is required"
- "Email is required"
- "Password is required"
- "Invalid email format"
- "Password must contain at least one capital letter (A-Z)"
- "Password must contain at least one special character"

#### 400 - User Already Exists

```json
{
  "message": "User already exists with this email"
}
```

#### 500 - Server Error

```json
{
  "message": "User created but failed to send OTP email. Please contact support.",
  "email": "john@example.com"
}
```

---

## 2. Verify OTP

**Endpoint:** `POST /auth/verify-otp`

**Purpose:** Verify user's email with OTP code and issue JWT token

### Request

```http
POST http://localhost:5000/api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | String | Yes | User's email address |
| `otp` | String | Yes | 6-digit OTP from email |

### Success Response (200 OK)

```json
{
  "message": "Email verified successfully!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2ExYjJjM2Q0ZTVmNmc3aDhpOWowazEiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoibGVhcm5lciIsImlhdCI6MTcwMzAwMDAwMCwiZXhwIjoxNzAzNjAwMDAwfQ.signature",
  "user": {
    "id": "67a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "learner",
    "isEmailVerified": true
  }
}
```

**Token Details:**
- **Type:** JWT (JSON Web Token)
- **Algorithm:** HS256
- **Expiration:** 7 days
- **Payload Contains:**
  - `userId` - User ID in database
  - `email` - User email
  - `role` - "learner" or "tutor"
  - `iat` - Issued at timestamp
  - `exp` - Expiration timestamp

**What Happens:**
1. Finds user by email
2. Verifies OTP against hashed value
3. Checks OTP expiration (10 minutes)
4. Checks attempt limit (max 5)
5. Marks user as `isEmailVerified: true`
6. Clears OTP data from database
7. Issues JWT token
8. Returns user data

### Error Responses

#### 400 - Wrong OTP

```json
{
  "message": "Incorrect OTP. Please try again.",
  "attemptsRemaining": 4
}
```

#### 400 - OTP Expired

```json
{
  "message": "OTP has expired. Please request a new one.",
  "expired": true
}
```

#### 400 - Too Many Attempts

```json
{
  "message": "Too many incorrect attempts. Please request a new OTP.",
  "attemptsRemaining": 0
}
```

#### 400 - Already Verified

```json
{
  "message": "Email is already verified. Please login."
}
```

#### 404 - User Not Found

```json
{
  "message": "User not found"
}
```

---

## 3. Resend OTP

**Endpoint:** `POST /auth/resend-otp`

**Purpose:** Resend OTP code to user's email (resets attempts)

### Request

```http
POST http://localhost:5000/api/auth/resend-otp
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | String | Yes | User's email address |

### Success Response (200 OK)

```json
{
  "message": "OTP resent successfully to your email",
  "email": "john@example.com"
}
```

**What Happens:**
1. Finds user by email
2. Generates new OTP
3. Resets attempts to 0
4. Sets new expiration (10 minutes)
5. Sends email with new OTP
6. Returns success response

### Error Responses

#### 404 - User Not Found

```json
{
  "message": "User not found"
}
```

#### 400 - Already Verified

```json
{
  "message": "Email is already verified. Please login."
}
```

#### 500 - Email Service Error

```json
{
  "message": "Failed to send OTP email"
}
```

---

## 4. User Login

**Endpoint:** `POST /auth/login`

**Purpose:** Authenticate user and return JWT token (requires verified email)

### Request

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | String | Yes | User's email address |
| `password` | String | Yes | User's password |

### Success Response (200 OK)

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "67a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "learner",
    "isEmailVerified": true
  }
}
```

### Error Responses

#### 401 - Invalid Credentials

```json
{
  "message": "Invalid email or password"
}
```

**Note:** Same message for both email not found and wrong password (security best practice)

#### 403 - Email Not Verified

```json
{
  "message": "Email not verified. Please verify your email first.",
  "requiresOTPVerification": true,
  "userId": "67a1b2c3d4e5f6g7h8i9j0k1",
  "email": "john@example.com"
}
```

**User Action:** Should redirect to `/verify-otp` page

#### 400 - Missing Input

```json
{
  "message": "Email is required"
}
```

---

## 5. Verify Token

**Endpoint:** `GET /auth/verify`

**Purpose:** Check if JWT token is valid

### Request

```http
GET http://localhost:5000/api/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request Headers

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer <token>` | Yes |

### Success Response (200 OK)

```json
{
  "message": "Token is valid",
  "user": {
    "userId": "67a1b2c3d4e5f6g7h8i9j0k1",
    "email": "john@example.com",
    "role": "learner",
    "iat": 1703000000,
    "exp": 1703600000
  }
}
```

### Error Responses

#### 401 - No Token

```json
{
  "message": "No token provided"
}
```

#### 401 - Invalid Token

```json
{
  "message": "Invalid token",
  "error": "JsonWebTokenError: invalid token"
}
```

#### 401 - Token Expired

```json
{
  "message": "Invalid token",
  "error": "TokenExpiredError: jwt expired"
}
```

---

## Protected Route Middleware

### Email Verification Check

**Purpose:** Ensures unverified users cannot access protected resources

**Header Required:**
```http
Authorization: Bearer <jwt-token>
```

**Backend Check:**
1. Validates JWT token
2. Retrieves user from database
3. Checks `isEmailVerified` field
4. Returns 403 if not verified

### Example Protected Route Response

#### Success (User Verified)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": { /* protected resource */ }
}
```

#### Failure (User Not Verified)

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "message": "Email not verified. Please verify your email to access this feature.",
  "needsVerification": true,
  "email": "john@example.com"
}
```

---

## Frontend localStorage Keys

After successful operations, these keys are stored:

| Key | Value | Set When |
|-----|-------|----------|
| `token` | JWT token string | After verify-otp or login |
| `userRole` | "learner" or "tutor" | After verify-otp or login |
| `userName` | User's full name | After verify-otp or login |
| `userEmail` | User's email | After verify-otp or login |
| `isEmailVerified` | "true" or "false" | After verify-otp or login |
| `pendingEmail` | Email during signup | During signup flow |
| `pendingUserId` | User ID during signup | During signup flow |

---

## HTTP Status Codes Used

| Code | Meaning | Common Reason |
|------|---------|---------------|
| 200 | OK | Request successful |
| 201 | Created | User successfully created |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Invalid credentials, missing token |
| 403 | Forbidden | Email not verified |
| 404 | Not Found | User not found, resource missing |
| 500 | Server Error | Email send failed, database error |

---

## Rate Limiting

**OTP Attempts:** 5 per OTP generation
- After 5 wrong attempts, user must resend OTP
- Resend resets attempt counter to 0

**OTP Expiration:** 10 minutes
- After 10 minutes, OTP becomes invalid
- User must resend to get new OTP

---

## Security Headers

Recommended headers for API responses:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

---

## CORS Configuration

**Allowed Origins:** 
- `http://localhost:5173` (Frontend dev)
- `http://localhost:3000` (Alternative frontend)

**Allowed Methods:**
- GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:**
- Content-Type, Authorization

---

## Data Validation

### Email Validation

```regex
^[^\s@]+@[^\s@]+\.[^\s@]+$
```

Must be a valid email format

### Password Validation

```regex
/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])(?=.{8,}).*$/
```

Requirements:
- At least one uppercase letter
- At least one special character
- At least 8 characters total

### OTP Format

```
6 digits (0-9 only)
Generated as random number: Math.floor(100000 + Math.random() * 900000)
```

---

## Complete Flow Diagram

```
User Signup
    ↓
POST /auth/signup
    ↓
Validate Input
    ├─ Check password strength
    ├─ Check email format
    ├─ Check email uniqueness
    └─ Hash password
    ↓
Generate OTP (6-digit)
    ↓
Save User (isEmailVerified: false)
    ↓
Send OTP Email
    ↓
Response: requiresOTPVerification = true
    ↓
User Enters OTP
    ↓
POST /auth/verify-otp
    ├─ Find user
    ├─ Check OTP validity
    ├─ Check expiration (10 min)
    ├─ Check attempts (≤ 5)
    └─ Verify OTP hash
    ↓
Mark User Verified (isEmailVerified: true)
    ↓
Generate JWT Token (7-day expiry)
    ↓
Response: token + user data
    ↓
User Can Login or Access Dashboard
```

---

## Example cURL Requests

### Signup

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass@123",
    "role": "learner"
  }'
```

### Verify OTP

```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass@123"
  }'
```

### Verify Token

```bash
curl -X GET http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

**Last Updated:** January 13, 2026
**API Version:** 2.0
