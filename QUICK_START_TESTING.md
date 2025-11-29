# Quick Start Testing Guide

## Get Started in 5 Minutes

### Step 1: Install Playwright (2 minutes)

```bash
npm install -D @playwright/test
npx playwright install
```

### Step 2: Create Your First Test (1 minute)

Create `tests/e2e/landing-page.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should load landing page', async ({ page }) => {
    await expect(page).toHaveTitle(/YUMA/i);
  });

  test('should have sign in button', async ({ page }) => {
    const signInButton = page.getByRole('link', { name: /sign in/i });
    await expect(signInButton).toBeVisible();
  });

  test('should navigate to auth page on sign in click', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/.*auth/);
  });
});
```

### Step 3: Run Your First Test (1 minute)

```bash
# Make sure your dev server is running
npm run dev

# In another terminal, run tests
npx playwright test

# Or run with UI mode (recommended for learning)
npx playwright test --ui
```

### Step 4: View Results (1 minute)

```bash
npx playwright show-report
```

---

## Manual Testing Quick Start

### 1. Landing Page Testing (15 minutes)

**Test LP-01: Hero renders on desktop**

1. Open browser: `http://localhost:3000`
2. Check if hero section is visible
3. Verify text is readable
4. Check if images load
5. Measure page load time (should be < 2.5 seconds)
6. ✅ Pass or ❌ Fail

**Test LP-03: CTA scroll tracking**

1. Click "Get Started" or "Sign In" button
2. Verify smooth scroll or navigation
3. Check browser console for analytics events (if applicable)
4. ✅ Pass or ❌ Fail

### 2. Sign In Testing (20 minutes)

**Test SI-01: Valid email/PIN authentication**

1. Navigate to `/auth` page
2. Enter email: `test-user@example.com` (or create one)
3. Click "Send PIN"
4. Check console for PIN (dev mode: `123456`)
5. Enter PIN
6. Verify redirect to dashboard
7. ✅ Pass or ❌ Fail

**Test SI-02: Invalid PIN throttle**

1. Enter valid email
2. Enter wrong PIN 5 times
3. Verify error message appears
4. Check if rate limiting activates (captcha or delay)
5. ✅ Pass or ❌ Fail

**Test SI-07: Remember Me = True: Log in, close browser, reopen — should still be logged in**

1. Navigate to `/auth` page
2. Enter email and check "Remember me" checkbox
3. Complete sign in with PIN
4. Verify you're logged in and on dashboard/home
5. Close browser completely (all windows/tabs)
6. Reopen browser and navigate to the app
7. Verify you're still logged in (should see dashboard, not auth page)
8. ✅ Pass or ❌ Fail

**Test SI-08: Remember Me = False: Log in, close all tabs, reopen — should be logged out**

1. Navigate to `/auth` page
2. Enter email but DO NOT check "Remember me" checkbox
3. Complete sign in with PIN
4. Verify you're logged in and on dashboard/home
5. Close all browser tabs/windows
6. Reopen browser and navigate to the app
7. Verify you're logged out (should see auth page, not dashboard)
8. ✅ Pass or ❌ Fail

**Test SI-09: Device switching: Log in with "Remember Me" from Device A, then Device B — Device A should be logged out**

1. **Device A:** Navigate to `/auth` page
2. **Device A:** Enter email and check "Remember me" checkbox
3. **Device A:** Complete sign in with PIN
4. **Device A:** Verify logged in on dashboard/home
5. **Device B:** Open app in different browser/device/incognito window
6. **Device B:** Navigate to `/auth` page
7. **Device B:** Enter same email and check "Remember me" checkbox
8. **Device B:** Complete sign in with PIN
9. **Device B:** Verify logged in on dashboard/home
10. **Device A:** Refresh page or try to access protected route
11. **Device A:** Verify logged out (should see auth page, not dashboard)
12. ✅ Pass or ❌ Fail

### 3. Sign Up Testing (20 minutes)

**Test SU-01: Email signup success**

1. Navigate to `/auth` page
2. Switch to "Sign Up" mode
3. Enter new email: `newuser-${Date.now()}@example.com`
4. Complete signup form
5. Verify email sent (check console or email)
6. Enter PIN from email
7. Verify onboarding wizard starts
8. ✅ Pass or ❌ Fail

---

## Test Data Setup

### Create Test Users

Run this script to create test users:

```bash
# Create admin user (if not exists)
npm run seed:admin

# Or manually create via Prisma Studio
npm run db:studio
```

### Test User Accounts

