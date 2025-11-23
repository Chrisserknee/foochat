-- ========================================
-- Test Chat Messages Save
-- Run these queries one at a time
-- ========================================

-- Step 1: Get your user ID (replace with your email)
SELECT id, email 
FROM auth.users 
WHERE email = 'your-email@example.com';

-- Step 2: Check if chat_messages table exists
SELECT COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'chat_messages';

-- Step 3: Check current messages in table
SELECT COUNT(*) as message_count FROM chat_messages;

-- Step 4: View recent messages (if any)
SELECT id, user_id, role, LEFT(content, 50) as content_preview, created_at
FROM chat_messages
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: Test insert (replace YOUR_USER_ID_HERE with actual UUID from Step 1)
-- First, get your user ID from Step 1, then run this:
/*
INSERT INTO chat_messages (user_id, role, content, created_at)
VALUES (
  'PASTE_YOUR_USER_ID_HERE',  -- Copy from Step 1 result
  'user',
  'Test message from SQL',
  NOW()
)
RETURNING id, user_id, role, content, created_at;
*/

-- Step 6: Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'chat_messages';

-- Step 7: Check if service role can bypass RLS (this should work)
-- Note: This requires service role key, but you can check if policies exist

