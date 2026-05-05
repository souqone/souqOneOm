import { test, expect } from '@playwright/test'

test.describe('/jobs/drivers — Drivers Browse', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/jobs/drivers')
    await page.waitForLoadState('networkidle')
  })

  test('page loads without error', async ({ page }) => {
    await expect(page).not.toHaveURL(/error/)
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('shows driver cards or empty state', async ({ page }) => {
    const cards = await page.locator('[class*="card"]').count()
    const empty = await page.locator('[class*="empty"]').count()
    expect(cards + empty).toBeGreaterThan(0)
  })

  test('clicking driver card navigates to profile', async ({ page }) => {
    const link = page.locator('a[href*="/jobs/drivers/"]').first()
    if (await link.count() === 0) {
      test.skip(true, 'No driver cards found')
      return
    }
    await link.click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/jobs\/drivers\/[^/]+$/)
  })
})
