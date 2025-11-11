import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MaterialIcons} from '@expo/vector-icons';
import {colors} from '@/styles/colors';
import * as NotificationService from '@/services/notifications';

export const NotificationTestScreen = () => {
  const [token, setToken] = useState<string>('');

  const testNotifications = [
    {
      title: 'Daily Claim',
      icon: 'payments',
      color: colors.success,
      action: () => NotificationService.notifyDailyClaimAvailable(),
    },
    {
      title: 'Game Results',
      icon: 'sports-esports',
      color: colors.primary,
      action: () => NotificationService.notifyGameResults(1250, 3, 75),
    },
    {
      title: 'Achievement Unlocked',
      icon: 'emoji-events',
      color: colors.warning,
      action: () => NotificationService.notifyAchievementUnlocked('First Victory'),
    },
    {
      title: 'Level Up',
      icon: 'trending-up',
      color: colors.info,
      action: () => NotificationService.notifyLevelUp(5),
    },
    {
      title: 'Email Verification',
      icon: 'mark-email-unread',
      color: colors.error,
      action: () => NotificationService.notifyEmailVerificationNeeded(),
    },
    {
      title: 'Streak at Risk',
      icon: 'local-fire-department',
      color: '#FF6B35',
      action: () => NotificationService.notifyStreakAtRisk(7),
    },
    {
      title: 'Low Credits',
      icon: 'account-balance-wallet',
      color: '#FFA500',
      action: () => NotificationService.notifyLowCredits(50),
    },
    {
      title: 'Tournament Starting',
      icon: 'military-tech',
      color: '#9333EA',
      action: () => NotificationService.notifyTournamentStarting('Grand Championship', 30),
    },
  ];

  const scheduledTests = [
    {
      title: 'Daily Reminder (9 AM)',
      icon: 'schedule',
      color: colors.primary,
      action: () => NotificationService.scheduleDailyClaimReminder(),
    },
    {
      title: 'Daily Play Reminder (8 PM)',
      icon: 'alarm',
      color: colors.secondary,
      action: () => NotificationService.scheduleDailyReminder(20, 0),
    },
  ];

  const handleRegisterPush = async () => {
    try {
      const result = await NotificationService.registerForPushNotifications();
      if (result) {
        setToken(result.token);
        Alert.alert('Success', `Token: ${result.token.substring(0, 20)}...`);
      } else {
        Alert.alert('Failed', 'Could not register for push notifications');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleTestNotification = async (action: () => Promise<any>, title: string) => {
    try {
      await action();
      Alert.alert('Sent!', `${title} notification sent`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleClearAll = async () => {
    await NotificationService.cancelAllNotifications();
    Alert.alert('Cleared', 'All scheduled notifications canceled');
  };

  const handleViewScheduled = async () => {
    const scheduled = await NotificationService.getScheduledNotifications();
    Alert.alert(
      'Scheduled Notifications',
      scheduled.length > 0
        ? scheduled.map(n => n.identifier).join('\n')
        : 'No scheduled notifications'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="notifications-active" size={32} color={colors.primary} />
        <Text style={styles.title}>Notification Tests</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Push Token Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRegisterPush}>
            <MaterialIcons name="notifications" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>Register for Push</Text>
          </TouchableOpacity>
          {token ? (
            <View style={styles.tokenBox}>
              <Text style={styles.tokenLabel}>Token:</Text>
              <Text style={styles.tokenText} numberOfLines={2}>
                {token}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Instant Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instant Notifications</Text>
          <View style={styles.grid}>
            {testNotifications.map((test, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.testCard, {borderLeftColor: test.color, borderLeftWidth: 4}]}
                onPress={() => handleTestNotification(test.action, test.title)}
              >
                <MaterialIcons name={test.icon as any} size={24} color={test.color} />
                <Text style={styles.testTitle}>{test.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Scheduled Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scheduled Notifications</Text>
          <View style={styles.grid}>
            {scheduledTests.map((test, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.testCard, {borderLeftColor: test.color, borderLeftWidth: 4}]}
                onPress={() => handleTestNotification(test.action, test.title)}
              >
                <MaterialIcons name={test.icon as any} size={24} color={test.color} />
                <Text style={styles.testTitle}>{test.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleViewScheduled}>
            <MaterialIcons name="list" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>View Scheduled</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerButton} onPress={handleClearAll}>
            <MaterialIcons name="clear-all" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Tip: Keep the app in background to test push notifications
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  testCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  tokenBox: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.textPrimary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
