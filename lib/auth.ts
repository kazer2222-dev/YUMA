import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { randomInt } from 'crypto';
import { sendPINEmail } from '@/lib/email';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Please set it in your .env file.');
}
const PIN_EXPIRY_MINUTES = 10;
const MAX_PIN_ATTEMPTS = 5;
const MAX_PIN_RESENDS = 3;

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface SessionData {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  static generatePIN(): string {
    // In development, use a fixed PIN for easier testing
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment && process.env.DEV_PIN) {
      return process.env.DEV_PIN;
    }
    // Use fixed PIN in development for easier testing
    if (isDevelopment) {
      return '123456';
    }
    return randomInt(100000, 999999).toString();
  }

  static async hashPIN(pin: string): Promise<string> {
    return bcrypt.hash(pin, 10);
  }

  static async verifyPINHash(pin: string, hashedPin: string): Promise<boolean> {
    return bcrypt.compare(pin, hashedPin);
  }

  static generateTokens(user: AuthUser): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  static verifyToken(token: string): { userId: string; email?: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (!decoded || !decoded.userId) {
        return null;
      }
      return {
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  static async requestPIN(email: string): Promise<{ success: boolean; message: string }> {
    const isProduction = process.env.NODE_ENV === 'production';
    
    try {
      const pin = this.generatePIN();
      const hashedPin = await this.hashPIN(pin);
      const expiresAt = new Date(Date.now() + PIN_EXPIRY_MINUTES * 60 * 1000);

      let pinSaved = false;
      try {
        await prisma.pinCode.create({
          data: {
            email,
            code: pin,
            hashedCode: hashedPin,
            expiresAt
          }
        });
        pinSaved = true;
      } catch (dbError: any) {
        console.error('Database error creating PIN:', dbError);
        // If it's a unique constraint error, try to update existing PIN
        if (dbError?.code === 'P2002') {
          try {
            await prisma.pinCode.updateMany({
              where: { email },
              data: {
                code: pin,
                hashedCode: hashedPin,
                expiresAt,
                attempts: 0,
                usedAt: null
              }
            });
            pinSaved = true;
          } catch (updateError) {
            console.error('Failed to update PIN:', updateError);
            // In development, continue anyway
            if (isProduction) throw updateError;
          }
        } else {
          // In development, log but continue; in production, throw
          console.error('Database error:', dbError);
          if (isProduction) throw dbError;
          // In dev, we'll still log the PIN below
        }
      }

      // Send PIN via email (this should never throw, always returns boolean)
      let emailSent = false;
      try {
        emailSent = await sendPINEmail(email, pin);
      } catch (emailError) {
        console.error('Email service error (non-fatal):', emailError);
        emailSent = !isProduction; // Return true in dev, false in prod
      }
      
      // Always log PIN in development mode, regardless of success
      if (!isProduction) {
        console.log('');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`📧 Verification PIN for ${email}:`);
        console.log(`   ${pin}`);
        if (!pinSaved) {
          console.log('   ⚠️  Note: PIN was not saved to database (dev mode only)');
        }
        if (!emailSent) {
          console.log('   ⚠️  Note: Email sending not configured (dev mode)');
        }
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
      }
      
      // Always succeed in development (PIN is logged to console)
      if (!emailSent && isProduction) {
        return {
          success: false,
          message: 'Failed to send PIN. Please check your email configuration.'
        };
      }
      
      // Success - PIN is either sent via email or logged to console (development)
      return {
        success: true,
        message: isProduction ? 'PIN sent to your email' : 'PIN sent. Check your email or console for the code.'
      };
    } catch (error: any) {
      console.error('Error requesting PIN:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack
      });
      
      // In development, still try to log the PIN if we have it
      if (!isProduction) {
        console.log('');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`⚠️  Error occurred, but for development here's a test PIN:`);
        console.log(`   Email: ${email}`);
        console.log(`   PIN: 123456 (use this for testing)`);
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
      }
      
      return {
        success: false,
        message: `Failed to send PIN. ${error?.message || 'Please try again.'}`
      };
    }
  }

  static async verifyPIN(
    email: string, 
    pin: string, 
    options?: {
      rememberMe?: boolean;
      deviceInfo?: string;
      userAgent?: string;
      ipAddress?: string;
    }
  ): Promise<{ success: boolean; session?: SessionData; message: string }> {
    const isProduction = process.env.NODE_ENV === 'production';
    
    try {
      // Try to find valid PIN in database
      let pinRecord = null;
      try {
        pinRecord = await prisma.pinCode.findFirst({
          where: {
            email,
            expiresAt: {
              gt: new Date()
            },
            usedAt: null
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      } catch (dbError: any) {
        console.error('Database error looking up PIN:', dbError);
        // In development, continue with bypass if database fails
        if (isProduction) throw dbError;
      }

      // Development mode: Always allow fixed PIN 123456, regardless of database
      if (!isProduction && pin === '123456') {
        console.log(`[DEV MODE] Using fixed PIN bypass for ${email}`);
        
        // If a PIN record exists, mark it as used to clean up
        if (pinRecord) {
          try {
            await prisma.pinCode.update({
              where: { id: pinRecord.id },
              data: { usedAt: new Date() }
            });
          } catch (e) {
            // Ignore errors in cleanup
          }
        }
        
        // Find or create user
        let user = null;
        try {
          user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name: email.split('@')[0]
              }
            });
          }
        } catch (userError: any) {
          console.error('Database error creating/finding user:', userError);
          // In development, still try to proceed if possible
          if (isProduction) throw userError;
          // If we can't create user, return error
          return {
            success: false,
            message: `Database error: ${userError?.message || 'Could not create user'}`
          };
        }

        // Generate tokens
        const { accessToken, refreshToken } = this.generateTokens({
          id: user.id,
          email: user.email,
          name: user.name || undefined
        });

        // Handle remember me logic
        const rememberMe = options?.rememberMe ?? false;
        const deviceInfo = options?.deviceInfo || 'unknown';
        const userAgent = options?.userAgent || 'unknown';
        const ipAddress = options?.ipAddress || 'unknown';

        // If remember me is enabled, invalidate sessions from other devices
        if (rememberMe) {
          try {
            await prisma.session.deleteMany({
              where: {
                userId: user.id,
                deviceInfo: {
                  not: deviceInfo
                }
              }
            });
            console.log(`[DEV MODE] Invalidated other device sessions for user: ${user.email}`);
          } catch (e) {
            console.error('Error invalidating other sessions:', e);
          }
        }

        // Session expiration: 30 days if remember me, otherwise 7 days (will be cleared on browser close via session cookie)
        const sessionExpiration = rememberMe 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days (but cookie will be session-based)

        // Create session in database for dev mode too
        try {
          await prisma.session.create({
            data: {
              userId: user.id,
              token: accessToken,
              refreshToken,
              deviceInfo,
              userAgent,
              ipAddress,
              expiresAt: sessionExpiration,
              lastActiveAt: new Date()
            }
          });
          console.log(`[DEV MODE] Session created for user: ${user.email}, rememberMe: ${rememberMe}`);
        } catch (sessionError: any) {
          console.error('Database error creating session:', sessionError);
          // Continue anyway - getUserFromToken will handle it with fallback
        }

        return {
          success: true,
          session: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name || undefined
            },
            accessToken,
            refreshToken
          },
          message: 'PIN verified successfully'
        };
      }

      if (!pinRecord) {
        return {
          success: false,
          message: 'Invalid or expired PIN'
        };
      }

      // Check attempt limit
      if (pinRecord.attempts >= MAX_PIN_ATTEMPTS) {
        return {
          success: false,
          message: 'Too many failed attempts. Please request a new PIN.'
        };
      }

      // Verify PIN
      const isValid = await this.verifyPINHash(pin, pinRecord.hashedCode);
      
      if (!isValid) {
        // Increment attempts
        await prisma.pinCode.update({
          where: { id: pinRecord.id },
          data: { attempts: pinRecord.attempts + 1 }
        });

        return {
          success: false,
          message: 'Invalid PIN'
        };
      }

      // Mark PIN as used
      await prisma.pinCode.update({
        where: { id: pinRecord.id },
        data: { usedAt: new Date() }
      });

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: email.split('@')[0] // Default name from email
          }
        });

        // Create personal space for new user with unique ticker
        const tickerBase = user.id.slice(-6).toUpperCase();
        await prisma.space.create({
          data: {
            name: 'Personal',
            slug: `personal-${user.id}`,
            ticker: `P-${tickerBase}`,
            members: {
              create: {
                userId: user.id,
                role: 'OWNER'
              }
            },
            settings: {
              create: {
                allowCustomFields: true,
                allowIntegrations: true,
                aiAutomationsEnabled: true
              }
            }
          }
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens({
        id: user.id,
        email: user.email,
        name: user.name || undefined
      });

      // Handle remember me logic
      const rememberMe = options?.rememberMe ?? false;
      const deviceInfo = options?.deviceInfo || 'unknown';
      const userAgent = options?.userAgent || 'unknown';
      const ipAddress = options?.ipAddress || 'unknown';

      // If remember me is enabled, invalidate sessions from other devices
      if (rememberMe) {
        try {
          await prisma.session.deleteMany({
            where: {
              userId: user.id,
              deviceInfo: {
                not: deviceInfo
              }
            }
          });
          console.log(`Invalidated other device sessions for user: ${user.email}`);
        } catch (e) {
          console.error('Error invalidating other sessions:', e);
        }
      }

      // Session expiration: 30 days if remember me, otherwise 7 days (will be cleared on browser close via session cookie)
      const sessionExpiration = rememberMe 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days (but cookie will be session-based)

      // Create session
      await prisma.session.create({
        data: {
          userId: user.id,
          token: accessToken,
          refreshToken,
          deviceInfo,
          userAgent,
          ipAddress,
          expiresAt: sessionExpiration,
          lastActiveAt: new Date()
        }
      });

      return {
        success: true,
        session: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name || undefined
          },
          accessToken,
          refreshToken
        },
        message: 'Authentication successful'
      };
    } catch (error: any) {
      console.error('Error verifying PIN:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack
      });
      
      // In development, provide more helpful error messages
      const isProduction = process.env.NODE_ENV === 'production';
      if (!isProduction) {
        console.log('');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`⚠️  PIN Verification Error for ${email}:`);
        console.log(`   PIN entered: ${pin}`);
        console.log(`   Error: ${error?.message || 'Unknown error'}`);
        console.log(`   Note: In dev mode, PIN 123456 should work even without DB record`);
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
      }
      
      return {
        success: false,
        message: `Authentication failed. ${error?.message || 'Please try again.'}`
      };
    }
  }

  // Logout (invalidate session)
  static async logout(accessToken: string): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.session.deleteMany({
        where: { token: accessToken }
      });

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('Error logging out:', error);
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }

  // Get user from token
  static async getUserFromToken(token: string): Promise<AuthUser | null> {
    try {
      console.log(`[Auth] getUserFromToken called with token: ${token.substring(0, 20)}...`);
      
      const decoded = this.verifyToken(token);
      if (!decoded) {
        console.log(`[Auth] Token verification failed - invalid token`);
        return null;
      }

      console.log(`[Auth] Token decoded successfully, userId: ${decoded.userId}`);

      const session = await prisma.session.findFirst({
        where: {
          token,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: true
        }
      });

      if (!session) {
        console.log(`[Auth] No session found in database for token`);
        // In dev mode, try to find user by decoded userId instead
        if (process.env.NODE_ENV !== 'production' && decoded.userId) {
          console.log(`[DEV MODE] Attempting to find user by ID: ${decoded.userId}`);
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
          });
          if (user) {
            console.log(`[DEV MODE] User found: ${user.email}`);
            return {
              id: user.id,
              email: user.email,
              name: user.name || undefined
            };
          }
        }
        return null;
      }

      console.log(`[Auth] Session found for user: ${session.user.email}`);
      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || undefined
      };
    } catch (error: any) {
      console.error(`[Auth] Error in getUserFromToken:`, error);
      return null;
    }
  }

  // Check if user is admin
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const adminRole = await prisma.adminRole.findUnique({
        where: { userId },
      });
      return !!adminRole;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  static async requireAdmin(userId: string): Promise<{ success: boolean; message?: string }> {
    const isAdmin = await this.isAdmin(userId);
    if (!isAdmin) {
      return {
        success: false,
        message: 'Admin access required',
      };
    }
    return { success: true };
  }
}
