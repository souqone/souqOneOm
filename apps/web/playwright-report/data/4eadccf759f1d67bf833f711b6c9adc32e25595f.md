# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: transport\02-security.spec.ts >> Security — API Ownership (N3) >> N3: PATCH request without auth returns 401
- Location: e2e\transport\02-security.spec.ts:92:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 404
Received array: [401, 403]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { loginAs, SEED_IDS } from './helpers';
  3   | 
  4   | const BASE = process.env.BASE_URL || 'http://localhost:3000';
  5   | 
  6   | test.describe('Security — Edit Button Ownership (N1)', () => {
  7   |   test('N1-a: Owner (shipper) sees edit button on their own request', async ({ page }) => {
  8   |     await loginAs(page, 'shipper');
  9   |     await page.goto(`${BASE}/ar/transport/my-requests`);
  10  |     await page.waitForLoadState('networkidle');
  11  | 
  12  |     // Find the seed request card
  13  |     const ownCard = page.locator(`a[href*="${SEED_IDS.openRequest}"]`).first();
  14  |     await expect(ownCard).toBeVisible({ timeout: 20000 });
  15  |     const editBtn = ownCard.locator('button, a').filter({ hasText: /تعديل|edit/i });
  16  |     await expect(editBtn).toBeVisible();
  17  |   });
  18  | 
  19  |   test('N1-b: Other logged-in user does NOT see edit button on someone else request', async ({ page }) => {
  20  |     await loginAs(page, 'other');
  21  |     await page.goto(`${BASE}/ar/transport/browse`);
  22  |     await page.waitForLoadState('networkidle');
  23  | 
  24  |     // Find shipper's request card (seed-tr-open-001)
  25  |     const shipperCard = page.locator(`a[href*="${SEED_IDS.openRequest}"]`).first();
  26  |     await expect(shipperCard).toBeVisible({ timeout: 20000 });
  27  |     const editBtn = shipperCard.locator('button, a').filter({ hasText: /تعديل|edit/i });
  28  |     await expect(editBtn).toHaveCount(0);
  29  |   });
  30  | 
  31  |   test('N1-c: Anonymous user sees NO edit button in browse', async ({ page }) => {
  32  |     await page.goto(`${BASE}/ar/transport/browse`);
  33  |     await page.waitForLoadState('networkidle');
  34  |     const editButtons = page.getByRole('button', { name: /تعديل|edit/i });
  35  |     await expect(editButtons).toHaveCount(0);
  36  |   });
  37  | });
  38  | 
  39  | test.describe('Security — Edit Page Access (N2)', () => {
  40  |   test('N2-a: Anonymous cannot access edit page (redirect or show request view)', async ({ page }) => {
  41  |     await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}/edit`);
  42  |     await page.waitForLoadState('networkidle');
  43  |     // App either redirects to /login OR falls back to request view — both are acceptable
  44  |     // What's NOT acceptable is showing the actual edit form to anonymous user
  45  |     const editForm = page.locator('form').filter({ has: page.locator('input[name="cargoDescription"], textarea[name="cargoDescription"]') });
  46  |     const hasEditForm = await editForm.isVisible({ timeout: 5000 }).catch(() => false);
  47  |     expect(hasEditForm).toBeFalsy();
  48  |   });
  49  | 
  50  |   test('N2-b: Non-owner gets 403 or redirected from edit page', async ({ page }) => {
  51  |     await loginAs(page, 'other');
  52  |     await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}/edit`);
  53  |     await page.waitForLoadState('networkidle');
  54  |     expect(page.url()).not.toContain('/edit');
  55  |   });
  56  | 
  57  |   test('N2-c: Owner can access edit page', async ({ page }) => {
  58  |     await loginAs(page, 'shipper');
  59  |     await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}/edit`);
  60  |     await page.waitForLoadState('networkidle');
  61  |     // Should NOT redirect to login
  62  |     expect(page.url()).not.toMatch(/\/login/);
  63  |   });
  64  | });
  65  | 
  66  | test.describe('Security — API Ownership (N3)', () => {
  67  |   test('N3: PATCH request by non-owner returns 401 or 403', async ({ page }) => {
  68  |     await loginAs(page, 'other');
  69  |     // Use the same origin as the web app (Next.js proxies API calls)
  70  |     const apiBase = BASE.replace(/\/$/, '');
  71  | 
  72  |     const cookies = await page.context().cookies();
  73  |     const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  74  | 
  75  |     const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  76  | 
  77  |     const response = await page.request.patch(
  78  |       `${apiBase}/api/transport/requests/${SEED_IDS.openRequest}`,
  79  |       {
  80  |         headers: {
  81  |           Authorization: token ? `Bearer ${token}` : '',
  82  |           'Content-Type': 'application/json',
  83  |           Cookie: cookieStr,
  84  |         },
  85  |         data: { cargoDescription: 'HIJACKED BY NON-OWNER' },
  86  |       }
  87  |     );
  88  | 
  89  |     expect([401, 403, 404]).toContain(response.status());
  90  |   });
  91  | 
  92  |   test('N3: PATCH request without auth returns 401', async ({ page }) => {
  93  |     const apiBase = BASE.replace(/\/$/, '');
  94  |     const response = await page.request.patch(
  95  |       `${apiBase}/api/transport/requests/${SEED_IDS.openRequest}`,
  96  |       {
  97  |         data: { cargoDescription: 'HIJACKED ANONYMOUS' },
  98  |       }
  99  |     );
> 100 |     expect([401, 403]).toContain(response.status());
      |                        ^ Error: expect(received).toContain(expected) // indexOf
  101 |   });
  102 | });
  103 | 
  104 | test.describe('Security — AuthGuard (B3)', () => {
  105 |   test('B3: /transport/my-quotes requires authentication', async ({ page }) => {
  106 |     await page.goto(`${BASE}/ar/transport/my-quotes`);
  107 |     await page.waitForLoadState('networkidle');
  108 |     expect(page.url()).toMatch(/\/login/);
  109 |   });
  110 | 
  111 |   test('B3: /transport/my-requests requires authentication', async ({ page }) => {
  112 |     await page.goto(`${BASE}/ar/transport/my-requests`);
  113 |     await page.waitForLoadState('networkidle');
  114 |     expect(page.url()).toMatch(/\/login/);
  115 |   });
  116 | 
  117 |   test('B3: /transport/my-bookings requires authentication', async ({ page }) => {
  118 |     await page.goto(`${BASE}/ar/transport/my-bookings`);
  119 |     await page.waitForLoadState('networkidle');
  120 |     expect(page.url()).toMatch(/\/login/);
  121 |   });
  122 | });
  123 | 
```