-- ========================================
-- Create readable chat view for Supabase
-- Makes it easier to see conversations between users and Foo
-- ========================================

-- Create a view that formats chat messages for easy reading
CREATE OR REPLACE VIEW chat_messages_readable AS
SELECT 
  id,
  user_id,
  guest_session_id,
  CASE 
    WHEN role = 'user' THEN '👤 YOU'
    WHEN role = 'assistant' THEN '🤖 FOO'
    ELSE role
  END as sender,
  role,
  content,
  CASE 
    WHEN LENGTH(content) > 100 THEN LEFT(content, 100) || '...'
    ELSE content
  END as content_preview,
  LENGTH(content) as content_length,
  CASE 
    WHEN image_url IS NOT NULL THEN '📷 Yes'
    ELSE 'No'
  END as has_image,
  CASE 
    WHEN audio_url IS NOT NULL THEN '🎤 Yes'
    ELSE 'No'
  END as has_audio,
  created_at,
  TO_CHAR(created_at, 'MM/DD/YY HH:MI AM') as formatted_time,
  -- Group messages by user/session for conversation view
  CASE 
    WHEN user_id IS NOT NULL THEN user_id::text
    ELSE 'guest_' || guest_session_id
  END as conversation_id
FROM chat_messages
ORDER BY created_at DESC;

-- Create a view that shows conversations grouped together
CREATE OR REPLACE VIEW chat_conversations AS
SELECT 
  CASE 
    WHEN user_id IS NOT NULL THEN user_id::text
    ELSE 'guest_' || guest_session_id
  END as conversation_id,
  CASE 
    WHEN user_id IS NOT NULL THEN 'Signed-in User'
    ELSE 'Guest: ' || LEFT(guest_session_id, 20) || '...'
  END as user_type,
  COUNT(*) as total_messages,
  COUNT(*) FILTER (WHERE role = 'user') as user_messages,
  COUNT(*) FILTER (WHERE role = 'assistant') as foo_messages,
  MIN(created_at) as first_message,
  MAX(created_at) as last_message,
  MAX(created_at) as most_recent
FROM chat_messages
GROUP BY 
  CASE 
    WHEN user_id IS NOT NULL THEN user_id::text
    ELSE 'guest_' || guest_session_id
  END
ORDER BY most_recent DESC;

-- Create a function to get a full conversation thread
CREATE OR REPLACE FUNCTION get_conversation_thread(
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
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY cm.created_at ASC)::INTEGER as message_order,
    CASE 
      WHEN cm.role = 'user' THEN '👤 YOU'
      WHEN cm.role = 'assistant' THEN '🤖 FOO'
      ELSE cm.role
    END as sender,
    cm.content,
    (cm.image_url IS NOT NULL) as has_image,
    (cm.audio_url IS NOT NULL) as has_audio,
    cm.created_at,
    TO_CHAR(cm.created_at, 'MM/DD/YY HH:MI:SS AM') as formatted_time
  FROM chat_messages cm
  WHERE 
    (p_user_id IS NOT NULL AND cm.user_id = p_user_id)
    OR (p_guest_session_id IS NOT NULL AND cm.guest_session_id = p_guest_session_id)
  ORDER BY cm.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON chat_messages_readable TO authenticated;
GRANT SELECT ON chat_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_thread TO authenticated;

