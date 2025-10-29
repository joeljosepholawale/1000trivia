# 🔔 Push Notifications, Onboarding & Referrals Integration Guide

This guide covers the latest features added to the 1000 Ravier mobile app.

## 📋 New Features

### 🔔 Push Notifications
- Complete Expo Notifications integration
- Local and scheduled notifications
- Multiple notification types (achievements, challenges, reminders, etc.)
- Android notification channels
- Notification handling and routing

### 🎓 Onboarding Flow
- 5-screen interactive tutorial for new users
- Animated pagination with smooth transitions
- German language UI
- Persistence to show only once
- Skip functionality

### 🎁 Referral Program
- Unique referral code generation
- Code sharing via native Share API
- Referral code validation
- Reward tracking (credits, boosters, cosmetics)
- Complete UI screen with rewards history

## 🔧 Installation

The following dependency needs to be installed:

```bash
cd packages/mobile
npm install
```

**New Dependency Added:**
- `nanoid` (v5.0.0) - For generating unique referral codes

**Already Present:**
- `expo-notifications` (v0.32.12)
- `expo-device` (v8.0.9)

## 📱 Push Notifications

### File Structure
```
src/
├── services/
│   └── notifications.ts          # Core notification service
├── hooks/
│   └── useNotifications.ts       # React hook for app integration
└── App.tsx                        # Already integrated
```

### Features Included

#### Core Functions
```typescript
// Register for push notifications
await registerForPushNotifications();

// Send immediate notification
await sendLocalNotification({
  title: 'Hello!',
  body: 'This is a test notification',
  data: { type: 'test' }
});

// Schedule for later
await scheduleNotification({
  id: 'reminder',
  content: { title: 'Reminder', body: 'Time to play!' },
  trigger: { seconds: 60 }
});

// Cancel notifications
await cancelNotification('notification-id');
await cancelAllNotifications();
```

#### Pre-built Notification Helpers
```typescript
// Daily reminder (8 PM default)
await scheduleDailyReminder(20, 0);

// Achievement unlocked
await notifyAchievementUnlocked('First Win');

// Challenge completed
await notifyChallengeCompleted('Daily Quiz Master', 50);

// Daily claim available
await notifyDailyClaimAvailable();

// Friend challenge
await notifyFriendChallenge('Max Mustermann');

// Tournament starting
await notifyTournamentStarting('Weekend Cup', 15);

// Streak at risk
await notifyStreakAtRisk(7);

// New weekly challenges
await notifyNewWeeklyChallenges();

// Level up
await notifyLevelUp(5);

// Low credits warning
await notifyLowCredits(50);
```

#### Android Notification Channels
Automatically created:
- **default** - High importance, general notifications
- **achievements** - High importance with custom sound
- **challenges** - Default importance
- **reminders** - Low importance

### Integration in App.tsx

Already integrated! The `useNotifications` hook is called in `AppContent`:

```typescript
useNotifications({
  onTokenReceived: (token) => {
    console.log('Push token:', token.token);
    // TODO: Send to backend API
  },
  onNotificationTapped: (response) => {
    console.log('Notification data:', response.notification.request.content.data);
    // TODO: Navigate based on notification type
  },
});
```

### Backend Integration

Send push token to your backend:

```typescript
// Example API call
onTokenReceived: async (token) => {
  try {
    await fetch('https://your-api.com/users/push-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        token: token.token,
        platform: Platform.OS,
      }),
    });
  } catch (error) {
    console.error('Failed to send push token', error);
  }
},
```

### Notification Routing

Handle navigation when notifications are tapped:

```typescript
onNotificationTapped: (response) => {
  const data = response.notification.request.content.data;
  
  switch (data.type) {
    case 'achievement':
      navigation.navigate('Achievements');
      break;
    case 'challenge_completed':
      navigation.navigate('Challenges');
      break;
    case 'friend_challenge':
      navigation.navigate('FriendChallenge', { friendId: data.friend });
      break;
    case 'tournament_starting':
      navigation.navigate('Tournament', { tournamentId: data.tournament });
      break;
    case 'level_up':
      navigation.navigate('Profile');
      break;
    case 'daily_reminder':
      navigation.navigate('DailyChallenges');
      break;
    default:
      navigation.navigate('Home');
  }
},
```

### Configuration

Update Expo project ID in `src/services/notifications.ts` (line 66):

```typescript
const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-expo-project-id', // Get from app.json
});
```

## 🎓 Onboarding Flow

