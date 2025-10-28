/**
 * Zustand Stores Index
 * Centralized export of all stores and utilities
 */

// Export all stores
export * from './achievementsStore';
export * from './challengesStore';
export * from './preferencesStore';
export * from './notificationsStore';
export * from './referralsStore';

// Re-export store hooks for convenience
export { useAchievementsStore } from './achievementsStore';
export { useChallengesStore } from './challengesStore';
export { usePreferencesStore } from './preferencesStore';
export { useNotificationsStore } from './notificationsStore';
export { useReferralsStore } from './referralsStore';

// Type-safe store utilities
import { useAchievementsStore, achievementSelectors } from './achievementsStore';
import { useChallengesStore, challengeSelectors } from './challengesStore';
import { usePreferencesStore, preferencesSelectors } from './preferencesStore';
import { useNotificationsStore, notificationSelectors } from './notificationsStore';
import { useReferralsStore, referralSelectors } from './referralsStore';

/**
 * Utility hook to use multiple stores at once
 * Prevents unnecessary re-renders by using selectors
 */
export const useStores = () => ({
  achievements: useAchievementsStore,
  challenges: useChallengesStore,
  preferences: usePreferencesStore,
  notifications: useNotificationsStore,
  referrals: useReferralsStore,
});

/**
 * Centralized selectors for easy access
 */
export const selectors = {
  achievements: achievementSelectors,
  challenges: challengeSelectors,
  preferences: preferencesSelectors,
  notifications: notificationSelectors,
  referrals: referralSelectors,
};

/**
 * Reset all stores (useful for logout or testing)
 */
export const resetAllStores = () => {
  useAchievementsStore.getState().resetAchievements();
  useChallengesStore.getState().resetChallenges();
  usePreferencesStore.getState().resetToDefaults();
  useNotificationsStore.getState().resetNotifications();
  useReferralsStore.getState().resetReferrals();
};

/**
 * Initialize all stores on app startup
 */
export const initializeStores = () => {
  // Initialize challenges (check for expiry and refresh if needed)
  useChallengesStore.getState().initializeChallenges();
  
  // Initialize referrals
  useReferralsStore.getState().initialize();
  
  // Mark first launch complete if this is not the first launch
  const prefs = usePreferencesStore.getState();
  if (prefs.firstLaunch) {
    // You can add additional first-launch logic here
  }
};
