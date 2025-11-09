import { Router } from 'express';
import { authService } from '../services/auth';
import { paymentService } from '../services/payment';
import { db } from '../services/database';

const router = Router();

// POST /payment/create-credits-bundle - Create payment intent for credits bundle
router.post('/create-credits-bundle', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { bundleType } = req.body;

    if (!bundleType || !['bundle100', 'bundle1000'].includes(bundleType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BUNDLE_TYPE',
          message: 'Invalid bundle type. Must be bundle100 or bundle1000'
        }
      });
    }

    const result = await paymentService.createCreditsBundlePayment(
      user.id,
      bundleType,
      user.email
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_CREATION_FAILED',
          message: result.message || 'Failed to create payment'
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
        message: 'Failed to create payment intent'
      }
    });
  }
});

// POST /payment/create-entry-fee - Create payment intent for game entry fee
router.post('/create-entry-fee', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { periodId, amount } = req.body;

    if (!periodId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Period ID and valid amount are required'
        }
      });
    }

    const result = await paymentService.createGameEntryPayment(
      user.id,
      periodId,
      amount,
      user.email
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_CREATION_FAILED',
          message: result.message || 'Failed to create payment'
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
        message: 'Failed to create entry fee payment'
      }
    });
  }
});

// POST /payment/webhook - Stripe webhook endpoint
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_SIGNATURE',
          message: 'Stripe signature missing'
        }
      });
    }

    const result = await paymentService.handleWebhook(
      req.body,
      signature
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEBHOOK_PROCESSING_FAILED',
          message: result.message || 'Failed to process webhook'
        }
      });
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process webhook'
      }
    });
  }
});

// GET /payment/status/:paymentIntentId - Get payment status
router.get('/status/:paymentIntentId', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { paymentIntentId } = req.params;

    // Verify payment belongs to user
    const { data: payment } = await db.getClient()
      .from('payments')
      .select('user_id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (!payment || payment.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Payment does not belong to user'
        }
      });
    }

    const result = await paymentService.getPaymentStatus(paymentIntentId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
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
        message: 'Failed to get payment status'
      }
    });
  }
});

// GET /payment/history - Get user's payment history
router.get('/history', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const result = await paymentService.getUserPaymentHistory(user.id, limit);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get payment history'
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
        message: 'Failed to get payment history'
      }
    });
  }
});

// POST /payment/validate-entry - Validate payment for game entry
router.post('/validate-entry', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { periodId } = req.body;

    if (!periodId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Period ID is required'
        }
      });
    }

    const result = await paymentService.validateEntryPayment(user.id, periodId);

    res.json({
      success: result.success,
      data: {
        isPaid: result.isPaid,
        paymentIntentId: result.paymentIntentId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to validate entry payment'
      }
    });
  }
});

export default router;
