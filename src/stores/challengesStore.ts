/**
 * Challenges Zustand Store
 * Manages daily and weekly challenges with progress tracking and rewards
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Challenge, 
  ChallengeProgress,
  ChallengePeriod,
  SAMPLE_DAILY_CHALLENGES,
  SAMPLE_WEEKLY_CHALLENGES,
  isChallengeExpired,
  getExpiryTime,
} from '@/types/challenges';

interface ChallengeState {
  // Active challenges
  dailyChallenges: Challenge[];
  weeklyChallenges: Challenge[];
  
  // Progress tracking
  challengeProgress: Record<string, ChallengeProgress>;
  
  // Completed challenge IDs
  completedChallenges: string[];
  
  // Statistics
  stats: {
    totalCompleted: number;
    dailyStreak: number;
    lastCompletionTime: number | null;
    totalCreditsEarned: number;
  };
  
  // Last refresh times
  lastDailyRefresh: number;
  lastWeeklyRefresh: number;
}

interface ChallengeActions {
  // Initialize/refresh challenges
  initializeChallenges: () => void;
  refreshDailyChallenges: () => void;
  refreshWeeklyChallenges: () => void;
  
  // Progress tracking
  updateChallengeProgress: (challengeId: string, progress: number) => void;
  incrementChallengeProgress: (challengeId: string, amount?: number) => void;
  
  // Complete challenge
  completeChallenge: (challengeId: string) => boolean;
  
  // Check if challenge is completed
  isChallengeCompleted: (challengeId: string) => boolean;
  
  // Get progress for a challenge
  getChallengeProgress: (challengeId: string) => ChallengeProgress | null;
  
  // Get all active challenges with status
  getActiveChallengesWithStatus: () => Array<Challenge & { 
    progress: number; 
    completed: boolean; 
    expired: boolean;
  }>;
  
  // Claim rewards
  claimReward: (challengeId: string) => number | null;
  
  // Reset (for testing)
  resetChallenges: () => void;
}

type ChallengeStore = ChallengeState & ChallengeActions;

const initialState: ChallengeState = {
  dailyChallenges: [],
  weeklyChallenges: [],
  challengeProgress: {},
  completedChallenges: [],
  stats: {
    totalCompleted: 0,
    dailyStreak: 0,
    lastCompletionTime: null,
    totalCreditsEarned: 0,
  },
  lastDailyRefresh: 0,
  lastWeeklyRefresh: 0,
};

export const useChallengesStore = create<ChallengeStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      initializeChallenges: () => {
        const state = get();
        const now = Date.now();
        
        // Check if we need to refresh daily challenges
        const dailyExpired = state.dailyChallenges.length === 0 || 
          state.dailyChallenges.some(c => isChallengeExpired(c, now));
        
        // Check if we need to refresh weekly challenges
        const weeklyExpired = state.weeklyChallenges.length === 0 || 
          state.weeklyChallenges.some(c => isChallengeExpired(c, now));
        
        if (dailyExpired) {
          get().refreshDailyChallenges();
        }
        
        if (weeklyExpired) {
          get().refreshWeeklyChallenges();
        }
      },

      refreshDailyChallenges: () => {
        const now = Date.now();
        const newDailyChallenges = SAMPLE_DAILY_CHALLENGES.map(challenge => ({
          ...challenge,
          startTime: now,
          expiryTime: getExpiryTime('daily', now),
        }));

        set({
          dailyChallenges: newDailyChallenges,
          lastDailyRefresh: now,
        });
      },

      refreshWeeklyChallenges: () => {
        const now = Date.now();
        const newWeeklyChallenges = SAMPLE_WEEKLY_CHALLENGES.map(challenge => ({
          ...challenge,
          startTime: now,
          expiryTime: getExpiryTime('weekly', now),
        }));

        set({
          weeklyChallenges: newWeeklyChallenges,
          lastWeeklyRefresh: now,
        });
      },

      updateChallengeProgress: (challengeId: string, progress: number) => {
        const state = get();
        const allChallenges = [...state.dailyChallenges, ...state.weeklyChallenges];
        const challenge = allChallenges.find(c => c.id === challengeId);
        
        if (!challenge) {
          console.warn(`Challenge ${challengeId} not found`);
          return;
        }

        const clampedProgress = Math.min(progress, challenge.requirement);
        const percentage = (clampedProgress / challenge.requirement) * 100;

        set((state) => ({
          challengeProgress: {
            ...state.challengeProgress,
            [challengeId]: {
              current: clampedProgress,
              total: challenge.requirement,
              percentage,
            },
          },
        }));

        // Auto-complete if requirement met
        if (clampedProgress >= challenge.requirement) {
          get().completeChallenge(challengeId);
        }
      },

      incrementChallengeProgress: (challengeId: string, amount: number = 1) => {
        const state = get();
        const currentProgress = state.challengeProgress[challengeId]?.current || 0;
        get().updateChallengeProgress(challengeId, currentProgress + amount);
      },

      completeChallenge: (challengeId: string) => {
        const state = get();
        
        // Already completed
        if (state.completedChallenges.includes(challengeId)) {
          return false;
        }

        const allChallenges = [...state.dailyChallenges, ...state.weeklyChallenges];
        const challenge = allChallenges.find(c => c.id === challengeId);
        
        if (!challenge) {
          return false;
        }

        // Check if expired
        if (isChallengeExpired(challenge)) {
          return false;
        }

        // Check if progress meets requirement
        const progress = state.challengeProgress[challengeId];
        if (!progress || progress.current < challenge.requirement) {
          return false;
        }

        // Update streak if daily challenge
        let newStreak = state.stats.dailyStreak;
        if (challenge.period === 'daily') {
          const lastCompletion = state.stats.lastCompletionTime;
          const oneDayMs = 24 * 60 * 60 * 1000;
          
          if (lastCompletion && Date.now() - lastCompletion < oneDayMs * 2) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
        }

        set((state) => ({
          completedChallenges: [...state.completedChallenges, challengeId],
          stats: {
            totalCompleted: state.stats.totalCompleted + 1,
            dailyStreak: newStreak,
            lastCompletionTime: Date.now(),
            totalCreditsEarned: state.stats.totalCreditsEarned + challenge.reward,
          },
        }));

        return true;
      },

      isChallengeCompleted: (challengeId: string) => {
        return get().completedChallenges.includes(challengeId);
      },

      getChallengeProgress: (challengeId: string) => {
        return get().challengeProgress[challengeId] || null;
      },

      getActiveChallengesWithStatus: () => {
        const state = get();
        const allChallenges = [...state.dailyChallenges, ...state.weeklyChallenges];
        const now = Date.now();

        return allChallenges.map(challenge => {
          const progress = state.challengeProgress[challenge.id]?.current || 0;
          const completed = state.completedChallenges.includes(challenge.id);
          const expired = isChallengeExpired(challenge, now);

          return {
            ...challenge,
            progress,
            completed,
            expired,
          };
        });
      },

      claimReward: (challengeId: string) => {
        const state = get();
        
        if (!state.completedChallenges.includes(challengeId)) {
          return null;
        }

        const allChallenges = [...state.dailyChallenges, ...state.weeklyChallenges];
        const challenge = allChallenges.find(c => c.id === challengeId);
        
        return challenge?.reward || null;
      },

      resetChallenges: () => {
        set(initialState);
      },
    }),
    {
      name: 'challenges-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const challengeSelectors = {
  activeDailyChallenges: (state: ChallengeStore) => 
    state.dailyChallenges.filter(c => !isChallengeExpired(c)),
  
  activeWeeklyChallenges: (state: ChallengeStore) => 
    state.weeklyChallenges.filter(c => !isChallengeExpired(c)),
  
  dailyStreak: (state: ChallengeStore) => state.stats.dailyStreak,
  
  totalCompleted: (state: ChallengeStore) => state.stats.totalCompleted,
  
  totalCreditsEarned: (state: ChallengeStore) => state.stats.totalCreditsEarned,
};
