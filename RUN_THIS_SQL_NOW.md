# 🚨 URGENT: Run This SQL in Supabase NOW!

## The Problem
Your production database is **missing critical columns** that the app needs:
- ❌ `upgraded_at` column
- ❌ `has_af_voice` column  
- ❌ `af_voice_subscription_id` column

This is why Pro status isn't working!

---

## ⚡ **IMMEDIATE FIX** (Do This Right Now!)

### Step 1: Go to Supabase SQL Editor
1. Open **https://supabase.com/dashboard**
2. Select your **FooChat project**
3. Click **SQL Editor** in the left sidebar

### Step 2: Copy and Run This SQL

```sql
-- ========================================
-- FIX: Add Missing Columns to user_profiles
-- ========================================

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
CREATE INDEX IF NOT EXISTS idx_user_profiles_af_voice 
  ON user_profiles(has_af_voice);
  
CREATE INDEX IF NOT EXISTS idx_user_profiles_upgraded_at 
  ON user_profiles(upgraded_at);

-- Set default values for existing users
UPDATE user_profiles 
SET has_af_voice = FALSE 
WHERE has_af_voice IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
```

### Step 3: Run This to Check Your Profile

**Replace `your@email.com` with YOUR actual email:**

```sql
-- Check your current status
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
```

### Step 4: If You Already Paid, Update Your Status

**Replace `your@email.com` with YOUR actual email:**

```sql
-- FORCE UPDATE your profile to Pro
UPDATE user_profiles
SET 
  is_pro = TRUE,
  plan_type = 'pro',
  upgraded_at = NOW(),
  updated_at = NOW()
WHERE email = 'your@email.com';

-- Verify it worked
SELECT email, is_pro, plan_type, upgraded_at
FROM user_profiles
WHERE email = 'your@email.com';
```

### Step 5: Hard Refresh Browser

After running the SQL:
- **Windows**: Press `Ctrl + Shift + R`
- **Mac**: Press `Cmd + Shift + R`

Your Pro status should now show! ✅

---

## 🔍 What Happened?

The migration files in the codebase (`supabase/migrations/add_af_voice_field.sql`) were never run on the production Supabase database. 

The app code expects these columns to exist, but they don't in production, causing:
- ❌ `400 Bad Request` errors
- ❌ `column user_profiles.has_af_voice does not exist`
- ❌ `Could not find the 'upgraded_at' column`

---

## ✅ After Running the SQL

Once you've run the SQL migration above:

1. **Pro upgrades will work immediately** - The checkout-success endpoint can now update your profile
2. **No more 400 errors** - The app can read your Pro status
3. **AF Voice subscriptions will work** - The has_af_voice column exists

---

## 🧪 Testing After Fix

1. **Hard refresh** your browser
2. You should see **"⚡ Foo Pro"** badge in navbar (if you paid)
3. Message counter should be gone
4. No more errors in browser console
5. Try upgrading a test account to verify it works

---

## 🆘 If It Still Doesn't Work

Run this diagnostic query:

```sql
-- Check if columns exist
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('upgraded_at', 'has_af_voice', 'af_voice_subscription_id')
ORDER BY column_name;
```

If this returns **0 rows**, the columns aren't there. Re-run Step 2.

If it returns **3 rows**, the columns exist! The issue is elsewhere.

---

## 📋 Quick Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Ran the ALTER TABLE commands
- [ ] Saw "SUCCESS" confirmation
- [ ] Ran the verification query (saw all columns)
- [ ] Updated my profile to `is_pro = TRUE`
- [ ] Hard refreshed browser
- [ ] Pro badge now shows ✅

---

**Run the SQL migration NOW and your Pro subscription will work!** 🚀

After you run it, let me know and we'll verify everything is working!

