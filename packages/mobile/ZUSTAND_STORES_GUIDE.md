# 📦 Zustand State Management Guide

Complete guide to using Zustand stores in the 1000 Ravier mobile app.

## 🎯 Overview

We've implemented a comprehensive Zustand state management system with **5 specialized stores**:

1. **Achievements Store** - Achievement tracking and unlocks
2. **Challenges Store** - Daily/weekly challenges and progress
3. **Preferences Store** - User settings and app configuration
4. **Notifications Store** - Notification history and management
5. **Referrals Store** - Referral codes and rewards

All stores include:
- ✅ TypeScript type safety
- ✅ Automatic persistence to AsyncStorage
- ✅ Optimized selectors
- ✅ Complete CRUD operations

---

## 📁 File Structure

```
src/stores/
├── index.ts                    # Centralized exports and utilities
├── achievementsStore.ts        # Achievements management
├── challengesStore.ts          # Challenges and progress
├── preferencesStore.ts         # User preferences and settings
├── notificationsStore.ts       # Notification history
└── referralsStore.ts           # Referral system
```

---

## 🚀 Getting Started

### Installation

Add zustand to dependencies (already done in package.json):
```bash
npm install
```

### Initialize Stores on App Startup

```tsx
// In App.tsx or root component
import { initializeStores } from '@/stores';

useEffect(() => {
  initializeStores();
}, []);
```

---

## 1️⃣ Achievements Store

### Basic Usage

```tsx
import { useAchievementsStore } from '@/stores';

function AchievementsScreen() {
  const { 
    unlockedAchievements, 
    updateProgress,
    isUnlocked,
    stats 
  } = useAchievementsStore();

  return (
    <View>
      <Text>Unlocked: {stats.totalUnlocked}</Text>
      <Text>Total Points: {stats.totalPoints}</Text>
    </View>
  );
}
```

### Common Operations

```tsx
// Update achievement progress
updateProgress('first_win', 1);

// Increment progress
incrementProgress('win_10_games', 1);

// Check if unlocked
const isUnlocked = useAchievementsStore.getState().isUnlocked('first_win');

// Get all achievements with status
const achievements = useAchievementsStore.getState().getAllAchievementsWithStatus();

// Handle recent unlocks (for notifications)
const recentUnlocks = useAchievementsStore((state) => state.recentUnlocks);
if (recentUnlocks.length > 0) {
  // Show achievement notification
  clearRecentUnlocks();
}
```

### Selectors (Optimized)

```tsx
import { achievementSelectors } from '@/stores';

// Use selectors to prevent unnecessary re-renders
const totalPoints = useAchievementsStore(achievementSelectors.totalPoints);
const hasNewUnlocks = useAchievementsStore(achievementSelectors.hasRecentUnlocks);
```

---

## 2️⃣ Challenges Store

### Basic Usage

```tsx
import { useChallengesStore } from '@/stores';

function ChallengesScreen() {
  const {
    dailyChallenges,
    weeklyChallenges,
    updateChallengeProgress,
    stats,
  } = useChallengesStore();

  return (
    <View>
      <Text>Daily Streak: {stats.dailyStreak} 🔥</Text>
      <Text>Total Completed: {stats.totalCompleted}</Text>
      <Text>Credits Earned: {stats.totalCreditsEarned}</Text>
    </View>
  );
}
```

### Common Operations

```tsx
// Initialize challenges on app start (auto-refresh expired)
initializeChallenges();

// Update challenge progress
updateChallengeProgress('daily_win_3', 2);

// Increment progress
incrementChallengeProgress('daily_win_3', 1);

// Get challenges with status
const activeChallenges = getActiveChallengesWithStatus();
// Returns: { ...challenge, progress, completed, expired }

// Claim reward
const credits = claimReward('challenge_id');
if (credits) {
  // Add credits to wallet
}

// Manually refresh
refreshDailyChallenges();
refreshWeeklyChallenges();
```

### Selectors

```tsx
import { challengeSelectors } from '@/stores';

const dailyStreak = useChallengesStore(challengeSelectors.dailyStreak);
const activeDailies = useChallengesStore(challengeSelectors.activeDailyChallenges);
const totalCredits = useChallengesStore(challengeSelectors.totalCreditsEarned);
```

---

## 3️⃣ Preferences Store

### Basic Usage

```tsx
import { usePreferencesStore } from '@/stores';

function SettingsScreen() {
  const {
    themeMode,
    setThemeMode,
    notifications,
    updateNotificationPreferences,
    game,
    setVolume,
  } = usePreferencesStore();

  return (
    <View>
      {/* Theme toggle */}
      <Switch
        value={themeMode === 'dark'}
        onValueChange={(dark) => setThemeMode(dark ? 'dark' : 'light')}
      />
      
      {/* Volume control */}
      <Slider
        value={game.musicVolume}
        onValueChange={(vol) => setVolume('music', vol)}
      />
    </View>
  );
}
```

