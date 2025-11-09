import { Router } from 'express';
import { authService } from '../services/auth';
import { leaderboardService } from '../services/leaderboard';
import { paymentService } from '../services/payment';
import { walletService } from '../services/wallet';
import { db } from '../services/database';

const router = Router();

// Simple admin check - in production, implement proper role-based access
const requireAdmin = (req: any, res: any, next: any) => {
  const user = req.user;
  // For now, check if user email is in admin list
  // In production, implement proper role system
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
  if (!adminEmails.includes(user.email)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'Admin access required'
      }
    });
  }
  next();
};

// GET /admin/dashboard - Admin dashboard data
router.get('/dashboard', authService.authenticate, requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Get basic stats
    const { data: totalUsers } = await db.getClient()
      .from('users')
      .select('id', { count: 'exact' });

    const { data: activeSessions } = await db.getClient()
      .from('game_sessions')
      .select('id', { count: 'exact' })
      .in('status', ['ACTIVE', 'PAUSED']);

    const { data: todaySessions } = await db.getClient()
      .from('game_sessions')
      .select('id', { count: 'exact' })
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    const { data: pendingWinners } = await db.getClient()
      .from('winners')
      .select('id', { count: 'exact' })
      .eq('status', 'PENDING');

    // Get payment analytics for today
    const paymentAnalytics = await paymentService.getPaymentAnalytics(
      startOfDay.toISOString(),
      endOfDay.toISOString()
    );

    // Get wallet stats
    const walletStats = await walletService.getWalletStats();

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers?.length || 0
        },
        sessions: {
          active: activeSessions?.length || 0,
          todayTotal: todaySessions?.length || 0
        },
        winners: {
          pendingReview: pendingWinners?.length || 0
        },
        payments: paymentAnalytics.data || {},
        wallet: walletStats.data || {}
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get dashboard data'
      }
    });
  }
});

// GET /admin/periods - Get all periods for management
router.get('/periods', authService.authenticate, requireAdmin, async (req, res) => {
  try {
    const status = req.query.status as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    let query = db.getClient()
      .from('periods')
      .select(`
        *,
        mode:game_modes(*),
        _count:game_sessions(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      meta: {
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get periods'
      }
    });
  }
});

// POST /admin/periods/:periodId/finalize - Finalize a period
router.post('/periods/:periodId/finalize', authService.authenticate, requireAdmin, async (req, res) => {
  try {
    const { periodId } = req.params;
    const user = (req as any).user;

    const result = await leaderboardService.finalizePeriod(periodId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FINALIZATION_FAILED',
          message: 'Failed to finalize period'
        }
      });
    }

    // Create audit log
    await db.createAuditLog({
      userId: user.id,
      action: 'ADMIN_PERIOD_FINALIZED',
      resource: 'period',
      resourceId: periodId,
      changes: result.data
    });

    res.json({
      success: true,
      message: 'Period finalized successfully',
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to finalize period'
      }
    });
  }
});

// GET /admin/winners/pending - Get pending winner reviews
router.get('/winners/pending', authService.authenticate, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const { data, error } = await db.getClient()
      .from('winners')
      .select(`
        *,
        user:users(id, email),
        period:periods(
          *,
          mode:game_modes(*)
        )
      `)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get pending winners'
      }
    });
  }
});

// POST /admin/winners/:winnerId/review - Review winner (approve/reject)
router.post('/winners/:winnerId/review', authService.authenticate, requireAdmin, async (req, res) => {
  try {
    const { winnerId } = req.params;
    const { action, reason } = req.body;
    const user = (req as any).user;

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: 'Action must be APPROVE or REJECT'
        }
      });
    }

    if (action === 'REJECT' && !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REASON_REQUIRED',
          message: 'Reason is required when rejecting'
        }
      });
    }

    const result = await leaderboardService.reviewWinner(
      winnerId,
      action,
      user.id,
      reason
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REVIEW_FAILED',
          message: result.message
        }
      });
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to review winner'
      }
    });
  }
});

// GET /admin/payments/analytics - Get payment analytics
router.get('/payments/analytics', authService.authenticate, requireAdmin, async (req, res) => {
  try {
    const startDate = req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate as string || new Date().toISOString();

    const result = await paymentService.getPaymentAnalytics(startDate, endDate);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get payment analytics'
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
        message: 'Failed to get payment analytics'
      }
    });
  }
});

// POST /admin/payments/:paymentIntentId/refund - Refund a payment
router.post('/payments/:paymentIntentId/refund', authService.authenticate, requireAdmin, async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const { amount, reason } = req.body;
    const user = (req as any).user;

    const result = await paymentService.refundPayment(
      paymentIntentId,
      amount,
      reason,
      user.id
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

// POST /admin/wallet/award-credits - Award bonus credits to user
router.post('/wallet/award-credits', authService.authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    const admin = (req as any).user;

    if (!userId || !amount || !reason || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User ID, positive amount, and reason are required'
        }
      });
    }

    const result = await walletService.awardBonusCredits(
      userId,
      amount,
      reason,
      admin.id
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AWARD_FAILED',
          message: result.message
        }
      });
    }

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
        message: 'Failed to award credits'
      }
    });
  }
});

// POST /admin/wallet/penalize-credits - Penalize user credits
router.post('/wallet/penalize-credits', authService.authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    const admin = (req as any).user;

    if (!userId || !amount || !reason || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User ID, positive amount, and reason are required'
        }
      });
    }

    const result = await walletService.penalizeCredits(
      userId,
      amount,
      reason,
      admin.id
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PENALIZE_FAILED',
          message: result.message
        }
      });
    }

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
        message: 'Failed to penalize credits'
      }
    });
  }
});

// GET /admin/users/search - Search users
router.get('/users/search', authService.authenticate, requireAdmin, async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Query must be at least 2 characters'
        }
      });
    }

    const { data, error } = await db.getClient()
      .from('users')
      .select('id, email, created_at, last_active_at, email_verified, lifetime_earnings_ngn')
      .or(`email.ilike.%${query}%,id.eq.${query}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to search users'
      }
    });
  }
});

// GET /admin/audit-logs - Get audit logs
router.get('/audit-logs', authService.authenticate, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const userId = req.query.userId as string;
    const action = req.query.action as string;

    let query = db.getClient()
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      meta: {
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get audit logs'
      }
    });
  }
});

export default router;