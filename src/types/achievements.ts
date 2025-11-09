/**
 * Achievement System Types
 * Defines all achievement-related interfaces and enums
 */

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  
  // Progress tracking
  progress: number;
  maxProgress: number;
  
  // Status
  unlocked: boolean;
  unlockedAt?: string;
  
  // Rewards
  rewards: {
    credits?: number;
    xp?: number;
    badge?: string;
    title?: string;
  };
  
  // Requirements
  requirements: {
    type: 'wins' | 'games' | 'score' | 'streak' | 'daily' | 'category' | 'rank' | 'special';
    target: number;
    condition?: string;
  };
  
  // Display
  hidden?: boolean;
  order: number;
}

export interface AchievementProgress {
  achievementId: string;
  currentProgress: number;
  lastUpdated: string;
  milestones?: {
    value: number;
    reached: boolean;
    reachedAt?: string;
  }[];
}

export interface AchievementNotification {
  achievement: Achievement;
  showConfetti: boolean;
  timestamp: string;
}

// Predefined achievements
export const ACHIEVEMENTS: Achievement[] = [
  // BEGINNER
  {
    id: 'first_game',
    title: 'Erste Schritte',
    description: 'Spiele dein erstes Spiel',
    icon: 'sports-esports',
    rarity: 'common',
    category: 'beginner',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rewards: { credits: 10, xp: 50 },
    requirements: { type: 'games', target: 1 },
    order: 1,
  },
  {
    id: 'first_win',
    title: 'Erster Sieg',
    description: 'Gewinne dein erstes Spiel',
    icon: 'emoji-events',
    rarity: 'common',
    category: 'beginner',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rewards: { credits: 25, xp: 100 },
    requirements: { type: 'wins', target: 1 },
    order: 2,
  },
  {
    id: 'play_10_games',
    title: 'Enthusiast',
    description: 'Spiele 10 Spiele',
    icon: 'trending-up',
    rarity: 'common',
    category: 'beginner',
    progress: 0,
    maxProgress: 10,
    unlocked: false,
    rewards: { credits: 50, xp: 200 },
    requirements: { type: 'games', target: 10 },
    order: 3,
  },
  {
    id: 'daily_login_3',
    title: 'Treuer Spieler',
    description: 'Logge dich 3 Tage in Folge ein',
    icon: 'event',
    rarity: 'common',
    category: 'beginner',
    progress: 0,
    maxProgress: 3,
    unlocked: false,
    rewards: { credits: 30, xp: 150 },
    requirements: { type: 'daily', target: 3 },
    order: 4,
  },

  // INTERMEDIATE
  {
    id: 'win_streak_5',
    title: 'Siegesserie',
    description: 'Gewinne 5 Spiele in Folge',
    icon: 'whatshot',
    rarity: 'rare',
    category: 'intermediate',
    progress: 0,
    maxProgress: 5,
    unlocked: false,
    rewards: { credits: 100, xp: 500, badge: 'fire' },
    requirements: { type: 'streak', target: 5 },
    order: 5,
  },
  {
    id: 'score_1000',
    title: 'Punktejäger',
    description: 'Erreiche 1000 Punkte in einem Spiel',
    icon: 'star',
    rarity: 'rare',
    category: 'intermediate',
    progress: 0,
    maxProgress: 1000,
    unlocked: false,
    rewards: { credits: 75, xp: 400 },
    requirements: { type: 'score', target: 1000 },
    order: 6,
  },
  {
    id: 'win_50_games',
    title: 'Gewinner',
    description: 'Gewinne 50 Spiele',
    icon: 'military-tech',
    rarity: 'rare',
    category: 'intermediate',
    progress: 0,
    maxProgress: 50,
    unlocked: false,
    rewards: { credits: 200, xp: 1000 },
    requirements: { type: 'wins', target: 50 },
    order: 7,
  },
  {
    id: 'perfect_game',
    title: 'Perfektionist',
    description: 'Beantworte alle Fragen richtig',
    icon: 'verified',
    rarity: 'rare',
    category: 'intermediate',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rewards: { credits: 150, xp: 750, badge: 'perfect' },
    requirements: { type: 'special', target: 1, condition: 'perfect_score' },
    order: 8,
  },

  // ADVANCED
  {
    id: 'top_100',
    title: 'Elite Spieler',
    description: 'Erreiche die Top 100 der Bestenliste',
    icon: 'leaderboard',
    rarity: 'epic',
    category: 'advanced',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rewards: { credits: 500, xp: 2500, title: 'Elite' },
    requirements: { type: 'rank', target: 100 },
    order: 9,
  },
  {
    id: 'win_100_games',
    title: 'Champion',
    description: 'Gewinne 100 Spiele',
    icon: 'emoji-events',
    rarity: 'epic',
    category: 'advanced',
    progress: 0,
    maxProgress: 100,
    unlocked: false,
    rewards: { credits: 750, xp: 5000, badge: 'champion' },
    requirements: { type: 'wins', target: 100 },
    order: 10,
  },
  {
    id: 'win_streak_25',
    title: 'Unaufhaltbar',
    description: 'Gewinne 25 Spiele in Folge',
    icon: 'local-fire-department',
    rarity: 'epic',
    category: 'advanced',
    progress: 0,
    maxProgress: 25,
    unlocked: false,
    rewards: { credits: 1000, xp: 7500, title: 'Unaufhaltbar' },
    requirements: { type: 'streak', target: 25 },
    order: 11,
  },
  {
    id: 'all_categories',
    title: 'Allwissend',
    description: 'Gewinne ein Spiel in jeder Kategorie',
    icon: 'school',
    rarity: 'epic',
    category: 'advanced',
    progress: 0,
    maxProgress: 10,
    unlocked: false,
    rewards: { credits: 500, xp: 3000, badge: 'scholar' },
    requirements: { type: 'category', target: 10 },
    order: 12,
  },

  // LEGENDARY
  {
    id: 'rank_1',
    title: 'Nummer 1',
    description: 'Erreiche Platz 1 der Bestenliste',
    icon: 'workspace-premium',
    rarity: 'legendary',
    category: 'legendary',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rewards: { credits: 5000, xp: 25000, title: 'Legende', badge: 'legend' },
    requirements: { type: 'rank', target: 1 },
    order: 13,
  },
  {
    id: 'win_500_games',
    title: 'Meister',
    description: 'Gewinne 500 Spiele',
    icon: 'diamond',
    rarity: 'legendary',
    category: 'legendary',
    progress: 0,
    maxProgress: 500,
    unlocked: false,
    rewards: { credits: 10000, xp: 50000, title: 'Meister', badge: 'master' },
    requirements: { type: 'wins', target: 500 },
    order: 14,
  },
  {
    id: 'win_streak_50',
    title: 'Unbesiegbar',
    description: 'Gewinne 50 Spiele in Folge',
    icon: 'stars',
    rarity: 'legendary',
    category: 'legendary',
    progress: 0,
    maxProgress: 50,
    unlocked: false,
    rewards: { credits: 15000, xp: 75000, title: 'Unbesiegbar', badge: 'invincible' },
    requirements: { type: 'streak', target: 50 },
    order: 15,
  },
  {
    id: 'completionist',
    title: 'Vollständigkeit',
    description: 'Schalte alle anderen Erfolge frei',
    icon: 'military-tech',
    rarity: 'legendary',
    category: 'legendary',
    progress: 0,
    maxProgress: 14,
    unlocked: false,
    hidden: true,
    rewards: { credits: 20000, xp: 100000, title: 'Vollender', badge: 'completionist' },
    requirements: { type: 'special', target: 14, condition: 'all_achievements' },
    order: 16,
  },
];

export interface AchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  percentageComplete: number;
  totalCreditsEarned: number;
  totalXPEarned: number;
  rarityBreakdown: {
    common: { total: number; unlocked: number };
    rare: { total: number; unlocked: number };
    epic: { total: number; unlocked: number };
    legendary: { total: number; unlocked: number };
  };
}
