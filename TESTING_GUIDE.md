# FooChat - Testing Guide for New Navbar & Sign-Up System

## Quick Start

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open your browser**:
   ```
   http://localhost:3000
   ```

3. **You should see**:
   - ✅ A sticky navbar at the top
   - ✅ FooChat logo and branding
   - ✅ Theme toggle button
   - ✅ "Sign In" and "Sign Up Free" buttons

---

## Test Scenarios

### 1. Test Sign-Up Flow (New User)

**Steps:**
1. Click **"Sign Up Free"** button in navbar
2. Modal should open with sign-up form
3. Enter test email: `test@example.com`
4. Enter password: `password123` (6+ characters)
5. Click **"Create Account"**
6. Check for success message: "Account created! Check your email to verify."
7. Modal should close after 2 seconds
8. Navbar should now show your email and "Sign Out" button

**Expected Result:**
- ✅ User is signed up
- ✅ User profile created in database
- ✅ Navbar updates to show logged-in state
- ✅ "Upgrade to Pro" button visible

---

### 2. Test Sign-Up with Existing Email

**Steps:**
1. Click **"Sign Up Free"** button
2. Enter the same email from Test 1
3. Enter any password
4. Click **"Create Account"**

**Expected Result:**
- ⚠️ Error message: "An account with this email already exists"
- ⚠️ After 2 seconds, automatically switches to Sign In mode

---

### 3. Test Sign-In Flow

**Steps:**
1. Sign out if logged in (click "Sign Out" in navbar)
2. Click **"Sign In"** button in navbar
3. Enter email from Test 1
4. Enter correct password
5. Click **"Sign In"**

**Expected Result:**
- ✅ Success message: "Welcome back!"
- ✅ Modal closes
- ✅ Navbar shows user email
- ✅ User session persists (refresh page and still logged in)

---

### 4. Test Wrong Password

**Steps:**
1. Sign out if logged in
2. Click **"Sign In"**
3. Enter correct email
4. Enter **wrong** password
5. Click **"Sign In"**

**Expected Result:**
- ❌ Error message: "Invalid login credentials"
- ❌ User remains logged out

---

### 5. Test Forgot Password

**Steps:**
1. Click **"Sign In"** button
2. Click **"Forgot password?"** link
3. Enter your email
4. Click **"Send Reset Link"**

**Expected Result:**
- ✅ Success message: "Password reset email sent! Check your inbox."
- 📧 Check email for reset link from Supabase
- ✅ Form automatically returns to Sign In after 3 seconds

---

### 6. Test Theme Toggle

**Steps:**
1. Click the **🌙** (moon) or **☀️** (sun) icon in navbar
2. Theme should switch immediately
3. Navbar background should adapt
4. Button colors should update

**Expected Result:**
- ✅ Smooth theme transition
- ✅ Navbar maintains visibility in both themes
- ✅ All text remains readable
- ✅ Buttons maintain their styling

---

### 7. Test Upgrade to Pro (Mock)

**Steps:**
1. Make sure you're logged in as free user
2. Click **"Upgrade to Pro"** button in navbar
3. Pricing modal should open
4. View pricing options

**Expected Result:**
- ✅ Pricing modal opens
- ✅ Shows Pro plan details
- ✅ Can close modal and return to app

---

### 8. Test Sign-Out

**Steps:**
1. Make sure you're logged in
2. Click **"Sign Out"** button in navbar
3. Wait for sign-out to complete

**Expected Result:**
- ✅ User is signed out
- ✅ Navbar reverts to logged-out state
- ✅ Shows "Sign In" and "Sign Up Free" buttons again
- ✅ No error messages

---

### 9. Test Mobile Responsive Design

**Steps:**
1. Open browser DevTools (F12)
2. Enable device toolbar (responsive mode)
3. Resize to mobile width (< 768px)
4. Click hamburger menu (☰) icon

**Expected Result:**
- ✅ Logo and hamburger menu visible
- ✅ Menu expands on click
- ✅ Sign In/Sign Up buttons stack vertically
- ✅ Theme toggle still accessible
- ✅ All functionality works on mobile

---

### 10. Test Pro Badge (Manual Database Update)

**Steps:**
1. Sign up/sign in as a user
2. Open Supabase dashboard
3. Go to `user_profiles` table
4. Find your user record
5. Set `is_pro` to `true`
6. Refresh the FooChat page

**Expected Result:**
- ✅ Pro badge appears in navbar (⭐ PRO)
- ✅ "Upgrade to Pro" button disappears
- ✅ Badge has gradient background
- ✅ Badge visible on both desktop and mobile

---

