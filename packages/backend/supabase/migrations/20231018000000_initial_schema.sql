-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE mode_type AS ENUM ('FREE', 'CHALLENGE', 'TOURNAMENT', 'SUPER_TOURNAMENT');
CREATE TYPE period_type AS ENUM ('WEEKLY', 'MONTHLY');
CREATE TYPE period_status AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE session_status AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'EXPIRED', 'CANCELLED');
CREATE TYPE winner_status AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');
CREATE TYPE transaction_type AS ENUM ('DAILY_CLAIM', 'AD_REWARD', 'PURCHASE', 'ENTRY_FEE', 'REFUND', 'BONUS', 'PENALTY');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
CREATE TYPE payment_type AS ENUM ('CREDITS_BUNDLE', 'ENTRY_FEE');
CREATE TYPE payout_status AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');
CREATE TYPE payout_method_type AS ENUM ('BANK_ACCOUNT', 'MOBILE_MONEY', 'PAYPAL');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    language TEXT DEFAULT 'de',
    timezone TEXT DEFAULT 'UTC',
    device_id TEXT,
    lifetime_earnings_ngn DECIMAL(10,2) DEFAULT 0,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game modes table
CREATE TABLE game_modes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type mode_type NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    questions INTEGER NOT NULL,
    entry_fee INTEGER NOT NULL DEFAULT 0,
    entry_fee_currency TEXT NOT NULL DEFAULT 'USD',
    payout INTEGER NOT NULL,
    payout_currency TEXT NOT NULL DEFAULT 'USD',
    min_answers_to_qualify INTEGER NOT NULL,
    period_type period_type NOT NULL,
    max_winners INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Periods table
CREATE TABLE periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mode_id UUID NOT NULL REFERENCES game_modes(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status period_status DEFAULT 'UPCOMING',
    total_participants INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of options
    correct_answer TEXT NOT NULL,
    language TEXT DEFAULT 'de',
    category TEXT,
    difficulty TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game sessions table
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    status session_status DEFAULT 'ACTIVE',
    current_question_index INTEGER DEFAULT 0,
    total_questions INTEGER NOT NULL,
    score INTEGER DEFAULT 0,
    answered_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    incorrect_answers INTEGER DEFAULT 0,
    skipped_answers INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- seconds
    average_response_time DECIMAL(10,3) DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    device_info TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, period_id) -- One session per user per period
);

-- Session questions (stores the randomized questions for each session)
CREATE TABLE session_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    randomized_options JSONB NOT NULL, -- Shuffled options
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, question_index)
);

-- Answers table
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    is_skipped BOOLEAN NOT NULL DEFAULT FALSE,
    response_time DECIMAL(10,3) NOT NULL, -- seconds
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard entries table
CREATE TABLE leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL,
    answered_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    average_response_time DECIMAL(10,3) NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    is_qualified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, period_id)
);

