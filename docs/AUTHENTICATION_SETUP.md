# Authentication Setup Summary

This document provides a quick reference for setting up authentication in YUMA.

## Quick Start

1. **Set up Google OAuth** - See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
2. **Set up Email OTP** - See [EMAIL_OTP_SETUP.md](./EMAIL_OTP_SETUP.md)

## Environment Variables Required

### Required for Google OAuth
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Required for Email OTP
```env
# Option 1: SMTP (Gmail, SendGrid, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com

# Option 2: Development Mode (no email needed)
DEV_OTP=123456
NODE_ENV=development
```

## Authentication Flow

### Registration Flow
1. User enters Full Name, Email, and Password
2. System creates user account (unverified)
3. System sends OTP to user's email
4. User enters OTP code
5. System verifies OTP and marks email as verified
6. System creates personal space for user
7. System creates session and redirects to `/home`

### Login Flow
1. User enters Email and Password
2. System verifies credentials
3. If email not verified, send OTP and require verification
4. System creates session and redirects to `/home`

### Google OAuth Flow
1. User clicks "Continue with Google"
2. Redirected to Google sign-in
3. After authentication, Google redirects back to callback URL
4. System finds or creates user account
5. System creates personal space (if new user)
6. System creates session and redirects to `/home`

## Testing

### Test Registration
1. Go to `http://localhost:3000/auth?mode=signup`
2. Fill in the form with test data
3. In development mode, use OTP: `123456`
4. Should redirect to `/home` after verification

### Test Login
1. Go to `http://localhost:3000/auth?mode=login`
2. Enter registered email and password
3. Should redirect to `/home`

### Test Google OAuth
1. Configure Google OAuth credentials
2. Go to `http://localhost:3000/auth`
3. Click "Continue with Google"
4. Sign in with Google account
5. Should redirect to `/home`

## Troubleshooting

### Home Page Issues
- ✅ Home page is working correctly
- Check browser console for any errors
- Verify user session is valid (`/api/auth/me`)

### OTP Verification Issues
- In development, use OTP: `123456`
- Check console logs for OTP codes
- Verify email configuration if in production
- Check database for OTP records

### Google OAuth Issues
- Verify redirect URI matches exactly
- Check Google Cloud Console credentials
- Ensure OAuth consent screen is configured

## Next Steps

- [ ] Set up production email service (SendGrid, AWS SES, etc.)
- [ ] Configure production Google OAuth credentials
- [ ] Set up domain verification for email
- [ ] Implement rate limiting for OTP requests
- [ ] Add password reset functionality
- [ ] Set up email templates customization









