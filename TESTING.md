# FooChat Testing Guide

## Pre-Testing Setup

### 1. Environment Variables
Ensure you have a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=... (optional)
```

### 2. Database Tables
Run the SQL from `SETUP.md` to create:
- `user_profiles`
- `user_message_counts`

### 3. Test Accounts
Create test accounts:
- `free@test.com` / `test123` (free tier)
- `pro@test.com` / `test123` (manually set `is_pro = true`)

---

## Test Cases

### 🔐 Authentication Flow

#### Test 1: Sign Up
1. Click "Sign in" on landing page
2. Switch to "Sign up" mode
3. Enter: `test+${Date.now()}@test.com` / `password123`
4. Submit form
5. ✅ Should show success message
6. ✅ Should create user_profile in DB
7. ✅ Should auto-login (or show "check email" if confirmation enabled)

#### Test 2: Sign In
1. Open auth modal
2. Enter existing credentials
3. ✅ Should login successfully
4. ✅ Should show "Welcome back!"
5. ✅ Session should persist on page refresh
6. ✅ localStorage should contain 'foome-auth-token'

#### Test 3: Sign Out
1. While logged in, find sign out button
2. Click sign out
3. ✅ Should return to landing page
4. ✅ Should clear session
5. ✅ Should clear localStorage auth token

#### Test 4: Forgot Password
1. Open auth modal -> "Forgot password?"
2. Enter email
3. ✅ Should show "email sent" success
4. ✅ Check inbox for Supabase reset email

---

### 💬 Chat Flow (Free User)

#### Test 5: First Message
1. Login as free user
2. Click "Start Chatting"
3. Type "Hey foo what's up?"
4. Click send
5. ✅ Should show loading state
6. ✅ Should receive Foo's response in slang
7. ✅ Header should show "9/10 left"
8. ✅ Response should be 2-4 sentences, funny, with emojis

#### Test 6: Image Upload
1. In chat, click 📸 button
2. Select an image (< 20MB)
3. ✅ Should show preview with X to remove
4. ✅ Send button should light up
5. Type "roast this pic"
6. Send message
7. ✅ Should analyze image with GPT-4o-mini vision
8. ✅ Foo should roast the image content
9. ✅ Counter should decrement

#### Test 7: Hit Free Limit
1. Send 10 total messages as free user
2. Try to send 11th message
3. ✅ Should show "Daily limit reached" notification
4. ✅ Pricing modal should auto-open
5. ✅ Header should show "0/10 left"
6. ✅ Send button should be disabled or block

#### Test 8: Upgrade Prompt
1. As free user with 2 messages left
2. ✅ Should see reminder below input
3. ✅ "Only 2 messages left today • Upgrade to Pro"
4. Click upgrade link
5. ✅ Pricing modal opens

---

### ⚡ Pro User Features

#### Test 9: Pro Badge & Unlimited Messages
1. Set user to Pro in DB:
   ```sql
   UPDATE user_profiles SET is_pro = true WHERE email = 'test@test.com';
   ```
2. Refresh page
3. ✅ Header shows "PRO" badge
4. ✅ No message counter shown
5. Send 20+ messages
6. ✅ All should work without limit

#### Test 10: Voice Feature (Pro Only)
1. As Pro user, send message "what's good?"
2. Wait for response
3. ✅ Should see 🔊 Play button
4. Click Play button
5. ✅ Should play ElevenLabs audio
6. ✅ Audio should sound natural
7. As free user, voice button should NOT appear

---

### 📱 Mobile Testing

#### Test 11: Landing Page Mobile
1. Open on mobile device or DevTools mobile view
2. ✅ "Start Chatting" button visible without scrolling
3. ✅ Feature cards are compact
4. ✅ All text is readable
5. ✅ Layout doesn't overflow

#### Test 12: Chat UI Mobile
1. Open chat on mobile
2. ✅ Chat fills screen properly
3. ✅ Input field doesn't hide behind keyboard
4. ✅ Messages scroll smoothly
5. ✅ Image upload works
6. ✅ Close button is accessible

#### Test 13: Image Upload Mobile
1. On mobile, click 📸
2. Select photo from camera/gallery
3. ✅ Preview shows correctly
4. ✅ Can remove image
5. ✅ Send works
6. ✅ Large images (up to 20MB) upload

---

### 🎨 Theme Testing

#### Test 14: Dark/Light Mode
1. Click theme toggle (🌙/☀️)
2. ✅ Should switch instantly
3. ✅ All text remains readable
4. ✅ Vintage paper look in light mode
5. ✅ Dark mode has good contrast
6. ✅ Preference persists on refresh

---

### 💰 Monetization Flow

#### Test 15: Pricing Modal
1. Click "Go Pro - $5/mo" on landing
2. ✅ Modal shows two columns: Free vs Pro
3. ✅ Shows all features clearly
4. ✅ "Upgrade to Pro" button visible
5. ✅ If not logged in, shows "Sign in first" message

#### Test 16: Upgrade Button
1. As free user in chat
2. Click "Upgrade" button in header
3. ✅ Pricing modal opens
4. ✅ Shows current plan (Free)
5. ✅ Highlights Pro benefits

---

### 🐛 Error Handling

#### Test 17: No Internet
1. Disconnect internet
2. Try to send message
3. ✅ Should show error notification
4. ✅ Message should not be added to chat
5. ✅ Input should remain

#### Test 18: Large Image Rejection
1. Try to upload 30MB image
2. ✅ Should show "Image must be smaller than 20MB" error
3. ✅ Should not upload

#### Test 19: Invalid File Type
1. Try to upload a .txt file
2. ✅ Should show "Please select an image file" error

#### Test 20: Session Expiry
1. Wait for session to expire (or manually delete token)
2. Try to send message
3. ✅ Should handle gracefully
4. ✅ Should prompt to login again

---

### 🔍 API Testing

#### Test 21: Chat API - Text Only
```bash
curl -X POST http://localhost:3000/api/chat \
  -F "message=hey foo" \
  -F "userId=test-uuid" \
  -F "isPro=false"
