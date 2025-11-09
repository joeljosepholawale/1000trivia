# 📊 Complete Database Schema Guide

## Overview

This document explains the complete Supabase database schema for 1000 Ravier Q&A competition app.

---

## 🗂️ Table Categories

### 1. Core User & Authentication (3 tables)
- **users** - Main user accounts (extends Supabase auth)
- **user_profiles** - Additional user information
- **wallets** - User credit balances and statistics

### 2. Game System (7 tables)
- **game_modes** - Competition types (FREE, CHALLENGE, TOURNAMENT, SUPER_TOURNAMENT)
- **periods** - Competition time periods (weekly/monthly)
- **questions** - Trivia questions with options
- **game_sessions** - Individual game instances
- **session_questions** - Randomized questions per session
- **answers** - User answers to questions
- **leaderboard_entries** - Rankings within periods

### 3. Payments & Monetization (6 tables)
- **wallet_transactions** - All credit movements
- **credit_bundles** - In-app purchase packages
- **payments** - Stripe payment records
- **ad_rewards** - Ad watch tracking
- **payout_methods** - User payout account details
- **payouts** - Prize money distributions

### 4. Competition & Prizes (1 table)
- **winners** - Competition winners and prize status

### 5. Social & Engagement (3 tables)
- **achievements** - Achievement definitions
- **user_achievements** - User progress on achievements
- **referrals** - Referral program tracking

### 6. Analytics & Audit (3 tables)
- **analytics_events** - App event tracking
- **audit_logs** - Admin action logging
- **system_logs** - Error and system logs

---

## 📋 Key Tables Explained

### Users Table
```sql
users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    full_name TEXT,
    credits_balance → moved to wallets table
    total_games_played INTEGER,
    total_games_won INTEGER,
    win_rate DECIMAL,
    lifetime_earnings_ngn DECIMAL,
    referral_code TEXT UNIQUE,
    is_banned BOOLEAN,
    ...
)
```

**Purpose:** Central user account with gaming statistics and reputation.

**Key Fields:**
- `referral_code` - Unique code for referral program
- `lifetime_earnings_ngn` - Total money won (Nigerian Naira)
- `win_rate` - Calculated percentage of games won
- `is_banned` - Anti-cheat ban status

### Wallets Table
```sql
wallets (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE,
    credits_balance INTEGER,
    bonus_credits INTEGER,
    last_daily_claim_at TIMESTAMPTZ,
    daily_claim_streak INTEGER,
    ad_rewards_today INTEGER,
    total_credits_earned INTEGER,
    total_credits_spent INTEGER,
    lifetime_value DECIMAL, -- Total money spent
    ...
)
```

**Purpose:** Manage user virtual currency and daily rewards.

**Key Features:**
- Tracks daily claim streaks
- Limits ad rewards per day
- Records lifetime spending for VIP tracking

### Game Modes Table
```sql
game_modes (
    id UUID PRIMARY KEY,
    type mode_type ENUM, -- FREE, CHALLENGE, TOURNAMENT, SUPER_TOURNAMENT
    name TEXT,
    questions INTEGER,
    entry_fee DECIMAL,
    entry_fee_currency TEXT, -- USD or CREDITS
    payout DECIMAL,
    min_answers_to_qualify INTEGER,
    period_type period_type, -- WEEKLY, MONTHLY
    max_winners INTEGER,
    is_active BOOLEAN,
    ...
)
```

**Purpose:** Define competition types with their rules and prizes.

**Pre-seeded Modes:**
1. **FREE** - 1000 questions, $0 entry, $100 prize, weekly
2. **CHALLENGE** - 100 questions, $10 entry, $1,000 prize, monthly
3. **TOURNAMENT** - 1000 questions, 1000 credits entry, $10,000 prize, monthly
4. **SUPER_TOURNAMENT** - 1000 questions, 10,000 credits entry, $100,000 prize, monthly

### Periods Table
```sql
periods (
    id UUID PRIMARY KEY,
    mode_id UUID REFERENCES game_modes,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status period_status, -- UPCOMING, ACTIVE, COMPLETED, CANCELLED
    total_participants INTEGER,
    prize_pool DECIMAL,
    winner_announced BOOLEAN,
    ...
)
```

