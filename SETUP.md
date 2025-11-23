# FooChat Setup Guide

## Overview
FooChat is a chaotic, funny AI chatbot that speaks authentic Salinas Foo slang, roasts your photos, and can even speak with ElevenLabs voice (Pro feature).

## Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (Auth + Data)
- **AI**: OpenAI GPT-4o-mini (chat + vision)
- **Voice**: ElevenLabs (Pro feature)
- **Payments**: Stripe (coming soon)

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# ElevenLabs (Optional - for Pro voice feature)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## Database Setup (Supabase)

### Required Tables

#### 1. `user_profiles`
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  plan_type TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### 2. `user_message_counts`
```sql
CREATE TABLE user_message_counts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_message_counts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own count
CREATE POLICY "Users can read own count"
  ON user_message_counts FOR SELECT
  USING (auth.uid() = user_id);
```

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Features

### Free Tier
- ✅ 10 messages per day
- ✅ Send photos to Foo
- ✅ Authentic Salinas slang
- ✅ Mobile-optimized chat UI
- ✅ Light/Dark mode

### Foo Pro ($5/month)
- ✅ Unlimited messages
- ✅ Voice responses from Foo 🔊
- ✅ Priority support
- ✅ No ads

## API Endpoints

### POST /api/chat
Chat with Foo, analyze images, and get voice responses (Pro only).

**Request:**
```typescript
FormData {
  message: string
  image?: File
  userId?: string
  isPro?: 'true' | 'false'
  includeVoice?: 'true' | 'false'
}
```

**Response:**
```json
{
  "message": "Foo's response...",
  "audioUrl": "data:audio/mpeg;base64,...",
  "messagesLeft": 7
}
```

### POST /api/usage
Get user's remaining message count.

**Request:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "messagesLeft": 7,
  "count": 3
}
```

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy!

### Important Notes
- Set `SUPABASE_SERVICE_ROLE_KEY` for server-side operations
- ElevenLabs is optional - app works without it
- Stripe integration is TODO - manual upgrades for now

## Testing Checklist

### Free User Flow
- [ ] Sign up new account
- [ ] Send 10 messages
- [ ] Hit limit and see pricing modal
- [ ] Image upload works
- [ ] Voice button hidden (not Pro)

### Pro User Flow
- [ ] Upgrade to Pro (manual DB update for now)
- [ ] Unlimited messages work
- [ ] Voice button appears
- [ ] Voice playback works
- [ ] PRO badge shows in header

### Mobile Testing
- [ ] Landing page loads correctly
- [ ] "Start Chatting" button visible without scroll
- [ ] Chat UI is mobile-optimized
- [ ] Image upload works on mobile
- [ ] Keyboard doesn't break layout

### Auth Flow
- [ ] Sign up works
- [ ] Sign in works
- [ ] Sign out works
- [ ] Session persists on refresh
- [ ] Forgot password works

## Troubleshooting

### "Daily limit reached" but user hasn't sent 10 messages
- Check `user_message_counts` table
- Verify `last_message_at` date logic
- Reset count manually if needed

### Voice not working
- Check `ELEVENLABS_API_KEY` is set
- Verify user is Pro
- Check browser console for errors
- Ensure ElevenLabs quota isn't exceeded

### Images not uploading
- Check file size < 20MB
- Verify file type is image/*
- Check OpenAI API quota
- Look for CORS issues

## Development Tips

### Test Pro Features Locally
Manually set `is_pro = true` in Supabase:
```sql
UPDATE user_profiles SET is_pro = true WHERE email = 'your@email.com';
```

### Reset Daily Limit
```sql
UPDATE user_message_counts SET count = 0 WHERE user_id = 'uuid';
```

### Monitor Costs
- OpenAI GPT-4o-mini: ~$0.15 per 1M input tokens
- ElevenLabs: ~$0.30 per 1K characters
- Image uploads use OpenAI vision (detail: 'low' for cost savings)

## Future Improvements
- [ ] Stripe payment integration
- [ ] Chat history persistence
- [ ] Message reactions
- [ ] Share Foo roasts
- [ ] Custom voice selection
- [ ] Analytics dashboard

## Support
For issues or questions, contact the development team or open an issue on GitHub.






