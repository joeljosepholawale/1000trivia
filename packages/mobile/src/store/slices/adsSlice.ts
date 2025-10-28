import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {adsService} from '../../services/ads/adsService';

interface AdsState {
  // Ad availability
  rewardedAdReady: boolean;
  interstitialAdReady: boolean;
  
  // Loading states
  loadingRewardedAd: boolean;
  loadingInterstitialAd: boolean;
  claimingReward: boolean;
  
  // Error states
  rewardedAdError: string | null;
  interstitialAdError: string | null;
  claimError: string | null;
  
  // Reward tracking
  lastRewardAmount: number;
  totalAdRewards: number;
  
  // Ad show tracking
  adsWatchedToday: number;
  lastAdWatchedDate: string | null;
  
  // Settings
  adsEnabled: boolean;
}

const initialState: AdsState = {
  rewardedAdReady: false,
  interstitialAdReady: false,
  
  loadingRewardedAd: false,
  loadingInterstitialAd: false,
  claimingReward: false,
  
  rewardedAdError: null,
  interstitialAdError: null,
  claimError: null,
  
  lastRewardAmount: 0,
  totalAdRewards: 0,
  
  adsWatchedToday: 0,
  lastAdWatchedDate: null,
  
  adsEnabled: true,
};

// Async thunks
export const initializeAds = createAsyncThunk(
  'ads/initialize',
  async (_, {rejectWithValue}) => {
    try {
      await adsService.initialize();
      await adsService.preloadAds();
      
      return {
        rewardedAdReady: adsService.isRewardedAdReady(),
        interstitialAdReady: adsService.isInterstitialAdReady(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize ads');
    }
  }
);

export const loadRewardedAd = createAsyncThunk(
  'ads/loadRewardedAd',
  async (_, {rejectWithValue}) => {
    try {
      await adsService.loadRewardedAd();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load rewarded ad');
    }
  }
);

export const loadInterstitialAd = createAsyncThunk(
  'ads/loadInterstitialAd',
  async (_, {rejectWithValue}) => {
    try {
      await adsService.loadInterstitialAd();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load interstitial ad');
    }
  }
);

export const showRewardedAd = createAsyncThunk(
  'ads/showRewardedAd',
  async (_, {rejectWithValue, dispatch}) => {
    try {
      const success = await adsService.showRewardedAd({
        onRewardEarned: async (reward) => {
          console.log('Reward earned:', reward);
          // Claim the reward from backend
          dispatch(claimAdReward('rewarded_video'));
        },
        onAdClosed: () => {
          console.log('Rewarded ad closed');
          // Preload next ad
          dispatch(loadRewardedAd());
        },
        onAdFailedToLoad: (error) => {
          console.error('Rewarded ad failed to load:', error);
        }
      });
      
      if (!success) {
        throw new Error('Failed to show rewarded ad');
      }
      
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to show rewarded ad');
    }
  }
);

export const showInterstitialAd = createAsyncThunk(
  'ads/showInterstitialAd',
  async (_, {rejectWithValue, dispatch}) => {
    try {
      const success = await adsService.showInterstitialAd({
        onAdClosed: () => {
          console.log('Interstitial ad closed');
          // Preload next ad
          dispatch(loadInterstitialAd());
        },
        onAdFailedToLoad: (error) => {
          console.error('Interstitial ad failed to load:', error);
        }
      });
      
      if (!success) {
        throw new Error('Failed to show interstitial ad');
      }
      
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to show interstitial ad');
    }
  }
);

export const claimAdReward = createAsyncThunk(
  'ads/claimAdReward',
  async (adType: 'rewarded_video' | 'interstitial', {rejectWithValue}) => {
    try {
      const result = await adsService.claimAdReward(adType);
      
      if (!result.success) {
        throw new Error('Failed to claim ad reward');
      }
      
      return {
        credits: result.credits,
        adType,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to claim ad reward');
    }
  }
);

const adsSlice = createSlice({
  name: 'ads',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.rewardedAdError = null;
      state.interstitialAdError = null;
      state.claimError = null;
    },
    
    setAdsEnabled: (state, action: PayloadAction<boolean>) => {
      state.adsEnabled = action.payload;
    },
    
    updateAdAvailability: (state) => {
      state.rewardedAdReady = adsService.isRewardedAdReady();
      state.interstitialAdReady = adsService.isInterstitialAdReady();
    },
    
    incrementAdsWatched: (state) => {
      const today = new Date().toDateString();
      
      if (state.lastAdWatchedDate !== today) {
        state.adsWatchedToday = 1;
        state.lastAdWatchedDate = today;
      } else {
        state.adsWatchedToday += 1;
      }
    },
    
    resetDailyAdCount: (state) => {
      const today = new Date().toDateString();
      if (state.lastAdWatchedDate !== today) {
        state.adsWatchedToday = 0;
        state.lastAdWatchedDate = today;
      }
    },
  },
  extraReducers: (builder) => {
    // Initialize ads
    builder
      .addCase(initializeAds.pending, (state) => {
        state.loadingRewardedAd = true;
        state.loadingInterstitialAd = true;
        state.rewardedAdError = null;
        state.interstitialAdError = null;
      })
      .addCase(initializeAds.fulfilled, (state, action) => {
        state.loadingRewardedAd = false;
        state.loadingInterstitialAd = false;
        state.rewardedAdReady = action.payload.rewardedAdReady;
        state.interstitialAdReady = action.payload.interstitialAdReady;
      })
      .addCase(initializeAds.rejected, (state, action) => {
        state.loadingRewardedAd = false;
        state.loadingInterstitialAd = false;
        state.rewardedAdError = action.payload as string;
        state.interstitialAdError = action.payload as string;
      });

    // Load rewarded ad
    builder
      .addCase(loadRewardedAd.pending, (state) => {
        state.loadingRewardedAd = true;
        state.rewardedAdError = null;
      })
      .addCase(loadRewardedAd.fulfilled, (state) => {
        state.loadingRewardedAd = false;
        state.rewardedAdReady = true;
      })
      .addCase(loadRewardedAd.rejected, (state, action) => {
        state.loadingRewardedAd = false;
        state.rewardedAdReady = false;
        state.rewardedAdError = action.payload as string;
      });

    // Load interstitial ad
    builder
      .addCase(loadInterstitialAd.pending, (state) => {
        state.loadingInterstitialAd = true;
        state.interstitialAdError = null;
      })
      .addCase(loadInterstitialAd.fulfilled, (state) => {
        state.loadingInterstitialAd = false;
        state.interstitialAdReady = true;
      })
      .addCase(loadInterstitialAd.rejected, (state, action) => {
        state.loadingInterstitialAd = false;
        state.interstitialAdReady = false;
        state.interstitialAdError = action.payload as string;
      });

    // Show rewarded ad
    builder
      .addCase(showRewardedAd.pending, (state) => {
        state.rewardedAdError = null;
      })
      .addCase(showRewardedAd.fulfilled, (state) => {
        state.rewardedAdReady = false; // Ad consumed
        adsSlice.caseReducers.incrementAdsWatched(state);
      })
      .addCase(showRewardedAd.rejected, (state, action) => {
        state.rewardedAdError = action.payload as string;
      });

    // Show interstitial ad
    builder
      .addCase(showInterstitialAd.pending, (state) => {
        state.interstitialAdError = null;
      })
      .addCase(showInterstitialAd.fulfilled, (state) => {
        state.interstitialAdReady = false; // Ad consumed
        adsSlice.caseReducers.incrementAdsWatched(state);
      })
      .addCase(showInterstitialAd.rejected, (state, action) => {
        state.interstitialAdError = action.payload as string;
      });

    // Claim ad reward
    builder
      .addCase(claimAdReward.pending, (state) => {
        state.claimingReward = true;
        state.claimError = null;
      })
      .addCase(claimAdReward.fulfilled, (state, action) => {
        state.claimingReward = false;
        state.lastRewardAmount = action.payload.credits;
        state.totalAdRewards += action.payload.credits;
      })
      .addCase(claimAdReward.rejected, (state, action) => {
        state.claimingReward = false;
        state.claimError = action.payload as string;
      });
  },
});

export const {
  clearErrors,
  setAdsEnabled,
  updateAdAvailability,
  incrementAdsWatched,
  resetDailyAdCount,
} = adsSlice.actions;

export default adsSlice.reducer;