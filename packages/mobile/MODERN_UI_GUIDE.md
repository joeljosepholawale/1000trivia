# Modern UI Design System - Implementation Guide

## Overview
This document provides a comprehensive guide to the modern UI redesign of the 1000Ravier mobile app. The redesign features a cohesive design system with reusable components, smooth animations, and a polished user experience.

## Design System

### Theme
Location: `src/styles/theme.ts`

The theme provides:
- **Colors**: Primary, secondary, success, warning, error, info palettes (100-900 shades)
- **Typography**: Font sizes, weights, line heights
- **Spacing**: Consistent spacing scale (1-20)
- **Border Radius**: xs, sm, md, lg, xl, full
- **Shadows**: sm, md, lg, xl

### Color Palette
```typescript
primary: Blue (#3B82F6 variants)
secondary: Gold/Yellow (#F59E0B variants)
success: Green (#10B981 variants)
warning: Orange (#F97316 variants)
error: Red (#EF4444 variants)
info: Cyan (#06B6D4 variants)
```

## Reusable Components

### 1. Card (`src/components/common/Card.tsx`)
Flexible container component with multiple variants.

**Props:**
- `variant`: 'filled' | 'outlined' | 'elevated'
- `gradient`: boolean
- `gradientColors`: [string, string]
- `padding`: 0-10 (maps to theme spacing)

**Usage:**
```tsx
<Card variant="elevated" padding={6}>
  <Text>Content</Text>
</Card>

<Card gradient gradientColors={[primary[400], primary[600]]}>
  <Text>Gradient Card</Text>
</Card>
```

### 2. Button (`src/components/common/Button.tsx`)
Primary button component with variants and states.

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean
- `loading`: boolean
- `icon`: string (MaterialIcons name)

**Usage:**
```tsx
<Button 
  variant="primary" 
  size="lg" 
  icon="play-arrow"
  onPress={handlePress}
>
  Play Now
</Button>
```

### 3. Badge (`src/components/common/Badge.tsx`)
Small status/label component.

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
- `size`: 'sm' | 'md' | 'lg'

**Usage:**
```tsx
<Badge variant="success" size="sm">
  Active
</Badge>
```

### 4. ProgressBar (`src/components/common/ProgressBar.tsx`)
Animated progress indicator.

**Props:**
- `progress`: number (0-100)
- `color`: string
- `backgroundColor`: string
- `height`: number

**Usage:**
```tsx
<ProgressBar 
  progress={75} 
  color={theme.colors.primary[500]}
  height={8}
/>
```

### 5. StatsCard (`src/components/common/StatsCard.tsx`)
Display statistics with icon.

**Props:**
- `label`: string
- `value`: string | number
- `icon`: string (MaterialIcons name)
- `variant`: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'

**Usage:**
```tsx
<StatsCard
  label="Games Played"
  value={142}
  icon="sports-esports"
  variant="primary"
/>
```

### 6. AnimatedNumber (`src/components/common/AnimatedNumber.tsx`)
Smoothly animates number changes.

**Props:**
- `value`: number
- `duration`: number (ms)
- `style`: TextStyle

**Usage:**
```tsx
<AnimatedNumber 
  value={balance} 
  duration={1000}
  style={styles.balanceText}
/>
```

### 7. CountdownTimer (`src/components/common/CountdownTimer.tsx`)
Display countdown with visual feedback.

**Props:**
- `seconds`: number
- `size`: 'sm' | 'md' | 'lg'
- `color`: string

**Usage:**
```tsx
<CountdownTimer 
  seconds={30}
  size="md"
  color={theme.colors.primary[500]}
/>
```

## Modern Screens

### 1. ModernHomeScreen (`src/screens/home/ModernHomeScreen.tsx`)

**Features:**
- Animated welcome header with user info
- Balance card with gradient background
- Daily challenges section
- Game mode cards (Quick Play, Tournament, Practice)
- Recent activity feed
- Stats overview

**Props:**
```typescript
{
  user: UserInfo;
  balance: number;
  dailyChallenges: Challenge[];
  recentGames: GameHistory[];
  stats: UserStats;
  onNavigateToGame: (mode: string) => void;
  onClaimDailyReward: () => void;
  onNavigateToWallet: () => void;
}
```

### 2. ModernWalletScreen (`src/screens/wallet/ModernWalletScreen.tsx`)

**Features:**
- Animated balance card with streak indicator
- Quick actions (daily claim, watch ads, buy credits)
- Earned/spent statistics
- Transaction history grouped by date
- Pull-to-refresh

**Props:**
```typescript
{
  balance: number;
  stats: WalletStats;
  transactions: Transaction[];
  canClaimDaily: boolean;
  nextDailyClaimTime?: string;
  onClaimDaily: () => void;
  onWatchAd: () => void;
  onBuyCredits: () => void;
}
```

### 3. ModernCreditStoreScreen (`src/screens/store/ModernCreditStoreScreen.tsx`)

**Features:**
- Current balance header
- 2-column package grid with gradient icons
- Popular/Best Value badges
- Bonus indicators
- Purchase buttons with loading states
- Payment methods display
- Features section

**Props:**
```typescript
{
  packages: CreditPackage[];
  currentBalance: number;
  onPurchase: (packageId: string) => void;
  onClose: () => void;
}
```

### 4. ModernLeaderboardScreen (`src/screens/leaderboard/ModernLeaderboardScreen.tsx`)

