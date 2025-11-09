import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {walletAPI} from '@/services/api/wallet';
import type {WalletTransaction, CreditsBundle} from '@1000ravier/shared';

interface WalletState {
  // Wallet info
  balance: number;
  lifetimeEarnings: number;
  
  // Daily claim
  dailyClaim: {
    canClaim: boolean;
    amount: number;
    lastClaimed?: string;
    nextClaimAt?: string;
  };
  
  // Transactions
  transactions: WalletTransaction[];
  transactionsLoading: boolean;
  
  // Credit bundles
  creditBundles: CreditsBundle[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balance: 0,
  lifetimeEarnings: 0,
  dailyClaim: {
    canClaim: false,
    amount: 0,
  },
  transactions: [],
  transactionsLoading: false,
  creditBundles: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const loadWalletInfo = createAsyncThunk(
  'wallet/loadWalletInfo',
  async (_, {rejectWithValue}) => {
    try {
      const response = await walletAPI.getWalletInfo();
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load wallet info');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const claimDailyCredits = createAsyncThunk(
  'wallet/claimDailyCredits',
  async (_, {rejectWithValue}) => {
    try {
      const response = await walletAPI.claimDailyCredits();
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to claim daily credits');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const claimAdReward = createAsyncThunk(
  'wallet/claimAdReward',
  async (adType: 'rewarded_video' | 'interstitial', {rejectWithValue}) => {
    try {
      const response = await walletAPI.claimAdReward(adType);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to claim ad reward');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const loadTransactions = createAsyncThunk(
  'wallet/loadTransactions',
  async ({limit = 20, offset = 0}: {limit?: number; offset?: number} = {}, {rejectWithValue}) => {
    try {
      const response = await walletAPI.getTransactions(limit, offset);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load transactions');
      }
      return {transactions: response.data, offset};
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const loadCreditBundles = createAsyncThunk(
  'wallet/loadCreditBundles',
  async (_, {rejectWithValue}) => {
    try {
      const response = await walletAPI.getCreditBundles();
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to load credit bundles');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const requestRefund = createAsyncThunk(
  'wallet/requestRefund',
  async ({transactionId, reason}: {transactionId: string; reason: string}, {rejectWithValue}) => {
    try {
      const response = await walletAPI.requestRefund(transactionId, reason);
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Failed to request refund');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    updateBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    
    addTransaction: (state, action: PayloadAction<WalletTransaction>) => {
      state.transactions.unshift(action.payload);
    },
    
    clearTransactions: (state) => {
      state.transactions = [];
    },
  },
  extraReducers: (builder) => {
    // Load wallet info
    builder
      .addCase(loadWalletInfo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadWalletInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload.balance;
        state.lifetimeEarnings = action.payload.lifetimeEarnings;
        state.dailyClaim = action.payload.dailyClaim;
      })
      .addCase(loadWalletInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Claim daily credits
    builder
      .addCase(claimDailyCredits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(claimDailyCredits.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload.newBalance;
        state.dailyClaim = {
          canClaim: false,
          amount: action.payload.amount,
          lastClaimed: new Date().toISOString(),
          nextClaimAt: action.payload.nextClaimAt,
        };
        
        // Add transaction
        const transaction: WalletTransaction = {
          id: action.payload.transactionId,
          type: 'CREDIT',
          amount: action.payload.amount,
          description: 'Daily claim reward',
          createdAt: new Date().toISOString(),
          status: 'COMPLETED',
        };
        state.transactions.unshift(transaction);
      })
      .addCase(claimDailyCredits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Claim ad reward
    builder
      .addCase(claimAdReward.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(claimAdReward.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload.newBalance;
        
        // Add transaction
        const transaction: WalletTransaction = {
          id: action.payload.transactionId,
          type: 'CREDIT',
          amount: action.payload.amount,
          description: `Ad reward - ${action.payload.adType}`,
          createdAt: new Date().toISOString(),
          status: 'COMPLETED',
        };
        state.transactions.unshift(transaction);
      })
      .addCase(claimAdReward.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load transactions
    builder
      .addCase(loadTransactions.pending, (state) => {
        state.transactionsLoading = true;
        state.error = null;
      })
      .addCase(loadTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        
        if (action.payload.offset === 0) {
          // Replace transactions for initial load
          state.transactions = action.payload.transactions;
        } else {
          // Append transactions for pagination
          state.transactions.push(...action.payload.transactions);
        }
      })
      .addCase(loadTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.error = action.payload as string;
      });

    // Load credit bundles
    builder
      .addCase(loadCreditBundles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadCreditBundles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.creditBundles = action.payload;
      })
      .addCase(loadCreditBundles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Request refund
    builder
      .addCase(requestRefund.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestRefund.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update transaction status
        const transaction = state.transactions.find(t => t.id === action.payload.transactionId);
        if (transaction) {
          transaction.status = 'REFUND_REQUESTED';
        }
      })
      .addCase(requestRefund.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  updateBalance,
  addTransaction,
  clearTransactions,
} = walletSlice.actions;

export default walletSlice.reducer;