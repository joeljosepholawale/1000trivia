import { Router } from 'express';
import { authService } from '../services/auth';
import { leaderboardService } from '../services/leaderboard';

const router = Router();

// GET /leaderboard/rank - Get current user's rank
router.get('/rank', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const periodId = req.query.periodId as string;
    
    if (!periodId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PERIOD_ID',
          message: 'Period ID is required'
        }
      });
    }

    const result = await leaderboardService.getLeaderboard(periodId, user.id, 1);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RANK_NOT_FOUND',
          message: 'User rank not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        userEntry: result.data?.userEntry,
        totalParticipants: result.data?.totalParticipants
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user rank'
      }
    });
  }
});

// GET /leaderboard/periods - Get available periods
router.get('/periods', async (req, res) => {
  try {
    const modeType = req.query.modeType as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    
    // This would need to be implemented in leaderboardService
    // For now, return empty array
    res.json({
      success: true,
      data: []
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

// GET /leaderboard/winners/recent - Get recent winners
router.get('/winners/recent', async (req, res) => {
  try {
    const modeType = req.query.modeType as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const result = await leaderboardService.getHistoricalWinners(
      modeType as any,
      limit
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get recent winners'
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
        message: 'Failed to get recent winners'
      }
    });
  }
});

// GET /leaderboard/historical/winners - Get historical winners
router.get('/historical/winners', async (req, res) => {
  try {
    const modeType = req.query.modeType as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const result = await leaderboardService.getHistoricalWinners(
      modeType as any,
      limit
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get historical winners'
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
        message: 'Failed to get historical winners'
      }
    });
  }
});

// GET /leaderboard/:periodId - Get leaderboard for a period
router.get('/:periodId', async (req, res) => {
  try {
    const { periodId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    
    // Get user ID from token if provided (optional)
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authService.getUserFromToken(token);
      userId = user?.id;
    }

    const result = await leaderboardService.getLeaderboard(periodId, userId, limit);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LEADERBOARD_NOT_FOUND',
          message: 'Leaderboard not found'
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
        message: 'Failed to get leaderboard'
      }
    });
  }
});

// GET /leaderboard/:periodId/winners - Get winners for a period (with AI/Actual gating)
router.get('/:periodId/winners', async (req, res) => {
  try {
    const { periodId } = req.params;
    
    // Get user ID from token if provided (for winner gating)
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authService.getUserFromToken(token);
      userId = user?.id;
    }

    const result = await leaderboardService.getWinners(periodId, userId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WINNERS_NOT_FOUND',
          message: 'Winners not found'
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
        message: 'Failed to get winners'
      }
    });
  }
});

// GET /leaderboard/:periodId/stats - Get period statistics
router.get('/:periodId/stats', async (req, res) => {
  try {
    const { periodId } = req.params;

    const result = await leaderboardService.getPeriodStats(periodId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STATS_NOT_FOUND',
          message: 'Period statistics not found'
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
        message: 'Failed to get period statistics'
      }
    });
  }
});

// GET /leaderboard/user/:userId/rank/:periodId - Get user's rank in a period
router.get('/user/:userId/rank/:periodId', authService.authenticate, async (req, res) => {
  try {
    const { userId, periodId } = req.params;
    const currentUser = (req as any).user;

    // Users can only view their own rank unless they're admin
    if (currentUser.id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Cannot view other users\' ranks'
        }
      });
    }

    const result = await leaderboardService.getLeaderboard(periodId, userId, 1);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RANK_NOT_FOUND',
          message: 'User rank not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        userEntry: result.data?.userEntry,
        totalParticipants: result.data?.totalParticipants
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user rank'
      }
    });
  }
});


// POST /leaderboard/:periodId/recalculate - Recalculate leaderboard ranks (admin only)
router.post('/:periodId/recalculate', authService.authenticate, async (req, res) => {
  try {
    const { periodId } = req.params;
    const user = (req as any).user;

    // Check if user is admin (you can implement admin role checking)
    // For now, we'll allow any authenticated user to trigger recalculation
    
    const result = await leaderboardService.recalculateRanks(periodId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'RECALCULATE_FAILED',
          message: 'Failed to recalculate ranks'
        }
      });
    }

    res.json({
      success: true,
      message: 'Leaderboard ranks recalculated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to recalculate leaderboard'
      }
    });
  }
});

export default router;