import { test, expect } from '@playwright/test'

test.describe('Authentication Guard', () => {
  test('should redirect unauthenticated users to login page', async ({ page }) => {
    // Ensure we are logged out
    await page.goto('/archeDIsks/');
    await page.evaluate(() => localStorage.removeItem('isLoggedIn'));

    // Try to access protected route
    await page.goto('/archeDIsks/disc-list');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should allow authenticated users to access protected routes', async ({ page }) => {
    // Simulate login
    await page.goto('/archeDIsks/');
    await page.evaluate(() => localStorage.setItem('isLoggedIn', 'true'));

    // Try to access protected route
    await page.goto('/archeDIsks/disc-list');

    // Should stay on disc-list
    await expect(page).toHaveURL(/\/disc-list/);
  });
});
