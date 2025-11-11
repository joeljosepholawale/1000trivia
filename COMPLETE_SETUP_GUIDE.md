# 🚀 Complete Setup & Launch Guide - 1000 Ravier

## 📋 Overview
This guide walks you through setting up and launching the complete 1000 Ravier Q&A competition app with all features integrated and ready to test.

---

## 🎯 What's Integrated & Ready

### ✅ Backend Features
- **Express.js API** with Supabase database
- **Authentication System** (JWT-based)
- **Wallet & Credits Economy** (daily claims, ad rewards, purchases)
- **Payment Processing** (Stripe integration ready)
- **Game Session Management** (4 game modes with credit-based entry)
- **Leaderboard System** (real-time rankings, winners, statistics)
- **Anti-cheat Mechanisms** (device tracking, rate limiting)
- **Question Management** with AI generation scripts

### ✅ Mobile Features
- **React Native + Expo** mobile app
- **Redux State Management** (wallet, game, leaderboard, ads)
- **Ad Integration** (AdMob with test ads)
- **Payment System** (Stripe for credit purchases)
- **Leaderboard Screens** (rankings, winners, stats, history)
- **Enhanced Credit Store** (buy credits or watch ads)
- **Game Flow** integrated with wallet/credits
- **Beautiful UI/UX** with animations and loading states

---

## 🛠️ Prerequisites

Before you begin, ensure you have:

- **Node.js** v18+ installed
- **npm** v9+ installed
- **Git** installed
- **Expo CLI** (`npm install -g expo-cli`)
- **Supabase Account** (free tier works)
- **Stripe Account** (for production payments)
- **Google AdMob Account** (optional, using test ads for now)

---

## 📦 Step 1: Install All Dependencies

### Root Dependencies
```bash
# From project root
cd c:/Projects/1000ravier-mobileapp
npm install
```

### Backend Dependencies
```bash
cd packages/backend
npm install
```

### Mobile Dependencies
```bash
cd packages/mobile
npm install
```

### Shared Dependencies
```bash
cd packages/shared
npm install
```

---

## 🗄️ Step 2: Database Setup

### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database provisioning (2-3 minutes)
4. Note your **Project URL** and **Anon Key**

### 2.2 Run Database Migrations
1. Go to Supabase Dashboard → SQL Editor
2. Open `packages/backend/supabase/migrations/20231018000000_initial_schema.sql`
3. Copy all content and paste into SQL Editor
4. Click **Run** to create all tables, indexes, and policies

### 2.3 Verify Tables Created
Check that these tables exist:
- ✅ users
- ✅ game_modes
- ✅ periods
- ✅ questions
- ✅ game_sessions
- ✅ leaderboard_entries
- ✅ winners
- ✅ wallets
- ✅ wallet_transactions
- ✅ payments
- ✅ And 10+ more...

---

## ⚙️ Step 3: Environment Configuration

### 3.1 Backend Environment Variables

Create `packages/backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Stripe Configuration (Test Keys for now)
STRIPE_SECRET_KEY=sk_test_your_stripe_test_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Admin Configuration
ADMIN_API_KEY=your-secure-admin-api-key-for-cron-jobs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Google AI (for question generation)
GOOGLE_CLOUD_API_KEY=your-google-gemini-api-key
```

### 3.2 Mobile Environment Variables

The mobile app uses `src/config/app.ts` and `src/config/index.ts` - already configured with test values!

**Current Configuration:**
- ✅ **AdMob Test Ads** enabled
- ✅ **API URL**: `http://localhost:3000/api` (development)
- ✅ **Stripe Test Keys** placeholder (add your keys)
- ✅ **Features Enabled**: Ads, Payments, Leaderboards, Daily Claims

---

## 🌱 Step 4: Seed Sample Data

### 4.1 Seed Questions
```bash
cd packages/backend
npm run seed:questions
```

This will add 30 sample trivia questions to get you started.

### 4.2 Optional: Generate Questions with AI
If you have a Google Gemini API key:

```bash
# Set your API key
set GOOGLE_CLOUD_API_KEY=your-api-key

# Generate general questions
node generate_questions.js

# Generate industry-specific questions
node industry_specific_questions.js
```

### 4.3 Create Initial Game Periods

Run this SQL in Supabase SQL Editor:

```sql
-- Create active weekly FREE mode period
INSERT INTO periods (mode_id, start_date, end_date, status, total_participants, total_questions)
SELECT 
    id,
    NOW(),
    NOW() + INTERVAL '7 days',
    'ACTIVE',
    0,
    0
FROM game_modes WHERE type = 'FREE';

-- Create active monthly CHALLENGE mode period
INSERT INTO periods (mode_id, start_date, end_date, status, total_participants, total_questions)
SELECT 
    id,
    NOW(),
    NOW() + INTERVAL '30 days',
    'ACTIVE',
    0,
    0
FROM game_modes WHERE type = 'CHALLENGE';
```

