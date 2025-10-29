// Export configuration
export * from './config';
export { config, ConfigManager, DEFAULT_CONFIG, type AppConfig } from './config';

// Export types
export * from './types';

// Export game logic
export * from './gameLogic';
export type { AntiCheatResult, SessionValidation } from './gameLogic';

// Re-export commonly used types for convenience
export type {
  User,
  AuthSession,
  GameMode,
  Period,
  Question,
  GameSession,
  Answer,
  LeaderboardEntry,
  Winner,
  WalletTransaction,
  Wallet,
  Payment,
  PayoutMethod,
  Payout,
  ApiResponse,
  ModeType,
  PeriodType,
  SessionStatus,
  WinnerStatus,
  TransactionType,
  TransactionStatus,
  PaymentStatus,
  PaymentType,
  PayoutStatus,
} from './types';