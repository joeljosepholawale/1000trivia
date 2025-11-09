import {apiClient} from './client';
import type {ApiResponse, LeaderboardEntry, Winner, Period} from '@1000ravier/shared';

export interface UserRankResponse {
  position: number;
  score: number;
  totalParticipants: number;
}

export interface UserStatsResponse {
  totalGames: number;
  averageScore: number;
  bestRank: number;
  winnings: number;
}

export interface PeriodStatsResponse {
  periodId: string;
  totalParticipants: number;
  averageScore: number;
  prizePool: number;
  winnersCount: number;
}

export const leaderboardAPI = {
  // Get leaderboard for current or specific period
  getLeaderboard: async (periodId?: string): Promise<ApiResponse<LeaderboardEntry[]>> => {
    const url = periodId ? `/leaderboard/${periodId}` : '/leaderboard';
    return apiClient.get(url);
  },

  // Get user's current rank
  getUserRank: async (periodId?: string): Promise<ApiResponse<UserRankResponse>> => {
    const url = periodId ? `/leaderboard/${periodId}/rank` : '/leaderboard/rank';
    return apiClient.get(url);
  },

  // Get winners (with AI/actual gating)
  getWinners: async (
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<Winner[]>> => {
    return apiClient.get(`/leaderboard/winners?limit=${limit}&offset=${offset}`);
  },

  // Get recent winners
  getRecentWinners: async (): Promise<ApiResponse<Winner[]>> => {
    return apiClient.get('/leaderboard/winners/recent');
  },

  // Get historical periods
  getPeriods: async (
    limit: number = 10,
    offset: number = 0
  ): Promise<ApiResponse<Period[]>> => {
    return apiClient.get(`/leaderboard/periods?limit=${limit}&offset=${offset}`);
  },

  // Get user's game statistics
  getUserStats: async (): Promise<ApiResponse<UserStatsResponse>> => {
    return apiClient.get('/leaderboard/user/stats');
  },

  // Get period statistics
  getPeriodStats: async (periodId: string): Promise<ApiResponse<PeriodStatsResponse>> => {
    return apiClient.get(`/leaderboard/periods/${periodId}/stats`);
  },

  // Get historical winners for a specific period
  getPeriodWinners: async (periodId: string): Promise<ApiResponse<Winner[]>> => {
    return apiClient.get(`/leaderboard/periods/${periodId}/winners`);
  },

  // Get user's historical performance
  getUserHistory: async (
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<{
    sessions: Array<{
      sessionId: string;
      periodId: string;
      score: number;
      rank: number;
      completedAt: string;
      modeName: string;
    }>;
  }>> => {
    return apiClient.get(`/leaderboard/user/history?limit=${limit}&offset=${offset}`);
  },

  // Request leaderboard rerank (admin function)
  requestRerank: async (periodId: string): Promise<ApiResponse<{success: boolean}>> => {
    return apiClient.post(`/leaderboard/periods/${periodId}/rerank`);
  },
};