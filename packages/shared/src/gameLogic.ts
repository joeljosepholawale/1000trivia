import { TieBreaker, LeaderboardEntry, Winner, ModeType, WinnerGatingCheck } from './types';
import { AppConfig } from './config';

/**
 * Core game logic functions as specified in the requirements
 */

// Scoring Logic: +1 correct, 0 incorrect/skip
export function calculateScore(correctAnswers: number): number {
  return correctAnswers;
}

// Tie-breaker logic: 1) Higher score, 2) Faster average response time, 3) Earlier completion
export function compareTieBreakers(a: TieBreaker, b: TieBreaker): number {
  // 1. Higher score wins
  if (a.score !== b.score) {
    return b.score - a.score;
  }
  
  // 2. Faster average response time wins (lower is better)
  if (a.averageResponseTime !== b.averageResponseTime) {
    return a.averageResponseTime - b.averageResponseTime;
  }
  
  // 3. Earlier completion wins
  return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
}

// Determine winners from leaderboard entries
export function determineWinners(
  entries: LeaderboardEntry[],
  maxWinners: number,
  minAnswersToQualify: number
): LeaderboardEntry[] {
  // Filter qualified entries
  const qualified = entries.filter(
    entry => entry.isQualified && entry.answeredQuestions >= minAnswersToQualify
  );

  // Sort using tie-breaker logic
  const sorted = qualified.sort((a, b) => compareTieBreakers(
    {
      score: a.score,
      averageResponseTime: a.averageResponseTime,
      completedAt: a.completedAt
    },
    {
      score: b.score,
      averageResponseTime: b.averageResponseTime,
      completedAt: b.completedAt
    }
  ));

  // Return top winners
  return sorted.slice(0, maxWinners);
}

// Winner display gating logic
export function shouldShowActualWinners(
  userLifetimeEarningsNGN: number,
  modeType: ModeType,
  config: AppConfig
): boolean {
  const threshold = config.winnerGatingThresholds[modeType.toLowerCase() as keyof typeof config.winnerGatingThresholds];
  return userLifetimeEarningsNGN >= threshold;
}

