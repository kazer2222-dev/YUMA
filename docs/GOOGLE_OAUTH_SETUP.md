# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for YUMA.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A project in Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "YUMA Platform")
4. Click "Create"

## Step 2: Configure OAuth Consent Screen

1. In your project, go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace account)
3. Click **Create**
4. Fill in the required information:
   - **App name**: YUMA
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **Save and Continue**
6. On the **Scopes** page, click **Add or Remove Scopes**
   - Select:
     - `email`
     - `profile`
   - Click **Update** → **Save and Continue**
7. On the **Test users** page (if in Testing mode), add test users if needed
8. Click **Save and Continue** → **Back to Dashboard**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application** as the application type
4. Fill in the details:
   - **Name**: YUMA Web Client (or any name you prefer)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

## Step 4: Add Environment Variables

1. Open your `.env` file (or create one from `.env.example`)
2. Add the following variables:

```env
GOOGLE_CLIENT_ID=227411825220-teqdqst218jhbjjt0hofnu389kteouo5.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_API_KEY=AIzaSyACauMiA6by066qThpZ_N8zIUswusKgFMQ
```

**Note:** 
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured for OAuth authentication
- `GOOGLE_API_KEY` is for Google APIs usage

**For production**, update the redirect URI:
```env
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
```

## Step 5: Restart Your Development Server

After adding the environment variables, restart your Next.js development server:

```bash
npm run dev
# or
yarn dev
```

## Step 6: Test Google OAuth

1. Navigate to `http://localhost:3000/auth`
2. Click "Continue with Google"
3. You should be redirected to Google's sign-in page
4. After signing in, you'll be redirected back to `/home`

## Troubleshooting

### "redirect_uri_mismatch" Error

- Make sure the redirect URI in your `.env` file exactly matches the one in Google Cloud Console
- Check for trailing slashes or missing `http://` or `https://`
- The redirect URI must be in the "Authorized redirect URIs" list

### "access_denied" Error

- Make sure your OAuth consent screen is configured correctly
- If your app is in "Testing" mode, make sure the user is added as a test user
- Check that the required scopes (email, profile) are added

### "invalid_client" Error

- Verify that your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure there are no extra spaces or quotes in the `.env` file

### Local Development Issues

- For local development, use `http://localhost:3000` (not `https`)
- Make sure your development server is running on port 3000
- Clear browser cookies if you encounter session issues

## Production Deployment

1. Update the redirect URI in Google Cloud Console to your production domain
2. Update the `.env` file on your production server:
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
   ```
3. Make sure your production domain is verified in Google Cloud Console (if required)
4. Submit your OAuth app for verification if you plan to have public users (not just test users)

## Security Notes

- Never commit your `.env` file to version control
- Use different OAuth credentials for development and production
- Keep your Client Secret secure and rotate it periodically
- Enable OAuth consent screen restrictions if needed

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth Consent Screen Configuration](https://support.google.com/cloud/answer/10311615)

