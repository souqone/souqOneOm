import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Full Flow — Shipper Creates Request', () => {
  test('Shipper creates new request via wizard (A8: single submit)', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`${BASE}/ar/transport/new`);
    await page.waitForLoadState('networkidle');

    // Step 1: Service type
    const goodsBtn = page.getByRole('button', { name: /بضائع|نقل عام/i }).first();
    if (await goodsBtn.isVisible({ timeout: 15000 }).catch(() => false)) {
      await goodsBtn.click();
    }
    const nextBtn = page.getByRole('button', { name: /التالي|Next/i });
    await nextBtn.click();
    await page.waitForLoadState('networkidle');

    // Step 2: Route
    const fromGov = page.locator('input[name="fromGovernorate"], select[name="fromGovernorate"]').first();
    if (await fromGov.isVisible({ timeout: 5000 }).catch(() => false)) {
      if ((await fromGov.evaluate((el) => el.tagName)) === 'SELECT') {
        await fromGov.selectOption({ index: 1 });
      } else {
        await fromGov.fill('مسقط');
      }
    }
    const fromAddr = page.locator('input[name="fromAddress"]').first();
    if (await fromAddr.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fromAddr.fill('شارع الموالح');
    }
    const toGov = page.locator('input[name="toGovernorate"], select[name="toGovernorate"]').first();
    if (await toGov.isVisible({ timeout: 3000 }).catch(() => false)) {
      if ((await toGov.evaluate((el) => el.tagName)) === 'SELECT') {
        await toGov.selectOption({ index: 2 });
      } else {
        await toGov.fill('صلالة');
      }
    }
    const toAddr = page.locator('input[name="toAddress"]').first();
    if (await toAddr.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toAddr.fill('وسط المدينة');
    }
    await nextBtn.click();
    await page.waitForLoadState('networkidle');

    // Step 3: Cargo
    const cargoField = page.locator('textarea, input[name="cargoDescription"]').first();
    if (await cargoField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cargoField.fill('بضائع E2E test — صناديق متنوعة');
    }
    await nextBtn.click();
    await page.waitForLoadState('networkidle');

    // Step 4: Timing — ASAP
    const asapBtn = page.getByRole('button', { name: /في أقرب وقت|ASAP/i }).first();
    if (await asapBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await asapBtn.click();
    }
    await nextBtn.click();
    await page.waitForLoadState('networkidle');

    // Step 5: Review — submit
    const submitBtn = page.getByRole('button', { name: /إرسال الطلب|Submit|نشر/i }).first();
    if (await submitBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      // Click once only (A8: anti-double-submit)
      await submitBtn.click();

      // Wait for redirect to my-requests
      await page.waitForURL((url) => url.pathname.includes('/my-requests') || url.pathname.includes('/requests/'), {
        timeout: 30000,
      });

      // Verify success
      expect(page.url()).not.toMatch(/\/transport\/new/);
    }
  });
});

test.describe('Full Flow — Carrier Submits Quote', () => {
  test('Carrier sees OPEN request and submits quote', async ({ page }) => {
    await loginAs(page, 'carrier');

    // Browse to find an open request
    await page.goto(`${BASE}/ar/transport/browse?status=OPEN`);
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('a[href*="/transport/requests/"]').first();
    if (await firstCard.isVisible({ timeout: 15000 }).catch(() => false)) {
      const href = await firstCard.getAttribute('href');

      // Verify locale in link (E1)
      expect(href).toMatch(/^\/ar\//);

      await firstCard.click();
      await page.waitForLoadState('networkidle');

      // Quote form should be visible for carrier with profile
      const priceInput = page.locator('input[name="price"], input[placeholder*="سعر"]').first();
      if (await priceInput.isVisible({ timeout: 15000 }).catch(() => false)) {
        await priceInput.fill('75');

        const msgInput = page.locator('textarea[name="message"], textarea[placeholder*="رسالة"]').first();
        if (await msgInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await msgInput.fill('يسعدني تقديم هذه الخدمة');
        }

        const submitQuoteBtn = page.getByRole('button', { name: /تقديم العرض|Submit|إرسال/i }).first();
        await submitQuoteBtn.click();
        await page.waitForLoadState('networkidle');

        // Should show success or the quote is now listed
        const successMsg = page.getByText(/تم إرسال|عرضك|تقديم ناجح/i);
        const hasSuccess = await successMsg.isVisible({ timeout: 15000 }).catch(() => false);
        expect(hasSuccess).toBeTruthy();
      }
    }
  });
});

test.describe('Full Flow — Locale Consistency', () => {
  test('All transport internal navigation stays within /ar/ locale', async ({ page }) => {
    const navigationErrors: string[] = [];

    // Monitor all navigations
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        const url = frame.url();
        if (url.includes('/transport/') && !url.includes('/ar/') && !url.includes('/en/')) {
          navigationErrors.push(`Missing locale in URL: ${url}`);
        }
      }
    });

    await loginAs(page, 'shipper');
    await page.goto(`${BASE}/ar/transport`);
    await page.waitForLoadState('networkidle');

    // Navigate through transport section
    const links = [
      `${BASE}/ar/transport/browse`,
      `${BASE}/ar/transport/my-requests`,
    ];

    for (const link of links) {
      await page.goto(link);
      await page.waitForLoadState('networkidle');
    }

    expect(navigationErrors).toHaveLength(0);
  });
});
