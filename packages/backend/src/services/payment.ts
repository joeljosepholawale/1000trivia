import Stripe from 'stripe';
import { db } from './database';
import { walletService } from './wallet';
import { config } from '@1000ravier/shared';
import winston from 'winston';

export class PaymentService {
  private stripe: Stripe;
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
        new winston.transports.File({ filename: 'logs/payment.log' })
      ]
    });

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });

    this.logger.info('Payment service initialized');
  }

  // Create payment intent for credits bundle
  async createCreditsBundlePayment(
    userId: string,
    bundleType: 'bundle100' | 'bundle1000',
    customerEmail?: string
  ): Promise<{
    success: boolean;
    data?: {
      paymentIntentId: string;
      clientSecret: string;
      amount: number;
      currency: string;
    };
    message?: string;
  }> {
    try {
      const bundleConfig = config.getConfig().credits.bundles[bundleType];
      if (!bundleConfig) {
        return {
          success: false,
          message: 'Invalid bundle type'
        };
      }

      // Create or get customer
      let customer: Stripe.Customer | null = null;
      if (customerEmail) {
        const existingCustomers = await this.stripe.customers.list({
          email: customerEmail,
          limit: 1
        });

        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
        } else {
          customer = await this.stripe.customers.create({
            email: customerEmail,
            metadata: { userId }
          });
        }
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(bundleConfig.price * 100), // Convert to cents
        currency: 'usd',
        customer: customer?.id,
        metadata: {
          userId,
          bundleType,
          credits: bundleConfig.credits.toString(),
          type: 'CREDITS_BUNDLE'
        },
        description: `Credits Bundle: ${bundleConfig.credits} credits for $${bundleConfig.price}`,
        automatic_payment_methods: {
          enabled: true,
        }
      });

      // Store payment record
      await db.getClient()
        .from('payments')
        .insert({
          user_id: userId,
          stripe_payment_intent_id: paymentIntent.id,
          amount: bundleConfig.price,
          currency: 'USD',
          type: 'CREDITS_BUNDLE',
          status: 'PENDING',
          metadata: {
            bundleType,
            credits: bundleConfig.credits
          }
        });

      this.logger.info(`Payment intent created: ${paymentIntent.id} for user: ${userId}`);

      return {
        success: true,
        data: {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret!,
          amount: bundleConfig.price,
          currency: 'USD'
        }
      };
    } catch (error) {
      this.logger.error('Error creating credits bundle payment:', error);
      return {
        success: false,
        message: 'Failed to create payment'
      };
    }
  }

  // Create payment intent for game entry fee
  async createGameEntryPayment(
    userId: string,
    periodId: string,
    amount: number,
    customerEmail?: string
  ): Promise<{
    success: boolean;
    data?: {
      paymentIntentId: string;
      clientSecret: string;
      amount: number;
      currency: string;
    };
    message?: string;
  }> {
    try {
      // Get period info
      const period = await db.getPeriodById(periodId);
      if (!period) {
        return {
          success: false,
          message: 'Game period not found'
        };
      }

      // Create or get customer
      let customer: Stripe.Customer | null = null;
      if (customerEmail) {
        const existingCustomers = await this.stripe.customers.list({
          email: customerEmail,
          limit: 1
        });

        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
        } else {
          customer = await this.stripe.customers.create({
            email: customerEmail,
            metadata: { userId }
          });
        }
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: customer?.id,
        metadata: {
          userId,
          periodId,
          modeType: period.mode.type,
          type: 'ENTRY_FEE'
        },
        description: `Game Entry Fee: ${period.mode.name} - $${amount}`,
        automatic_payment_methods: {
          enabled: true,
        }
      });

      // Store payment record
      await db.getClient()
        .from('payments')
        .insert({
          user_id: userId,
          stripe_payment_intent_id: paymentIntent.id,
          amount,
          currency: 'USD',
          type: 'ENTRY_FEE',
          status: 'PENDING',
          metadata: {
            periodId,
            modeType: period.mode.type
          }
        });

      this.logger.info(`Entry fee payment intent created: ${paymentIntent.id} for user: ${userId}`);

      return {
        success: true,
        data: {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret!,
          amount,
          currency: 'USD'
        }
      };
    } catch (error) {
      this.logger.error('Error creating entry fee payment:', error);
      return {
        success: false,
        message: 'Failed to create payment'
      };
    }
  }

  // Handle Stripe webhook
  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is required');
      }

      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      this.logger.info(`Webhook received: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;

        default:
          this.logger.info(`Unhandled webhook event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error handling webhook:', error);
      return {
        success: false,
        message: 'Failed to process webhook'
      };
    }
  }

  // Handle successful payment
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      const { userId, type, bundleType, periodId, modeType } = paymentIntent.metadata;

      // Update payment record
      await db.getClient()
        .from('payments')
        .update({
          status: 'SUCCEEDED',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      if (type === 'CREDITS_BUNDLE' && bundleType) {
        // Process credits bundle purchase
        const result = await walletService.processCreditsPurchase(
          userId,
          bundleType as 'bundle100' | 'bundle1000',
          paymentIntent.id
        );

        if (result.success) {
          this.logger.info(`Credits bundle processed: ${userId}, bundle: ${bundleType}`);
        }

        // Analytics
        await db.createAnalyticsEvent({
          userId,
          eventName: 'credits_purchased',
          properties: {
            bundleType,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            paymentIntentId: paymentIntent.id
          }
        });

      } else if (type === 'ENTRY_FEE' && periodId && modeType) {
        // Handle entry fee payment - allow user to join the game
        this.logger.info(`Entry fee payment succeeded: ${userId}, period: ${periodId}`);

        // Analytics
        await db.createAnalyticsEvent({
          userId,
          eventName: 'entry_fee_paid',
          properties: {
            periodId,
            modeType,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            paymentIntentId: paymentIntent.id
          }
        });
      }

      // Create audit log
      await db.createAuditLog({
        userId,
        action: 'PAYMENT_SUCCEEDED',
        resource: 'payment',
        resourceId: paymentIntent.id,
        changes: {
          type,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency
        }
      });

    } catch (error) {
      this.logger.error('Error handling payment succeeded:', error);
    }
  }

  // Handle failed payment
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      const { userId } = paymentIntent.metadata;

      // Update payment record
      await db.getClient()
        .from('payments')
        .update({
          status: 'FAILED',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      // Analytics
      await db.createAnalyticsEvent({
        userId,
        eventName: 'payment_failed',
        properties: {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          failureReason: paymentIntent.last_payment_error?.message
        }
      });

      this.logger.warn(`Payment failed: ${paymentIntent.id} for user: ${userId}`);

    } catch (error) {
      this.logger.error('Error handling payment failed:', error);
    }
  }

  // Handle canceled payment
  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    try {
      const { userId } = paymentIntent.metadata;

      // Update payment record
      await db.getClient()
        .from('payments')
        .update({
          status: 'CANCELLED',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      // Analytics
      await db.createAnalyticsEvent({
        userId,
        eventName: 'payment_cancelled',
        properties: {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency
        }
      });

      this.logger.info(`Payment canceled: ${paymentIntent.id} for user: ${userId}`);

    } catch (error) {
      this.logger.error('Error handling payment canceled:', error);
    }
  }

  // Get payment status
  async getPaymentStatus(paymentIntentId: string): Promise<{
    success: boolean;
    data?: {
      status: string;
      amount: number;
      currency: string;
      type: string;
    };
  }> {
    try {
      const { data: payment } = await db.getClient()
        .from('payments')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (!payment) {
        return { success: false };
      }

      return {
        success: true,
        data: {
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          type: payment.type
        }
      };
    } catch (error) {
      this.logger.error('Error getting payment status:', error);
      return { success: false };
    }
  }

  // Get user's payment history
  async getUserPaymentHistory(
    userId: string,
    limit: number = 50
  ): Promise<{
    success: boolean;
    data?: any[];
  }> {
    try {
      const { data, error } = await db.getClient()
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      this.logger.error('Error getting payment history:', error);
      return { success: false };
    }
  }

  // Refund payment (admin function)
  async refundPayment(
    paymentIntentId: string,
    amount?: number,
    reason?: string,
    adminId?: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: { refundId: string };
  }> {
    try {
      // Get payment info
      const { data: payment } = await db.getClient()
        .from('payments')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (!payment) {
        return {
          success: false,
          message: 'Payment not found'
        };
      }

      if (payment.status !== 'SUCCEEDED') {
        return {
          success: false,
          message: 'Payment cannot be refunded'
        };
      }

      // Create refund with Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount provided
        reason: reason === 'fraudulent' ? 'fraudulent' : 'requested_by_customer',
        metadata: {
          adminId: adminId || 'system',
          reason: reason || 'admin_refund'
        }
      });

      // If it was a credits bundle, deduct the credits
      if (payment.type === 'CREDITS_BUNDLE' && payment.metadata?.bundleType) {
        const appConfig = config.getConfig();
        const bundleConfig = appConfig.credits.bundles[payment.metadata.bundleType as keyof typeof appConfig.credits.bundles];
        if (bundleConfig) {
          await walletService.deductCreditsForEntry(
            payment.user_id,
            bundleConfig.credits,
            'REFUND',
            `Refund for payment ${paymentIntentId}`
          );
        }
      }

      // Create audit log
      await db.createAuditLog({
        userId: adminId,
        action: 'PAYMENT_REFUNDED',
        resource: 'payment',
        resourceId: paymentIntentId,
        changes: {
          refundId: refund.id,
          refundAmount: refund.amount / 100,
          reason
        }
      });

      this.logger.info(`Payment refunded: ${paymentIntentId}, refund: ${refund.id}`);

      return {
        success: true,
        message: 'Payment refunded successfully',
        data: { refundId: refund.id }
      };
    } catch (error) {
      this.logger.error('Error refunding payment:', error);
      return {
        success: false,
        message: 'Failed to refund payment'
      };
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean;
    data?: {
      totalRevenue: number;
      totalTransactions: number;
      creditsBundleRevenue: number;
      entryFeeRevenue: number;
      averageTransactionValue: number;
      successRate: number;
    };
  }> {
    try {
      const { data: payments } = await db.getClient()
        .from('payments')
        .select('amount, type, status')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (!payments) {
        return { success: false };
      }

      const succeededPayments = payments.filter(p => p.status === 'SUCCEEDED');
      const totalRevenue = succeededPayments.reduce((sum, p) => sum + p.amount, 0);
      const creditsBundleRevenue = succeededPayments
        .filter(p => p.type === 'CREDITS_BUNDLE')
        .reduce((sum, p) => sum + p.amount, 0);
      const entryFeeRevenue = succeededPayments
        .filter(p => p.type === 'ENTRY_FEE')
        .reduce((sum, p) => sum + p.amount, 0);

      const analytics = {
        totalRevenue,
        totalTransactions: payments.length,
        creditsBundleRevenue,
        entryFeeRevenue,
        averageTransactionValue: succeededPayments.length > 0 
          ? totalRevenue / succeededPayments.length 
          : 0,
        successRate: payments.length > 0 
          ? (succeededPayments.length / payments.length) * 100 
          : 0
      };

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      this.logger.error('Error getting payment analytics:', error);
      return { success: false };
    }
  }

  // Validate payment for game entry
  async validateEntryPayment(userId: string, periodId: string): Promise<{
    success: boolean;
    isPaid: boolean;
    paymentIntentId?: string;
  }> {
    try {
      const { data: payment } = await db.getClient()
        .from('payments')
        .select('stripe_payment_intent_id, status')
        .eq('user_id', userId)
        .eq('type', 'ENTRY_FEE')
        .contains('metadata', { periodId })
        .eq('status', 'SUCCEEDED')
        .single();

      return {
        success: true,
        isPaid: !!payment,
        paymentIntentId: payment?.stripe_payment_intent_id
      };
    } catch (error) {
      this.logger.error('Error validating entry payment:', error);
      return {
        success: false,
        isPaid: false
      };
    }
  }
}

export const paymentService = new PaymentService();