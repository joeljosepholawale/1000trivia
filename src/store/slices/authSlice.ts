import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {authAPI} from '@/services/api/auth';
import {apiClient} from '@/services/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {User} from '@1000ravier/shared';
import {getErrorMessage} from '@/types/errors';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pendingVerification: {
    email: string;
    sessionId: string;
  } | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  pendingVerification: null,
};

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async ({email, password, username}: {email: string; password: string; username?: string}, {rejectWithValue}) => {
    try {
      const response = await authAPI.register(email, password, username);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Registration failed');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async ({email, password}: {email: string; password: string}, {rejectWithValue}) => {
    try {
      const response = await authAPI.login(email, password);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Login failed');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({email, otp}: {email: string; otp: string}, {rejectWithValue}) => {
    try {
      const response = await authAPI.verifyOTP(email, otp);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Invalid OTP');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (refreshTokenParam: string | undefined, {getState, rejectWithValue}) => {
    try {
      // Get refresh token from parameter or storage
      let refreshTokenToUse = refreshTokenParam;
      if (!refreshTokenToUse) {
        refreshTokenToUse = await AsyncStorage.getItem('refresh_token');
      }
      
      if (!refreshTokenToUse) {
        return rejectWithValue('No refresh token available');
      }
      
      const response = await authAPI.refreshToken(refreshTokenToUse);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Token refresh failed');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Network error'));
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, {rejectWithValue}) => {
    try {
      await authAPI.logout();
      // Clear stored tokens
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('refresh_token');
      await apiClient.clearToken();
      return;
    } catch (error: unknown) {
      // Even if logout fails on server, we should still clear local state
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('refresh_token');
      await apiClient.clearToken();
      return;
    }
  }
);

// Check stored auth on app start
export const checkStoredAuth = createAsyncThunk(
  'auth/checkStoredAuth',
  async (_, {rejectWithValue}) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const refreshTokenStored = await AsyncStorage.getItem('refresh_token');
      
      if (!token || !refreshTokenStored) {
        return rejectWithValue('No stored auth');
      }
      
      // Set token in API client
      apiClient.setToken(token);
      
      // Get user profile
      const response = await authAPI.getProfile();
      if (!response.success) {
        return rejectWithValue('Invalid stored token');
      }
      
      return {
        user: response.data,
        token,
      };
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to restore session'));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPendingVerification: (state) => {
      state.pendingVerification = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = {...state.user, ...action.payload};
      }
    },
  },
  extraReducers: (builder) => {
    // Check stored auth
    builder
      .addCase(checkStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user as unknown as User;
        state.token = action.payload.token;
      })
      .addCase(checkStoredAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.error = null;
        // Persist tokens
        AsyncStorage.setItem('auth_token', action.payload.accessToken);
        AsyncStorage.setItem('refresh_token', action.payload.refreshToken);
        apiClient.setToken(action.payload.accessToken);
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Login with email
    builder
      .addCase(loginWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.error = null;
        // Persist tokens
        AsyncStorage.setItem('auth_token', action.payload.accessToken);
        AsyncStorage.setItem('refresh_token', action.payload.refreshToken);
        apiClient.setToken(action.payload.accessToken);
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verify OTP
    builder
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.pendingVerification = null;
        state.error = null;
        // Persist tokens
        AsyncStorage.setItem('auth_token', action.payload.accessToken);
        AsyncStorage.setItem('refresh_token', action.payload.refreshToken);
        apiClient.setToken(action.payload.accessToken);
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Refresh token
    builder
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.accessToken;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
        state.pendingVerification = null;
      });
  },
});

export const {clearError, clearPendingVerification, updateUser} = authSlice.actions;
export default authSlice.reducer;
