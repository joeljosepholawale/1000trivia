/**
 * Push Notification Service
 * Handles registration, scheduling, and notification handling
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationToken {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
}

export interface NotificationContent {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: boolean | string;
}

export interface ScheduledNotification {
  id: string;
  content: NotificationContent;
  trigger: Notifications.NotificationTriggerInput;
}

/**
 * Request notification permissions and get push token
 */
export async function registerForPushNotifications(): Promise<PushNotificationToken | null> {
  try {
    // Check if physical device
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return null;
    }

    // Get existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions');
      return null;
    }

    // Get push token (optional - works without FCM for development)
    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'bd655ec7-7393-4868-aba8-e7f9910a45fc',
      });
    } catch (error) {
      console.warn('Could not get Expo push token (FCM not configured):', error);
      // Return null if FCM is not configured - push notifications won't work but app will run
      return null;
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });

      // Create additional channels for different notification types
      await Notifications.setNotificationChannelAsync('achievements', {
        name: 'Erfolge',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
        sound: 'achievement.wav',
      });

      await Notifications.setNotificationChannelAsync('challenges', {
        name: 'Herausforderungen',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#10B981',
      });

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Erinnerungen',
        importance: Notifications.AndroidImportance.LOW,
      });
    }

    return {
      token: tokenData.data,
      type: 'expo',
    };
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Send local notification immediately
 */
export async function sendLocalNotification(
  content: NotificationContent
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        data: content.data,
        badge: content.badge,
        sound: content.sound ?? true,
      },
      trigger: null, // Immediate
    });

    return id;
  } catch (error) {
    console.error('Error sending local notification:', error);
    return null;
  }
}

/**
 * Schedule notification for later
 */
export async function scheduleNotification(
  notification: ScheduledNotification
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.content.title,
        body: notification.content.body,
        data: notification.content.data,
        badge: notification.content.badge,
        sound: notification.content.sound ?? true,
      },
      trigger: notification.trigger,
    });

    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Set app badge number
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Clear app badge
 */
export async function clearBadge(): Promise<void> {
  await setBadgeCount(0);
}

// ============= PRE-DEFINED NOTIFICATIONS =============

/**
 * Schedule daily reminder to play
 */
export async function scheduleDailyReminder(hour: number = 20, minute: number = 0) {
  return scheduleNotification({
    id: 'daily-reminder',
    content: {
      title: '🎮 Zeit zu spielen!',
      body: 'Deine täglichen Herausforderungen warten auf dich!',
      data: { type: 'daily_reminder' },
      badge: 1,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      repeats: true,
    } as any,
  });
}

/**
 * Notify about new achievement
 */
export async function notifyAchievementUnlocked(achievementTitle: string) {
  return sendLocalNotification({
    title: '🏆 Erfolg freigeschaltet!',
    body: `Du hast "${achievementTitle}" erreicht!`,
    data: { type: 'achievement', title: achievementTitle },
    badge: 1,
  });
}

/**
 * Notify about challenge completion
 */
export async function notifyChallengeCompleted(challengeTitle: string, reward: number) {
  return sendLocalNotification({
    title: '✨ Herausforderung abgeschlossen!',
    body: `${challengeTitle} - ${reward} Credits verdient!`,
    data: { type: 'challenge_completed', title: challengeTitle, reward },
    badge: 1,
  });
}

/**
 * Notify about daily claim available
 */
export async function notifyDailyClaimAvailable() {
  return sendLocalNotification({
    title: '💰 Tägliche Belohnung!',
    body: 'Deine täglichen Credits warten auf dich!',
    data: { type: 'daily_claim' },
    badge: 1,
  });
}

/**
 * Notify about friend challenge
 */
export async function notifyFriendChallenge(friendName: string) {
  return sendLocalNotification({
    title: '⚔️ Herausforderung erhalten!',
    body: `${friendName} fordert dich heraus!`,
    data: { type: 'friend_challenge', friend: friendName },
    badge: 1,
  });
}

/**
 * Notify about tournament starting
 */
export async function notifyTournamentStarting(tournamentName: string, minutesUntilStart: number) {
  return scheduleNotification({
    id: `tournament-${Date.now()}`,
    content: {
      title: '🎯 Turnier startet bald!',
      body: `${tournamentName} beginnt in ${minutesUntilStart} Minuten!`,
      data: { type: 'tournament_starting', tournament: tournamentName },
      badge: 1,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutesUntilStart * 60,
    } as any,
  });
}

/**
 * Notify about streak at risk
 */
export async function notifyStreakAtRisk(currentStreak: number) {
  return sendLocalNotification({
    title: '🔥 Deine Serie ist in Gefahr!',
    body: `Spiele heute, um deine ${currentStreak}-Tage-Serie zu halten!`,
    data: { type: 'streak_risk', streak: currentStreak },
    badge: 1,
  });
}

/**
 * Notify about new weekly challenges
 */
export async function notifyNewWeeklyChallenges() {
  return sendLocalNotification({
    title: '📅 Neue wöchentliche Herausforderungen!',
    body: 'Neue Aufgaben und Belohnungen sind verfügbar!',
    data: { type: 'new_weekly_challenges' },
    badge: 1,
  });
}

/**
 * Notify about level up
 */
export async function notifyLevelUp(newLevel: number) {
  return sendLocalNotification({
    title: '⭐ Level Up!',
    body: `Glückwunsch! Du bist jetzt Level ${newLevel}!`,
    data: { type: 'level_up', level: newLevel },
    badge: 1,
  });
}

/**
 * Notify about low credits
 */
export async function notifyLowCredits(currentBalance: number) {
  return sendLocalNotification({
    title: '💳 Wenig Credits',
    body: `Du hast nur noch ${currentBalance} Credits. Verdiene mehr durch Spielen!`,
    data: { type: 'low_credits', balance: currentBalance },
  });
}

/**
 * Notify about game results
 */
export async function notifyGameResults(
  score: number,
  rank?: number,
  earnedCredits?: number
) {
  const rankText = rank ? ` Rank #${rank}!` : '';
  const creditsText = earnedCredits ? ` +${earnedCredits} credits earned!` : '';
  
  return sendLocalNotification({
    title: '🎮 Game Complete!',
    body: `Score: ${score}${rankText}${creditsText}`,
    data: { type: 'game_results', score, rank, earnedCredits },
    badge: 1,
  });
}

/**
 * Schedule daily claim reminder
 */
export async function scheduleDailyClaimReminder() {
  // Schedule for 9 AM daily
  return scheduleNotification({
    id: 'daily-claim-reminder',
    content: {
      title: '💰 Daily Credits Ready!',
      body: 'Claim your free daily credits now!',
      data: { type: 'daily_claim_reminder' },
      badge: 1,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
      repeats: true,
    } as any,
  });
}

/**
 * Notify about email verification needed
 */
export async function notifyEmailVerificationNeeded() {
  return sendLocalNotification({
    title: '📧 Verify Your Email',
    body: 'Verify your email to unlock paid game modes and prizes!',
    data: { type: 'email_verification' },
    badge: 1,
  });
}

// ============= NOTIFICATION LISTENERS =============

export type NotificationHandler = (notification: Notifications.Notification) => void;
export type NotificationResponseHandler = (response: Notifications.NotificationResponse) => void;

/**
 * Add listener for when notification is received while app is foregrounded
 */
export function addNotificationReceivedListener(
  handler: NotificationHandler
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Add listener for when user taps on notification
 */
export function addNotificationResponseListener(
  handler: NotificationResponseHandler
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Get the notification that opened the app (if any)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}
