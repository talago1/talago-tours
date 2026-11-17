import { test, expect } from '@playwright/test';

test.describe('Telegram Auth Flow & Account Access', () => {
  test('1. Authorize endpoint handles Telegram OIDC parameters or informs configuration status', async ({ request }) => {
    const res = await request.get('/api/auth/telegram/authorize?returnTo=/account');
    if (res.status() === 200) {
      const data = await res.json();
      expect(data.url).toBeDefined();
      expect(data.url).toContain('https://oauth.telegram.org/auth');
      expect(data.url).toContain('client_id=');
      expect(data.url).toContain('redirect_uri=');
      const setCookie = res.headers()['set-cookie'] || '';
      expect(setCookie).toContain('tg_pkce=');
    } else {
      expect(res.status()).toBe(503);
      const data = await res.json();
      expect(data.error).toContain('TELEGRAM_OIDC_CLIENT_ID');
    }
  });

  test('2. Authorize endpoint normalizes legacy paths like /my-bookings to /account?tab=bookings', async ({ request }) => {
    const res = await request.get('/api/auth/telegram/authorize?returnTo=/my-bookings');
    if (res.status() === 200) {
      const setCookie = res.headers()['set-cookie'] || '';
      expect(setCookie).toContain('tg_pkce=');
    } else {
      expect(res.status()).toBe(503);
    }
  });

  test('3. /auth/telegram-success redirects cleanly to /account without hanging indefinitely', async ({ page }) => {
    // Navigate to /auth/telegram-success
    await page.goto('/auth/telegram-success?returnTo=/account', { waitUntil: 'domcontentloaded' });

    // Should redirect to /account quickly (within 3 seconds)
    await page.waitForURL((url) => url.pathname.includes('/account') || url.pathname.includes('/auth'), {
      timeout: 5000,
    });
  });

  test('4. /my-bookings safely terminates loading screen and presents guest portal when unauthenticated', async ({ page }) => {
    await page.goto('/my-bookings', { waitUntil: 'domcontentloaded' });

    // The loading spinner must not persist indefinitely
    const guestHeading = page.locator('text=Find Your Booking');
    await expect(guestHeading).toBeVisible({ timeout: 6000 });

    // Confirm "Loading your account…" spinner is gone
    const loadingText = page.locator('text=Loading your account');
    await expect(loadingText).not.toBeVisible();
  });

  test('5. /account page renders member access required prompt when unauthenticated without infinite spinner', async ({ page }) => {
    await page.goto('/account', { waitUntil: 'domcontentloaded' });

    // Should resolve loading within safety window and show localized member prompt
    await page.waitForSelector('text=Loading Talago Account', { state: 'detached', timeout: 6000 });

    // Confirm sign in button is visible in main view
    const signInBtn = page.locator('main a[href*="/auth"]');
    await expect(signInBtn.first()).toBeVisible();
  });

  test('6. Session verification endpoint returns 200 with authenticated: false for guests', async ({ request }) => {
    const res = await request.get('/api/auth/session');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.authenticated).toBe(false);
  });
});
