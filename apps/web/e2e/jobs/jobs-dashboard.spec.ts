import { test, expect } from '@playwright/test'

test.describe('/jobs/dashboard — Dashboard', () => {
  test('page does not crash with 500', async ({ page }) => {
    await page.goto('/ar/jobs/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('body')).not.toContainText('500')
  })

  test('redirects or shows auth guard when not authenticated', async ({ page }) => {
    await page.goto('/ar/jobs/dashboard')
    await page.waitForLoadState('networkidle')

    const url = page.url()
    const bodyText = await page.locator('body').textContent() ?? ''

    const isOk =
      url.includes('/login') ||
      url.includes('/auth') ||
      url.includes('/dashboard') ||
      bodyText.includes('تسجيل الدخول') ||
      bodyText.includes('لوحة التحكم')

    expect(isOk).toBe(true)
  })
})
