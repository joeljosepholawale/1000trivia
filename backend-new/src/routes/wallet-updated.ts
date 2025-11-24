import { Router } from 'express';
import { walletService } from '../services/wallet-updated';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const claimAdRewardSchema = z.object({
  adType: z.enum(['rewarded_video', 'interstitial']),
  deviceInfo: z.object({
    platform: z.string().optional(),
    deviceId: z.string().optional(),
    appVersion: z.string().optional(),
    osVersion: z.string().optional()
  }).optional(),
  ipAddress: z.string().optional()
});

const deductCreditsSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().optional(),
  referenceId: z.string().optional()
});

const transactionHistorySchema = z.object({
  type: z.enum(['CREDIT', 'DEBIT']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

// GET /wallet/info - Get wallet information
router.get('/info', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await walletService.getWalletInfo(userId);

    if (!result.success) {
      return res.status(404).json({
        error: 'Wallet not found'
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error getting wallet info:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// POST /wallet/claim-daily - Claim daily credits
router.post('/claim-daily', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await walletService.claimDailyCredits(userId);

    if (!result.success) {
      return res.status(400).json({
        error: 'Unable to claim daily credits. You may have already claimed today.'
      });
    }

    res.json({
      success: true,
      message: 'Daily credits claimed successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error claiming daily credits:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// POST /wallet/claim-ad-reward - Claim ad reward
router.post('/claim-ad-reward', auth, validate(claimAdRewardSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const { adType, deviceInfo } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const result = await walletService.claimAdReward(
      userId,
      adType,
      deviceInfo,
      ipAddress
    );

    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Unable to claim ad reward'
      });
    }

    res.json({
      success: true,
      message: 'Ad reward claimed successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error claiming ad reward:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// GET /wallet/credit-bundles - Get available credit bundles
router.get('/credit-bundles', auth, async (req, res) => {
  try {
    const result = await walletService.getCreditBundles();

    if (!result.success) {
      return res.status(404).json({
        error: 'No credit bundles available'
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error getting credit bundles:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// POST /wallet/deduct-credits - Deduct credits (internal use, game entry fees)
router.post('/deduct-credits', auth, validate(deductCreditsSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, reason, referenceId } = req.body;

    const result = await walletService.deductCreditsForEntry(
      userId,
      amount,
      reason,
      referenceId
    );

    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Unable to deduct credits'
      });
    }

    res.json({
      success: true,
      message: 'Credits deducted successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error deducting credits:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// GET /wallet/transactions - Get transaction history
router.get('/transactions', auth, validate(transactionHistorySchema, 'query'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, limit, offset } = req.query as any;

    const result = await walletService.getTransactionHistory(userId, {
      type,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    });

    if (!result.success) {
      return res.status(404).json({
        error: 'Transaction history not found'
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// GET /wallet/stats - Get wallet statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await walletService.getWalletStats(userId);

    if (!result.success) {
      return res.status(404).json({
        error: 'Wallet statistics not found'
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error getting wallet stats:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// POST /wallet/flutterwave/confirm-purchase - Confirm credit purchase via Flutterwave
router.post('/flutterwave/confirm-purchase', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bundleId, txRef } = req.body;

    if (!bundleId || !txRef) {
      return res.status(400).json({
        error: 'Bundle ID and txRef are required'
      });
    }

    const result = await walletService.processCreditsPurchase(
      userId,
      bundleId,
      txRef
    );

    if (!result.success) {
      return res.status(400).json({
        error: 'Unable to process credit purchase'
      });
    }

    res.json({
      success: true,
      message: 'Credits added successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error processing credit purchase:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Admin routes
// POST /wallet/admin/reset-daily-ads - Reset daily ad counts (cron job)
router.post('/admin/reset-daily-ads', async (req, res) => {
  try {
    // Verify this is called from a trusted source (add API key check)
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const result = await walletService.resetDailyAdCounts();

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to reset daily ad counts'
      });
    }

    res.json({
      success: true,
      message: 'Daily ad counts reset successfully'
    });
  } catch (error) {
    console.error('Error resetting daily ad counts:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;