| Email | Role | Password/PIN | Purpose |
|-------|------|--------------|---------|
| `admin@test.com` | Admin | Check console | Admin testing |
| `user@test.com` | User | `123456` (dev) | Regular user testing |
| `readonly@test.com` | Read-only | `123456` (dev) | Permission testing |

---

## Common Testing Scenarios

### Scenario 1: Complete User Journey

1. **Landing Page** → Click "Sign Up"
2. **Sign Up** → Create new account
3. **Onboarding** → Complete wizard
4. **Dashboard** → Verify widgets load
5. **Create Task** → Use quick create
6. **View Task** → Open task details
7. **Edit Task** → Update task
8. **Logout** → Verify session cleared

**Time:** ~10 minutes
**Priority:** P0

### Scenario 2: Authentication Edge Cases

1. Sign in with invalid email format
2. Sign in with non-existent email
3. Sign in with wrong PIN multiple times
4. Sign in with expired PIN
5. Sign in with Google OAuth
6. Sign out and verify session cleared

**Time:** ~15 minutes
**Priority:** P0

### Scenario 3: Permission Testing

1. Login as admin → Verify all features accessible
2. Login as regular user → Verify limited access
3. Login as read-only → Verify no edit capabilities
4. Try to access admin routes as non-admin
5. Verify proper error messages

**Time:** ~20 minutes
**Priority:** P1

---

## Browser Testing Checklist

### Desktop Browsers

- [ ] Chrome (latest)
- [ ] Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (if on Mac)

### Mobile Browsers (Responsive)

- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Test in portrait mode
- [ ] Test in landscape mode

### Screen Sizes

- [ ] Desktop: 1920x1080
- [ ] Laptop: 1366x768
- [ ] Tablet: 768x1024
- [ ] Mobile: 375x667

---

## Performance Testing Quick Checks

### Lighthouse Audit

1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Performance", "Accessibility", "Best Practices"
4. Click "Generate report"
5. Check scores:
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90

### Network Throttling

1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Reload page
4. Verify page still loads (may be slower)
5. Check for broken images/features

---

## Security Quick Checks

### 1. Authentication Security

- [ ] Passwords/PINs not visible in network requests
- [ ] Session tokens are HttpOnly cookies
- [ ] CSRF tokens present in forms
- [ ] Rate limiting works on login attempts

### 2. Authorization Security

- [ ] Cannot access admin routes as regular user
- [ ] Cannot access other users' data
- [ ] API endpoints check permissions
- [ ] Direct URL access to protected routes redirects

### 3. Input Validation

- [ ] XSS attempts are sanitized
- [ ] SQL injection attempts fail
- [ ] File uploads are validated
- [ ] Email format is validated

---

## Daily Testing Routine

### Morning (30 minutes)

1. **Smoke Tests** (10 min)
   - Landing page loads
   - Sign in works
   - Dashboard loads
   - Can create a task

2. **Check Test Checklist** (5 min)
   - Review yesterday's results
   - Plan today's tests

3. **Execute 3-5 Test Cases** (15 min)
   - Focus on P0 priority
   - Document findings

### Afternoon (30 minutes)

1. **Bug Verification** (10 min)
   - Test fixed bugs
   - Update bug status

2. **Automation Development** (20 min)
   - Convert passed manual tests to automated
   - Run automated test suite

---

## Troubleshooting

### Tests Not Running?

```bash
# Check if Playwright is installed
npx playwright --version

# Reinstall browsers
npx playwright install

# Check if dev server is running
curl http://localhost:3000
```

### Can't Sign In?

1. Check if test user exists in database
2. Check console for PIN (dev mode)
3. Verify email service is configured
4. Check database connection

### Tests Failing?

1. Check browser console for errors
2. Verify test data exists
3. Check network requests in DevTools
4. Review test logs: `npx playwright show-report`

---

## Next Steps

1. ✅ Complete Quick Start tests above
2. 📋 Review full test plan in `platform.plan.md`
3. 📝 Start using `TEST_EXECUTION_CHECKLIST.md`
4. 🗺️ Follow `TESTING_ROADMAP.md` for phased approach
5. 🤖 Begin automation with Playwright

---

## Resources

- **Test Plan:** `platform.plan.md`
- **Test Checklist:** `TEST_EXECUTION_CHECKLIST.md`
- **Roadmap:** `TESTING_ROADMAP.md`
- **Playwright Docs:** https://playwright.dev
- **Jest Docs:** https://jestjs.io

---

**Ready to start?** Begin with Landing Page tests (LP-01) and work through the checklist!




