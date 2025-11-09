import { Router } from 'express';
import { authService } from '../services/auth';
import { walletService } from '../services/wallet';
import { db } from '../services/database';
import { DEFAULT_CONFIG } from '@1000ravier/shared';

const router = Router();

// GET /bonus/daily-status - Check daily bonus status
router.get('/daily-status', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const result = await walletService.getWalletInfo(user.id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WALLET_NOT_FOUND',
          message: 'Wallet not found'
        }
      });
    }

    const walletData = result.data as any;
    const canClaim = walletData.canClaimDaily || false;

    // Calculate next available time (if already claimed today, next claim is tomorrow)
    const now = new Date();
    const nextClaimAt = canClaim
      ? now.toISOString()
      : new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    res.json({
      success: true,
      data: {
        claimed: !canClaim,
        nextAvailableAt: nextClaimAt,
        amount: DEFAULT_CONFIG.credits.dailyClaimAmount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check daily bonus status'
      }
    });
  }
});

// POST /bonus/claim-daily - Claim daily bonus
router.post('/claim-daily', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const result = await walletService.claimDailyCredits(user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DAILY_CLAIM_FAILED',
          message: result.message
        }
      });
    }

    // Analytics
    await db.createAnalyticsEvent({
      userId: user.id,
      eventName: 'daily_credits_claimed',
      properties: {
        creditsAwarded: result.data?.creditsAwarded,
        newBalance: result.data?.newBalance
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: result.message,
      data: {
        amount: result.data?.creditsAwarded || DEFAULT_CONFIG.credits.dailyClaimAmount,
        newBalance: result.data?.newBalance || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to claim daily bonus'
      }
    });
  }
});

export default router;