// Generate AI winners for display when actual winners are gated
export function generateAIWinners(
  modeType: ModeType,
  maxWinners: number,
  payout: number
): Winner[] {
  const aiWinners: Winner[] = [];
  const aiEmails = [
    'winner1@example.com',
    'champion@example.com', 
    'topplayer@example.com',
    'quizmaster@example.com',
    'smartuser@example.com',
    'triviaking@example.com',
    'brainiac@example.com',
    'genius@example.com',
    'scholar@example.com',
    'expert@example.com'
  ];

  for (let i = 0; i < maxWinners; i++) {
    aiWinners.push({
      id: `ai-winner-${i + 1}`,
      userId: `ai-user-${i + 1}`,
      user: {
        id: `ai-user-${i + 1}`,
        email: aiEmails[i] || `aiwinner${i + 1}@example.com`
      },
      periodId: 'ai-period',
      period: {} as any, // Not needed for display
      rank: i + 1,
      score: Math.floor(Math.random() * 100) + 900, // Random high scores
      payoutAmount: payout,
      payoutCurrency: 'USD',
      status: 'PAID',
      paidAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return aiWinners;
}

// Anti-cheat detection logic
export interface AntiCheatResult {
  isSuspicious: boolean;
  reasons: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export function detectAntiCheat(
  submissionRate: number,
  scorePattern: number[],
  averageResponseTime: number,
  deviceInfo: string,
  ipAddress: string,
  config: AppConfig
): AntiCheatResult {
  const reasons: string[] = [];
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

  // Check submission rate
  if (submissionRate > config.antiCheat.maxSubmissionsPerMinute) {
    reasons.push('Excessive submission rate');
    riskLevel = 'HIGH';
  }

  // Check score pattern (too consistent/perfect)
  const correctRatio = scorePattern.filter(s => s === 1).length / scorePattern.length;
  if (correctRatio > config.antiCheat.suspiciousScoreThreshold) {
    reasons.push('Suspiciously high accuracy');
    riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
  }

  // Check response time patterns (too fast consistently)
  if (averageResponseTime < 2) { // Less than 2 seconds average
    reasons.push('Unrealistic response times');
    riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
  }

  // Check for automation patterns in response times
  const hasVariation = scorePattern.some((_, i, arr) => {
    if (i === 0) return false;
    return Math.abs(arr[i] - arr[i - 1]) > 0;
  });
  
  if (!hasVariation && scorePattern.length > 10) {
    reasons.push('Lack of natural variation in performance');
    riskLevel = 'HIGH';
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
    riskLevel
  };
}

// Question randomization logic
export function randomizeQuestions<T>(questions: T[], seed?: string): T[] {
  const shuffled = [...questions];
  
  // Use seed for deterministic randomization if provided
  let random = seed ? seedRandom(seed) : Math.random;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Simple seeded random number generator
function seedRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return function() {
    hash = ((hash * 9301) + 49297) % 233280;
    return hash / 233280;
  };
}

// Session validation logic
export interface SessionValidation {
  isValid: boolean;
  canResume: boolean;
  reason?: string;
}

export function validateSession(
  session: {
    status: string;
    startedAt: string;
    lastActivityAt: string;
    currentQuestionIndex: number;
    totalQuestions: number;
  },
  config: AppConfig
): SessionValidation {
  const now = new Date();
  const lastActivity = new Date(session.lastActivityAt);
  const timeSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60); // minutes

  // Check if session is expired
  if (timeSinceLastActivity > config.game.maxResumeTimeMinutes) {
    return {
      isValid: false,
      canResume: false,
      reason: 'Session expired due to inactivity'
    };
  }

  // Check if session is completed
  if (session.status === 'COMPLETED') {
    return {
      isValid: true,
      canResume: false,
      reason: 'Session already completed'
    };
  }

  // Check if session is cancelled or expired
  if (session.status === 'CANCELLED' || session.status === 'EXPIRED') {
    return {
      isValid: false,
      canResume: false,
      reason: `Session ${session.status.toLowerCase()}`
    };
  }

  // Session is valid and can be resumed
  return {
    isValid: true,
    canResume: session.currentQuestionIndex < session.totalQuestions,
  };
}

// Credits calculation helpers
export function canClaimDailyCredits(lastClaimDate?: string): boolean {
  if (!lastClaimDate) return true;
  
  const lastClaim = new Date(lastClaimDate);
  const now = new Date();
  
  // Check if it's a new UTC day
  const lastClaimUTCDay = Math.floor(lastClaim.getTime() / (1000 * 60 * 60 * 24));
  const currentUTCDay = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
  
  return currentUTCDay > lastClaimUTCDay;
}

export function canReceiveAdReward(
  adRewardsToday: number,
  adRewardsResetAt: string,
  config: AppConfig
): boolean {
  const now = new Date();
  const resetTime = new Date(adRewardsResetAt);
  
  // Check if we need to reset the daily counter
  if (now >= resetTime) {
    return true; // Counter will be reset, so reward is allowed
  }
  
  return adRewardsToday < config.credits.adRewardDailyLimit;
}

// Period management helpers
export function isPeriodActive(
  startDate: string,
  endDate: string
): boolean {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return now >= start && now <= end;
}

export function getNextPeriodStart(
  periodType: 'WEEKLY' | 'MONTHLY',
  timezone: string = 'UTC'
): Date {
  const now = new Date();
  
  if (periodType === 'WEEKLY') {
    // Start next Monday at 00:00 UTC
    const daysUntilMonday = (7 - now.getUTCDay() + 1) % 7 || 7;
    const nextMonday = new Date(now);
    nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
    nextMonday.setUTCHours(0, 0, 0, 0);
    return nextMonday;
  } else {
    // Start next month at 00:00 UTC on the 1st
    const nextMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
    return nextMonth;
  }
}
