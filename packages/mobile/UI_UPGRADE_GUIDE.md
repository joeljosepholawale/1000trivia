# Mobile App UI/UX Upgrade Guide

## Overview
Complete UI overhaul with modern design, bold WhatsApp-style navigation, improved components, and animated splash screen.

## Installation Required

Install the missing dependency:

```bash
cd packages/mobile
npx expo install expo-linear-gradient
```

## What's New

### 1. **Animated Splash Screen** ✅
- Location: `src/components/SplashScreen.tsx`
- Features: Gradient background, animated logo, loading bar
- Integrated in `App.tsx` with 2.5s display time

### 2. **Bold WhatsApp-Style Navigation** ✅
- Updated: `src/navigation/MainNavigator.tsx`
- Features:
  - Larger icons when active (28px vs 24px)
  - Bold font weight (700)
  - Enhanced shadows and elevation
  - No top border
  - Increased height (70px)

### 3. **Reusable UI Components** ✅

#### Input Component (`src/components/common/Input.tsx`)
- Modern design with focus states
- Built-in error handling
- Icon support (left icon)
- Password visibility toggle
- Validation states

#### Button Component (`src/components/common/Button.tsx`)
- 4 variants: primary, secondary, outline, ghost
- 3 sizes: small, medium, large
- Gradient support
- Icon support
- Loading state

#### Card Component (`src/components/common/Card.tsx`)
- Elevated shadows
- Gradient background option
- Touchable option
- Consistent spacing

### 4. **Improved Screens** ✅

#### Home Screen (`src/screens/home/ImprovedHomeScreen.tsx`)
- Gradient header with balance card
- Featured game card with gradient
- Quick actions grid (4 items)
- Recent winners with medal badges
- Modern card designs

#### Login Screen (`src/screens/auth/ImprovedLoginScreen.tsx`)
- Gradient header with logo
- New Input components
- Social login buttons (Google, Facebook)
- Form validation with error states
- Better visual hierarchy

#### Register Screen (`src/screens/auth/ImprovedRegisterScreen.tsx`)
- Step-by-step validation
- Phone number input
- Terms & conditions notice
- Social signup options
- Password confirmation

## How to Use New Components

### Using Input Component
```tsx
import {Input} from '@/components/common/Input';

<Input
  label="Email Address"
  value={email}
  onChangeText={setEmail}
  placeholder="your.email@example.com"
  icon="email"
  error={emailError}
  keyboardType="email-address"
/>

<Input
  label="Password"
  value={password}
  onChangeText={setPassword}
  isPassword
  icon="lock"
  error={passwordError}
/>
```

### Using Button Component
```tsx
import {Button} from '@/components/common/Button';

<Button
  title="Sign In"
  onPress={handleLogin}
  gradient
  size="large"
  icon="login"
  loading={isLoading}
/>

<Button
  title="Cancel"
  onPress={handleCancel}
  variant="outline"
  size="medium"
/>
```

### Using Card Component
```tsx
import {Card} from '@/components/common/Card';

<Card gradient elevated onPress={handlePress}>
  <Text>Card Content</Text>
</Card>
```

## Updating Existing Screens

### Step 1: Replace old screens with improved versions

In your navigators, update imports:

```tsx
// For HomeNavigator.tsx
import {ImprovedHomeScreen as HomeScreen} from '@/screens/home/ImprovedHomeScreen';

// For AuthNavigator.tsx
import {ImprovedLoginScreen as LoginScreen} from '@/screens/auth/ImprovedLoginScreen';
import {ImprovedRegisterScreen as RegisterScreen} from '@/screens/auth/ImprovedRegisterScreen';
```

### Step 2: Or gradually migrate components

You can keep both versions and switch gradually:
1. Test new screens
2. Update one navigator at a time
3. Remove old screens when confident

## Design System

### Colors
All colors are defined in `src/styles/colors.ts`:
- Primary: #2E7D32 (Green)
- Secondary: #FF9800 (Orange)
- Accent: #E91E63 (Pink)
- Success: #4CAF50
- Error: #F44336
- Warning: #FF9800
- Info: #2196F3

### Typography
- **Bold headings**: 700-800 weight
- **Body text**: 500-600 weight
- **Labels**: 700 weight
- **Letter spacing**: 0.3-0.5px for headings

### Spacing
- Cards: 16px border radius, 20px padding
- Buttons: 12px border radius
- Form elements: 12px border radius, 56px height
- Section spacing: 24px margins

### Shadows & Elevation
- Small: elevation 2-3, shadowOpacity 0.05
- Medium: elevation 4-5, shadowOpacity 0.08
- Large: elevation 8-12, shadowOpacity 0.15-0.3

## Assets & Icons

All icons use **Material Icons** from `@expo/vector-icons`:
- Home: 'home'
- Play: 'sports-esports', 'play-circle-filled'
- Wallet: 'account-balance-wallet'
- Rankings: 'leaderboard'
- Profile: 'person'
- Trophy: 'emoji-events'
- Gift: 'card-giftcard'
- And many more...

## Next Steps

### To complete the UI upgrade:

1. **Install dependency**:
   ```bash
   npx expo install expo-linear-gradient
   ```

2. **Update navigators** to use new screens

3. **Create more improved screens**:
   - GameModeSelectionScreen
   - WalletScreen
   - LeaderboardScreen
   - ProfileScreen
   - GameplayScreen

4. **Test on device**:
   ```bash
   npm run start
   # Then press 'i' for iOS or 'a' for Android
   ```

5. **Customize further**:
   - Add your own brand colors to `colors.ts`
   - Replace placeholder icons with custom assets
   - Add more animations using `react-native-reanimated`

## Troubleshooting

### If you see "Cannot find module 'expo-linear-gradient'"
Run: `npx expo install expo-linear-gradient`

### If styles look broken
Clear cache: `npm run start -- --clear`

### If navigation doesn't update
Make sure to update the navigator imports to use the new screens.

## Questions?
Check the individual component files for detailed prop documentation.
