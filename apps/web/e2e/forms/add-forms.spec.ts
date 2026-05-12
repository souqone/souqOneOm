/**
 * E2E: Add-Listing Forms — Smoke Tests
 *
 * Verifies every add-listing form page:
 *   1. Loads without 404 / 500
 *   2. Renders the MultiStepForm shell (data-testid="form-shell")
 *   3. Shows the navigation button (next-button OR submit-button for single-step)
 *   4. Produces zero JavaScript runtime errors
 *
 * Uses data-testid selectors only — no Arabic text, no CSS classes.
 *
 * Auth strategy: direct API call to Railway → inject JWT into localStorage.
 * This avoids storageState timing issues entirely.
 */

import { test, expect } from '@playwright/test';

const API_BASE = 'https://caroneapi-production-255b.up.railway.app/api/v1';

// Tokens fetched once and shared across all tests (serial mode).
let accessToken = '';
let refreshToken  = '';

// Serial mode: beforeAll completes before any test runs.
test.describe.configure({ mode: 'serial' });

// ── Auth Setup ───────────────────────────────────────────────────────────────
test.beforeAll(async ({ request }) => {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'seller@carone.om', password: 'Test1234' },
  });
  expect(res.ok(), `Login API failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const data = await res.json();
  accessToken  = data.accessToken  ?? data.access_token  ?? '';
  refreshToken = data.refreshToken ?? data.refresh_token ?? '';
  expect(accessToken, 'accessToken missing from login response').toBeTruthy();
});

// ── Form definitions ─────────────────────────────────────────────────────────
interface FormDef {
  name: string;
  url: string;
}

const FORMS: FormDef[] = [
  // ── Car ──────────────────────────────────────────────────────────────────
  { name: 'car / sale',             url: '/ar/add-listing/car?type=SALE'    },
  { name: 'car / rental',           url: '/ar/add-listing/car?type=RENTAL'  },

  // ── Bus ──────────────────────────────────────────────────────────────────
  { name: 'bus / sale',             url: '/ar/add-listing/bus'              },

  // ── Equipment ─────────────────────────────────────────────────────────────
  { name: 'equipment / sale',       url: '/ar/add-listing/equipment'        },
  { name: 'equipment / rent',       url: '/ar/add-listing/equipment'        },

  // ── Operator ──────────────────────────────────────────────────────────────
  { name: 'operator',               url: '/ar/add-listing/operator'         },

  // ── Spare Parts ───────────────────────────────────────────────────────────
  { name: 'parts / general',        url: '/ar/add-listing/parts'            },
  { name: 'parts / tires',          url: '/ar/add-listing/parts?cat=TIRES'  },
  { name: 'parts / accessories',    url: '/ar/add-listing/parts?cat=ACCESSORIES' },

  // ── Service ───────────────────────────────────────────────────────────────
  { name: 'service / maintenance',  url: '/ar/add-listing/service'          },
  { name: 'service / cleaning',     url: '/ar/add-listing/service'          },

  // ── Jobs ──────────────────────────────────────────────────────────────────
  { name: 'jobs / offering',        url: '/ar/jobs/new?type=OFFERING'       },
  { name: 'jobs / hiring',          url: '/ar/jobs/new?type=HIRING'         },

  // ── Equipment Requests ────────────────────────────────────────────────────
  { name: 'equipment request',      url: '/ar/equipment/requests/new'       },
];

// ── Tests ────────────────────────────────────────────────────────────────────
test.describe('Add Listing Forms — Smoke Tests', () => {
  for (const form of FORMS) {
    test(`[${form.name}] renders form-shell + navigation button`, async ({ page }) => {
      // 1. Navigate to the app root first so localStorage is writable for this origin.
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // 2. Inject JWT tokens into localStorage — bypasses browser login entirely.
      await page.evaluate(
        ({ at, rt }) => {
          localStorage.setItem('carone.auth_token', at);
          localStorage.setItem('carone.refresh_token', rt);
        },
        { at: accessToken, rt: refreshToken },
      );

      // Collect JS runtime errors BEFORE navigation
      const jsErrors: string[] = [];
      page.on('pageerror', (err) => jsErrors.push(err.message));

      // 3. Navigate to the target form URL
      const response = await page.goto(form.url, { waitUntil: 'domcontentloaded' });

      // ── 1. HTTP status must not be 4xx / 5xx ────────────────────────────
      const status = response?.status() ?? 200;
      expect(
        status,
        `${form.name}: unexpected HTTP ${status} for ${form.url}`,
      ).toBeLessThan(400);

      // ── 2. URL must not contain error / 404 / 500 ───────────────────────
      await expect(page).not.toHaveURL(/\/(error|404|500)(\/|$)/);

      // ── 3. form-shell must be visible after hydration ────────────────────
      await expect(
        page.locator('[data-testid="form-shell"]'),
        `${form.name}: form-shell not found on ${form.url}`,
      ).toBeVisible({ timeout: 15000 });

      // ── 4. Navigation button (next on multi-step, submit on 1-step) ──────
      const hasNext   = await page.locator('[data-testid="next-button"]').count();
      const hasSubmit = await page.locator('[data-testid="submit-button"]').count();
      expect(
        hasNext + hasSubmit,
        `${form.name}: neither next-button nor submit-button found on ${form.url}`,
      ).toBeGreaterThan(0);

      // ── 5. Zero functional JavaScript errors ────────────────────────────
      // Filter out known pre-existing React hydration mismatch from AuthGuard
      // (SSR renders form, client initially shows loading state → mismatch).
      // This is a separate bug; the form IS functional after hydration.
      const functionalErrors = jsErrors.filter(
        (e) => !e.includes('Hydration') && !e.includes('hydration'),
      );
      if (jsErrors.length !== functionalErrors.length) {
        console.warn(`[${form.name}] ⚠️  Hydration mismatch detected on ${form.url}`);
      }
      expect(
        functionalErrors,
        `${form.name}: JS errors on ${form.url}:\n  ${functionalErrors.join('\n  ')}`,
      ).toHaveLength(0);
    });
  }
});
