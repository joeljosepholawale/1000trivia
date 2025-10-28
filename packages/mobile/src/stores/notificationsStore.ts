/**
 * Notifications Zustand Store
 * Manages notification history, preferences, and scheduling
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  receivedAt: number;
  read: boolean;
  tapped: boolean;
}

interface NotificationState {
  // Notification history
  history: NotificationRecord[];
  
  // Push token
  pushToken: string | null;
  
  // Permission status
  permissionGranted: boolean;
  
  // Scheduled notification IDs (to track what's scheduled)
  scheduledIds: string[];
  
  // Statistics
  stats: {
    totalReceived: number;
    totalTapped: number;
    lastReceivedTime: number | null;
  };
}

interface NotificationActions {
  // Token management
  setPushToken: (token: string) => void;
  getPushToken: () => string | null;
  
  // Permission
  setPermissionGranted: (granted: boolean) => void;
  
  // History management
  addNotificationToHistory: (notification: Omit<NotificationRecord, 'receivedAt' | 'read' | 'tapped'>) => void;
  markAsRead: (notificationId: string) => void;
  markAsTapped: (notificationId: string) => void;
  markAllAsRead: () => void;
  
  // Get notifications
  getUnreadNotifications: () => NotificationRecord[];
  getNotificationById: (id: string) => NotificationRecord | undefined;
  
  // Clear history
  clearHistory: () => void;
  clearOldNotifications: (daysOld?: number) => void;
  
  // Scheduled notifications tracking
  addScheduledId: (id: string) => void;
  removeScheduledId: (id: string) => void;
  clearScheduledIds: () => void;
  
  // Reset
  resetNotifications: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

const initialState: NotificationState = {
  history: [],
  pushToken: null,
  permissionGranted: false,
  scheduledIds: [],
  stats: {
    totalReceived: 0,
    totalTapped: 0,
    lastReceivedTime: null,
  },
};

export const useNotificationsStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPushToken: (token: string) => {
        set({ pushToken: token });
      },

      getPushToken: () => {
        return get().pushToken;
      },

      setPermissionGranted: (granted: boolean) => {
        set({ permissionGranted: granted });
      },

      addNotificationToHistory: (notification) => {
        const record: NotificationRecord = {
          ...notification,
          receivedAt: Date.now(),
          read: false,
          tapped: false,
        };

        set((state) => ({
          history: [record, ...state.history].slice(0, 100), // Keep last 100
          stats: {
            ...state.stats,
            totalReceived: state.stats.totalReceived + 1,
            lastReceivedTime: Date.now(),
          },
        }));
      },

      markAsRead: (notificationId: string) => {
        set((state) => ({
          history: state.history.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          ),
        }));
      },

      markAsTapped: (notificationId: string) => {
        set((state) => ({
          history: state.history.map((notif) =>
            notif.id === notificationId
              ? { ...notif, read: true, tapped: true }
              : notif
          ),
          stats: {
            ...state.stats,
            totalTapped: state.stats.totalTapped + 1,
          },
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          history: state.history.map((notif) => ({ ...notif, read: true })),
        }));
      },

      getUnreadNotifications: () => {
        return get().history.filter((notif) => !notif.read);
      },

      getNotificationById: (id: string) => {
        return get().history.find((notif) => notif.id === id);
      },

      clearHistory: () => {
        set({ history: [] });
      },

      clearOldNotifications: (daysOld: number = 7) => {
        const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
        set((state) => ({
          history: state.history.filter((notif) => notif.receivedAt > cutoffTime),
        }));
      },

      addScheduledId: (id: string) => {
        set((state) => ({
          scheduledIds: [...state.scheduledIds, id],
        }));
      },

      removeScheduledId: (id: string) => {
        set((state) => ({
          scheduledIds: state.scheduledIds.filter((scheduledId) => scheduledId !== id),
        }));
      },

      clearScheduledIds: () => {
        set({ scheduledIds: [] });
      },

      resetNotifications: () => {
        set(initialState);
      },
    }),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist history (too large), only persist token and permission
      partialize: (state) => ({
        pushToken: state.pushToken,
        permissionGranted: state.permissionGranted,
        history: state.history.slice(0, 20), // Keep only recent 20 in storage
      }),
    }
  )
);

// Selectors
export const notificationSelectors = {
  unreadCount: (state: NotificationStore) =>
    state.history.filter((n) => !n.read).length,
  
  hasUnread: (state: NotificationStore) =>
    state.history.some((n) => !n.read),
  
  recentNotifications: (state: NotificationStore) =>
    state.history.slice(0, 10),
  
  hasPermission: (state: NotificationStore) =>
    state.permissionGranted,
  
  pushToken: (state: NotificationStore) =>
    state.pushToken,
};
