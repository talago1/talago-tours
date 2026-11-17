import { test, expect } from '@playwright/test';

test.describe('Marketplace Consolidation & UX Density Tests', () => {
  test('Mobile viewport renders compact horizontal list cards', async ({ page }) => {
    // Set viewport to mobile standard 390x844 (iPhone 12/13/14)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tours');

    // Wait for catalog to load
    await expect(page.locator('#catalog')).toBeVisible();

    // Check tour cards on mobile
    const tourCards = page.locator('article.group');
    const count = await tourCards.count();

    if (count > 0) {
      const firstCard = tourCards.first();
      await expect(firstCard).toBeVisible();

      // Ensure first card has horizontal list orientation styling or compact dimensions
      const boundingBox = await firstCard.boundingBox();
      expect(boundingBox).not.toBeNull();
      if (boundingBox) {
        // High density mobile list card should be ~130-180px in height, NOT 450-550px like the old card
        expect(boundingBox.height).toBeLessThanOrEqual(200);
      }
    }
  });

  test('Desktop viewport renders rich grid cards', async ({ page }) => {
    // Set viewport to desktop 1280x800
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tours');

    await expect(page.locator('#catalog')).toBeVisible();

    const tourCards = page.locator('article.group');
    const count = await tourCards.count();

    if (count > 0) {
      const firstCard = tourCards.first();
      await expect(firstCard).toBeVisible();

      const boundingBox = await firstCard.boundingBox();
      expect(boundingBox).not.toBeNull();
      if (boundingBox) {
        // Desktop cards are full-sized cards with aspect 4/3 image and content
        expect(boundingBox.height).toBeGreaterThan(250);
      }
    }
  });

  test('Tour detail page renders natural decision hierarchy without duplicate cancellation banners', async ({ page }) => {
    await page.goto('/tours/desert-safari-3h-atv');

    // Ensure the main tour content renders
    await expect(page.locator('h1').first()).toBeVisible();

    // Verify Cancellation Policy is in an organized section/accordion
    await expect(page.locator('button:has-text("Cancellation"), h3:has-text("Cancellation")').first()).toBeVisible();

    // Booking CTA exists and is visible (sidebar on desktop, sticky bar on mobile)
    const bookingCta = page.locator('button:has-text("Book Now"), a:has-text("Book Now"), button:has-text("Reserve")').locator('visible=true').first();
    await expect(bookingCta).toBeVisible();
  });

  test('Admin delete-workflow and bulk booking endpoints enforce unauthorized authentication gates', async ({ request }) => {
    // Calling admin delete-workflow API without admin session must return 401
    const deleteWorkflowRes = await request.get('/api/admin/tours/dummy-id/delete-workflow');
    expect(deleteWorkflowRes.status()).toBe(401);

    const postDeleteRes = await request.post('/api/admin/tours/dummy-id/delete-workflow', {
      data: { option: 'OPTION_A_PRESERVE_BOOKINGS' },
    });
    expect(postDeleteRes.status()).toBe(401);

    // Calling admin bulk bookings API without admin session must return 401
    const bulkPreviewRes = await request.get('/api/admin/bookings/bulk?year=2026&month=11&dateBasis=travelDate');
    expect(bulkPreviewRes.status()).toBe(401);

    const bulkPostRes = await request.post('/api/admin/bookings/bulk', {
      data: { action: 'ARCHIVE_ALL', year: 2026, month: 11 },
    });
    expect(bulkPostRes.status()).toBe(401);
  });
});
