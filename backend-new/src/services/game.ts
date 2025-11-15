import { db } from './database';
import { walletService } from './wallet';
import { geminiQuestionService } from './geminiQuestions';
import { 
  config, 
  randomizeQuestions, 
  validateSession,
  detectAntiCheat,
  calculateScore,
  isPeriodActive,
  ModeType
} from '@1000ravier/shared';
import winston from 'winston';
import { v5 as uuidv5 } from 'uuid';

// Namespace UUID used to deterministically derive UUIDs for AI-only session questions
// This ensures we always send a valid UUID to the database even though AI questions
// are not stored in the questions table.
const AI_QUESTION_NAMESPACE = '123e4567-e89b-12d3-a456-426614174000';

export class GameService {
  private logger: winston.Logger;
  private activeSessions: Map<string, { lastActivity: Date; submissionCount: number }>;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/game.log' })
      ]
    });

    this.activeSessions = new Map();

    // Clean inactive sessions every 5 minutes
    setInterval(() => this.cleanInactiveSessions(), 5 * 60 * 1000);

    this.logger.info('Game service initialized');
  }

  private cleanInactiveSessions() {
    const now = new Date();
    const timeout = config.getConfig().game.maxResumeTimeMinutes * 60 * 1000;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > timeout) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  // Join a game mode/period
  async joinGameMode(
    userId: string,
    periodId: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: { sessionId: string; requiresPayment?: boolean; paymentAmount?: number };
  }> {
    try {
      // Get period and mode info
      const period = await db.getPeriodById(periodId);
      if (!period) {
        return { success: false, message: 'Game period not found' };
      }

      // Check if period is active
      if (!isPeriodActive(period.start_date, period.end_date)) {
        return { success: false, message: 'Game period is not active' };
      }

      // Check if user already has a session for this period
      const existingSession = await db.getClient()
        .from('game_sessions')
        .select('id, status')
        .eq('user_id', userId)
        .eq('period_id', periodId)
        .single();

      if (existingSession.data && existingSession.data.status !== 'CANCELLED') {
        // User already joined this period
        if (existingSession.data.status === 'COMPLETED') {
          return { success: false, message: 'You have already completed this game' };
        } else {
          // Check if session has questions assigned
          const { data: questions, error: questionsError } = await db.getClient()
            .from('session_questions')
            .select('id')
            .eq('session_id', existingSession.data.id)
            .limit(1);

          if (!questionsError && questions && questions.length > 0) {
            // Session has questions, resume it
            return {
              success: true,
              message: 'Resuming existing game session',
              data: { sessionId: existingSession.data.id }
            };
          } else {
            // Session has no questions - delete it and create a new one
            this.logger.warn(`Deleting broken session ${existingSession.data.id} with no questions`);
            
            await db.getClient().from('answers').delete().eq('session_id', existingSession.data.id);
            await db.getClient().from('session_questions').delete().eq('session_id', existingSession.data.id);
            await db.getClient().from('leaderboard_entries').delete().eq('session_id', existingSession.data.id);
            await db.getClient().from('game_sessions').delete().eq('id', existingSession.data.id);
            
            this.logger.info(`Deleted broken session, will create new one`);
            // Continue to create new session below
          }
        }
      }

      const mode = period.mode;

      // Cap the number of questions per session to avoid long AI generation times
      // This keeps the DB-configured value (mode.questions) as an upper bound
      // but ensures we only generate a manageable number per session.
      const totalQuestionsForSession = Math.min(mode.questions, 30);
      
      // Handle entry fee
      if (mode.entry_fee > 0) {
        if (mode.entry_fee_currency === 'CREDITS') {
          // Deduct credits
          const deductResult = await walletService.deductCreditsForEntry(
            userId,
            mode.entry_fee,
            mode.type,
            periodId
          );

          if (!deductResult.success) {
            return { 
              success: false, 
              message: deductResult.message 
            };
          }
        } else if (mode.entry_fee_currency === 'USD') {
          // Return payment requirement (handled by payment service)
          return {
            success: false,
            message: 'Payment required',
            data: {
              sessionId: '',
              requiresPayment: true,
              paymentAmount: mode.entry_fee
            }
          };
        }
      }

      // Create game session FIRST - store the FULL configured question count
      // so that client UX can always display progress like 1/100, 2/100, etc.
      const session = await db.createGameSession({
        userId,
        periodId,
        totalQuestions: mode.questions,
        deviceInfo,
        ipAddress
      });

      this.logger.info(`Created session ${session.id}, generating ${totalQuestionsForSession} questions`);

      // Generate AI questions for this session (in-memory only)
      const useAIGeneration = process.env.USE_AI_QUESTIONS === 'true';
      
      if (useAIGeneration) {
        try {
          const aiResult = await geminiQuestionService.generateQuestionsForSession(
            session.id,
            totalQuestionsForSession,
            mode.type, // category based on game mode
            'en'
          );

          if (!aiResult.success || !aiResult.questions || aiResult.questions.length === 0) {
            this.logger.error('AI generation failed, cannot continue');
            await db.getClient().from('game_sessions').delete().eq('id', session.id);
            return { success: false, message: 'Failed to generate questions' };
          }

          this.logger.info(`Successfully generated ${aiResult.questions.length} AI questions in memory for session ${session.id}`);
        } catch (aiError) {
          this.logger.error('AI generation error:', aiError);
          await db.getClient().from('game_sessions').delete().eq('id', session.id);
          return { success: false, message: 'Failed to generate questions' };
        }
      } else {
        // Use database questions (old method - still saves to session_questions table)
        const questions = await db.getRandomQuestions('en', totalQuestionsForSession);
        if (questions.length < totalQuestionsForSession) {
          this.logger.error(`Not enough questions: need ${totalQuestionsForSession}, found ${questions.length}`);
          await db.getClient().from('game_sessions').delete().eq('id', session.id);
          return { success: false, message: 'Not enough questions available' };
        }

        this.logger.info(`Fetched ${questions.length} database questions`);

        try {
          await db.createSessionQuestions(session.id, questions);
        } catch (error) {
          this.logger.error('Failed to assign questions, deleting session:', error);
          await db.getClient().from('game_sessions').delete().eq('id', session.id);
          throw error;
        }
      }

      // Track session activity
      this.activeSessions.set(session.id, {
        lastActivity: new Date(),
        submissionCount: 0
      });

      // Analytics
      await db.createAnalyticsEvent({
        userId,
        eventName: 'game_joined',
        properties: {
          modeType: mode.type,
          periodId,
          entryFee: mode.entry_fee,
          entryFeeCurrency: mode.entry_fee_currency
        },
        deviceInfo,
        ipAddress
      });

      this.logger.info(`User joined game: ${userId}, session: ${session.id}, mode: ${mode.type}`);

      return {
        success: true,
        message: 'Successfully joined the game',
        data: { sessionId: session.id }
      };
    } catch (error) {
      this.logger.error('Error joining game mode:', error);
      return {
        success: false,
        message: 'Failed to join game'
      };
    }
  }

  // Get next batch of questions
  async getNextQuestions(
    sessionId: string,
    batchSize: number = 10
  ): Promise<{
    success: boolean;
    data?: {
      questions: any[];
      currentIndex: number;
      totalQuestions: number;
      timeRemaining?: number;
    };
    message?: string;
  }> {
    try {
      const session = await db.getGameSession(sessionId);
      if (!session) {
        return { success: false, message: 'Session not found' };
      }

      // Check session status
      if (session.status !== 'ACTIVE' && session.status !== 'PAUSED') {
        return { success: false, message: 'Session is not active' };
      }

      const useAIGeneration = process.env.USE_AI_QUESTIONS === 'true';
      let clientQuestions: any[] = [];

      if (useAIGeneration) {
        // Get questions from memory
        const questions = geminiQuestionService.getSessionQuestions(
          sessionId,
          batchSize,
          session.current_question_index
        );

        // Trigger background generation of remaining questions up to the session total.
        // This is fire-and-forget and will not delay the current response.
        const existingForSession = geminiQuestionService.getSessionQuestions(sessionId);
        if (existingForSession.length < session.total_questions) {
          void geminiQuestionService.ensureQuestionsForSession(
            sessionId,
            session.total_questions,
            session.period?.mode?.type,
            'en'
          );
        }

        // Format questions for client (remove correct answers)
        clientQuestions = questions.map((q, index) => ({
          id: q.sessionQuestionId, // Use sessionQuestionId as the ID
          sessionQuestionId: q.sessionQuestionId,
          index: session.current_question_index + index,
          text: q.text,
          options: q.randomized_options,
          imageUrl: null,
          timeLimit: config.getConfig().game.defaultQuestionTimer
        }));
      } else {
        // Get questions from database (old method)
        const questions = await db.getSessionQuestions(
          sessionId,
          batchSize,
          session.current_question_index
        );

        // Format questions for client (remove correct answers)
        clientQuestions = questions.map((sq, index) => ({
          id: sq.question.id,
          sessionQuestionId: sq.id,
          index: session.current_question_index + index,
          text: sq.question.text,
          options: sq.randomized_options,
          imageUrl: sq.question.image_url,
          timeLimit: config.getConfig().game.defaultQuestionTimer
        }));
      }

      // Update session activity
      const sessionActivity = this.activeSessions.get(sessionId);
      if (sessionActivity) {
        sessionActivity.lastActivity = new Date();
      }

      // Update last activity
      await db.updateGameSession(sessionId, { 
        last_activity_at: new Date().toISOString() 
      });

      return {
        success: true,
        data: {
          questions: clientQuestions,
          currentIndex: session.current_question_index,
          totalQuestions: session.total_questions,
          timeRemaining: this.calculateTimeRemaining(session)
        }
      };
    } catch (error) {
      this.logger.error('Error getting next questions:', error);
      return {
        success: false,
        message: 'Failed to get questions'
      };
    }
  }

  // Submit answer
  async submitAnswer(
    sessionId: string,
    questionId: string,
    selectedAnswer: string | null,
    responseTime: number,
    isSkipped: boolean = false,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<{
    success: boolean;
    data?: {
      isCorrect: boolean;
      correctAnswer?: string;
      score: number;
      sessionComplete: boolean;
      progress: {
        answeredQuestions: number;
        totalQuestions: number;
        currentIndex: number;
      };
    };
    message?: string;
  }> {
    try {
      // Normalize response time to avoid NaN/invalid values breaking DB writes
      const safeResponseTime = (typeof responseTime === 'number' && isFinite(responseTime) && responseTime >= 0)
        ? responseTime
        : 0;

      // Get session
      const session = await db.getGameSession(sessionId);
      if (!session) {
        return { success: false, message: 'Session not found' };
      }

      // Check session status
      if (session.status !== 'ACTIVE' && session.status !== 'PAUSED') {
        return { success: false, message: 'Session cannot accept answers' };
      }

      // Rate limiting check
      const sessionActivity = this.activeSessions.get(sessionId);
      if (sessionActivity) {
        sessionActivity.submissionCount++;
        const submissionsPerMinute = sessionActivity.submissionCount;
        
        if (submissionsPerMinute > 60) {
          this.logger.warn(`Rate limit exceeded for session ${sessionId}`);
          return { success: false, message: 'Submission rate limit exceeded' };
        }
        
        sessionActivity.lastActivity = new Date();
      }

      const useAIGeneration = process.env.USE_AI_QUESTIONS === 'true';
      let correctAnswer: string;
      let actualQuestionId: string;

      if (useAIGeneration) {
        // Get question from memory
        const memoryQuestion = geminiQuestionService.getQuestionById(sessionId, questionId);
        
        if (!memoryQuestion) {
          this.logger.error(`Question not found in memory: sessionId=${sessionId}, questionId=${questionId}`);
          return { success: false, message: 'Question not found' };
        }

        correctAnswer = memoryQuestion.correct_answer;
        // Derive a deterministic UUID from the sessionQuestionId so the answers table
        // can store a valid uuid even though this question exists only in memory.
        actualQuestionId = uuidv5(memoryQuestion.sessionQuestionId, AI_QUESTION_NAMESPACE);

        // Ensure a corresponding stub question exists in the questions table so the
        // answers.question_id foreign key constraint is satisfied. We mark these
        // questions as inactive so they are never selected as regular DB questions.
        try {
          await db.getClient()
            .from('questions')
            .upsert({
              id: actualQuestionId,
              text: memoryQuestion.text,
              options: memoryQuestion.options,
              correct_answer: memoryQuestion.correct_answer,
              language: 'en',
              category: 'general',
              difficulty: 'MEDIUM',
              is_active: false,
            }, { onConflict: 'id' });
        } catch (stubError) {
          this.logger.error('Failed to upsert AI stub question:', stubError);
        }
      } else {
        // Get question from database (old method)
        const { data: sessionQuestion } = await db.getClient()
          .from('session_questions')
          .select(`
            *,
            question:questions(*)
          `)
          .eq('session_id', sessionId)
          .eq('id', questionId)
          .single();

        if (!sessionQuestion) {
          this.logger.error(`Question not found: sessionId=${sessionId}, questionId=${questionId}`);
          return { success: false, message: 'Question not found' };
        }

        correctAnswer = sessionQuestion.question.correct_answer;
        actualQuestionId = sessionQuestion.question_id;
      }

      // Check if answer is correct
      const isCorrect = !isSkipped && selectedAnswer === correctAnswer;

      // Submit answer - only save answer and score, NOT the question
      await db.submitAnswer({
        sessionId,
        questionId: actualQuestionId,
        selectedAnswer: isSkipped ? undefined : selectedAnswer,
        isCorrect,
        isSkipped,
        responseTime: safeResponseTime
      });

      // Update session stats
      const newStats = {
        answered_questions: session.answered_questions + 1,
        correct_answers: isCorrect ? session.correct_answers + 1 : session.correct_answers,
        incorrect_answers: !isSkipped && !isCorrect ? session.incorrect_answers + 1 : session.incorrect_answers,
        skipped_answers: isSkipped ? session.skipped_answers + 1 : session.skipped_answers,
        score: calculateScore(isCorrect ? session.correct_answers + 1 : session.correct_answers),
        current_question_index: session.current_question_index + 1,
        total_time_spent: session.total_time_spent + safeResponseTime,
        average_response_time: (session.total_time_spent + safeResponseTime) / (session.answered_questions + 1)
      };

      // Check if session is completed
      const totalQuestions = (session as any).total_questions || 100;
      const isCompleted = newStats.current_question_index >= totalQuestions;
      if (isCompleted) {
        (newStats as any)['status'] = 'COMPLETED';
        (newStats as any)['completed_at'] = new Date().toISOString();
        
        // Update leaderboard
        await this.updateLeaderboard(sessionId, session.user_id, session.period_id, newStats);

        // Clear questions from memory (if using AI generation)
        const useAIGeneration = process.env.USE_AI_QUESTIONS === 'true';
        if (useAIGeneration) {
          geminiQuestionService.clearSessionQuestions(sessionId);
        }
      }

      // Update session
      await db.updateGameSession(sessionId, newStats);

      // Anti-cheat detection
      if (isCompleted) {
        await this.performAntiCheatCheck(sessionId, session.user_id, deviceInfo, ipAddress);
      }

      // Analytics
      await db.createAnalyticsEvent({
        userId: session.user_id,
        eventName: isCompleted ? 'game_completed' : 'answer_submitted',
        properties: {
          sessionId,
          questionId,
          isCorrect,
          isSkipped,
          responseTime: safeResponseTime,
          score: newStats.score,
          progress: newStats.answered_questions / totalQuestions
        },
        deviceInfo,
        ipAddress
      });

      this.logger.info(`Answer submitted: ${sessionId}, correct: ${isCorrect}, completed: ${isCompleted}`);

      return {
        success: true,
        data: {
          isCorrect,
          correctAnswer: isSkipped ? correctAnswer : undefined,
          score: newStats.score,
          sessionComplete: isCompleted,
          progress: {
            answeredQuestions: newStats.answered_questions,
            totalQuestions: (session as any).total_questions || 100,
            currentIndex: newStats.current_question_index
          }
        }
      };
    } catch (error) {
      this.logger.error('Error submitting answer:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit answer'
      };
    }
  }

  // Update leaderboard
  private async updateLeaderboard(
    sessionId: string,
    userId: string,
    periodId: string,
    sessionStats: any
  ) {
    try {
      // Get period info for qualification check
      const period = await db.getPeriodById(periodId);
      if (!period) return;

      const isQualified = sessionStats.answered_questions >= period.mode.min_answers_to_qualify;

      // Get current leaderboard to determine rank
      const currentLeaderboard = await db.getLeaderboard(periodId);
      
      // Calculate rank (temporary, will be recalculated)
      let rank = 1;
      for (const entry of currentLeaderboard) {
        if (entry.score > sessionStats.score) {
          rank++;
        } else if (entry.score === sessionStats.score) {
          // Use tie-breaker logic
          if (entry.average_response_time < sessionStats.average_response_time) {
            rank++;
          } else if (
            entry.average_response_time === sessionStats.average_response_time &&
            new Date(entry.completed_at) < new Date(sessionStats.completed_at)
          ) {
            rank++;
          }
        }
      }

      await db.updateLeaderboard({
        userId,
        periodId,
        sessionId,
        rank,
        score: sessionStats.score,
        answeredQuestions: sessionStats.answered_questions,
        correctAnswers: sessionStats.correct_answers,
        averageResponseTime: sessionStats.average_response_time,
        completedAt: sessionStats.completed_at || new Date().toISOString(),
        isQualified
      });

      // Update period participant count
      await db.getClient()
        .from('periods')
        .update({ 
          total_participants: currentLeaderboard.length + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', periodId);

    } catch (error) {
      this.logger.error('Error updating leaderboard:', error);
    }
  }

  // Anti-cheat detection
  private async performAntiCheatCheck(
    sessionId: string,
    userId: string,
    deviceInfo?: string,
    ipAddress?: string
  ) {
    try {
      // Get session answers for pattern analysis
      const { data: answers } = await db.getClient()
        .from('answers')
        .select('is_correct, response_time')
        .eq('session_id', sessionId)
        .order('created_at');

      if (!answers || answers.length === 0) return;

      const scorePattern = answers.map(a => a.is_correct ? 1 : 0);
      const avgResponseTime = answers.reduce((sum, a) => sum + a.response_time, 0) / answers.length;
      
      // Calculate submission rate (simplified)
      const sessionActivity = this.activeSessions.get(sessionId);
      const submissionRate = sessionActivity?.submissionCount || 0;

      // Perform anti-cheat detection
      const antiCheatResult = detectAntiCheat(
        submissionRate,
        scorePattern,
        avgResponseTime,
        deviceInfo || '',
        ipAddress || '',
        config.getConfig()
      );

      if (antiCheatResult.isSuspicious) {
        this.logger.warn(`Suspicious activity detected: ${sessionId}`, {
          userId,
          reasons: antiCheatResult.reasons,
          riskLevel: antiCheatResult.riskLevel
        });

        // Flag session for review
        await db.updateGameSession(sessionId, {
          status: 'CANCELLED', // Or create a 'FLAGGED' status
          updated_at: new Date().toISOString()
        });

        // Create audit log
        await db.createAuditLog({
          userId,
          action: 'ANTI_CHEAT_FLAG',
          resource: 'game_session',
          resourceId: sessionId,
          changes: {
            reasons: antiCheatResult.reasons,
            riskLevel: antiCheatResult.riskLevel,
            submissionRate,
            avgResponseTime,
            scorePattern: scorePattern.slice(0, 10) // First 10 for logging
          },
          ipAddress
        });
      }
    } catch (error) {
      this.logger.error('Error performing anti-cheat check:', error);
    }
  }

  // Get session info
  async getSessionInfo(sessionId: string): Promise<{
    success: boolean;
    data?: {
      session: any;
      canResume: boolean;
      timeRemaining?: number;
    };
    message?: string;
  }> {
    try {
      const session = await db.getGameSession(sessionId);
      if (!session) {
        return { success: false, message: 'Session not found' };
      }

      const validation = validateSession(session, config.getConfig());

      return {
        success: true,
        data: {
          session: {
            id: session.id,
            status: session.status,
            currentQuestionIndex: session.current_question_index,
            totalQuestions: session.total_questions,
            score: session.score,
            answeredQuestions: session.answered_questions,
            correctAnswers: session.correct_answers,
            startedAt: session.started_at,
            completedAt: session.completed_at,
            mode: session.period.mode
          },
          canResume: validation.canResume,
          timeRemaining: this.calculateTimeRemaining(session)
        }
      };
    } catch (error) {
      this.logger.error('Error getting session info:', error);
      return {
        success: false,
        message: 'Failed to get session info'
      };
    }
  }

  private calculateTimeRemaining(session: any): number | undefined {
    if (session.status === 'COMPLETED' || !session.period?.end_date) {
      return undefined;
    }

    const endTime = new Date(session.period.end_date).getTime();
    const now = new Date().getTime();
    
    return Math.max(0, Math.floor((endTime - now) / 1000)); // seconds
  }

  // Resume session
  async resumeSession(sessionId: string): Promise<{
    success: boolean;
    data?: { canResume: boolean; nextQuestionIndex: number };
    message?: string;
  }> {
    try {
      const session = await db.getGameSession(sessionId);
      if (!session) {
        return { success: false, message: 'Session not found' };
      }

      const validation = validateSession(session, config.getConfig());
      
      if (!validation.canResume) {
        return { 
          success: false, 
          message: validation.reason || 'Session cannot be resumed' 
        };
      }

      // Update last activity
      await db.updateGameSession(sessionId, {
        status: 'ACTIVE',
        last_activity_at: new Date().toISOString()
      });

      return {
        success: true,
        data: {
          canResume: true,
          nextQuestionIndex: session.current_question_index
        }
      };
    } catch (error) {
      this.logger.error('Error resuming session:', error);
      return {
        success: false,
        message: 'Failed to resume session'
      };
    }
  }

  // Get user's active sessions
  async getUserActiveSessions(userId: string): Promise<{
    success: boolean;
    data?: any[];
  }> {
    try {
      const { data, error } = await db.getClient()
        .from('game_sessions')
        .select(`
          *,
          period:periods(
            *,
            mode:game_modes(*)
          )
        `)
        .eq('user_id', userId)
        .in('status', ['ACTIVE', 'PAUSED'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      this.logger.error('Error getting user active sessions:', error);
      return { success: false };
    }
  }
}

export const gameService = new GameService();