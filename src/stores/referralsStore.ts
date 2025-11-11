/**
 * Referrals Zustand Store
 * Manages referral codes, rewards, and tracking
 * Integrates with existing referral service
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getOrCreateReferralCode,
  useReferralCode as redeemCode,
  getReferralStatus,
  ReferralReward,
  ReferralStatus,
} from '@/features/referrals/referral';

interface ReferralState {
  // User's referral code
  myCode: string | null;
  
  // Code the user has used
  usedCode: string | null;
  
  // All rewards received
  rewards: ReferralReward[];
  
  // Referrals made by this user (people who used their code)
  referralsMade: {
    count: number;
    codes: string[]; // Codes of people who used this user's code
  };
  
  // Statistics
  stats: {
    totalRewards: number;
    totalCreditsEarned: number;
    lastRewardTime: number | null;
  };
  
  // Loading/error states
  isLoading: boolean;
  error: string | null;
}

interface ReferralActions {
  // Initialize and fetch data
  initialize: () => Promise<void>;
  
  // Get or create referral code
  fetchMyCode: () => Promise<string | null>;
  
  // Use/redeem another user's code
  redeemReferralCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  
  // Add reward
  addReward: (reward: ReferralReward) => void;
  
  // Track referral made
  trackReferralMade: (codeUsed: string) => void;
  
  // Get total credits from referrals
  getTotalCredits: () => number;
  
  // Check if user has used a code
  hasUsedCode: () => boolean;
  
  // Clear error
  clearError: () => void;
  
  // Reset (for testing)
  resetReferrals: () => void;
}

type ReferralStore = ReferralState & ReferralActions;

const initialState: ReferralState = {
  myCode: null,
  usedCode: null,
  rewards: [],
  referralsMade: {
    count: 0,
    codes: [],
  },
  stats: {
    totalRewards: 0,
    totalCreditsEarned: 0,
    lastRewardTime: null,
  },
  isLoading: false,
  error: null,
};

export const useReferralsStore = create<ReferralStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      initialize: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Fetch referral status from service
          const status = await getReferralStatus();
          
          set({
            myCode: status.myCode,
            usedCode: status.usedCode,
            rewards: status.rewards,
            stats: {
              totalRewards: status.rewards.length,
              totalCreditsEarned: status.rewards
                .filter(r => r.type === 'credits')
                .reduce((sum, r) => sum + (r.amount || 0), 0),
              lastRewardTime: status.rewards.length > 0
                ? Math.max(...status.rewards.map(r => r.grantedAt))
                : null,
            },
            isLoading: false,
          });
        } catch (error) {
          set({
            error: 'Failed to load referral data',
            isLoading: false,
          });
        }
      },

      fetchMyCode: async () => {
        try {
          const code = await getOrCreateReferralCode();
          set({ myCode: code });
          return code;
        } catch (error) {
          set({ error: 'Failed to generate referral code' });
          return null;
        }
      },

      redeemReferralCode: async (code: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await redeemCode(code);
          
          if (result.ok) {
            // Refresh data after successful redemption
            await get().initialize();
            
            set({ isLoading: false });
            return { success: true };
          } else {
            set({
              error: result.error || 'Failed to redeem code',
              isLoading: false,
            });
            return {
              success: false,
              error: result.error,
            };
          }
        } catch (error) {
          const errorMsg = 'An error occurred while redeeming code';
          set({
            error: errorMsg,
            isLoading: false,
          });
          return {
            success: false,
            error: errorMsg,
          };
        }
      },

      addReward: (reward: ReferralReward) => {
        set((state) => {
          const creditsEarned = reward.type === 'credits' ? (reward.amount || 0) : 0;
          
          return {
            rewards: [...state.rewards, reward],
            stats: {
              totalRewards: state.stats.totalRewards + 1,
              totalCreditsEarned: state.stats.totalCreditsEarned + creditsEarned,
              lastRewardTime: reward.grantedAt,
            },
          };
        });
      },

      trackReferralMade: (codeUsed: string) => {
        set((state) => ({
          referralsMade: {
            count: state.referralsMade.count + 1,
            codes: [...state.referralsMade.codes, codeUsed],
          },
        }));
      },

      getTotalCredits: () => {
        const state = get();
        return state.rewards
          .filter(r => r.type === 'credits')
          .reduce((sum, r) => sum + (r.amount || 0), 0);
      },

      hasUsedCode: () => {
        return get().usedCode !== null;
      },

      clearError: () => {
        set({ error: null });
      },

      resetReferrals: () => {
        set(initialState);
      },
    }),
    {
      name: 'referrals-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const referralSelectors = {
  myCode: (state: ReferralStore) => state.myCode,
  usedCode: (state: ReferralStore) => state.usedCode,
  hasUsedCode: (state: ReferralStore) => state.usedCode !== null,
  totalRewards: (state: ReferralStore) => state.stats.totalRewards,
  totalCredits: (state: ReferralStore) => state.stats.totalCreditsEarned,
  referralCount: (state: ReferralStore) => state.referralsMade.count,
  isLoading: (state: ReferralStore) => state.isLoading,
  hasError: (state: ReferralStore) => state.error !== null,
};
