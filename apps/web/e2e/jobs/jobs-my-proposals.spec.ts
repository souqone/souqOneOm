import { test, expect } from '@playwright/test'

test.describe('/jobs/my-proposals — redirect', () => {
  test('redirects to /jobs/dashboard', async ({ page }) => {
    await page.goto('/ar/jobs/my-proposals')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/jobs/dashboard')
  })
})
