/**
 * User Redux Slice
 * Manages user statistics, achievements, and profile state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userAPI, UserStats, UserAchievement, UserProfile, ProfileUpdateData } from '@/services/api/user';
import { getErrorMessage } from '@/types/errors';

export interface UserState {
  stats: UserStats | null;
  achievements: UserAchievement[];
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: UserState = {
  stats: null,
  achievements: [],
  profile: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const loadUserStats = createAsyncThunk(
  'user/loadStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await userAPI.getStats();
      return stats;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load user stats'));
    }
  }
);

export const loadUserAchievements = createAsyncThunk(
  'user/loadAchievements',
  async (_, { rejectWithValue }) => {
    try {
      const achievements = await userAPI.getAchievements();
      return achievements;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load achievements'));
    }
  }
);

export const loadUserProfile = createAsyncThunk(
  'user/loadProfile',
  async (_, { rejectWithValue }) => {
    try {
      const profile = await userAPI.getProfile();
      return profile;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load user profile'));
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (updates: ProfileUpdateData, { rejectWithValue }) => {
    try {
      const result = await userAPI.updateProfile(updates);
      // Reload profile after update
      const profile = await userAPI.getProfile();
      return profile;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update profile'));
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserData: (state) => {
      state.stats = null;
      state.achievements = [];
      state.profile = null;
      state.error = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    // Load stats
    builder
      .addCase(loadUserStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserStats.fulfilled, (state, action: PayloadAction<UserStats>) => {
        state.isLoading = false;
        state.stats = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(loadUserStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load achievements
    builder
      .addCase(loadUserAchievements.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserAchievements.fulfilled, (state, action: PayloadAction<UserAchievement[]>) => {
        state.isLoading = false;
        state.achievements = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(loadUserAchievements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load profile
    builder
      .addCase(loadUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.stats = action.payload.stats;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(loadUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.stats = action.payload.stats;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUserData } = userSlice.actions;
export default userSlice.reducer;
