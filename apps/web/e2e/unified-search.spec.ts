import { test, expect } from '@playwright/test';

test.describe('Unified Search Engine (Global Browse)', () => {

  test('Navbar search redirects to /browse with query param', async ({ page }) => {
    // Go to homepage
    await page.goto('/');

    // Wait for the navbar to be visible and type a search query
    const searchInput = page.locator('form input[type="text"]').first();
    await searchInput.waitFor({ state: 'visible' });
    
    // Type and press Enter
    await searchInput.fill('تويوتا');
    await searchInput.press('Enter');

    // Verify URL
    await expect(page).toHaveURL(/\/browse\?q=%D8%AA%D9%88%D9%8A%D9%88%D8%AA%D8%A7/); // %D8%AA%D9%88%D9%8A%D9%88%D8%AA%D8%A7 is URL encoded "تويوتا"

    // Wait for the results header to appear
    await expect(page.getByRole('heading', { level: 1 })).toContainText('تويوتا');
  });

  test('Federated View displays tabs and clears category filters when switching', async ({ page }) => {
    // Go to a specific category search with a category-specific filter
    // Category: cars, Make: Toyota
    await page.goto('/browse?category=cars&make=Toyota');

    // Wait for the page to load
    await expect(page.getByRole('heading', { level: 1 })).toContainText('سيارات');

    // Click the "وظائف" (Jobs) tab
    const jobsTab = page.getByRole('button', { name: 'وظائف' });
    await jobsTab.waitFor({ state: 'visible' });
    await jobsTab.click();

    // Verify URL: it should have category=jobs, but make=Toyota MUST BE REMOVED.
    await expect(page).toHaveURL(/\/browse\?category=jobs$/);
  });

  test('Empty search state displays trending and fallback suggestions', async ({ page }) => {
    // Navigate to a browse page that definitely has no results
    await page.goto('/browse?q=9999999999XYZ');

    // Verify no results message appears
    await expect(page.getByText('لا توجد نتائج مطابقة')).toBeVisible();

    // Verify trending searches appear
    await expect(page.getByText('الأكثر بحثاً')).toBeVisible();
    await expect(page.getByRole('button', { name: 'تويوتا' })).toBeVisible();
  });

});
