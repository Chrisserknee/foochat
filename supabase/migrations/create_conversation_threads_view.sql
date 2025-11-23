-- ========================================
-- Conversation Threads View
-- Shows user messages paired with Foo's responses
-- Makes it easy to see what users asked vs what Foo said
-- ========================================

-- View that shows conversations as threads (user message + Foo response pairs)
CREATE OR REPLACE VIEW conversation_threads AS
WITH numbered_messages AS (
  SELECT 
    id,
    user_id,
    guest_session_id,
    role,
    content,
    image_url,
    audio_url,
    created_at,
    CASE 
      WHEN user_id IS NOT NULL THEN user_id::text
      ELSE 'guest_' || guest_session_id
    END as conversation_id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        CASE 
          WHEN user_id IS NOT NULL THEN user_id::text
          ELSE 'guest_' || guest_session_id
        END
      ORDER BY created_at ASC
    ) as message_number
  FROM chat_messages
),
paired_messages AS (
  SELECT 
    nm1.conversation_id,
    nm1.user_id,
    nm1.guest_session_id,
    nm1.message_number as pair_number,
    -- User message
    nm1.id as user_message_id,
    nm1.content as user_message,
    nm1.image_url as user_image_url,
    nm1.created_at as user_sent_at,
    TO_CHAR(nm1.created_at, 'MM/DD/YY HH:MI:SS AM') as user_sent_time,
    -- Foo response
    nm2.id as foo_message_id,
    nm2.content as foo_response,
    nm2.audio_url as foo_audio_url,
    nm2.created_at as foo_sent_at,
    TO_CHAR(nm2.created_at, 'MM/DD/YY HH:MI:SS AM') as foo_sent_time,
    -- Metadata
    CASE 
      WHEN nm1.user_id IS NOT NULL THEN 'Signed-in User'
      ELSE 'Guest: ' || LEFT(nm1.guest_session_id, 20) || '...'
    END as user_type,
    EXTRACT(EPOCH FROM (nm2.created_at - nm1.created_at)) as response_time_seconds
  FROM numbered_messages nm1
  LEFT JOIN numbered_messages nm2 ON 
    nm1.conversation_id = nm2.conversation_id
    AND nm1.role = 'user'
    AND nm2.role = 'assistant'
    AND nm2.message_number = nm1.message_number + 1
  WHERE nm1.role = 'user'
)
SELECT 
  conversation_id,
  user_type,
  pair_number,
  -- User message section
  user_message_id,
  '👤 USER' as user_label,
  user_message,
  CASE 
    WHEN LENGTH(user_message) > 200 THEN LEFT(user_message, 200) || '...'
    ELSE user_message
  END as user_message_preview,
  LENGTH(user_message) as user_message_length,
  CASE WHEN user_image_url IS NOT NULL THEN '📷 Yes' ELSE 'No' END as user_sent_image,
  user_sent_at,
  user_sent_time,
  -- Foo response section
  foo_message_id,
  '🤖 FOO' as foo_label,
  foo_response,
  CASE 
    WHEN LENGTH(foo_response) > 200 THEN LEFT(foo_response, 200) || '...'
    ELSE foo_response
  END as foo_response_preview,
  LENGTH(foo_response) as foo_response_length,
  CASE WHEN foo_audio_url IS NOT NULL THEN '🎤 Yes' ELSE 'No' END as foo_sent_audio,
  foo_sent_at,
  foo_sent_time,
  -- Response time
  ROUND(response_time_seconds::numeric, 2) as response_time_seconds,
  CASE 
    WHEN response_time_seconds < 1 THEN '< 1s'
    WHEN response_time_seconds < 60 THEN ROUND(response_time_seconds)::text || 's'
    ELSE ROUND(response_time_seconds / 60, 1)::text || 'm'
  END as response_time_formatted,
  -- Full conversation metadata
  MIN(user_sent_at) OVER (PARTITION BY conversation_id) as conversation_started,
  MAX(COALESCE(foo_sent_at, user_sent_at)) OVER (PARTITION BY conversation_id) as conversation_last_activity
FROM paired_messages
ORDER BY conversation_id, pair_number DESC;