**Purpose:** Time-bound competition instances.

**Workflow:**
1. Create period with UPCOMING status
2. Automatically activate when start_date reached
3. Users join and play during active period
4. Mark COMPLETED when end_date reached
5. Calculate winners and distribute prizes

### Game Sessions Table
```sql
game_sessions (
    id UUID PRIMARY KEY,
    user_id UUID,
    period_id UUID,
    status session_status, -- ACTIVE, COMPLETED, EXPIRED
    score INTEGER,
    answered_questions INTEGER,
    correct_answers INTEGER,
    average_response_time DECIMAL,
    is_flagged BOOLEAN, -- Anti-cheat
    device_info JSONB,
    ip_address INET,
    ...
    UNIQUE(user_id, period_id) -- One session per user per period
)
```

**Purpose:** Individual game instance tracking.

**Anti-Cheat Features:**
- Device and IP tracking
- Response time monitoring
- Flagging system for suspicious activity
- One session per user per period

### Questions Table
```sql
questions (
    id UUID PRIMARY KEY,
    text TEXT,
    options JSONB, -- Array of answer options
    correct_answer TEXT,
    explanation TEXT,
    language TEXT,
    category TEXT,
    difficulty difficulty_level, -- EASY, MEDIUM, HARD
    is_active BOOLEAN,
    times_used INTEGER,
    success_rate DECIMAL, -- Auto-calculated
    ...
)
```

**Purpose:** Question bank with analytics.

**Features:**
- Automatic success rate calculation
- Usage tracking
- Multi-language support
- Categories for filtering

### Leaderboard Entries Table
```sql
leaderboard_entries (
    id UUID PRIMARY KEY,
    user_id UUID,
    period_id UUID,
    rank INTEGER,
    score INTEGER,
    average_response_time DECIMAL,
    is_qualified BOOLEAN,
    is_winner BOOLEAN,
    prize_amount DECIMAL,
    ...
    UNIQUE(user_id, period_id)
)
```

**Purpose:** Rankings within each competition period.

**Ranking Criteria (in order):**
1. Highest score
2. Lowest average response time
3. Earliest completion time

### Credit Bundles Table
```sql
credit_bundles (
    id UUID PRIMARY KEY,
    bundle_id TEXT UNIQUE, -- e.g., 'starter_pack'
    name TEXT,
    credits INTEGER,
    bonus_credits INTEGER,
    price_usd DECIMAL,
    is_popular BOOLEAN, -- Highlight in UI
    badge_text TEXT, -- 'BEST VALUE', 'LIMITED'
    stripe_price_id TEXT,
    ...
)
```

**Purpose:** Define in-app purchase packages.

**Pre-seeded Bundles:**
- Starter: 1000 credits - $0.99
- Popular: 5500 credits (10% bonus) - $4.99
- Pro: 12000 credits (20% bonus) - $9.99
- Champion: 27500 credits (37% bonus) - $19.99

### Achievements Table
```sql
achievements (
    id UUID PRIMARY KEY,
    achievement_key TEXT UNIQUE,
    name TEXT,
    description TEXT,
    category TEXT, -- 'games', 'wins', 'streaks'
    tier TEXT, -- 'bronze', 'silver', 'gold', 'platinum'
    credits_reward INTEGER,
    requirement_type TEXT, -- 'total', 'streak', 'single_game'
    requirement_value INTEGER,
    is_hidden BOOLEAN, -- Secret achievements
    ...
)
```

**Purpose:** Define achievements with rewards.

**Examples:**
- First game completed → 100 credits
- 5 game win streak → 500 credits
- Perfect game (100% correct) → 1000 credits

---

## 🔄 Key Relationships

### User → Games Flow
```
users
  ├─ wallets (1:1)
  ├─ game_sessions (1:many)
  │   └─ answers (1:many)
  ├─ leaderboard_entries (1:many)
  ├─ winners (1:many)
  └─ wallet_transactions (1:many)
```

### Game Mode → Period → Sessions
```
game_modes
  └─ periods (1:many)
      ├─ game_sessions (1:many)
      ├─ leaderboard_entries (1:many)
      └─ winners (1:many)
```

### Payment Flow
```
users
  ├─ payments (1:many)
  │   └─ credit_bundles (many:1)
  └─ wallet_transactions (1:many)
      └─ wallets (1:1) [balance updated]
```

