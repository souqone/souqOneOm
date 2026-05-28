import { test, expect } from '@playwright/test';
import { loginAs, SEED_IDS } from './helpers';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Bookings — isCarrier booking-specific (N6)', () => {
  test('N6: Page loads booking details without full list scan (direct endpoint)', async ({ page }) => {
    await loginAs(page, 'shipper');

    // First, accept quote to create a booking (requires quoted request with pending quote)
    await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.quotedRequest}`);
    await page.waitForLoadState('networkidle');

    // Try accepting the quote if not already accepted
    const acceptBtn = page.getByRole('button', { name: /قبول|Accept/i }).first();
    await expect(acceptBtn).toBeVisible({ timeout: 20000 });
    await acceptBtn.click();
    
    // Should be on booking page now
    await page.waitForURL(/\/transport\/bookings\//, { timeout: 30000 });
    const bookingId = page.url().split('/bookings/')[1].split('?')[0];

    // Test: non-shipper carrier opening this booking sees correct buttons
    await loginAs(page, 'carrier');
    await page.goto(`${BASE}/ar/transport/bookings/${bookingId}`);
    await page.waitForLoadState('networkidle');

    // Carrier should see "بدأت التحميل" not "استلمت"
    const startBtn = page.getByRole('button', { name: /بدأت التحميل|بدء/i });
    const completeBtn = page.getByRole('button', { name: /استلمت|اكتمل|Complete/i });

    // Carrier should have start, shipper should have complete
    await expect(startBtn).toBeVisible({ timeout: 15000 });
    await expect(completeBtn).toHaveCount(0);
  });
});

test.describe('Bookings — Carrier Navigation (B2 + B10)', () => {
  test('B2: Carrier sees "حجوزاتي" in navigation', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto(`${BASE}/ar/transport`);
    await page.waitForLoadState('networkidle');

    const myBookingsLink = page.getByRole('link', { name: /حجوزاتي|My Bookings/i });
    await expect(myBookingsLink).toBeVisible({ timeout: 30000 });
  });

  test('B10: my-bookings page works for carrier (shows carrier bookings)', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto(`${BASE}/ar/transport/my-bookings`);
    await page.waitForLoadState('networkidle');

    // Should not show error — should show either bookings or empty state
    // Should not show error — should show either bookings or empty state
    const errorMsg = page.getByText(/خطأ|error|فشل/i);
    await expect(errorMsg).toHaveCount(0);

    // Page should be accessible
    expect(page.url()).not.toMatch(/\/login/);
  });
});

test.describe('Bookings — Cancel Guard (N14)', () => {
  test('N14: Anonymous user cannot see cancel booking button', async ({ page }) => {
    // Try to access a booking page without auth
    await page.goto(`${BASE}/ar/transport/bookings/any-id`);
    await page.waitForLoadState('networkidle');

    // Either redirected to login, or error page — no cancel button
    const cancelBtn = page.getByRole('button', { name: /إلغاء الحجز|Cancel Booking/i });
    await expect(cancelBtn).toHaveCount(0);
  });
});
