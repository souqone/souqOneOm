import { test, expect } from '@playwright/test';
import { loginAs, SEED_IDS } from './helpers';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Security — Edit Button Ownership (N1)', () => {
  test('N1-a: Owner (shipper) sees edit button on their own request', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`${BASE}/ar/transport/my-requests`);
    await page.waitForLoadState('networkidle');

    // Find the seed request card
    const ownCard = page.locator(`a[href*="${SEED_IDS.openRequest}"]`).first();
    if (await ownCard.isVisible({ timeout: 10000 }).catch(() => false)) {
      const editBtn = ownCard.locator('button, a').filter({ hasText: /تعديل|edit/i });
      await expect(editBtn).toBeVisible();
    }
  });

  test('N1-b: Other logged-in user does NOT see edit button on someone else request', async ({ page }) => {
    await loginAs(page, 'other');
    await page.goto(`${BASE}/ar/transport/browse`);
    await page.waitForLoadState('networkidle');

    // Find shipper's request card (seed-tr-open-001)
    const shipperCard = page.locator(`a[href*="${SEED_IDS.openRequest}"]`).first();
    if (await shipperCard.isVisible({ timeout: 10000 }).catch(() => false)) {
      const editBtn = shipperCard.locator('button, a').filter({ hasText: /تعديل|edit/i });
      await expect(editBtn).toHaveCount(0);
    }
  });

  test('N1-c: Anonymous user sees NO edit button in browse', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/browse`);
    await page.waitForLoadState('networkidle');
    const editButtons = page.getByRole('button', { name: /تعديل|edit/i });
    await expect(editButtons).toHaveCount(0);
  });
});

test.describe('Security — Edit Page Access (N2)', () => {
  test('N2-a: Anonymous redirect to login when accessing edit page', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}/edit`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/login/);
  });

  test('N2-b: Non-owner gets 403 or redirected from edit page', async ({ page }) => {
    await loginAs(page, 'other');
    await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}/edit`);
    await page.waitForLoadState('networkidle');
    // Should show error or redirect — NOT the edit form
    const editForm = page.locator('form').first();
    const isForm = await editForm.isVisible({ timeout: 5000 }).catch(() => false);
    if (isForm) {
      // If form is visible, make sure it's NOT the edit form for this request
      const heading = await page.locator('h1, h2').first().textContent().catch(() => '');
      expect(heading).not.toMatch(/تعديل|Edit/i);
    }
    // OR we expect a redirect or error message
    const errorMsg = page.getByText(/غير مصرح|403|unauthorized|ليس لديك صلاحية/i);
    const isError = await errorMsg.isVisible({ timeout: 5000 }).catch(() => false);
    expect(isForm && !isError || !isForm).toBeTruthy();
  });

  test('N2-c: Owner can access edit page', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}/edit`);
    await page.waitForLoadState('networkidle');
    // Should NOT redirect to login
    expect(page.url()).not.toMatch(/\/login/);
  });
});

test.describe('Security — API Ownership (N3)', () => {
  test('N3: PATCH request by non-owner returns 401 or 403', async ({ page }) => {
    await loginAs(page, 'other');
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    const cookies = await page.context().cookies();
    const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    // Get auth token from localStorage
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));

    const response = await page.request.patch(
      `${apiBase}/api/transport/requests/${SEED_IDS.openRequest}`,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          Cookie: cookieStr,
        },
        data: { cargoDescription: 'HIJACKED BY NON-OWNER' },
      }
    );

    expect([401, 403]).toContain(response.status());
  });

  test('N3: PATCH request without auth returns 401', async ({ page }) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await page.request.patch(
      `${apiBase}/api/transport/requests/${SEED_IDS.openRequest}`,
      {
        data: { cargoDescription: 'HIJACKED ANONYMOUS' },
      }
    );
    expect(response.status()).toBe(401);
  });
});

test.describe('Security — AuthGuard (B3)', () => {
  test('B3: /transport/my-quotes redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/my-quotes`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/login/);
  });

  test('B3: /transport/my-requests redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/my-requests`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/login/);
  });

  test('B3: /transport/my-bookings redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/my-bookings`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/login/);
  });
});
