-- Game Modes System Migration
-- Supports: Free (Weekly), Challenge (Monthly), Tournament (Monthly), Super Tournament (Monthly)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Game Modes Configuration Table
CREATE TABLE IF NOT EXISTS game_modes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mode_type VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  entry_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  bank_threshold DECIMAL(10, 2) NOT NULL,
  questions_required INTEGER NOT NULL,
  reset_period VARCHAR(20) NOT NULL, -- 'weekly' or 'monthly'
  ad_revenue_per_view DECIMAL(10, 4) NOT NULL DEFAULT 0.0050,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_reset_period CHECK (reset_period IN ('weekly', 'monthly')),
  CONSTRAINT valid_mode_type CHECK (mode_type IN ('free', 'challenge', 'tournament', 'super_tournament'))
);

-- Bank Balance Tracking Table
CREATE TABLE IF NOT EXISTS bank_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_mode_id UUID NOT NULL REFERENCES game_modes(id) ON DELETE CASCADE,
  current_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_ad_revenue DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_entry_fees DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_payouts DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  threshold_reached BOOLEAN DEFAULT false,
  threshold_reached_at TIMESTAMPTZ,
  period_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_end_date TIMESTAMPTZ,
  last_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_game_mode_period UNIQUE(game_mode_id, period_start_date)
);

-- Custom Leaderboard Users (Fabricated Users)
CREATE TABLE IF NOT EXISTS custom_leaderboard_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_mode_id UUID NOT NULL REFERENCES game_modes(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  join_date TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_custom_user_per_mode UNIQUE(game_mode_id, username)
);

-- Game Sessions Table (tracks individual game plays)
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_mode_id UUID NOT NULL REFERENCES game_modes(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Game Mode Stats Table
CREATE TABLE IF NOT EXISTS user_game_mode_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_mode_id UUID NOT NULL REFERENCES game_modes(id) ON DELETE CASCADE,
  total_questions_answered INTEGER NOT NULL DEFAULT 0,
  total_correct_answers INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_period_points INTEGER NOT NULL DEFAULT 0,
  current_period_questions INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  has_paid_entry BOOLEAN DEFAULT false,
  entry_paid_at TIMESTAMPTZ,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_game_mode UNIQUE(user_id, game_mode_id)
);

-- Leaderboard Rankings (Combined real and custom users)
CREATE TABLE IF NOT EXISTS leaderboard_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_mode_id UUID NOT NULL REFERENCES game_modes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  custom_user_id UUID REFERENCES custom_leaderboard_users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  username VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  points INTEGER NOT NULL,
  questions_answered INTEGER NOT NULL,
  is_custom_user BOOLEAN DEFAULT false,
  period_start_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_ranking_per_period UNIQUE(game_mode_id, period_start_date, rank),
  CONSTRAINT has_user_or_custom_user CHECK (
    (user_id IS NOT NULL AND custom_user_id IS NULL) OR
    (user_id IS NULL AND custom_user_id IS NOT NULL)
  )
);

-- Question Pools Table
CREATE TABLE IF NOT EXISTS question_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_mode_id UUID REFERENCES game_modes(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of 3 options including the answer
  difficulty VARCHAR(20) NOT NULL,
  category VARCHAR(100),
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_difficulty CHECK (difficulty IN ('Easy', 'Medium', 'Difficult'))
);

-- Ad Views Tracking Table
CREATE TABLE IF NOT EXISTS ad_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_mode_id UUID NOT NULL REFERENCES game_modes(id) ON DELETE CASCADE,
  session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  ad_network VARCHAR(50),
  revenue_earned DECIMAL(10, 4) NOT NULL DEFAULT 0.0050,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bank_balances_game_mode ON bank_balances(game_mode_id);
CREATE INDEX idx_bank_balances_period ON bank_balances(period_start_date, period_end_date);
CREATE INDEX idx_custom_users_game_mode ON custom_leaderboard_users(game_mode_id);
CREATE INDEX idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_mode ON game_sessions(game_mode_id);
CREATE INDEX idx_user_stats_user_mode ON user_game_mode_stats(user_id, game_mode_id);
CREATE INDEX idx_leaderboard_mode_period ON leaderboard_rankings(game_mode_id, period_start_date);
CREATE INDEX idx_leaderboard_rank ON leaderboard_rankings(game_mode_id, period_start_date, rank);
CREATE INDEX idx_questions_mode_difficulty ON question_pools(game_mode_id, difficulty);
CREATE INDEX idx_ad_views_user_mode ON ad_views(user_id, game_mode_id);

-- Insert default game modes
INSERT INTO game_modes (mode_type, display_name, entry_fee, bank_threshold, questions_required, reset_period, ad_revenue_per_view)
VALUES 
  ('free', 'Free Weekly', 0.00, 2000.00, 100, 'weekly', 0.0050),
  ('challenge', 'Challenge Monthly', 10.00, 2000.00, 1000, 'monthly', 0.0050),
  ('tournament', 'Tournament Monthly', 100.00, 20000.00, 1000, 'monthly', 0.0050),
  ('super_tournament', 'Super Tournament Monthly', 1000.00, 200000.00, 1000, 'monthly', 0.0050)
ON CONFLICT (mode_type) DO NOTHING;

-- Initialize bank balances for each game mode
INSERT INTO bank_balances (game_mode_id, period_start_date)
SELECT id, NOW()
FROM game_modes
ON CONFLICT (game_mode_id, period_start_date) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_game_modes_updated_at BEFORE UPDATE ON game_modes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_balances_updated_at BEFORE UPDATE ON bank_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_users_updated_at BEFORE UPDATE ON custom_leaderboard_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_game_mode_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON leaderboard_rankings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON question_pools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
