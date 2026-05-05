import { test, expect } from '@playwright/test'

test.describe('/jobs/[id] — Job Detail', () => {
  test('detail page loads for a real job id', async ({ page }) => {
    await page.goto('/ar/jobs/browse')
    await page.waitForLoadState('networkidle')

    const link = page.locator('a[href*="/ar/jobs/c"]').first()
    if (await link.count() === 0) {
      const anyLink = page.locator('a[href*="/jobs/"]').filter({ hasNotText: /browse|browse|drivers/ }).first()
      if (await anyLink.count() === 0) {
        test.skip(true, 'No jobs available to test')
        return
      }
      await anyLink.click()
    } else {
      await link.click()
    }

    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/error/)
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('job detail shows heading', async ({ page }) => {
    await page.goto('/ar/jobs/browse')
    await page.waitForLoadState('networkidle')

    const links = page.locator('a[href*="/jobs/"]')
    const count = await links.count()
    if (count === 0) {
      test.skip(true, 'No jobs available')
      return
    }

    const href = await links.first().getAttribute('href')
    if (!href || href.includes('browse') || href.includes('drivers') || href.includes('my')) {
      test.skip(true, 'No direct job links found')
      return
    }

    await page.goto(href)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})
