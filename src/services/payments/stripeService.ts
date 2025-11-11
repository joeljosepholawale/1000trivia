import {initPaymentSheet, presentPaymentSheet, confirmPaymentSheetPayment} from '@stripe/stripe-react-native';
import {walletAPI} from '../api/wallet';

export interface PaymentIntent {
  clientSecret: string;
  ephemeralKey: string;
  customerId: string;
  publishableKey: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

class StripeService {
  private isInitialized = false;

  async initialize(publishableKey: string): Promise<void> {
    try {
      if (this.isInitialized) return;

      // The Stripe initialization is handled by the StripeProvider wrapper
      // This method can be used for additional setup if needed
      this.isInitialized = true;
      console.log('Stripe service initialized');
    } catch (error) {
      console.error('Failed to initialize Stripe service:', error);
      throw error;
    }
  }

  /**
   * Create payment intent for credit bundle purchase
   */
  async createPaymentIntent(bundleId: string): Promise<PaymentIntent> {
    try {
      const response = await walletAPI.createPaymentIntent(bundleId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create payment intent');
      }

      return {
        clientSecret: response.data.clientSecret,
        ephemeralKey: response.data.ephemeralKey,
        customerId: response.data.customerId,
        publishableKey: response.data.publishableKey,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Initialize and present Stripe payment sheet
   */
  async presentPaymentSheet(paymentIntent: PaymentIntent): Promise<PaymentResult> {
    try {
      // Initialize the payment sheet
      const {error: initError} = await initPaymentSheet({
        merchantDisplayName: '1000 Ravier',
        customerId: paymentIntent.customerId,
        customerEphemeralKeySecret: paymentIntent.ephemeralKey,
        paymentIntentClientSecret: paymentIntent.clientSecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: 'Your Name',
        },
        appearance: {
          colors: {
            primary: '#007AFF', // Your app's primary color
            background: '#FFFFFF',
            componentBackground: '#F7F7F7',
            componentBorder: '#E5E5E5',
            componentDivider: '#E5E5E5',
            primaryText: '#000000',
            secondaryText: '#666666',
            componentText: '#000000',
            placeholderText: '#999999',
          },
          shapes: {
            borderRadius: 8,
            borderWidth: 1,
          },
        },
      });

      if (initError) {
        console.error('Error initializing payment sheet:', initError);
        return {success: false, error: initError.message};
      }

      // Present the payment sheet
      const {error: presentError} = await presentPaymentSheet();

      if (presentError) {
        console.error('Error presenting payment sheet:', presentError);
        
        if (presentError.code === 'Canceled') {
          return {success: false, error: 'Payment cancelled by user'};
        }
        
        return {success: false, error: presentError.message};
      }

      // Payment was successful
      console.log('Payment completed successfully');
      return {success: true};

    } catch (error) {
      console.error('Unexpected error in payment sheet:', error);
      return {
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown payment error'
      };
    }
  }

  /**
   * Confirm payment with backend after successful payment
   */
  async confirmPayment(paymentIntentId: string): Promise<{success: boolean; credits?: number}> {
    try {
      const response = await walletAPI.confirmPayment(paymentIntentId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to confirm payment');
      }

      return {
        success: true,
        credits: response.data.creditsAdded,
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {success: false};
    }
  }

  /**
   * Complete payment flow for a credit bundle
   */
  async purchaseCredits(bundleId: string): Promise<{
    success: boolean;
    credits?: number;
    error?: string;
  }> {
    try {
      // Step 1: Create payment intent
      console.log('Creating payment intent for bundle:', bundleId);
      const paymentIntent = await this.createPaymentIntent(bundleId);

      // Step 2: Present payment sheet
      console.log('Presenting payment sheet');
      const paymentResult = await this.presentPaymentSheet(paymentIntent);

      if (!paymentResult.success) {
        return {
          success: false,
          error: paymentResult.error || 'Payment failed',
        };
      }

      // Step 3: Confirm payment with backend (optional - Stripe webhooks usually handle this)
      // This step depends on your backend implementation
      console.log('Payment completed successfully');

      return {success: true};

    } catch (error) {
      console.error('Error in complete purchase flow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  /**
   * Handle refund request
   */
  async requestRefund(paymentIntentId: string, reason?: string): Promise<{success: boolean; error?: string}> {
    try {
      const response = await walletAPI.requestRefund(paymentIntentId, reason);
      
      if (!response.success) {
        throw new Error(response.error || 'Refund request failed');
      }

      return {success: true};
    } catch (error) {
      console.error('Error requesting refund:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund request failed',
      };
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(limit: number = 20, offset: number = 0): Promise<{
    success: boolean;
    payments?: any[];
    error?: string;
  }> {
    try {
      const response = await walletAPI.getTransactionHistory({
        type: 'credit',
        limit,
        offset,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch payment history');
      }

      // Filter for payment transactions
      const payments = response.data.transactions.filter(
        (transaction: any) => transaction.type === 'credit_purchase'
      );

      return {
        success: true,
        payments,
      };
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payment history',
      };
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();

// Demo/Mock service for development
export class MockStripeService {
  async purchaseCredits(bundleId: string): Promise<{
    success: boolean;
    credits?: number;
    error?: string;
  }> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock bundle credit amounts
    const bundleCredits: Record<string, number> = {
      'bundle_small': 100,
      'bundle_medium': 500,
      'bundle_large': 1200,
      'bundle_mega': 2500,
    };

    const credits = bundleCredits[bundleId] || 100;

    // Simulate 10% failure rate for testing
    if (Math.random() < 0.1) {
      return {
        success: false,
        error: 'Mock payment failed - please try again',
      };
    }

    console.log(`Mock purchase successful: ${credits} credits for bundle ${bundleId}`);
    
    return {
      success: true,
      credits,
    };
  }

  async requestRefund(paymentIntentId: string, reason?: string): Promise<{success: boolean; error?: string}> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Mock refund requested for payment ${paymentIntentId}, reason: ${reason}`);
    
    return {success: true};
  }
}

// Use mock service in development
export const paymentService = __DEV__ ? new MockStripeService() : stripeService;