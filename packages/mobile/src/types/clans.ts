/**
 * Clans/Teams System Types
 * Types for clan management, members, and social features
 */

export type ClanRole = 'owner' | 'admin' | 'member';
export type ClanStatus = 'active' | 'inactive';
export type ClanPrivacy = 'public' | 'invite_only' | 'closed';

export interface Clan {
  id: string;
  name: string;
  tag: string; // e.g., "RAV"
  description: string;
  avatar?: string;
  banner?: string;
  privacy: ClanPrivacy;
  status: ClanStatus;
  
  // Metadata
  createdAt: number;
  ownerId: string;
  ownerName: string;
  
  // Members
  memberCount: number;
  maxMembers: number;
  
  // Statistics
  stats: {
    totalGamesPlayed: number;
    totalWins: number;
    winRate: number;
    totalXP: number;
    level: number;
    rank: number; // Global rank
  };
  
  // Requirements
  requirements: {
    minLevel: number;
    applicationRequired: boolean;
  };
  
  // Social
  language?: string;
  region?: string;
}

export interface ClanMember {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: ClanRole;
  joinedAt: number;
  
  // Stats
  level: number;
  contributedXP: number;
  gamesPlayed: number;
  wins: number;
  
  // Status
  isOnline: boolean;
  lastOnline: number;
}

export interface ClanInvite {
  id: string;
  clanId: string;
  clanName: string;
  clanTag: string;
  invitedBy: string;
  invitedByName: string;
  invitedUserId: string;
  message?: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

export interface ClanApplication {
  id: string;
  clanId: string;
  userId: string;
  username: string;
  displayName: string;
  level: number;
  message: string;
  appliedAt: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ClanMessage {
  id: string;
  clanId: string;
  userId: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: number;
  edited: boolean;
  editedAt?: number;
}

export interface ClanActivity {
  id: string;
  clanId: string;
  type: 'member_joined' | 'member_left' | 'member_promoted' | 'member_demoted' | 'game_won' | 'level_up';
  description: string;
  timestamp: number;
  userId?: string;
  username?: string;
}

export interface ClanLeaderboardEntry {
  rank: number;
  clan: {
    id: string;
    name: string;
    tag: string;
    avatar?: string;
  };
  stats: {
    level: number;
    totalXP: number;
    totalWins: number;
    memberCount: number;
  };
}

export interface ClanSearchFilters {
  query?: string;
  minLevel?: number;
  maxLevel?: number;
  minMembers?: number;
  privacy?: ClanPrivacy;
  language?: string;
  region?: string;
}

// Mock data for development
export const MOCK_CLANS: Clan[] = [
  {
    id: 'clan_1',
    name: 'Die Meister',
    tag: 'MST',
    description: 'Elite-Clan für ernsthafte Spieler. Wir suchen aktive Mitglieder mit hohem Skill-Level.',
    privacy: 'public',
    status: 'active',
    createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000, // 180 days ago
    ownerId: 'user_001',
    ownerName: 'MaxPro',
    memberCount: 45,
    maxMembers: 50,
    stats: {
      totalGamesPlayed: 2450,
      totalWins: 1725,
      winRate: 70.4,
      totalXP: 125000,
      level: 25,
      rank: 3,
    },
    requirements: {
      minLevel: 15,
      applicationRequired: true,
    },
    language: 'de',
    region: 'EU',
  },
  {
    id: 'clan_2',
    name: 'Casual Crew',
    tag: 'CCR',
    description: 'Entspanntes Spielen ohne Druck. Alle Level willkommen!',
    privacy: 'public',
    status: 'active',
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
    ownerId: 'user_002',
    ownerName: 'Anna',
    memberCount: 32,
    maxMembers: 40,
    stats: {
      totalGamesPlayed: 980,
      totalWins: 520,
      winRate: 53.1,
      totalXP: 48000,
      level: 12,
      rank: 28,
    },
    requirements: {
      minLevel: 5,
      applicationRequired: false,
    },
    language: 'de',
    region: 'EU',
  },
  {
    id: 'clan_3',
    name: 'Pro Gamers',
    tag: 'PRO',
    description: 'Nur für die Besten der Besten. Turniere und Wettkämpfe.',
    privacy: 'invite_only',
    status: 'active',
    createdAt: Date.now() - 240 * 24 * 60 * 60 * 1000, // 240 days ago
    ownerId: 'user_003',
    ownerName: 'TomElite',
    memberCount: 50,
    maxMembers: 50,
    stats: {
      totalGamesPlayed: 5200,
      totalWins: 4160,
      winRate: 80.0,
      totalXP: 280000,
      level: 42,
      rank: 1,
    },
    requirements: {
      minLevel: 25,
      applicationRequired: true,
    },
    language: 'de',
    region: 'EU',
  },
];

export const MOCK_CLAN_MEMBERS: ClanMember[] = [
  {
    id: 'member_1',
    userId: 'user_001',
    username: 'maxpro',
    displayName: 'MaxPro',
    role: 'owner',
    joinedAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    level: 28,
    contributedXP: 45000,
    gamesPlayed: 850,
    wins: 620,
    isOnline: true,
    lastOnline: Date.now(),
  },
  {
    id: 'member_2',
    userId: 'user_004',
    username: 'sarah_gamer',
    displayName: 'Sarah',
    role: 'admin',
    joinedAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
    level: 24,
    contributedXP: 32000,
    gamesPlayed: 680,
    wins: 475,
    isOnline: false,
    lastOnline: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
  },
  {
    id: 'member_3',
    userId: 'user_005',
    username: 'peter_m',
    displayName: 'Peter M.',
    role: 'member',
    joinedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    level: 18,
    contributedXP: 18000,
    gamesPlayed: 420,
    wins: 290,
    isOnline: true,
    lastOnline: Date.now(),
  },
];

/**
 * Get clan role display name
 */
export function getClanRoleName(role: ClanRole): string {
  switch (role) {
    case 'owner':
      return 'Gründer';
    case 'admin':
      return 'Admin';
    case 'member':
    default:
      return 'Mitglied';
  }
}

/**
 * Get clan privacy display name
 */
export function getClanPrivacyName(privacy: ClanPrivacy): string {
  switch (privacy) {
    case 'public':
      return 'Öffentlich';
    case 'invite_only':
      return 'Nur auf Einladung';
    case 'closed':
      return 'Geschlossen';
  }
}

/**
 * Check if user can manage clan
 */
export function canManageClan(role: ClanRole): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Check if user can invite members
 */
export function canInviteMembers(role: ClanRole): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Check if user can kick members
 */
export function canKickMembers(role: ClanRole): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Format member count
 */
export function formatMemberCount(current: number, max: number): string {
  return `${current}/${max}`;
}

/**
 * Calculate clan level from XP
 */
export function calculateClanLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 1000)) + 1;
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 1000;
}
