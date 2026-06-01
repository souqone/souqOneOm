import { test, expect } from '@playwright/test';

test.describe('Jobs Application Flow', () => {
  const applicantEmail = 'applicant@souqone.om';
  const employerEmail = 'employer@souqone.om';
  const password = 'Test1234';
  const activeJobUrl = '/jobs/seed-job-active-001';
  const closedJobUrl = '/jobs/seed-job-closed-002';

  test('should allow a valid driver to apply for a HIRING job', async ({ page }) => {
    // 1. Login as Applicant (Driver)
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', applicantEmail);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // 2. Go to the active job
    await page.goto(activeJobUrl);
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // 3. Click Apply button
    // Based on the UI, it's typically "التقديم على الوظيفة" or "تقديم عرض"
    await page.click('button:has-text("تقديم")');
    
    // 4. Fill application form/modal (assuming it opens a modal)
    await page.fill('textarea[name="message"]', 'أنا مهتم بهذه الوظيفة ولدي الخبرة الكافية.');
    
    // 5. Submit application
    await page.click('button[type="submit"]:has-text("إرسال")');

    // 6. Verify Success
    await expect(page.locator('text=تم إرسال طلبك بنجاح')).toBeVisible({ timeout: 10000 });
  });

  test('should prevent job owner from applying to their own job', async ({ page }) => {
    // 1. Login as Employer (Owner)
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', employerEmail);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');

    // 2. Go to their own active job
    await page.goto(activeJobUrl);
    
    // 3. Verify that the apply button is not present, or if it is, it fails
    // The UI should hide the apply button for the owner, and maybe show "Manage Applications"
    const applyButtonCount = await page.locator('button:has-text("تقديم")').count();
    expect(applyButtonCount).toBe(0);
    
    // Check if manage button exists instead
    const manageButtonCount = await page.locator('a:has-text("إدارة الطلبات")').count();
    expect(manageButtonCount).toBeGreaterThanOrEqual(1);
  });

  test('should prevent applying to a CLOSED job', async ({ page }) => {
    // 1. Login as Applicant
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', applicantEmail);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');

    // 2. Go to closed job
    await page.goto(closedJobUrl);
    
    // 3. Verify apply button is disabled or not present
    const applyButtonCount = await page.locator('button:has-text("تقديم")').count();
    expect(applyButtonCount).toBe(0);
    
    // Verify CLOSED badge is visible
    await expect(page.locator('text=مغلق')).toBeVisible();
  });
});
