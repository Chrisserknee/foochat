-- ========================================
-- Verify and Secure Chat Messages
-- Ensures only users can see their own messages, admin can see all
-- ========================================

-- Step 1: Verify RLS is enabled
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users and guests can view their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users and guests can insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

-- Step 3: Create secure policies
-- Users can ONLY see their own messages (by user_id)
CREATE POLICY "Users can view their own messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Guests can ONLY see their own messages (by guest_session_id)
-- Note: Guests don't have auth.uid(), so they can't query directly
-- This policy ensures guests can't see other guests' messages
-- (Guests access via API with service_role key, which filters by guest_session_id)

-- Users can insert their own messages
CREATE POLICY "Users can insert their own messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Guests can insert messages (no auth check needed - handled by API)
CREATE POLICY "Guests can insert messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() IS NULL AND guest_session_id IS NOT NULL);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Step 4: Ensure views are secured (run secure_chat_views_admin_only.sql first)
-- Views should only be accessible via service_role (admin)

-- Step 5: Verify no public access
REVOKE ALL ON chat_messages FROM PUBLIC;
REVOKE ALL ON chat_messages FROM anon;

-- Grant SELECT to authenticated users (but RLS policies restrict to own messages)
GRANT SELECT ON chat_messages TO authenticated;
GRANT INSERT ON chat_messages TO authenticated;
GRANT DELETE ON chat_messages TO authenticated;

-- Grant all to service_role (admin/you)
GRANT ALL ON chat_messages TO service_role;

-- Verify: Users can only see their own messages
-- Guests cannot query directly (must use API with service_role key)
-- Admin (service_role) can see everything

