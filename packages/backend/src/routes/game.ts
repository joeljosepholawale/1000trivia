import { Router } from 'express';
import { authService } from '../services/auth';
import { gameService } from '../services/game';
import { paymentService } from '../services/payment';
import { db } from '../services/database';
import { CreateSessionSchema, SubmitAnswerSchema } from '@1000ravier/shared';

const router = Router();

// POST /game/join - Join a game mode/period
router.post('/join', authService.authenticate, authService.requireEmailVerification, async (req, res) => {
  try {
    const user = (req as any).user;
    const { periodId, deviceInfo } = req.body;

    // Validate input
    const validation = CreateSessionSchema.safeParse({
      periodId,
      deviceInfo
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid session data',
          details: validation.error.issues
        }
      });
    }

    const result = await gameService.joinGameMode(
      user.id,
      periodId,
      deviceInfo,
      req.ip
    );

    if (!result.success) {
      // Check if payment is required
      if (result.data?.requiresPayment) {
        return res.status(402).json({
          success: false,
          error: {
            code: 'PAYMENT_REQUIRED',
            message: result.message
          },
          data: result.data
        });
      }

      return res.status(400).json({
        success: false,
        error: {
          code: 'JOIN_FAILED',
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
        message: 'Failed to join game'
      }
    });
  }
});

// POST /game/join-with-payment - Join a game after successful payment
router.post('/join-with-payment', authService.authenticate, authService.requireEmailVerification, async (req, res) => {
  try {
    const user = (req as any).user;
    const { periodId, paymentIntentId, deviceInfo } = req.body;

    if (!periodId || !paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Period ID and payment intent ID are required'
        }
      });
    }

    // Validate payment
    const paymentValidation = await paymentService.validateEntryPayment(user.id, periodId);
    if (!paymentValidation.success || !paymentValidation.isPaid) {
      return res.status(402).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_VERIFIED',
          message: 'Payment not verified for this game entry'
        }
      });
    }

    // Now join the game
    const result = await gameService.joinGameMode(
      user.id,
      periodId,
      deviceInfo,
      req.ip
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'JOIN_FAILED',
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
        message: 'Failed to join game with payment'
      }
    });
  }
});

// GET /game/session/:sessionId - Get session info
router.get('/session/:sessionId', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { sessionId } = req.params;

    const result = await gameService.getSessionInfo(sessionId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: result.message || 'Session not found'
        }
      });
    }

    // Verify session belongs to user
    const session = await db.getGameSession(sessionId);
    if (!session || session.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session does not belong to user'
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
        message: 'Failed to get session info'
      }
    });
  }
});

// POST /game/session/:sessionId/resume - Resume a paused session
router.post('/session/:sessionId/resume', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { sessionId } = req.params;

    // Verify session belongs to user
    const session = await db.getGameSession(sessionId);
    if (!session || session.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session does not belong to user'
        }
      });
    }

    const result = await gameService.resumeSession(sessionId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'RESUME_FAILED',
          message: result.message || 'Failed to resume session'
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
        message: 'Failed to resume session'
      }
    });
  }
});

// GET /game/session/:sessionId/questions - Get next batch of questions
router.get('/session/:sessionId/questions', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { sessionId } = req.params;
    const batchSize = Math.min(parseInt(req.query.batchSize as string) || 10, 20);

    // Verify session belongs to user
    const session = await db.getGameSession(sessionId);
    if (!session || session.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session does not belong to user'
        }
      });
    }

    const result = await gameService.getNextQuestions(sessionId, batchSize);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'GET_QUESTIONS_FAILED',
          message: result.message || 'Failed to get questions'
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
        message: 'Failed to get questions'
      }
    });
  }
});

// POST /game/session/:sessionId/answer - Submit an answer
router.post('/session/:sessionId/answer', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { sessionId } = req.params;
    const { questionId, selectedAnswer, responseTime, isSkipped, deviceInfo } = req.body;

    // Validate input
    const validation = SubmitAnswerSchema.safeParse({
      sessionId,
      questionId,
      selectedAnswer,
      responseTime,
      isSkipped: isSkipped || false
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid answer data',
          details: validation.error.issues
        }
      });
    }

    // Verify session belongs to user
    const session = await db.getGameSession(sessionId);
    if (!session || session.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session does not belong to user'
        }
      });
    }

    const result = await gameService.submitAnswer(
      sessionId,
      questionId,
      selectedAnswer,
      responseTime,
      isSkipped || false,
      deviceInfo,
      req.ip
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SUBMIT_ANSWER_FAILED',
          message: result.message || 'Failed to submit answer'
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
        message: 'Failed to submit answer'
      }
    });
  }
});

// GET /game/sessions/active - Get user's active sessions
router.get('/sessions/active', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    const result = await gameService.getUserActiveSessions(user.id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get active sessions'
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
        message: 'Failed to get active sessions'
      }
    });
  }
});

// GET /game/history - Get user's game history
router.get('/history', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const { data, error, count } = await db.getClient()
      .from('game_sessions')
      .select(`
        *,
        period:periods(
          *,
          mode:game_modes(*)
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .in('status', ['COMPLETED', 'CANCELLED', 'EXPIRED'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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
        message: 'Failed to get game history'
      }
    });
  }
});

// GET /game/stats - Get user's game statistics
router.get('/stats', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    const { data: sessions } = await db.getClient()
      .from('game_sessions')
      .select('score, correct_answers, answered_questions, total_time_spent, status')
      .eq('user_id', user.id)
      .eq('status', 'COMPLETED');

    const { data: wins } = await db.getClient()
      .from('winners')
      .select('payout_amount, rank')
      .eq('user_id', user.id)
      .eq('status', 'PAID');

    const completedSessions = sessions || [];
    const totalWins = wins || [];

    const stats = {
      totalGamesPlayed: completedSessions.length,
      totalWins: totalWins.length,
      averageScore: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + s.score, 0) / completedSessions.length 
        : 0,
      bestScore: Math.max(...completedSessions.map(s => s.score), 0),
      totalEarnings: totalWins.reduce((sum, w) => sum + w.payout_amount, 0),
      averageAccuracy: completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.correct_answers / s.answered_questions), 0) / completedSessions.length
        : 0,
      totalPlayTime: completedSessions.reduce((sum, s) => sum + s.total_time_spent, 0),
      bestRank: totalWins.length > 0 ? Math.min(...totalWins.map(w => w.rank)) : null
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get game statistics'
      }
    });
  }
});

export default router;