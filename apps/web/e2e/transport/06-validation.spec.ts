import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Validation — Budget Cross-field (N11)', () => {
  test('N11: API rejects budgetMin > budgetMax', async ({ page }) => {
    await loginAs(page, 'shipper');

    // Use the same origin as the web app (Next.js proxies API calls)
    const apiBase = BASE.replace(/\/$/, '');
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
    await page.route('**/transport/requests/my**', route => route.fulfill({ status: 500 }));
    const quotedTab = page.getByRole('button', { name: /وصلت عروض|QUOTED/i });
    await expect(quotedTab).toBeVisible({ timeout: 10000 });
    await quotedTab.click();
    const errorMsg = page.getByText(/تعذّر|خطأ/i);
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
    await page.unrouteAll();
    const retryBtn = page.getByRole('button', { name: /إعادة المحاولة|Retry/i });
    await expect(retryBtn).toBeVisible({ timeout: 5000 });
    let didFullReload = false;
    page.on('framenavigated', () => { didFullReload = true; });
    await retryBtn.click();
    await page.waitForTimeout(2000);
    expect(didFullReload).toBeFalsy();
  });
});

test.describe('Browse — Pagination (N12)', () => {
  test('N12: my-requests shows proper pagination (not hardcoded 50)', async ({ page }) => {
    await loginAs(page, 'shipper');
    const requests: string[] = [];
    page.on('request', req => {
      if (req.url().includes('/transport/requests/my')) requests.push(req.url());
    });

    await page.goto(`${BASE}/ar/transport/my-requests`);
    await page.waitForLoadState('networkidle');

    await expect(requests.some(url => url.includes('limit=12'))).toBeTruthy();
    await expect(requests.some(url => url.includes('limit=50'))).toBeFalsy();
  });
});
