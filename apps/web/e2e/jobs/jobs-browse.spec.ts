import { test, expect } from '@playwright/test'

test.describe('/jobs/browse — Browse Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/jobs/browse')
    await page.waitForLoadState('networkidle')
  })

  test('page loads without error', async ({ page }) => {
    await expect(page).not.toHaveURL(/error/)
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('filter sidebar or section is visible', async ({ page }) => {
    const sidebar = page.locator('[class*="filter"], aside, [class*="sidebar"]').first()
    const hasFilter = await sidebar.count() > 0
    const hasSelect = await page.locator('select').count() > 0
    expect(hasFilter || hasSelect).toBe(true)
  })

  test('job cards or empty state renders', async ({ page }) => {
    const cards = await page.locator('[class*="card-base"], [class*="job-card"]').count()
    const empty = await page.locator('[class*="empty"]').count()
    expect(cards + empty).toBeGreaterThan(0)
  })

  test('clicking a job card navigates to detail', async ({ page }) => {
    const firstCard = page.locator('a[href*="/jobs/"]').filter({ hasNotText: 'السائقون' }).first()
    const count = await firstCard.count()
    if (count > 0) {
      const href = await firstCard.getAttribute('href')
      if (href && href.match(/\/jobs\/[^/]+$/)) {
        await firstCard.click()
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(/\/jobs\/[^/]+$/)
      }
    }
  })
})
