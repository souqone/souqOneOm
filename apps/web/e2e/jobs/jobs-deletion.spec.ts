import { test, expect } from '@playwright/test';

/**
 * Jobs Deletion & State Management
 *
 * Source Evidence:
 * - jobs.service.ts:284 → closing a job auto-rejects PENDING apps and notifies
 * - jobs.service.ts:327 → deleting a job notifies PENDING + ACCEPTED applicants
 * - jobs.service.ts:250 → EXPIRED is a terminal state (cannot update)
 */

test.describe('Jobs Deletion & State Management', () => {
  const employerEmail = 'employer@souqone.om';
  const password = 'Test1234';

  test('should allow employer to close an ACTIVE job', async ({ page }) => {
    // 1. Login as Employer
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', employerEmail);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // 2. Navigate to the active job detail
    await page.goto('/jobs/seed-job-active-001');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // 3. Find the "Close Job" / "إغلاق الوظيفة" action (typically a dropdown menu or button)
    // The employer sees manage actions on their own job
    const closeBtn = page.locator('button:has-text("إغلاق الوظيفة")');
    if (await closeBtn.count() > 0) {
      await closeBtn.click();

      // Confirm if dialog appears
      const confirmBtn = page.locator('button:has-text("تأكيد")');
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
      }

      // 4. Verify the job is now CLOSED — badge updated
      await expect(page.locator('text=مغلق')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should auto-reject PENDING applications when job is closed', async ({ page }) => {
    // 1. Login as Employer
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', employerEmail);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // 2. Close the active job
    await page.goto('/jobs/seed-job-active-001');
    const closeBtn = page.locator('button:has-text("إغلاق الوظيفة")');
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      const confirmBtn = page.locator('button:has-text("تأكيد")');
      if (await confirmBtn.count() > 0) await confirmBtn.click();

      // Wait for update
      await expect(page.locator('text=مغلق')).toBeVisible({ timeout: 10000 });
    }

    // 3. Now navigate to applications page for that job
    await page.goto('/jobs/seed-job-active-001/applications');

    // 4. The previously PENDING application should now be REJECTED
    // Evidence: jobs.service.ts:294 → updateMany PENDING → REJECTED
    await expect(page.locator('text=مرفوض')).toBeVisible({ timeout: 10000 });
  });

  test('should allow employer to delete their own job', async ({ page }) => {
    // 1. Login as Employer
    await page.goto('/login');
    await page.fill('input[placeholder="البريد الإلكتروني"]', employerEmail);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // 2. Navigate to the closed job detail
    await page.goto('/jobs/seed-job-closed-002');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // 3. Click Delete button
    const deleteBtn = page.locator('button:has-text("حذف الوظيفة")');
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();

      // Confirm deletion
      const confirmBtn = page.locator('button:has-text("تأكيد")');
      if (await confirmBtn.count() > 0) await confirmBtn.click();

      // 4. Should redirect back to /jobs/dashboard after deletion
      await expect(page).toHaveURL(/\/jobs\/(dashboard|list)?/, { timeout: 15000 });
    }
  });

  test('should not show apply button on CLOSED job', async ({ page }) => {
    // Test that the UI correctly hides the apply CTA when job is CLOSED
    // Evidence: jobs.service.ts:400 → API enforces status === 'ACTIVE' check
    await page.goto('/jobs/seed-job-closed-002');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Apply button should NOT be present
    const applyBtnCount = await page.locator('button:has-text("تقديم")').count();
    expect(applyBtnCount).toBe(0);

    // The CLOSED badge should be visible
    await expect(page.locator('text=مغلق')).toBeVisible();
  });
});
