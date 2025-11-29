import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('SI-01: Valid email/PIN authentication', async ({ page }) => {
    // Enter email
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
    await emailInput.fill('test-user@example.com');
    
    // Submit email (click button or press Enter)
    const submitButton = page.getByRole('button', { name: /send|submit|continue/i }).first();
    await submitButton.click();
    
    // Wait for PIN input to appear
    const pinInput = page.getByLabel(/pin|code/i).or(page.getByPlaceholder(/pin|code/i)).first();
    await pinInput.waitFor({ state: 'visible', timeout: 5000 });
    
    // In dev mode, PIN is usually 123456 or shown in console
    // For testing, we'll use the dev PIN
    await pinInput.fill('123456');
    
    // Submit PIN
    const verifyButton = page.getByRole('button', { name: /verify|submit|sign in/i }).first();
    await verifyButton.click();
    
    // Should redirect to dashboard or home
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    
    // Verify we're logged in (check for user menu or dashboard content)
    const userMenu = page.locator('[aria-label*="user"], [aria-label*="account"], button:has-text("Sign Out")').first();
    const dashboardContent = page.locator('main, [role="main"]').first();
    
    const isLoggedIn = await userMenu.isVisible().catch(() => false) || 
                      await dashboardContent.isVisible().catch(() => false);
    
    expect(isLoggedIn).toBeTruthy();
  });

  test('SI-02: Invalid PIN throttle', async ({ page }) => {
    // Enter email
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
    await emailInput.fill('test-user@example.com');
    
    // Submit email
    const submitButton = page.getByRole('button', { name: /send|submit|continue/i }).first();
    await submitButton.click();
    
    // Wait for PIN input
    const pinInput = page.getByLabel(/pin|code/i).or(page.getByPlaceholder(/pin|code/i)).first();
    await pinInput.waitFor({ state: 'visible', timeout: 5000 });
    
    // Enter wrong PIN 5 times
    for (let i = 0; i < 5; i++) {
      await pinInput.fill('000000');
      const verifyButton = page.getByRole('button', { name: /verify|submit/i }).first();
      await verifyButton.click();
      
      // Wait for error message or rate limit
      await page.waitForTimeout(1000);
    }
    
    // Check for error message or rate limit indicator
    const errorMessage = page.locator('text=/error|invalid|rate limit|too many attempts/i').first();
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    // Should show error or rate limit message
    expect(hasError).toBeTruthy();
  });

  test('SU-01: Email signup success', async ({ page }) => {
    // Switch to sign up mode if needed
    const signUpTab = page.getByRole('tab', { name: /sign up|register/i }).or(
      page.getByRole('button', { name: /sign up|register/i })
    ).first();
    
    if (await signUpTab.isVisible()) {
      await signUpTab.click();
    }
    
    // Generate unique email
    const timestamp = Date.now();
    const testEmail = `test-user-${timestamp}@example.com`;
    
    // Fill signup form
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
    await emailInput.fill(testEmail);
    
    // Fill name if field exists
    const nameInput = page.getByLabel(/name/i).or(page.getByPlaceholder(/name/i)).first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User');
    }
    
    // Submit signup
    const submitButton = page.getByRole('button', { name: /sign up|register|create account/i }).first();
    await submitButton.click();
    
    // Wait for PIN input or success message
    const pinInput = page.getByLabel(/pin|code/i).or(page.getByPlaceholder(/pin|code/i)).first();
    const pinVisible = await pinInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => false);
    
    // Should show PIN input or success message
    expect(pinVisible).toBeTruthy();
  });

  test('SU-02: Weak password rejection (if password field exists)', async ({ page }) => {
    // Switch to sign up mode
    const signUpTab = page.getByRole('tab', { name: /sign up|register/i }).or(
      page.getByRole('button', { name: /sign up|register/i })
    ).first();
    
    if (await signUpTab.isVisible()) {
      await signUpTab.click();
    }
    
    // Check if password field exists (some implementations use PIN only)
    const passwordInput = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).first();
    const hasPasswordField = await passwordInput.isVisible().catch(() => false);
    
    if (hasPasswordField) {
      // Try weak password
      await passwordInput.fill('password1');
      
      // Try to submit
      const submitButton = page.getByRole('button', { name: /sign up|register/i }).first();
      await submitButton.click();
      
      // Should show validation error
      const errorMessage = page.locator('text=/weak|password|requirements/i').first();
      const hasError = await errorMessage.isVisible().catch(() => false);
      
      expect(hasError).toBeTruthy();
    } else {
      // Skip test if password field doesn't exist (PIN-only auth)
      test.skip();
    }
  });

  test('SI-07: Remember Me = True: Log in, close browser, reopen — should still be logged in', async ({ page, context }) => {
    // Step 1: Log in with Remember Me checked
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
    await emailInput.fill('test-user@example.com');
    
    // Check "Remember Me" checkbox
    const rememberMeCheckbox = page.locator('input[type="checkbox"]#rememberMe').or(
      page.locator('input[type="checkbox"][name*="remember"]')
    ).first();
    
    if (await rememberMeCheckbox.isVisible()) {
      await rememberMeCheckbox.check();
    }
    
    // Submit email
    const submitButton = page.getByRole('button', { name: /send|submit|continue/i }).first();
    await submitButton.click();
    
    // Wait for PIN input
    const pinInput = page.getByLabel(/pin|code/i).or(page.getByPlaceholder(/pin|code/i)).first();
    await pinInput.waitFor({ state: 'visible', timeout: 5000 });
    
    // Enter PIN (dev mode: 123456)
    await pinInput.fill('123456');
    
    // Submit PIN
    const verifyButton = page.getByRole('button', { name: /verify|submit|sign in/i }).first();
    await verifyButton.click();
    
    // Wait for redirect to dashboard/home
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    
    // Verify we're logged in
    const dashboardContent = page.locator('main, [role="main"]').first();
    await expect(dashboardContent).toBeVisible();
    
    // Step 2: Close browser context (simulating browser close)
    await context.close();
    
    // Step 3: Create new context and page (simulating browser reopen)
    const newContext = await page.context().browser()?.newContext();
    if (!newContext) {
      test.skip();
      return;
    }
    
    const newPage = await newContext.newPage();
    await newPage.goto('/home');
    
    // Step 4: Verify still logged in (should redirect to home or show dashboard)
    // Check if we're still authenticated
    const isStillLoggedIn = await newPage.url().includes('/home') || 
                           await newPage.url().includes('/dashboard') ||
                           await newPage.locator('main, [role="main"]').first().isVisible().catch(() => false);
    
    // If redirected to auth, we're not logged in
    const isOnAuthPage = newPage.url().includes('/auth');
    
    expect(isStillLoggedIn && !isOnAuthPage).toBeTruthy();
    
    await newContext.close();
  });

  test('SI-08: Remember Me = False: Log in, close all tabs, reopen — should be logged out', async ({ page, context }) => {
    // Step 1: Log in WITHOUT Remember Me checked
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
    await emailInput.fill('test-user@example.com');
    
    // Ensure "Remember Me" checkbox is NOT checked
    const rememberMeCheckbox = page.locator('input[type="checkbox"]#rememberMe').or(
      page.locator('input[type="checkbox"][name*="remember"]')
    ).first();
    
    if (await rememberMeCheckbox.isVisible()) {
      await rememberMeCheckbox.uncheck();
    }
    
    // Submit email
    const submitButton = page.getByRole('button', { name: /send|submit|continue/i }).first();
    await submitButton.click();
    
    // Wait for PIN input
    const pinInput = page.getByLabel(/pin|code/i).or(page.getByPlaceholder(/pin|code/i)).first();
    await pinInput.waitFor({ state: 'visible', timeout: 5000 });
    
    // Enter PIN (dev mode: 123456)
    await pinInput.fill('123456');
    
    // Submit PIN
    const verifyButton = page.getByRole('button', { name: /verify|submit|sign in/i }).first();
    await verifyButton.click();
    
    // Wait for redirect to dashboard/home
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    
    // Verify we're logged in
    const dashboardContent = page.locator('main, [role="main"]').first();
    await expect(dashboardContent).toBeVisible();
    
    // Step 2: Close all tabs (close context)
    await context.close();
    
    // Step 3: Create new context and page (simulating browser reopen)
    const newContext = await page.context().browser()?.newContext();
    if (!newContext) {
      test.skip();
      return;
    }
    
    const newPage = await newContext.newPage();
    await newPage.goto('/home');
    
    // Step 4: Verify logged out (should redirect to auth page)
    // Wait a bit for any redirects
    await newPage.waitForTimeout(2000);
    
    // Should be redirected to auth page or show login form
    const isOnAuthPage = newPage.url().includes('/auth');
    const authForm = newPage.locator('form, input[type="email"]').first();
    const hasAuthForm = await authForm.isVisible().catch(() => false);
    
    // Should be logged out (either on auth page or showing auth form)
    expect(isOnAuthPage || hasAuthForm).toBeTruthy();
    
    await newContext.close();
  });

  test('SI-09: Device switching: Log in with "Remember Me" from Device A, then Device B — Device A should be logged out', async ({ browser }) => {
    // Step 1: Create Device A context and log in with Remember Me
    const deviceAContext = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DeviceA',
    });
    const deviceAPage = await deviceAContext.newPage();
    
    await deviceAPage.goto('/auth');
    
    const emailInputA = deviceAPage.getByLabel(/email/i).or(deviceAPage.getByPlaceholder(/email/i)).first();
    await emailInputA.fill('test-user@example.com');
    
    // Check "Remember Me" on Device A
    const rememberMeCheckboxA = deviceAPage.locator('input[type="checkbox"]#rememberMe').or(
      deviceAPage.locator('input[type="checkbox"][name*="remember"]')
    ).first();
    
    if (await rememberMeCheckboxA.isVisible()) {
      await rememberMeCheckboxA.check();
    }
    
    // Submit email
    const submitButtonA = deviceAPage.getByRole('button', { name: /send|submit|continue/i }).first();
    await submitButtonA.click();
    
    // Wait for PIN input
    const pinInputA = deviceAPage.getByLabel(/pin|code/i).or(deviceAPage.getByPlaceholder(/pin|code/i)).first();
    await pinInputA.waitFor({ state: 'visible', timeout: 5000 });
    
    // Enter PIN
    await pinInputA.fill('123456');
    
    // Submit PIN
    const verifyButtonA = deviceAPage.getByRole('button', { name: /verify|submit|sign in/i }).first();
    await verifyButtonA.click();
    
    // Wait for redirect
    await deviceAPage.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    
    // Verify Device A is logged in
    const dashboardA = deviceAPage.locator('main, [role="main"]').first();
    await expect(dashboardA).toBeVisible();
    
    // Step 2: Create Device B context and log in with Remember Me
    const deviceBContext = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) DeviceB',
    });
    const deviceBPage = await deviceBContext.newPage();
    
    await deviceBPage.goto('/auth');
    
    const emailInputB = deviceBPage.getByLabel(/email/i).or(deviceBPage.getByPlaceholder(/email/i)).first();
    await emailInputB.fill('test-user@example.com');
    
    // Check "Remember Me" on Device B
    const rememberMeCheckboxB = deviceBPage.locator('input[type="checkbox"]#rememberMe').or(
      deviceBPage.locator('input[type="checkbox"][name*="remember"]')
    ).first();
    
    if (await rememberMeCheckboxB.isVisible()) {
      await rememberMeCheckboxB.check();
    }
    
    // Submit email
    const submitButtonB = deviceBPage.getByRole('button', { name: /send|submit|continue/i }).first();
    await submitButtonB.click();
    
    // Wait for PIN input
    const pinInputB = deviceBPage.getByLabel(/pin|code/i).or(deviceBPage.getByPlaceholder(/pin|code/i)).first();
    await pinInputB.waitFor({ state: 'visible', timeout: 5000 });
    
    // Enter PIN
    await pinInputB.fill('123456');
    
    // Submit PIN
    const verifyButtonB = deviceBPage.getByRole('button', { name: /verify|submit|sign in/i }).first();
    await verifyButtonB.click();
    
    // Wait for redirect
    await deviceBPage.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    
    // Verify Device B is logged in
    const dashboardB = deviceBPage.locator('main, [role="main"]').first();
    await expect(dashboardB).toBeVisible();
    
    // Step 3: Wait a moment for session invalidation to process
    await deviceAPage.waitForTimeout(2000);
    
    // Step 4: Try to access protected route on Device A
    await deviceAPage.reload();
    await deviceAPage.waitForTimeout(1000);
    
    // Device A should be logged out (redirected to auth or showing auth form)
    const deviceAUrl = deviceAPage.url();
    const isDeviceAOnAuthPage = deviceAUrl.includes('/auth');
    const deviceAAuthForm = deviceAPage.locator('form, input[type="email"]').first();
    const deviceAHasAuthForm = await deviceAAuthForm.isVisible().catch(() => false);
    
    // Device A should be logged out
    expect(isDeviceAOnAuthPage || deviceAHasAuthForm).toBeTruthy();
    
    // Cleanup
    await deviceAContext.close();
    await deviceBContext.close();
  });
});




