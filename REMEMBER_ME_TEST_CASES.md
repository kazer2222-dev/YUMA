# Remember Me Test Cases - Detailed Specifications

## Overview

Three new test cases have been added to validate the "Remember Me" functionality and device switching behavior. These tests ensure proper session management and security when users log in from multiple devices.

---

## Test Cases Added

### SI-07: Remember Me = True: Log in, close browser, reopen — should still be logged in

**Priority:** P1 (High)  
**Type:** Functional + Security  
**Module:** Sign In

**Objective:**  
Verify that when a user logs in with "Remember Me" checked, their session persists after closing and reopening the browser.

**Test Steps:**
1. Navigate to `/auth` page
2. Enter valid email address
3. **Check "Remember me" checkbox**
4. Submit email and enter PIN
5. Verify successful login and redirect to dashboard/home
6. **Close browser completely** (all windows and tabs)
7. **Reopen browser** and navigate to the application
8. Verify user is still logged in (should see dashboard, not auth page)

**Expected Result:**
- User remains logged in after browser restart
- Dashboard/home page is accessible without re-authentication
- Session cookies are persistent (30-day expiration)

**Technical Details:**
- Uses persistent cookies with 30-day expiration
- Cookies stored with `maxAge` attribute
- Session stored in database with extended expiration

**Automated Test:** ✅ Created in `tests/e2e/auth.spec.ts`

---

### SI-08: Remember Me = False: Log in, close all tabs, reopen — should be logged out

**Priority:** P1 (High)  
**Type:** Functional + Security  
**Module:** Sign In

**Objective:**  
Verify that when a user logs in WITHOUT "Remember Me" checked, their session is cleared when all browser tabs are closed.

