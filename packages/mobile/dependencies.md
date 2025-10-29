# Required Dependencies for Ads & Payments

## Install these packages to enable ads and payments functionality:

### Ad Integration (Google AdMob)
```bash
# For Expo managed workflow
npx expo install expo-ads-admob

# For React Native CLI (alternative)
npm install react-native-google-mobile-ads
npx react-native link react-native-google-mobile-ads  # Android only
cd ios && pod install  # iOS only
```

### Payment Integration (Stripe)
```bash
# Stripe React Native SDK
npm install @stripe/stripe-react-native

# For iOS
cd ios && pod install
```

### Additional Dependencies (if not already installed)
```bash
# Redux Toolkit (should already be installed)
npm install @reduxjs/toolkit react-redux redux-persist

# Async Storage (should already be installed)
npm install @react-native-async-storage/async-storage

# Vector Icons (should already be installed)
npm install @expo/vector-icons

# Navigation (should already be installed)
npm install @react-navigation/native @react-navigation/stack
```

## Configuration Steps:

### 1. AdMob Setup
1. Create a Google AdMob account at https://admob.google.com
2. Create a new app in AdMob console
3. Generate ad unit IDs for:
   - Rewarded Video
   - Banner Ads
   - Interstitial Ads
4. Replace test ad unit IDs in `src/config/app.ts`

### 2. Stripe Setup
1. Create a Stripe account at https://stripe.com
2. Get your publishable keys (test and live)
3. Set up webhook endpoints for payment confirmation
4. Replace placeholder keys in `src/config/app.ts`

### 3. App Configuration (app.json/app.config.js)
```json
{
  "expo": {
    "plugins": [
      [
        "expo-ads-admob",
        {
          "androidAppId": "ca-app-pub-3940256099942544~3347511713",
          "iosAppId": "ca-app-pub-3940256099942544~1458002511"
        }
      ]
    ]
  }
}
```

### 4. iOS Info.plist (if using React Native CLI)
```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-3940256099942544~1458002511</string>
```

### 5. Android Manifest (if using React Native CLI)
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-3940256099942544~3347511713"/>
```

## Testing:
- Use the provided test ad unit IDs for development
- Test payments with Stripe test cards
- Replace with production keys before app store submission

## Backend Integration:
The app expects these backend endpoints:
- `POST /api/wallet/ad-reward` - Validate and credit ad rewards
- `POST /api/wallet/payment-intent` - Create Stripe payment intent
- `POST /api/wallet/confirm-payment` - Confirm successful payment
- `GET /api/wallet/bundles` - Get available credit bundles

Refer to the backend documentation for implementation details.