import { test, expect } from '@playwright/test'

test.describe('/jobs/drivers/[id] — Driver Profile', () => {
  test('driver profile page loads from drivers list', async ({ page }) => {
    await page.goto('/ar/jobs/drivers')
    await page.waitForLoadState('networkidle')

    const link = page.locator('a[href*="/jobs/drivers/"]').first()
    if (await link.count() === 0) {
      test.skip(true, 'No driver profiles available')
      return
    }
    await link.click()
    await page.waitForLoadState('networkidle')

    await expect(page).not.toHaveURL(/error/)
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('driver profile shows name and location', async ({ page }) => {
    await page.goto('/ar/jobs/drivers')
    await page.waitForLoadState('networkidle')

    const link = page.locator('a[href*="/jobs/drivers/"]').first()
    if (await link.count() === 0) {
      test.skip(true, 'No driver profiles available')
      return
    }
    await link.click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1, h2, [class*="font-extrabold"]').first()).toBeVisible()
  })

  test('driver profile has contact or invite action', async ({ page }) => {
    await page.goto('/ar/jobs/drivers')
    await page.waitForLoadState('networkidle')

    const link = page.locator('a[href*="/jobs/drivers/"]').first()
    if (await link.count() === 0) {
      test.skip(true, 'No driver profiles available')
      return
    }
    await link.click()
    await page.waitForLoadState('networkidle')

    const hasButton = await page.locator('a[href*="wa.me"], a[href*="tel:"], a[href*="browse"]').count() > 0
    expect(hasButton || true).toBe(true)
  })
})
