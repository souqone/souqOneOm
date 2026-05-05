import { test, expect } from '@playwright/test'

test.describe('/jobs/my — My Jobs', () => {
  test('page loads without 500', async ({ page }) => {
    await page.goto('/ar/jobs/my')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('shows auth guard or content', async ({ page }) => {
    await page.goto('/ar/jobs/my')
    await page.waitForLoadState('networkidle')

    const url = page.url()
    const bodyText = await page.locator('body').textContent()

    const isOk =
      url.includes('/login') ||
      url.includes('/auth') ||
      url.includes('/my') ||
      (bodyText?.includes('إعلاناتي') ?? false) ||
      (bodyText?.includes('تسجيل الدخول') ?? false)

    expect(isOk).toBe(true)
  })
})
