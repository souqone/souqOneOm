import { test, expect } from '@playwright/test';
import { loginAs, SEED_IDS } from './helpers';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Request Flow — Shipper Sees Quotes (N4)', () => {
  test('N4: Shipper sees quotes section on their QUOTED request', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.quotedRequest}`);
    await page.waitForLoadState('networkidle');

    // Quotes section must be visible for owner
    const quotesSection = page
      .getByText(/العروض|الأسعار المقدمة|عروض الناقلين/i)
      .first();
    await expect(quotesSection).toBeVisible({ timeout: 30000 });
  });

  test('N4: Shipper sees the pending quote amount', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.quotedRequest}`);
    await page.waitForLoadState('networkidle');

    // The seed quote has price=60 — should appear somewhere
    const priceText = page.getByText(/60/);
    await expect(priceText).toBeVisible({ timeout: 30000 });
  });

  test('N4: Shipper can accept the quote', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.quotedRequest}`);
    await page.waitForLoadState('networkidle');

    const acceptBtn = page.getByRole('button', { name: /قبول|Accept/i }).first();
    await expect(acceptBtn).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Request Flow — hasAlreadyQuoted (N5)', () => {
  test('N5: Carrier who already quoted sees "already quoted" message, not the form', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.quotedRequest}`);
    await page.waitForLoadState('networkidle');

    // Carrier already has seed-tq-pending-001 on this request
    // Should see a message saying they already submitted, NOT the quote form
    const alreadyQuotedMsg = page.getByText(/قدّمت عرضاً|سبق تقديم|عرض موجود/i);
    const submitForm = page.locator('form').filter({ has: page.locator('input[name="price"]') });

    await expect(submitForm).not.toBeVisible({ timeout: 5000 });
    await expect(alreadyQuotedMsg).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Request Flow — Cancel Request Button (N8)', () => {
  test('N8: Shipper sees cancel button on their OPEN request', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}`);
    await page.waitForLoadState('networkidle');

    const cancelBtn = page.getByRole('button', { name: /إلغاء الطلب|Cancel/i });
    await expect(cancelBtn).toBeVisible({ timeout: 30000 });
  });

  test('N8: Non-owner does NOT see cancel button', async ({ page }) => {
    await loginAs(page, 'other');
    await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}`);
    await page.waitForLoadState('networkidle');

    const cancelBtn = page.getByRole('button', { name: /إلغاء الطلب/i });
    await expect(cancelBtn).toHaveCount(0);
  });
});

test.describe('Request Flow — Carrier No Profile (N16)', () => {
  test('N16: User with CARRIER role but no profile sees registration banner, not quote form', async ({ page }) => {
    await loginAs(page, 'carrierNoProfile');
    await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}`);
    await page.waitForLoadState('networkidle');

    // Carrier WITHOUT profile should see banner, NOT the quote form
    const quoteSection = page.locator('form, [data-testid="quote-form"], input[name="price"]').first();
    const regBanner = page.getByText(/سجّل كناقل|إنشاء ملف ناقل/i);

    const hasForm = await quoteSection.isVisible({ timeout: 5000 }).catch(() => false);
    const hasBanner = await regBanner.isVisible({ timeout: 10000 }).catch(() => false);

    expect(hasForm).toBeFalsy();
    expect(hasBanner).toBeTruthy();
  });
});

test.describe('Wizard Validation (A7 + C1)', () => {
  test('A7+C1: Wizard Step 4 — "scheduled" without date shows error', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`${BASE}/ar/transport/new`);
    await page.waitForLoadState('networkidle');

    // Step 1 — select service type
    const goodsBtn = page.getByRole('button', { name: /بضائع|GOODS/i }).first();
    if (await goodsBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await goodsBtn.click();
    }
    const nextBtn = page.getByRole('button', { name: /التالي|Next/i });
    await nextBtn.click();

    // Step 2 — fill from/to (minimal)
    await page.waitForLoadState('networkidle');
    const fromInput = page.locator('input[name="fromGovernorate"], input[placeholder*="من"]').first();
    if (await fromInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fromInput.fill('مسقط');
    }
    const toInput = page.locator('input[name="toGovernorate"], input[placeholder*="إلى"]').first();
    if (await toInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toInput.fill('صلالة');
    }
    const fromAddr = page.locator('input[name="fromAddress"]').first();
    if (await fromAddr.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fromAddr.fill('شارع الرئيسي');
    }
    const toAddr = page.locator('input[name="toAddress"]').first();
    if (await toAddr.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toAddr.fill('شارع صلالة');
    }
    await nextBtn.click();

    // Step 3 — cargo description
    await page.waitForLoadState('networkidle');
    const cargoInput = page.locator('textarea, input[name="cargoDescription"]').first();
    if (await cargoInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cargoInput.fill('بضائع تجريبية');
    }
    await nextBtn.click();

    // Step 4 — select "scheduled" without choosing a date
    await page.waitForLoadState('networkidle');
    const scheduledOption = page.getByRole('button', { name: /موعد محدد|scheduled/i }).or(
      page.locator('input[value="scheduled"]')
    ).first();
    if (await scheduledOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await scheduledOption.click();
    }

    // Try to go next WITHOUT choosing date
    await nextBtn.click();

    // Should show validation error — either toast or inline message
    const errorMsg = page.getByText(/يرجى تحديد الموعد|الموعد مطلوب|حقل إلزامي/i);
    const toastError = page.locator('[class*="toast"], [role="alert"]').filter({ hasText: /مطلوب|إكمال|يرجى/i });

    const hasInlineError = await errorMsg.isVisible({ timeout: 10000 }).catch(() => false);
    const hasToastError = await toastError.isVisible({ timeout: 10000 }).catch(() => false);

    expect(hasInlineError || hasToastError).toBeTruthy();
  });

  test('C1: Wizard clicking Next with empty required field shows toast or inline error', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`${BASE}/ar/transport/new`);
    await page.waitForLoadState('networkidle');

    // Immediately click Next without selecting service type
    const nextBtn = page.getByRole('button', { name: /التالي|Next/i });
    if (await nextBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);

      // Should NOT advance to step 2. A robust way to check is to verify
      const step2Field = page.locator('input[name="fromGovernorate"], input[name="fromAddress"]').first();
      await expect(step2Field).not.toBeVisible({ timeout: 3000 });
    }
  });
});
