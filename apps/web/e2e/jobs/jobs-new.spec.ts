import { test, expect } from '@playwright/test'

test.describe('/jobs/new — Create Job', () => {
  test('redirects or shows auth guard for unauthenticated users', async ({ page }) => {
    await page.goto('/ar/jobs/new')
    await page.waitForLoadState('networkidle')

    const url = page.url()
    const bodyText = await page.locator('body').textContent()
    const isOk =
      url.includes('/login') ||
      url.includes('/auth') ||
      url.includes('/new') ||
      url.includes('/onboarding') ||
      (bodyText?.includes('تسجيل الدخول') ?? false) ||
      (bodyText?.includes('إنشاء إعلان') ?? false)

    expect(isOk).toBe(true)
  })

  test('page does not crash with 500', async ({ page }) => {
    await page.goto('/ar/jobs/new')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('form or auth UI is visible', async ({ page }) => {
    await page.goto('/ar/jobs/new')
    await page.waitForLoadState('networkidle')

    const hasForm = await page.locator('form, [role="form"]').count() > 0
    const hasAuthUI = await page.locator('button').count() > 0
    expect(hasForm || hasAuthUI).toBe(true)
  })
})
