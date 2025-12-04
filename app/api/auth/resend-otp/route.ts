import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { sendPINEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No account found with this email' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, message: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Check resend limit
    const recentPin = await prisma.pinCode.findFirst({
      where: {
        email,
        createdAt: {
          gt: new Date(Date.now() - 60 * 1000) // 1 minute
        }
      }
    });

    if (recentPin) {
      return NextResponse.json(
        { success: false, message: 'Please wait 1 minute before requesting a new code' },
        { status: 429 }
      );
    }

    // Generate new OTP
    const isProduction = process.env.NODE_ENV === 'production';
    const otp = isProduction ? randomInt(100000, 999999).toString() : '123456';
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

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

    // Send OTP
    await sendPINEmail(email, otp);

    // Log in development
    if (!isProduction) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`📧 Resent OTP for ${email}:`);
      console.log(`   ${otp}`);
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully'
    });
  } catch (error: any) {
    console.error('[API] Resend OTP error:', error);
    return NextResponse.json(
      { success: false, message: `Failed to resend code: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}



















