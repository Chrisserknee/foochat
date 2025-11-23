-- ========================================
-- Add guest user support to chat_messages table
-- Allows saving messages for non-signed-in users
-- ========================================

-- Add guest_session_id column (for guest users)
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS guest_session_id TEXT;

-- Create index for guest session lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_guest_session ON chat_messages(guest_session_id);

-- Update RLS policies to allow guest inserts
-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert their own messages" ON chat_messages;

-- Create new policy that allows both authenticated users and guests
CREATE POLICY "Users and guests can insert messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    -- Authenticated users can insert their own messages
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Guests can insert messages with guest_session_id (no auth required)
    (auth.uid() IS NULL AND guest_session_id IS NOT NULL)
  );

-- Update select policy to allow guests to view their own messages
DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;

CREATE POLICY "Users and guests can view their own messages"
  ON chat_messages FOR SELECT
  USING (
    -- Authenticated users see their own messages
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Guests see messages with their session ID (no auth required for this)
    (guest_session_id IS NOT NULL)
  );

-- Note: We still need service role key for server-side inserts
-- But now guests can also insert via the API

