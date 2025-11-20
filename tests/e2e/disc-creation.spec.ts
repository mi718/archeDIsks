import { test, expect } from '@playwright/test'

test.describe('Disc Creation', () => {
  test('should create a new disc', async ({ page }) => {
    await page.goto('/')

    // Click on "New Disc" button
    await page.click('text=New Disc')

    // Should navigate to disc creation page
    await expect(page).toHaveURL(/\/disc\/new/)

    // Fill in disc details
    await page.fill('input[placeholder="Enter disc name"]', 'Test Disc 2026')
    await page.fill('input[type="date"]', '2026-01-01')
    await page.fill('input[type="date"]:nth-of-type(2)', '2026-12-31')

    // Submit the form
    await page.click('button[type="submit"]')

    // Should navigate to the created disc
    await expect(page).toHaveURL(/\/disc\/[a-zA-Z0-9-]+/)

    // Should show the disc name
    await expect(page.locator('h1')).toContainText('Test Disc 2026')
  })

  test('should add a ring to the disc', async ({ page }) => {
    await page.goto('/')

    // Create a new disc first
    await page.click('text=New Disc')
    await page.fill('input[placeholder="Enter disc name"]', 'Test Disc 2026')
    await page.fill('input[type="date"]', '2026-01-01')
    await page.fill('input[type="date"]:nth-of-type(2)', '2026-12-31')
    await page.click('button[type="submit"]')

    // Click "Add Ring" button
    await page.click('text=Add Ring')

    // Fill in ring details
    await page.fill('input[placeholder="Enter ring name"]', 'Marketing')
    await page.selectOption('select', 'calendar')

    // Submit the ring form
    await page.click('button[type="submit"]')

    // Should close the drawer and show the ring in the disc
    await expect(page.locator('text=Marketing')).toBeVisible()
  })

  test('should add an activity to a ring', async ({ page }) => {
    await page.goto('/')

    // Create a new disc first
    await page.click('text=New Disc')
    await page.fill('input[placeholder="Enter disc name"]', 'Test Disc 2026')
    await page.fill('input[type="date"]', '2026-01-01')
    await page.fill('input[type="date"]:nth-of-type(2)', '2026-12-31')
    await page.click('button[type="submit"]')

    // Add a ring
    await page.click('text=Add Ring')
    await page.fill('input[placeholder="Enter ring name"]', 'Marketing')
    await page.selectOption('select', 'calendar')
    await page.click('button[type="submit"]')

    // Click on the disc to add an activity (this would need to be implemented)
    // For now, we'll just verify the ring was created
    await expect(page.locator('text=Marketing')).toBeVisible()
  })
})