### Categories

#### Theme & Language
```tsx
setThemeMode('dark' | 'light' | 'auto');
setLanguage('de' | 'en');
```

#### Notifications
```tsx
// Toggle all notifications
toggleNotifications(true);

// Update specific preferences
updateNotificationPreferences({
  achievements: true,
  challenges: false,
  dailyReminders: true,
  soundEnabled: true,
  vibrationEnabled: false,
});
```

#### Game Settings
```tsx
updateGamePreferences({
  showHints: false,
  animationsEnabled: true,
  autoPlaySpeed: 'fast',
});

setVolume('music', 0.8);
setVolume('sfx', 0.6);
```

#### Privacy
```tsx
updatePrivacyPreferences({
  profileVisibility: 'friends',
  showOnlineStatus: false,
  allowFriendRequests: true,
});
```

#### Accessibility
```tsx
updateAccessibility({
  reduceMotion: true,
  highContrast: false,
  fontSize: 'large',
  colorBlindMode: 'deuteranopia',
});
```

### Selectors

```tsx
import { preferencesSelectors } from '@/stores';

const theme = usePreferencesStore(preferencesSelectors.themeMode);
const notificationsEnabled = usePreferencesStore(preferencesSelectors.notificationsEnabled);
const isFirstLaunch = usePreferencesStore(preferencesSelectors.isFirstLaunch);
```

---

## 4️⃣ Notifications Store

### Basic Usage

```tsx
import { useNotificationsStore } from '@/stores';

function NotificationsScreen() {
  const {
    history,
    getUnreadNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationsStore();

  const unread = getUnreadNotifications();

  return (
    <FlatList
      data={history}
      renderItem={({ item }) => (
        <NotificationItem
          notification={item}
          onPress={() => markAsRead(item.id)}
        />
      )}
    />
  );
}
```

### Common Operations

```tsx
// Store push token
setPushToken('expo-push-token-xxx');

// Set permission status
setPermissionGranted(true);

// Add notification to history
addNotificationToHistory({
  id: 'notif_123',
  type: 'achievement',
  title: 'Achievement Unlocked!',
  body: 'You earned "First Win"',
  data: { achievementId: 'first_win' },
});

// Mark as tapped (also marks as read)
markAsTapped('notif_123');

// Clean up old notifications (7 days default)
clearOldNotifications(7);

// Track scheduled notifications
addScheduledId('daily-reminder');
removeScheduledId('daily-reminder');
```

### Selectors

```tsx
import { notificationSelectors } from '@/stores';

const unreadCount = useNotificationsStore(notificationSelectors.unreadCount);
const hasUnread = useNotificationsStore(notificationSelectors.hasUnread);
const recent = useNotificationsStore(notificationSelectors.recentNotifications);
const token = useNotificationsStore(notificationSelectors.pushToken);
```

---

## 5️⃣ Referrals Store

### Basic Usage

```tsx
import { useReferralsStore } from '@/stores';

function ReferralScreen() {
  const {
    myCode,
    usedCode,
    rewards,
    stats,
    fetchMyCode,
    redeemReferralCode,
    isLoading,
  } = useReferralsStore();

  useEffect(() => {
    if (!myCode) {
      fetchMyCode();
    }
  }, []);

  const handleRedeem = async (code: string) => {
    const result = await redeemReferralCode(code);
    if (result.success) {
      Alert.alert('Success!', 'Code redeemed successfully');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <View>
      <Text>My Code: {myCode}</Text>
      <Text>Credits Earned: {stats.totalCreditsEarned}</Text>
      <Text>Referrals Made: {referralsMade.count}</Text>
    </View>
  );
}
```

### Common Operations

```tsx
// Initialize (fetch from service)
await initialize();

// Get or create code
const code = await fetchMyCode();

// Redeem code
const result = await redeemReferralCode('RAV-ABC12345');

// Add reward manually (usually done by backend)
addReward({
  id: 'reward_123',
  type: 'credits',
  amount: 100,
  description: 'Referral Bonus',
  grantedAt: Date.now(),
});

// Track referral made
trackReferralMade('friend-code');

// Get total credits
const totalCredits = getTotalCredits();

// Check if user has used a code
const hasUsed = hasUsedCode();
```

### Selectors

