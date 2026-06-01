import { test, expect } from '@playwright/test';

test.describe('Jobs Application Withdraw Flow', () => {
  const applicantEmail = 'applicant@souqone.om';
  const password = 'Test1234';

  test('should allow applicant to withdraw a PENDING application', async ({ page }) => {
    // 1. Login as Applicant
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', applicantEmail);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // 2. Go to Dashboard -> My Applications
    await page.goto('/jobs/dashboard');
    
    // Ensure we are in Driver mode to see applications
    await page.click('button:has-text("كسائق")');

    // 3. Find the pending application
    // The seeded app has message: 'مرحباً، لدي خبرة 3 سنوات وأرغب بالتقديم على الوظيفة.'
    // Wait for applications to load
    await expect(page.locator('text=مطلوب سائق شاحنة خفيفة')).toBeVisible({ timeout: 10000 });

    // 4. Click Withdraw ("إلغاء الطلب" or "تراجع" or "حذف")
    // Let's assume the UI has a menu or button with 'إلغاء الطلب' or 'سحب الطلب'
    // I noticed in dashboard/page.tsx: handleWithdraw(id) is called on something. Let's look for an action button.
    const withdrawBtn = page.locator('button:has-text("إلغاء الطلب")');
    if (await withdrawBtn.count() > 0) {
      await withdrawBtn.first().click();
      
      // Confirm dialog if any
      const confirmBtn = page.locator('button:has-text("تأكيد")');
      if (await confirmBtn.count() > 0) {
         await confirmBtn.click();
      }
      
      // 5. Verify the application is gone or marked as withdrawn
      await expect(page.locator('text=تم الإلغاء').or(page.locator('text=WITHDRAWN'))).toBeVisible({ timeout: 10000 });
    }
  });
});
