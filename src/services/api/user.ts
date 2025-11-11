/**
 * User API Service
 * Handles user statistics, achievements, and profile operations
 */

import { apiClient } from './client';

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  averageScore: number;
  winRate: number;
  longestStreak: number;
  currentStreak: number;
  creditsEarned: number;
  totalPlayTime: number;
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

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  created_at: string;
  email_verified: boolean;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  stats: UserStats;
}

export interface ProfileUpdateData {
  username?: string;
  bio?: string;
  avatar_url?: string;
  language?: string;
  timezone?: string;
}

class UserAPI {
  /**
   * Get user statistics
   */
  async getStats(): Promise<UserStats> {
    const response = await apiClient.get<UserStats>('/user/stats');
    return response.data;
  }

  /**
   * Get user achievements
   */
  async getAchievements(): Promise<UserAchievement[]> {
    const response = await apiClient.get<UserAchievement[]>('/user/achievements');
    return response.data;
  }

  /**
   * Get complete user profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/user/profile');
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: ProfileUpdateData): Promise<any> {
    const response = await apiClient.put<any>('/user/profile', updates);
    return response.data;
  }
}

export const userAPI = new UserAPI();
