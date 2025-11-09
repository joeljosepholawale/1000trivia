import { db } from './database';
import { config } from '@1000ravier/shared';
import winston from 'winston';

// Helper function to check if user can claim daily credits
function canClaimDailyCredits(lastClaimAt: string | null): boolean {
  if (!lastClaimAt) return true;
  
  const lastClaim = new Date(lastClaimAt);
  const now = new Date();
  
  // Check if it's a new day (UTC)
  const lastClaimDate = new Date(lastClaim.getUTCFullYear(), lastClaim.getUTCMonth(), lastClaim.getUTCDate());
  const todayDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  
  return todayDate > lastClaimDate;
}

// Helper function to check if user can receive ad reward
function canReceiveAdReward(
  adRewardsToday: number,
  resetAt: string | null,
  appConfig: any
): boolean {
  const maxAdsPerDay = appConfig.credits?.maxAdsPerDay || 10;
  
  if (adRewardsToday >= maxAdsPerDay) {
    return false;
  }
  
  return true;
}

export class WalletService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/wallet.log' })
      ]
    });

    this.logger.info('Wallet service initialized');
  }

  // Daily credits claim
  async claimDailyCredits(userId: string): Promise<{
    success: boolean;
    message: string;
    data?: { creditsAwarded: number; newBalance: number };
  }> {
    try {
      const wallet = await db.getWallet(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check if user can claim daily credits
      if (!canClaimDailyCredits(wallet.last_daily_claim_at)) {
        return {
          success: false,
          message: 'Daily credits already claimed today'
        };
      }

      // Get daily claim amount from config or use default
      const creditsAmount = 10; // Default daily claim amount

      // Update wallet
      const result = await db.updateWalletBalance(
        userId,
        creditsAmount,
        'DAILY_CLAIM',
        `Daily credits claim (+${creditsAmount} credits)`,
        undefined,
        { claimedAt: new Date().toISOString() }
      );

      // Update last claim timestamp
      await db.getClient()
        .from('wallets')
        .update({
          last_daily_claim_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      this.logger.info(`Daily credits claimed: ${userId}, amount: ${creditsAmount}`);

      return {
        success: true,
        message: `${creditsAmount} credits claimed successfully!`,
        data: {
          creditsAwarded: creditsAmount,
          newBalance: result.wallet.credits_balance
        }
      };
    } catch (error) {
      this.logger.error('Error claiming daily credits:', error);
      return {
        success: false,
        message: 'Failed to claim daily credits'
      };
    }
  }

  // Ad reward processing
  async processAdReward(
    userId: string,
    adUnitId: string,
    rewardValue: number
  ): Promise<{
    success: boolean;
    message: string;
    data?: { creditsAwarded: number; newBalance: number };
  }> {
    try {
      const wallet = await db.getWallet(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const appConfig = { credits: { maxAdsPerDay: 10 } }; // Default config

      // Check if user can receive ad reward
      if (!canReceiveAdReward(
        wallet.ad_rewards_today,
        wallet.ad_rewards_reset_at,
        appConfig
      )) {
        return {
          success: false,
          message: 'Daily ad reward limit reached'
        };
      }

      // Check if it's a new day and reset counter
      const now = new Date();
      const resetTime = new Date(wallet.ad_rewards_reset_at);
      let adRewardsToday = wallet.ad_rewards_today;

      if (now >= resetTime) {
        // Reset daily counter
        adRewardsToday = 0;
        const nextResetTime = new Date(now);
        nextResetTime.setUTCHours(24, 0, 0, 0); // Next midnight UTC

        await db.getClient()
          .from('wallets')
          .update({
            ad_rewards_today: 0,
            ad_rewards_reset_at: nextResetTime.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }

      const adRewardAmount = 50; // Default ad reward amount
      const creditsAmount = Math.min(rewardValue, adRewardAmount);

      // Update wallet
      const result = await db.updateWalletBalance(
        userId,
        creditsAmount,
        'AD_REWARD',
        `Ad reward (+${creditsAmount} credits)`,
        adUnitId,
        { 
          adUnitId,
          rewardValue,
          processedAt: new Date().toISOString()
        }
      );

      // Update ad rewards counter
      await db.getClient()
        .from('wallets')
        .update({
          ad_rewards_today: adRewardsToday + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      this.logger.info(`Ad reward processed: ${userId}, amount: ${creditsAmount}`);

      return {
        success: true,
        message: `${creditsAmount} credits earned from ad!`,
        data: {
          creditsAwarded: creditsAmount,
          newBalance: result.wallet.credits_balance
        }
      };
    } catch (error) {
      this.logger.error('Error processing ad reward:', error);
      return {
        success: false,
        message: 'Failed to process ad reward'
      };
    }
  }

  // Purchase credits bundle
  async processCreditsPurchase(
    userId: string,
    bundleType: 'bundle100' | 'bundle1000',
    paymentIntentId: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: { creditsAwarded: number; newBalance: number };
  }> {
    try {
      // Default bundle configurations
      const bundles = {
        bundle100: { credits: 100, price: 1.99 },
        bundle1000: { credits: 1000, price: 9.99 }
      };
      const bundleConfig = bundles[bundleType];
      if (!bundleConfig) {
        return {
          success: false,
          message: 'Invalid bundle type'
        };
      }

      // Update wallet
      const result = await db.updateWalletBalance(
        userId,
        bundleConfig.credits,
        'PURCHASE',
        `Credits purchase - ${bundleType} (+${bundleConfig.credits} credits)`,
        paymentIntentId,
        {
          bundleType,
          bundlePrice: bundleConfig.price,
          paymentIntentId
        }
      );

      this.logger.info(`Credits purchased: ${userId}, bundle: ${bundleType}, credits: ${bundleConfig.credits}`);

      return {
        success: true,
        message: `${bundleConfig.credits} credits purchased successfully!`,
        data: {
          creditsAwarded: bundleConfig.credits,
          newBalance: result.wallet.credits_balance
        }
      };
    } catch (error) {
      this.logger.error('Error processing credits purchase:', error);
      return {
        success: false,
        message: 'Failed to process credits purchase'
      };
    }
  }

  // Deduct credits for game entry
  async deductCreditsForEntry(
    userId: string,
    amount: number,
    modeType: string,
    periodId: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: { newBalance: number };
  }> {
    try {
      const wallet = await db.getWallet(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.credits_balance < amount) {
        return {
          success: false,
          message: 'Insufficient credits'
        };
      }

      // Update wallet (deduct credits)
      const result = await db.updateWalletBalance(
        userId,
        -amount,
        'ENTRY_FEE',
        `Game entry fee - ${modeType} (-${amount} credits)`,
        periodId,
        {
          modeType,
          periodId,
          entryFee: amount
        }
      );

      this.logger.info(`Credits deducted for entry: ${userId}, mode: ${modeType}, amount: ${amount}`);

      return {
        success: true,
        message: `${amount} credits deducted for game entry`,
        data: {
          newBalance: result.wallet.credits_balance
        }
      };
    } catch (error) {
      this.logger.error('Error deducting credits for entry:', error);
      return {
        success: false,
        message: error instanceof Error && error.message === 'Insufficient credits' 
          ? 'Insufficient credits' 
          : 'Failed to deduct credits'
      };
    }
  }

  // Refund credits
  async refundCredits(
    userId: string,
    amount: number,
    reason: string,
    reference?: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: { newBalance: number };
  }> {
    try {
      const result = await db.updateWalletBalance(
        userId,
        amount,
        'REFUND',
        reason,
        reference,
        {
          refundReason: reason,
          refundAmount: amount
        }
      );

      this.logger.info(`Credits refunded: ${userId}, amount: ${amount}, reason: ${reason}`);

      return {
        success: true,
        message: `${amount} credits refunded`,
        data: {
          newBalance: result.wallet.credits_balance
        }
      };
    } catch (error) {
      this.logger.error('Error refunding credits:', error);
      return {
        success: false,
        message: 'Failed to refund credits'
      };
    }
  }

  // Get wallet info
  async getWalletInfo(userId: string): Promise<{
    success: boolean;
    data?: {
      creditsBalance: number;
      canClaimDaily: boolean;
      canReceiveAdReward: boolean;
      adRewardsToday: number;
      adRewardLimit: number;
    };
  }> {
    try {
      const wallet = await db.getWallet(userId);
      if (!wallet) {
        return { success: false };
      }

      // Use default config values
      const appConfig = { credits: { maxAdsPerDay: 10, adRewardDailyLimit: 10 } };
      const canClaim = canClaimDailyCredits(wallet.last_daily_claim_at);
      const canReceiveAd = canReceiveAdReward(
        wallet.ad_rewards_today,
        wallet.ad_rewards_reset_at,
        appConfig
      );

      return {
        success: true,
        data: {
          creditsBalance: wallet.credits_balance,
          canClaimDaily: canClaim,
          canReceiveAdReward: canReceiveAd,
          adRewardsToday: wallet.ad_rewards_today,
          adRewardLimit: appConfig.credits.adRewardDailyLimit
        }
      };
    } catch (error) {
      this.logger.error('Error getting wallet info:', error);
      return { success: false };
    }
  }

  // Get transaction history
  async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    success: boolean;
    data?: any[];
    meta?: { total: number; hasMore: boolean };
  }> {
    try {
      const { data, error, count } = await db.getClient()
        .from('wallet_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        meta: {
          total: count || 0,
          hasMore: (offset + limit) < (count || 0)
        }
      };
    } catch (error) {
      this.logger.error('Error getting transaction history:', error);
      return { success: false };
    }
  }

  // Award bonus credits (admin function)
  async awardBonusCredits(
    userId: string,
    amount: number,
    reason: string,
    adminId?: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: { newBalance: number };
  }> {
    try {
      const result = await db.updateWalletBalance(
        userId,
        amount,
        'BONUS',
        reason,
        adminId,
        {
          bonusReason: reason,
          awardedBy: adminId,
          bonusAmount: amount
        }
      );

      // Create audit log
      await db.createAuditLog({
        userId: adminId,
        action: 'AWARD_BONUS_CREDITS',
        resource: 'wallet',
        resourceId: userId,
        changes: { amount, reason }
      });

      this.logger.info(`Bonus credits awarded: ${userId}, amount: ${amount}, by: ${adminId}`);

      return {
        success: true,
        message: `${amount} bonus credits awarded`,
        data: {
          newBalance: result.wallet.credits_balance
        }
      };
    } catch (error) {
      this.logger.error('Error awarding bonus credits:', error);
      return {
        success: false,
        message: 'Failed to award bonus credits'
      };
    }
  }

  // Penalize credits (admin function for violations)
  async penalizeCredits(
    userId: string,
    amount: number,
    reason: string,
    adminId?: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: { newBalance: number };
  }> {
    try {
      const result = await db.updateWalletBalance(
        userId,
        -amount,
        'PENALTY',
        reason,
        adminId,
        {
          penaltyReason: reason,
          penalizedBy: adminId,
          penaltyAmount: amount
        }
      );

      // Create audit log
      await db.createAuditLog({
        userId: adminId,
        action: 'PENALIZE_CREDITS',
        resource: 'wallet',
        resourceId: userId,
        changes: { amount: -amount, reason }
      });

      this.logger.info(`Credits penalized: ${userId}, amount: ${amount}, by: ${adminId}`);

      return {
        success: true,
        message: `${amount} credits penalized`,
        data: {
          newBalance: result.wallet.credits_balance
        }
      };
    } catch (error) {
      this.logger.error('Error penalizing credits:', error);
      return {
        success: false,
        message: 'Failed to penalize credits'
      };
    }
  }

  // Get wallet statistics for admin
  async getWalletStats(): Promise<{
    success: boolean;
    data?: {
      totalCreditsInCirculation: number;
      totalDailyClaimsToday: number;
      totalAdRewardsToday: number;
      totalPurchasesToday: number;
      averageBalance: number;
    };
  }> {
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Get total credits in circulation
      const { data: walletsData } = await db.getClient()
        .from('wallets')
        .select('credits_balance');

      const totalCredits = walletsData?.reduce((sum, w) => sum + w.credits_balance, 0) || 0;
      const averageBalance = walletsData?.length ? totalCredits / walletsData.length : 0;

      // Get today's activity
      const { data: transactionsToday } = await db.getClient()
        .from('wallet_transactions')
        .select('type, amount')
        .gte('created_at', today.toISOString());

      const dailyClaims = transactionsToday?.filter(t => t.type === 'DAILY_CLAIM').length || 0;
      const adRewards = transactionsToday?.filter(t => t.type === 'AD_REWARD').length || 0;
      const purchases = transactionsToday?.filter(t => t.type === 'PURCHASE').length || 0;

      return {
        success: true,
        data: {
          totalCreditsInCirculation: totalCredits,
          totalDailyClaimsToday: dailyClaims,
          totalAdRewardsToday: adRewards,
          totalPurchasesToday: purchases,
          averageBalance
        }
      };
    } catch (error) {
      this.logger.error('Error getting wallet stats:', error);
      return { success: false };
    }
  }
}

export const walletService = new WalletService();