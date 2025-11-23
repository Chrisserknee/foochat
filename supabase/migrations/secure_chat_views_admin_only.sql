-- ========================================
-- Secure Chat Views - Admin Only Access
-- Only you (admin/service_role) can see chat history
-- ========================================

-- Step 1: Revoke all public access from views
REVOKE ALL ON chat_messages_readable FROM PUBLIC;
REVOKE ALL ON chat_conversations FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_conversation_thread FROM PUBLIC;

-- Step 2: Revoke access from authenticated users (regular users)
REVOKE SELECT ON chat_messages_readable FROM authenticated;
REVOKE SELECT ON chat_conversations FROM authenticated;
REVOKE EXECUTE ON FUNCTION get_conversation_thread FROM authenticated;

-- Step 3: Grant access ONLY to service_role (admin/you)
-- This ensures only admin access via Supabase Dashboard or service_role key can view chats
GRANT SELECT ON chat_messages_readable TO service_role;
GRANT SELECT ON chat_conversations TO service_role;
GRANT EXECUTE ON FUNCTION get_conversation_thread TO service_role;

-- Step 4: Create admin-only functions with SECURITY DEFINER
-- These functions can be called, but only return data if accessed via service_role

-- Function to check if current user is admin (service_role)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current_setting('request.jwt.claims') contains service_role
  -- Or check if current_user is postgres (admin)
  RETURN (
    current_setting('request.jwt.role', true) = 'service_role'
    OR current_user = 'postgres'
    OR current_setting('request.jwt.claims', true) LIKE '%service_role%'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure function to get readable messages (admin only)
CREATE OR REPLACE FUNCTION admin_get_chat_messages_readable()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  guest_session_id TEXT,
  sender TEXT,
  role TEXT,
  content TEXT,
  content_preview TEXT,
  content_length INTEGER,
  has_image TEXT,
  has_audio TEXT,
  created_at TIMESTAMPTZ,
  formatted_time TEXT,
  conversation_id TEXT
) AS $$
BEGIN
  -- Only allow if accessed via service_role
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin access required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    cmr.id,
    cmr.user_id,
    cmr.guest_session_id,
    cmr.sender,
    cmr.role,
    cmr.content,
    cmr.content_preview,
    cmr.content_length,
    cmr.has_image,
    cmr.has_audio,
    cmr.created_at,
    cmr.formatted_time,
    cmr.conversation_id
  FROM chat_messages_readable cmr
  ORDER BY cmr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure function to get conversations (admin only)
CREATE OR REPLACE FUNCTION admin_get_chat_conversations()
RETURNS TABLE (
  conversation_id TEXT,
  user_type TEXT,
  total_messages BIGINT,
  user_messages BIGINT,
  foo_messages BIGINT,
  first_message TIMESTAMPTZ,
  last_message TIMESTAMPTZ,
  most_recent TIMESTAMPTZ
) AS $$
BEGIN
  -- Only allow if accessed via service_role
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin access required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    cc.conversation_id,
    cc.user_type,
    cc.total_messages,
    cc.user_messages,
    cc.foo_messages,
    cc.first_message,
    cc.last_message,
    cc.most_recent
  FROM chat_conversations cc
  ORDER BY cc.most_recent DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure function to get conversation thread (admin only)
CREATE OR REPLACE FUNCTION admin_get_conversation_thread(
  p_user_id UUID DEFAULT NULL,
  p_guest_session_id TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  message_order INTEGER,
  sender TEXT,
  content TEXT,
  has_image BOOLEAN,
  has_audio BOOLEAN,
  created_at TIMESTAMPTZ,
  formatted_time TEXT
) AS $$
BEGIN
  -- Only allow if accessed via service_role
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin access required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    gct.message_order,
    gct.sender,
    gct.content,
    gct.has_image,
    gct.has_audio,
    gct.created_at,
    gct.formatted_time
  FROM get_conversation_thread(p_user_id, p_guest_session_id, p_limit) gct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on admin functions to service_role only
GRANT EXECUTE ON FUNCTION admin_get_chat_messages_readable TO service_role;
GRANT EXECUTE ON FUNCTION admin_get_chat_conversations TO service_role;
GRANT EXECUTE ON FUNCTION admin_get_conversation_thread TO service_role;

-- Note: Views are now only accessible via service_role
-- Regular users cannot access them through the Supabase client
-- Only you (admin) can view them in the Supabase Dashboard or via service_role API calls

