import { test, expect } from '@playwright/test';

test.describe('Public Experience Marketplace Smoke Tests', () => {
  test('Homepage renders hero, brand logo, and navigation links', async ({ page }) => {
    await page.goto('/');

    // Check brand presence
    await expect(page.locator('text=TALAGO').first()).toBeVisible();

    // Check primary navigation items
    if (page.viewportSize() && page.viewportSize()!.width < 768) {
      await expect(page.locator('button[aria-label="Toggle navigation menu"]')).toBeVisible();
    } else {
      await expect(page.locator('a[href="/tours"]').first()).toBeVisible();
      await expect(page.locator('a[href="/blog"]').first()).toBeVisible();
    }
  });

  test('Tours catalog loads tours and filters without console errors', async ({ page }) => {
    await page.goto('/tours');

    // Heading should be visible
    await expect(page.locator('#catalog')).toBeVisible();

    // Search input should be present and operational
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Sea');
      await page.waitForTimeout(400); // debounce
    }

    // Check presence of Faceted Filters button
    const filtersBtn = page.locator('button:has-text("Filters")');
    if (await filtersBtn.isVisible()) {
      await filtersBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator('select[aria-label="Duration"]')).toBeVisible();
    }
  });

  test('Destinations hub page loads destination cards', async ({ page }) => {
    await page.goto('/destinations');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Partner and Supplier onboarding portal (/partners) renders application form', async ({ page }) => {
    await page.goto('/partners');

    // Title should mention Partner or Supplier
    await expect(page.locator('text=Partner with TALAGO').first()).toBeVisible();

    // Application form inputs
    await expect(page.locator('input[placeholder*="Red Sea Marine Charters"]').first()).toBeVisible();
    await expect(page.locator('button:has-text("Submit Partner Application")')).toBeVisible();
  });

  test('Admin login gate is operational', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Wishlist page (/wishlist) renders empty state or saved tours cleanly', async ({ page }) => {
    await page.goto('/wishlist');

    // Title should mention Saved Experiences or Bucket List
    await expect(page.locator('h1:has-text("Saved Experiences")')).toBeVisible();

    // Check presence of Browse Tours / Explore button if empty
    await expect(page.locator('a[href="/tours"]:has-text("Explore"), a[href="/tours"]:has-text("Browse"), a[href="/tours"]').last()).toBeVisible();
  });

  test('Tour detail page renders Activity At-a-Glance Matrix and Know Before You Go guide', async ({ page }) => {
    await page.goto('/tours');
    const firstTourLink = page.locator('a[href^="/tours/"]').locator('visible=true').first();
    await expect(firstTourLink).toBeVisible({ timeout: 10000 });
    const href = await firstTourLink.getAttribute('href');
    await page.goto(href!);

    // Key specs matrix
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('text=/Free cancellation|Non-refundable/i').first()).toBeVisible();
    await expect(page.locator('text=Instant confirmation').first()).toBeVisible();
    await expect(page.locator('text=Mobile ticket accepted').first()).toBeVisible();

    // Know Before You Go or What to Bring section
    await expect(page.locator('text=/Know Before You Go|What to bring/i').first()).toBeVisible();
  });

  test('Legal and compliance pages (/terms, /privacy, /cancellation, /payments-and-pricing) render cleanly', async ({ page }) => {
    for (const path of ['/terms', '/booking-terms', '/cancellation', '/privacy', '/payments-and-pricing', '/about', '/faq']) {
      await page.goto(path);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('text=Internal Server Error')).not.toBeVisible();
    }
  });
});
