-- ========================================
-- Create chat_messages table for FooChat
-- Stores all user messages and Foo's responses
-- Safe to run multiple times (idempotent)
-- ========================================

-- Step 1: Create chat_messages table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT, -- Store image URL/path if image was sent
  audio_url TEXT, -- Store audio URL/path if audio was generated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for faster queries (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON chat_messages(user_id, created_at DESC);

-- Step 3: Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist (safe - only runs if table exists)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
  DROP POLICY IF EXISTS "Users can insert their own messages" ON chat_messages;
  DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist yet, policies will be created after table creation
    NULL;
END $$;

-- Step 5: Create policies for Row Level Security
CREATE POLICY "Users can view their own messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Verify table was created
SELECT 'chat_messages table created successfully!' as status;
