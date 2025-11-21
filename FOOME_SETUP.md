# FooMe Setup Guide

## Welcome to FooMe! 🎨

FooMe transforms your photos into stunning Foo avatars using AI. This guide will help you get started.

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# OpenAI API Key (REQUIRED for image generation)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (REQUIRED for auth & database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration (for Pro subscriptions)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Optional: Resend for email notifications
RESEND_API_KEY=your_resend_api_key
```

#### Getting Your API Keys

**OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and paste it into `.env.local` as `OPENAI_API_KEY`

**Supabase:**
1. Go to https://supabase.com/dashboard
2. Create a new project or use existing
3. Go to Project Settings > API
4. Copy the URL and anon/public key

**Stripe:**
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your publishable and secret keys
3. Set up webhook endpoint for subscriptions

### 3. Run Development Server

**Option A: Using the Windows Launcher**
```bash
RunFoo.bat
```

**Option B: Manual Start**
```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

---

## Features

### Free Tier
- ✅ 1 preview per image
- ✅ 512x512 resolution
- ✅ Watermarked output
- ✅ All 4 styles available

### Pro Tier (Subscription Required)
- ✅ Up to 4 variants per image
- ✅ 1024x1024 HD resolution
- ✅ No watermark
- ✅ Transparent background option
- ✅ Premium style packs

---

## Available Styles

1. **Photo Real** - Cinematic, photorealistic West Coast style
2. **Cartoon** - Bold vector cartoon with clean lines
3. **Illustration** - Hand-illustrated poster art
4. **Action Figure** - Collectible figure with studio lighting

---

## Privacy & Security

- Photos are temporarily stored only during processing
- Auto-deleted after generation completes
- OpenAI does not train on API data
- Secure authentication via Supabase

---

## Troubleshooting

### "OpenAI API key not configured"
- Ensure `OPENAI_API_KEY` is set in `.env.local`
- Restart the dev server after adding the key

### "Image upload failed"
- Check file size (max 10MB)
- Supported formats: PNG, JPG, WEBP
- Try a different image

### Auth issues
- Clear browser localStorage
- Check Supabase configuration
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

---

## Support

For issues or questions:
- Check the docs
- Review error messages in browser console
- Verify all environment variables are set correctly

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **AI:** OpenAI DALL-E API
- **Auth:** Supabase
- **Payments:** Stripe
- **Styling:** Tailwind CSS + Custom CSS Variables

---

Enjoy creating amazing Foo avatars! 🎉



