import apiClient from './client';

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

export interface GameSession {
  sessionToken: string;
  gameModeId: string;
  questionsRequired: number;
  modeType: string;
}

export const gameModesAPI = {
  /**
   * Get all available game modes
   */
  getAllModes: async (): Promise<GameMode[]> => {
    const response = await apiClient.get('/game-modes');
    return response.data.data;
  },

  /**
   * Get specific game mode details
   */
  getMode: async (modeType: string): Promise<GameMode> => {
    const response = await apiClient.get(`/game-modes/${modeType}`);
    return response.data.data;
  },

  /**
   * Get current bank balance for a game mode
   */
  getBankBalance: async (modeType: string): Promise<BankBalance> => {
    const response = await apiClient.get(`/game-modes/${modeType}/bank-balance`);
    return response.data.data;
  },

  /**
   * Get leaderboard for a game mode
   */
  getLeaderboard: async (modeType: string, limit: number = 10): Promise<LeaderboardUser[]> => {
    const response = await apiClient.get(`/game-modes/${modeType}/leaderboard`, {
      params: { limit }
    });
    return response.data.data;
  },

  /**
   * Start a new game session
   */
  startSession: async (modeType: string): Promise<GameSession> => {
    const response = await apiClient.post(`/game-modes/${modeType}/start-session`);
    return response.data.data;
  },

  /**
   * Submit score after completing a game session
   */
  submitScore: async (
    modeType: string,
    sessionId: string,
    points: number,
    correctAnswers: number,
    totalQuestions: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/game-modes/${modeType}/submit-score`, {
      sessionId,
      points,
      correctAnswers,
      totalQuestions
    });
    return response.data;
  },

  /**
   * Track ad view and update bank balance
   */
  trackAdView: async (
    modeType: string,
    sessionId?: string,
    adNetwork?: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/game-modes/${modeType}/track-ad`, {
      sessionId,
      adNetwork: adNetwork || 'admob'
    });
    return response.data;
  },

  /**
   * Process entry fee payment
   */
  payEntry: async (
    modeType: string,
    paymentIntentId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/game-modes/${modeType}/pay-entry`, {
      paymentIntentId
    });
    return response.data;
  },

  /**
   * Check if user has paid entry fee for a game mode
   */
  checkEntryStatus: async (modeType: string): Promise<boolean> => {
    try {
      const mode = await gameModesAPI.getMode(modeType);
      if (mode.entry_fee === 0) return true; // Free mode
      
      // Check if user has paid (this would come from user stats)
      // For now, return false - implement proper check later
      return false;
    } catch (error) {
      return false;
    }
  }
};

export default gameModesAPI;