### 11. Test Session Persistence

**Steps:**
1. Sign in to your account
2. Refresh the page (F5)
3. Close browser completely
4. Reopen browser and go to localhost:3000

**Expected Result:**
- ✅ User remains logged in after refresh
- ✅ User remains logged in after browser restart
- ✅ Navbar shows logged-in state immediately

---

### 12. Test Scrolling Behavior

**Steps:**
1. Scroll down the landing page
2. Observe navbar behavior

**Expected Result:**
- ✅ Navbar stays at top (sticky position)
- ✅ Backdrop blur remains visible
- ✅ Navbar remains fully functional
- ✅ Smooth scrolling experience

---

## Visual Checks

### Desktop (> 768px)
- [ ] Navbar spans full width
- [ ] Logo + text on left
- [ ] Auth buttons on right
- [ ] Theme toggle visible
- [ ] No hamburger menu
- [ ] Proper spacing between elements
- [ ] Hover effects work on all buttons

### Mobile (< 768px)
- [ ] Logo + hamburger menu visible
- [ ] Hamburger menu opens smoothly
- [ ] Buttons stack vertically in menu
- [ ] Menu closes when clicking outside
- [ ] Theme toggle still accessible
- [ ] Font sizes appropriate for mobile

---

## Performance Checks

- [ ] Navbar loads instantly
- [ ] Theme toggle is instant
- [ ] No layout shift on page load
- [ ] Smooth animations (no jank)
- [ ] Modal opens/closes smoothly
- [ ] No console errors

---

## Accessibility Checks

- [ ] Can tab through all navbar buttons
- [ ] Focus indicators visible
- [ ] Screen reader can announce all elements
- [ ] Color contrast meets WCAG standards
- [ ] All buttons have proper ARIA labels
- [ ] Keyboard shortcuts work (Enter, Escape)

---

## Common Issues & Solutions

### Issue: "Sign Up Free" does nothing
**Solution:** Check console for errors. Verify AuthModal component is imported.

### Issue: Theme doesn't change
**Solution:** Verify ThemeContext is working. Check localStorage for 'theme' key.

### Issue: User email doesn't appear after sign-in
**Solution:** Check AuthContext is providing user data. Verify Supabase connection.

### Issue: Navbar overlaps content
**Solution:** Check z-index values. Verify sticky positioning CSS.

### Issue: Mobile menu doesn't close
**Solution:** Check showMobileMenu state. Verify click handlers are working.

### Issue: Pro badge doesn't show
**Solution:** Verify user's is_pro field in database is true. Check AuthContext isPro value.

---

## Database Schema Check

Verify your `user_profiles` table has these fields:

```sql
- id (uuid) - Primary key
- email (text)
- is_pro (boolean) - Default: false
- plan_type (text) - Default: 'free'
- created_at (timestamp)
- updated_at (timestamp)
```

---

## Environment Variables Check

Verify you have these set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Quick Debug Commands

### Check if server is running:
```bash
curl http://localhost:3000
```

### Check for TypeScript errors:
```bash
npm run build
```

### Check for linting errors:
```bash
npx next lint
```

---

## Success Criteria

✅ All 12 test scenarios pass
✅ No console errors
✅ Navbar visible on all pages
✅ Auth flow works completely
✅ Mobile responsive
✅ Theme toggle works
✅ Pro badge displays correctly
✅ Session persists across refreshes

---

## Final Checklist Before Deployment

- [ ] Tested sign-up with valid email
- [ ] Tested sign-in with correct credentials
- [ ] Tested sign-out
- [ ] Tested forgot password
- [ ] Tested theme toggle
- [ ] Tested mobile menu
- [ ] Tested responsive design at 3+ screen sizes
- [ ] Checked for console errors
- [ ] Verified session persistence
- [ ] Tested Pro badge (if applicable)
- [ ] Verified all links work
- [ ] Checked accessibility
- [ ] Performance is good (< 3s page load)

---

## Report Issues

If you find bugs:

1. **Check browser console** for error messages
2. **Check Network tab** for failed API calls
3. **Verify Supabase** connection and tables
4. **Check authentication** settings in Supabase
5. **Verify environment variables** are set correctly

---

🎉 **Happy Testing!**

Your FooChat navbar and sign-up system are ready to rock! If all tests pass, you're good to deploy! 🚀

---

## Next Steps After Testing

1. **Customize Email Templates** in Supabase
2. **Add Social Auth** (Google, Facebook)
3. **Set up Analytics** to track sign-ups
4. **Configure Production Environment** variables
5. **Deploy to Vercel/Production**

Enjoy your new authentication system! 🎊






