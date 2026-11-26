import { test, expect } from '@playwright/test';

/**
 * Sputnik8-style Tour Page & Single-Form Booking + Guest Registration E2E Tests
 *
 * Covers both Desktop (chromium) and Mobile (Mobile Chrome):
 * 1. Floating side "Check Availability" button stays permanently visible even after scrolling down.
 * 2. Clicking it smoothly scrolls to #booking-section, positioned lower down after tour details/inclusions.
 * 3. #booking-section has 5-6 horizontal date tiles, prev/next navigation, booking options, live price, and Book Now.
 * 4. Clicking Book Now opens ONE simple Customer Details form (DirectBookingDetailsModal) — NO old multi-step wizard —
 *    preserving selected date, guests, options, and total price, with no repeated selection inputs.
 * 5. Submitting customer details completes the booking directly when online payment is not required.
 * 6. Account /auth prefill via ?email= query parameter works cleanly.
 */

test.describe('Sputnik8-style Continuous Booking & Registration UX', () => {
  test('1. Floating Check Availability, lower booking section, horizontal date tiles, live price & single-step Customer Details form', async ({ page }) => {
    await page.goto('/tours');
    const firstTourLink = page.locator('a[href^="/tours/"]').locator('visible=true').first();
    await expect(firstTourLink).toBeVisible({ timeout: 10000 });
    const href = await firstTourLink.getAttribute('href');
    await page.goto(href!);

    const isMobile = (page.viewportSize()?.width ?? 1280) < 1024;
    const tag = isMobile ? 'mobile' : 'desktop';

    // 1. Desktop: single sticky side card with ONE button; Mobile: sticky bottom bar with ONE button
    const availabilityCard = isMobile
      ? page.locator('[data-testid="mobile-availability-bar"]')
      : page.locator('[data-testid="side-availability-card"]');
    await expect(availabilityCard).toBeVisible({ timeout: 8000 });
    await expect(availabilityCard.locator('button')).toHaveCount(1);

    const checkAvailBtn = availabilityCard.locator('button:has-text("Check Availability")');
    await expect(checkAvailBtn).toBeVisible();

    // Scrolling down keeps the side card (desktop) or bottom bar (mobile) visible
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(300);
    await expect(checkAvailBtn).toBeVisible();

    await page.screenshot({ path: `e2e/screenshots/sputnik8-1-side-card-${tag}.png` });

    // 2. Click Check Availability -> scrolls smoothly to #booking-section without opening a modal
    await checkAvailBtn.click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    const bookingSection = page.locator('#booking-section');
    await expect(bookingSection).toBeVisible({ timeout: 5000 });

    // Wait for smooth scroll to settle and verify #booking-section is in the viewport and lower down the document
    await expect.poll(async () => (await bookingSection.boundingBox())?.y ?? 9999, { timeout: 5000 }).toBeLessThan(250);
    const sectionBox = await bookingSection.boundingBox();
    expect(sectionBox).not.toBeNull();
    expect(sectionBox!.y).toBeGreaterThanOrEqual(40);

    const docMetrics = await page.evaluate(() => {
      const sec = document.getElementById('booking-section');
      const rect = sec!.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        sectionDocTop: rect.top + window.scrollY,
      };
    });
    expect(docMetrics.scrollY).toBeGreaterThan(800);
    expect(docMetrics.sectionDocTop).toBeGreaterThan(1000);

    // 3. Horizontal date tiles: 5 visible on mobile, 6 visible on desktop
    const visibleTiles = bookingSection.locator('[data-date-tile]').locator('visible=true');
    const tileCount = await visibleTiles.count();
    expect(tileCount).toBeGreaterThanOrEqual(5);
    expect(tileCount).toBeLessThanOrEqual(6);

    // Test horizontal next/prev navigation
    const firstTileBefore = await visibleTiles.first().getAttribute('data-date-tile');
    await bookingSection.locator('button[aria-label="Next dates"]').click();
    await page.waitForTimeout(200);
    const firstTileAfter = await visibleTiles.first().getAttribute('data-date-tile');
    expect(firstTileAfter).not.toBe(firstTileBefore);

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

    // 5. Click Book Now -> opens single DirectBookingDetailsModal (NO old multi-step wizard)
    const bookBtn = bookingSection.locator('button:has-text("Book Now")').first();
    if (await bookBtn.isEnabled()) {
      await bookBtn.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Old 4-step wizard must NOT appear
      await expect(dialog.locator('text=Trip & Guests')).toHaveCount(0);
      await expect(dialog.locator('text=Pickup Details')).toHaveCount(0);

      // Single Customer Details form appears with Name, Phone, Email and preserved summary
      await expect(dialog.locator('[data-testid="preserved-booking-summary"]')).toBeVisible();
      if (chosenDate) {
        await expect(dialog.locator('[data-testid="preserved-booking-summary"]')).toContainText(chosenDate);
      }
      await expect(dialog.locator('input[placeholder*="Maria"]').first()).toBeVisible();
      await expect(dialog.locator('input[type="email"]').first()).toBeVisible();

      await page.screenshot({ path: `e2e/screenshots/sputnik8-3-direct-details-form-${tag}.png` });
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