```tsx
import { referralSelectors } from '@/stores';

const myCode = useReferralsStore(referralSelectors.myCode);
const hasUsedCode = useReferralsStore(referralSelectors.hasUsedCode);
const totalCredits = useReferralsStore(referralSelectors.totalCredits);
const isLoading = useReferralsStore(referralSelectors.isLoading);
```

---

## 🛠️ Utility Functions

### Reset All Stores

```tsx
import { resetAllStores } from '@/stores';

// Useful for logout or testing
function handleLogout() {
  resetAllStores();
  // Navigate to login
}
```

### Access Multiple Stores

```tsx
import { useStores } from '@/stores';

const stores = useStores();
stores.achievements.getState().updateProgress('test', 10);
stores.challenges.getState().initializeChallenges();
```

### Direct State Access (Outside Components)

```tsx
import { useAchievementsStore } from '@/stores';

// Get state without subscribing
const state = useAchievementsStore.getState();
state.updateProgress('achievement_id', 50);

// Subscribe to changes
const unsubscribe = useAchievementsStore.subscribe((state) => {
  console.log('Achievements updated:', state.stats);
});

// Later...
unsubscribe();
```

---

## 📊 Best Practices

### 1. Use Selectors for Performance

```tsx
// ❌ Bad - re-renders on any state change
const { stats, progress, recentUnlocks } = useAchievementsStore();

// ✅ Good - only re-renders when totalPoints changes
const totalPoints = useAchievementsStore(s => s.stats.totalPoints);
```

### 2. Batch Updates

```tsx
// ❌ Bad - multiple updates
updateProgress('achievement1', 10);
updateProgress('achievement2', 5);
updateProgress('achievement3', 20);

// ✅ Better - batch in a function
function updateMultipleAchievements(updates: Record<string, number>) {
  Object.entries(updates).forEach(([id, progress]) => {
    useAchievementsStore.getState().updateProgress(id, progress);
  });
}
```

### 3. Use Initialization

```tsx
// Initialize stores on app startup
useEffect(() => {
  initializeStores();
}, []);

// Or individually
useEffect(() => {
  useChallengesStore.getState().initializeChallenges();
  useReferralsStore.getState().initialize();
}, []);
```

### 4. Error Handling

```tsx
const { error, clearError } = useReferralsStore();

if (error) {
  Alert.alert('Error', error, [
    { text: 'OK', onPress: clearError }
  ]);
}
```

---

## 🔗 Integration Examples

### With Achievement Notifications

```tsx
import { useAchievementsStore } from '@/stores';
import { notifyAchievementUnlocked } from '@/services/notifications';

function GameScreen() {
  const { recentUnlocks, clearRecentUnlocks } = useAchievementsStore();

  useEffect(() => {
    if (recentUnlocks.length > 0) {
      // Show notifications for each unlock
      recentUnlocks.forEach(achievement => {
        notifyAchievementUnlocked(achievement.title);
      });
      
      // Clear after showing
      clearRecentUnlocks();
    }
  }, [recentUnlocks]);
}
```

### With Challenge Progress

```tsx
function GameResultScreen({ score }: Props) {
  const { incrementChallengeProgress } = useChallengesStore();
  const { incrementProgress: incrementAchievement } = useAchievementsStore();

  useEffect(() => {
    // Update both challenges and achievements
    incrementChallengeProgress('daily_win_3', 1);
    incrementAchievement('win_10_games', 1);
    
    if (score > 90) {
      incrementChallengeProgress('daily_perfect_score', 1);
    }
  }, [score]);
}
```

### With Theme Preferences

```tsx
import { usePreferencesStore } from '@/stores';
import { useTheme } from '@/contexts/ThemeContext';

function App() {
  const themeMode = usePreferencesStore(s => s.themeMode);
  const { setThemeMode } = useTheme();

  useEffect(() => {
    // Sync Zustand preference with ThemeContext
    setThemeMode(themeMode);
  }, [themeMode]);
}
```

---

## 📦 Package Information

- **Zustand Version**: ^4.5.0
- **Persistence**: zustand/middleware (included)
- **Storage**: AsyncStorage
- **TypeScript**: Full type safety

---

## 🎯 Summary

You now have **5 fully functional Zustand stores** with:

✅ **Achievements** - 182 lines, unlocking & progress tracking  
✅ **Challenges** - 299 lines, daily/weekly with auto-refresh  
✅ **Preferences** - 248 lines, complete settings management  
✅ **Notifications** - 218 lines, history & push token management  
✅ **Referrals** - 235 lines, code generation & reward tracking  

**Total**: ~1,200 lines of production-ready state management!

All stores are **automatically persisted**, **type-safe**, and **optimized** with selectors.

---

Need help? Check the inline TypeScript types and JSDoc comments in each store file!
