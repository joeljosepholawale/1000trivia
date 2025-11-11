-- Migration: Add ACHIEVEMENT_REWARD to transaction_type enum
-- Date: 2025-01-11
-- Description: Adds ACHIEVEMENT_REWARD to the transaction_type enum to support achievement rewards

-- Add ACHIEVEMENT_REWARD to transaction_type enum
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'ACHIEVEMENT_REWARD';

-- You can run this in your Supabase SQL editor to update the enum
