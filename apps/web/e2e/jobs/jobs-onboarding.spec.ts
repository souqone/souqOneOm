import { test, expect } from '@playwright/test';

test.describe('Jobs Onboarding Flow', () => {
  // Use a user without a profile for these tests
  const email = 'noprofile@souqone.om';
  const password = 'Test1234';

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', email);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });
  });

  test('should show validation errors if required fields are missing on Employer form', async ({ page }) => {
    await page.goto('/jobs/onboarding');
    await page.waitForTimeout(2000);

    // Select Employer
    await page.click('button:has-text("صاحب عمل")');
    
    // Check we moved to step 2 for employer
    await expect(page.locator('h1:has-text("بروفايل صاحب العمل")')).toBeVisible();

    // Submit form without filling it
    await page.click('button[type="submit"]');

    // Should see zod validation for governorate
    await expect(page.locator('text=اختر المحافظة')).toBeVisible();
  });

  test('should successfully create employer profile and redirect', async ({ page }) => {
    await page.goto('/jobs/onboarding');
    await page.waitForTimeout(2000);

    // Select Employer
    await page.click('button:has-text("صاحب عمل")');

    // Fill the required Employer form fields
    await page.selectOption('select[name="governorate"]', 'مسقط');
    await page.fill('input[name="companyName"]', 'شركة جديدة');

    // Submit the form
    await page.click('button[type="submit"]');

    // Should redirect to /jobs/new upon successful employer profile creation
    await expect(page).toHaveURL(/\/jobs\/new/, { timeout: 15000 });
  });

  test('should show manage screen (not profile type selection) when user already has a profile', async ({ page }) => {
    // Login as employer user who already has a profile
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', 'employer@souqone.om');
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });

    await page.goto('/jobs/onboarding');
    await page.waitForLoadState('networkidle');

    // Should NOT show the initial type-selection step (step 1)
    // Instead should show manage profile screen or redirect to dashboard
    const url = page.url();
    const bodyText = await page.locator('body').textContent() ?? '';
    const isManageOrDashboard =
      url.includes('/dashboard') ||
      bodyText.includes('إدارة بروفايلك') ||
      bodyText.includes('اختر ما تريد القيام به');
    expect(isManageOrDashboard).toBe(true);
  });

  test('should show manage profile options if user has ONE profile', async ({ page }) => {
    // Login as employer
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', 'employer@souqone.om');
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });

    await page.goto('/jobs/onboarding');
    await page.waitForTimeout(2000);

    // Should see "إدارة بروفايلك" (manageProfileTitle key)
    await expect(page.locator('text=إدارة بروفايلك')).toBeVisible();
    
    // Should see option to go to dashboard as employer
    await expect(page.locator('text=إعلاناتي')).toBeVisible();
    
    // Should see option to create driver profile (typeDriver key = 'أنا سائق')
    await expect(page.locator('button:has-text("أنا سائق")')).toBeVisible();
  });
});
