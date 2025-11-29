import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { sendPINEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Full name is required (minimum 2 characters)' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password validation
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      );
    }

    const passwordValidation = {
      hasMinLength: password.length >= 8,
      hasLowerCase: /[a-z]/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    if (!passwordValidation.hasMinLength || 
        !passwordValidation.hasLowerCase || 
        !passwordValidation.hasUpperCase || 
        !passwordValidation.hasNumber || 
        !passwordValidation.hasSymbol) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one symbol' 
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { success: false, message: 'An account with this email already exists' },
          { status: 400 }
        );
      }
      // User exists but not verified - update their info and resend OTP
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: {
          name: name.trim(),
          password: hashedPassword,
        }
      });
    } else {
      // Create new user (unverified)
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email,
          name: name.trim(),
          password: hashedPassword,
          emailVerified: false,
        }
      });
    }

    // Generate OTP
    const isProduction = process.env.NODE_ENV === 'production';
    const otp = isProduction ? randomInt(100000, 999999).toString() : '123456';
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    try {
      await prisma.pinCode.create({
        data: {
          email,
          code: otp,
          hashedCode: hashedOtp,
          expiresAt
        }
      });
    } catch (dbError: any) {
      // If unique constraint error, update existing
      if (dbError?.code === 'P2002') {
        await prisma.pinCode.updateMany({
          where: { email },
          data: {
            code: otp,
            hashedCode: hashedOtp,
            expiresAt,
            attempts: 0,
            usedAt: null
          }
        });
      }
    }

    // Send OTP via email
    const emailSent = await sendPINEmail(email, otp);

    // Log OTP in development
    if (!isProduction) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`📧 Registration OTP for ${email}:`);
      console.log(`   ${otp}`);
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email for the verification code.',
      requiresVerification: true
    });
  } catch (error: any) {
    console.error('[API] Registration error:', error);
    return NextResponse.json(
      { success: false, message: `Registration failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

