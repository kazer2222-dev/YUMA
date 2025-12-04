# Authentication & Session Management Logic

## Overview
This document explains how user authentication and session persistence works in the YUMA application, and why users might experience automatic logouts.

## Authentication Flow

### 1. Login Process
When a user logs in (via PIN verification):
- **Access Token** is created with **15 minutes expiration** (JWT)
- **Refresh Token** is created with **7 days expiration** (JWT)
- **Session** is stored in database with **7 days expiration**
- Both tokens are stored as **HTTP-only cookies** (secure, not accessible via JavaScript)

### 2. Token Storage
- **Access Token Cookie**: 
  - Name: `accessToken`
  - Expires: 15 minutes
  - HttpOnly: Yes (prevents XSS attacks)
  - Secure: Yes (in production)
  
- **Refresh Token Cookie**:
  - Name: `refreshToken`
  - Expires: 7 days
  - HttpOnly: Yes
  - Secure: Yes (in production)

### 3. Session Validation
Every API request checks authentication via `/api/auth/me`:
1. Reads `accessToken` from cookies
2. Verifies JWT token signature
3. Checks if session exists in database
4. Validates `session.expiresAt > current date`
5. Returns user data if valid, 401 if invalid

## Why Users Get Logged Out Automatically

### Primary Issue: No Automatic Token Refresh ⚠️

**The Problem:**
- Access tokens expire after **15 minutes**
- There is **NO automatic token refresh mechanism** in the frontend
- When the access token expires, all API calls return 401 (Unauthorized)
- The app redirects users to `/auth` page

**Current Behavior:**
1. User logs in → Gets 15-minute access token
2. User stays active for 15+ minutes
3. Access token expires
4. Next API call fails with 401
5. User is redirected to login page

### Secondary Issues:

1. **Session Expiration** (7 days)
   - Database sessions expire after 7 days
   - Even with valid refresh token, expired sessions cause logout
   - Location: `lib/auth.ts:467-469`

2. **Cookie Expiration**
   - Browser automatically deletes expired cookies
   - If cookies are cleared, user must re-login

3. **Database Session Check**
   - Every auth check queries database for active session
   - If session is deleted or expired, user is logged out
   - Location: `lib/auth.ts:464-474`

## Current Token Refresh Endpoint

There IS a refresh endpoint at `/api/auth/refresh`, but:
- ❌ It's not called automatically
- ❌ It requires manual refresh token submission
- ❌ Frontend doesn't intercept 401 responses to refresh tokens

## Solutions to Fix Auto-Logout

### Option 1: Implement Automatic Token Refresh (Recommended)

Add an API interceptor that:
1. Intercepts 401 responses
2. Automatically calls `/api/auth/refresh` with refresh token
3. Updates access token cookie
4. Retries the original request

### Option 2: Increase Access Token Lifetime

Change access token expiration from 15 minutes to a longer duration:
- Current: 15 minutes
- Suggested: 1-2 hours (balance between security and UX)

### Option 3: Implement "Remember Me" with Longer Sessions

Add a "Remember Me" checkbox that:
- Extends session to 30 days
- Uses longer-lived refresh tokens
- Only for trusted devices

## Code Locations

### Token Creation
- `app/api/auth/verify-pin/route.ts:34-48` - Sets cookies with expiration
- `lib/auth.ts:372-387` - Creates session in database

### Token Validation
- `app/api/auth/me/route.ts:5-50` - Validates access token
- `lib/auth.ts:452-506` - `getUserFromToken()` checks session expiration

### Session Expiration Check
- `lib/auth.ts:464-474` - Database query checks `expiresAt > new Date()`

### Token Refresh Endpoint
- `app/api/auth/refresh/route.ts:1-52` - Exists but not used automatically

## Recommendations

1. **Immediate Fix**: Implement automatic token refresh on 401 responses
2. **Short-term**: Increase access token lifetime to 1 hour
3. **Long-term**: Add session management UI (active sessions, logout from all devices)

## Testing Auto-Logout

To reproduce the issue:
1. Log in to the application
2. Wait 15+ minutes without activity
3. Try to perform any action (navigate, fetch data)
4. You should be redirected to `/auth` page

## Security Considerations

- HTTP-only cookies prevent XSS token theft
- Short access token lifetime limits damage if token is stolen
- Refresh tokens allow re-authentication without password
- Database session tracking enables logout from all devices













