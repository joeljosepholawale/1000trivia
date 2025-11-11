/**
 * Challenge System Types
 * Daily and Weekly challenges to engage users
 */

export type ChallengeType = 'daily' | 'weekly';
export type ChallengeStatus = 'active' | 'completed' | 'expired' | 'claimed';

export interface Challenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  icon: string;
  
  // Progress
  current: number;
  target: number;
  
  // Status
  status: ChallengeStatus;
  startDate: string;
  endDate: string;
  completedAt?: string;
  claimedAt?: string;
  
  // Rewards
  rewards: {
    credits: number;
    xp: number;
    bonus?: {
      type: 'multiplier' | 'extra_credits' | 'special_item';
      value: number | string;
    };
  };
  
  // Requirements
  requirement: {
    type: 'wins' | 'games' | 'score' | 'streak' | 'category' | 'perfect' | 'time' | 'daily_login';
    category?: string;
    minScore?: number;
  };
  
  // Display
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
}

export interface ChallengeProgress {
  challengeId: string;
  current: number;
  lastUpdated: string;
}

// Daily Challenge Templates
export const DAILY_CHALLENGE_TEMPLATES: Omit<Challenge, 'id' | 'startDate' | 'endDate' | 'status' | 'current' | 'completedAt' | 'claimedAt'>[] = [
  {
    type: 'daily',
    title: 'Siegreich',
    description: 'Gewinne 3 Spiele',
    icon: 'emoji-events',
    target: 3,
    rewards: { credits: 30, xp: 150 },
    requirement: { type: 'wins' },
    difficulty: 'easy',
    order: 1,
  },
  {
    type: 'daily',
    title: 'Spieler des Tages',
    description: 'Spiele 5 Spiele',
    icon: 'sports-esports',
    target: 5,
    rewards: { credits: 25, xp: 100 },
    requirement: { type: 'games' },
    difficulty: 'easy',
    order: 2,
  },
  {
    type: 'daily',
    title: 'Punktejagd',
    description: 'Erreiche 500 Punkte in einem Spiel',
    icon: 'star',
    target: 500,
    rewards: { credits: 40, xp: 200 },
    requirement: { type: 'score', minScore: 500 },
    difficulty: 'medium',
    order: 3,
  },
  {
    type: 'daily',
    title: 'Siegesserie',
    description: 'Gewinne 3 Spiele in Folge',
    icon: 'whatshot',
    target: 3,
    rewards: { credits: 50, xp: 250, bonus: { type: 'multiplier', value: 1.5 } },
    requirement: { type: 'streak' },
    difficulty: 'hard',
    order: 4,
  },
  {
    type: 'daily',
    title: 'Perfektion',
    description: 'Beantworte alle Fragen richtig in einem Spiel',
    icon: 'verified',
    target: 1,
    rewards: { credits: 75, xp: 300 },
    requirement: { type: 'perfect' },
    difficulty: 'hard',
    order: 5,
  },
  {
    type: 'daily',
    title: 'Kategorie-Meister',
    description: 'Gewinne ein Spiel in der Sport-Kategorie',
    icon: 'sports-soccer',
    target: 1,
    rewards: { credits: 35, xp: 175 },
    requirement: { type: 'category', category: 'sport' },
    difficulty: 'medium',
    order: 6,
  },
  {
    type: 'daily',
    title: 'Schnell-Denker',
    description: 'Beende ein Spiel in unter 5 Minuten',
    icon: 'timer',
    target: 1,
    rewards: { credits: 45, xp: 225 },
    requirement: { type: 'time' },
    difficulty: 'medium',
    order: 7,
  },
];

// Weekly Challenge Templates
export const WEEKLY_CHALLENGE_TEMPLATES: Omit<Challenge, 'id' | 'startDate' | 'endDate' | 'status' | 'current' | 'completedAt' | 'claimedAt'>[] = [
  {
    type: 'weekly',
    title: 'Wochensieger',
    description: 'Gewinne 15 Spiele diese Woche',
    icon: 'emoji-events',
    target: 15,
    rewards: { credits: 200, xp: 1000, bonus: { type: 'extra_credits', value: 50 } },
    requirement: { type: 'wins' },
    difficulty: 'medium',
    order: 1,
  },
  {
    type: 'weekly',
    title: 'Unaufhaltbar',
    description: 'Erreiche eine Siegesserie von 10',
    icon: 'local-fire-department',
    target: 10,
    rewards: { credits: 500, xp: 2500 },
    requirement: { type: 'streak' },
    difficulty: 'hard',
    order: 2,
  },
  {
    type: 'weekly',
    title: 'Punktesammler',
    description: 'Sammle insgesamt 5000 Punkte',
    icon: 'stars',
    target: 5000,
    rewards: { credits: 300, xp: 1500 },
    requirement: { type: 'score', minScore: 5000 },
    difficulty: 'medium',
    order: 3,
  },
  {
    type: 'weekly',
    title: 'Allround-Spieler',
    description: 'Gewinne in 5 verschiedenen Kategorien',
    icon: 'school',
    target: 5,
    rewards: { credits: 400, xp: 2000 },
    requirement: { type: 'category' },
    difficulty: 'medium',
    order: 4,
  },
  {
    type: 'weekly',
    title: 'Perfektionist',
    description: 'Erreiche 3 perfekte Spiele',
    icon: 'workspace-premium',
    target: 3,
    rewards: { credits: 750, xp: 3750, bonus: { type: 'special_item', value: 'perfect_badge' } },
    requirement: { type: 'perfect' },
    difficulty: 'hard',
    order: 5,
  },
  {
    type: 'weekly',
    title: 'Tägliche Routine',
    description: 'Logge dich jeden Tag diese Woche ein',
    icon: 'event',
    target: 7,
    rewards: { credits: 250, xp: 1250 },
    requirement: { type: 'daily_login' },
    difficulty: 'easy',
    order: 6,
  },
  {
    type: 'weekly',
    title: 'Aktiver Spieler',
    description: 'Spiele 30 Spiele diese Woche',
    icon: 'trending-up',
    target: 30,
    rewards: { credits: 350, xp: 1750 },
    requirement: { type: 'games' },
    difficulty: 'medium',
    order: 7,
  },
];

export interface ChallengeStats {
  dailyChallengesCompleted: number;
  weeklyChallengesCompleted: number;
  totalChallengesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalRewardsEarned: {
    credits: number;
    xp: number;
  };
}

// Helper function to get random daily challenges
export function getRandomDailyChallenges(count: number = 3): typeof DAILY_CHALLENGE_TEMPLATES {
  const shuffled = [...DAILY_CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Helper function to get random weekly challenges
export function getRandomWeeklyChallenges(count: number = 3): typeof WEEKLY_CHALLENGE_TEMPLATES {
  const shuffled = [...WEEKLY_CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Helper function to check if challenge is expired
export function isChallengeExpired(challenge: Challenge): boolean {
  return new Date(challenge.endDate) < new Date();
}

// Helper function to get time remaining
export function getTimeRemaining(endDate: string): {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = new Date().getTime();
  const end = new Date(endDate).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, isExpired: false };
}

// Helper function to format time remaining
export function formatTimeRemaining(endDate: string): string {
  const { hours, minutes, isExpired } = getTimeRemaining(endDate);

  if (isExpired) return 'Abgelaufen';
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} Tag${days > 1 ? 'e' : ''}`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
