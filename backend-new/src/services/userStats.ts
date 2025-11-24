/**
 * User Statistics Service
 * Handles calculation and retrieval of user game statistics
 */

import { db } from './database';

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  averageScore: number;
  winRate: number;
  longestStreak: number;
  currentStreak: number;
  creditsEarned: number;
  totalPlayTime: number; // in seconds
  bestRank: number | null;
  currentRank: number | null;
}

export interface UserAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress?: number;
  maxProgress?: number;
}

class UserStatsService {
  /**
   * Get comprehensive user statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Get game session statistics
      const { data: sessions, error: sessionsError } = await db.getClient()
        .from('game_sessions')
        .select('id, score, completed_at, created_at')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED');

      if (sessionsError) throw sessionsError;

      const gamesPlayed = sessions?.length || 0;

      // Calculate total score and average
      const totalScore = sessions?.reduce((sum, s) => sum + (s.score || 0), 0) || 0;
      const averageScore = gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0;

      // Calculate total play time
      let totalPlayTime = 0;
      sessions?.forEach(s => {
        if (s.created_at && s.completed_at) {
          const start = new Date(s.created_at).getTime();
          const end = new Date(s.completed_at).getTime();
          totalPlayTime += (end - start) / 1000; // Convert to seconds
        }
      });

      // Get wins (top 10 finishes)
      const { data: wins, error: winsError } = await db.getClient()
        .from('leaderboard_entries')
        .select('rank')
        .eq('user_id', userId)
        .lte('rank', 10);

      if (winsError) throw winsError;

      const gamesWon = wins?.length || 0;
      const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

      // Get current and longest streak
      const streakData = await this.calculateStreaks(userId);

      // Get credits earned from wallet transactions
      const { data: creditTransactions, error: creditsError } = await db.getClient()
        .from('wallet_transactions')
        .select('amount')
        .eq('user_id', userId)
        .in('type', ['DAILY_CLAIM', 'AD_REWARD', 'BONUS', 'ACHIEVEMENT_REWARD', 'REFERRAL_BONUS']);

      if (creditsError) throw creditsError;

      const creditsEarned = creditTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

      // Get best and current rank
      const { data: bestRankData } = await db.getClient()
        .from('leaderboard_entries')
        .select('rank')
        .eq('user_id', userId)
        .order('rank', { ascending: true })
        .limit(1)
        .single();

      const { data: currentRankData } = await db.getClient()
        .from('leaderboard_entries')
        .select('rank, period_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        gamesPlayed,
        gamesWon,
        totalScore,
        averageScore,
        winRate,
        longestStreak: streakData.longest,
        currentStreak: streakData.current,
        creditsEarned,
        totalPlayTime: Math.round(totalPlayTime),
        bestRank: bestRankData?.rank || null,
        currentRank: currentRankData?.rank || null,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  /**
   * Calculate user's current and longest win streaks
   */
  private async calculateStreaks(userId: string): Promise<{ current: number; longest: number }> {
    try {
      // Get recent game sessions ordered by completion date
      const { data: sessions, error } = await db.getClient()
        .from('game_sessions')
        .select('id, completed_at')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(100); // Last 100 games

      if (error || !sessions || sessions.length === 0) {
        return { current: 0, longest: 0 };
      }

      // Get leaderboard entries for these sessions to check if they were wins
      const sessionIds = sessions.map(s => s.id);
      const { data: leaderboardEntries } = await db.getClient()
        .from('leaderboard_entries')
        .select('game_session_id, rank')
        .in('game_session_id', sessionIds)
        .lte('rank', 10); // Top 10 = win

      const winSessions = new Set(leaderboardEntries?.map(e => e.game_session_id) || []);

      // Calculate streaks
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let streakBroken = false;

      for (const session of sessions) {
        const isWin = winSessions.has(session.id);

        if (isWin) {
          tempStreak++;
          if (!streakBroken) {
            currentStreak = tempStreak;
          }
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          streakBroken = true;
          tempStreak = 0;
        }
      }

      return { current: currentStreak, longest: longestStreak };
    } catch (error) {
      console.error('Error calculating streaks:', error);
      return { current: 0, longest: 0 };
    }
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const stats = await this.getUserStats(userId);

      // Define achievements with progress tracking
      const achievements: UserAchievement[] = [
        {
          id: 'first_game',
          title: 'First Steps',
          description: 'Complete your first game',
          icon: 'emoji-events',
          rarity: 'common',
          unlocked: stats.gamesPlayed >= 1,
          progress: Math.min(stats.gamesPlayed, 1),
          maxProgress: 1,
        },
        {
          id: 'first_win',
          title: 'First Victory',
          description: 'Win your first game',
          icon: 'emoji-events',
          rarity: 'common',
          unlocked: stats.gamesWon >= 1,
          progress: Math.min(stats.gamesWon, 1),
          maxProgress: 1,
        },
        {
          id: 'quick_learner',
          title: 'Quick Learner',
          description: 'Complete 10 games',
          icon: 'school',
          rarity: 'common',
          unlocked: stats.gamesPlayed >= 10,
          progress: Math.min(stats.gamesPlayed, 10),
          maxProgress: 10,
        },
        {
          id: 'dedicated',
          title: 'Dedicated Player',
          description: 'Complete 50 games',
          icon: 'stars',
          rarity: 'rare',
          unlocked: stats.gamesPlayed >= 50,
          progress: Math.min(stats.gamesPlayed, 50),
          maxProgress: 50,
        },
        {
          id: 'veteran',
          title: 'Veteran',
          description: 'Complete 100 games',
          icon: 'military-tech',
          rarity: 'epic',
          unlocked: stats.gamesPlayed >= 100,
          progress: Math.min(stats.gamesPlayed, 100),
          maxProgress: 100,
        },
        {
          id: 'winning_streak_3',
          title: 'Hat Trick',
          description: 'Win 3 games in a row',
          icon: 'local-fire-department',
          rarity: 'rare',
          unlocked: stats.longestStreak >= 3,
          progress: Math.min(stats.longestStreak, 3),
          maxProgress: 3,
        },
        {
          id: 'winning_streak_5',
          title: 'Unstoppable',
          description: 'Win 5 games in a row',
          icon: 'whatshot',
          rarity: 'epic',
          unlocked: stats.longestStreak >= 5,
          progress: Math.min(stats.longestStreak, 5),
          maxProgress: 5,
        },
        {
          id: 'winning_streak_10',
          title: 'Legendary',
          description: 'Win 10 games in a row',
          icon: 'auto-awesome',
          rarity: 'legendary',
          unlocked: stats.longestStreak >= 10,
          progress: Math.min(stats.longestStreak, 10),
          maxProgress: 10,
        },
        {
          id: 'top_10',
          title: 'Champion',
          description: 'Reach top 10 on the leaderboard',
          icon: 'workspace-premium',
          rarity: 'epic',
          unlocked: stats.bestRank !== null && stats.bestRank <= 10,
          progress: stats.bestRank !== null ? Math.max(0, 11 - stats.bestRank) : 0,
          maxProgress: 10,
        },
        {
          id: 'top_3',
          title: 'Elite',
          description: 'Reach top 3 on the leaderboard',
          icon: 'emoji-events',
          rarity: 'legendary',
          unlocked: stats.bestRank !== null && stats.bestRank <= 3,
          progress: stats.bestRank !== null ? Math.max(0, 4 - stats.bestRank) : 0,
          maxProgress: 3,
        },
        {
          id: 'high_score',
          title: 'High Scorer',
          description: 'Score 900+ points in a single game',
          icon: 'trending-up',
          rarity: 'rare',
          unlocked: false, // TODO: Track max score
        },
        {
          id: 'perfect_game',
          title: 'Perfect Score',
          description: 'Score 1000 points in a game',
          icon: 'star',
          rarity: 'legendary',
          unlocked: false, // TODO: Track max score
        },
      ];

      // Reward newly unlocked achievements via wallet and record them
      try {
        // Existing stored user_achievements (by achievement_type)n        const { data: stored } = await db.getClient()
          .from('user_achievements')
          .select('achievement_type, credits_reward')
          .eq('user_id', userId);

        const storedMap = new Map<string, number>();
        (stored || []).forEach((row: any) => {
          storedMap.set(row.achievement_type, row.credits_reward || 0);
        });

        for (const ach of achievements) {
          if (!ach.unlocked) continue;

          // If an entry already exists, skip (reward already given)
          if (storedMap.has(ach.id)) continue;

          // Look up credits_reward from achievements table if available
          const { data: achievementRow } = await db.getClient()
            .from('achievements')
            .select('credits_reward')
            .eq('achievement_key', ach.id)
            .single();

          const rewardAmount = achievementRow?.credits_reward || 0;

          // Insert into user_achievements
          await db.getClient()
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_type: ach.id,
              achievement_name: ach.title,
              description: ach.description,
              credits_reward: rewardAmount,
              progress_data: {
                progress: ach.progress,
                maxProgress: ach.maxProgress,
              },
            });

          // Award credits if there is a positive reward amount
          if (rewardAmount > 0) {
            await db.updateWalletBalance(
              userId,
              rewardAmount,
              'ACHIEVEMENT_REWARD',
              `Achievement reward: ${ach.title}`,
              ach.id,
              { achievementId: ach.id, title: ach.title }
            );
          }
        }
      } catch (rewardError) {
        console.error('Error processing achievement rewards:', rewardError);
      }

      return achievements;
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      throw error;
    }
  }

  /**
   * Get user level based on total score
   */
  getUserLevel(totalScore: number): number {
    // Simple leveling: 1000 points per level
    return Math.floor(totalScore / 1000) + 1;
  }

  /**
   * Get XP for current level
   */
  getLevelProgress(totalScore: number): { currentXP: number; xpToNextLevel: number } {
    const currentXP = totalScore % 1000;
    const xpToNextLevel = 1000;
    return { currentXP, xpToNextLevel };
  }
}

export const userStatsService = new UserStatsService();
