import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { db } from './database';
import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import { AuthSession, User } from '@1000ravier/shared';

export class AuthService {
  private logger: winston.Logger;
  private emailTransporter: nodemailer.Transporter;
  private otpStore: Map<string, { code: string; expiresAt: Date; email: string }>;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/auth.log' })
      ]
    });

    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // In-memory OTP store (in production, use Redis)
    this.otpStore = new Map();

    // Clean expired OTPs every 5 minutes
    setInterval(() => this.cleanExpiredOTPs(), 5 * 60 * 1000);

    this.logger.info('Auth service initialized');
  }

  private cleanExpiredOTPs() {
    const now = new Date();
    for (const [key, otp] of this.otpStore.entries()) {
      if (now > otp.expiresAt) {
        this.otpStore.delete(key);
      }
    }
  }

  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, tokenType: 'refresh' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async sendEmailOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, message: 'Invalid email format' };
      }

      // Generate OTP
      const otpCode = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP
      this.otpStore.set(email, {
        code: otpCode,
        expiresAt,
        email
      });

      // Check if we're in development mode or email is not configured
      const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.SMTP_USER;

      if (isDevelopment) {
        // Development mode: Log OTP to console
        this.logger.info(`\n${'='.repeat(60)}`);
        this.logger.info(`📧 EMAIL VERIFICATION CODE (DEV MODE)`);
        this.logger.info(`Email: ${email}`);
        this.logger.info(`Code: ${otpCode}`);
        this.logger.info(`Expires: ${expiresAt.toLocaleString()}`);
        this.logger.info(`${'='.repeat(60)}\n`);
        
        return { 
          success: true, 
          message: `Verification code (DEV MODE): ${otpCode}` 
        };
      }

      // Production mode: Send actual email
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: '1000ravier - Verification Code',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #333; text-align: center;">1000ravier Verification</h2>
            <p style="color: #666; font-size: 16px;">Your verification code is:</p>
            <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 5px;">${otpCode}</span>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2023 1000ravier. All rights reserved.
            </p>
          </div>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);

      this.logger.info(`OTP sent to ${email}`);
      return { success: true, message: 'Verification code sent to your email' };
    } catch (error) {
      this.logger.error('Error sending OTP:', error);
      return { success: false, message: 'Failed to send verification code' };
    }
  }

  async verifyEmailOTP(email: string, otp: string): Promise<AuthSession | null> {
    try {
      // Get stored OTP
      const storedOTP = this.otpStore.get(email);
      if (!storedOTP) {
        this.logger.warn(`OTP verification failed - no OTP found for ${email}`);
        return null;
      }

      // Check expiration
      if (new Date() > storedOTP.expiresAt) {
        this.otpStore.delete(email);
        this.logger.warn(`OTP expired for ${email}`);
        return null;
      }

      // Verify code
      if (storedOTP.code !== otp) {
        this.logger.warn(`Invalid OTP for ${email}`);
        return null;
      }

      // Remove OTP after successful verification
      this.otpStore.delete(email);

      // Get or create user
      let user = await db.getUserById(await this.getUserIdByEmail(email));
      if (!user) {
        // Create new user with Supabase Auth
        const { data: authUser, error: authError } = await db.getClient().auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { email_verified: true }
        });

        if (authError) {
          this.logger.error('Error creating auth user:', authError);
          throw authError;
        }

        if (!authUser.user) {
          throw new Error('Failed to create user');
        }

        // Create user in our database
        user = await db.createUser({
          id: authUser.user.id,
          email,
          language: 'de',
          timezone: 'UTC'
        });

        // Update email verification status
        await db.updateUser(authUser.user.id, { email_verified: true });
      } else {
        // Update email verification status for existing user
        if (!user.email_verified) {
          await db.updateUser(user.id, { email_verified: true });
          user.email_verified = true;
        }
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Create session
      const authSession: AuthSession = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        user
      };

      this.logger.info(`User authenticated: ${email}`);
      return authSession;
    } catch (error) {
      this.logger.error('Error verifying OTP:', error);
      return null;
    }
  }

  private async getUserIdByEmail(email: string): Promise<string> {
    const { data: authUser } = await db.getClient().auth.admin.listUsers();
    const user = authUser.users.find((u: any) => u.email === email);
    return user?.id || '';
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; user: User } | null> {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, jwtSecret) as any;
      if (decoded.tokenType !== 'refresh') {
        return null;
      }

      // Get user
      const user = await db.getUserById(decoded.userId);
      if (!user) {
        return null;
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        jwtSecret,
        { expiresIn: '15m' }
      );

      return { accessToken, user };
    } catch (error) {
      this.logger.error('Error refreshing token:', error);
      return null;
    }
  }

  // Middleware for protecting routes
  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Access token required' }
        });
      }

      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      // Verify token
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Get user
      const user = await db.getUserById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid token' }
        });
      }

      // Add user to request
      (req as any).user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid token' }
        });
      }
      
      this.logger.error('Authentication error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' }
      });
    }
  };

  // Middleware for requiring email verification
  requireEmailVerification = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user?.email_verified) {
      return res.status(403).json({
        success: false,
        error: { 
          code: 'EMAIL_NOT_VERIFIED', 
          message: 'Email verification required' 
        }
      });
    }
    next();
  };

  // Get user info from token
  async getUserFromToken(token: string): Promise<User | null> {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      const decoded = jwt.verify(token, jwtSecret) as any;
      return await db.getUserById(decoded.userId);
    } catch (error) {
      this.logger.error('Error getting user from token:', error);
      return null;
    }
  }

  // Analytics tracking for auth events
  async trackAuthEvent(
    eventName: string, 
    userId?: string, 
    properties?: Record<string, any>,
    ipAddress?: string,
    deviceInfo?: string
  ) {
    await db.createAnalyticsEvent({
      userId,
      eventName,
      properties,
      deviceInfo,
      ipAddress
    });
  }

  // Logout (blacklist token in production with Redis)
  async logout(refreshToken: string): Promise<boolean> {
    try {
      // In production, add refresh token to blacklist
      this.logger.info('User logged out');
      return true;
    } catch (error) {
      this.logger.error('Error during logout:', error);
      return false;
    }
  }

  // Email/Password Registration
  async registerWithPassword(email: string, password: string, username?: string): Promise<{ success: boolean; user?: User; accessToken?: string; refreshToken?: string; message?: string }> {
    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, message: 'Invalid email format' };
      }

      // Validate password strength
      if (password.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters long' };
      }

      // Check if user already exists
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        return { success: false, message: 'Email already registered' };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Generate user ID
      const userId = crypto.randomUUID();

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await (db.getClient() as any).auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        this.logger.error('Supabase auth error:', authError);
        return { success: false, message: authError.message };
      }

      // Create user record in database
      const newUser = await db.createUser({
        id: authData.user.id,
        email,
      });

      // Generate tokens
      const tokens = this.generateTokens(newUser);

      this.logger.info(`User registered with password: ${email}`);

      return {
        success: true,
        user: newUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      this.logger.error('Error during password registration:', error);
      return { success: false, message: 'Registration failed' };
    }
  }

  // Email/Password Login
  async loginWithPassword(email: string, password: string): Promise<{ success: boolean; user?: User; accessToken?: string; refreshToken?: string; message?: string }> {
    try {
      // Authenticate with Supabase Auth
      const { data: authData, error: authError } = await (db.getClient() as any).auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        this.logger.error('Supabase auth error:', authError);
        return { success: false, message: 'Invalid email or password' };
      }

      // Get user from database
      const user = await db.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      this.logger.info(`User logged in with password: ${email}`);

      return {
        success: true,
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      this.logger.error('Error during password login:', error);
      return { success: false, message: 'Login failed' };
    }
  }
}

export const authService = new AuthService();