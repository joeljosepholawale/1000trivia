import {Platform} from 'react-native';

export interface Config {
  api: {
    baseUrl: string;
    timeout: number;
  };
  stripe: {
    publishableKey: string;
  };
  ads: {
    appId: string;
    rewardedAdUnitId: string;
    bannerAdUnitId: string;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
}

const isDevelopment = __DEV__;

// Helper to validate required config values
const validateConfig = (config: Config): void => {
  const stripeyKey = config.stripe.publishableKey;
  const adsAppId = config.ads.appId;

  if (stripeyKey.includes('YOUR_')) {
    // Stripe key needs to be configured
  }

  if (adsAppId.includes('YOUR_')) {
    // Ad unit IDs need to be configured
  }
};

const development: Config = {
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://one000trivia.onrender.com/api',
    timeout: 60000, // Longer timeout for Render cold starts
  },
  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_TEST_KEY || 'pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE',
  },
  ads: {
    appId: Platform.select({
      ios: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || 'ca-app-pub-3940256099942544~1458002511', // Test App ID
      android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || 'ca-app-pub-3940256099942544~3347511713', // Test App ID
    })!,
    rewardedAdUnitId: Platform.select({
      ios: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID || 'ca-app-pub-3940256099942544/1712485313', // Test Rewarded Ad Unit ID
      android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917', // Test Rewarded Ad Unit ID
    })!,
    bannerAdUnitId: Platform.select({
      ios: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID || 'ca-app-pub-3940256099942544/2934735716', // Test Banner Ad Unit ID
      android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111', // Test Banner Ad Unit ID
    })!,
  },
  app: {
    name: '1000 Ravier',
    version: '1.0.0',
    environment: 'development',
  },
};

const staging: Config = {
  ...development,
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.1000ravier.com/api',
    timeout: 15000,
  },
  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_TEST_KEY || 'pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE',
  },
  app: {
    ...development.app,
    environment: 'staging',
  },
};

const production: Config = {
  ...development,
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://one000trivia.onrender.com/api',
    timeout: 60000, // 60 seconds for Render free tier cold starts
  },
  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_LIVE_KEY || 'pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE',
  },
  ads: {
    appId: Platform.select({
      ios: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || 'YOUR_IOS_APP_ID_HERE',
      android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || 'YOUR_ANDROID_APP_ID_HERE',
    })!,
    rewardedAdUnitId: Platform.select({
      ios: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID || 'YOUR_IOS_REWARDED_AD_UNIT_ID_HERE',
      android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID || 'YOUR_ANDROID_REWARDED_AD_UNIT_ID_HERE',
    })!,
    bannerAdUnitId: Platform.select({
      ios: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID || 'YOUR_IOS_BANNER_AD_UNIT_ID_HERE',
      android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID || 'YOUR_ANDROID_BANNER_AD_UNIT_ID_HERE',
    })!,
  },
  app: {
    ...development.app,
    environment: 'production',
  },
};

const getConfig = (): Config => {
  let selectedConfig: Config;

  if (!isDevelopment) {
    // In production, default to production config for release builds
    selectedConfig = production;
  } else {
    // In development, use development config
    selectedConfig = development;
  }

  // Validate config values
  validateConfig(selectedConfig);

  return selectedConfig;
};

export const config = getConfig();
