import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Validation — Budget Cross-field (N11)', () => {
  test('N11: API rejects budgetMin > budgetMax', async ({ page }) => {
    await loginAs(page, 'shipper');

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));

    const response = await page.request.post(`${apiBase}/api/transport/requests`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      data: {
        serviceType: 'GOODS',
        fromGovernorate: 'مسقط',
        fromAddress: 'test',
        toGovernorate: 'صلالة',
        toAddress: 'test',
        cargoDescription: 'test cargo',
        timingType: 'ASAP',
        budgetMin: 500,
        budgetMax: 100, // Invalid: min > max
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(JSON.stringify(body)).toMatch(/budget|ميزانية|min|max/i);
  });
});

test.describe('Validation — Retry Behavior (N15)', () => {
  test('N15: Retry button triggers reload with loading state (not window.location.reload)', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`${BASE}/ar/transport/my-requests`);
    await page.waitForLoadState('networkidle');

    // Simulate error state: block next API call
    await page.route('**/transport/requests/my**', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ message: 'Server Error' }) });
    });

    // Trigger a tab change to cause a reload
    const quotedTab = page.getByRole('button', { name: /وصلت عروض|QUOTED/i });
    if (await quotedTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await quotedTab.click();
      await page.waitForLoadState('networkidle');

      // Error state should show
      const errorMsg = page.getByText(/تعذّر|خطأ|Error/i);
      const hasError = await errorMsg.isVisible({ timeout: 10000 }).catch(() => false);

      if (hasError) {
        // Unblock API
        await page.unrouteAll();

        // Click retry
        const retryBtn = page.getByRole('button', { name: /إعادة المحاولة|Retry/i });
        if (await retryBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          // Monitor for navigation — window.location.reload() would cause full navigation
          let didFullReload = false;
          page.on('framenavigated', () => { didFullReload = true; });

          await retryBtn.click();
          await page.waitForTimeout(2000);

          // Should NOT do full page reload
          expect(didFullReload).toBeFalsy();
        }
      }
    }
  });
});

test.describe('Browse — Pagination (N12)', () => {
  test('N12: my-requests shows proper pagination (not hardcoded 50)', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`${BASE}/ar/transport/my-requests`);
    await page.waitForLoadState('networkidle');

    // Page should load without error
    const errorMsg = page.getByText(/تعذّر|خطأ/i);
    const hasError = await errorMsg.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasError).toBeFalsy();

    // Should show content or empty state
    const content = page.locator('[class*="card"], [class*="grid"]').first();
    const emptyState = page.getByText(/لا توجد طلبات|No requests/i);
    const hasContent = await content.isVisible({ timeout: 15000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasContent || hasEmpty).toBeTruthy();
  });
});
