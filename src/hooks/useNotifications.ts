/**
 * useNotifications Hook
 * Manages notification registration and handling throughout app lifecycle
 */

import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationResponse,
  PushNotificationToken,
  scheduleDailyClaimReminder,
} from '../services/notifications';

export interface NotificationHandlers {
  onTokenReceived?: (token: PushNotificationToken) => void;
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void;
  enableAutoNavigation?: boolean; // Auto-navigate based on notification type
}

/**
 * Hook to handle push notification setup and listeners
 */
export function useNotifications(handlers: NotificationHandlers = {}) {
  let navigation: any = null;
  try {
    navigation = useNavigation();
  } catch (e) {
    // Navigation not available yet, will be null
  }
  
  const notificationListener = useRef<Notifications.Subscription | undefined>();
  const responseListener = useRef<Notifications.Subscription | undefined>();

  // Handle notification navigation
  const handleNotificationNavigation = (data: any) => {
    if (!handlers.enableAutoNavigation || !navigation) return;

    try {
      switch (data?.type) {
        case 'daily_claim':
        case 'daily_claim_reminder':
          navigation.navigate('Wallet');
          break;
        case 'game_results':
          navigation.navigate('Leaderboard');
          break;
        case 'email_verification':
          navigation.navigate('EmailVerification');
          break;
        case 'achievement':
        case 'level_up':
          navigation.navigate('Profile');
          break;
        case 'tournament_starting':
        case 'friend_challenge':
          navigation.navigate('Game');
          break;
        default:
          break;
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications().then((token) => {
      if (token) {
        handlers.onTokenReceived?.(token);
        // TODO: Send token to backend for storage
      }
    });

    // Schedule daily claim reminder on first launch
    scheduleDailyClaimReminder().catch((error) => {
    });

    // Check if app was opened via notification
    getLastNotificationResponse().then((response) => {
      if (response) {
        handleNotificationNavigation(response.notification.request.content.data);
        handlers.onNotificationTapped?.(response);
      }
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = addNotificationReceivedListener((notification) => {
      handlers.onNotificationReceived?.(notification);
    });

    // Listen for user tapping on notifications
    responseListener.current = addNotificationResponseListener((response) => {
      handleNotificationNavigation(response.notification.request.content.data);
      handlers.onNotificationTapped?.(response);
    });

    // Cleanup
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}
