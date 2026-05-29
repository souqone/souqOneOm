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
    await expect(ownCard).toBeVisible({ timeout: 20000 });
    const editBtn = ownCard.locator('button, a').filter({ hasText: /تعديل|edit/i });
    await expect(editBtn).toBeVisible();
  });

  test('N1-b: Other logged-in user does NOT see edit button on someone else request', async ({ page }) => {
    await loginAs(page, 'other');
    await page.goto(`${BASE}/ar/transport/browse`);
    await page.waitForLoadState('networkidle');

    // Find shipper's request card (seed-tr-open-001)
    const shipperCard = page.locator(`a[href*="${SEED_IDS.openRequest}"]`).first();
    await expect(shipperCard).toBeVisible({ timeout: 20000 });
    const editBtn = shipperCard.locator('button, a').filter({ hasText: /تعديل|edit/i });
    await expect(editBtn).toHaveCount(0);
  });

  test('N1-c: Anonymous user sees NO edit button in browse', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/browse`);
    await page.waitForLoadState('networkidle');
    const editButtons = page.getByRole('button', { name: /تعديل|edit/i });
    await expect(editButtons).toHaveCount(0);
  });
});

test.describe('Security — Edit Page Access (N2)', () => {
  test('N2-a: Anonymous cannot access edit page (redirect or show request view)', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}/edit`);
    await page.waitForLoadState('networkidle');
    // App either redirects to /login OR falls back to request view — both are acceptable
    // What's NOT acceptable is showing the actual edit form to anonymous user
    const editForm = page.locator('form').filter({ has: page.locator('input[name="cargoDescription"], textarea[name="cargoDescription"]') });
    const hasEditForm = await editForm.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasEditForm).toBeFalsy();
  });

  test('N2-b: Non-owner gets 403 or redirected from edit page', async ({ page }) => {
    await loginAs(page, 'other');
    await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}/edit`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/edit');
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
    // Use the same origin as the web app (Next.js proxies API calls)
    const apiBase = BASE.replace(/\/$/, '');

    const cookies = await page.context().cookies();
    const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

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

    expect([401, 403, 404]).toContain(response.status());
  });

  test('N3: PATCH request without auth returns 401', async ({ page }) => {
    const apiBase = BASE.replace(/\/$/, '');
    const response = await page.request.patch(
      `${apiBase}/api/transport/requests/${SEED_IDS.openRequest}`,
      {
        data: { cargoDescription: 'HIJACKED ANONYMOUS' },
      }
    );
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('Security — AuthGuard (B3)', () => {
  test('B3: /transport/my-quotes requires authentication', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/my-quotes`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/login/);
  });

  test('B3: /transport/my-requests requires authentication', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/my-requests`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/login/);
  });

  test('B3: /transport/my-bookings requires authentication', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/my-bookings`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/login/);
  });
});
