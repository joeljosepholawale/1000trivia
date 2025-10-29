# 🚀 Ad & Payment Integration Guide

This guide explains how to integrate the new ad and payment systems into your existing 1000 Ravier mobile app.

## 📋 What's Been Added

### 🎬 Ad Integration System
- **AdService** (`src/services/ads/adsService.ts`) - Core ad functionality
- **AdsSlice** (`src/store/slices/adsSlice.ts`) - Redux state management
- **Ad Components** (`src/components/ads/AdComponents.tsx`) - Reusable UI components
- **Enhanced Credit Store** (`src/screens/wallet/EnhancedCreditStoreScreen.tsx`)

### 💳 Payment Integration
- **Stripe Service** (`src/services/payments/stripeService.ts`) - Payment processing
- **Mock Payment Service** - For testing without real payments
- **Enhanced purchasing flow** in the credit store

### 🏆 Leaderboard System
- **Leaderboard API** (`src/services/api/leaderboard.ts`)
- **Leaderboard Navigator** (`src/navigation/LeaderboardNavigator.tsx`)
- **Four complete screens** for rankings, winners, stats, and history

### ⚙️ Configuration
- **App Config** (`src/config/app.ts`) - Centralized configuration
- **Dependencies Guide** (`dependencies.md`) - Required packages

## 🔧 Integration Steps

### 1. Install Dependencies
```bash
# Navigate to mobile package
cd packages/mobile

# Install ad dependencies
npx expo install expo-ads-admob

# Install payment dependencies
npm install @stripe/stripe-react-native

# For iOS (if applicable)
cd ios && pod install
```

### 2. Update App Configuration
Edit your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-ads-admob",
        {
          "androidAppId": "ca-app-pub-YOUR-ACTUAL-ID~ANDROID-APP-ID",
          "iosAppId": "ca-app-pub-YOUR-ACTUAL-ID~IOS-APP-ID"
        }
      ]
    ]
  }
}
```

### 3. Replace Test IDs with Production IDs
In `src/config/app.ts`, replace the test ad unit IDs and Stripe keys:

```typescript
// Replace these with your actual AdMob IDs
AD_UNITS: {
  rewarded: {
    ios: 'ca-app-pub-YOUR-ID/REWARDED-IOS',
    android: 'ca-app-pub-YOUR-ID/REWARDED-ANDROID',
  },
  // ... other ad units
},

// Replace with your actual Stripe keys
STRIPE: {
  PUBLISHABLE_KEY_TEST: 'pk_test_YOUR-TEST-KEY',
  PUBLISHABLE_KEY_LIVE: 'pk_live_YOUR-LIVE-KEY',
},
```

### 4. Update Navigation (Already Done)
The following files have been updated:
- ✅ `src/store/index.ts` - Added ads reducer
- ✅ `src/navigation/AppNavigator.tsx` - Added ads initialization
- ✅ `src/navigation/WalletNavigator.tsx` - Added enhanced credit store
- ✅ `src/screens/wallet/WalletScreen.tsx` - Updated to use enhanced store

### 5. Add Leaderboard to Main Navigator
Add the leaderboard navigator to your main tab navigator:

```typescript
// In src/navigation/MainNavigator.tsx (if not already present)
import {LeaderboardNavigator} from './LeaderboardNavigator';

// Add to tab screens
<Tab.Screen
  name="LeaderboardTab"
  component={LeaderboardNavigator}
  options={{tabBarLabel: 'Rankings'}}
/>
```

## 🎯 Key Features Ready to Use

### 📺 Ad Integration
- **Rewarded Videos**: Users watch ads for 25-50 credits
- **Banner Ads**: Passive monetization on various screens
- **Interstitial Ads**: Full-screen ads between game sessions
- **Ad Toggle**: Users can enable/disable ads in settings
- **Daily Limits**: Prevent ad spam with daily viewing limits

### 💰 Payment System
- **Mock Payments**: Test the flow without real transactions
- **Stripe Integration**: Real payment processing (when configured)
- **Credit Bundles**: 4 predefined bundles with bonus credits
- **Purchase Confirmation**: User-friendly purchase flow
- **Error Handling**: Comprehensive error states

### 🏆 Leaderboard Features
- **Current Rankings**: Live leaderboard with user positions
- **Winners Hall**: Historical winners with prizes
- **User Statistics**: Personal performance tracking
- **Period History**: Past competitions and results
- **Achievement System**: Progress tracking and rewards

### 🎮 Enhanced User Experience
- **Dual Credit Earning**: Purchase OR watch ads
- **Statistics Tracking**: Ad views, earnings, and performance
- **Beautiful UI**: Professional design with animations
- **Error States**: Graceful handling of network issues
- **Loading States**: Clear feedback during operations

## 🧪 Testing Your Integration

### Test Ad Functionality
1. **Enable ads** in the Enhanced Credit Store
2. **Watch a rewarded video** - should show test ad
3. **Check credits** are awarded after completion
4. **Toggle ads off/on** to test preferences
5. **View ad statistics** in the store

### Test Payment Flow
1. **Select a credit bundle** in the Enhanced Credit Store
2. **Tap Purchase** - should show confirmation dialog
3. **Confirm purchase** - mock service simulates payment
4. **Check success message** and credit addition
5. **Test error scenarios** (simulated 10% failure rate)

### Test Leaderboard
1. **Navigate to Rankings** tab
2. **Check all four screens** work properly
3. **Test pull-to-refresh** on all screens
4. **Verify error states** when offline

## 🚀 Next Steps for Production

### 1. AdMob Setup
- Create AdMob account and app
- Generate real ad unit IDs
- Set up ad mediation (optional)
- Configure ad targeting

### 2. Stripe Configuration
- Set up Stripe account
- Configure webhook endpoints
- Implement backend payment confirmation
- Test with real payment methods

### 3. Backend Integration
Implement these API endpoints:
- `POST /api/wallet/ad-reward` - Validate ad rewards
- `POST /api/wallet/payment-intent` - Create payment intents  
- `POST /api/wallet/confirm-payment` - Confirm payments
- `GET /api/leaderboard/*` - All leaderboard endpoints

### 4. Analytics & Monitoring
- Add analytics for ad views and payments
- Monitor conversion rates and user behavior
- Set up crash reporting for ad/payment errors
- Track revenue metrics

## 🎉 You're Ready!

Your app now has:
- ✅ **Complete ad integration** with rewarded videos and banners
- ✅ **Payment processing** with Stripe demo
- ✅ **Comprehensive leaderboards** with 4 screens
- ✅ **Enhanced credit store** combining ads and purchases
- ✅ **Professional UI/UX** with loading and error states
- ✅ **Redux state management** for all new features
- ✅ **Mock services** for testing without external dependencies

The system is designed to work seamlessly with your existing app architecture and can be easily switched from demo/mock mode to production with real ad units and payment keys.

## 📞 Support

If you encounter any issues during integration:
1. Check the console logs for error messages
2. Verify all dependencies are properly installed
3. Ensure ad unit IDs and API keys are correct
4. Test on both iOS and Android devices
5. Review the component props and Redux state

Happy coding! 🎮