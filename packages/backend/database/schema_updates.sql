-- Database Schema Updates for 1000 Ravier
-- Run these commands in your Supabase SQL editor

-- ====================================
-- AD REWARDS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS ad_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ad_type VARCHAR(50) NOT NULL CHECK (ad_type IN ('rewarded_video', 'interstitial', 'banner')),
  credits_earned INTEGER NOT NULL CHECK (credits_earned > 0),
  device_info JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent spam: limit ads per user per day
  CONSTRAINT unique_user_ad_daily UNIQUE (user_id, ad_type, DATE(created_at))
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ad_rewards_user_date ON ad_rewards(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ad_rewards_type ON ad_rewards(ad_type);

-- ====================================
-- PAYMENTS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  bundle_id VARCHAR(50) NOT NULL,
  amount_usd DECIMAL(10,2) NOT NULL CHECK (amount_usd > 0),
  credits_purchased INTEGER NOT NULL CHECK (credits_purchased > 0),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled', 'refunded')),
  payment_method_type VARCHAR(50),
  receipt_email VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON payments(stripe_payment_intent_id);

-- ====================================
-- LEADERBOARD PERIODS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS leaderboard_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  total_prize_pool DECIMAL(10,2) DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  winner_count INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure periods don't overlap
  CONSTRAINT valid_period_dates CHECK (end_date > start_date)
);

-- Index for leaderboard periods
CREATE INDEX IF NOT EXISTS idx_leaderboard_periods_status ON leaderboard_periods(status);
CREATE INDEX IF NOT EXISTS idx_leaderboard_periods_dates ON leaderboard_periods(start_date, end_date);

-- ====================================
-- LEADERBOARD ENTRIES TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES leaderboard_periods(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  games_played INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  average_response_time DECIMAL(8,2) DEFAULT 0,
  prize_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One entry per user per period
  CONSTRAINT unique_user_period UNIQUE (user_id, period_id)
);

-- Indexes for leaderboard entries
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_period_rank ON leaderboard_entries(period_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user ON leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_score ON leaderboard_entries(period_id, score DESC);

-- ====================================
-- WINNERS TABLE (Historical record)
-- ====================================
CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES leaderboard_periods(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  final_score INTEGER NOT NULL,
  prize_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_participants INTEGER NOT NULL DEFAULT 0,
  game_mode VARCHAR(100),
  is_ai_generated BOOLEAN DEFAULT FALSE,
  won_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  prize_claimed_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure unique positions per period
  CONSTRAINT unique_period_position UNIQUE (period_id, position)
);

-- Indexes for winners
CREATE INDEX IF NOT EXISTS idx_winners_period ON winners(period_id);
CREATE INDEX IF NOT EXISTS idx_winners_user ON winners(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_date ON winners(won_at DESC);
CREATE INDEX IF NOT EXISTS idx_winners_position ON winners(position);

-- ====================================
-- CREDIT BUNDLES TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS credit_bundles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL CHECK (credits > 0),
  price_usd DECIMAL(10,2) NOT NULL CHECK (price_usd > 0),
  bonus_percentage INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default credit bundles
INSERT INTO credit_bundles (id, name, description, credits, price_usd, bonus_percentage, is_popular, sort_order)
VALUES 
  ('bundle_small', 'Starter Pack', 'Perfect for new players', 1000, 0.99, 0, FALSE, 1),
  ('bundle_medium', 'Popular Pack', 'Most popular choice - 10% bonus!', 5500, 4.99, 10, TRUE, 2),
  ('bundle_large', 'Pro Pack', 'Great value - 20% bonus!', 12000, 9.99, 20, FALSE, 3),
  ('bundle_mega', 'Champion Pack', 'Ultimate pack - 37% bonus!', 27500, 19.99, 37, FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- USER ACHIEVEMENTS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  description TEXT,
  credits_reward INTEGER DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_data JSONB,
  
  -- Prevent duplicate achievements
  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_type)
);

-- Index for achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);

-- ====================================
-- UPDATE EXISTING TABLES
-- ====================================

