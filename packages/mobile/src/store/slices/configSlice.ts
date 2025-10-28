import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {configAPI} from '@/services/api/config';
import type {AppConfig, GameMode, Period} from '@1000ravier/shared';

interface ConfigState {
  // App configuration
  appConfig: AppConfig | null;
  
  // Game modes and active periods
  gameModes: GameMode[];
  activePeriods: Period[];
  
  // Credits configuration
  creditsConfig: {
    dailyClaimAmount: number;
    adRewardAmount: number;
    bundles: Array<{
      id: string;
      credits: number;
      priceNgn: number;
      popular?: boolean;
    }>;
  } | null;
  
  // App settings
  settings: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    notificationsEnabled: boolean;
    language: string;
  };
  
  // UI state
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: ConfigState = {
  appConfig: null,
  gameModes: [],
  activePeriods: [],
  creditsConfig: null,
  settings: {
    soundEnabled: true,
    vibrationEnabled: true,
    notificationsEnabled: true,
    language: 'en',
  },
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const loadAppConfig = createAsyncThunk(
  'config/loadAppConfig',
  async (_, {rejectWithValue}) => {
    try {
      const response = await configAPI.getAppConfig();
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load app config');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const loadGameModes = createAsyncThunk(
  'config/loadGameModes',
  async (_, {rejectWithValue}) => {
    try {
      const response = await configAPI.getGameModes();
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load game modes');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const loadActivePeriods = createAsyncThunk(
  'config/loadActivePeriods',
  async (_, {rejectWithValue}) => {
    try {
      const response = await configAPI.getActivePeriods();
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load active periods');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const loadCreditsConfig = createAsyncThunk(
  'config/loadCreditsConfig',
  async (_, {rejectWithValue}) => {
    try {
      const response = await configAPI.getCreditsConfig();
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load credits config');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Load all essential configs at once
export const loadEssentialConfig = createAsyncThunk(
  'config/loadEssentialConfig',
  async (_, {dispatch, rejectWithValue}) => {
    try {
      // Load all essential configs in parallel
      const [appConfig, gameModes, activePeriods, creditsConfig] = await Promise.all([
        dispatch(loadAppConfig()).unwrap(),
        dispatch(loadGameModes()).unwrap(),
        dispatch(loadActivePeriods()).unwrap(),
        dispatch(loadCreditsConfig()).unwrap(),
      ]);

      return {
        appConfig,
        gameModes,
        activePeriods,
        creditsConfig,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load essential configuration');
    }
  }
);

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    updateSettings: (state, action: PayloadAction<Partial<typeof initialState.settings>>) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },
    
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.settings.soundEnabled = action.payload;
    },
    
    setVibrationEnabled: (state, action: PayloadAction<boolean>) => {
      state.settings.vibrationEnabled = action.payload;
    },
    
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.settings.notificationsEnabled = action.payload;
    },
    
    setLanguage: (state, action: PayloadAction<string>) => {
      state.settings.language = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Load app config
    builder
      .addCase(loadAppConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadAppConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appConfig = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(loadAppConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load game modes
    builder
      .addCase(loadGameModes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadGameModes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.gameModes = action.payload;
      })
      .addCase(loadGameModes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load active periods
    builder
      .addCase(loadActivePeriods.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadActivePeriods.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activePeriods = action.payload;
      })
      .addCase(loadActivePeriods.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load credits config
    builder
      .addCase(loadCreditsConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadCreditsConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.creditsConfig = action.payload;
      })
      .addCase(loadCreditsConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load essential config
    builder
      .addCase(loadEssentialConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadEssentialConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appConfig = action.payload.appConfig;
        state.gameModes = action.payload.gameModes;
        state.activePeriods = action.payload.activePeriods;
        state.creditsConfig = action.payload.creditsConfig;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(loadEssentialConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  updateSettings,
  setSoundEnabled,
  setVibrationEnabled,
  setNotificationsEnabled,
  setLanguage,
} = configSlice.actions;

export default configSlice.reducer;