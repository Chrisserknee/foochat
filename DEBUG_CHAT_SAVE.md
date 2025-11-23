# 🔍 Debugging Chat Save Issues

## Quick Checks

### 1. Check if you're signed in
- Messages only save for **signed-in users**
- Guest users don't get saved (by design)

### 2. Check Server Logs
Look for these console logs when you send a message:
- `💾 Attempting to save chat history for user: [userId]`
- `✅ Saved user message to database`
- `✅ Saved assistant message to database`
- OR error messages like `⚠️ Failed to save...`

### 3. Check Environment Variables
Make sure these are set in Vercel (or your `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (NOT the anon key!)

### 4. Check Database Table
Run this in Supabase SQL Editor:
```sql
SELECT * FROM chat_messages LIMIT 10;
```

### 5. Check RLS Policies
Run this to see if policies exist:
```sql
SELECT * FROM pg_policies WHERE tablename = 'chat_messages';
```

## Common Issues

### Issue 1: Service Role Key Not Set
**Symptom**: No error, but nothing saves
**Fix**: Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables

### Issue 2: RLS Blocking Inserts
**Symptom**: Error about permissions
**Fix**: Make sure service role key is used (not anon key)

### Issue 3: Table Doesn't Exist
**Symptom**: Error "relation chat_messages does not exist"
**Fix**: Run the SQL migration in Supabase

### Issue 4: User Not Signed In
**Symptom**: No userId in logs
**Fix**: Sign in before testing

## Test Query

Run this to manually insert a test message:
```sql
INSERT INTO chat_messages (user_id, role, content, created_at)
VALUES (
  'YOUR_USER_ID_HERE',
  'user',
  'Test message',
  NOW()
);
```

If this works, the table is fine and it's a code issue.
If this fails, check RLS policies.

