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

const development: Config = {
  api: {
    baseUrl: 'http://192.168.1.197:3000/api',
    timeout: 10000,
  },
  stripe: {
    publishableKey: 'pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE',
  },
  ads: {
    appId: Platform.select({
      ios: 'ca-app-pub-3940256099942544~1458002511', // Test App ID
      android: 'ca-app-pub-3940256099942544~3347511713', // Test App ID
    })!,
    rewardedAdUnitId: Platform.select({
      ios: 'ca-app-pub-3940256099942544/1712485313', // Test Rewarded Ad Unit ID
      android: 'ca-app-pub-3940256099942544/5224354917', // Test Rewarded Ad Unit ID
    })!,
    bannerAdUnitId: Platform.select({
      ios: 'ca-app-pub-3940256099942544/2934735716', // Test Banner Ad Unit ID
      android: 'ca-app-pub-3940256099942544/6300978111', // Test Banner Ad Unit ID
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
    baseUrl: 'https://staging-api.1000ravier.com/api',
    timeout: 15000,
  },
  app: {
    ...development.app,
    environment: 'staging',
  },
};

const production: Config = {
  ...development,
  api: {
    baseUrl: 'https://one000trivia.onrender.com/api',
    timeout: 60000, // 60 seconds for Render free tier cold starts
  },
  stripe: {
    publishableKey: 'pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE',
  },
  ads: {
    appId: Platform.select({
      ios: 'YOUR_IOS_APP_ID_HERE',
      android: 'YOUR_ANDROID_APP_ID_HERE',
    })!,
    rewardedAdUnitId: Platform.select({
      ios: 'YOUR_IOS_REWARDED_AD_UNIT_ID_HERE',
      android: 'YOUR_ANDROID_REWARDED_AD_UNIT_ID_HERE',
    })!,
    bannerAdUnitId: Platform.select({
      ios: 'YOUR_IOS_BANNER_AD_UNIT_ID_HERE',
      android: 'YOUR_ANDROID_BANNER_AD_UNIT_ID_HERE',
    })!,
  },
  app: {
    ...development.app,
    environment: 'production',
  },
};

const getConfig = (): Config => {
  if (!isDevelopment) {
    // In production, you might want to determine this based on build configuration
    // For now, defaulting to production config for release builds
    return production;
  }
  
  return development;
};

export const config = getConfig();