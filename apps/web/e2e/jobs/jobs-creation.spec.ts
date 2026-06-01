import { test, expect } from '@playwright/test';

test.describe('Jobs Creation Flow', () => {
  const employerEmail = 'employer@souqone.om';
  const driverEmail = 'driver@souqone.om';
  const password = 'Test1234';

  test('should allow employer to create a HIRING job', async ({ page }) => {
    // 1. Login as Employer
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', employerEmail);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // 2. Go to New Job
    await page.goto('/jobs/new');
    await expect(page.locator('h1:has-text("نشر إعلان جديد")')).toBeVisible({ timeout: 10000 });

    // 3. Step 0: Select Job Type (HIRING)
    await page.click('button:has-text("طلب سائق")'); // Assuming HIRING translates to this or similar
    // Actually the button text depends on constants, but we click the appropriate button
    // The UI uses the title from JOB_TYPE_LABELS which are "أبحث عن سائق" for HIRING
    await page.click('button:has-text("أبحث عن سائق")');
    await page.click('button:has-text("التالي")');

    // 4. Step 1: Details
    await page.fill('input[name="title"]', 'سائق ثقيل لمشروع');
    await page.fill('textarea[name="description"]', 'نحتاج سائق يمتلك خبرة في قيادة الشاحنات الثقيلة');
    await page.click('button:has-text("التالي")');

    // 5. Step 2: Requirements
    // Select FULL_TIME
    await page.click('button:has-text("دوام كامل")');
    await page.fill('input[name="minSalary"]', '500');
    await page.fill('input[name="maxSalary"]', '800');
    await page.click('button:has-text("التالي")');

    // 6. Step 3: Location
    await page.selectOption('select[name="governorate"]', 'مسقط');
    await page.click('button:has-text("نشر الإعلان")');

    // 7. Verify Redirect to Job detail page
    await expect(page).toHaveURL(/\/jobs\/[a-zA-Z0-9-]+/, { timeout: 15000 });
  });

  test('should forbid driver from creating a HIRING job', async ({ page }) => {
    // 1. Login as Driver (who does not have employer profile)
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', driverEmail);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // 2. Go to New Job
    await page.goto('/jobs/new');
    await expect(page.locator('h1:has-text("نشر إعلان جديد")')).toBeVisible({ timeout: 10000 });

    // 3. Step 0: Try to Select HIRING
    await page.click('button:has-text("أبحث عن سائق")');
    await page.click('button:has-text("التالي")');

    // If the frontend correctly blocks it, it might show an error, or the backend will reject it on submit.
    // Let's assume the user bypasses UI and submits. Since we are testing E2E, we test what UI allows.
    // The API blocks it, returning ForbiddenException. Let's fill the form and submit.
    await page.fill('input[name="title"]', 'اختبار');
    await page.fill('textarea[name="description"]', 'نحتاج سائق');
    await page.click('button:has-text("التالي")');
    await page.click('button:has-text("دوام كامل")');
    await page.click('button:has-text("التالي")');
    await page.selectOption('select[name="governorate"]', 'مسقط');
    
    // Submit
    await page.click('button:has-text("نشر الإعلان")');

    // 4. Verify Error Toast is shown (from backend ForbiddenException)
    await expect(page.locator('text=بروفايل صاحب العمل')).toBeVisible(); // Part of error message
  });

  test('should enforce minAge < maxAge validation', async ({ page }) => {
    // 1. Login as Employer
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', employerEmail);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    
    // 2. Go to New Job
    await page.goto('/jobs/new');
    
    await page.click('button:has-text("أبحث عن سائق")');
    await page.click('button:has-text("التالي")');
    
    await page.fill('input[name="title"]', 'سائق');
    await page.fill('textarea[name="description"]', 'تفاصيل');
    await page.click('button:has-text("التالي")');
    
    // Requirements step
    await page.click('button:has-text("دوام كامل")');
    // Set invalid ages
    await page.fill('input[name="minAge"]', '40');
    await page.fill('input[name="maxAge"]', '25');
    
    await page.click('button:has-text("التالي")');
    
    // Assuming UI enforces this validation using Zod
    await expect(page.locator('text=يجب أن يكون العمر الأدنى أقل')).toBeVisible();
  });
});