-- View that shows ONLY user messages (what users asked)
CREATE OR REPLACE VIEW user_messages_only AS
SELECT 
  id,
  user_id,
  guest_session_id,
  CASE 
    WHEN user_id IS NOT NULL THEN 'Signed-in User'
    ELSE 'Guest: ' || LEFT(guest_session_id, 20) || '...'
  END as user_type,
  '👤 USER' as sender_label,
  content as user_message,
  CASE 
    WHEN LENGTH(content) > 300 THEN LEFT(content, 300) || '...'
    ELSE content
  END as message_preview,
  LENGTH(content) as message_length,
  CASE WHEN image_url IS NOT NULL THEN '📷 Yes' ELSE 'No' END as has_image,
  image_url,
  created_at,
  TO_CHAR(created_at, 'MM/DD/YY HH:MI:SS AM') as formatted_time,
  CASE 
    WHEN user_id IS NOT NULL THEN user_id::text
    ELSE 'guest_' || guest_session_id
  END as conversation_id
FROM chat_messages
WHERE role = 'user'
ORDER BY created_at DESC;

-- View that shows user questions with their corresponding Foo responses side-by-side
CREATE OR REPLACE VIEW q_and_a_view AS
WITH user_msgs AS (
  SELECT 
    id as user_msg_id,
    CASE 
      WHEN user_id IS NOT NULL THEN user_id::text
      ELSE 'guest_' || guest_session_id
    END as conversation_id,
    content as user_question,
    image_url as user_image,
    created_at as user_time,
    ROW_NUMBER() OVER (
      PARTITION BY 
        CASE 
          WHEN user_id IS NOT NULL THEN user_id::text
          ELSE 'guest_' || guest_session_id
        END
      ORDER BY created_at ASC
    ) as question_num
  FROM chat_messages
  WHERE role = 'user'
),
foo_responses AS (
  SELECT 
    id as foo_msg_id,
    CASE 
      WHEN user_id IS NOT NULL THEN user_id::text
      ELSE 'guest_' || guest_session_id
    END as conversation_id,
    content as foo_answer,
    audio_url as foo_audio,
    created_at as foo_time,
    ROW_NUMBER() OVER (
      PARTITION BY 
        CASE 
          WHEN user_id IS NOT NULL THEN user_id::text
          ELSE 'guest_' || guest_session_id
        END
      ORDER BY created_at ASC
    ) as answer_num
  FROM chat_messages
  WHERE role = 'assistant'
)
SELECT 
  u.conversation_id,
  CASE 
    WHEN u.conversation_id LIKE 'guest_%' THEN 'Guest User'
    ELSE 'Signed-in User'
  END as user_type,
  u.question_num,
  -- Question
  u.user_msg_id,
  '❓ USER ASKED:' as question_label,
  u.user_question,
  CASE 
    WHEN LENGTH(u.user_question) > 250 THEN LEFT(u.user_question, 250) || '...'
    ELSE u.user_question
  END as question_preview,
  CASE WHEN u.user_image IS NOT NULL THEN '📷' ELSE '' END as has_user_image,
  u.user_time as question_time,
  TO_CHAR(u.user_time, 'MM/DD/YY HH:MI:SS AM') as question_time_formatted,
  -- Answer
  f.foo_msg_id,
  '💬 FOO RESPONDED:' as answer_label,
  f.foo_answer,
  CASE 
    WHEN LENGTH(f.foo_answer) > 250 THEN LEFT(f.foo_answer, 250) || '...'
    ELSE f.foo_answer
  END as answer_preview,
  CASE WHEN f.foo_audio IS NOT NULL THEN '🎤' ELSE '' END as has_foo_audio,
  f.foo_time as answer_time,
  TO_CHAR(f.foo_time, 'MM/DD/YY HH:MI:SS AM') as answer_time_formatted,
  -- Response time
  EXTRACT(EPOCH FROM (f.foo_time - u.user_time)) as response_seconds
FROM user_msgs u
LEFT JOIN foo_responses f ON 
  u.conversation_id = f.conversation_id
  AND u.question_num = f.answer_num
ORDER BY u.conversation_id, u.question_num DESC;

-- Grant permissions (will be restricted by secure_chat_views_admin_only.sql)
GRANT SELECT ON conversation_threads TO service_role;
GRANT SELECT ON user_messages_only TO service_role;
GRANT SELECT ON q_and_a_view TO service_role;

