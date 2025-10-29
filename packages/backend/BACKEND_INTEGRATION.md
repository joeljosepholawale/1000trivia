# Backend Integration Guide

This guide walks you through integrating the new wallet, payment, and leaderboard systems with your existing backend.

## 1. Database Setup

### Step 1: Run the SQL Schema Script
Execute the `schema-update.sql` file in your Supabase dashboard:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `schema-update.sql`
3. Click "Run" to create all new tables and functions

### Step 2: Verify Tables Created
Check that these tables were created:
- `ad_rewards`
- `payments` 
- `leaderboard_periods`
- `leaderboard_entries`
- `leaderboard_winners`
- `credit_bundles`
- `user_achievements`
- `transactions`

## 2. Environment Variables

Add these environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Admin API Key (for cron jobs)
ADMIN_API_KEY=your-secure-api-key

# AdMob Configuration (optional)
ADMOB_APP_ID=ca-app-pub-...
ADMOB_REWARDED_AD_UNIT_ID=ca-app-pub-.../...
ADMOB_INTERSTITIAL_AD_UNIT_ID=ca-app-pub-.../...
```

## 3. Install Dependencies

```bash
cd packages/backend
npm install stripe winston
```

## 4. Service Integration

### Step 1: Update your main app.ts file

Add these routes to your Express app:

```typescript
import walletRoutes from './routes/wallet-updated';
import paymentRoutes from './routes/payments';
import leaderboardRoutes from './routes/leaderboard';

// Add these after your existing routes
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
```

### Step 2: Replace existing wallet service

1. Backup your current `src/services/wallet.ts`
2. Replace it with `wallet-updated.ts`
3. Update all imports throughout your codebase

### Step 3: Add missing middleware

Create `src/middleware/validation.ts` if it doesn't exist:

```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodSchema, source: 'body' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : req.query;
      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
};
```

## 5. Database Profile Updates

Update your `profiles` table to include new fields:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_winnings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ad_rewards INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ads_watched_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_claim TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_ad_watch_date DATE;
```

## 6. API Endpoint Testing

### Test Wallet Endpoints

```bash
# Get wallet info
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:3000/api/wallet/info

# Claim daily credits
curl -X POST -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:3000/api/wallet/claim-daily

# Claim ad reward
curl -X POST -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"adType": "rewarded_video"}' \
  http://localhost:3000/api/wallet/claim-ad-reward

# Get credit bundles
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:3000/api/wallet/credit-bundles
```

### Test Payment Endpoints

```bash
# Create payment intent
curl -X POST -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"bundleId": "bundle-id", "currency": "usd"}' \
  http://localhost:3000/api/payments/create-intent

# Get payment status
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:3000/api/payments/status/payment-intent-id
```

### Test Leaderboard Endpoints

```bash
# Get current leaderboard
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:3000/api/leaderboard/current

# Get user rank
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:3000/api/leaderboard/my-rank
```

## 7. Stripe Webhook Setup

### Step 1: Create webhook endpoint in Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourapi.com/api/payments/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
4. Copy the webhook secret to your environment variables

### Step 2: Test webhook locally (development)

Use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

## 8. Credit Bundle Setup

Insert initial credit bundles:

```sql
INSERT INTO credit_bundles (name, description, credits, price_usd, bonus_percentage, is_popular, sort_order) VALUES
('Starter Pack', '100 credits to get started', 100, 0.99, 0, false, 1),
('Value Pack', '500 credits + 10% bonus', 550, 4.99, 10, false, 2),
('Popular Pack', '1200 credits + 20% bonus', 1440, 9.99, 20, true, 3),
('Mega Pack', '2500 credits + 25% bonus', 3125, 19.99, 25, false, 4),
('Ultimate Pack', '5500 credits + 30% bonus', 7150, 39.99, 30, false, 5);
```

## 9. Cron Jobs Setup

Set up daily tasks:

### Reset daily ad counts (runs at midnight)
```bash
# Add to crontab
0 0 * * * curl -X POST -H "x-api-key: YOUR_ADMIN_API_KEY" \
  https://yourapi.com/api/wallet/admin/reset-daily-ads
```

