import { z } from 'zod';

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  language: string;
  timezone: string;
  deviceId?: string;
  lastActiveAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

// Game Mode Types
export type ModeType = 'FREE' | 'CHALLENGE' | 'TOURNAMENT' | 'SUPER_TOURNAMENT';
export type PeriodType = 'WEEKLY' | 'MONTHLY';

export interface GameMode {
  id: string;
  type: ModeType;
  name: string;
  description: string;
  questions: number;
  entryFee: number;
  entryFeeCurrency: 'USD' | 'CREDITS';
  payout: number;
  payoutCurrency: 'USD';
  minAnswersToQualify: number;
  periodType: PeriodType;
  maxWinners: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Period and Competition Types
export type PeriodStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Period {
  id: string;
  modeId: string;
  mode: GameMode;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  totalParticipants: number;
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
}

// Question Types
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  language: string;
  category?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Game Session Types
export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export interface GameSession {
  id: string;
  userId: string;
  periodId: string;
  period: Period;
  status: SessionStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  score: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  totalTimeSpent: number; // seconds
  averageResponseTime: number; // seconds
  startedAt: string;
  completedAt?: string;
  lastActivityAt: string;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

// Answer Types
export interface Answer {
  id: string;
  sessionId: string;
  questionId: string;
  selectedAnswer?: string;
  isCorrect: boolean;
  isSkipped: boolean;
  responseTime: number; // seconds
  answeredAt: string;
  createdAt: string;
}

// Leaderboard Types
export interface LeaderboardEntry {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'email'>;
  periodId: string;
  sessionId: string;
  rank: number;
  score: number;
  answeredQuestions: number;
  correctAnswers: number;
  averageResponseTime: number;
  completedAt: string;
  isQualified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Winner Types
export type WinnerStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

export interface Winner {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'email'>;
  periodId: string;
  period: Period;
  rank: number;
  score: number;
  payoutAmount: number;
  payoutCurrency: string;
  status: WinnerStatus;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  paymentReference?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Wallet and Credits Types
export type TransactionType = 
  | 'DAILY_CLAIM' 
  | 'AD_REWARD' 
  | 'PURCHASE' 
  | 'ENTRY_FEE' 
  | 'REFUND' 
  | 'BONUS' 
  | 'PENALTY';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  reference?: string;
  metadata?: Record<string, any>;
  status: TransactionStatus;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  creditsBalance: number;
  lastDailyClaimAt?: string;
  adRewardsToday: number;
  adRewardsResetAt: string;
  createdAt: string;
  updatedAt: string;
}

// Payment Types
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
export type PaymentType = 'CREDITS_BUNDLE' | 'ENTRY_FEE';

export interface Payment {
  id: string;
  userId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  metadata?: Record<string, any>;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Payout Types
export type PayoutStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

export interface PayoutMethod {
  id: string;
  userId: string;
  type: 'BANK_ACCOUNT' | 'MOBILE_MONEY' | 'PAYPAL';
  details: Record<string, any>;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'email'>;
  winnerId: string;
  winner: Winner;
  amount: number;
  currency: string;
  payoutMethodId: string;
  payoutMethod: PayoutMethod;
  status: PayoutStatus;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  paymentReference?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics and Audit Types
export interface AnalyticsEvent {
  id: string;
  userId?: string;
  eventName: string;
  properties: Record<string, any>;
  deviceInfo?: string;
  ipAddress?: string;
  timestamp: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// Validation Schemas using Zod
export const EmailSchema = z.string().email();
export const PasswordSchema = z.string().min(8);
export const OTPSchema = z.string().length(6);

export const CreateSessionSchema = z.object({
  periodId: z.string().min(1), // Allow UUID or period type like 'weekly'
  deviceInfo: z.string().optional(),
});

export const SubmitAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedAnswer: z.string().optional(),
  responseTime: z.number().positive(),
  isSkipped: z.boolean().default(false),
});

export const ClaimDailyCreditsSchema = z.object({
  userId: z.string().uuid(),
});

export const ProcessAdRewardSchema = z.object({
  userId: z.string().uuid(),
  adUnitId: z.string(),
  rewardValue: z.number().positive(),
});

// Core Logic Types from Spec
export interface TieBreaker {
  score: number;
  averageResponseTime: number;
  completedAt: string;
}

export interface AntiCheatCheck {
  deviceId: string;
  ipAddress: string;
  submissionRate: number;
  scorePattern: number[];
  timestamp: string;
}

export interface WinnerGatingCheck {
  userId: string;
  modeType: ModeType;
  userLifetimeEarningsNGN: number;
  threshold: number;
  showActualWinners: boolean;
}