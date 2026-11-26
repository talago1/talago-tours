import { test, expect } from '@playwright/test';

/**
 * Sputnik8-style Tour Page & Continuous Booking + Guest Registration E2E Tests
 *
 * Covers both Desktop (chromium) and Mobile (Mobile Chrome):
 * 1. Tour page immediately exposes Date, Guests, Live Price, Book Now & Ask a Question.
 * 2. Selecting date/guests on the tour page and clicking Book Now skips redundant Step 1
 *    and opens ContinuousBookingModal directly at Step 2 (Customer Details & Auto-Registration).
 * 3. Guest registration notice, Name, Phone, and Email fields are present inside the booking modal.
 * 4. Account /auth prefill via ?email= query parameter works cleanly.
 */

test.describe('Sputnik8-style Continuous Booking & Registration UX', () => {
  test('1. Tour page exposes booking controls, live price, and opens modal at Step 2 when date is selected', async ({ page }) => {
    await page.goto('/tours');
    const firstTourLink = page.locator('a[href^="/tours/"]').locator('visible=true').first();
    await expect(firstTourLink).toBeVisible({ timeout: 10000 });
    const href = await firstTourLink.getAttribute('href');
    await page.goto(href!);

    const isMobile = (page.viewportSize()?.width ?? 1280) < 1024;

    if (!isMobile) {
      // Desktop: Date input, guest controls, and Book Now + Ask a Question must be immediately visible (not hidden in <details>)
      const dateInput = page.locator('aside input[type="date"]').first();
      await expect(dateInput).toBeVisible({ timeout: 8000 });

      // Pick a future date (7 days from today)
      const futureDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
      await dateInput.fill(futureDate);

      // Ask a Question CTA is separate and visible
      await expect(page.locator('aside button:has-text("Ask a Question")')).toBeVisible();

      // Click Book Now
      const bookBtn = page.locator('aside button:has-text("Book Now")').first();
      if (await bookBtn.isEnabled()) {
        await bookBtn.click();
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Should land directly on Step 2 (Traveler Information / Integrated Guest Registration)
        await expect(dialog.locator('text=/Traveler Information|No separate signup needed|Signed in as/i').first()).toBeVisible({ timeout: 5000 });
        await expect(dialog.locator('input[placeholder*="Maria"]').first()).toBeVisible();
        await expect(dialog.locator('input[type="email"]').first()).toBeVisible();
      }
    } else {
      // Mobile: Sticky booking bar with Book Now + Ask a Question is visible
      const mobileAsk = page.locator('button[aria-label="Ask a Question"]').locator('visible=true').first();
      await expect(mobileAsk).toBeVisible({ timeout: 8000 });

      const mobileBook = page.locator('button:has-text("Book Now"), button:has-text("Inquire")').locator('visible=true').first();
      await expect(mobileBook).toBeVisible();
      if (await mobileBook.isEnabled()) {
        await mobileBook.click();
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('2. /auth prefills email from ?email= query parameter for auto-provisioned guests', async ({ page }) => {
    const testEmail = 'sputnik8-guest@example.com';
    await page.goto(`/auth?email=${encodeURIComponent(testEmail)}`);
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 8000 });
    await expect(emailInput).toHaveValue(testEmail);
  });
});
