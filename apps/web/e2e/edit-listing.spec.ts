import { test, expect } from '@playwright/test';

/**
 * E2E tests for the dynamic edit-listing routes.
 *
 * These tests verify:
 * 1. Supported types (bus, equipment, parts, service, operator) load correctly
 * 2. Rich-form types (car, job) still work independently
 * 3. Unsupported types return 404
 * 4. Add-listing pages load correctly after refactor
 */

const SUPPORTED_TYPES = ['bus', 'equipment', 'parts', 'service', 'operator'] as const;
const RICH_FORM_TYPES = ['car', 'job'] as const;

// Use a fake ID — these pages require auth anyway, so we test
// that the route resolves and the page shell renders (auth guard / loading state).
const FAKE_ID = 'test-fake-id-123';

test.describe('Edit Listing — Dynamic Route', () => {
  for (const type of SUPPORTED_TYPES) {
    test(`/ar/edit-listing/${type}/${FAKE_ID} — should resolve (not 404)`, async ({ page }) => {
      const response = await page.goto(`/ar/edit-listing/${type}/${FAKE_ID}`, {
        waitUntil: 'domcontentloaded',
      });

      // The route should exist — status should NOT be 404
      expect(response?.status()).not.toBe(404);

      // Page should render some content (auth guard, loading skeleton, or the form)
      await expect(page.locator('body')).not.toBeEmpty();
    });
  }

  for (const type of RICH_FORM_TYPES) {
    test(`/ar/edit-listing/${type}/${FAKE_ID} — rich form route still works`, async ({ page }) => {
      const response = await page.goto(`/ar/edit-listing/${type}/${FAKE_ID}`, {
        waitUntil: 'domcontentloaded',
      });

      expect(response?.status()).not.toBe(404);
      await expect(page.locator('body')).not.toBeEmpty();
    });
  }

  test('/ar/edit-listing/invalidtype/123 — should show 404 page', async ({ page }) => {
    await page.goto(`/ar/edit-listing/invalidtype/${FAKE_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    // notFound() in client component renders the not-found UI (HTTP may still be 200)
    // The not-found page has <h1>404</h1>
    await expect(page.locator('h1:has-text("404")')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Add Listing — Refactored Pages', () => {
  const ADD_TYPES = ['bus', 'equipment', 'operator', 'parts', 'service'] as const;

  for (const type of ADD_TYPES) {
    test(`/ar/add-listing/${type} — should load`, async ({ page }) => {
      const response = await page.goto(`/ar/add-listing/${type}`, {
        waitUntil: 'domcontentloaded',
      });

      expect(response?.status()).not.toBe(404);
      await expect(page.locator('body')).not.toBeEmpty();
    });
  }
});
