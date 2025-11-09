-- ============================================================================
-- FIX RLS POLICIES FOR WALLET_TRANSACTIONS AND AD_REWARDS
-- ============================================================================
-- This script adds missing INSERT policies that are causing permission errors

-- Add INSERT policy for wallet_transactions
-- The backend service needs to create transactions on behalf of users
-- Using service role key, but adding policy for authenticated users as well
DROP POLICY IF EXISTS "Users can insert own transactions" ON wallet_transactions;
CREATE POLICY "Users can insert own transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for ad_rewards 
DROP POLICY IF EXISTS "Users can insert own ad rewards" ON ad_rewards;
CREATE POLICY "Users can insert own ad rewards" ON ad_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy for wallets (needed for daily claims and ad rewards)
DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;
CREATE POLICY "Users can update own wallet" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies fixed successfully!';
  RAISE NOTICE '   - wallet_transactions: INSERT policy added';
  RAISE NOTICE '   - ad_rewards: INSERT policy added';
  RAISE NOTICE '   - wallets: UPDATE policy ensured';
END $$;
