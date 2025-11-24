import { Router } from 'express';
import { authService } from '../services/auth';
import { gameService } from '../services/game';
import { paymentService } from '../services/payment';
import { db } from '../services/database';
import { CreateSessionSchema, SubmitAnswerSchema } from '@1000ravier/shared';

const router = Router();

// POST /game/start - Start a game (frontend compatibility endpoint)
router.post('/start', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { deviceInfo } = req.body;

    // Allow period to be provided as UUID or as a type (weekly/monthly)
    const rawPeriod: string | undefined =
      req.body?.periodId || req.body?.period || req.body?.periodType || (req.query.period as string | undefined);

    if (!rawPeriod) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PERIOD', message: 'Period is required' }
      });
    }

    // Resolve period (type -> active period UUID)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let periodId = rawPeriod;

    if (!uuidPattern.test(rawPeriod)) {
      const periodType = rawPeriod.toUpperCase();
      const { data: activePeriod, error } = await db.getClient()
        .from('periods')
        .select('id, start_date, end_date, status, mode:game_modes(period_type)')
        .eq('mode.period_type', periodType)
        .eq('status', 'ACTIVE')
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      if (error || !activePeriod) {
        return res.status(404).json({
          success: false,
          error: { code: 'PERIOD_NOT_FOUND', message: `No active ${rawPeriod} period found` }
        });
      }

      periodId = activePeriod.id;
    }

    // Validate input after resolving periodId
    const validation = CreateSessionSchema.safeParse({ periodId, deviceInfo });
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

    // Join the game
    const joinResult = await gameService.joinGameMode(
      user.id,
      periodId,
      deviceInfo,
      req.ip
    );

    if (!joinResult.success) {
      // Check if payment is required
      if (joinResult.data?.requiresPayment) {
        return res.status(402).json({
          success: false,
          error: {
            code: 'PAYMENT_REQUIRED',
            message: joinResult.message
          },
          data: joinResult.data
        });
      }

      return res.status(400).json({
        success: false,
        error: {
          code: 'START_FAILED',
          message: joinResult.message
        }
      });
    }

    const sessionId = joinResult.data?.sessionId;
    if (!sessionId) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create session'
        }
      });
    }

    // Get all questions for this session
    const questionsResult = await gameService.getNextQuestions(sessionId, 100);

    if (!questionsResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUESTIONS_FAILED',
          message: 'Failed to load questions'
        }
      });
    }

    // Return session with questions
    res.json({
      success: true,
      message: 'Game started successfully',
      data: {
        sessionId,
        questions: questionsResult.data?.questions || [],
        totalQuestions: questionsResult.data?.totalQuestions || 0,
        timeRemaining: questionsResult.data?.timeRemaining
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to start game'
      }
    });
  }
});

// POST /game/answer - Submit answer (frontend compatibility endpoint)
router.post('/answer', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { sessionId, questionId, answer, timeSpent } = req.body;

    if (!sessionId || !questionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Session ID and question ID are required'
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

    // Submit answer using existing service
    const result = await gameService.submitAnswer(
      sessionId,
      questionId,
      answer || null,
      timeSpent || 0,
      !answer, // isSkipped if no answer provided
      req.body.deviceInfo,
      req.ip
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SUBMIT_FAILED',
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

// POST /game/complete - Complete game session (frontend compatibility endpoint)
router.post('/complete', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Session ID is required'
        }
      });
    }

    // Get session and verify ownership
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

    // If already completed, just return the results
    if (session.status === 'COMPLETED') {
      // Get leaderboard entry for rank
      const { data: leaderboardEntry } = await db.getClient()
        .from('leaderboard_entries')
        .select('rank')
        .eq('session_id', sessionId)
        .single();

      return res.json({
        success: true,
        data: {
          sessionId,
          totalScore: session.score,
          correctAnswers: session.correct_answers,
          incorrectAnswers: session.incorrect_answers,
          skippedAnswers: session.skipped_answers,
          earnings: 0, // Will be calculated after winners are determined
          rank: leaderboardEntry?.rank || null,
          status: 'COMPLETED'
        }
      });
    }

    // Mark session as completed
    await db.updateGameSession(sessionId, {
      status: 'COMPLETED',
      completed_at: new Date().toISOString()
    });

    // Get leaderboard entry for rank
    const { data: leaderboardEntry } = await db.getClient()
      .from('leaderboard_entries')
      .select('rank')
      .eq('session_id', sessionId)
      .single();

    // Analytics
    await db.createAnalyticsEvent({
      userId: user.id,
      eventName: 'game_completed',
      properties: {
        sessionId,
        score: session.score,
        correctAnswers: session.correct_answers,
        totalQuestions: session.total_questions
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: {
        sessionId,
        totalScore: session.score,
        correctAnswers: session.correct_answers,
        incorrectAnswers: session.incorrect_answers,
        skippedAnswers: session.skipped_answers,
        earnings: 0, // Will be calculated after winners are determined
        rank: leaderboardEntry?.rank || null,
        status: 'COMPLETED'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to complete game'
      }
    });
  }
});

// POST /game/join - Join a game mode/period
router.post('/join', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { deviceInfo } = req.body;

    // Allow flexible period input
    const rawPeriod: string | undefined =
      req.body?.periodId || req.body?.period || req.body?.periodType || (req.query.period as string | undefined);

    if (!rawPeriod) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PERIOD', message: 'Period is required' }
      });
    }

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let periodId = rawPeriod;
    if (!uuidPattern.test(rawPeriod)) {
      const periodType = rawPeriod.toUpperCase();
      const { data: activePeriod, error } = await db.getClient()
        .from('periods')
        .select('id, start_date, end_date, status, mode:game_modes(period_type)')
        .eq('mode.period_type', periodType)
        .eq('status', 'ACTIVE')
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      if (error || !activePeriod) {
        return res.status(404).json({
          success: false,
          error: { code: 'PERIOD_NOT_FOUND', message: `No active ${rawPeriod} period found` }
        });
      }

      periodId = activePeriod.id;
    }

    // Validate input now that we have a proper UUID
    const validation = CreateSessionSchema.safeParse({ periodId, deviceInfo });
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
router.post('/join-with-payment', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { periodId, txRef, flutterwaveTransactionId, deviceInfo } = req.body;

    if (!periodId || (!txRef && !flutterwaveTransactionId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Period ID and Flutterwave transaction reference are required'
        }
      });
    }

    const txReference = txRef || flutterwaveTransactionId;

    // Validate payment via Flutterwave
    const paymentResult = await paymentService.processFlutterwaveEntryFee(
      user.id,
      periodId,
      txReference,
    );

    if (!paymentResult.success) {
      return res.status(402).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_VERIFIED',
          message: paymentResult.message || 'Payment not verified for this game entry'
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

    // Validate input - temporarily disabled to debug
    // const validation = SubmitAnswerSchema.safeParse({
    //   sessionId,
    //   questionId,
    //   selectedAnswer,
    //   responseTime,
    //   isSkipped: isSkipped || false
    // });

    // if (!validation.success) {
    //   console.error('Validation failed:', validation.error.issues);
    //   return res.status(400).json({
    //     success: false,
    //     error: {
    //       code: 'INVALID_INPUT',
    //       message: 'Invalid answer data',
    //       details: validation.error.issues
    //     }
    //   });
    // }

    // Basic validation
    if (!sessionId || !questionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Session ID and question ID are required'
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
