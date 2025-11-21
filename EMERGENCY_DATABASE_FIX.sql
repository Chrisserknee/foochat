-- ========================================
-- EMERGENCY FIX: Add Missing Columns to user_profiles
-- ========================================
-- Run this in Supabase SQL Editor immediately!
-- This adds all columns that the app expects but are missing from production

-- Add upgraded_at column (tracks when user became Pro)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMP WITH TIME ZONE;

-- Add has_af_voice column (tracks AF Voice subscription)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS has_af_voice BOOLEAN DEFAULT FALSE;

-- Add af_voice_subscription_id (tracks Stripe subscription for AF Voice)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS af_voice_subscription_id TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_af_voice ON user_profiles(has_af_voice);
CREATE INDEX IF NOT EXISTS idx_user_profiles_upgraded_at ON user_profiles(upgraded_at);

-- Set default values for existing users
UPDATE user_profiles 
SET has_af_voice = FALSE 
WHERE has_af_voice IS NULL;

-- Verify the columns were added successfully
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check your current profile status
-- REPLACE 'your@email.com' with YOUR actual email
SELECT 
  id,
  email,
  is_pro,
  plan_type,
  has_af_voice,
  stripe_customer_id,
  stripe_subscription_id,
  upgraded_at,
  created_at,
  updated_at
FROM user_profiles
WHERE email = 'your@email.com';

