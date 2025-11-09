/**
 * User Preferences Zustand Store
 * Manages app settings, theme preferences, notifications, and user configuration
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';
type Language = 'de' | 'en';

interface NotificationPreferences {
  enabled: boolean;
  achievements: boolean;
  challenges: boolean;
  dailyReminders: boolean;
  friendChallenges: boolean;
  tournaments: boolean;
  promotional: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface GamePreferences {
  musicVolume: number; // 0-1
  sfxVolume: number; // 0-1
  autoPlaySpeed: 'slow' | 'normal' | 'fast';
  showHints: boolean;
  confirmActions: boolean;
  animationsEnabled: boolean;
}

interface PrivacyPreferences {
  profileVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;
  shareGameStats: boolean;
}

interface PreferencesState {
  // Theme
  themeMode: ThemeMode;
  
  // Language
  language: Language;
  
  // Notifications
  notifications: NotificationPreferences;
  
  // Game settings
  game: GamePreferences;
  
  // Privacy
  privacy: PrivacyPreferences;
  
  // Accessibility
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'normal' | 'large';
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  };
  
  // Other
  firstLaunch: boolean;
  tutorialCompleted: boolean;
  lastAppVersion: string | null;
}

interface PreferencesActions {
  // Theme
  setThemeMode: (mode: ThemeMode) => void;
  
  // Language
  setLanguage: (language: Language) => void;
  
  // Notifications
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  toggleNotifications: (enabled: boolean) => void;
  
  // Game settings
  updateGamePreferences: (prefs: Partial<GamePreferences>) => void;
  setVolume: (type: 'music' | 'sfx', volume: number) => void;
  
  // Privacy
  updatePrivacyPreferences: (prefs: Partial<PrivacyPreferences>) => void;
  
  // Accessibility
  updateAccessibility: (prefs: Partial<PreferencesState['accessibility']>) => void;
  
  // App lifecycle
  markTutorialComplete: () => void;
  markFirstLaunchComplete: () => void;
  updateAppVersion: (version: string) => void;
  
  // Reset
  resetToDefaults: () => void;
}

type PreferencesStore = PreferencesState & PreferencesActions;

const defaultNotificationPreferences: NotificationPreferences = {
  enabled: true,
  achievements: true,
  challenges: true,
  dailyReminders: true,
  friendChallenges: true,
  tournaments: true,
  promotional: false,
  soundEnabled: true,
  vibrationEnabled: true,
};

const defaultGamePreferences: GamePreferences = {
  musicVolume: 0.7,
  sfxVolume: 0.8,
  autoPlaySpeed: 'normal',
  showHints: true,
  confirmActions: true,
  animationsEnabled: true,
};

const defaultPrivacyPreferences: PrivacyPreferences = {
  profileVisibility: 'public',
  showOnlineStatus: true,
  allowFriendRequests: true,
  shareGameStats: true,
};

const initialState: PreferencesState = {
  themeMode: 'auto',
  language: 'de',
  notifications: defaultNotificationPreferences,
  game: defaultGamePreferences,
  privacy: defaultPrivacyPreferences,
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    fontSize: 'normal',
    colorBlindMode: 'none',
  },
  firstLaunch: true,
  tutorialCompleted: false,
  lastAppVersion: null,
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode });
      },

      setLanguage: (language: Language) => {
        set({ language });
      },

      updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => {
        set((state) => ({
          notifications: {
            ...state.notifications,
            ...prefs,
          },
        }));
      },

      toggleNotifications: (enabled: boolean) => {
        set((state) => ({
          notifications: {
            ...state.notifications,
            enabled,
          },
        }));
      },

      updateGamePreferences: (prefs: Partial<GamePreferences>) => {
        set((state) => ({
          game: {
            ...state.game,
            ...prefs,
          },
        }));
      },

      setVolume: (type: 'music' | 'sfx', volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set((state) => ({
          game: {
            ...state.game,
            [`${type}Volume`]: clampedVolume,
          },
        }));
      },

      updatePrivacyPreferences: (prefs: Partial<PrivacyPreferences>) => {
        set((state) => ({
          privacy: {
            ...state.privacy,
            ...prefs,
          },
        }));
      },

      updateAccessibility: (prefs: Partial<PreferencesState['accessibility']>) => {
        set((state) => ({
          accessibility: {
            ...state.accessibility,
            ...prefs,
          },
        }));
      },

      markTutorialComplete: () => {
        set({ tutorialCompleted: true });
      },

      markFirstLaunchComplete: () => {
        set({ firstLaunch: false });
      },

      updateAppVersion: (version: string) => {
        set({ lastAppVersion: version });
      },

      resetToDefaults: () => {
        set(initialState);
      },
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const preferencesSelectors = {
  themeMode: (state: PreferencesStore) => state.themeMode,
  language: (state: PreferencesStore) => state.language,
  notificationsEnabled: (state: PreferencesStore) => state.notifications.enabled,
  musicVolume: (state: PreferencesStore) => state.game.musicVolume,
  sfxVolume: (state: PreferencesStore) => state.game.sfxVolume,
  isFirstLaunch: (state: PreferencesStore) => state.firstLaunch,
  isTutorialComplete: (state: PreferencesStore) => state.tutorialCompleted,
};