-- Add columns to existing wallet/profile tables if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_ad_rewards INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ads_watched_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_ad_watch_date DATE,
ADD COLUMN IF NOT EXISTS total_games_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_winnings DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_rank INTEGER,
ADD COLUMN IF NOT EXISTS average_score DECIMAL(5,2) DEFAULT 0;

-- ====================================
-- FUNCTIONS FOR LEADERBOARD MANAGEMENT
-- ====================================

-- Function to update user rank in leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard_ranks(period_uuid UUID)
RETURNS VOID AS $$
BEGIN
  WITH ranked_users AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY score DESC, average_response_time ASC) as new_rank
    FROM leaderboard_entries 
    WHERE period_id = period_uuid
  )
  UPDATE leaderboard_entries 
  SET rank = ranked_users.new_rank
  FROM ranked_users 
  WHERE leaderboard_entries.id = ranked_users.id;
END;
$$ LANGUAGE plpgsql;

-- Function to create winners from leaderboard
CREATE OR REPLACE FUNCTION create_period_winners(period_uuid UUID)
RETURNS VOID AS $$
DECLARE
  period_record leaderboard_periods%ROWTYPE;
BEGIN
  -- Get period info
  SELECT * INTO period_record FROM leaderboard_periods WHERE id = period_uuid;
  
  -- Create winners from top performers
  INSERT INTO winners (period_id, user_id, username, position, final_score, prize_amount, total_participants, won_at)
  SELECT 
    le.period_id,
    le.user_id,
    p.username,
    le.rank,
    le.score,
    CASE 
      WHEN le.rank = 1 THEN period_record.total_prize_pool * 0.5
      WHEN le.rank = 2 THEN period_record.total_prize_pool * 0.3
      WHEN le.rank = 3 THEN period_record.total_prize_pool * 0.2
      ELSE 0
    END,
    period_record.total_participants,
    NOW()
  FROM leaderboard_entries le
  JOIN profiles p ON p.id = le.user_id
  WHERE le.period_id = period_uuid 
    AND le.rank <= period_record.winner_count
  ON CONFLICT (period_id, position) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================

-- Enable RLS on new tables
ALTER TABLE ad_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for ad_rewards (users can only see their own)
CREATE POLICY "Users can view own ad rewards" ON ad_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ad rewards" ON ad_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for payments (users can only see their own)
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for leaderboards (public read, authenticated write)
CREATE POLICY "Anyone can view leaderboard periods" ON leaderboard_periods
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view leaderboard entries" ON leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY "Users can update own leaderboard entries" ON leaderboard_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for winners (public read)
CREATE POLICY "Anyone can view winners" ON winners
  FOR SELECT USING (true);

-- Policies for achievements (users can only see their own)
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Credit bundles are public read
CREATE POLICY "Anyone can view credit bundles" ON credit_bundles
  FOR SELECT USING (is_active = true);

-- ====================================
-- INITIAL DATA & TRIGGERS
-- ====================================

-- Create a current leaderboard period
INSERT INTO leaderboard_periods (id, name, description, start_date, end_date, status, total_prize_pool, winner_count)
VALUES 
  (gen_random_uuid(), 'Weekly Challenge #1', 'First weekly competition', NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days', 'active', 1000.00, 10)
ON CONFLICT DO NOTHING;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_entries_updated_at BEFORE UPDATE ON leaderboard_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_bundles_updated_at BEFORE UPDATE ON credit_bundles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema updated successfully! New tables created:';
  RAISE NOTICE '- ad_rewards (track ad viewing rewards)';
  RAISE NOTICE '- payments (track credit purchases)';
  RAISE NOTICE '- leaderboard_periods (competition periods)';
  RAISE NOTICE '- leaderboard_entries (user rankings)';
  RAISE NOTICE '- winners (historical winners)';
  RAISE NOTICE '- credit_bundles (purchase options)';
  RAISE NOTICE '- user_achievements (achievement tracking)';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to connect your 1000 Ravier app!';
END $$;