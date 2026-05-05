import { test, expect } from '@playwright/test'

test.describe('/jobs/my-proposals — My Proposals', () => {
  test('page loads without 500', async ({ page }) => {
    await page.goto('/ar/jobs/my-proposals')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('shows auth guard or proposals UI', async ({ page }) => {
    await page.goto('/ar/jobs/my-proposals')
    await page.waitForLoadState('networkidle')

    const bodyText = await page.locator('body').textContent()
    const isOk =
      page.url().includes('/login') ||
      page.url().includes('/auth') ||
      (bodyText?.includes('عروضي') ?? false) ||
      (bodyText?.includes('تسجيل الدخول') ?? false) ||
      (bodyText?.includes('لا توجد عروض') ?? false)

    expect(isOk).toBe(true)
  })

  test('status tabs are rendered when authenticated UI shows', async ({ page }) => {
    await page.goto('/ar/jobs/my-proposals')
    await page.waitForLoadState('networkidle')

    const bodyText = await page.locator('body').textContent() ?? ''
    if (bodyText.includes('عروضي')) {
      expect(bodyText).toMatch(/الكل|بانتظار|مقبول/)
    }
  })
})
