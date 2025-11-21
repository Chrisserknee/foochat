# 🎤 FooMe (FooChat)

> AI Chat with Salinas Foo Personality & Advanced Voice Mode

FooMe is an AI-powered chat application featuring **Foo**, a dynamic AI assistant with an authentic Salinas, California personality that evolves from friendly to hilariously savage as conversations progress. Built with Next.js, featuring real-time voice conversations and image analysis.

## 🌟 Features

### 🗣️ Advanced Foo (AF) Mode
- **Continuous voice conversations** - Talk to Foo naturally with automatic speech detection
- **Mobile-optimized** - Auto-stops recording when you finish speaking
- **Real-time audio** - Foo responds with authentic voice using ElevenLabs
- **Image analysis** - Send photos for Foo to roast and analyze live

### 💬 Foo's Personality
- **Dynamic evolution** - Starts friendly, becomes progressively more sarcastic and savage
- **Turn-based progression**:
  - Turn 1: Friendly and welcoming
  - Turns 2-3: Sarcasm kicks in (50%)
  - Turns 4-5: Harsh roasting mode (80%)
  - Turn 6+: Full savage (90%)
- **Salinas slang** - Authentic local dialect and references
- **Context memory** - Remembers last 30 messages (15 full conversations)

### 🎨 User Experience
- **Dark mode** with "East Salinas at night" police light effects
- **Smooth animations** - Polished transitions and effects
- **Mobile-first design** - Optimized for phone and desktop
- **Crisis prevention** - Built-in safety features with helpline resources

### 🔐 Authentication & Pro Features
- Supabase authentication (email/password)
- Free tier with daily message limits
- Pro tier with unlimited messages and features
- Stripe integration for subscriptions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- OpenAI API key (for GPT-4o-mini)
- ElevenLabs API key (for voice generation)
- Stripe account (for Pro subscriptions)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Chrisserknee/foochat.git
cd foochat
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Products
STRIPE_PRO_MONTHLY_PRICE_ID=your_monthly_price_id
STRIPE_PRO_YEARLY_PRICE_ID=your_yearly_price_id
```

4. **Set up Supabase tables**

Run the SQL in `supabase_tables.sql` to create required tables:
- `profiles`
- `usage_tracking`
- `user_progress`
- And others as needed

5. **Run the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see FooMe in action!

### Testing on Mobile

Use ngrok to test on your phone:
```bash
node start-foome.js
```

This will automatically start the dev server and create an ngrok tunnel.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini
- **Voice**: ElevenLabs (Pablo Marshal voice)
- **Payments**: Stripe
- **Speech Recognition**: Web Speech API (desktop), MediaRecorder API (mobile)

## 📱 Key Components

- **Advanced Foo Mode** - Continuous voice conversation system
- **Image Analysis** - Send photos for Foo to analyze and roast
- **Crisis Prevention** - Safety features with automatic helpline display
- **Theme System** - Dark mode with animated police light effects
- **Conversation Memory** - Maintains context across 30 messages
- **Usage Limits** - Free tier limits with Pro upgrade path

## 🎭 Foo's Voice

Foo uses the **Pablo Marshal** voice from ElevenLabs - an authentic Mexican-accented voice that matches his Salinas personality perfectly.

## 🔒 Security Features

- Environment variable protection (`.env.local` gitignored)
- Crisis prevention with 1-hour AI lockout
- Secure Stripe webhook handling
- Supabase Row Level Security (RLS)

## 📝 Recent Updates

- ✅ Improved AF mode stability on mobile
- ✅ Fixed conversation text disappearing in AF mode
- ✅ Tripled conversation memory (10 → 30 messages)
- ✅ Protected audio playback from emergency timeouts
- ✅ Prevented race conditions in continuous listening
- ✅ Enhanced error handling and resource cleanup
- ✅ Added auto-silence detection for smoother UX

## 🤝 Contributing

This is a personal project, but feel free to fork and modify for your own use!

## 📄 License

Private project - All rights reserved

## 🙏 Acknowledgments

- OpenAI for GPT-4o-mini
- ElevenLabs for authentic voice generation
- Supabase for backend infrastructure
- The city of Salinas, CA for the inspiration

---

**Made with 🌮 in Salinas, CA**
