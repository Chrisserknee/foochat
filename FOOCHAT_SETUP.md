# FooChat - Setup Guide

## 🎉 What is FooChat?

A mobile-first AI chatbot that talks in authentic Salinas "Foo" slang. Send pictures, get roasted. Premium users get voice responses.

## ✅ Features Implemented

### Core Chat
- ✅ Mobile-optimized chat interface
- ✅ Real-time messaging with GPT-4o-mini
- ✅ Image upload and analysis (Foo roasts your pics)
- ✅ Authentic Salinas slang personality
- ✅ Message history (in-memory, persists during session)

### Premium Features ($5/mo)
- ✅ Unlimited messages (vs 10/day free)
- ✅ Voice responses via ElevenLabs (Foo speaks!)
- ✅ Premium badge
- Uses existing Stripe infrastructure

### Tech Stack
- Next.js 15 (App Router)
- OpenAI GPT-4o-mini (chat + vision)
- ElevenLabs (voice generation)
- Supabase (auth + database)
- Stripe (subscriptions)
- Tailwind CSS (mobile-first styling)

## 🚀 Quick Start

### 1. Environment Variables

Add to your `.env.local`:

```bash
# OpenAI (Required)
OPENAI_API_KEY=sk-...

# ElevenLabs (Optional - for voice)
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB  # Or your custom voice

# Supabase (Existing)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe (Existing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

### 2. Install Dependencies

```bash
npm install
```

Dependencies already installed:
- `openai` - GPT API
- `@supabase/supabase-js` - Database & auth
- `stripe` - Payments

### 3. Run Development Server

```bash
npm run dev
```

Or use the launcher:
```bash
RunFoo.bat
```

Visit `http://localhost:3000` (or whatever port it starts on)

## 📱 Mobile Optimization

The interface is designed **mobile-first**:

- ✅ Responsive layout (works 320px+)
- ✅ Touch-friendly buttons (44px+ tap targets)
- ✅ Fixed input at bottom (chat app style)
- ✅ Compact header (more screen for chat)
- ✅ Image preview & removal
- ✅ Auto-scroll to new messages
- ✅ Loading states with animations

### Testing on Mobile

1. **Dev Server:** Access via your phone's browser at `http://YOUR_IP:3001`
2. **Responsive Testing:** Chrome DevTools > Toggle device toolbar
3. **Real Device:** Deploy to Vercel, test on actual phone

## 🎤 ElevenLabs Voice Setup

### Getting API Key:

1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Go to Profile → API Keys
3. Copy your API key to `.env.local`

### Choosing a Voice:

**Default:** Adam voice (`pNInz6obpgDQGcFmaJgB`) - young male, good for "Foo"

**Custom Voice:**
1. Go to elevenlabs.io/voice-lab
2. Clone your own voice or design one
3. Copy the Voice ID
4. Set `ELEVENLABS_VOICE_ID=your-id` in `.env.local`

**Recommended Settings:**
- Stability: 0.5 (allows variation)
- Similarity Boost: 0.75 (keeps character)
- Model: `eleven_monolingual_v1` (fast, English only)

## 💰 Pricing & Monetization

### Free Tier
- 10 messages per day
- Text responses only
- Reset daily

### Premium ($5/month)
- Unlimited messages
- Voice responses (Foo speaks!)
- Premium badge
- Priority support

### Stripe Products:

Update your Stripe dashboard:
1. Create product: "FooChat Premium"
2. Price: $5/month recurring
3. Update product ID in your subscription code

## 🎭 Foo Personality

The AI is programmed to:

- **Use "Foo" naturally** (like "dude" or "bro")
- **Salinas references** (Steinbeck, lettuce capital, Oldtown, rodeo)
- **Mix Spanish phrases** (no mames, órale, qué onda)
- **Roast with love** (chaotic but never mean)
- **React to images** (roast outfits, locations, funny moments)
- **Keep it short** (2-4 sentences, text-message style)
- **High energy** (emojis, exclamations, dramatic)

### Example Responses:

**Image of outfit:**
> "Foo really thought that fit was it 💀 Nah but you look good tho, just messin"

**Salinas landmark:**
> "No mames, you went to the Steinbeck Center? That's lowkey cultural foo"

**Random selfie:**
> "Bro why you look like you just saw a ghost at the Oldtown Saloon 😂"

## 📊 Usage Tracking (TODO)

Need to implement in Supabase:

### Table: `chat_usage`
```sql
CREATE TABLE chat_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  messages_today INT DEFAULT 0,
  last_reset TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Integration:
- Check daily limit before responding
- Increment counter after successful response
- Reset counter at midnight UTC

## 🐛 Known Issues / TODOs

- [ ] Usage tracking not implemented (currently just shows "10/10")
- [ ] Chat history not saved to database (only in-memory)
- [ ] No "Clear Chat" button in UI
- [ ] Voice playback could be smoother (stream instead of data URL)
- [ ] Image uploads not optimized (could compress before sending)
- [ ] No rate limiting on API endpoint
- [ ] No profanity filter (Foo keeps it PG-13 but could slip)

## 🚀 Deployment

### Vercel (Recommended):

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Environment Variables to Set:
- All vars from `.env.local`
- Make sure to add `ELEVENLABS_API_KEY` for voice

### Post-Deployment:
1. Test on mobile device
2. Set up Stripe webhook for production
3. Monitor OpenAI usage (can get expensive!)
4. Check ElevenLabs character limits

## 💡 Viral Marketing Ideas

1. **Screenshot-worthy responses** - Foo's roasts are shareable
2. **"Roast Me" challenge** - Encourage users to share their roasts
3. **Salinas pride** - Local community will love the references
4. **TikTok demos** - Show Foo roasting outfits/pics
5. **Freemium model** - 10 free messages hooks users, voice upsells

## 📞 Support

- OpenAI docs: [platform.openai.com/docs](https://platform.openai.com/docs)
- ElevenLabs docs: [docs.elevenlabs.io](https://docs.elevenlabs.io)
- Supabase docs: [supabase.com/docs](https://supabase.com/docs)

---

**Status:** ✅ MVP Complete - Ready for testing!
**Next:** Add usage tracking, persist chat history, deploy!






