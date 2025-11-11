/**
 * Achievements Zustand Store
 * Manages achievement unlocks, progress tracking, and persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, AchievementProgress, ACHIEVEMENTS } from '@/types/achievements';

interface AchievementState {
  // Unlocked achievement IDs
  unlockedAchievements: string[];
  
  // Progress tracking for each achievement
  progress: Record<string, AchievementProgress>;
  
  // Recently unlocked (for notifications)
  recentUnlocks: Achievement[];
  
  // Statistics
  stats: {
    totalUnlocked: number;
    totalPoints: number;
    lastUnlockTime: number | null;
  };
}

interface AchievementActions {
  // Check and unlock achievements
  checkAndUnlockAchievement: (achievementId: string) => boolean;
  
  // Update progress for an achievement
  updateProgress: (achievementId: string, progress: number) => void;
  
  // Increment progress
  incrementProgress: (achievementId: string, amount?: number) => void;
  
  // Get achievement by ID
  getAchievement: (achievementId: string) => Achievement | undefined;
  
  // Check if achievement is unlocked
  isUnlocked: (achievementId: string) => boolean;
  
  // Get progress percentage
  getProgressPercentage: (achievementId: string) => number;
  
  // Clear recent unlocks (after showing notifications)
  clearRecentUnlocks: () => void;
  
  // Get all achievements with unlock status
  getAllAchievementsWithStatus: () => Array<Achievement & { unlocked: boolean; progress: number }>;
  
  // Reset all achievements (for testing)
  resetAchievements: () => void;
}

type AchievementStore = AchievementState & AchievementActions;

const initialState: AchievementState = {
  unlockedAchievements: [],
  progress: {},
  recentUnlocks: [],
  stats: {
    totalUnlocked: 0,
    totalPoints: 0,
    lastUnlockTime: null,
  },
};

export const useAchievementsStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      checkAndUnlockAchievement: (achievementId: string) => {
        const state = get();
        
        // Already unlocked
        if (state.unlockedAchievements.includes(achievementId)) {
          return false;
        }

        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) {
          console.warn(`Achievement ${achievementId} not found`);
          return false;
        }

        // Check if progress meets requirement
        const currentProgress = state.progress[achievementId]?.current || 0;
        if (currentProgress < achievement.requirement) {
          return false;
        }

        // Unlock achievement
        set((state) => ({
          unlockedAchievements: [...state.unlockedAchievements, achievementId],
          recentUnlocks: [...state.recentUnlocks, achievement],
          stats: {
            totalUnlocked: state.stats.totalUnlocked + 1,
            totalPoints: state.stats.totalPoints + achievement.points,
            lastUnlockTime: Date.now(),
          },
        }));

        return true;
      },

      updateProgress: (achievementId: string, progress: number) => {
        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return;

        const clampedProgress = Math.min(progress, achievement.requirement);

        set((state) => ({
          progress: {
            ...state.progress,
            [achievementId]: {
              current: clampedProgress,
              total: achievement.requirement,
              percentage: (clampedProgress / achievement.requirement) * 100,
            },
          },
        }));

        // Auto-unlock if progress reaches requirement
        if (clampedProgress >= achievement.requirement) {
          get().checkAndUnlockAchievement(achievementId);
        }
      },

      incrementProgress: (achievementId: string, amount: number = 1) => {
        const state = get();
        const currentProgress = state.progress[achievementId]?.current || 0;
        get().updateProgress(achievementId, currentProgress + amount);
      },

      getAchievement: (achievementId: string) => {
        return ACHIEVEMENTS.find(a => a.id === achievementId);
      },

      isUnlocked: (achievementId: string) => {
        return get().unlockedAchievements.includes(achievementId);
      },

      getProgressPercentage: (achievementId: string) => {
        const state = get();
        return state.progress[achievementId]?.percentage || 0;
      },

      clearRecentUnlocks: () => {
        set({ recentUnlocks: [] });
      },

      getAllAchievementsWithStatus: () => {
        const state = get();
        return ACHIEVEMENTS.map(achievement => ({
          ...achievement,
          unlocked: state.unlockedAchievements.includes(achievement.id),
          progress: state.progress[achievement.id]?.current || 0,
        }));
      },

      resetAchievements: () => {
        set(initialState);
      },
    }),
    {
      name: 'achievements-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors for better performance
export const achievementSelectors = {
  unlockedCount: (state: AchievementStore) => state.stats.totalUnlocked,
  totalPoints: (state: AchievementStore) => state.stats.totalPoints,
  recentUnlocks: (state: AchievementStore) => state.recentUnlocks,
  hasRecentUnlocks: (state: AchievementStore) => state.recentUnlocks.length > 0,
};
