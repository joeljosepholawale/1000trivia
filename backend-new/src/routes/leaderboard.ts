import { Router } from 'express';
import { authService } from '../services/auth';
import { leaderboardService } from '../services/leaderboard';

const router = Router();

// GET /leaderboard/rank - Get current user's rank for a period
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

// GET /leaderboard/periods - Get available periods (history of competitions)
router.get('/periods', async (req, res) => {
  try {
    const modeType = req.query.modeType as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    const { db } = await import('../services/database');

    let query = db.getClient()
      .from('periods')
      .select(`
        id,
        name,
        start_date,
        end_date,
        status,
        total_participants,
        prize_pool,
        mode:game_modes(*)
      `)
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (modeType) {
      query = query.eq('mode.type', modeType.toUpperCase());
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const periods = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      totalParticipants: row.total_participants || 0,
      totalPrizePool: row.prize_pool || 0,
      modeId: row.mode?.id,
      mode: row.mode || null,
    }));

    res.json({
      success: true,
      data: periods,
    });
  } catch (error) {
    console.error('Error fetching periods history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get periods',
      },
    });
  }
});

// GET /leaderboard/winners - Get winners list (paged)
router.get('/winners', async (req, res) => {
  try {
    const modeType = req.query.modeType as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const result = await leaderboardService.getHistoricalWinners(
      modeType as any,
      limit,
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get winners',
        },
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching winners:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get winners',
      },
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
      limit,
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get recent winners',
        },
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching recent winners:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get recent winners',
      },
    });
  }
});

// GET /leaderboard/historical/winners - Get historical winners (alias of /winners)
router.get('/historical/winners', async (req, res) => {
  try {
    const modeType = req.query.modeType as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const result = await leaderboardService.getHistoricalWinners(
      modeType as any,
      limit,
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get historical winners',
        },
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching historical winners:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get historical winners',
      },
    });
  }
});

// GET /leaderboard/user/stats - Get basic user stats for leaderboard UI
router.get('/user/stats', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { db } = await import('../services/database');

    const { data: sessions } = await db.getClient()
      .from('game_sessions')
      .select('score, status')
      .eq('user_id', user.id)
      .eq('status', 'COMPLETED');

    const { data: wins } = await db.getClient()
      .from('winners')
      .select('payout_amount, rank')
      .eq('user_id', user.id)
      .eq('status', 'PAID');

    const completedSessions = sessions || [];
    const totalWins = wins || [];

    const totalGames = completedSessions.length;
    const averageScore = totalGames > 0
      ? completedSessions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / totalGames
      : 0;
    const bestRank = totalWins.length > 0
      ? Math.min(...totalWins.map((w: any) => w.rank || 0))
      : 0;
    const winnings = totalWins.reduce((sum: number, w: any) => sum + (w.payout_amount || 0), 0);

    res.json({
      success: true,
      data: {
        totalGames,
        averageScore,
        bestRank,
        winnings,
      },
    });
  } catch (error) {
    console.error('Error fetching user leaderboard stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user stats',
      },
    });
  }
});

// GET /leaderboard/all-time - Get all-time leaderboard
router.get('/all-time', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    
    // Get user ID from token if provided (optional)
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authService.getUserFromToken(token);
      userId = user?.id;
    }

    // Get all-time top players based on cumulative scores across all completed sessions
    const { db } = await import('../services/database');
    const { data, error } = await db.getClient()
      .from('game_sessions')
      .select(`
        user_id,
        users!inner(id, email, username, created_at),
        score
      `)
      .eq('status', 'COMPLETED')
      .not('score', 'is', null);

    if (error) throw error;

    // Aggregate scores by user
    const userScores = new Map<string, { user: any; totalScore: number; gamesPlayed: number }>();
    
    data?.forEach((session: any) => {
      const userId = session.user_id;
      const existing = userScores.get(userId);
      
      if (existing) {
        existing.totalScore += session.score || 0;
        existing.gamesPlayed++;
      } else {
        userScores.set(userId, {
          user: session.users,
          totalScore: session.score || 0,
          gamesPlayed: 1
        });
      }
    });

    // Convert to array and sort by total score
    const leaderboard = Array.from(userScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        userId: entry.user.id,
        username: entry.user.username || entry.user.email?.split('@')[0] || 'Anonymous',
        totalScore: entry.totalScore,
        gamesPlayed: entry.gamesPlayed,
        averageScore: Math.round(entry.totalScore / entry.gamesPlayed)
      }));

    // Find current user's entry if authenticated
    let userEntry = null;
    if (userId) {
      const userRank = leaderboard.findIndex(entry => entry.userId === userId);
      if (userRank !== -1) {
        userEntry = leaderboard[userRank];
      }
    }

    res.json({
      success: true,
      data: {
        entries: leaderboard,
        userEntry,
        totalParticipants: userScores.size
      }
    });
  } catch (error) {
    console.error('Error fetching all-time leaderboard:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get all-time leaderboard'
      }
    });
  }
});

// GET /leaderboard - Get leaderboard with query param support (frontend compatibility)
router.get('/', async (req, res) => {
  try {
    // Support both query param (?period=weekly) and path param
    const period = req.query.period as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

    if (!period) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PERIOD',
          message: 'Period parameter is required'
        }
      });
    }

    // Get user ID from token if provided (optional)
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authService.getUserFromToken(token);
      userId = user?.id;
    }

    // Convert period type ("weekly", "monthly") to actual period ID
    // First, check if period is already a UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let periodId = period;
    
    if (!uuidPattern.test(period)) {
      // It's a period type like "weekly" or "monthly", need to look up active period
      const { db } = await import('../services/database');
      const periodType = period.toUpperCase();
      
      const { data: activePeriod, error } = await db.getClient()
        .from('periods')
        .select('id, mode_id, game_modes!inner(period_type)')
        .eq('game_modes.period_type', periodType)
        .eq('status', 'ACTIVE')
        .order('start_date', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !activePeriod) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PERIOD_NOT_FOUND',
            message: `No active ${period} period found`
          }
        });
      }
      
      periodId = activePeriod.id;
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