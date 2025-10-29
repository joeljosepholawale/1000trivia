import { db } from './database';
import { 
  config, 
  determineWinners, 
  shouldShowActualWinners,
  generateAIWinners,
  ModeType
} from '@1000ravier/shared';
import winston from 'winston';

export class LeaderboardService {
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
        new winston.transports.File({ filename: 'logs/leaderboard.log' })
      ]
    });

    this.logger.info('Leaderboard service initialized');
  }

  // Get leaderboard for a period
  async getLeaderboard(
    periodId: string,
    userId?: string,
    limit: number = 100
  ): Promise<{
    success: boolean;
    data?: {
      entries: any[];
      userEntry?: any;
      period: any;
      totalParticipants: number;
    };
  }> {
    try {
      // Get period info
      const period = await db.getPeriodById(periodId);
      if (!period) {
        return { success: false };
      }

      // Get leaderboard entries
      const entries = await db.getLeaderboard(periodId, limit);

      // Get user's entry if userId provided
      let userEntry = null;
      if (userId) {
        const { data: userLeaderboardEntry } = await db.getClient()
          .from('leaderboard_entries')
          .select(`
            *,
            user:users(id, email)
          `)
          .eq('period_id', periodId)
          .eq('user_id', userId)
          .single();

        userEntry = userLeaderboardEntry;
      }

      return {
        success: true,
        data: {
          entries,
          userEntry,
          period,
          totalParticipants: period.total_participants
        }
      };
    } catch (error) {
      this.logger.error('Error getting leaderboard:', error);
      return { success: false };
    }
  }

  // Get winners for a period with AI/Actual gating
  async getWinners(
    periodId: string,
    userId?: string
  ): Promise<{
    success: boolean;
    data?: {
      winners: any[];
      showingActualWinners: boolean;
      period: any;
    };
  }> {
    try {
      // Get period info
      const period = await db.getPeriodById(periodId);
      if (!period) {
        return { success: false };
      }

      let showingActualWinners = true;
      let winners = [];

      // If user is provided, check gating
      if (userId) {
        const user = await db.getUserById(userId);
        if (user) {
          showingActualWinners = shouldShowActualWinners(
            user.lifetime_earnings_ngn || 0,
            period.mode.type as ModeType,
            config.getConfig()
          );
        }
      }

      if (showingActualWinners) {
        // Show actual winners
        const { data: actualWinners } = await db.getClient()
          .from('winners')
          .select(`
            *,
            user:users(id, email)
          `)
          .eq('period_id', periodId)
          .order('rank');

        winners = actualWinners || [];
      } else {
        // Show AI winners
        winners = generateAIWinners(
          period.mode.type as ModeType,
          period.mode.max_winners,
          period.mode.payout
        );
      }

      return {
        success: true,
        data: {
          winners,
          showingActualWinners,
          period
        }
      };
    } catch (error) {
      this.logger.error('Error getting winners:', error);
      return { success: false };
    }
  }

  // Finalize period and determine winners
  async finalizePeriod(periodId: string): Promise<{
    success: boolean;
    data?: { winnersCreated: number; fraudCases: number };
  }> {
    try {
      const period = await db.getPeriodById(periodId);
      if (!period) {
        return { success: false };
      }

      if (period.status !== 'ACTIVE') {
        this.logger.warn(`Attempting to finalize non-active period: ${periodId}`);
        return { success: false };
      }

      // Get all qualified leaderboard entries
      const leaderboardEntries = await db.getLeaderboard(periodId, 1000); // Get all entries
      const qualifiedEntries = leaderboardEntries.filter(entry => entry.is_qualified);

      // Determine winners using tie-breaker logic
      const winners = determineWinners(
        qualifiedEntries,
        period.mode.max_winners,
        period.mode.min_answers_to_qualify
      );

      let winnersCreated = 0;
      let fraudCases = 0;

      // Create winner records
      for (let i = 0; i < winners.length; i++) {
        const winner = winners[i];

        // Perform final fraud check
        const fraudCheck = await this.performFraudCheck(winner.session_id, winner.user_id);
        
        if (fraudCheck.isSuspicious) {
          fraudCases++;
          this.logger.warn(`Fraud detected in winner: ${winner.user_id}`, fraudCheck);
          
          // Create audit log
          await db.createAuditLog({
            userId: winner.user_id,
            action: 'WINNER_FRAUD_DETECTED',
            resource: 'winner',
            resourceId: winner.id,
            changes: fraudCheck
          });
          
          continue; // Skip this winner
        }

        // Create winner record
        const { error } = await db.getClient()
          .from('winners')
          .insert({
            user_id: winner.user_id,
            period_id: periodId,
            rank: i + 1,
            score: winner.score,
            payout_amount: period.mode.payout,
            payout_currency: period.mode.payout_currency,
            status: 'PENDING'
          });

        if (!error) {
          winnersCreated++;

          // Update user's lifetime earnings (for gating logic)
          await this.updateUserLifetimeEarnings(winner.user_id, period.mode.payout);
        }
      }

      // Update period status
      await db.getClient()
        .from('periods')
        .update({
          status: 'COMPLETED',
          updated_at: new Date().toISOString()
        })
        .eq('id', periodId);

      // Create audit log
      await db.createAuditLog({
        action: 'PERIOD_FINALIZED',
        resource: 'period',
        resourceId: periodId,
        changes: {
          winnersCreated,
          fraudCases,
          totalParticipants: period.total_participants
        }
      });

      this.logger.info(`Period finalized: ${periodId}, winners: ${winnersCreated}, fraud cases: ${fraudCases}`);

      return {
        success: true,
        data: { winnersCreated, fraudCases }
      };
    } catch (error) {
      this.logger.error('Error finalizing period:', error);
      return { success: false };
    }
  }

  // Perform comprehensive fraud check
  private async performFraudCheck(sessionId: string, userId: string): Promise<{
    isSuspicious: boolean;
    reasons: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  }> {
    try {
      const reasons: string[] = [];
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

      // Check for duplicate IP addresses in the same period
      const { data: samePeriodSessions } = await db.getClient()
        .from('game_sessions')
        .select('ip_address, user_id')
        .eq('period_id', (await db.getGameSession(sessionId))?.period_id)
        .not('user_id', 'eq', userId);

      const sessionData = await db.getGameSession(sessionId);
      if (sessionData?.ip_address) {
        const duplicateIPs = samePeriodSessions?.filter(s => 
          s.ip_address === sessionData.ip_address && s.user_id !== userId
        ) || [];

        if (duplicateIPs.length > 0) {
          reasons.push('Multiple accounts from same IP address');
          riskLevel = 'HIGH';
        }
      }

      // Check response time patterns
      const { data: answers } = await db.getClient()
        .from('answers')
        .select('response_time, is_correct')
        .eq('session_id', sessionId)
        .order('created_at');

      if (answers && answers.length > 0) {
        const avgResponseTime = answers.reduce((sum, a) => sum + a.response_time, 0) / answers.length;
        const correctAnswers = answers.filter(a => a.is_correct).length;
        const accuracy = correctAnswers / answers.length;

        // Too fast with high accuracy
        if (avgResponseTime < 2 && accuracy > 0.9) {
          reasons.push('Unrealistic response times with high accuracy');
          riskLevel = 'HIGH';
        }

        // Check for patterns in response times
        const responseTimes = answers.map(a => a.response_time);
        const variance = this.calculateVariance(responseTimes);
        
        if (variance < 0.5 && answers.length > 50) {
          reasons.push('Suspiciously consistent response times');
          riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
        }
      }

      // Check for device fingerprint anomalies
      if (sessionData?.device_info) {
        const { data: sameDeviceSessions } = await db.getClient()
          .from('game_sessions')
          .select('user_id')
          .eq('device_info', sessionData.device_info)
          .not('user_id', 'eq', userId);

        if (sameDeviceSessions && sameDeviceSessions.length > 2) {
          reasons.push('Multiple accounts from same device');
          riskLevel = 'HIGH';
        }
      }

      // Check user's historical performance
      const { data: userSessions } = await db.getClient()
        .from('game_sessions')
        .select('score, answered_questions')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false })
        .limit(10);

      if (userSessions && userSessions.length > 1) {
        const currentSession = userSessions[0];
        const avgPreviousScore = userSessions.slice(1).reduce((sum, s) => sum + s.score, 0) / (userSessions.length - 1);
        
        // Sudden dramatic improvement
        if (currentSession.score > avgPreviousScore * 2 && avgPreviousScore > 0) {
          reasons.push('Dramatic performance improvement from historical average');
          riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
        }
      }

      return {
        isSuspicious: reasons.length > 0,
        reasons,
        riskLevel
      };
    } catch (error) {
      this.logger.error('Error performing fraud check:', error);
      return {
        isSuspicious: false,
        reasons: [],
        riskLevel: 'LOW'
      };
    }
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDifferences = numbers.map(num => Math.pow(num - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    
    return variance;
  }

  // Update user's lifetime earnings for winner gating
  private async updateUserLifetimeEarnings(userId: string, payoutAmount: number) {
    try {
      // Convert USD to NGN (approximate rate, should be from real-time API)
      const usdToNgnRate = 800; // This should be dynamic
      const earningsNGN = payoutAmount * usdToNgnRate;

      await db.getClient()
        .from('users')
        .update({
          lifetime_earnings_ngn: db.getClient().sql`lifetime_earnings_ngn + ${earningsNGN}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    } catch (error) {
      this.logger.error('Error updating lifetime earnings:', error);
    }
  }

  // Recalculate ranks (for real-time leaderboards)
  async recalculateRanks(periodId: string): Promise<{ success: boolean }> {
    try {
      const entries = await db.getLeaderboard(periodId, 1000);

      // Sort entries using tie-breaker logic
      const sortedEntries = entries.sort((a, b) => {
        // 1. Higher score wins
        if (a.score !== b.score) {
          return b.score - a.score;
        }
        
        // 2. Faster average response time wins
        if (a.average_response_time !== b.average_response_time) {
          return a.average_response_time - b.average_response_time;
        }
        
        // 3. Earlier completion wins
        return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
      });

      // Update ranks
      for (let i = 0; i < sortedEntries.length; i++) {
        await db.getClient()
          .from('leaderboard_entries')
          .update({
            rank: i + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', sortedEntries[i].id);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error recalculating ranks:', error);
      return { success: false };
    }
  }

  // Get period statistics
  async getPeriodStats(periodId: string): Promise<{
    success: boolean;
    data?: {
      totalParticipants: number;
      completedSessions: number;
      averageScore: number;
      averageCompletionTime: number;
      topScore: number;
      qualifiedParticipants: number;
    };
  }> {
    try {
      const { data: sessions } = await db.getClient()
        .from('game_sessions')
        .select('score, total_time_spent, status, answered_questions')
        .eq('period_id', periodId);

      const { data: leaderboard } = await db.getClient()
        .from('leaderboard_entries')
        .select('score, is_qualified')
        .eq('period_id', periodId);

      if (!sessions || !leaderboard) {
        return { success: false };
      }

      const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
      const qualifiedParticipants = leaderboard.filter(l => l.is_qualified).length;

      const stats = {
        totalParticipants: sessions.length,
        completedSessions: completedSessions.length,
        averageScore: completedSessions.length > 0 
          ? completedSessions.reduce((sum, s) => sum + s.score, 0) / completedSessions.length 
          : 0,
        averageCompletionTime: completedSessions.length > 0 
          ? completedSessions.reduce((sum, s) => sum + s.total_time_spent, 0) / completedSessions.length 
          : 0,
        topScore: Math.max(...leaderboard.map(l => l.score), 0),
        qualifiedParticipants
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      this.logger.error('Error getting period stats:', error);
      return { success: false };
    }
  }

  // Get historical winners
  async getHistoricalWinners(
    modeType?: ModeType,
    limit: number = 50
  ): Promise<{
    success: boolean;
    data?: any[];
  }> {
    try {
      let query = db.getClient()
        .from('winners')
        .select(`
          *,
          user:users(id, email),
          period:periods(
            *,
            mode:game_modes(*)
          )
        `)
        .eq('status', 'PAID')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (modeType) {
        query = query.eq('period.mode.type', modeType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      this.logger.error('Error getting historical winners:', error);
      return { success: false };
    }
  }

  // Admin function to review and approve winners
  async reviewWinner(
    winnerId: string,
    action: 'APPROVE' | 'REJECT',
    adminId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      };

      if (action === 'APPROVE') {
        updates.status = 'APPROVED';
        updates.approved_at = new Date().toISOString();
        updates.approved_by = adminId;
      } else {
        updates.status = 'REJECTED';
        updates.rejected_at = new Date().toISOString();
        updates.rejection_reason = reason;
      }

      const { error } = await db.getClient()
        .from('winners')
        .update(updates)
        .eq('id', winnerId);

      if (error) throw error;

      // Create audit log
      await db.createAuditLog({
        userId: adminId,
        action: `WINNER_${action}`,
        resource: 'winner',
        resourceId: winnerId,
        changes: { action, reason }
      });

      this.logger.info(`Winner ${action.toLowerCase()}: ${winnerId} by ${adminId}`);

      return {
        success: true,
        message: `Winner ${action.toLowerCase()} successfully`
      };
    } catch (error) {
      this.logger.error('Error reviewing winner:', error);
      return {
        success: false,
        message: 'Failed to review winner'
      };
    }
  }
}

export const leaderboardService = new LeaderboardService();