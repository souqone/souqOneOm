# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: unified-search.spec.ts >> Unified Search Engine (Global Browse) >> Empty search state displays trending and fallback suggestions
- Location: e2e\unified-search.spec.ts:41:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('لا توجد نتائج مطابقة')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('لا توجد نتائج مطابقة')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Unified Search Engine (Global Browse)', () => {
  4  | 
  5  |   test('Navbar search redirects to /browse with query param', async ({ page }) => {
  6  |     // Go to homepage
  7  |     await page.goto('/');
  8  | 
  9  |     // Wait for the navbar to be visible and type a search query
  10 |     const searchInput = page.locator('form input[type="text"]').first();
  11 |     await searchInput.waitFor({ state: 'visible' });
  12 |     
  13 |     // Type and press Enter
  14 |     await searchInput.fill('تويوتا');
  15 |     await searchInput.press('Enter');
  16 | 
  17 |     // Verify URL
  18 |     await expect(page).toHaveURL(/\/browse\?q=%D8%AA%D9%88%D9%8A%D9%88%D8%AA%D8%A7/); // %D8%AA%D9%88%D9%8A%D9%88%D8%AA%D8%A7 is URL encoded "تويوتا"
  19 | 
  20 |     // Wait for the results header to appear
  21 |     await expect(page.getByRole('heading', { level: 1 })).toContainText('تويوتا');
  22 |   });
  23 | 
  24 |   test('Federated View displays tabs and clears category filters when switching', async ({ page }) => {
  25 |     // Go to a specific category search with a category-specific filter
  26 |     // Category: cars, Make: Toyota
  27 |     await page.goto('/browse?category=cars&make=Toyota');
  28 | 
  29 |     // Wait for the page to load
  30 |     await expect(page.getByRole('heading', { level: 1 })).toContainText('سيارات');
  31 | 
  32 |     // Click the "وظائف" (Jobs) tab
  33 |     const jobsTab = page.getByRole('button', { name: 'وظائف' });
  34 |     await jobsTab.waitFor({ state: 'visible' });
  35 |     await jobsTab.click();
  36 | 
  37 |     // Verify URL: it should have category=jobs, but make=Toyota MUST BE REMOVED.
  38 |     await expect(page).toHaveURL(/\/browse\?category=jobs$/);
  39 |   });
  40 | 
  41 |   test('Empty search state displays trending and fallback suggestions', async ({ page }) => {
  42 |     // Navigate to a browse page that definitely has no results
  43 |     await page.goto('/browse?q=9999999999XYZ');
  44 | 
  45 |     // Verify no results message appears
> 46 |     await expect(page.getByText('لا توجد نتائج مطابقة')).toBeVisible();
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  47 | 
  48 |     // Verify trending searches appear
  49 |     await expect(page.getByText('الأكثر بحثاً')).toBeVisible();
  50 |     await expect(page.getByRole('button', { name: 'تويوتا' })).toBeVisible();
  51 |   });
  52 | 
  53 | });
  54 | 
```