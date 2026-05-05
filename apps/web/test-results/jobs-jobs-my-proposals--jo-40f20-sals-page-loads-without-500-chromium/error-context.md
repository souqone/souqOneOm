# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: jobs\jobs-my-proposals.spec.ts >> /jobs/my-proposals — My Proposals >> page loads without 500
- Location: e2e\jobs\jobs-my-proposals.spec.ts:4:7

# Error details

```
TimeoutError: page.goto: Timeout 60000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/ar/jobs/my-proposals", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('/jobs/my-proposals — My Proposals', () => {
  4  |   test('page loads without 500', async ({ page }) => {
> 5  |     await page.goto('/ar/jobs/my-proposals')
     |                ^ TimeoutError: page.goto: Timeout 60000ms exceeded.
  6  |     await page.waitForLoadState('networkidle')
  7  |     await expect(page.locator('body')).not.toContainText('Internal Server Error')
  8  |   })
  9  | 
  10 |   test('shows auth guard or proposals UI', async ({ page }) => {
  11 |     await page.goto('/ar/jobs/my-proposals')
  12 |     await page.waitForLoadState('networkidle')
  13 | 
  14 |     const bodyText = await page.locator('body').textContent()
  15 |     const isOk =
  16 |       page.url().includes('/login') ||
  17 |       page.url().includes('/auth') ||
  18 |       (bodyText?.includes('عروضي') ?? false) ||
  19 |       (bodyText?.includes('تسجيل الدخول') ?? false) ||
  20 |       (bodyText?.includes('لا توجد عروض') ?? false)
  21 | 
  22 |     expect(isOk).toBe(true)
  23 |   })
  24 | 
  25 |   test('status tabs are rendered when authenticated UI shows', async ({ page }) => {
  26 |     await page.goto('/ar/jobs/my-proposals')
  27 |     await page.waitForLoadState('networkidle')
  28 | 
  29 |     const bodyText = await page.locator('body').textContent() ?? ''
  30 |     if (bodyText.includes('عروضي')) {
  31 |       expect(bodyText).toMatch(/الكل|بانتظار|مقبول/)
  32 |     }
  33 |   })
  34 | })
  35 | 
```