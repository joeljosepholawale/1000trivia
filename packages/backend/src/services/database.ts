import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '@1000ravier/shared';
import winston from 'winston';

export class DatabaseService {
  private supabase: SupabaseClient;
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/database.log' })
      ]
    });

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    this.logger.info('Database service initialized');
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  // User management
  async createUser(userData: {
    id: string;
    email: string;
    language?: string;
    timezone?: string;
    deviceId?: string;
  }) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .insert({
          id: userData.id,
          email: userData.email,
          language: userData.language || 'de',
          timezone: userData.timezone || 'UTC',
          device_id: userData.deviceId
        })
        .select()
        .single();

      if (error) throw error;

      // Create wallet for user
      await this.createWallet(userData.id);

      this.logger.info(`User created: ${userData.email}`);
      return data;
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      this.logger.error('Error fetching user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      this.logger.error('Error fetching user by email:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Record<string, any>) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error updating user:', error);
      throw error;
    }
  }

  // Auth Session Management
  async createAuthSession(sessionData: {
    user_id: string;
    access_token: string;
    refresh_token: string;
    expires_at: Date;
  }) {
    try {
      const { data, error } = await this.supabase
        .from('auth_sessions')
        .insert({
          user_id: sessionData.user_id,
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
          expires_at: sessionData.expires_at.toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error creating auth session:', error);
      throw error;
    }
  }

  async getAuthSessionByToken(token: string) {
    try {
      const { data, error } = await this.supabase
        .from('auth_sessions')
        .select('*')
        .eq('access_token', token)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      this.logger.error('Error fetching auth session:', error);
      return null;
    }
  }

  // Wallet management
  async createWallet(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('wallets')
        .insert({
          user_id: userId,
          credits_balance: 0,
          ad_rewards_today: 0,
          ad_rewards_reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error creating wallet:', error);
      throw error;
    }
  }

  async getWallet(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      this.logger.error('Error fetching wallet:', error);
      throw error;
    }
  }

  async updateWalletBalance(
    userId: string, 
    amount: number, 
    transactionType: string, 
    description: string,
    reference?: string,
    metadata?: Record<string, any>
  ) {
    try {
      // Start transaction
      const { data: wallet } = await this.supabase
        .from('wallets')
        .select('credits_balance')
        .eq('user_id', userId)
        .single();

      if (!wallet) throw new Error('Wallet not found');

      const newBalance = wallet.credits_balance + amount;
      if (newBalance < 0) throw new Error('Insufficient credits');

      // Update wallet
      await this.supabase
        .from('wallets')
        .update({ 
          credits_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      // Create transaction record
      const { data: transaction, error } = await this.supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          type: transactionType,
          amount,
          balance_after: newBalance,
          description,
          reference,
          metadata,
          status: 'COMPLETED',
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      this.logger.info(`Wallet updated: ${userId}, amount: ${amount}, new balance: ${newBalance}`);
      return { wallet: { credits_balance: newBalance }, transaction };
    } catch (error) {
      this.logger.error('Error updating wallet:', error);
      throw error;
    }
  }

  // Game modes and periods
  async getGameModes() {
    try {
      const { data, error } = await this.supabase
        .from('game_modes')
        .select('*')
        .eq('is_active', true)
        .order('type');

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.logger.error('Error fetching game modes:', error);
      throw error;
    }
  }

  async getActivePeriods() {
    try {
      const { data, error } = await this.supabase
        .from('periods')
        .select(`
          *,
          mode:game_modes(*)
        `)
        .in('status', ['UPCOMING', 'ACTIVE'])
        .order('start_date');

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.logger.error('Error fetching active periods:', error);
      throw error;
    }
  }

  async getPeriodById(periodId: string) {
    try {
      const { data, error } = await this.supabase
        .from('periods')
        .select(`
          *,
          mode:game_modes(*)
        `)
        .eq('id', periodId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      this.logger.error('Error fetching period:', error);
      throw error;
    }
  }

  // Game sessions
  async createGameSession(sessionData: {
    userId: string;
    periodId: string;
    totalQuestions: number;
    deviceInfo?: string;
    ipAddress?: string;
  }) {
    try {
      const { data, error } = await this.supabase
        .from('game_sessions')
        .insert({
          user_id: sessionData.userId,
          period_id: sessionData.periodId,
          total_questions: sessionData.totalQuestions,
          device_info: sessionData.deviceInfo,
          ip_address: sessionData.ipAddress,
          status: 'ACTIVE'
        })
        .select()
        .single();

      if (error) throw error;
      this.logger.info(`Game session created: ${data.id}`);
      return data;
    } catch (error) {
      this.logger.error('Error creating game session:', error);
      throw error;
    }
  }

  async getGameSession(sessionId: string) {
    try {
      const { data, error } = await this.supabase
        .from('game_sessions')
        .select(`
          *,
          period:periods(
            *,
            mode:game_modes(*)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      this.logger.error('Error fetching game session:', error);
      throw error;
    }
  }

  async updateGameSession(sessionId: string, updates: Record<string, any>) {
    try {
      const { data, error } = await this.supabase
        .from('game_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error updating game session:', error);
      throw error;
    }
  }

  // Questions
  async getRandomQuestions(language: string, count: number) {
    try {
      const { data, error } = await this.supabase
        .from('questions')
        .select('*')
        .eq('language', language)
        .eq('is_active', true)
        .limit(count * 2); // Get more than needed for randomization

      if (error) throw error;
      
      // Shuffle and return requested count
      const shuffled = data?.sort(() => 0.5 - Math.random()) || [];
      return shuffled.slice(0, count);
    } catch (error) {
      this.logger.error('Error fetching questions:', error);
      throw error;
    }
  }

  async createSessionQuestions(sessionId: string, questions: any[]) {
    try {
      const sessionQuestions = questions.map((question, index) => ({
        session_id: sessionId,
        question_id: question.id,
        question_index: index,
        randomized_options: question.options.sort(() => 0.5 - Math.random())
      }));

      const { data, error } = await this.supabase
        .from('session_questions')
        .insert(sessionQuestions)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error creating session questions:', error);
      throw error;
    }
  }

  async getSessionQuestions(sessionId: string, limit?: number, offset?: number) {
    try {
      let query = this.supabase
        .from('session_questions')
        .select(`
          *,
          question:questions(*)
        `)
        .eq('session_id', sessionId)
        .order('question_index');

      if (limit) query = query.limit(limit);
      if (offset) query = query.range(offset, offset + (limit || 10) - 1);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.logger.error('Error fetching session questions:', error);
      throw error;
    }
  }

  // Answers
  async submitAnswer(answerData: {
    sessionId: string;
    questionId: string;
    selectedAnswer?: string;
    isCorrect: boolean;
    isSkipped: boolean;
    responseTime: number;
  }) {
    try {
      const { data, error } = await this.supabase
        .from('answers')
        .insert({
          session_id: answerData.sessionId,
          question_id: answerData.questionId,
          selected_answer: answerData.selectedAnswer,
          is_correct: answerData.isCorrect,
          is_skipped: answerData.isSkipped,
          response_time: answerData.responseTime
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error submitting answer:', error);
      throw error;
    }
  }

  // Leaderboards
  async updateLeaderboard(entryData: {
    userId: string;
    periodId: string;
    sessionId: string;
    rank: number;
    score: number;
    answeredQuestions: number;
    correctAnswers: number;
    averageResponseTime: number;
    completedAt: string;
    isQualified: boolean;
  }) {
    try {
      const { data, error } = await this.supabase
        .from('leaderboard_entries')
        .upsert({
          user_id: entryData.userId,
          period_id: entryData.periodId,
          session_id: entryData.sessionId,
          rank: entryData.rank,
          score: entryData.score,
          answered_questions: entryData.answeredQuestions,
          correct_answers: entryData.correctAnswers,
          average_response_time: entryData.averageResponseTime,
          completed_at: entryData.completedAt,
          is_qualified: entryData.isQualified
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error updating leaderboard:', error);
      throw error;
    }
  }

  async getLeaderboard(periodId: string, limit: number = 100) {
    try {
      const { data, error } = await this.supabase
        .from('leaderboard_entries')
        .select(`
          *,
          user:users(id, email)
        `)
        .eq('period_id', periodId)
        .order('rank')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.logger.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  // Analytics and audit
  async createAnalyticsEvent(eventData: {
    userId?: string;
    eventName: string;
    properties?: Record<string, any>;
    deviceInfo?: string;
    ipAddress?: string;
  }) {
    try {
      const { error } = await this.supabase
        .from('analytics_events')
        .insert({
          user_id: eventData.userId,
          event_name: eventData.eventName,
          properties: eventData.properties,
          device_info: eventData.deviceInfo,
          ip_address: eventData.ipAddress,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      this.logger.error('Error creating analytics event:', error);
      // Don't throw, just log as analytics shouldn't break functionality
    }
  }

  async createAuditLog(logData: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    changes?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      const { error } = await this.supabase
        .from('audit_logs')
        .insert({
          user_id: logData.userId,
          action: logData.action,
          resource: logData.resource,
          resource_id: logData.resourceId,
          changes: logData.changes,
          ip_address: logData.ipAddress,
          user_agent: logData.userAgent,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      this.logger.error('Error creating audit log:', error);
      // Don't throw, just log
    }
  }

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await this.supabase
        .from('game_modes')
        .select('id')
        .limit(1);

      if (error) throw error;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      throw error;
    }
  }
}

export const db = new DatabaseService();