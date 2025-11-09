import {apiClient} from './client';
import type {ApiResponse, WalletTransaction} from '@1000ravier/shared';

export interface WalletInfoResponse {
  balance: number;
  lifetimeEarnings: number;
  dailyClaim: {
    canClaim: boolean;
    amount: number;
    lastClaimed?: string;
    nextClaimAt?: string;
  };
}

export interface DailyClaimResponse {
  amount: number;
  newBalance: number;
  nextClaimAt: string;
  transactionId: string;
}

export interface AdRewardResponse {
  amount: number;
  newBalance: number;
  adType: string;
  transactionId: string;
}

export interface CreditsBundle {
  id: string;
  credits: number;
  priceNgn: number;
  bonusCredits?: number;
  popular?: boolean;
  savings?: number;
}

export interface RefundResponse {
  transactionId: string;
  status: string;
  message: string;
}

export const walletAPI = {
  // Get wallet information
  getWalletInfo: async (): Promise<ApiResponse<WalletInfoResponse>> => {
    return apiClient.get('/wallet/info');
  },

  // Claim daily credits
  claimDailyCredits: async (): Promise<ApiResponse<DailyClaimResponse>> => {
    return apiClient.post('/wallet/claim-daily');
  },

  // Claim ad reward credits
  claimAdReward: async (adType: 'rewarded_video' | 'interstitial'): Promise<ApiResponse<AdRewardResponse>> => {
    return apiClient.post('/wallet/claim-ad-reward', {
      adType,
    });
  },

  // Get transaction history
  getTransactions: async (
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<WalletTransaction[]>> => {
    return apiClient.get(`/wallet/transactions?limit=${limit}&offset=${offset}`);
  },

  // Get available credit bundles
  getCreditBundles: async (): Promise<ApiResponse<CreditsBundle[]>> => {
    return apiClient.get('/wallet/credit-bundles');
  },

  // Request refund for a transaction
  requestRefund: async (
    transactionId: string,
    reason: string
  ): Promise<ApiResponse<RefundResponse>> => {
    return apiClient.post('/wallet/request-refund', {
      transactionId,
      reason,
    });
  },

  // Get wallet statistics
  getWalletStats: async (): Promise<ApiResponse<{
    totalTransactions: number;
    totalSpent: number;
    totalEarned: number;
    averageTransactionAmount: number;
  }>> => {
    return apiClient.get('/wallet/stats');
  },
};