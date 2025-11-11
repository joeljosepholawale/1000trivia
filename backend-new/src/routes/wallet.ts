import { Router } from 'express';
import { authService } from '../services/auth';
import { walletService } from '../services/wallet';
import { db } from '../services/database';
import { ProcessAdRewardSchema, DEFAULT_CONFIG } from '@1000ravier/shared';

const router = Router();

// GET /wallet - Get wallet info
router.get('/', authService.authenticate, async (req, res) => {
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

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get wallet info'
      }
    });
  }
});

// GET /wallet/info - Alias for mobile app compatibility
router.get('/info', authService.authenticate, async (req, res) => {
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

    // Get user's lifetime earnings for winner gating
    const userRecord = await db.getUserById(user.id);
    const lifetimeEarningsNGN = userRecord?.lifetime_earnings_ngn || 0;

    // Format response for mobile app
    const walletData = result.data as any;
    const canClaimDaily = walletData.canClaimDaily;
    const nextClaimAt = canClaimDaily ? new Date() : new Date(Date.now() + 24 * 60 * 60 * 1000);

    res.json({
      success: true,
      data: {
        balance: walletData.creditsBalance,
        lifetimeEarnings: lifetimeEarningsNGN,
        dailyClaim: {
          canClaim: canClaimDaily,
          amount: DEFAULT_CONFIG.credits.dailyClaimAmount,
          nextClaimAt: nextClaimAt.toISOString()
        },
        adsWatchedToday: walletData.adsWatchedToday || 0,
        adsDailyLimit: DEFAULT_CONFIG.credits.adRewardDailyLimit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get wallet info'
      }
    });
  }
});

// POST /wallet/claim-daily - Claim daily credits
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

    // Format response to match frontend expectations
    const nextClaimAt = new Date();
    nextClaimAt.setUTCDate(nextClaimAt.getUTCDate() + 1);
    nextClaimAt.setUTCHours(0, 0, 0, 0);

    res.json({
      success: true,
      message: result.message,
      data: {
        amount: result.data?.creditsAwarded || 0,
        newBalance: result.data?.newBalance || 0,
        nextClaimAt: nextClaimAt.toISOString(),
        transactionId: `daily_${user.id}_${Date.now()}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to claim daily credits'
      }
    });
  }
});

// POST /wallet/ad-reward - Process ad reward
router.post('/ad-reward', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { adUnitId, rewardValue } = req.body;

    // Validate input
    const validation = ProcessAdRewardSchema.safeParse({
      userId: user.id,
      adUnitId,
      rewardValue
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid ad reward data',
          details: validation.error.issues
        }
      });
    }

    const result = await walletService.processAdReward(
      user.id,
      adUnitId,
      rewardValue
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AD_REWARD_FAILED',
          message: result.message
        }
      });
    }

    // Analytics
    await db.createAnalyticsEvent({
      userId: user.id,
      eventName: 'ad_reward_claimed',
      properties: {
        adUnitId,
        rewardValue,
        creditsAwarded: result.data?.creditsAwarded,
        newBalance: result.data?.newBalance
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process ad reward'
      }
    });
  }
});

// POST /wallet/claim-ad-reward - Alias for mobile app compatibility
router.post('/claim-ad-reward', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { adType } = req.body;

    if (!adType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'adType is required'
        }
      });
    }

    // Use config value for reward amount (1 credit per spec)
    const rewardValue = DEFAULT_CONFIG.credits.adRewardAmount;

    const result = await walletService.processAdReward(
      user.id,
      adType,
      rewardValue
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AD_REWARD_FAILED',
          message: result.message
        }
      });
    }

    // Analytics
    await db.createAnalyticsEvent({
      userId: user.id,
      eventName: 'ad_reward_claimed',
      properties: {
        adType,
        rewardValue,
        creditsAwarded: result.data?.creditsAwarded,
        newBalance: result.data?.newBalance
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process ad reward'
      }
    });
  }
});

// GET /wallet/transactions - Get transaction history
router.get('/transactions', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await walletService.getTransactionHistory(user.id, limit, offset);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get transaction history'
        }
      });
    }

    res.json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get transaction history'
      }
    });
  }
});

// POST /wallet/refund - Request refund (for cancelled games)
router.post('/refund', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { amount, reason, reference } = req.body;

    if (!amount || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Amount and reason are required'
        }
      });
    }

    const result = await walletService.refundCredits(
      user.id,
      amount,
      reason,
      reference
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REFUND_FAILED',
          message: result.message
        }
      });
    }

    // Analytics
    await db.createAnalyticsEvent({
      userId: user.id,
      eventName: 'credits_refunded',
      properties: {
        amount,
        reason,
        reference,
        newBalance: result.data?.newBalance
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process refund'
      }
    });
  }
});

export default router;