---

## ⚡ Performance Optimizations

### Indexes Created (50+)
- **User lookup**: email, username, referral_code
- **Game queries**: period_id, user_id, status
- **Leaderboard**: (period_id, rank) composite
- **Payments**: stripe_payment_intent_id
- **Analytics**: timestamp DESC for recent events

### Triggers (20+)
- **Auto-update timestamps** on all tables
- **Calculate success rate** after each answer
- **Update user stats** on game completion
- **Track question usage** automatically

### Helper Functions
- `reset_daily_ad_counts()` - Reset ad limits daily
- `calculate_leaderboard_rankings(period_id)` - Compute ranks
- `get_user_rank_in_period(user_id, period_id)` - Quick rank lookup
- `update_question_success_rate()` - Auto-calculate difficulty

---

## 🔒 Security (Row Level Security)

### RLS Enabled on All Tables

**User Data:**
- Users can only view/edit their own data
- Profiles are private to owner
- Wallets visible only to owner
- Transactions private

**Public Data:**
- Game modes (read-only)
- Periods (read-only)
- Leaderboards (read-only)
- Winners (read-only)
- Achievements (read-only)

**Game Data:**
- Users can only access their own sessions
- Questions visible during active sessions only
- Answers can only be submitted to own sessions

**Payment Data:**
- Credit bundles public (read-only)
- Payments private to owner
- Payout methods private to owner

---

## 📊 Sample Queries

### Get Active Periods
```sql
SELECT p.*, gm.name as mode_name, gm.type
FROM periods p
JOIN game_modes gm ON p.mode_id = gm.id
WHERE p.status = 'ACTIVE'
ORDER BY p.start_date;
```

### Get User's Current Rank
```sql
SELECT rank, score, correct_answers
FROM leaderboard_entries
WHERE user_id = 'user-uuid-here'
  AND period_id = 'period-uuid-here';
```

### Get Top 10 Leaderboard
```sql
SELECT 
    le.rank,
    u.username,
    le.score,
    le.correct_answers,
    le.average_response_time
FROM leaderboard_entries le
JOIN users u ON le.user_id = u.id
WHERE le.period_id = 'period-uuid-here'
ORDER BY le.rank
LIMIT 10;
```

### Get User Wallet Balance
```sql
SELECT 
    credits_balance,
    bonus_credits,
    daily_claim_streak,
    total_credits_earned
FROM wallets
WHERE user_id = 'user-uuid-here';
```

### Calculate Period Winners
```sql
-- Use the helper function
SELECT calculate_leaderboard_rankings('period-uuid-here');

-- Then get winners
SELECT 
    u.username,
    le.rank,
    le.score,
    gm.payout / gm.max_winners as prize_amount
FROM leaderboard_entries le
JOIN users u ON le.user_id = u.id
JOIN periods p ON le.period_id = p.id
JOIN game_modes gm ON p.mode_id = gm.id
WHERE le.period_id = 'period-uuid-here'
  AND le.rank <= gm.max_winners
ORDER BY le.rank;
```

---

## 🛠️ Maintenance Tasks

### Daily Cron Jobs
```sql
-- Reset ad reward counters (run at midnight)
SELECT reset_daily_ad_counts();

-- Update period statuses
UPDATE periods
SET status = 'ACTIVE'
WHERE status = 'UPCOMING'
  AND start_date <= NOW();

UPDATE periods
SET status = 'COMPLETED'
WHERE status = 'ACTIVE'
  AND end_date <= NOW();
```

### Weekly Tasks
```sql
-- Calculate leaderboard for completed periods
SELECT calculate_leaderboard_rankings(id)
FROM periods
WHERE status = 'COMPLETED'
  AND winner_announced = FALSE;

-- Create winners records
-- (Implement in backend service)
```

### Monthly Analytics
```sql
-- User engagement metrics
SELECT 
    COUNT(DISTINCT user_id) as active_users,
    SUM(answered_questions) as total_questions,
    AVG(score) as avg_score
FROM game_sessions
WHERE created_at >= date_trunc('month', NOW());

-- Revenue metrics
SELECT 
    COUNT(*) as total_purchases,
    SUM(amount) as total_revenue,
    AVG(amount) as avg_purchase
FROM payments
WHERE status = 'SUCCEEDED'
  AND created_at >= date_trunc('month', NOW());
```

