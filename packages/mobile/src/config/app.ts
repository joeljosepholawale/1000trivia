import {Platform} from 'react-native';

// Environment configuration
export const IS_DEV = __DEV__;
export const IS_PROD = !__DEV__;

// API Configuration
export const API_CONFIG = {
  BASE_URL: IS_DEV 
    ? 'http://192.168.1.197:3000/api' 
    : 'https://api.1000ravier.com/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// Ad Configuration
export const ADS_CONFIG = {
  // AdMob App IDs (Test IDs - Replace with your actual IDs)
  APP_ID: {
    ios: 'ca-app-pub-3940256099942544~1458002511',
    android: 'ca-app-pub-3940256099942544~3347511713',
  },
  
  // Ad Unit IDs (Test IDs - Replace with your actual IDs)
  AD_UNITS: {
    rewarded: {
      ios: 'ca-app-pub-3940256099942544/1712485313',
      android: 'ca-app-pub-3940256099942544/5224354917',
    },
    banner: {
      ios: 'ca-app-pub-3940256099942544/2934735716',
      android: 'ca-app-pub-3940256099942544/6300978111',
    },
    interstitial: {
      ios: 'ca-app-pub-3940256099942544/4411468910',
      android: 'ca-app-pub-3940256099942544/1033173712',
    },
  },
  
  // Ad settings
  MAX_ADS_PER_DAY: 20,
  MIN_AD_INTERVAL_MINUTES: 3,
  REWARD_AMOUNTS: {
    rewarded_video: 1,
    interstitial: 1,
    survey: 1,
  },
};

// Payment Configuration
export const PAYMENT_CONFIG = {
  // Stripe Configuration
  STRIPE: {
    PUBLISHABLE_KEY_TEST: 'pk_test_...',  // Replace with your test key
    PUBLISHABLE_KEY_LIVE: 'pk_live_...',  // Replace with your live key
    MERCHANT_DISPLAY_NAME: '1000 Ravier',
  },
  
  // Currency settings
  CURRENCY: 'USD',
  CURRENCY_SYMBOL: '$',
  
  // Credit bundle configurations
  CREDIT_BUNDLES: [
    {
      id: 'bundle_small',
      name: 'Starter Pack',
      credits: 1000,
      price: 0.99,
      description: 'Perfect for new players',
      popular: false,
    },
    {
      id: 'bundle_medium',
      name: 'Popular Pack',
      credits: 5500,
      price: 4.99,
      description: 'Most popular choice - 10% bonus!',
      popular: true,
    },
    {
      id: 'bundle_large',
      name: 'Pro Pack',
      credits: 12000,
      price: 9.99,
      description: 'Great value - 20% bonus!',
      popular: false,
    },
    {
      id: 'bundle_mega',
      name: 'Champion Pack',
      credits: 27500,
      price: 19.99,
      description: 'Ultimate pack - 37% bonus!',
      popular: false,
    },
  ],
};

// Game Configuration
export const GAME_CONFIG = {
  // Game mode entry fees (in credits)
  ENTRY_FEES: {
    practice: 0,
    quick_play: 10,
    competitive: 50,
    tournament: 100,
  },
  
  // Daily rewards
  DAILY_REWARDS: {
    login_bonus: 100,
    first_game: 50,
    streak_multiplier: 1.1,
  },
  
  // Achievement rewards
  ACHIEVEMENT_REWARDS: {
    first_win: 500,
    win_streak_5: 250,
    win_streak_10: 500,
    perfect_game: 1000,
  },
};

// Feature Flags
export const FEATURES = {
  ADS_ENABLED: true,
  PAYMENTS_ENABLED: true,
  LEADERBOARDS_ENABLED: true,
  DAILY_CLAIMS_ENABLED: true,
  ACHIEVEMENTS_ENABLED: true,
  NOTIFICATIONS_ENABLED: true,
  ANALYTICS_ENABLED: IS_PROD,
};

// App Metadata
export const APP_INFO = {
  NAME: '1000 Ravier',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  BUNDLE_ID: Platform.select({
    ios: 'com.1000ravier.app',
    android: 'com.1000ravier.app',
  }),
};

// Social/Support Links
export const LINKS = {
  PRIVACY_POLICY: 'https://1000ravier.com/privacy',
  TERMS_OF_SERVICE: 'https://1000ravier.com/terms',
  SUPPORT_EMAIL: 'support@1000ravier.com',
  WEBSITE: 'https://1000ravier.com',
  DISCORD: 'https://discord.gg/1000ravier',
  TWITTER: 'https://twitter.com/1000ravier',
};

// Validation Rules
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    REGEX: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false,
  },
};

// Get current Stripe publishable key based on environment
export const getStripePublishableKey = (): string => {
  return IS_DEV 
    ? PAYMENT_CONFIG.STRIPE.PUBLISHABLE_KEY_TEST
    : PAYMENT_CONFIG.STRIPE.PUBLISHABLE_KEY_LIVE;
};

// Get AdMob app ID for current platform
export const getAdMobAppId = (): string => {
  return Platform.select({
    ios: ADS_CONFIG.APP_ID.ios,
    android: ADS_CONFIG.APP_ID.android,
  }) || ADS_CONFIG.APP_ID.android;
};