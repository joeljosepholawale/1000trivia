import { Router } from 'express';
import { authService } from '../services/auth';
import { db } from '../services/database';
import { EmailSchema, OTPSchema } from '@1000ravier/shared';

const router = Router();

// POST /auth/register - Register with email/password
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required'
        }
      });
    }

    const result = await authService.registerWithPassword(email, password, username);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: result.message
        }
      });
    }

    // Analytics
    await db.createAnalyticsEvent({
      eventName: 'user_registered',
      userId: result.user!.id,
      properties: {
        email,
        method: 'password'
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed'
      }
    });
  }
});

// POST /auth/login - Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required'
        }
      });
    }

    const result = await authService.loginWithPassword(email, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: result.message
        }
      });
    }

    // Analytics
    await db.createAnalyticsEvent({
      eventName: 'user_logged_in',
      userId: result.user!.id,
      properties: {
        email,
        method: 'password'
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Login failed'
      }
    });
  }
});

// POST /auth/email/start - Send OTP to email
router.post('/email/start', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    const emailValidation = EmailSchema.safeParse(email);
    if (!emailValidation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format',
          details: emailValidation.error.issues
        }
      });
    }

    const result = await authService.sendEmailOTP(email);

    // Analytics
    await db.createAnalyticsEvent({
      eventName: 'auth_otp_sent',
      properties: {
        email,
        success: result.success
      },
      ipAddress: req.ip
    });

    res.json({
      success: result.success,
      ...(result.success 
        ? { message: result.message }
        : { error: { code: 'OTP_SEND_FAILED', message: result.message } }
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send OTP'
      }
    });
  }
});

// POST /auth/email/verify - Verify OTP and authenticate
router.post('/email/verify', async (req, res) => {
  try {
    const { email, otp, deviceInfo } = req.body;

    // Validate input
    const emailValidation = EmailSchema.safeParse(email);
    const otpValidation = OTPSchema.safeParse(otp);

    if (!emailValidation.success || !otpValidation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid email or OTP format'
        }
      });
    }

    const authSession = await authService.verifyEmailOTP(email, otp);

    if (!authSession) {
      // Analytics
      await db.createAnalyticsEvent({
        eventName: 'auth_verification_failed',
        properties: { email },
        ipAddress: req.ip,
        deviceInfo
      });

      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid or expired OTP'
        }
      });
    }

    // Update user's last active and device info
    await db.updateUser(authSession.user.id, {
      last_active_at: new Date().toISOString(),
      device_id: deviceInfo
    });

    // Analytics
    await authService.trackAuthEvent(
      'user_authenticated',
      authSession.user.id,
      { email, method: 'email_otp' },
      req.ip,
      deviceInfo
    );

    res.json({
      success: true,
      data: authSession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed'
      }
    });
  }
});

// POST /auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required'
        }
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    if (!result) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to refresh token'
      }
    });
  }
});

// POST /auth/logout - Logout user
router.post('/logout', authService.authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = (req as any).user;

    await authService.logout(refreshToken);

    // Analytics
    await authService.trackAuthEvent(
      'user_logout',
      user.id,
      {},
      req.ip
    );

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Logout failed'
      }
    });
  }
});

// GET /auth/me - Get current user info
router.get('/me', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Get wallet info
    const wallet = await db.getWallet(user.id);

    res.json({
      success: true,
      data: {
        user,
        wallet: wallet ? {
          creditsBalance: wallet.credits_balance,
          lastDailyClaimAt: wallet.last_daily_claim_at,
          adRewardsToday: wallet.ad_rewards_today
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user info'
      }
    });
  }
});

// PUT /auth/profile - Update user profile
router.put('/profile', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { language, timezone } = req.body;

    const updates: any = {};
    if (language) updates.language = language;
    if (timezone) updates.timezone = timezone;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'No valid updates provided'
        }
      });
    }

    const updatedUser = await db.updateUser(user.id, updates);

    // Analytics
    await db.createAnalyticsEvent({
      userId: user.id,
      eventName: 'profile_updated',
      properties: updates,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: { user: updatedUser }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update profile'
      }
    });
  }
});

// POST /auth/send-verification-email - Send email verification to logged-in user
router.post('/send-verification-email', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Email is already verified'
        }
      });
    }

    // For now, just send an OTP
    const result = await authService.sendEmailOTP(user.email);

    res.json({
      success: result.success,
      ...(result.success 
        ? { message: 'Verification email sent successfully' }
        : { error: { code: 'SEND_FAILED', message: result.message } }
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send verification email'
      }
    });
  }
});

// POST /auth/verify-email - Verify email with token
router.post('/verify-email', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Verification token is required'
        }
      });
    }

    // Verify the OTP token
    const authSession = await authService.verifyEmailOTP(user.email, token);

    if (!authSession) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token'
        }
      });
    }

    // Update user email_verified status
    await db.updateUser(user.id, { email_verified: true });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          ...user,
          email_verified: true
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify email'
      }
    });
  }
});

// DELETE /auth/account - Delete user account
router.delete('/account', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { confirmEmail } = req.body;

    // Require email confirmation for account deletion
    if (confirmEmail !== user.email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_CONFIRMATION_REQUIRED',
          message: 'Please confirm your email address to delete account'
        }
      });
    }

    // Check if user has pending payouts or active sessions
    const { data: activeSessions } = await db.getClient()
      .from('game_sessions')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['ACTIVE', 'PAUSED'])
      .limit(1);

    const { data: pendingPayouts } = await db.getClient()
      .from('payouts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'PENDING')
      .limit(1);

    if (activeSessions?.length || pendingPayouts?.length) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ACCOUNT_DELETION_BLOCKED',
          message: 'Cannot delete account with active sessions or pending payouts'
        }
      });
    }

    // Delete user from Supabase Auth
    await db.getClient().auth.admin.deleteUser(user.id);

    // Create audit log before deletion
    await db.createAuditLog({
      userId: user.id,
      action: 'ACCOUNT_DELETED',
      resource: 'user',
      resourceId: user.id,
      changes: { email: user.email },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete account'
      }
    });
  }
});

export default router;