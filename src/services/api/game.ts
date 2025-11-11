import {apiClient} from './client';
import type {ApiResponse, GameMode, Period, GameSession, Question} from '@1000ravier/shared';

export interface JoinGameResponse {
  session: GameSession;
  requiresPayment?: boolean;
  paymentIntentId?: string;
}

export interface QuestionResponse {
  question: Question;
  timeRemaining?: number;
  questionNumber: number;
  totalQuestions: number;
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  currentScore: number;
  bonusPoints?: number;
  sessionComplete: boolean;
  nextQuestionAvailable: boolean;
}

export interface SessionStatsResponse {
  totalGames: number;
  averageScore: number;
  bestScore: number;
  totalCorrectAnswers: number;
  totalQuestions: number;
  winRate: number;
}

export const gameAPI = {
  // Get available game modes
  getGameModes: async (): Promise<ApiResponse<GameMode[]>> => {
    return apiClient.get('/game-modes');
  },

  // Get active periods
  getActivePeriods: async (): Promise<ApiResponse<Period[]>> => {
    return apiClient.get('/game-modes/periods/active');
  },

  // Join a game mode (with optional payment)
  // Note: periodId is required, not modeId
  joinGameMode: async (
    periodId: string,
    paymentIntentId?: string
  ): Promise<ApiResponse<JoinGameResponse>> => {
    return apiClient.post('/game/join', {
      periodId,
      paymentIntentId,
    });
  },

  // Join free game mode
  joinFreeMode: async (modeId: string): Promise<ApiResponse<JoinGameResponse>> => {
    return apiClient.post('/game/join-free', {
      modeId,
    });
  },

  // Get next question for session
  getNextQuestion: async (sessionId: string): Promise<ApiResponse<QuestionResponse>> => {
    return apiClient.get(`/game/session/${sessionId}/next-question`);
  },

  // Submit answer for a question
  submitAnswer: async (
    sessionId: string,
    questionId: string,
    selectedOptionId: string,
    timeSpent: number
  ): Promise<ApiResponse<SubmitAnswerResponse>> => {
    return apiClient.post(`/game/session/${sessionId}/submit-answer`, {
      questionId,
      selectedOptionId,
      timeSpent,
    });
  },

  // Pause game session
  pauseSession: async (sessionId: string): Promise<ApiResponse<{success: boolean}>> => {
    return apiClient.post(`/game/session/${sessionId}/pause`);
  },

  // Resume game session
  resumeSession: async (sessionId: string): Promise<ApiResponse<QuestionResponse>> => {
    return apiClient.post(`/game/session/${sessionId}/resume`);
  },

  // End game session
  endSession: async (sessionId: string): Promise<ApiResponse<{finalScore: number; rank?: number}>> => {
    return apiClient.post(`/game/session/${sessionId}/end`);
  },

  // Get session details
  getSession: async (sessionId: string): Promise<ApiResponse<GameSession>> => {
    return apiClient.get(`/game/session/${sessionId}`);
  },

  // Get user's game history
  getGameHistory: async (
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<GameSession[]>> => {
    return apiClient.get('/game/history', {
      headers: {},
    });
  },

  // Get user's game statistics
  getGameStats: async (): Promise<ApiResponse<SessionStatsResponse>> => {
    return apiClient.get('/game/stats');
  },

  // Validate entry payment for paid games
  validateEntryPayment: async (
    paymentIntentId: string
  ): Promise<ApiResponse<{valid: boolean; modeId?: string}>> => {
    return apiClient.post('/game/validate-entry-payment', {
      paymentIntentId,
    });
  },
};