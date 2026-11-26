import { test, expect } from '@playwright/test';

/**
 * Sputnik8-style Tour Page & Continuous Booking + Guest Registration E2E Tests
 *
 * Covers both Desktop (chromium) and Mobile (Mobile Chrome):
 * 1. Top "Check Availability" button is visible and smoothly scrolls to #booking-section (no modal/sticky bar).
 * 2. #booking-section is naturally integrated into the page with 5-6 horizontal date tiles, prev/next navigation,
 *    booking options (guests/times/add-ons), live price calculation, and Book Now + Ask a Question buttons.
 * 3. Selecting a date tile, updating guests (verifying live price recalculation), and clicking Book Now
 *    opens ContinuousBookingModal directly at Step 2 (Traveler Information & Auto-Registration) with preserved state.
 * 4. Account /auth prefill via ?email= query parameter works cleanly.
 */

test.describe('Sputnik8-style Continuous Booking & Registration UX', () => {
  test('1. Top Check Availability scrolls to in-page booking section, horizontal date tiles & live price work, and Book opens Step 2', async ({ page }) => {
    await page.goto('/tours');
    const firstTourLink = page.locator('a[href^="/tours/"]').locator('visible=true').first();
    await expect(firstTourLink).toBeVisible({ timeout: 10000 });
    const href = await firstTourLink.getAttribute('href');
    await page.goto(href!);

    const isMobile = (page.viewportSize()?.width ?? 1280) < 1024;
    const tag = isMobile ? 'mobile' : 'desktop';

    // 1. Top Check Availability button must be visible on both desktop and mobile
    const checkAvailBtn = page.locator('button:has-text("Check Availability")').locator('visible=true').first();
    await expect(checkAvailBtn).toBeVisible({ timeout: 8000 });

    // Verify no permanently sticky desktop sidebar or fixed mobile bottom booking bar
    await expect(page.locator('aside')).toHaveCount(0);
    await expect(page.locator('.fixed.bottom-0 button:has-text("Book Now")')).toHaveCount(0);

    await checkAvailBtn.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `e2e/screenshots/sputnik8-1-top-check-availability-${tag}.png` });

    // 2. Click Check Availability -> scrolls to #booking-section without opening a modal
    await checkAvailBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    const bookingSection = page.locator('#booking-section');
    await expect(bookingSection).toBeVisible({ timeout: 5000 });
    await bookingSection.scrollIntoViewIfNeeded();

    // 3. Horizontal date tiles: 5 visible on mobile, 6 visible on desktop
    const visibleTiles = bookingSection.locator('[data-date-tile]').locator('visible=true');
    const tileCount = await visibleTiles.count();
    expect(tileCount).toBeGreaterThanOrEqual(5);
    expect(tileCount).toBeLessThanOrEqual(6);

    // Test horizontal next/prev navigation
    const firstTileBefore = await visibleTiles.first().getAttribute('data-date-tile');
    const nextBtn = bookingSection.locator('button[aria-label="Next dates"]');
    await nextBtn.click();
    await page.waitForTimeout(200);
    const firstTileAfter = await visibleTiles.first().getAttribute('data-date-tile');
    expect(firstTileAfter).not.toBe(firstTileBefore);

    // Navigate back
    const prevBtn = bookingSection.locator('button[aria-label="Previous dates"]');
    if (await prevBtn.isEnabled()) {
      await prevBtn.click();
      await page.waitForTimeout(200);
    }

    // Select an available date tile
    const enabledTile = bookingSection.locator('[data-date-tile]:not([disabled])').locator('visible=true').first();
    await enabledTile.click();
    const chosenDate = await enabledTile.getAttribute('data-date-tile');
    await expect(enabledTile).toHaveAttribute('aria-pressed', 'true');

    // 4. Verify live price updates when incrementing Adults count
    const totalPriceEl = bookingSection.locator('[data-testid="booking-total-price"]');
    await expect(totalPriceEl).toBeVisible();
    const initialTotalText = await totalPriceEl.innerText();

    // Increment adults (+) — first "+" button inside guests block
    const plusButtons = bookingSection.locator('button:has(path[d*="M12 4v16"])');
    if ((await plusButtons.count()) > 0) {
      await plusButtons.first().click();
      await page.waitForTimeout(150);
      const updatedTotalText = await totalPriceEl.innerText();
      if (initialTotalText !== '$0') {
        expect(updatedTotalText).not.toBe(initialTotalText);
      }
    }

    await bookingSection.screenshot({ path: `e2e/screenshots/sputnik8-2-booking-section-tiles-${tag}.png` });

    // 5. Click Book Now -> opens ContinuousBookingModal at Step 2 (Traveler Information / Integrated Guest Registration)
    const bookBtn = bookingSection.locator('button:has-text("Book Now")').first();
    if (await bookBtn.isEnabled()) {
      await bookBtn.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Should land directly on Step 2 (Traveler Information / Integrated Guest Registration)
      await expect(dialog.locator('text=/Traveler Information|No separate signup needed|Signed in as/i').first()).toBeVisible({ timeout: 5000 });
      await expect(dialog.locator('input[placeholder*="Maria"]').first()).toBeVisible();
      await expect(dialog.locator('input[type="email"]').first()).toBeVisible();

      if (chosenDate) {
        await expect(dialog.locator(`text=${chosenDate}`).first()).toBeVisible();
      }

      await page.screenshot({ path: `e2e/screenshots/sputnik8-3-modal-step2-registration-${tag}.png` });
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
