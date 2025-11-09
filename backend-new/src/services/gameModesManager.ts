import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface GameMode {
  id: string;
  mode_type: 'free' | 'challenge' | 'tournament' | 'super_tournament';
  display_name: string;
  entry_fee: number;
  bank_threshold: number;
  questions_required: number;
  reset_period: 'weekly' | 'monthly';
  ad_revenue_per_view: number;
  is_active: boolean;
}

export interface BankBalance {
  id: string;
  game_mode_id: string;
  current_balance: number;
  total_ad_revenue: number;
  total_entry_fees: number;
  total_payouts: number;
  threshold_reached: boolean;
  threshold_reached_at?: string;
  period_start_date: string;
}

export interface LeaderboardUser {
  rank: number;
  username: string;
  avatar_url?: string;
  points: number;
  questions_answered: number;
  is_custom_user: boolean;
  user_id?: string;
  custom_user_id?: string;
}

export interface CustomUser {
  id: string;
  username: string;
  points: number;
  questionsAnswered: number;
  avatarUrl?: string;
  joinDate: string;
  lastActive: string;
}

class GameModesManager {
  private customUsersCache: Map<string, CustomUser[]> = new Map();

  constructor() {
    this.loadCustomUsers();
  }

  /**
   * Load custom users from JSON files for each game mode
   */
  private loadCustomUsers() {
    const modes = ['free', 'challenge', 'tournament', 'super-tournament'];
    
    modes.forEach(mode => {
      try {
        const filePath = path.join(__dirname, `../../data/customUsers-${mode}.json`);
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, 'utf8');
          const users: CustomUser[] = JSON.parse(data);
          this.customUsersCache.set(mode, users);
          console.log(`Loaded ${users.length} custom users for ${mode} mode`);
        } else {
          // File doesn't exist, just use empty array (optional feature)
          this.customUsersCache.set(mode, []);
        }
      } catch (error) {
        // Silently fall back to empty array if there's any error
        this.customUsersCache.set(mode, []);
      }
    });
  }

  /**
   * Get game mode by type
   */
  async getGameMode(modeType: string): Promise<GameMode | null> {
    const { data, error } = await supabase
      .from('game_modes')
      .select('*')
      .eq('mode_type', modeType)
      .single();

    if (error) {
      console.error(`Error fetching game mode ${modeType}:`, error);
      return null;
    }

    return data;
  }

  /**
   * Get current bank balance for a game mode
   */
  async getBankBalance(gameModeId: string): Promise<BankBalance | null> {
    const { data, error } = await supabase
      .from('bank_balances')
      .select('*')
      .eq('game_mode_id', gameModeId)
      .order('period_start_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error(`Error fetching bank balance:`, error);
      return null;
    }

    return data;
  }

  /**
   * Track ad view and update bank balance
   */
  async trackAdView(
    userId: string,
    gameModeId: string,
    sessionId: string | null,
    adNetwork: string = 'admob'
  ): Promise<boolean> {
    try {
      // Get game mode to get revenue amount
      const gameMode = await this.getGameMode(gameModeId);
      if (!gameMode) return false;

      const revenue = gameMode.ad_revenue_per_view;

      // Insert ad view record
      const { error: adError } = await supabase
        .from('ad_views')
        .insert({
          user_id: userId,
          game_mode_id: gameModeId,
          session_id: sessionId,
          ad_network: adNetwork,
          revenue_earned: revenue
        });

      if (adError) {
        console.error('Error tracking ad view:', adError);
        return false;
      }

      // Update bank balance
      const bankBalance = await this.getBankBalance(gameModeId);
      if (!bankBalance) return false;

      const newBalance = parseFloat(bankBalance.current_balance.toString()) + revenue;
      const newAdRevenue = parseFloat(bankBalance.total_ad_revenue.toString()) + revenue;
      
      const threshold_reached = newBalance >= parseFloat(gameMode.bank_threshold.toString());

      const updateData: any = {
        current_balance: newBalance,
        total_ad_revenue: newAdRevenue,
        threshold_reached
      };

      if (threshold_reached && !bankBalance.threshold_reached) {
        updateData.threshold_reached_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('bank_balances')
        .update(updateData)
        .eq('id', bankBalance.id);

      if (updateError) {
        console.error('Error updating bank balance:', updateError);
        return false;
      }

      console.log(`Ad tracked. New balance: $${newBalance} (Threshold: $${gameMode.bank_threshold})`);
      return true;
    } catch (error) {
      console.error('Error in trackAdView:', error);
      return false;
    }
  }

  /**
   * Track entry fee payment
   */
  async trackEntryFee(userId: string, gameModeId: string): Promise<boolean> {
    try {
      const gameMode = await this.getGameMode(gameModeId);
      if (!gameMode) return false;

      const entryFee = parseFloat(gameMode.entry_fee.toString());
      if (entryFee === 0) return true; // Free mode, no fee to track

      const bankBalance = await this.getBankBalance(gameModeId);
      if (!bankBalance) return false;

      const newBalance = parseFloat(bankBalance.current_balance.toString()) + entryFee;
      const newEntryFees = parseFloat(bankBalance.total_entry_fees.toString()) + entryFee;
      
      const threshold_reached = newBalance >= parseFloat(gameMode.bank_threshold.toString());

      const updateData: any = {
        current_balance: newBalance,
        total_entry_fees: newEntryFees,
        threshold_reached
      };

      if (threshold_reached && !bankBalance.threshold_reached) {
        updateData.threshold_reached_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('bank_balances')
        .update(updateData)
        .eq('id', bankBalance.id);

      if (error) {
        console.error('Error updating bank balance with entry fee:', error);
        return false;
      }

      console.log(`Entry fee tracked. New balance: $${newBalance}`);
      return true;
    } catch (error) {
      console.error('Error in trackEntryFee:', error);
      return false;
    }
  }

  /**
   * Update custom user points dynamically
   */
  private updateCustomUserPoints(
    customUsers: CustomUser[],
    currentBalance: number,
    threshold: number
  ): CustomUser[] {
    // Calculate how close we are to threshold (0-1 range)
    const progressToThreshold = Math.min(currentBalance / threshold, 0.95);
    
    // Randomly update some users' points
    return customUsers.map(user => {
      // Randomize if this user gets an update (70% chance)
      if (Math.random() > 0.3) {
        // Calculate point increment based on progress
        // More aggressive early, less aggressive near threshold
        const baseIncrement = progressToThreshold < 0.5 ? 15 : 5;
        const randomFactor = Math.random() * baseIncrement;
        const increment = Math.floor(randomFactor * (1 - progressToThreshold));
        
        return {
          ...user,
          points: user.points + increment,
          questionsAnswered: user.questionsAnswered + Math.floor(increment / 10)
        };
      }
      return user;
    });
  }

  /**
   * Get leaderboard for a game mode (custom or real users based on threshold)
   */
  async getLeaderboard(
    modeType: string,
    limit: number = 10
  ): Promise<LeaderboardUser[]> {
    try {
      const gameMode = await this.getGameMode(modeType);
      if (!gameMode) return [];

      const bankBalance = await this.getBankBalance(gameMode.id);
      if (!bankBalance) return [];

      const thresholdReached = bankBalance.threshold_reached;

      if (thresholdReached) {
        // Show real users who have answered the required number of questions
        const { data: realUsers, error } = await supabase
          .from('user_game_mode_stats')
          .select(`
            user_id,
            current_period_points,
            current_period_questions,
            users (username, avatar_url)
          `)
          .eq('game_mode_id', gameMode.id)
          .gte('current_period_questions', gameMode.questions_required)
          .order('current_period_points', { ascending: false })
          .limit(limit);

        if (error) {
          console.error('Error fetching real users:', error);
          return [];
        }

        return (realUsers || []).map((user: any, index: number) => ({
          rank: index + 1,
          username: user.users?.[0]?.username || 'Unknown',
          avatar_url: user.users?.[0]?.avatar_url,
          points: user.current_period_points,
          questions_answered: user.current_period_questions,
          is_custom_user: false,
          user_id: user.user_id
        }));
      } else {
        // Show custom users with dynamic point updates
        const modeKey = modeType.replace('_', '-');
        let customUsers = this.customUsersCache.get(modeKey) || [];
        
        if (customUsers.length === 0) {
          console.log(`No custom users found for ${modeKey}`);
          return [];
        }

        // Update points dynamically
        customUsers = this.updateCustomUserPoints(
          customUsers,
          parseFloat(bankBalance.current_balance.toString()),
          parseFloat(gameMode.bank_threshold.toString())
        );

        // Sort by points and take top users
        const sortedUsers = [...customUsers]
          .sort((a, b) => b.points - a.points)
          .slice(0, limit);

        return sortedUsers.map((user, index) => ({
          rank: index + 1,
          username: user.username,
          avatar_url: user.avatarUrl,
          points: user.points,
          questions_answered: user.questionsAnswered,
          is_custom_user: true,
          custom_user_id: user.id
        }));
      }
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Submit user score after completing a game session
   */
  async submitScore(
    userId: string,
    gameModeId: string,
    sessionId: string,
    points: number,
    correctAnswers: number,
    totalQuestions: number
  ): Promise<boolean> {
    try {
      // Update game session
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({
          points_earned: points,
          correct_answers: correctAnswers,
          questions_answered: totalQuestions,
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (sessionError) {
        console.error('Error updating session:', sessionError);
        return false;
      }

      // Update or create user stats
      const { data: existingStats } = await supabase
        .from('user_game_mode_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('game_mode_id', gameModeId)
        .single();

      if (existingStats) {
        const { error: updateError } = await supabase
          .from('user_game_mode_stats')
          .update({
            total_questions_answered: existingStats.total_questions_answered + totalQuestions,
            total_correct_answers: existingStats.total_correct_answers + correctAnswers,
            total_points: existingStats.total_points + points,
            current_period_points: existingStats.current_period_points + points,
            current_period_questions: existingStats.current_period_questions + totalQuestions,
            games_played: existingStats.games_played + 1,
            last_played_at: new Date().toISOString()
          })
          .eq('id', existingStats.id);

        if (updateError) {
          console.error('Error updating user stats:', updateError);
          return false;
        }
      } else {
        const { error: insertError } = await supabase
          .from('user_game_mode_stats')
          .insert({
            user_id: userId,
            game_mode_id: gameModeId,
            total_questions_answered: totalQuestions,
            total_correct_answers: correctAnswers,
            total_points: points,
            current_period_points: points,
            current_period_questions: totalQuestions,
            games_played: 1,
            last_played_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating user stats:', insertError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error submitting score:', error);
      return false;
    }
  }

  /**
   * Reset leaderboard for a game mode (weekly/monthly)
   */
  async resetLeaderboard(gameModeId: string): Promise<boolean> {
    try {
      // Reset current period stats for all users
      const { error: resetError } = await supabase
        .from('user_game_mode_stats')
        .update({
          current_period_points: 0,
          current_period_questions: 0
        })
        .eq('game_mode_id', gameModeId);

      if (resetError) {
        console.error('Error resetting user stats:', resetError);
        return false;
      }

      // Create new bank balance record for new period
      const { error: bankError } = await supabase
        .from('bank_balances')
        .insert({
          game_mode_id: gameModeId,
          current_balance: 0,
          total_ad_revenue: 0,
          total_entry_fees: 0,
          total_payouts: 0,
          threshold_reached: false,
          period_start_date: new Date().toISOString()
        });

      if (bankError) {
        console.error('Error creating new bank balance:', bankError);
        return false;
      }

      // Reload custom users to reset their points
      this.loadCustomUsers();

      console.log(`Leaderboard reset for game mode ${gameModeId}`);
      return true;
    } catch (error) {
      console.error('Error resetting leaderboard:', error);
      return false;
    }
  }

  /**
   * Get all game modes
   */
  async getAllGameModes(): Promise<GameMode[]> {
    const { data, error } = await supabase
      .from('game_modes')
      .select('*')
      .eq('is_active', true)
      .order('entry_fee', { ascending: true });

    if (error) {
      console.error('Error fetching game modes:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Check if user has paid entry fee for a game mode
   */
  async hasUserPaidEntry(userId: string, gameModeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_game_mode_stats')
      .select('has_paid_entry')
      .eq('user_id', userId)
      .eq('game_mode_id', gameModeId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.has_paid_entry;
  }

  /**
   * Mark entry fee as paid
   */
  async markEntryPaid(userId: string, gameModeId: string): Promise<boolean> {
    const { data: existingStats } = await supabase
      .from('user_game_mode_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('game_mode_id', gameModeId)
      .single();

    if (existingStats) {
      const { error } = await supabase
        .from('user_game_mode_stats')
        .update({
          has_paid_entry: true,
          entry_paid_at: new Date().toISOString()
        })
        .eq('id', existingStats.id);

      return !error;
    } else {
      const { error } = await supabase
        .from('user_game_mode_stats')
        .insert({
          user_id: userId,
          game_mode_id: gameModeId,
          has_paid_entry: true,
          entry_paid_at: new Date().toISOString()
        });

      return !error;
    }
  }
}

export const gameModesManager = new GameModesManager();
