-- ========================================
-- Fix Guest RLS Security Issue
-- CRITICAL: Previous policy allowed guests to see ALL guest messages
-- This fixes it so guests can only access via API (service_role)
-- ========================================

-- Step 1: Drop the insecure guest SELECT policy
DROP POLICY IF EXISTS "Users and guests can view their own messages" ON chat_messages;

-- Step 2: Create secure SELECT policy
-- Users can see their own messages
-- Guests CANNOT query directly (must use API with service_role key)
CREATE POLICY "Users can view their own messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Step 3: Keep guest INSERT policy (needed for API)
-- But guests can only insert, not query directly
DROP POLICY IF EXISTS "Users and guests can insert messages" ON chat_messages;

CREATE POLICY "Users and guests can insert messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    -- Authenticated users can insert their own messages
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Guests can insert messages (no auth check - handled by API)
    (auth.uid() IS NULL AND guest_session_id IS NOT NULL)
  );

-- Step 4: Revoke direct access from anon role
-- Guests should ONLY access via API (which uses service_role key)
REVOKE SELECT ON chat_messages FROM anon;
REVOKE SELECT ON chat_messages FROM PUBLIC;

-- Step 5: Grant SELECT only to authenticated users (RLS will filter to own messages)
GRANT SELECT ON chat_messages TO authenticated;

-- Step 6: Grant all to service_role (admin/API)
GRANT ALL ON chat_messages TO service_role;

-- SECURITY EXPLANATION:
-- ✅ Users (authenticated): Can see ONLY their own messages (RLS filters by user_id)
-- ✅ Guests: CANNOT query directly - must use /api/chat-history endpoint
-- ✅ API endpoint: Uses service_role key, filters by guest_session_id server-side
-- ✅ Admin: Can see everything via service_role

-- This ensures:
-- 1. Users can only see their own messages
-- 2. Guests cannot see other guests' messages (even if they try to query directly)
-- 3. Only admin (service_role) can see all messages
-- 4. API endpoints properly filter by userId/guestSessionId

