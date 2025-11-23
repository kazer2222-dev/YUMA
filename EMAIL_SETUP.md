# Email Configuration Guide

## Development Setup

For development, you have two options:

### Option 1: Ethereal Email (Recommended for Testing)
Ethereal Email automatically creates test accounts. No configuration needed!
- The PIN will be logged to console
- A preview URL will be shown in the console where you can view the sent email
- Perfect for local development

### Option 2: SMTP Configuration
Add these environment variables to your `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="YUMA" <your-email@gmail.com>
```

### Gmail Setup (if using Gmail)
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password (not your regular password) in `SMTP_PASS`

### Other Email Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=your-email@example.com
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
SMTP_FROM=your-email@yourdomain.com
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key
SMTP_PASS=your-aws-secret-key
SMTP_FROM=your-email@yourdomain.com
```

## Testing

1. Start your development server: `npm run dev`
2. Try to sign in with any email
3. Check the console for the PIN (development mode)
4. If using Ethereal Email, check the preview URL shown in console
5. If using SMTP, check your email inbox

## Troubleshooting

- **Email not sending**: Check console logs for specific error messages
- **SMTP authentication failed**: Verify your credentials are correct
- **Timeout errors**: Check your firewall/network settings
- **Development fallback**: PIN is always logged to console in development mode
















