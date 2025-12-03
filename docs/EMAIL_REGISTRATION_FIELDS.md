# Email Registration - Required Information

This document outlines what information is collected during email registration in YUMA.

## Required Fields

For custom email registration, users need to provide **3 pieces of information**:

### 1. Full Name
- **Field Name:** `name`
- **Type:** Text/String
- **Required:** ✅ Yes
- **Minimum Length:** 2 characters
- **Validation:**
  - Cannot be empty
  - Must be a string
  - Must have at least 2 characters (after trimming whitespace)
- **Purpose:** Display name for the user account

**Example:** "John Doe", "Jane Smith", "Alex Johnson"

---

### 2. Email Address
- **Field Name:** `email`
- **Type:** Email
- **Required:** ✅ Yes
- **Validation:**
  - Must be a valid email format (matches pattern: `user@domain.extension`)
  - Must be unique (no existing account with this email)
  - Case-insensitive matching
- **Purpose:** 
  - Account identifier
  - Receives verification OTP code
  - Used for login

**Example:** "user@example.com", "john.doe@company.com"

---

### 3. Password
- **Field Name:** `password`
- **Type:** Password (hidden input)
- **Required:** ✅ Yes
- **Minimum Length:** 8 characters
- **Validation:**
  - Must be at least 8 characters long
  - No maximum length specified (but practical limits apply)
  - Stored as hashed value (bcrypt with salt rounds: 10)
- **Purpose:** 
  - Authentication credential
  - Used for login along with email

**Example:** "mypassword123", "SecureP@ssw0rd!"

---

## Registration Flow

1. **User fills in form:**
   - Full Name
   - Email Address
   - Password

2. **Client-side validation:**
   - Password must be at least 8 characters
   - Email format validation

3. **Server-side validation:**
   - Name: minimum 2 characters, trimmed
   - Email: valid format, not already registered (or if registered, not verified)
   - Password: minimum 8 characters, hashed before storage

4. **Account Creation:**
   - User account created with `emailVerified: false`
   - Password is hashed using bcrypt
   - Name is stored (trimmed)

5. **OTP Generation & Sending:**
   - 6-digit OTP code generated
   - OTP stored in database with 10-minute expiration
   - OTP sent via email
   - In development: OTP is `123456` (fixed)

6. **Email Verification:**
   - User receives OTP in email
   - User enters 6-digit code
   - OTP verified (expires after 10 minutes)
   - Email marked as verified (`emailVerified: true`)
   - Personal space created automatically
   - User session created
   - User redirected to `/home`

---

## Current Form UI

The registration form presents these fields in a clean interface:

```
┌─────────────────────────────────────┐
│ Create your account                 │
├─────────────────────────────────────┤
│                                     │
│ Full name                           │
│ [____________________________]      │
│                                     │
│ Email address                       │
│ [____________________________]      │
│                                     │
│ Password                            │
│ [____________________________] 👁️   │
│ ✓ At least 8 characters            │
│                                     │
│ [Create account →]                  │
│                                     │
└─────────────────────────────────────┘
```

---

## API Endpoint

**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for the verification code.",
  "requiresVerification": true
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error message here"
}
```

---

## Validation Rules Summary

| Field | Required | Min Length | Max Length | Format | Unique |
|-------|----------|------------|------------|--------|--------|
| Full Name | Yes | 2 chars | None | String | No |
| Email | Yes | - | - | Email format | Yes |
| Password | Yes | 8 chars | None | String | No |

---

## Optional Fields (Future)

Currently not collected but could be added:
- Phone number
- Company/Organization
- Job title
- Profile picture (avatar uploaded separately)
- Newsletter subscription preference
- Terms of Service acceptance checkbox

---

## Security Notes

1. **Password Storage:**
   - Passwords are NEVER stored in plain text
   - Hashed using bcrypt with 10 salt rounds
   - Original password cannot be recovered

2. **Email Verification:**
   - Required before account can be used
   - OTP expires after 10 minutes
   - Maximum 5 attempts per OTP

3. **Account Protection:**
   - Duplicate email check
   - Case-insensitive email matching
   - Email must be verified before login

4. **OTP Security:**
   - 6-digit numeric code
   - 10-minute expiration
   - One-time use only
   - Rate limiting (3 resends allowed)

---

## Database Schema

The `User` model stores:
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  password      String?  // Hashed password
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  // ... other fields
}
```

---

## Example Registration Data

**Input:**
```javascript
{
  name: "Sarah Johnson",
  email: "sarah.johnson@company.com",
  password: "SecurePass123!"
}
```

**Stored in Database:**
```javascript
{
  id: "clx1234567890",
  email: "sarah.johnson@company.com",
  name: "Sarah Johnson",
  password: "$2a$10$hashedpasswordstring...",
  emailVerified: false,
  createdAt: "2024-01-15T10:30:00Z"
}
```

---

## Next Steps After Registration

1. User receives OTP email
2. User enters 6-digit code
3. Email verified → Personal space created
4. Session tokens generated
5. User redirected to `/home` dashboard

---

For more information:
- See [EMAIL_OTP_SETUP.md](./EMAIL_OTP_SETUP.md) for email configuration
- See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for Google OAuth alternative
















