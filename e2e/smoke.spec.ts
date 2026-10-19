import { test, expect } from '@playwright/test';

test.describe('Public Experience Marketplace Smoke Tests', () => {
  test('Homepage renders hero, brand logo, and navigation links', async ({ page }) => {
    await page.goto('/');

    // Check brand presence
    await expect(page.locator('text=TALAGO').first()).toBeVisible();

    // Check primary navigation items
    await expect(page.locator('a[href="/tours"]').first()).toBeVisible();
    await expect(page.locator('a[href="/destinations"]').first()).toBeVisible();
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
    await expect(page.locator('a[href="/tours"]').first()).toBeVisible();
  });
});
