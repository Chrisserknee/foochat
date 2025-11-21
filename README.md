# FooChat - AI Roast Bot 😎

> A chaotic, funny AI that talks in authentic Salinas "Foo" slang. Send pictures, get roasted. It's that simple, foo.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Add your API keys (OpenAI required, ElevenLabs optional)

# 3. Run development server
npm run dev

# Or use the Windows launcher
RunFoo.bat
```

Visit `http://localhost:3000` and start chatting!

## ✨ Features

### Free Tier
- 💬 10 messages per day
- 📸 Send images, get roasted
- 🎭 Authentic Salinas Foo personality
- 📱 Mobile-optimized chat interface

### Premium ($5/month)
- 🚀 Unlimited messages
- 🔊 Voice responses (Foo speaks!)
- 💎 Premium badge
- ⚡ Priority responses

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **AI:** OpenAI GPT-4o-mini (chat + vision)
- **Voice:** ElevenLabs Text-to-Speech
- **Auth:** Supabase
- **Payments:** Stripe
- **Hosting:** Vercel-ready

## 📋 Environment Variables

Required in `.env.local`:

```bash
# OpenAI (Required)
OPENAI_API_KEY=sk-...

# ElevenLabs (Optional - for voice feature)
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

## 🎭 The Foo Personality

**What makes Foo unique:**

- Uses "foo" constantly (like "dude" or "bro")
- Authentic Salinas slang and local references
- Mixes Spanish phrases naturally (no mames, órale)
- Roasts with love (chaotic but never mean)
- Short, punchy responses (text-message style)

**Example responses:**

> "Foo really thought that fit was it 💀 Nah but you look good tho, just messin"

> "No mames, you went to the Steinbeck Center? That's lowkey cultural foo"

> "Ayy that's what I'm talkin about! Salinas represent 🌮🔥"

## 📱 Mobile Optimization

FooChat is designed **mobile-first**:

- ✅ Responsive layout (works on any device)
- ✅ Touch-friendly interface
- ✅ Fixed input at bottom (chat app style)
- ✅ Auto-scroll to new messages
- ✅ Image upload with preview
- ✅ Loading animations

## 🎤 Voice Feature (Premium)

Premium users get voice responses:

1. User sends message
2. Foo responds with text
3. Text → Voice (ElevenLabs)
4. Play button appears
5. Hear Foo speak! 🔊

## 💰 Monetization

### Business Model:
- **Free:** 10 messages/day (hook users)
- **Premium:** $5/month (unlimited + voice)

### Revenue Potential:
- 1,000 users × 5% conversion = 50 premium = **$250/month**
- 10,000 users × 5% conversion = 500 premium = **$2,500/month**

### Costs:
- OpenAI: ~$0.001-0.003 per message
- ElevenLabs: ~$0.0002 per voice message
- Hosting: Free tier (Vercel)

## 🚀 Deployment

### Deploy to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in dashboard
```

### Post-Deployment:
1. Add all environment variables
2. Set up Stripe webhook
3. Test on mobile device
4. Monitor costs (OpenAI + ElevenLabs)

## 📊 Project Structure

```
foochat/
├── app/
│   ├── page.tsx              # Main chat interface
│   ├── layout.tsx            # App layout with theme
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # Chat API with Foo personality
│   └── globals.css           # Tailwind + custom styles
├── components/               # Reusable UI components
├── contexts/                 # Auth & Theme contexts
├── lib/                      # Utility functions
└── public/                   # Static assets
```

## 🐛 Known Issues

- [ ] Usage tracking not persisted (resets on refresh)
- [ ] Chat history not saved (in-memory only)
- [ ] No rate limiting on API endpoint

See `FOOCHAT_SETUP.md` for detailed setup and TODOs.

## 📚 Documentation

- **`FOOCHAT_SETUP.md`** - Comprehensive setup guide
- **`TRANSFORMATION_TO_FOOCHAT.md`** - How we pivoted from FooMe
- **`DALL_E_IMPROVEMENTS.md`** - Old approach (deprecated)

## 🎉 Why FooChat?

### vs. FooMe (previous image transformation app):

| Feature | FooMe | FooChat |
|---------|-------|---------|
| Response Time | 10-30s | 1-3s |
| User Experience | Wait for image | Instant chat |
| Viral Potential | Medium | **HIGH** |
| Reliability | Low | **High** |
| Cost per Use | $0.02-0.08 | $0.001-0.003 |
| Mobile UX | Desktop-first | **Mobile-first** |

FooChat is faster, cheaper, more reliable, and way more fun! 🎉

## 🤝 Contributing

Want to make Foo better?

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - Feel free to use this for your own projects!

## 💬 Support

Questions? Issues? Want to share your Foo roasts?

- Open an issue
- Check the docs
- Test it on mobile!

---

**Built with ❤️ and a whole lot of foo energy**

*Now go get roasted, foo!* 😎🔥
