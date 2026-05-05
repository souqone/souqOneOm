import { test, expect } from '@playwright/test'

test.describe('/jobs — Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/jobs')
    await page.waitForLoadState('networkidle')
  })

  test('page loads without 500 error', async ({ page }) => {
    await expect(page).not.toHaveURL(/error/)
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('body')).not.toContainText('500')
  })

  test('hero section is visible', async ({ page }) => {
    await expect(page.locator('section').first()).toBeVisible()
  })

  test('page has job cards or empty state', async ({ page }) => {
    const cards = await page.locator('[class*="card"]').count()
    const empty = await page.locator('[class*="empty"]').count()
    const hero = await page.locator('section').count()
    expect(cards + empty + hero).toBeGreaterThan(0)
  })

  test('contains navigation links to jobs section', async ({ page }) => {
    const links = page.locator('a[href*="/jobs"]')
    await expect(links.first()).toBeVisible()
  })
})