**Features:**
- Period selector (daily/weekly/monthly/all-time)
- Top 3 podium with gradient avatars
- Rank badges (gold/silver/bronze)
- Trend indicators (up/down)
- Current user position highlight
- User stats (games, win rate)

**Props:**
```typescript
{
  entries: LeaderboardEntry[];
  currentUser?: LeaderboardEntry;
  period: LeaderboardPeriod;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  onRefresh?: () => void;
  onUserPress?: (userId: string) => void;
}
```

### 5. ModernProfileScreen (`src/screens/profile/ModernProfileScreen.tsx`)

**Features:**
- Gradient profile header with avatar & level
- XP progress bar
- Stats grid with detailed breakdowns
- Horizontal scrolling achievements
- Progress tracking for locked achievements
- Settings menu
- Logout functionality

**Props:**
```typescript
{
  profile: UserProfile;
  stats: UserStats;
  achievements: Achievement[];
  onEditProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onAchievementPress?: (achievement: Achievement) => void;
}
```

### 6. ModernGameModeScreen (`src/screens/game/ModernGameModeScreen.tsx`)

**Features:**
- Current balance display
- Detailed mode cards with gradients
- Entry fee and prize pool display
- Player count and duration
- Difficulty indicators
- Availability checks
- Popular/New badges

**Props:**
```typescript
{
  modes: GameMode[];
  userBalance: number;
  onModeSelect: (modeId: string) => void;
  onBack: () => void;
}
```

## Animation Patterns

### Entrance Animations
```typescript
const fadeAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 600,
    useNativeDriver: true,
  }).start();
}, []);
```

### Spring Animations
```typescript
Animated.spring(scaleAnim, {
  toValue: 1,
  friction: 8,
  tension: 40,
  useNativeDriver: true,
}).start();
```

### Staggered Animations
```typescript
Animated.stagger(
  100,
  items.map((_, index) =>
    Animated.timing(itemAnims[index], {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    })
  )
).start();
```

## Best Practices

### 1. Consistent Spacing
Always use theme spacing values:
```typescript
marginBottom: theme.spacing[6]  // Good
marginBottom: 24                // Avoid
```

### 2. Color Usage
Use theme colors with appropriate shades:
```typescript
color: theme.colors.primary[500]  // Good
color: '#3B82F6'                  // Avoid
```

### 3. Typography
Use theme typography values:
```typescript
fontSize: theme.typography.fontSize.xl
fontWeight: theme.typography.fontWeight.bold
```

### 4. Shadows
Apply shadows from theme:
```typescript
...theme.shadows.md
```

### 5. Border Radius
Use theme border radius:
```typescript
borderRadius: theme.borderRadius.lg
```

## Responsive Design

### Screen Dimensions
```typescript
import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');
```

### Flexible Layouts
```typescript
// 2-column grid
const cardWidth = (width - theme.spacing[6] * 3) / 2;
```

## Performance Optimization

### 1. Use Native Driver
Always enable for transform and opacity animations:
```typescript
useNativeDriver: true
```

### 2. Memoization
Memoize expensive computations:
```typescript
const formattedValue = useMemo(
  () => value.toLocaleString(),
  [value]
);
```

### 3. Avoid Inline Functions
Extract callbacks:
```typescript
// Good
const handlePress = useCallback(() => {
  // logic
}, [dependencies]);

// Avoid
onPress={() => doSomething()}
```

## Localization

All screens use German (de-DE) localization:
```typescript
new Date(date).toLocaleDateString('de-DE', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})
```

## Accessibility

### Touch Targets
Minimum 44x44 points for interactive elements:
```typescript
minWidth: 44,
minHeight: 44,
```

### Opacity Feedback
Provide visual feedback on touch:
```typescript
<TouchableOpacity activeOpacity={0.8}>
```

### Disabled States
Clear visual indication for disabled elements:
```typescript
disabled={!isAvailable}
style={[styles.button, !isAvailable && styles.buttonDisabled]}
```

## Integration Example

```tsx
import React from 'react';
import { ModernHomeScreen } from '@/screens/modern';

export const HomeContainer = () => {
  const user = useUser();
  const balance = useBalance();
  
  return (
    <ModernHomeScreen
      user={user}
      balance={balance}
      dailyChallenges={challenges}
      recentGames={games}
      stats={stats}
      onNavigateToGame={handleNavigateToGame}
      onClaimDailyReward={handleClaimDaily}
      onNavigateToWallet={handleNavigateToWallet}
    />
  );
};
```

## Migration Guide

### From Old Screens to Modern Screens

1. **Import the modern screen:**
```typescript
import { ModernHomeScreen } from '@/screens/modern';
```

2. **Update navigation:**
```typescript
navigation.navigate('ModernHome', { ...params });
```

3. **Adapt data structures:**
Ensure your data matches the modern screen interfaces.

4. **Test thoroughly:**
- Animations
- Touch interactions
- Edge cases (empty states, errors)
- Different screen sizes

## Summary

The modern UI redesign provides:
✅ Consistent design system
✅ Reusable components
✅ Smooth animations
✅ Better UX patterns
✅ Improved accessibility
✅ Type safety
✅ Performance optimization
✅ Easy maintenance

All components and screens follow React Native and TypeScript best practices, ensuring a maintainable and scalable codebase.