### File Structure
```
src/
└── screens/
    └── onboarding/
        └── OnboardingFlow.tsx    # Complete onboarding implementation
```

### Features

- **5 Interactive Screens**:
  1. Welcome to 1000Ravier
  2. How to Play
  3. Achievements System
  4. Daily Challenges
  5. Ready to Start

- **User Experience**:
  - Swipeable screens with gesture support
  - Animated pagination dots
  - Skip button (appears on first 4 screens)
  - Smooth transitions
  - Completion persistence

### Integration in Navigation

Add to your root navigator:

```typescript
// In AppNavigator.tsx or RootNavigator.tsx
import OnboardingFlow, { hasCompletedOnboarding } from '@/screens/onboarding/OnboardingFlow';

export function RootNavigator() {
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hasCompletedOnboarding().then((completed) => {
      setOnboardingDone(completed);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!onboardingDone) {
    return <OnboardingFlow onComplete={() => setOnboardingDone(true)} />;
  }

  return <MainAppNavigator />;
}
```

### Customization

Edit `ONBOARDING_SCREENS` array in `OnboardingFlow.tsx`:

```typescript
const ONBOARDING_SCREENS = [
  {
    id: 'welcome',
    title: 'Your Custom Title',
    description: 'Your custom description',
    emoji: '🎮', // or use image: require('./path/to/image.png')
  },
  // Add more screens...
];
```

### Testing

```typescript
import { resetOnboarding } from '@/screens/onboarding/OnboardingFlow';

// Reset to see onboarding again (development only)
await resetOnboarding();
```

## 🎁 Referral Program

### File Structure
```
src/
├── features/
│   └── referrals/
│       └── referral.ts            # Core referral logic
└── screens/
    └── referrals/
        └── ReferralScreen.tsx     # Complete UI screen
```

### Features

- **Code Generation**: Unique codes (e.g., RAV-ABC12345)
- **Code Sharing**: Native Share API integration
- **Code Validation**: Regex-based validation, duplicate checking
- **Rewards System**: Track credits, boosters, and cosmetics
- **One-time Use**: Users can only redeem one referral code
- **Self-referral Prevention**: Can't use own code

### Core Functions

```typescript
import {
  getOrCreateReferralCode,
  useReferralCode,
  getReferralStatus,
  grantReward,
  resetReferralData,
} from '@/features/referrals/referral';

// Get/generate user's referral code
const myCode = await getOrCreateReferralCode();
console.log('My code:', myCode); // e.g., "RAV-ABC12345"

// Use someone else's code
const result = await useReferralCode('RAV-XYZ98765');
if (result.ok) {
  console.log('Reward granted!');
} else {
  console.log('Error:', result.error);
}

// Check referral status
const status = await getReferralStatus();
console.log('My code:', status.myCode);
console.log('Used code:', status.usedCode);
console.log('Rewards:', status.rewards);

// Grant custom reward (called automatically on code use)
await grantReward({
  type: 'credits',
  amount: 100,
  description: 'Referral Bonus',
});
```

### Integration in Navigation

Add to tab navigator or main stack:

```typescript
import ReferralScreen from '@/screens/referrals/ReferralScreen';

// Tab Navigator
<Tab.Screen 
  name="Referrals" 
  component={ReferralScreen}
  options={{
    title: 'Freunde einladen',
    tabBarIcon: ({ color }) => <Icon name="people" color={color} />,
  }}
/>

// Or in Stack Navigator
<Stack.Screen 
  name="Referrals" 
  component={ReferralScreen}
  options={{ title: 'Freunde einladen' }}
/>
```

### Backend Integration

For production, integrate with your backend API:

```typescript
// In src/features/referrals/referral.ts

export async function getOrCreateReferralCode(): Promise<string> {
  try {
    const response = await api.get('/users/me/referral-code');
    return response.data.code;
  } catch (error) {
    console.error('Failed to fetch referral code', error);
    throw error;
  }
}

export async function useReferralCode(code: string): Promise<Result> {
  try {
    const response = await api.post('/referrals/redeem', { code });
    
    if (response.data.success) {
      // Backend handles reward distribution
      return { ok: true };
    }
    
    return { ok: false, error: response.data.message };
  } catch (error) {
    return { ok: false, error: 'Network error' };
  }
}
```

### Reward System

Track different reward types:

