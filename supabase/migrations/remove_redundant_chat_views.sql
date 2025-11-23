-- ========================================
-- Remove Redundant Chat Views
-- Keep only the views that clearly show user questions vs Foo responses
-- ========================================

-- Drop views that are redundant or less useful
-- We're keeping: q_and_a_view and user_messages_only (best for seeing user questions)

-- Remove chat_messages_readable (redundant - q_and_a_view is better)
DROP VIEW IF EXISTS chat_messages_readable CASCADE;

-- Remove chat_conversations (just stats, not actual conversations)
DROP VIEW IF EXISTS chat_conversations CASCADE;

-- Remove conversation_threads if it exists (q_and_a_view is clearer)
DROP VIEW IF EXISTS conversation_threads CASCADE;

-- Keep these views (they're the best for seeing user questions):
-- ✅ q_and_a_view - Shows user questions paired with Foo responses side-by-side
-- ✅ user_messages_only - Shows only what users asked

-- Note: The function get_conversation_thread() is still available if needed
-- but the views above are better for quick viewing in Supabase Dashboard