---

## 🎯 Common Use Cases

### 1. User Signs Up
```sql
-- Automatically handled by Supabase Auth
-- Then create wallet:
INSERT INTO wallets (user_id, credits_balance)
VALUES ('new-user-id', 0);
```

### 2. User Claims Daily Credits
```sql
-- Check if already claimed today
SELECT last_daily_claim_at
FROM wallets
WHERE user_id = 'user-id';

-- If eligible, update
UPDATE wallets
SET 
    credits_balance = credits_balance + 10,
    last_daily_claim_at = NOW(),
    daily_claim_streak = daily_claim_streak + 1,
    total_credits_earned = total_credits_earned + 10
WHERE user_id = 'user-id';

-- Record transaction
INSERT INTO wallet_transactions (
    user_id, wallet_id, type, amount, 
    balance_before, balance_after, description
) VALUES (...);
```

### 3. User Watches Ad
```sql
-- Check daily limit
SELECT ad_rewards_today
FROM wallets
WHERE user_id = 'user-id';

-- If under limit, credit user
UPDATE wallets
SET 
    credits_balance = credits_balance + 50,
    ad_rewards_today = ad_rewards_today + 1,
    total_credits_earned = total_credits_earned + 50
WHERE user_id = 'user-id';

-- Track ad reward
INSERT INTO ad_rewards (user_id, ad_type, credits_earned)
VALUES ('user-id', 'rewarded_video', 50);
```

### 4. User Joins Game
```sql
-- Deduct entry fee (if applicable)
UPDATE wallets
SET 
    credits_balance = credits_balance - entry_fee,
    total_credits_spent = total_credits_spent + entry_fee
WHERE user_id = 'user-id'
  AND credits_balance >= entry_fee;

-- Create game session
INSERT INTO game_sessions (
    user_id, period_id, total_questions, status
) VALUES ('user-id', 'period-id', 1000, 'ACTIVE');
```

### 5. Calculate Winners
```sql
-- Calculate rankings
SELECT calculate_leaderboard_rankings('period-id');

-- Create winner records
INSERT INTO winners (
    user_id, period_id, rank, score, 
    payout_amount, payout_currency, status
)
SELECT 
    le.user_id,
    le.period_id,
    le.rank,
    le.score,
    (gm.payout / gm.max_winners),
    'USD',
    'PENDING'
FROM leaderboard_entries le
JOIN periods p ON le.period_id = p.id
JOIN game_modes gm ON p.mode_id = gm.id
WHERE le.period_id = 'period-id'
  AND le.rank <= gm.max_winners;
```

---

## 📝 Migration Notes

### From Old to New Schema

If you had a previous schema, this complete schema includes:

**New Tables Added:**
- user_profiles
- credit_bundles
- ad_rewards
- achievements
- user_achievements
- referrals
- analytics_events
- audit_logs
- system_logs

**Enhanced Tables:**
- users (added stats, referral system, ban system)
- wallets (added streaks, lifetime value)
- wallet_transactions (added metadata, balance tracking)
- questions (added analytics, verification)
- game_sessions (added anti-cheat fields)

**New Features:**
- Achievement system
- Referral program
- Enhanced analytics
- Audit logging
- Better anti-cheat
- Bonus credits system

---

## 🚀 Next Steps After Schema Creation

1. **Verify Tables**: Check Supabase Table Editor
2. **Create Active Periods**: Run period creation SQL
3. **Seed Questions**: Use seeding script
4. **Test Backend**: Verify API can connect
5. **Configure RLS**: Adjust policies as needed
6. **Set Up Cron Jobs**: Daily/weekly maintenance
7. **Monitor Performance**: Check index usage

---

## 📞 Support

For questions about the schema:
- Check table definitions in COMPLETE_SCHEMA.sql
- Review relationships diagram above
- Test queries in Supabase SQL Editor
- Check backend service implementations

---

**Schema Version:** 1.0.0  
**Last Updated:** 2024  
**Tables:** 30+  
**Indexes:** 50+  
**Functions:** 10+  
**Triggers:** 20+
