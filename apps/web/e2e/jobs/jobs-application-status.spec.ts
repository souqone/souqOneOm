import { test, expect } from '@playwright/test';

test.describe('Jobs Application Status Flow', () => {
  const employerEmail = 'employer@souqone.om';
  const applicantEmail = 'applicant@souqone.om';
  const password = 'Test1234';

  test('should allow employer to accept an application', async ({ page }) => {
    // 1. Login as Employer
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', employerEmail);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // 2. Go to Dashboard -> My Applications (Manage)
    await page.goto('/jobs/dashboard');
    
    // Make sure we are in Employer role tab (if toggle exists, otherwise ignore)
    // The employer only has one role in seed data, so toggle is hidden.


    // 3. Find the application for the seeded job
    // The employer sees their jobs in the dashboard.
    // They click on "إدارة الطلبات" for the active job.
    await page.click('a:has-text("إدارة الطلبات")');
    await expect(page).toHaveURL(/\/jobs\/[a-zA-Z0-9-]+\/applications/, { timeout: 15000 });

    // 4. Accept Application
    // Look for the seeded applicant name
    await expect(page.locator('text=سائق يقدم على الوظائف')).toBeVisible(); // bio of applicant, or name 'مقدم طلب تجريبي'
    await page.click('button:has-text("قبول")');
    
    // 5. Verify Success Status
    await expect(page.locator('text=مقبول')).toBeVisible(); // Status badge or toast
  });

  test('should prevent non-owner from updating application status', async ({ page }) => {
    // 1. Login as Applicant (non-owner)
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', applicantEmail);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');

    // 2. Navigate directly to the employer's applications manage page
    // The UI might redirect or show 403 / Not Found, but let's test direct navigation
    await page.goto('/jobs/seed-job-active-001/applications');
    
    // 3. Should not see any applications, or should be redirected
    const isRedirected = !page.url().includes('/jobs/seed-job-active-001/applications');
    const isErrorOrEmpty = await page.locator('text=ليس لديك صلاحية').count() > 0 || await page.locator('text=لا توجد').count() > 0;
    
    expect(isRedirected || isErrorOrEmpty).toBeTruthy();
  });
});
