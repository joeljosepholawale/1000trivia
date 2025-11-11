// AdMob Test Implementation
// Using test ad unit IDs from Google AdMob
import {Platform} from 'react-native';
import {walletAPI} from '../api/wallet';

// Google AdMob Test Ad Unit IDs
// These will not generate real revenue but can be used for testing
const TEST_AD_UNITS = {
  ios: {
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    banner: 'ca-app-pub-3940256099942544/2934735716',
  },
  android: {
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    banner: 'ca-app-pub-3940256099942544/6300978111',
  },
};

export interface AdReward {
  type: string;
  amount: number;
}

export interface AdEventCallbacks {
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: string) => void;
  onAdOpened?: () => void;
  onAdClosed?: () => void;
  onAdLeftApplication?: () => void;
  onRewardEarned?: (reward: AdReward) => void;
}

class AdsService {
  private isInitialized = false;
  private rewardedAdLoaded = false;
  private interstitialAdLoaded = false;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  getRewardedAdUnitId(): string {
    return Platform.OS === 'ios' 
      ? TEST_AD_UNITS.ios.rewarded 
      : TEST_AD_UNITS.android.rewarded;
  }

  getInterstitialAdUnitId(): string {
    return Platform.OS === 'ios'
      ? TEST_AD_UNITS.ios.interstitial
      : TEST_AD_UNITS.android.interstitial;
  }

  getBannerAdUnitId(): string {
    return Platform.OS === 'ios'
      ? TEST_AD_UNITS.ios.banner
      : TEST_AD_UNITS.android.banner;
  }

  async loadRewardedAd(): Promise<void> {
    // Simulate ad loading
    await new Promise(resolve => setTimeout(resolve, 500));
    this.rewardedAdLoaded = true;
  }

  async showRewardedAd(callbacks?: AdEventCallbacks): Promise<boolean> {
    
    setTimeout(() => {
      callbacks?.onAdOpened?.();
      
      setTimeout(() => {
        callbacks?.onRewardEarned?.({
          type: 'mock_reward',
          amount: 10,
        });
        
        callbacks?.onAdClosed?.();
        this.rewardedAdLoaded = false;
      }, 1000);
    }, 100);
    
    return true;
  }

  isRewardedAdReady(): boolean {
    return this.rewardedAdLoaded;
  }

  async loadInterstitialAd(): Promise<void> {
    // Simulate ad loading
    await new Promise(resolve => setTimeout(resolve, 500));
    this.interstitialAdLoaded = true;
  }

  async showInterstitialAd(callbacks?: AdEventCallbacks): Promise<boolean> {
    
    setTimeout(() => {
      callbacks?.onAdOpened?.();
      
      setTimeout(() => {
        callbacks?.onAdClosed?.();
        this.interstitialAdLoaded = false;
      }, 500);
    }, 100);
    
    return true;
  }

  isInterstitialAdReady(): boolean {
    return this.interstitialAdLoaded;
  }

  async claimAdReward(adType: 'rewarded_video' | 'interstitial'): Promise<{credits: number; success: boolean}> {
    try {
      const response = await walletAPI.claimAdReward(adType);
      
      if (response.success) {
        return {
          credits: response.data.creditsEarned,
          success: true,
        };
      } else {
        throw new Error(response.error || 'Failed to claim ad reward');
      }
    } catch (error) {
      return {credits: 0, success: false};
    }
  }

  getBannerAdProps() {
    return {
      adUnitID: this.getBannerAdUnitId(),
      size: 'banner' as const,
      requestOptions: {
        requestNonPersonalizedAdsOnly: false,
      },
    };
  }

  removeAllListeners(): void {
  }

  async preloadAds(): Promise<void> {
    await Promise.all([
      this.loadRewardedAd(),
      this.loadInterstitialAd(),
    ]);
  }
}

export const adsService = new AdsService();
export const getBannerAdProps = () => adsService.getBannerAdProps();
