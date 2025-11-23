import nodemailer from 'nodemailer';

// Email configuration and sending logic

export async function sendPINEmail(email: string, pin: string): Promise<boolean> {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // For development or when SMTP is not configured, just log the PIN
  if (!process.env.SMTP_USER && !process.env.SMTP_EMAIL) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📧 Verification PIN for ${email}:`);
    console.log(`   ${pin}`);
    console.log('   (Email sending not configured - PIN logged for development)');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    return true; // Always return true in development
  }

  // Only try to send email if SMTP is configured
  try {
    // Use configured SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"YUMA" <${process.env.SMTP_USER || process.env.SMTP_EMAIL || 'noreply@yuma.com'}>`,
      to: email,
      subject: 'Your YUMA Verification PIN',
      html: generateEmailTemplate(pin),
      text: `Your YUMA verification PIN is: ${pin}\n\nThis PIN will expire in 10 minutes.`,
    });

    console.log('📧 Email sent:', info.messageId);
    
    // Also log PIN in development
    if (!isProduction) {
      console.log(`PIN for ${email}: ${pin}`);
    }

    return true;
  } catch (error: any) {
    // Log error but don't throw - always return a boolean
    console.error('Error sending email:', error);
    
    // Fallback: log PIN if email fails
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`⚠️  Email sending failed for ${email}`);
    console.log(`📧 PIN: ${pin}`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    // Return true in development, false in production
    // This ensures we don't fail the auth flow in dev mode
    return !isProduction;
  }
}

function generateEmailTemplate(pin: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>YUMA Verification PIN</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2eaaac 0%, #a445f5 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">YUMA</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Verification PIN</h2>
          <p style="color: #666; font-size: 16px;">Your verification code is:</p>
          <div style="background: #f5f5f5; border: 2px dashed #2eaaac; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2eaaac; margin: 0; font-family: 'Courier New', monospace;">${pin}</p>
          </div>
          <p style="color: #666; font-size: 14px;">This PIN will expire in <strong>10 minutes</strong>.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
            If you didn't request this PIN, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} YUMA. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}
