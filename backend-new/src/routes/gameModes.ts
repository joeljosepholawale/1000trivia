import express, { Request, Response } from 'express';
import { gameModesManager } from '../services/gameModesManager';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/game-modes
 * Get all available game modes
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const gameModes = await gameModesManager.getAllGameModes();
    res.json({
      success: true,
      data: gameModes
    });
  } catch (error) {
    console.error('Error fetching game modes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game modes'
    });
  }
});

/**
 * GET /api/game-modes/periods/active
 * Get all active periods across all game modes
 */
router.get('/periods/active', async (req: Request, res: Response) => {
  try {
    const { db } = await import('../services/database');
    const { data, error } = await db.getClient()
      .from('periods')
      .select(`
        *,
        mode:game_modes(*)
      `)
      .in('status', ['UPCOMING', 'ACTIVE'])
      .order('start_date', { ascending: true });
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching active periods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active periods'
    });
  }
});

/**
 * GET /api/game-modes/:modeType
 * Get specific game mode details
 */
router.get('/:modeType', async (req: Request, res: Response) => {
  try {
    const { modeType } = req.params;
    const gameMode = await gameModesManager.getGameMode(modeType);
    
    if (!gameMode) {
      return res.status(404).json({
        success: false,
        error: 'Game mode not found'
      });
    }

    res.json({
      success: true,
      data: gameMode
    });
  } catch (error) {
    console.error('Error fetching game mode:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game mode'
    });
  }
});

/**
 * GET /api/game-modes/:modeType/bank-balance
 * Get current bank balance for a game mode
 */
router.get('/:modeType/bank-balance', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { modeType } = req.params;
    const gameMode = await gameModesManager.getGameMode(modeType);
    
    if (!gameMode) {
      return res.status(404).json({
        success: false,
        error: 'Game mode not found'
      });
    }

    const bankBalance = await gameModesManager.getBankBalance(gameMode.id);
    
    res.json({
      success: true,
      data: bankBalance
    });
  } catch (error) {
    console.error('Error fetching bank balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bank balance'
    });
  }
});

/**
 * GET /api/game-modes/:modeType/leaderboard
 * Get leaderboard for a game mode (custom or real users based on threshold)
 */
router.get('/:modeType/leaderboard', async (req: Request, res: Response) => {
  try {
    const { modeType } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const leaderboard = await gameModesManager.getLeaderboard(modeType, limit);
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

/**
 * POST /api/game-modes/:modeType/start-session
 * Start a new game session
 */
router.post('/:modeType/start-session', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { modeType } = req.params;
    const userId = (req as any).user.id;
    
    const gameMode = await gameModesManager.getGameMode(modeType);
    
    if (!gameMode) {
      return res.status(404).json({
        success: false,
        error: 'Game mode not found'
      });
    }

    // Check if entry fee is required and paid (for Challenge, Tournament, Super Tournament)
    if (gameMode.entry_fee > 0) {
      const hasPaid = await gameModesManager.hasUserPaidEntry(userId, gameMode.id);
      if (!hasPaid) {
        return res.status(402).json({
          success: false,
          error: 'Entry fee not paid',
          requiresPayment: true,
          entryFee: gameMode.entry_fee
        });
      }
    }

    // Create session in database (simplified - you'll need proper session creation)
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Here you would insert into game_sessions table via Supabase
    // For now, return session info
    
    res.json({
      success: true,
      data: {
        sessionToken,
        gameModeId: gameMode.id,
        questionsRequired: gameMode.questions_required,
        modeType: gameMode.mode_type
      }
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start session'
    });
  }
});

/**
 * POST /api/game-modes/:modeType/submit-score
 * Submit score after completing a game session
 */
router.post('/:modeType/submit-score', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { modeType } = req.params;
    const userId = (req as any).user.id;
    const { sessionId, points, correctAnswers, totalQuestions } = req.body;
    
    if (!sessionId || points === undefined || correctAnswers === undefined || totalQuestions === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const gameMode = await gameModesManager.getGameMode(modeType);
    
    if (!gameMode) {
      return res.status(404).json({
        success: false,
        error: 'Game mode not found'
      });
    }

    const success = await gameModesManager.submitScore(
      userId,
      gameMode.id,
      sessionId,
      points,
      correctAnswers,
      totalQuestions
    );

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to submit score'
      });
    }

    res.json({
      success: true,
      message: 'Score submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit score'
    });
  }
});

/**
 * POST /api/game-modes/:modeType/track-ad
 * Track ad view and update bank balance
 */
router.post('/:modeType/track-ad', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { modeType } = req.params;
    const userId = (req as any).user.id;
    const { sessionId, adNetwork } = req.body;
    
    const gameMode = await gameModesManager.getGameMode(modeType);
    
    if (!gameMode) {
      return res.status(404).json({
        success: false,
        error: 'Game mode not found'
      });
    }

    const success = await gameModesManager.trackAdView(
      userId,
      gameMode.id,
      sessionId || null,
      adNetwork || 'admob'
    );

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to track ad view'
      });
    }

    res.json({
      success: true,
      message: 'Ad view tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking ad:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track ad'
    });
  }
});

/**
 * POST /api/game-modes/:modeType/pay-entry
 * Process entry fee payment (integrates with payment service)
 */
router.post('/:modeType/pay-entry', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { modeType } = req.params;
    const userId = (req as any).user.id;
    const { paymentIntentId } = req.body;
    
    const gameMode = await gameModesManager.getGameMode(modeType);
    
    if (!gameMode) {
      return res.status(404).json({
        success: false,
        error: 'Game mode not found'
      });
    }

    if (gameMode.entry_fee === 0) {
      return res.status(400).json({
        success: false,
        error: 'This game mode is free'
      });
    }

    // Verify payment was successful (you'll integrate with Stripe here)
    // For now, just mark as paid and track entry fee
    
    const marked = await gameModesManager.markEntryPaid(userId, gameMode.id);
    if (!marked) {
      return res.status(500).json({
        success: false,
        error: 'Failed to mark entry as paid'
      });
    }

    const tracked = await gameModesManager.trackEntryFee(userId, gameMode.id);
    if (!tracked) {
      return res.status(500).json({
        success: false,
        error: 'Failed to track entry fee'
      });
    }

    res.json({
      success: true,
      message: 'Entry fee paid successfully'
    });
  } catch (error) {
    console.error('Error processing entry payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process entry payment'
    });
  }
});

/**
 * POST /api/game-modes/:modeType/reset (Admin only)
 * Reset leaderboard for a game mode
 */
router.post('/:modeType/reset', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { modeType } = req.params;
    const userRole = (req as any).user.role;
    
    // Check if user is admin
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Admin access required'
      });
    }

    const gameMode = await gameModesManager.getGameMode(modeType);
    
    if (!gameMode) {
      return res.status(404).json({
        success: false,
        error: 'Game mode not found'
      });
    }

    const success = await gameModesManager.resetLeaderboard(gameMode.id);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to reset leaderboard'
      });
    }

    res.json({
      success: true,
      message: `Leaderboard reset successfully for ${gameMode.display_name}`
    });
  } catch (error) {
    console.error('Error resetting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset leaderboard'
    });
  }
});

export default router;
