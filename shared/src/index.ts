// Stub for @1000ravier/shared
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export type GameModeType = 'FREE' | 'CHALLENGE' | 'TOURNAMENT' | 'SUPER_TOURNAMENT';

export interface GameMode {
  id: string;
  type: GameModeType;
  name: string;
  display_name?: string;
  entry_fee: number;
  entry_fee_currency: 'USD' | 'CREDITS';
  questions: number;
  prize_pool?: number;
  created_at?: string;
  updated_at?: string;
}

export type PeriodStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Period {
  id: string;
  mode_id: string;
  start_date: string;
  end_date: string;
  status: PeriodStatus;
  participants_count?: number;
  max_participants?: number;
  mode?: GameMode;
  created_at?: string;
  updated_at?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty?: string;
  category?: string;
}

export type GameSessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export interface GameSession {
  id: string;
  user_id: string;
  period_id: string;
  status: GameSessionStatus;
  score: number;
  correct_answers: number;
  incorrect_answers: number;
  skipped_answers: number;
  answered_questions: number;
  total_questions: number;
  total_time_spent: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  gamesPlayed?: number;
  winRate?: number;
  rankChange?: number;
}

export type TransactionType = 'CREDIT' | 'DEBIT' | 'DAILY_CLAIM' | 'AD_REWARD' | 'PURCHASE' | 'ENTRY_FEE' | 'REFUND' | 'BONUS' | 'PENALTY' | 'GAME_WIN' | 'REFERRAL_BONUS' | 'ACHIEVEMENT_REWARD';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'REFUND_REQUESTED';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description?: string;
  createdAt: string;
  status: TransactionStatus;
  metadata?: any;
}

export interface CreditsBundle {
  id: string;
  credits: number;
  priceNgn: number;
  bonusCredits?: number;
  popular?: boolean;
  savings?: number;
}