**Test Steps:**
1. Navigate to `/auth` page
2. Enter valid email address
3. **DO NOT check "Remember me" checkbox** (ensure it's unchecked)
4. Submit email and enter PIN
5. Verify successful login and redirect to dashboard/home
6. **Close all browser tabs/windows**
7. **Reopen browser** and navigate to the application
8. Verify user is logged out (should see auth page, not dashboard)

**Expected Result:**
- User is logged out after closing all browser tabs
- Auth page is shown when accessing the application
- Session cookies are cleared (session cookies, not persistent)

**Technical Details:**
- Uses session cookies (no `maxAge` attribute)
- Cookies expire when browser session ends
- Session stored in database but cookies not persisted

**Automated Test:** ✅ Created in `tests/e2e/auth.spec.ts`

---

### SI-09: Device switching: Log in with "Remember Me" from Device A, then Device B — Device A should be logged out

**Priority:** P1 (High)  
**Type:** Security  
**Module:** Sign In

**Objective:**  
Verify that when a user logs in with "Remember Me" from a new device, all previous device sessions are invalidated for security.

**Test Steps:**
1. **Device A:** Navigate to `/auth` page
2. **Device A:** Enter email and **check "Remember me" checkbox**
3. **Device A:** Complete sign in with PIN
4. **Device A:** Verify logged in on dashboard/home
5. **Device B:** Open application in different browser/device/incognito window
6. **Device B:** Navigate to `/auth` page
7. **Device B:** Enter **same email** and **check "Remember me" checkbox**
8. **Device B:** Complete sign in with PIN
9. **Device B:** Verify logged in on dashboard/home
10. **Device A:** Refresh page or try to access protected route
11. **Device A:** Verify logged out (should see auth page, not dashboard)

**Expected Result:**
- Device B login succeeds
- Device A session is invalidated
- Device A is automatically logged out
- Device A must re-authenticate to access protected routes

**Technical Details:**
- When `rememberMe = true`, all other sessions for the user are deleted
- Only the new session remains active
- Previous device cookies become invalid
- Security measure to prevent unauthorized access from old devices

**Automated Test:** ✅ Created in `tests/e2e/auth.spec.ts`

---

## Implementation Details

### Cookie Behavior

**Remember Me = True:**
```typescript
// Persistent cookies (30 days)
response.cookies.set('accessToken', token, {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60, // 30 days
});
```

**Remember Me = False:**
```typescript
// Session cookies (expire on browser close)
response.cookies.set('accessToken', token, {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  // No maxAge = session cookie
});
```

### Session Invalidation Logic

When `rememberMe = true`:
```typescript
// Delete all other sessions for this user
await prisma.session.deleteMany({
  where: {
    userId: user.id,
    // Keep only the new session
  }
});
```

---

## Manual Testing Instructions

### For SI-07 (Remember Me = True)

1. Open browser and go to `http://localhost:3000/auth`
2. Enter email: `test-user@example.com`
3. **Check the "Remember me" checkbox**
4. Click "Send PIN" or submit email
5. Enter PIN: `123456` (dev mode)
6. Verify redirect to `/home` or `/dashboard`
7. **Completely close the browser** (File → Exit or close all windows)
8. **Reopen the browser**
9. Navigate to `http://localhost:3000/home`
10. **Expected:** Should see dashboard/home page (still logged in)
11. **If redirected to `/auth`:** Test fails ❌

### For SI-08 (Remember Me = False)

1. Open browser and go to `http://localhost:3000/auth`
2. Enter email: `test-user@example.com`
3. **Ensure "Remember me" checkbox is UNCHECKED**
4. Click "Send PIN" or submit email
5. Enter PIN: `123456` (dev mode)
6. Verify redirect to `/home` or `/dashboard`
7. **Close all browser tabs** (or close browser completely)
8. **Reopen the browser**
9. Navigate to `http://localhost:3000/home`
10. **Expected:** Should see auth page (logged out)
11. **If still on dashboard:** Test fails ❌

### For SI-09 (Device Switching)

**Option 1: Two Different Browsers**
1. **Chrome:** Open `http://localhost:3000/auth`
2. **Chrome:** Log in with "Remember me" checked
3. **Chrome:** Verify logged in
4. **Firefox:** Open `http://localhost:3000/auth` (same email)
5. **Firefox:** Log in with "Remember me" checked
6. **Firefox:** Verify logged in
7. **Chrome:** Refresh page or navigate to `/home`
8. **Chrome:** **Expected:** Should see auth page (logged out) ❌

**Option 2: Incognito/Private Window**
1. **Normal Window:** Open `http://localhost:3000/auth`
2. **Normal Window:** Log in with "Remember me" checked
3. **Normal Window:** Verify logged in
4. **Incognito Window:** Open `http://localhost:3000/auth` (same email)
5. **Incognito Window:** Log in with "Remember me" checked
6. **Incognito Window:** Verify logged in
7. **Normal Window:** Refresh page
8. **Normal Window:** **Expected:** Should see auth page (logged out) ❌

---

## Automated Test Execution

Run the automated tests:

```bash
# Run all authentication tests
npm run test:e2e tests/e2e/auth.spec.ts

# Run specific test
npx playwright test -g "SI-07"
npx playwright test -g "SI-08"
npx playwright test -g "SI-09"

# Run with UI mode (recommended for debugging)
npx playwright test --ui tests/e2e/auth.spec.ts
```

---

## Test Checklist Integration

These test cases have been added to:
- ✅ `TEST_EXECUTION_CHECKLIST.md` - Test tracking document
- ✅ `QUICK_START_TESTING.md` - Quick start guide
- ✅ `tests/e2e/auth.spec.ts` - Automated test suite

**Test IDs:**
- SI-07: Remember Me = True persistence
- SI-08: Remember Me = False session expiry
- SI-09: Device switching session invalidation

---

## Known Issues & Notes

### Browser Behavior Differences

- **Chrome/Edge:** Session cookies persist until browser is completely closed
- **Firefox:** Session cookies may persist across browser restarts in some configurations
- **Safari:** Session cookies are cleared when all tabs are closed

### Testing Considerations

1. **Clear browser data** between test runs to avoid cookie conflicts
2. **Use different browsers** or incognito windows for device switching tests
3. **Check browser console** for cookie expiration times
4. **Verify database** sessions are properly deleted for SI-09

### Edge Cases to Test

- [ ] What happens if user logs in from Device B while Device A is actively using the app?
- [ ] What if Device A tries to make an API call after Device B logs in?
- [ ] What if user logs in from Device B, then immediately logs out?
- [ ] What if user logs in from Device B without "Remember Me", then logs in with "Remember Me"?

---

## Related Documentation

- `REMEMBER_ME_IMPLEMENTATION.md` - Implementation details
- `TEST_EXECUTION_CHECKLIST.md` - Test tracking
- `QUICK_START_TESTING.md` - Manual testing guide
- `lib/auth.ts` - Authentication service implementation

---

**Last Updated:** [Current Date]  
**Status:** ✅ Ready for Testing