---

## 🚀 Step 5: Launch the Application

### 5.1 Start Backend Server

```bash
# Terminal 1 - Backend
cd packages/backend
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 3000
📚 API documentation available at http://localhost:3000/health
```

### 5.2 Test Backend Health

Open browser or use curl:
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-...",
    "database": "connected",
    "version": "1.0.0"
  }
}
```

### 5.3 Start Mobile App

```bash
# Terminal 2 - Mobile App
cd packages/mobile
npm start
```

**Choose your platform:**
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Press `w` for web browser
- Scan QR code with Expo Go app on physical device

---

## 🧪 Step 6: Test All Features

### 6.1 Test Authentication
1. **Launch app** on your device/emulator
2. **Sign up** with email/password
3. **Verify** you're logged in and see main screen

### 6.2 Test Wallet System
1. Navigate to **Wallet** tab
2. **Claim daily credits** (should get 10 credits)
3. Check **Transaction History**
4. View **Wallet Balance**

### 6.3 Test Ad Integration (Test Ads)
1. Go to **Enhanced Credit Store** from Wallet
2. Toggle **"Enable Ads"** ON
3. Tap **"Watch Rewarded Video"**
4. Watch the test ad (can skip after 5 seconds)
5. Verify credits added to balance

### 6.4 Test Game Flow
1. Navigate to **Game** tab
2. Select **FREE Weekly** mode (no entry fee)
3. Start game session
4. Answer some questions
5. Check credits weren't deducted (FREE mode)

### 6.5 Test Credit Entry Fee
1. Select **TOURNAMENT** mode (1000 credits entry)
2. Ensure you have 1000+ credits
3. Start game
4. Verify 1000 credits deducted from wallet
5. Play through questions

### 6.6 Test Leaderboard
1. Navigate to **Leaderboard** tab
2. Check **Current Rankings** screen
3. View **Winners** screen
4. Check **Your Stats** screen
5. Browse **History** screen
6. Pull to refresh on any screen

### 6.7 Test Payment Flow (Mock)
1. Go to **Enhanced Credit Store**
2. Select a **Credit Bundle** (e.g., $4.99 pack)
3. Tap **Purchase**
4. Confirm in dialog
5. Test payment processes (mock success/failure)
6. Verify credits added on success

---

## 🔍 Step 7: Verify Everything Works

### Backend Health Checks
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test config endpoint (requires auth)
curl http://localhost:3000/api/config

# Check logs
tail -f packages/backend/logs/app.log
```

### Database Verification
Check Supabase Dashboard:
- **Table Editor** → Verify data in tables
- **users** → Should have your test user
- **wallets** → Should have wallet for your user
- **wallet_transactions** → Should have transaction records
- **questions** → Should have 30+ questions

### Mobile App Checks
- ✅ No red error screens
- ✅ Navigation works smoothly
- ✅ Redux state persists (close & reopen app)
- ✅ API calls successful (check Network tab in React Native Debugger)
- ✅ Test ads load and show
- ✅ All screens render correctly

---

## 📊 Step 8: API Endpoints Reference

### Public Endpoints
- `GET /health` - Health check
- `GET /api/config` - App configuration

### Auth Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Wallet Endpoints
- `GET /api/wallet/info` - Get wallet info
- `POST /api/wallet/claim-daily` - Claim daily credits
- `POST /api/wallet/claim-ad-reward` - Claim ad reward
- `GET /api/wallet/credit-bundles` - Get available bundles
- `GET /api/wallet/transactions` - Get transaction history
- `GET /api/wallet/stats` - Get wallet statistics

### Game Endpoints
- `GET /api/game/modes` - Get available game modes
- `GET /api/game/periods` - Get active periods
- `POST /api/game/join` - Join a game period
- `GET /api/game/session/:id` - Get session details
- `GET /api/game/questions/:sessionId` - Get questions
- `POST /api/game/answer` - Submit answer
- `GET /api/game/results/:sessionId` - Get session results

### Leaderboard Endpoints
- `GET /api/leaderboard/current/:periodId` - Current rankings
- `GET /api/leaderboard/my-rank/:periodId` - User's rank
- `GET /api/leaderboard/winners/:periodId` - Period winners
- `GET /api/leaderboard/history` - Historical periods

### Payment Endpoints
- `POST /api/payment/create-intent` - Create payment intent
- `GET /api/payment/status/:intentId` - Get payment status
- `POST /api/payment/webhook` - Stripe webhook (for Stripe only)

---

## 🐛 Troubleshooting

### Backend Issues

**Issue: Database connection failed**
```bash
# Check environment variables
cat packages/backend/.env

# Verify Supabase URL and keys are correct
# Test connection from Supabase dashboard
```

