-- ========================================
-- Remove PostReady-specific tables that aren't needed for FooChat
-- ========================================
-- Run this in Supabase SQL Editor to clean up unused tables
-- 
-- FooChat only needs:
-- - user_profiles (auth & subscription info)
-- - user_message_counts (daily message limits for SIGNED-IN users)
--
-- Note: Guest users (non-signed-in) are tracked via localStorage on the client-side
--       No database table needed for guests (privacy-friendly, per-browser tracking)
--
-- These tables are PostReady-specific and not used in FooChat:
-- - saved_businesses (PostReady: saved business research)
-- - saved_video_ideas (PostReady: saved video ideas)
-- - post_history (PostReady: completed post history)
-- - user_progress (PostReady: workflow state)
-- - chat_messages (not used - chat history is TODO)
-- - daily_chat_usage (not used - using user_message_counts instead)
-- - contact_messages (optional - keeping for support, but can delete if not needed)

-- Drop tables in order (respecting foreign key constraints)
-- Note: CASCADE will also drop dependent objects (indexes, policies, etc.)

-- Drop PostReady workflow tables
DROP TABLE IF EXISTS saved_businesses CASCADE;
DROP TABLE IF EXISTS saved_video_ideas CASCADE;
DROP TABLE IF EXISTS post_history CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;

-- Drop unused chat tables (if they exist)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS daily_chat_usage CASCADE;

-- Optional: Drop contact_messages if you don't need support messages
-- Uncomment the line below if you want to remove it:
-- DROP TABLE IF EXISTS contact_messages CASCADE;

-- Verify tables were dropped
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected remaining tables:
-- - user_profiles (needed for FooChat)
-- - user_message_counts (needed for FooChat)
-- - contact_messages (optional - kept for support)

