# FooMe Quick Start Checklist ✅

Follow this checklist to get FooMe up and running in minutes!

---

## Prerequisites

- [ ] **Node.js installed** (v18 or higher)
  - Download from: https://nodejs.org/
  - Verify: `node --version`

- [ ] **Git installed** (optional, for version control)
  - Download from: https://git-scm.com/

---

## Setup Steps

### 1. Install Dependencies ✅

- [ ] Open terminal in project folder
- [ ] Run: `npm install`
- [ ] Wait for installation to complete

**OR** on Windows:
- [ ] Double-click `RunFoo.bat` (it will auto-install)

---

### 2. Get OpenAI API Key 🔑

- [ ] Go to https://platform.openai.com/api-keys
- [ ] Sign in or create account
- [ ] Click "Create new secret key"
- [ ] Copy the key (starts with `sk-...`)
- [ ] **IMPORTANT**: Save it somewhere safe (you can't see it again!)

---

### 3. Create Environment File 📝

- [ ] In project root, create a file named `.env.local`
- [ ] Open `.env.local` in a text editor
- [ ] Add this line:
  ```
  OPENAI_API_KEY=sk-your-actual-key-here
  ```
- [ ] Replace `sk-your-actual-key-here` with your real API key
- [ ] Save the file

**Optional but recommended:**

- [ ] Get Supabase credentials (for user auth):
  - Go to https://supabase.com/dashboard
  - Create project
  - Copy URL and anon key
  - Add to `.env.local`:
    ```
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
    ```

---

### 4. Run FooMe 🚀

**Windows Users:**
- [ ] Double-click `RunFoo.bat`
- [ ] Browser should auto-open to http://localhost:3000

**Mac/Linux Users:**
- [ ] Open terminal in project folder
- [ ] Run: `npm run dev`
- [ ] Open browser to http://localhost:3000

---

### 5. Test It Out 🎨

- [ ] Upload a photo (JPG/PNG, under 10MB)
- [ ] Select a style (photoreal, cartoon, illustration, action figure)
- [ ] Click "Generate Foo Avatar"
- [ ] Wait for AI to generate (10-30 seconds)
- [ ] Download your Foo avatar!

---

## Troubleshooting 🔧

### App won't start

**Error: "Cannot find module"**
- [ ] Run `npm install` again
- [ ] Delete `node_modules` folder and `package-lock.json`
- [ ] Run `npm install` again

**Error: "Port 3000 already in use"**
- [ ] Close other apps using port 3000
- [ ] Or change port: `npm run dev -- -p 3001`

---

### OpenAI errors

**"OpenAI API key not configured"**
- [ ] Check `.env.local` exists in project root
- [ ] Verify `OPENAI_API_KEY=sk-...` is on its own line
- [ ] No spaces before/after the `=` sign
- [ ] Restart the dev server (Ctrl+C, then run again)

**"Insufficient credits"**
- [ ] Go to https://platform.openai.com/account/billing
- [ ] Add credits to your OpenAI account

**"Rate limit exceeded"**
- [ ] Wait a few minutes
- [ ] Try again
- [ ] Check your OpenAI usage limits

---

### Image upload issues

**"Image too large"**
- [ ] Compress image to under 10MB
- [ ] Use a different photo

**"Invalid file type"**
- [ ] Only PNG, JPG, WEBP are supported
- [ ] Convert image to supported format

---

## Optional Enhancements 🎁

### Enable User Authentication

- [ ] Set up Supabase (see `FOOME_SETUP.md`)
- [ ] Add Supabase env vars to `.env.local`
- [ ] Run SQL migrations in Supabase dashboard
- [ ] Users can now sign up/sign in

### Enable Pro Subscriptions

- [ ] Set up Stripe (see `STRIPE_SETUP.md`)
- [ ] Add Stripe env vars to `.env.local`
- [ ] Configure webhooks
- [ ] Test checkout flow

---

## Success Criteria ✅

You'll know FooMe is working when:

- [x] App loads at http://localhost:3000
- [x] You can upload a photo
- [x] Photo preview appears
- [x] Clicking "Generate" shows loading state
- [x] Generated Foo avatar appears after 10-30 seconds
- [x] You can download the avatar

---

## Need Help? 🆘

- **Setup Guide**: See `FOOME_SETUP.md`
- **Transformation Details**: See `FOOME_TRANSFORMATION_SUMMARY.md`
- **README**: See `README.md`

---

## What's Next? 🚀

Once FooMe is running:

1. **Customize Styles**: Edit `lib/foomeStylePresets.ts`
2. **Add Watermarking**: Implement for free tier
3. **Deploy**: Push to Vercel or your hosting platform
4. **Share**: Show off your Foo avatars!

---

**Happy Foo-ing!** 🎨✨






