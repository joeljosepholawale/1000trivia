import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {leaderboardAPI} from '@/services/api/leaderboard';
import {getErrorMessage} from '@/types/errors';
import type {LeaderboardEntry, Winner, Period} from '@1000ravier/shared';

interface LeaderboardState {
  // Current leaderboard
  currentLeaderboard: LeaderboardEntry[];
  userRank: {
    position: number;
    score: number;
    totalParticipants: number;
  } | null;
  
  // Winners
  winners: Winner[];
  recentWinners: Winner[];
  
  // Periods
  periods: Period[];
  selectedPeriodId: string | null;
  
  // Stats
  userStats: {
    totalGames: number;
    averageScore: number;
    bestRank: number;
    winnings: number;
  } | null;
  
  // UI state
  isLoading: boolean;
  winnersLoading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  currentLeaderboard: [],
  userRank: null,
  winners: [],
  recentWinners: [],
  periods: [],
  selectedPeriodId: null,
  userStats: null,
  isLoading: false,
  winnersLoading: false,
  error: null,
};

// Async thunks
export const loadLeaderboard = createAsyncThunk(
  'leaderboard/loadLeaderboard',
  async (periodId?: string, {rejectWithValue}) => {
    try {
      const response = await leaderboardAPI.getLeaderboard(periodId);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load leaderboard');
      }
      return {leaderboard: response.data, periodId};
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const loadUserRank = createAsyncThunk(
  'leaderboard/loadUserRank',
  async (periodId?: string, {rejectWithValue}) => {
    try {
      const response = await leaderboardAPI.getUserRank(periodId);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load user rank');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const loadWinners = createAsyncThunk(
  'leaderboard/loadWinners',
  async ({limit = 20, offset = 0}: {limit?: number; offset?: number} = {}, {rejectWithValue}) => {
    try {
      const response = await leaderboardAPI.getWinners(limit, offset);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load winners');
      }
      return {winners: response.data, offset};
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const loadRecentWinners = createAsyncThunk(
  'leaderboard/loadRecentWinners',
  async (_, {rejectWithValue}) => {
    try {
      const response = await leaderboardAPI.getRecentWinners();
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load recent winners');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const loadPeriods = createAsyncThunk(
  'leaderboard/loadPeriods',
  async ({limit = 10, offset = 0}: {limit?: number; offset?: number} = {}, {rejectWithValue}) => {
    try {
      const response = await leaderboardAPI.getPeriods(limit, offset);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load periods');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const loadUserStats = createAsyncThunk(
  'leaderboard/loadUserStats',
  async (_, {rejectWithValue}) => {
    try {
      const response = await leaderboardAPI.getUserStats();
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load user stats');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const loadPeriodStats = createAsyncThunk(
  'leaderboard/loadPeriodStats',
  async (periodId: string, {rejectWithValue}) => {
    try {
      const response = await leaderboardAPI.getPeriodStats(periodId);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load period stats');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    setSelectedPeriod: (state, action: PayloadAction<string | null>) => {
      state.selectedPeriodId = action.payload;
    },
    
    clearLeaderboard: (state) => {
      state.currentLeaderboard = [];
      state.userRank = null;
    },
    
    clearWinners: (state) => {
      state.winners = [];
    },
  },
  extraReducers: (builder) => {
    // Load leaderboard
    builder
      .addCase(loadLeaderboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadLeaderboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLeaderboard = action.payload.leaderboard;
        if (action.payload.periodId) {
          state.selectedPeriodId = action.payload.periodId;
        }
      })
      .addCase(loadLeaderboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load user rank
    builder
      .addCase(loadUserRank.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserRank.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userRank = action.payload;
      })
      .addCase(loadUserRank.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load winners
    builder
      .addCase(loadWinners.pending, (state) => {
        state.winnersLoading = true;
        state.error = null;
      })
      .addCase(loadWinners.fulfilled, (state, action) => {
        state.winnersLoading = false;
        
        if (action.payload.offset === 0) {
          // Replace winners for initial load
          state.winners = action.payload.winners;
        } else {
          // Append winners for pagination
          state.winners.push(...action.payload.winners);
        }
      })
      .addCase(loadWinners.rejected, (state, action) => {
        state.winnersLoading = false;
        state.error = action.payload as string;
      });

    // Load recent winners
    builder
      .addCase(loadRecentWinners.pending, (state) => {
        state.winnersLoading = true;
        state.error = null;
      })
      .addCase(loadRecentWinners.fulfilled, (state, action) => {
        state.winnersLoading = false;
        state.recentWinners = action.payload;
      })
      .addCase(loadRecentWinners.rejected, (state, action) => {
        state.winnersLoading = false;
        state.error = action.payload as string;
      });

    // Load periods
    builder
      .addCase(loadPeriods.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadPeriods.fulfilled, (state, action) => {
        state.isLoading = false;
        state.periods = action.payload;
      })
      .addCase(loadPeriods.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load user stats
    builder
      .addCase(loadUserStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userStats = action.payload;
      })
      .addCase(loadUserStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load period stats
    builder
      .addCase(loadPeriodStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadPeriodStats.fulfilled, (state, action) => {
        state.isLoading = false;
        // Period stats can be used to update UI or show additional info
      })
      .addCase(loadPeriodStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setSelectedPeriod,
  clearLeaderboard,
  clearWinners,
} = leaderboardSlice.actions;

export default leaderboardSlice.reducer;
