import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Carrier Dashboard (N13 + C17)', () => {
  test('N13: Carrier dashboard loads without crash even if some APIs fail', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto(`${BASE}/ar/transport/carriers/dashboard`);
    await page.waitForLoadState('networkidle');

    // Page should not be a blank error screen
    const criticalError = page.getByText(/خطأ غير متوقع|Something went wrong|Unhandled/i);
    const hasError = await criticalError.isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasError).toBeFalsy();

    // Dashboard heading should be visible
    const dashboardHeading = page.getByText(/لوحة الناقل|Carrier Dashboard|إحصائيات/i).first();
    await expect(dashboardHeading).toBeVisible({ timeout: 30000 });
  });

  test('C17: Request IDs in dashboard are shown in shortened format, not full UUID', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto(`${BASE}/ar/transport/carriers/dashboard`);
    await page.waitForLoadState('networkidle');

    // Full UUID format: 8-4-4-4-12 = 36 chars with hyphens
    const fullUuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const pageText = await page.locator('body').textContent();
    expect(pageText).not.toMatch(fullUuidPattern);
  });
});

test.describe('my-quotes — Navigation (B1)', () => {
  test('B1: Carrier "عرض الحجز" link goes to /my-bookings not /my-requests', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto(`${BASE}/ar/transport/my-quotes`);
    await page.waitForLoadState('networkidle');

    // Find any "عرض الحجز" link (for accepted quotes)
    const viewBookingLink = page.getByRole('link', { name: /عرض الحجز|View Booking/i }).first();
    if (await viewBookingLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      const href = await viewBookingLink.getAttribute('href');
      expect(href).toMatch(/\/my-bookings|\/bookings\//);
      expect(href).not.toMatch(/\/my-requests/);
    }
  });
});
