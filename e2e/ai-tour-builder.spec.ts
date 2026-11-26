import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN || '';

test.describe('Admin AI Tour Builder & Tour Creation Layout Quality', () => {
  test.beforeEach(async ({ context }) => {
    if (ADMIN_TOKEN) {
      await context.addCookies([
        {
          name: 'talago_admin_session',
          value: ADMIN_TOKEN,
          domain: 'localhost',
          path: '/',
        },
      ]);
    }
  });

  test('First screen layout quality: compact creation shortcuts, no duplicate cards, basic info immediate', async ({ page }) => {
    await page.goto('/admin/tours/new');

    // 1. Verify editor header has exactly one AI Builder trigger
    const headerAiBuilder = page.locator('header button:has-text("AI Builder")');
    await expect(headerAiBuilder).toHaveCount(1);
    await expect(headerAiBuilder).toBeVisible();

    // 2. Verify Section 1 compact strip exists and has exactly one AI Tour Builder button
    const section1Strip = page.locator('text=Creation Shortcuts:');
    await expect(section1Strip).toBeVisible();

    const section1AiBtn = page.locator('button:has-text("AI Tour Builder")');
    await expect(section1AiBtn).toHaveCount(1);
    await expect(section1AiBtn).toBeVisible();

    // 3. Verify exactly one Text Importer trigger in Section 1
    const section1ImportBtn = page.locator('button:has-text("Text Importer")');
    await expect(section1ImportBtn).toHaveCount(1);
    await expect(section1ImportBtn).toBeVisible();

    // 4. Verify no duplicated large cards or promotional boxes
    const duplicateBanners = page.locator('text=Tour Creation Modes');
    await expect(duplicateBanners).toHaveCount(0);

    // 5. Verify the basic tour form fields are immediately visible right below
    const titleInput = page.locator('input[placeholder*="VIP Giftun Island"]');
    await expect(titleInput).toBeVisible();

    const slugInput = page.locator('input[placeholder*="vip-giftun-island"]');
    await expect(slugInput).toBeVisible();

    // Capture screenshot of the first screen
    await page.screenshot({ path: 'e2e/screenshots/first-screen-desktop.png' });
  });

  test('AI Builder modal visibility, mouse movement, and scroll stability', async ({ page }) => {
    await page.goto('/admin/tours/new');

    // Open AI Builder from header
    const headerAiBtn = page.locator('header button:has-text("AI Builder")');
    await headerAiBtn.click();

    // Verify modal appears
    const modalHeading = page.locator('h3:has-text("AI Tour Builder")');
    await expect(modalHeading).toBeVisible();

    // Verify modal styling and opacity
    const modalCard = page.locator('.relative.z-10:has-text("AI Tour Builder")');
    await expect(modalCard).toBeVisible();

    // Check computed opacity is 1
    const opacity = await modalCard.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(opacity).toBe('1');

    // Move mouse across several interactive elements inside the modal
    const promptInput = page.locator('textarea[placeholder*="Describe your tour"]');
    await promptInput.hover();
    await promptInput.fill('Quad biking safari in Hurghada desert with bedouin tea');

    const inspirationPills = page.locator('button:has-text("Desert Quad Biking Safari")');
    if (await inspirationPills.isVisible()) {
      await inspirationPills.hover();
    }

    // Modal must still be 100% visible and opacity must stay 1
    await expect(modalCard).toBeVisible();
    const opacityAfterHover = await modalCard.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(opacityAfterHover).toBe('1');

    // Scroll down inside the modal
    await modalCard.evaluate((el) => {
      el.scrollTop = 200;
    });
    await page.waitForTimeout(200);

    // Verify modal does not fade or disappear during scroll
    await expect(modalCard).toBeVisible();
    const opacityAfterScroll = await modalCard.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(opacityAfterScroll).toBe('1');

    // Capture screenshot of AI Builder modal
    await page.screenshot({ path: 'e2e/screenshots/ai-builder-modal-desktop.png' });

    // Close via close button
    const closeBtn = page.locator('button:has-text("✕")');
    await closeBtn.click();
    await expect(modalHeading).not.toBeVisible();

    // Reopen via Section 1 compact strip
    const section1AiBtn = page.locator('button:has-text("AI Tour Builder")');
    await section1AiBtn.click();
    await expect(modalHeading).toBeVisible();

    // Close via Escape key
    await page.keyboard.press('Escape');
    await expect(modalHeading).not.toBeVisible();
  });

  test('Mobile viewport: creation shortcuts and AI Builder adapt cleanly without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/tours/new');

    // Creation shortcuts should fit cleanly on mobile
    const shortcuts = page.locator('text=Creation Shortcuts:');
    await expect(shortcuts).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/first-screen-mobile.png' });

    // Open AI Builder on mobile
    const aiBtn = page.locator('button:has-text("AI Tour Builder")');
    await aiBtn.click();

    const modalHeading = page.locator('h3:has-text("AI Tour Builder")');
    await expect(modalHeading).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/ai-builder-modal-mobile.png' });

    // Close modal
    await page.keyboard.press('Escape');
    await expect(modalHeading).not.toBeVisible();
  });

  test('Step navigation and manual editor integrity preserved', async ({ page }) => {
    await page.goto('/admin/tours/new');

    // Fill title
    const titleInput = page.locator('input[placeholder*="VIP Giftun Island"]');
    await titleInput.fill('Test Red Sea Experience');

    // Navigate to Step 2
    const nextBtn = page.locator('button:has-text("Next: Content & Itinerary")');
    await nextBtn.click();

    // Verify Step 2 is active and all Step 2 sections are rendered together on one page
    await expect(page.locator('h2:has-text("2. Content, Highlights & Itinerary")')).toBeVisible();
    await expect(page.locator('#section-activities')).toBeVisible();
    await expect(page.locator('#section-itinerary')).toBeVisible();
    await expect(page.locator('#section-route')).toBeVisible();

    // Navigate back to Step 1
    const backBtn = page.locator('button:has-text("Back: Basics & Location")');
    await backBtn.click();

    // Verify Title is preserved
    await expect(titleInput).toHaveValue('Test Red Sea Experience');
  });
});