```
✅ Should return:
```json
{
  "message": "Ayy what's good...",
  "messagesLeft": 9
}
```

#### Test 22: Chat API - With Image
```bash
curl -X POST http://localhost:3000/api/chat \
  -F "message=roast this" \
  -F "image=@test.jpg" \
  -F "userId=test-uuid" \
  -F "isPro=false"
```
✅ Should analyze image and roast it

#### Test 23: Chat API - Limit Exceeded
Send 11 requests as same free user
✅ 11th should return:
```json
{
  "error": "Daily message limit reached...",
  "code": "LIMIT_EXCEEDED"
}
```
Status: 402

#### Test 24: Usage API
```bash
curl -X POST http://localhost:3000/api/usage \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-uuid"}'
```
✅ Should return:
```json
{
  "messagesLeft": 7,
  "count": 3
}
```

---

## Performance Testing

### Test 25: Response Time
1. Send message
2. ✅ Should respond in < 5 seconds
3. ✅ Loading animation should be smooth

### Test 26: Image Processing
1. Upload 15MB image
2. ✅ Should upload in < 10 seconds
3. ✅ Should process and respond in < 8 seconds

### Test 27: Concurrent Users
Simulate 10 users sending messages simultaneously
✅ All should succeed without errors

---

## Browser Compatibility

### Test 28: Cross-Browser
Test on:
- ✅ Chrome (desktop + mobile)
- ✅ Firefox
- ✅ Safari (desktop + mobile)
- ✅ Edge

All features should work consistently.

---

## Regression Testing

### Test 29: After Updates
After any code change, run:
1. Sign in/out flow
2. Send free message
3. Hit limit
4. Upload image
5. Theme toggle
6. Mobile layout

✅ All should still work

---

## Known Issues & Limitations

1. **Voice Generation**: Requires ElevenLabs API key, costs $0.30/1K chars
2. **Daily Limit Reset**: Resets at midnight UTC (not user timezone)
3. **Image Size**: Max 20MB (Next.js has default 4MB body limit - may need config)
4. **Stripe**: Not yet integrated - manual Pro upgrades only
5. **Chat History**: Not persisted - clears on refresh

---

## Manual Testing Checklist

Before deployment, complete this checklist:

- [ ] Sign up works
- [ ] Sign in works
- [ ] Free user can send 10 messages
- [ ] Limit enforcement works
- [ ] Pro users get unlimited messages
- [ ] Voice works for Pro users
- [ ] Image upload works
- [ ] Pricing modal works
- [ ] Mobile UI is responsive
- [ ] Theme toggle works
- [ ] Error messages are helpful
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Database tables exist
- [ ] Environment variables set

---

## Automated Testing (Future)

Consider adding:
- Jest unit tests for API routes
- Cypress E2E tests for user flows
- Playwright for cross-browser testing
- Load testing with k6 or Artillery

---

## Deployment Testing

After deploying to Vercel/production:

1. ✅ Environment variables are set
2. ✅ Supabase connection works
3. ✅ OpenAI API calls succeed
4. ✅ Sign up/in flows work
5. ✅ Free tier limits work
6. ✅ Images upload and process
7. ✅ Mobile experience is good
8. ✅ HTTPS works
9. ✅ No CORS errors
10. ✅ Monitoring/logs are set up

---

## Troubleshooting Common Issues

### "Failed to fetch" errors
- Check API route is deployed
- Verify environment variables
- Check network tab for details

### Session not persisting
- Check localStorage is enabled
- Verify Supabase auth config
- Look for 'foome-auth-token' in storage

### Images not uploading
- Check file size < 20MB
- Verify OpenAI API key is valid
- Check Next.js body size limit

### Voice not playing
- Verify user is Pro
- Check ElevenLabs API key
- Look for audio playback errors in console

---

## Success Criteria

FooChat is ready to launch when:
1. All critical test cases pass
2. No blocker bugs exist
3. Mobile experience is polished
4. Performance is acceptable (< 5s responses)
5. Error handling is graceful
6. Monetization flow is clear
7. Documentation is complete

🎉 **Ready to ship!**



