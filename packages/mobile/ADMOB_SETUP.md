# AdMob Test Setup Guide

## Current Status

✅ **Test AdMob IDs Configured**
- The app is now configured with Google's official test ad unit IDs
- Ads are enabled and ready for testing
- No revenue will be generated (test ads only)

## Test Ad Unit IDs

### Android
- **App ID**: `ca-app-pub-3940256099942544~3347511713`
- **Rewarded Ad**: `ca-app-pub-3940256099942544/5224354917`
- **Interstitial Ad**: `ca-app-pub-3940256099942544/1033173712`
- **Banner Ad**: `ca-app-pub-3940256099942544/6300978111`

### iOS
- **App ID**: `ca-app-pub-3940256099942544~1458002511`
- **Rewarded Ad**: `ca-app-pub-3940256099942544/1712485313`
- **Interstitial Ad**: `ca-app-pub-3940256099942544/4411468910`
- **Banner Ad**: `ca-app-pub-3940256099942544/2934735716`

## Files Modified

1. **`src/services/ads/adsService.ts`**
   - Added test ad unit IDs
   - Implemented platform-specific ad unit selection
   - Added console logging for ad events

2. **`app.json`**
   - Added `react-native-google-mobile-ads` plugin
   - Configured test App IDs for Android and iOS

3. **`src/store/slices/adsSlice.ts`**
   - Already configured (no changes needed)
   - `adsEnabled: true` by default

## Testing Ads

### Rewarded Video Ads
```typescript
import { useDispatch } from 'react-redux';
import { showRewardedAd } from '@/store/slices/adsSlice';

const dispatch = useDispatch();

// Show rewarded ad
dispatch(showRewardedAd());
```

### Interstitial Ads
```typescript
import { useDispatch } from 'react-redux';
import { showInterstitialAd } from '@/store/slices/adsSlice';

const dispatch = useDispatch();

// Show interstitial ad
dispatch(showInterstitialAd());
```

### Check Ad Status
```typescript
import { useSelector } from 'react-redux';

const { rewardedAdReady, interstitialAdReady, adsEnabled } = useSelector(
  (state) => state.ads
);

console.log('Rewarded ad ready:', rewardedAdReady);
console.log('Interstitial ad ready:', interstitialAdReady);
console.log('Ads enabled:', adsEnabled);
```

## Current Implementation

Since `react-native-google-mobile-ads` is having npm installation issues, the current implementation uses **simulated ads** with the correct test IDs configured.

### What Works Now:
- ✅ Ads initialization
- ✅ Simulated ad loading
- ✅ Simulated ad display
- ✅ Test ad unit IDs configured
- ✅ Platform detection (iOS/Android)
- ✅ Redux state management
- ✅ Backend integration for ad rewards

### What's Simulated:
- Ad loading (500ms delay)
- Ad display (console logs)
- Ad rewards (mocked)

## Installing Real AdMob (When npm is fixed)

Once the npm issue is resolved:

```bash
cd packages/mobile
npm install react-native-google-mobile-ads --save
```

Then update `adsService.ts`:

```typescript
import MobileAds, {
  RewardedAd,
  RewardedAdEventType,
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

class AdsService {
  private rewardedAd: RewardedAd | null = null;
  private interstitialAd: InterstitialAd | null = null;

  async initialize(): Promise<void> {
    await MobileAds().initialize();
    console.log('[AdsService] AdMob initialized');
  }

  async loadRewardedAd(): Promise<void> {
    const adUnitId = this.getRewardedAdUnitId();
    
    this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('[AdsService] Rewarded ad loaded');
      this.rewardedAdLoaded = true;
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log('[AdsService] User earned reward:', reward);
    });

    this.rewardedAd.load();
  }

  async showRewardedAd(callbacks?: AdEventCallbacks): Promise<boolean> {
    if (!this.rewardedAd || !this.rewardedAdLoaded) {
      return false;
    }

    this.rewardedAd.show();
    return true;
  }
}
```

## Moving to Production

### Step 1: Create AdMob Account
1. Go to https://admob.google.com/
2. Sign in with Google account
3. Create new app for Android and iOS

### Step 2: Get Your App IDs
1. In AdMob console, click "Apps"
2. Find your app and copy the App ID
3. Format: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`

### Step 3: Create Ad Units
For each platform, create:
- Rewarded Video Ad Unit
- Interstitial Ad Unit
- Banner Ad Unit (optional)

### Step 4: Update Configuration

**app.json:**
```json
{
  "plugins": [
    [
      "react-native-google-mobile-ads",
      {
        "androidAppId": "ca-app-pub-YOUR_ANDROID_APP_ID",
        "iosAppId": "ca-app-pub-YOUR_IOS_APP_ID"
      }
    ]
  ]
}
```

**adsService.ts:**
```typescript
const PRODUCTION_AD_UNITS = {
  ios: {
    rewarded: 'ca-app-pub-YOUR_IOS_REWARDED_ID',
    interstitial: 'ca-app-pub-YOUR_IOS_INTERSTITIAL_ID',
    banner: 'ca-app-pub-YOUR_IOS_BANNER_ID',
  },
  android: {
    rewarded: 'ca-app-pub-YOUR_ANDROID_REWARDED_ID',
    interstitial: 'ca-app-pub-YOUR_ANDROID_INTERSTITIAL_ID',
    banner: 'ca-app-pub-YOUR_ANDROID_BANNER_ID',
  },
};

const AD_UNITS = __DEV__ ? TEST_AD_UNITS : PRODUCTION_AD_UNITS;
```

### Step 5: Build Development Build
Expo Go doesn't support AdMob. You need a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --profile development --platform android

# Build for iOS
eas build --profile development --platform ios
```

### Step 6: Test on Device
1. Install development build on device
2. Test all ad types
3. Verify rewards are tracked
4. Check backend integration

## Troubleshooting

### Ads Not Showing
- Check if ads are initialized: `dispatch(initializeAds())`
- Check if ads are loaded: Check `rewardedAdReady` state
- Check console logs for errors
- Verify test IDs are correct

### "Cannot read property of null"
- This error is from npm, not the ads system
- It's related to the npm cache
- Ads simulation will still work

### No Rewards Being Credited
- Check backend logs
- Verify wallet API is working
- Check Redux state: `state.ads.lastRewardAmount`

## Console Output

When ads are working, you should see:
```
[AdsService] Initializing with test AdMob IDs...
[AdsService] Platform: android
[AdsService] Test Rewarded ID: ca-app-pub-3940256099942544/5224354917
[AdsService] Test Interstitial ID: ca-app-pub-3940256099942544/1033173712
[AdsService] Loading test rewarded ad: ca-app-pub-3940256099942544/5224354917
[AdsService] Test rewarded ad loaded
[AdsService] Loading test interstitial ad: ca-app-pub-3940256099942544/1033173712
[AdsService] Test interstitial ad loaded
[AdsService] Ads preloaded (mock)
```

## Resources

- [AdMob Official Docs](https://admob.google.com/home/)
- [react-native-google-mobile-ads Docs](https://docs.page/invertase/react-native-google-mobile-ads)
- [Test Ad Units](https://developers.google.com/admob/android/test-ads)
- [AdMob Policies](https://support.google.com/admob/answer/6128543)

## Important Notes

⚠️ **Never click your own ads in production!** This violates AdMob policies and can get your account banned.

✅ **Always use test IDs during development**

✅ **Use development builds** - Expo Go doesn't support AdMob

✅ **Test on real devices** - Simulators/emulators may have issues

---

**Current Status**: Test IDs configured, simulated ads working, ready for real AdMob integration once npm is fixed.
