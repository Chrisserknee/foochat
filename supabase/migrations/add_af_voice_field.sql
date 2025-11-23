-- Add has_af_voice column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS has_af_voice BOOLEAN DEFAULT FALSE;

-- Add af_voice_subscription_id for tracking Stripe subscription
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS af_voice_subscription_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_af_voice ON user_profiles(has_af_voice);

-- Update existing users to have has_af_voice = false by default
UPDATE user_profiles 
SET has_af_voice = FALSE 
WHERE has_af_voice IS NULL;




