import { db } from './database';
import winston from 'winston';

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

  // Get wallet information
  async getWalletInfo(userId: string): Promise<{
    success: boolean;
    data?: {
      balance: number;
      lifetimeEarnings: number;
      dailyClaim: {
        canClaim: boolean;
        amount: number;
        nextClaimAt: string | null;
      };
    };
  }> {
    try {
      // Get user profile with wallet info
      const { data: profile } = await db.getClient()
        .from('profiles')
        .select('credits_balance, total_winnings, last_daily_claim')
        .eq('id', userId)
        .single();

      if (!profile) {
        return { success: false };
      }

      // Check if user can claim daily reward
      const now = new Date();
      const lastClaim = profile.last_daily_claim ? new Date(profile.last_daily_claim) : null;
      const canClaim = !lastClaim || 
        (now.getTime() - lastClaim.getTime()) >= (24 * 60 * 60 * 1000); // 24 hours

      // Calculate next claim time
      let nextClaimAt = null;
      if (!canClaim && lastClaim) {
        const nextClaim = new Date(lastClaim);
        nextClaim.setDate(nextClaim.getDate() + 1);
        nextClaimAt = nextClaim.toISOString();
      }

      return {
        success: true,
        data: {
          balance: profile.credits_balance || 0,
          lifetimeEarnings: profile.total_winnings || 0,
          dailyClaim: {
            canClaim,
            amount: 100, // Daily claim amount
            nextClaimAt
          }
        }
      };
    } catch (error) {
      this.logger.error('Error getting wallet info:', error);
      return { success: false };
    }
  }

  // Claim daily credits
  async claimDailyCredits(userId: string): Promise<{
    success: boolean;
    data?: { creditsEarned: number };
  }> {
    try {
      const walletInfo = await this.getWalletInfo(userId);
      if (!walletInfo.success || !walletInfo.data?.dailyClaim.canClaim) {
        return { success: false };
      }

      const creditsAmount = 100; // Daily reward amount

      // Update user's balance and claim timestamp
      const { error } = await db.getClient()
        .from('profiles')
        .update({
          credits_balance: db.getClient().sql`credits_balance + ${creditsAmount}`,
          last_daily_claim: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Create transaction record
      await db.getClient()
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'CREDIT',
          amount: creditsAmount,
          description: 'Daily credits claim',
          category: 'daily_reward'
        });

      this.logger.info(`Daily credits claimed: ${userId}, amount: ${creditsAmount}`);

      return {
        success: true,
        data: { creditsEarned: creditsAmount }
      };
    } catch (error) {
      this.logger.error('Error claiming daily credits:', error);
      return { success: false };
    }
  }

  // NEW: Claim ad reward
  async claimAdReward(
    userId: string, 
    adType: 'rewarded_video' | 'interstitial',
    deviceInfo?: any,
    ipAddress?: string
  ): Promise<{
    success: boolean;
    data?: { creditsEarned: number };
    error?: string;
  }> {
    try {
      // Check daily ad limit
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAds } = await db.getClient()
        .from('ad_rewards')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`);

      const adsWatchedToday = todayAds?.length || 0;
      const maxAdsPerDay = 10; // Configurable limit

      if (adsWatchedToday >= maxAdsPerDay) {
        return {
          success: false,
          error: 'Daily ad limit reached'
        };
      }

      // Check if user already watched this ad type today (prevent spam)
      const { data: existingAdToday } = await db.getClient()
        .from('ad_rewards')
        .select('id')
        .eq('user_id', userId)
        .eq('ad_type', adType)
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`)
        .single();

      if (existingAdToday) {
        return {
          success: false,
          error: 'Already watched this ad type today'
        };
      }

      // Determine credits based on ad type
      const creditsAmount = adType === 'rewarded_video' ? 50 : 25;

      // Create ad reward record
      const { error: adError } = await db.getClient()
        .from('ad_rewards')
        .insert({
          user_id: userId,
          ad_type: adType,
          credits_earned: creditsAmount,
          device_info: deviceInfo,
          ip_address: ipAddress
        });

      if (adError) throw adError;

      // Update user's balance
      const { error: balanceError } = await db.getClient()
        .from('profiles')
        .update({
          credits_balance: db.getClient().sql`credits_balance + ${creditsAmount}`,
          total_ad_rewards: db.getClient().sql`total_ad_rewards + ${creditsAmount}`,
          ads_watched_today: db.getClient().sql`ads_watched_today + 1`,
          last_ad_watch_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (balanceError) throw balanceError;

      // Create transaction record
      await db.getClient()
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'CREDIT',
          amount: creditsAmount,
          description: `Ad reward - ${adType}`,
          category: 'ad_reward'
        });

      this.logger.info(`Ad reward claimed: ${userId}, type: ${adType}, credits: ${creditsAmount}`);

      return {
        success: true,
        data: { creditsEarned: creditsAmount }
      };
    } catch (error) {
      this.logger.error('Error claiming ad reward:', error);
      return { success: false };
    }
  }

  // NEW: Get credit bundles
  async getCreditBundles(): Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      name: string;
      description: string;
      credits: number;
      price: number;
      bonusPercentage: number;
      isPopular: boolean;
    }>;
  }> {
    try {
      const { data: bundles } = await db.getClient()
        .from('credit_bundles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (!bundles) {
        return { success: false };
      }

      const formattedBundles = bundles.map(bundle => ({
        id: bundle.id,
        name: bundle.name,
        description: bundle.description || '',
        credits: bundle.credits,
        price: parseFloat(bundle.price_usd),
        bonusPercentage: bundle.bonus_percentage || 0,
        isPopular: bundle.is_popular || false
      }));

      return {
        success: true,
        data: formattedBundles
      };
    } catch (error) {
      this.logger.error('Error getting credit bundles:', error);
      return { success: false };
    }
  }

  // NEW: Process credit purchase
  async processCreditsPurchase(
    userId: string,
    bundleId: string,
    paymentIntentId: string
  ): Promise<{
    success: boolean;
    data?: { creditsAdded: number };
  }> {
    try {
      // Get bundle info
      const { data: bundle } = await db.getClient()
        .from('credit_bundles')
        .select('*')
        .eq('id', bundleId)
        .single();

      if (!bundle) {
        return { success: false };
      }

      // Add credits to user's balance
      const { error: balanceError } = await db.getClient()
        .from('profiles')
        .update({
          credits_balance: db.getClient().sql`credits_balance + ${bundle.credits}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (balanceError) throw balanceError;

      // Create transaction record
      await db.getClient()
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'CREDIT',
          amount: bundle.credits,
          description: `Credit purchase - ${bundle.name}`,
          category: 'purchase',
          reference_id: paymentIntentId
        });

      // Update payment record
      await db.getClient()
        .from('payments')
        .update({
          status: 'succeeded',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      this.logger.info(`Credits purchased: ${userId}, bundle: ${bundleId}, credits: ${bundle.credits}`);

      return {
        success: true,
        data: { creditsAdded: bundle.credits }
      };
    } catch (error) {
      this.logger.error('Error processing credits purchase:', error);
      return { success: false };
    }
  }

  // Deduct credits (for game entry fees)
  async deductCreditsForEntry(
    userId: string,
    amount: number,
    reason: string = 'Game entry fee',
    referenceId?: string
  ): Promise<{
    success: boolean;
    data?: { newBalance: number };
    error?: string;
  }> {
    try {
      // Check current balance
      const { data: profile } = await db.getClient()
        .from('profiles')
        .select('credits_balance')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits_balance < amount) {
        return {
          success: false,
          error: 'Insufficient credits'
        };
      }

      // Deduct credits
      const { data: updated, error } = await db.getClient()
        .from('profiles')
        .update({
          credits_balance: db.getClient().sql`credits_balance - ${amount}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('credits_balance')
        .single();

      if (error) throw error;

      // Create transaction record
      await db.getClient()
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'DEBIT',
          amount: amount,
          description: reason,
          category: 'game_entry',
          reference_id: referenceId
        });

      this.logger.info(`Credits deducted: ${userId}, amount: ${amount}, reason: ${reason}`);

      return {
        success: true,
        data: { newBalance: updated.credits_balance }
      };
    } catch (error) {
      this.logger.error('Error deducting credits:', error);
      return { success: false };
    }
  }

  // Get transaction history
  async getTransactionHistory(
    userId: string,
    options: {
      type?: 'CREDIT' | 'DEBIT';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    success: boolean;
    data?: {
      transactions: Array<{
        id: string;
        type: string;
        amount: number;
        description: string;
        category: string;
        createdAt: string;
        referenceId?: string;
      }>;
      total: number;
    };
  }> {
    try {
      let query = db.getClient()
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data: transactions, count, error } = await query;

      if (error) throw error;

      const formattedTransactions = (transactions || []).map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        category: t.category,
        createdAt: t.created_at,
        referenceId: t.reference_id
      }));

      return {
        success: true,
        data: {
          transactions: formattedTransactions,
          total: count || 0
        }
      };
    } catch (error) {
      this.logger.error('Error getting transaction history:', error);
      return { success: false };
    }
  }

  // Get wallet statistics
  async getWalletStats(userId: string): Promise<{
    success: boolean;
    data?: {
      totalCreditsEarned: number;
      totalCreditsSpent: number;
      totalAdRewards: number;
      totalPurchases: number;
      thisMonthEarnings: number;
    };
  }> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Get transaction stats
      const { data: transactions } = await db.getClient()
        .from('transactions')
        .select('type, amount, category, created_at')
        .eq('user_id', userId);

      const { data: profile } = await db.getClient()
        .from('profiles')
        .select('total_ad_rewards')
        .eq('id', userId)
        .single();

      if (!transactions) {
        return { success: false };
      }

      const totalCreditsEarned = transactions
        .filter(t => t.type === 'CREDIT')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalCreditsSpent = transactions
        .filter(t => t.type === 'DEBIT')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalPurchases = transactions
        .filter(t => t.category === 'purchase')
        .reduce((sum, t) => sum + t.amount, 0);

      const thisMonthEarnings = transactions
        .filter(t => t.type === 'CREDIT' && new Date(t.created_at) >= startOfMonth)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        success: true,
        data: {
          totalCreditsEarned,
          totalCreditsSpent,
          totalAdRewards: profile?.total_ad_rewards || 0,
          totalPurchases,
          thisMonthEarnings
        }
      };
    } catch (error) {
      this.logger.error('Error getting wallet stats:', error);
      return { success: false };
    }
  }

  // Reset daily ad count (called by cron job)
  async resetDailyAdCounts(): Promise<{ success: boolean }> {
    try {
      await db.getClient()
        .from('profiles')
        .update({
          ads_watched_today: 0,
          updated_at: new Date().toISOString()
        })
        .neq('ads_watched_today', 0);

      this.logger.info('Daily ad counts reset');
      return { success: true };
    } catch (error) {
      this.logger.error('Error resetting daily ad counts:', error);
      return { success: false };
    }
  }
}

export const walletService = new WalletService();