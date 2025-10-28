/**
 * useNotifications Hook
 * Manages notification registration and handling throughout app lifecycle
 */

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationResponse,
  PushNotificationToken,
} from '../services/notifications';

export interface NotificationHandlers {
  onTokenReceived?: (token: PushNotificationToken) => void;
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void;
}

/**
 * Hook to handle push notification setup and listeners
 */
export function useNotifications(handlers: NotificationHandlers = {}) {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications().then((token) => {
      if (token) {
        console.log('Push token:', token.token);
        handlers.onTokenReceived?.(token);
        // TODO: Send token to backend for storage
      }
    });

    // Check if app was opened via notification
    getLastNotificationResponse().then((response) => {
      if (response) {
        handlers.onNotificationTapped?.(response);
      }
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      handlers.onNotificationReceived?.(notification);
    });

    // Listen for user tapping on notifications
    responseListener.current = addNotificationResponseListener((response) => {
      console.log('Notification tapped:', response);
      handlers.onNotificationTapped?.(response);
    });

    // Cleanup
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}