### Process leaderboard periods (runs weekly)
```bash
# Add to crontab - runs Sunday at 11:59 PM
59 23 * * 0 curl -X POST -H "x-api-key: YOUR_ADMIN_API_KEY" \
  https://yourapi.com/api/leaderboard/admin/finalize-period
```

## 10. Game Integration

### Deduct credits for game entry

```typescript
// In your game service
import { walletService } from '../services/wallet-updated';

async function startGame(userId: string, gameType: string) {
  const entryFee = getEntryFee(gameType); // e.g., 50 credits
  
  const result = await walletService.deductCreditsForEntry(
    userId,
    entryFee,
    `Game entry - ${gameType}`,
    gameId
  );
  
  if (!result.success) {
    throw new Error(result.error || 'Insufficient credits');
  }
  
  // Proceed with game creation
  return result.data.newBalance;
}
```

### Award credits for game wins

```typescript
async function processGameWin(userId: string, winAmount: number, gameId: string) {
  // Add credits to user's balance
  await db.getClient()
    .from('profiles')
    .update({
      credits_balance: db.getClient().sql`credits_balance + ${winAmount}`,
      total_winnings: db.getClient().sql`total_winnings + ${winAmount}`,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  // Create transaction record
  await db.getClient()
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'CREDIT',
      amount: winAmount,
      description: 'Game win',
      category: 'game_win',
      reference_id: gameId
    });
}
```

## 11. Frontend API Client Updates

Update your mobile app's API client to include the new endpoints:

```typescript
// Add to your api client
export const walletApi = {
  getInfo: () => get('/wallet/info'),
  claimDaily: () => post('/wallet/claim-daily'),
  claimAdReward: (adType: string, deviceInfo?: any) => 
    post('/wallet/claim-ad-reward', { adType, deviceInfo }),
  getCreditBundles: () => get('/wallet/credit-bundles'),
  getTransactions: (params?: any) => get('/wallet/transactions', params),
  getStats: () => get('/wallet/stats')
};

export const paymentApi = {
  createIntent: (bundleId: string) => 
    post('/payments/create-intent', { bundleId, currency: 'usd' }),
  getStatus: (paymentIntentId: string) => 
    get(`/payments/status/${paymentIntentId}`)
};

export const leaderboardApi = {
  getCurrent: (limit?: number) => get('/leaderboard/current', { limit }),
  getMyRank: () => get('/leaderboard/my-rank'),
  getWinners: (period?: string) => get('/leaderboard/winners', { period })
};
```

## 12. Testing Checklist

- [ ] Database tables created successfully
- [ ] Environment variables configured
- [ ] New dependencies installed
- [ ] Wallet service endpoints responding
- [ ] Payment endpoints responding  
- [ ] Leaderboard endpoints responding
- [ ] Stripe webhook receiving events
- [ ] Credit bundles populated
- [ ] Daily ad reset working
- [ ] Game integration working
- [ ] Mobile app connecting to new endpoints

## Next Steps

1. **Complete Backend Integration** - Follow this guide to set up all services
2. **Test All Endpoints** - Verify each API endpoint works correctly
3. **Mobile App Integration** - Update your mobile app to use the new APIs
4. **Production Setup** - Replace test keys with production keys
5. **Monitoring** - Add logging and error tracking
6. **Analytics** - Track user engagement with new features

## Troubleshooting

### Common Issues

1. **Database connection errors** - Check Supabase credentials
2. **Stripe webhook not receiving events** - Verify webhook URL and secret
3. **Authentication failures** - Check JWT token validation
4. **CORS errors** - Update CORS configuration for new endpoints

### Debug Mode

Add debug logging:
```typescript
// Add to your services
console.log('Debug: Processing payment', { userId, bundleId, paymentIntentId });
```

Enable detailed error responses in development:
```typescript
if (process.env.NODE_ENV === 'development') {
  res.status(500).json({ error: error.message, stack: error.stack });
}
```