import { test, expect } from '@playwright/test';

/**
 * Smoke tests for the critical Barry user paths.
 *
 * These don't replace proper TDD coverage but they ensure the app boots,
 * the landing renders, and the critical CTAs are clickable. Run before
 * every deploy.
 *
 * Future tests to add (Tier 3 from CRITICAL_REVIEW):
 *   - Sign up new account end-to-end
 *   - Create trip wizard with all 3 modes
 *   - Join via invite link
 *   - Complete setup as participant
 *   - Vote on zone + venue
 *   - Fund a trip
 *   - Book a trip + verify PDF download
 *   - Post-funding tile interactions
 */

test.describe('Barry smoke tests', () => {
  test('landing page renders with primary CTA', async ({ page }) => {
    await page.goto('/');
    // Hero copy
    await expect(page.getByText(/Barry/i).first()).toBeVisible();
    // Primary CTA exists
    const cta = page.getByRole('link', { name: /Try Barry now|Create my first Barry/i });
    await expect(cta).toBeVisible();
  });

  test('landing has "Try a sample trip" button when not authenticated', async ({ page }) => {
    await page.goto('/');
    // Wave 21 added this CTA - if absent, the regression is real
    const sample = page.getByRole('link', { name: /Try a sample trip/i });
    await expect(sample).toBeVisible({ timeout: 5000 });
  });

  test('login page renders email + password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });

  test('demo account login works', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).first().fill('chloe@example.com');
    await page.getByLabel(/password/i).first().fill('password123');
    await page.getByRole('button', { name: /^log in$|^sign in$/i }).first().click();
    // Should land on the home with trips visible
    await expect(page).toHaveURL(/\/$|\/home/, { timeout: 10_000 });
  });

  test('cookie consent banner appears on first visit', async ({ page, context }) => {
    await context.clearCookies();
    // Clear localStorage too
    await page.goto('/');
    await page.evaluate(() => window.localStorage.removeItem('barry-cookie-consent-v1'));
    await page.reload();
    await expect(page.getByText(/We respect your data|Cookie/i).first()).toBeVisible({ timeout: 5_000 });
  });
});
