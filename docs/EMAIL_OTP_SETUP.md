# Email OTP Setup Guide

This guide will help you configure email OTP (One-Time Password) sending for email verification in YUMA.

## Overview

YUMA uses email OTP for:
- Email verification during registration
- Email verification for login (if email not verified)
- Password reset (if implemented)

## Option 1: Gmail SMTP (Recommended for Development)

### Step 1: Enable 2-Step Verification

1. Go to your [Google Account](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** and **Other (Custom name)**
3. Enter "YUMA Platform" as the name
4. Click **Generate**
5. Copy the 16-character password (you'll only see it once)

### Step 3: Configure Environment Variables

Add these to your `.env` file:

```env
# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
FROM_EMAIL=your-email@gmail.com
```

**Important Notes:**
- `SMTP_SECURE=false` for port 587 (STARTTLS)
- `SMTP_SECURE=true` for port 465 (SSL/TLS)
- `SMTP_USER` should be your Gmail address
- `SMTP_PASS` is the app password (not your regular password)

## Option 2: SendGrid (Recommended for Production)

### Step 1: Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com/) and sign up
2. Verify your email address
3. Complete account setup

### Step 2: Create API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Choose **Full Access** or **Restricted Access** (with Mail Send permissions)
4. Copy the API key (you'll only see it once)

### Step 3: Verify Sender Identity

1. Go to **Settings** → **Sender Authentication**
2. Choose **Verify a Single Sender** (for testing) or **Domain Authentication** (for production)
3. Follow the verification steps

### Step 4: Update Code for SendGrid

If using SendGrid, you'll need to update `lib/email.ts` to use SendGrid's API instead of SMTP. Here's an example:

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendOTPEmail(to: string, otp: string): Promise<boolean> {
  try {
    await sgMail.send({
      to,
      from: process.env.FROM_EMAIL!,
      subject: 'YUMA - Email Verification Code',
      html: `...` // Use the same HTML template
    });
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
}
```

Then add to `.env`:
```env
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=verified-sender@yourdomain.com
```

## Option 3: Other SMTP Providers

You can use any SMTP provider (Mailgun, AWS SES, etc.) by configuring the SMTP settings:

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
FROM_EMAIL=noreply@yourdomain.com
```

### Common SMTP Providers

| Provider | SMTP Host | Port | Secure |
|----------|-----------|------|--------|
| Gmail | smtp.gmail.com | 587 | false |
| Outlook | smtp-mail.outlook.com | 587 | false |
| Mailgun | smtp.mailgun.org | 587 | false |
| AWS SES | email-smtp.region.amazonaws.com | 587 | false |
| SendGrid | smtp.sendgrid.net | 587 | false |

## Option 4: Development Mode (No Email)

For development, you can skip email configuration. The system will:
1. Use a fixed OTP: `123456` (for non-production environments)
2. Log the OTP to the console
3. Allow login without actual email sending

Add to `.env`:
```env
DEV_OTP=123456
NODE_ENV=development
```

**Note:** The OTP will be printed to the console during registration/login.

## Testing Email Configuration

### Test Email Sending

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth?mode=signup`

3. Fill in the registration form:
   - Full name: Test User
   - Email: your-test-email@gmail.com
   - Password: password123

4. Click "Create account"

5. Check:
   - Your email inbox for the OTP code
   - Console logs for any errors
   - Console output (if in dev mode) for the OTP

### Troubleshooting

#### "Email sending failed" Error

1. **Check SMTP credentials:**
   - Verify `SMTP_USER` and `SMTP_PASS` are correct
   - For Gmail, make sure you're using an App Password (not your regular password)

2. **Check SMTP settings:**
   - Verify `SMTP_HOST` and `SMTP_PORT` are correct
   - Check if `SMTP_SECURE` matches the port (false for 587, true for 465)

3. **Check firewall/network:**
   - Make sure port 587 or 465 is not blocked
   - Some networks block SMTP ports

4. **Check email service logs:**
   - Gmail: Check your Google Account security settings
   - SendGrid: Check the Activity feed in SendGrid dashboard

#### "Connection timeout" Error

- Try changing the port (587 → 465 or vice versa)
- Check if your ISP blocks SMTP ports
- Try using a different SMTP provider

#### OTP Not Received

- Check spam/junk folder
- Verify the email address is correct
- Check email service status
- In development mode, check console logs for the OTP

## Email Template Customization

The email template is defined in `lib/email.ts`. You can customize it:

```typescript
export async function sendOTPEmail(to: string, otp: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          /* Add your custom styles here */
        </style>
      </head>
      <body>
        <h1>YUMA Email Verification</h1>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      </body>
    </html>
  `;
  // ... rest of the function
}
```

## Production Checklist

- [ ] Use a dedicated email service (SendGrid, AWS SES, etc.)
- [ ] Set up SPF, DKIM, and DMARC records for your domain
- [ ] Use a verified sender email address
- [ ] Monitor email delivery rates
- [ ] Set up email bounce handling
- [ ] Configure rate limiting to prevent abuse
- [ ] Use environment-specific email templates
- [ ] Set up email logging/monitoring

## Security Best Practices

1. **Never commit email credentials to version control**
2. **Use environment variables for all sensitive data**
3. **Rotate email service credentials periodically**
4. **Implement rate limiting for OTP requests**
5. **Set appropriate OTP expiration times** (default: 10 minutes)
6. **Use HTTPS in production** to protect credentials in transit
7. **Monitor for suspicious email activity**

## Rate Limiting

Consider implementing rate limiting for OTP requests:

```typescript
// Example rate limiting (implement in API routes)
const MAX_OTP_REQUESTS = 5; // per hour
const MAX_OTP_ATTEMPTS = 5; // per OTP
```

## Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)



