-- Winners table
CREATE TABLE winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL,
    payout_amount DECIMAL(10,2) NOT NULL,
    payout_currency TEXT NOT NULL DEFAULT 'USD',
    status winner_status DEFAULT 'PENDING',
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    paid_at TIMESTAMPTZ,
    payment_reference TEXT,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    credits_balance INTEGER DEFAULT 0,
    last_daily_claim_at TIMESTAMPTZ,
    ad_rewards_today INTEGER DEFAULT 0,
    ad_rewards_reset_at TIMESTAMPTZ DEFAULT (date_trunc('day', NOW()) + INTERVAL '1 day'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet transactions table
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT NOT NULL,
    reference TEXT,
    metadata JSONB,
    status transaction_status DEFAULT 'COMPLETED',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table (for Stripe payments)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL,
    type payment_type NOT NULL,
    status payment_status DEFAULT 'PENDING',
    metadata JSONB,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout methods table
CREATE TABLE payout_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type payout_method_type NOT NULL,
    details JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts table
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    winner_id UUID NOT NULL REFERENCES winners(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    payout_method_id UUID NOT NULL REFERENCES payout_methods(id),
    status payout_status DEFAULT 'PENDING',
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    paid_at TIMESTAMPTZ,
    payment_reference TEXT,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    properties JSONB,
    device_info TEXT,
    ip_address INET,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_device_id ON users(device_id);
CREATE INDEX idx_periods_mode_id ON periods(mode_id);
CREATE INDEX idx_periods_status ON periods(status);
CREATE INDEX idx_periods_start_date ON periods(start_date);
CREATE INDEX idx_periods_end_date ON periods(end_date);
CREATE INDEX idx_questions_language ON questions(language);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_is_active ON questions(is_active);
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_period_id ON game_sessions(period_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_session_questions_session_id ON session_questions(session_id);
CREATE INDEX idx_answers_session_id ON answers(session_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_leaderboard_entries_period_id ON leaderboard_entries(period_id);
CREATE INDEX idx_leaderboard_entries_rank ON leaderboard_entries(rank);
CREATE INDEX idx_winners_period_id ON winners(period_id);
CREATE INDEX idx_winners_status ON winners(status);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payout_methods_user_id ON payout_methods(user_id);
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_modes_updated_at BEFORE UPDATE ON game_modes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_periods_updated_at BEFORE UPDATE ON periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaderboard_entries_updated_at BEFORE UPDATE ON leaderboard_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_winners_updated_at BEFORE UPDATE ON winners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallet_transactions_updated_at BEFORE UPDATE ON wallet_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payout_methods_updated_at BEFORE UPDATE ON payout_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default game modes based on configuration
INSERT INTO game_modes (type, name, description, questions, entry_fee, entry_fee_currency, payout, payout_currency, min_answers_to_qualify, period_type, max_winners) VALUES
('FREE', 'Free Weekly', 'Weekly competition with 1000 questions', 1000, 0, 'USD', 100, 'USD', 1000, 'WEEKLY', 10),
('CHALLENGE', 'Challenge Monthly', 'Monthly challenge with 100 questions', 100, 10, 'USD', 1000, 'USD', 100, 'MONTHLY', 10),
('TOURNAMENT', 'Tournament Monthly', 'Monthly tournament with 1000 questions', 1000, 1000, 'CREDITS', 10000, 'USD', 1000, 'MONTHLY', 10),
('SUPER_TOURNAMENT', 'Super Tournament Monthly', 'Elite monthly tournament', 1000, 10000, 'CREDITS', 100000, 'USD', 1000, 'MONTHLY', 10);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read and update their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Game modes are readable by all authenticated users
CREATE POLICY "Game modes are public" ON game_modes FOR SELECT TO authenticated USING (true);

-- Periods are readable by all authenticated users
CREATE POLICY "Periods are public" ON periods FOR SELECT TO authenticated USING (true);

-- Questions are readable by authenticated users during active sessions
CREATE POLICY "Questions are readable during sessions" ON questions FOR SELECT TO authenticated USING (is_active = true);

-- Users can manage their own game sessions
CREATE POLICY "Users can manage own sessions" ON game_sessions FOR ALL USING (auth.uid() = user_id);

-- Users can view their own session questions
CREATE POLICY "Users can view own session questions" ON session_questions FOR SELECT USING (
    session_id IN (SELECT id FROM game_sessions WHERE user_id = auth.uid())
);

-- Users can submit answers for their own sessions
CREATE POLICY "Users can submit own answers" ON answers FOR ALL USING (
    session_id IN (SELECT id FROM game_sessions WHERE user_id = auth.uid())
);

-- Leaderboard entries are public during active periods
CREATE POLICY "Leaderboard entries are public" ON leaderboard_entries FOR SELECT TO authenticated USING (true);

-- Winners are public
CREATE POLICY "Winners are public" ON winners FOR SELECT TO authenticated USING (true);

-- Users can manage their own wallet
CREATE POLICY "Users can manage own wallet" ON wallets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own payments
CREATE POLICY "Users can manage own payments" ON payments FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own payout methods
CREATE POLICY "Users can manage own payout methods" ON payout_methods FOR ALL USING (auth.uid() = user_id);

-- Users can view their own payouts
CREATE POLICY "Users can view own payouts" ON payouts FOR SELECT USING (auth.uid() = user_id);