```typescript
interface ReferralReward {
  id: string;
  type: 'credits' | 'booster' | 'cosmetic';
  amount?: number;
  description: string;
  grantedAt: number;
}

// Grant rewards to both referrer and referee
await grantReward({ 
  type: 'credits', 
  amount: 100, 
  description: 'Invited Friend Bonus' 
});

await grantReward({ 
  type: 'booster', 
  description: '2x XP Booster (24h)' 
});

await grantReward({ 
  type: 'cosmetic', 
  description: 'Exclusive Card Back' 
});
```

### Customization

Change referral code prefix:

```typescript
// Default: RAV-XXXXXXXX
const code = await getOrCreateReferralCode('1000R');
// Result: 1000R-XXXXXXXX
```

Update reward amounts in `useReferralCode` function (line 70).

## 🎨 Theme Integration

All new components support the existing dark theme system:

```typescript
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, isDark, toggleTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>
        {isDark ? 'Dark Mode' : 'Light Mode'}
      </Text>
    </View>
  );
}
```

## ✅ Testing Checklist

### Push Notifications
- [ ] Install dependencies: `npm install`
- [ ] App requests notification permission on launch
- [ ] Push token is logged to console
- [ ] Test immediate notification: `notifyAchievementUnlocked('Test')`
- [ ] Test scheduled notification: `scheduleDailyReminder()`
- [ ] Tap notification and verify navigation
- [ ] Test on physical device (required for push)

### Onboarding
- [ ] Fresh install shows onboarding flow
- [ ] Can swipe between screens
- [ ] Skip button works
- [ ] Pagination dots animate correctly
- [ ] Completes and doesn't show again
- [ ] `resetOnboarding()` works in dev mode
- [ ] Works in both light and dark theme

### Referrals
- [ ] Screen displays user's referral code
- [ ] Share button opens native share dialog
- [ ] Can enter another user's code
- [ ] Validation rejects invalid codes
- [ ] Can't use own code
- [ ] Can't use a code twice
- [ ] Rewards appear in rewards section
- [ ] Works in both light and dark theme

## 🚀 Production Checklist

### Notifications
- [ ] Update Expo project ID in `notifications.ts`
- [ ] Implement backend endpoint for push token storage
- [ ] Set up push notification server (Firebase FCM, etc.)
- [ ] Test notification routing for all types
- [ ] Add analytics tracking for notification opens
- [ ] Configure notification sounds and icons
- [ ] Test on iOS and Android physical devices

### Onboarding
- [ ] Customize screens with actual content
- [ ] Add real images/graphics (replace emojis)
- [ ] Test with actual users for UX feedback
- [ ] Add analytics to track completion rate
- [ ] Add skip analytics to see where users skip

### Referrals
- [ ] Implement backend API for referral tracking
- [ ] Set up referral reward system in backend
- [ ] Track conversion rates (sign-ups from codes)
- [ ] Implement anti-fraud measures
- [ ] Add analytics for sharing behavior
- [ ] Consider tiered rewards for multiple referrals
- [ ] Add legal terms for referral program

## 📊 Analytics Recommendations

Track these events for insights:

```typescript
// Notifications
analytics.track('notification_permission_requested');
analytics.track('notification_permission_granted', { granted: true });
analytics.track('notification_received', { type: 'achievement' });
analytics.track('notification_tapped', { type: 'achievement' });

// Onboarding
analytics.track('onboarding_started');
analytics.track('onboarding_screen_viewed', { screen: 2 });
analytics.track('onboarding_skipped', { atScreen: 3 });
analytics.track('onboarding_completed');

// Referrals
analytics.track('referral_code_generated', { code: 'RAV-XXX' });
analytics.track('referral_code_shared', { method: 'whatsapp' });
analytics.track('referral_code_entered', { success: true });
analytics.track('referral_reward_granted', { amount: 100 });
```

## 🎉 Summary

Your app now includes:

✅ **Complete push notification system**
- Permission handling
- Local & scheduled notifications
- 10+ pre-built notification types
- Android notification channels
- Notification routing

✅ **Professional onboarding flow**
- 5 interactive screens
- Smooth animations
- Skip functionality
- Persistence

✅ **Full referral program**
- Unique code generation
- Native sharing
- Reward tracking
- Complete UI

✅ **Dark theme support**
- All components respect theme
- StatusBar adapts automatically

✅ **Ready for production**
- All TODOs marked for backend integration
- Testing checklist provided
- Analytics recommendations included

## 📞 Next Steps

1. Run `npm install` to install nanoid
2. Test all features in development
3. Implement backend APIs for production
4. Configure Expo project ID for notifications
5. Test on physical devices
6. Add analytics tracking
7. Submit to app stores with required permissions

Need help? Check the inline comments in the code for detailed explanations!