**Issue: Port 3000 already in use**
```bash
# Change PORT in .env file
PORT=3001

# Or kill process using port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Issue: JWT errors**
```bash
# Regenerate JWT_SECRET
# Use a strong random string
JWT_SECRET=$(openssl rand -base64 32)
```

### Mobile App Issues

**Issue: Can't connect to backend**
```javascript
// For Android emulator, use 10.0.2.2 instead of localhost
// Edit packages/mobile/src/config/app.ts
BASE_URL: 'http://10.0.2.2:3000/api'
```

**Issue: Ads not loading**
```
This is expected! You're using test ad units.
Test ads should load. If they don't:
1. Check internet connection
2. Restart Metro bundler
3. Clear cache: expo start -c
```

**Issue: Stripe payment fails**
```
Using mock payments for now. Real Stripe requires:
1. Valid Stripe test keys
2. Backend webhook endpoint setup
3. Mobile app Stripe configuration
```

**Issue: Redux state not persisting**
```bash
# Clear cache and restart
cd packages/mobile
expo start -c
```

### Common Errors

**Error: Module not found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: Expo build failed**
```bash
# Clear Expo cache
expo start -c

# Or rebuild
expo prebuild --clean
```

**Error: TypeScript errors**
```bash
# Rebuild shared package
cd packages/shared
npm run build

# Restart TypeScript server in your IDE
```

---

## 🎨 Customization Guide

### Change App Branding
1. **App Name**: Edit `packages/mobile/app.json` → `name` and `slug`
2. **Colors**: Edit `packages/mobile/src/styles/colors.ts`
3. **Logo**: Replace `packages/mobile/assets/icon.png`
4. **Splash Screen**: Replace `packages/mobile/assets/splash.png`

### Adjust Credit Economy
Edit `packages/shared/src/config.ts`:
```typescript
credits: {
  dailyClaimAmount: 10,      // Change daily credit amount
  adRewardAmount: 1,          // Change ad reward amount
  adRewardDailyLimit: 10,     // Change max ads per day
}
```

### Modify Game Modes
Edit `packages/shared/src/config.ts`:
```typescript
modes: {
  free: {
    questions: 1000,      // Number of questions
    entryFee: 0,          // Entry fee (0 = free)
    payout: 100,          // Prize pool in USD
    // ... other settings
  }
}
```

### Configure Ad Settings
Edit `packages/mobile/src/config/app.ts`:
```typescript
ADS_CONFIG: {
  MAX_ADS_PER_DAY: 10,           // Max ads user can watch
  MIN_AD_INTERVAL_MINUTES: 3,    // Cooldown between ads
  REWARD_AMOUNTS: {
    rewarded_video: 50,           // Credits per rewarded video
    interstitial: 25,             // Credits per interstitial
  }
}
```

---

## 📱 Building for Production

### Android Build
```bash
cd packages/mobile
expo build:android

# Or with EAS Build
eas build --platform android
```

### iOS Build
```bash
cd packages/mobile
expo build:ios

# Or with EAS Build
eas build --platform ios
```

### Before Production:
1. ✅ Replace test Stripe keys with live keys
2. ✅ Replace test AdMob IDs with production IDs
3. ✅ Update `packages/mobile/app.json` with real project ID
4. ✅ Configure Stripe webhooks for production domain
5. ✅ Set up proper backend hosting (Railway, Heroku, AWS, etc.)
6. ✅ Configure production Supabase project
7. ✅ Enable analytics and crash reporting
8. ✅ Test on real devices extensively
9. ✅ Review and accept App Store/Play Store guidelines

---

## 🎉 You're All Set!

Your 1000 Ravier app is now fully integrated and ready to test!

### What You Have Now:
- ✅ Complete backend API with database
- ✅ Mobile app with all features integrated
- ✅ Wallet system with credits economy
- ✅ Ad integration (test ads working)
- ✅ Payment system (mock/test mode)
- ✅ Game sessions with credit-based entry
- ✅ Leaderboard system with 4 screens
- ✅ Question management with AI generation
- ✅ Anti-cheat mechanisms
- ✅ Beautiful UI/UX

### Next Steps:
1. **Test extensively** with the guide above
2. **Add more questions** using AI generators
3. **Customize branding** and colors
4. **Get production API keys** (Stripe, AdMob)
5. **Deploy backend** to hosting service
6. **Submit to app stores** when ready

### Need Help?
- Check troubleshooting section above
- Review code comments in source files
- Check integration guides in `packages/mobile/INTEGRATION_GUIDE.md`
- Check backend guide in `packages/backend/BACKEND_INTEGRATION.md`

---

## 📞 Support & Resources

**Documentation:**
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [AdMob Documentation](https://developers.google.com/admob)

**Community:**
- [React Native Community](https://reactnative.dev/community/overview)
- [Expo Forums](https://forums.expo.dev/)
- [Supabase Discord](https://discord.supabase.com/)

---

**Happy Building! 🚀**
