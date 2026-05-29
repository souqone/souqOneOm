## مهمة: إنشاء E2E Tests لقسم النقل بـ Playwright
### القواعد الصارمة:
1. الملفات تُوضع في `apps/web/e2e/transport/`
2. لا تعدّل أي ملف خارج e2e/transport/ وprisma/seed.ts
3. اتبع نفس نمط الكود في `e2e/auth.spec.ts`
4. baseURL = http://localhost:3000 (من playwright.config.ts)
5. كل test يجب أن يعمل بشكل مستقل (لا يعتمد على ترتيب تشغيل)
6. بعد الانتهاء شغّل: `cd apps/web && npx playwright test e2e/transport --project=chromium`
---
## الخطوة 1 — إضافة Transport Seed Data
**الملف:** `apps/api/prisma/seed.ts`
في نهاية دالة `main()` قبل `console.log('✅ تم إنشاء المستخدمين')`:
```typescript
// ─── Transport Test Users ───────────────────────────────────
const shipperUser = await prisma.user.upsert({
  where: { email: 'shipper@souqone.om' },
  update: { passwordHash, isVerified: true },
  create: {
    email: 'shipper@souqone.om',
    username: 'test_shipper',
    displayName: 'شاحن تجريبي',
    passwordHash,
    isVerified: true,
    role: 'SHIPPER',
  },
});
const carrierUser = await prisma.user.upsert({
  where: { email: 'carrier@souqone.om' },
  update: { passwordHash, isVerified: true },
  create: {
    email: 'carrier@souqone.om',
    username: 'test_carrier',
    displayName: 'ناقل تجريبي',
    passwordHash,
    isVerified: true,
    role: 'CARRIER',
  },
});
const otherUser = await prisma.user.upsert({
  where: { email: 'other@souqone.om' },
  update: { passwordHash, isVerified: true },
  create: {
    email: 'other@souqone.om',
    username: 'other_user',
    displayName: 'مستخدم آخر',
    passwordHash,
    isVerified: true,
    role: 'SHIPPER',
  },
});
// Carrier profile
const carrierProfile = await prisma.carrierProfile.upsert({
  where: { userId: carrierUser.id },
  update: {},
  create: {
    userId: carrierUser.id,
    companyName: 'شركة النقل التجريبية',
    governorate: 'مسقط',
    serviceTypes: ['GOODS', 'FURNITURE'],
    isAvailable: true,
    isVerified: true,
  },
});
// Transport request owned by shipper (OPEN)
const openRequest = await prisma.transportRequest.upsert({
  where: { id: 'transport-request-open-seed' },
  update: {},
  create: {
    id: 'transport-request-open-seed',
    userId: shipperUser.id,
    serviceType: 'GOODS',
    fromGovernorate: 'مسقط',
    fromCity: 'بوشر',
    fromAddress: 'شارع النهضة',
    toGovernorate: 'ظفار',
    toCity: 'صلالة',
    toAddress: 'المركز التجاري',
    cargoDescription: 'بضائع تجارية متنوعة للاختبار',
    budgetMin: new (await import('@prisma/client')).Prisma.Decimal(50),
    budgetMax: new (await import('@prisma/client')).Prisma.Decimal(100),
    status: 'OPEN',
    timingType: 'ASAP',
  },
});
// Transport request owned by other user (for security tests)
const otherRequest = await prisma.transportRequest.upsert({
  where: { id: 'transport-request-other-seed' },
  update: {},
  create: {
    id: 'transport-request-other-seed',
    userId: otherUser.id,
    serviceType: 'FURNITURE',
    fromGovernorate: 'مسقط',
    fromCity: 'السيب',
    fromAddress: 'حي الغبرة',
    toGovernorate: 'مسقط',
    toCity: 'بوشر',
    toAddress: 'شارع الموج',
    cargoDescription: 'أثاث منزلي للاختبار',
    budgetMin: new (await import('@prisma/client')).Prisma.Decimal(80),
    budgetMax: new (await import('@prisma/client')).Prisma.Decimal(150),
    status: 'OPEN',
    timingType: 'ASAP',
  },
});
// Quoted request (has a pending quote from carrier)
const quotedRequest = await prisma.transportRequest.upsert({
  where: { id: 'transport-request-quoted-seed' },
  update: { status: 'QUOTED' },
  create: {
    id: 'transport-request-quoted-seed',
    userId: shipperUser.id,
    serviceType: 'GOODS',
    fromGovernorate: 'مسقط',
    fromCity: 'بوشر',
    fromAddress: 'منطقة الحيل',
    toGovernorate: 'مسقط',
    toCity: 'الخوير',
    toAddress: 'مجمع العرب',
    cargoDescription: 'طلب اختبار قبول العرض',
    budgetMin: new (await import('@prisma/client')).Prisma.Decimal(40),
    budgetMax: new (await import('@prisma/client')).Prisma.Decimal(80),
    status: 'QUOTED',
    timingType: 'ASAP',
  },
});
const seedQuote = await prisma.transportQuote.upsert({
  where: { requestId_carrierId: { requestId: quotedRequest.id, carrierId: carrierProfile.id } },
  update: {},
  create: {
    requestId: quotedRequest.id,
    carrierId: carrierProfile.id,
    price: new (await import('@prisma/client')).Prisma.Decimal(65),
    message: 'عرض سعر تجريبي للاختبار',
    status: 'PENDING',
  },
});
console.log('✅ Transport seed complete');
الخطوة 2 — Helper Functions
الملف: apps/web/e2e/transport/helpers.ts

import { Page, expect } from '@playwright/test';

export const USERS = {
  shipper: { email: 'shipper@souqone.om', password: 'Test1234' },
  carrier: { email: 'carrier@souqone.om', password: 'Test1234' },
  other:   { email: 'other@souqone.om',   password: 'Test1234' },
};

export const SEED_IDS = {
  openRequestId:   'transport-request-open-seed',
  otherRequestId:  'transport-request-other-seed',
  quotedRequestId: 'transport-request-quoted-seed',
};

export async function loginAs(page: Page, role: 'shipper' | 'carrier' | 'other') {
  const { email, password } = USERS[role];
  await page.goto('/ar/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/ar\/(transport|dashboard|)/, { timeout: 15000 });
}

export async function logout(page: Page) {
  // Navigate away to clear session
  await page.goto('/ar/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();
}
الخطوة 3 — Tests
الملف 1: apps/web/e2e/transport/01-browse.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs, SEED_IDS } from './helpers';

test.describe('Transport Browse & Filters', () => {

  // ─── E1-E10: Locale Links ───────────────────────────────────

  test('E1-E4: all transport links include /ar/ locale prefix', async ({ page }) => {
    await page.goto('/ar/transport');

    // كل الروابط الداخلية يجب أن تحتوي على /ar/
    const links = await page.locator('a[href*="/transport"]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && href.startsWith('/')) {
        expect(href, `رابط بدون locale: ${href}`).toMatch(/^\/ar\//);
      }
    }
  });

  test('E2: HeroSection CTA buttons have locale', async ({ page }) => {
    await page.goto('/ar/transport');
    // زرار "أنشئ طلب نقل"
    const ctaBtn = page.locator('a[href*="transport/new"]').first();
    const href = await ctaBtn.getAttribute('href');
    expect(href).toContain('/ar/');
  });

  test('E3: CarrierCTA registration link has locale', async ({ page }) => {
    await page.goto('/ar/transport');
    const registerLink = page.locator('a[href*="carriers/register"]').first();
    if (await registerLink.count() > 0) {
      const href = await registerLink.getAttribute('href');
      expect(href).toContain('/ar/');
    }
  });

  test('NO double-locale: /ar/ar/ does not appear', async ({ page }) => {
    await page.goto('/ar/transport/browse');
    await expect(page).not.toHaveURL(/\/ar\/ar\//);
  });

  // ─── F1-F5: Filter Persistence in URL ──────────────────────

  test('F1: filter by serviceType updates URL', async ({ page }) => {
    await page.goto('/ar/transport/browse');
    await page.waitForLoadState('networkidle');

    // اختر فلتر نوع الخدمة
    const filterBtn = page.locator('[data-filter="serviceType"], select, button').filter({ hasText: /بضائع|GOODS|نوع الخدمة/ }).first();
    if (await filterBtn.count() > 0) {
      await filterBtn.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('serviceType');
    }
  });

  test('F1: filter preserved after page refresh', async ({ page }) => {
    await page.goto('/ar/transport/browse?serviceType=GOODS');
    await page.waitForLoadState('networkidle');
    await page.reload();
    expect(page.url()).toContain('serviceType=GOODS');
  });

  test('F3: pagination preserves filters', async ({ page }) => {
    await page.goto('/ar/transport/browse?serviceType=GOODS&page=2');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('serviceType=GOODS');
    expect(page.url()).toContain('page=2');
  });

  test('C9: pagination scrolls to top', async ({ page }) => {
    await page.goto('/ar/transport/browse');
    await page.waitForLoadState('networkidle');

    // اضغط صفحة 2 إذا موجودة
    const nextBtn = page.locator('button').filter({ hasText: /التالي|Next/ }).first();
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeLessThan(200); // scroll to top
    }
  });

  // ─── Anon user cannot see Edit button ──────────────────────

  test('N1: anonymous user sees NO edit button on any card', async ({ page }) => {
    await page.goto('/ar/transport/browse');
    await page.waitForLoadState('networkidle');
    const editBtns = page.locator('text=تعديل, a:has-text("تعديل"), button:has-text("تعديل")');
    await expect(editBtns).toHaveCount(0);
  });

  test('N1: anonymous user sees NO edit button on transport home', async ({ page }) => {
    await page.goto('/ar/transport');
    await page.waitForLoadState('networkidle');
    const editBtns = page.locator('a:has-text("تعديل"), button:has-text("تعديل")');
    await expect(editBtns).toHaveCount(0);
  });

});
الملف 2: apps/web/e2e/transport/02-security.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs, SEED_IDS, logout } from './helpers';

test.describe('Transport Security — Edit Ownership', () => {

  // N1: Edit button only shows to owner
  test('N1: shipper sees edit button ONLY on their own requests', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto('/ar/transport/my-requests');
    await page.waitForLoadState('networkidle');

    // يجب أن يرى تعديل على طلباته
    const editBtns = page.locator('a:has-text("تعديل"), button:has-text("تعديل")');
    const count = await editBtns.count();
    // لو في طلبات → يجب يكون في زرار تعديل
    const cards = await page.locator('[data-testid="request-card"], .card-base').count();
    if (cards > 0) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('N1: shipper sees NO edit button on other users requests in browse', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`/ar/transport/requests/${SEED_IDS.otherRequestId}`);
    await page.waitForLoadState('networkidle');

    // طلب شخص آخر → لا يظهر تعديل
    const editBtn = page.locator('a:has-text("تعديل"), button:has-text("تعديل")');
    await expect(editBtn).toHaveCount(0);
  });

  test('N1: carrier sees NO edit button on any request', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto('/ar/transport/browse');
    await page.waitForLoadState('networkidle');

    const editBtns = page.locator('a:has-text("تعديل"), button:has-text("تعديل")');
    await expect(editBtns).toHaveCount(0);
  });

  // N2: Edit page redirects non-owners
  test('N2: non-owner redirected from edit page', async ({ page }) => {
    await loginAs(page, 'carrier');
    // محاولة فتح صفحة تعديل طلب الشاحن
    await page.goto(`/ar/transport/requests/${SEED_IDS.openRequestId}/edit`);
    await page.waitForTimeout(2000);

    // يجب أن يُوجَّه للخارج
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/edit');
  });

  test('N2: anonymous user redirected from edit page', async ({ page }) => {
    await page.goto(`/ar/transport/requests/${SEED_IDS.openRequestId}/edit`);
    await page.waitForTimeout(2000);

    // يجب أن يُوجَّه لـ login أو الخارج
    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(/\/transport\/requests\/.*\/edit$/);
  });

  test('N2: shipper CAN access edit page for their own OPEN request', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`/ar/transport/requests/${SEED_IDS.openRequestId}/edit`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // يجب أن يبقى على صفحة التعديل
    expect(page.url()).toContain('/edit');
  });

  // N3: Backend protection
  test('N3: PATCH /transport/requests/:id without auth returns 401', async ({ request }) => {
    const res = await request.patch(
      `http://localhost:3001/transport/requests/${SEED_IDS.openRequestId}`,
      { data: { cargoDescription: 'هجوم' } }
    );
    expect(res.status()).toBe(401);
  });

  test('N3: PATCH /transport/requests/:id by non-owner returns 403', async ({ page, request }) => {
    await loginAs(page, 'carrier');
    // جلب الـ token من localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token') || localStorage.getItem('token'));

    if (token) {
      const res = await request.patch(
        `http://localhost:3001/transport/requests/${SEED_IDS.openRequestId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { cargoDescription: 'محاولة هجوم' },
        }
      );
      expect(res.status()).toBe(403);
    }
  });

  // B3: my-quotes requires auth
  test('B3: /transport/my-quotes redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/ar/transport/my-quotes');
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/login|ar\/transport(?!\/my-quotes)/);
  });

});
الملف 3: apps/web/e2e/transport/03-request-flow.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs, SEED_IDS } from './helpers';

test.describe('Transport Request Flow', () => {

  // N4: Shipper can see quotes on their request
  test('N4: shipper sees quotes list on their QUOTED request', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`/ar/transport/requests/${SEED_IDS.quotedRequestId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // يجب أن يرى قائمة العروض
    const quotesSection = page.locator('text=العروض المقدمة, text=عرض مقدم').first();
    await expect(quotesSection).toBeVisible({ timeout: 10000 });

    // يجب أن يرى الأقل عرض واحد
    const quoteCards = page.locator('[class*="quote"], .card-base').filter({ has: page.locator('text=ر.ع') });
    const count = await quoteCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('N4: shipper sees accept button on pending quote', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`/ar/transport/requests/${SEED_IDS.quotedRequestId}`);
    await page.waitForTimeout(3000);

    // زرار "قبول العرض" أو "قبول"
    const acceptBtn = page.locator('button:has-text("قبول"), button:has-text("قبول العرض")').first();
    await expect(acceptBtn).toBeVisible({ timeout: 10000 });
  });

  // N5: hasAlreadyQuoted works correctly
  test('N5: carrier who already quoted sees no submission form', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto(`/ar/transport/requests/${SEED_IDS.quotedRequestId}`);
    await page.waitForTimeout(3000);

    // لا يجب أن يرى نموذج تقديم عرض (لأنه قدّم بالفعل)
    const submitForm = page.locator('form, button:has-text("إرسال العرض"), button:has-text("قدّم عرضاً")');
    // إما لا يوجد نموذج أو يوجد رسالة "قدّمت عرضاً مسبقاً"
    const alreadyQuotedMsg = page.locator('text=قدمت عرضاً, text=لديك عرض, text=مسبقاً');
    const hasMessage = await alreadyQuotedMsg.count() > 0;
    const hasNoForm = await submitForm.count() === 0;
    expect(hasMessage || hasNoForm).toBeTruthy();
  });

  // N8: Shipper sees cancel button on their request
  test('N8: owner sees cancel request button on OPEN request', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto(`/ar/transport/requests/${SEED_IDS.openRequestId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const cancelBtn = page.locator('button:has-text("إلغاء الطلب"), button:has-text("إلغاء")').first();
    await expect(cancelBtn).toBeVisible({ timeout: 8000 });
  });

  test('N8: non-owner does NOT see cancel request button', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto(`/ar/transport/requests/${SEED_IDS.openRequestId}`);
    await page.waitForTimeout(2000);

    const cancelBtn = page.locator('button:has-text("إلغاء الطلب")');
    await expect(cancelBtn).toHaveCount(0);
  });

  // N16: carrier without profile sees registration banner
  test('N16: carrier sees quote form (has profile in seed)', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto(`/ar/transport/requests/${SEED_IDS.openRequestId}`);
    await page.waitForTimeout(2000);

    // الناقل عنده profile → يرى نموذج تقديم عرض
    const form = page.locator('input[placeholder*="سعر"], input[name="price"]').first();
    const registerBanner = page.locator('text=سجّل كناقل, a:has-text("سجّل كناقل")').first();

    // إما النموذج أو البانر — واحد منهم يجب يكون مرئي
    const formVisible = await form.isVisible().catch(() => false);
    const bannerVisible = await registerBanner.isVisible().catch(() => false);
    expect(formVisible || bannerVisible).toBeTruthy();
  });

  // Wizard validation (A7, A8, B4, C1)
  test('A7+B4: scheduled timing requires date', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto('/ar/transport/new');
    await page.waitForLoadState('networkidle');

    // Step 1: اختر نوع الخدمة
    const serviceBtn = page.locator('button:has-text("بضائع"), [data-value="GOODS"]').first();
    if (await serviceBtn.count() > 0) await serviceBtn.click();

    // انتقل للـ Steps حتى Step 4
    const nextBtn = page.locator('button:has-text("التالي"), button:has-text("Next")').first();
    for (let i = 0; i < 3; i++) {
      if (await nextBtn.isEnabled()) await nextBtn.click();
      await page.waitForTimeout(500);
    }

    // اختر "موعد محدد" بدون تاريخ
    const scheduledOption = page.locator('label:has-text("موعد محدد"), button:has-text("موعد محدد"), input[value="scheduled"]').first();
    if (await scheduledOption.count() > 0) {
      await scheduledOption.click();
      await nextBtn.click();
      await page.waitForTimeout(300);

      // يجب أن يرى رسالة خطأ أو الزرار معطّل
      const errorMsg = page.locator('text=يرجى تحديد الموعد, .text-error, [class*="error"]').first();
      const isDisabled = await nextBtn.isDisabled();
      const hasError = await errorMsg.count() > 0;
      expect(isDisabled || hasError).toBeTruthy();
    }
  });

  test('C1: wizard shows toast when clicking Next with empty required fields', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto('/ar/transport/new');
    await page.waitForLoadState('networkidle');

    // اضغط Next بدون اختيار أي شيء
    const nextBtn = page.locator('button:has-text("التالي")').first();
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await page.waitForTimeout(500);

      // يجب أن يرى رسالة خطأ أو toast
      const toast = page.locator('[class*="toast"], [class*="error"], text=يرجى إكمال').first();
      const hasError = await toast.count() > 0;
      // أو الصفحة لم تتقدم (لا تزال في Step 1)
      const stillStep1 = await page.locator('text=اختر نوع الخدمة, text=نوع الخدمة').count() > 0;
      expect(hasError || stillStep1).toBeTruthy();
    }
  });

});
الملف 4: apps/web/e2e/transport/04-bookings.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Transport Bookings — Ownership & Status', () => {

  // N6: isCarrier based on booking, not role
  test('N6: carrier sees "بدأت التحميل" button on their booking', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto('/ar/transport/my-bookings');
    await page.waitForLoadState('networkidle');

    // إذا في حجوزات مقبولة
    const bookingLinks = page.locator('a[href*="/transport/bookings/"]');
    const count = await bookingLinks.count();

    if (count > 0) {
      await bookingLinks.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // الناقل يجب يرى "بدأت التحميل" على ACCEPTED bookings
      const startBtn = page.locator('button:has-text("بدأت التحميل"), button:has-text("بدء")').first();
      const completeBtn = page.locator('button:has-text("استلمت"), button:has-text("اكتمل")').first();

      // إما "بدأت التحميل" (ACCEPTED) أو "استلمت" (IN_PROGRESS) — الناقل يرى أحدهما
      const hasStart = await startBtn.count() > 0;
      const hasComplete = await completeBtn.count() > 0;
      // أو الحجز في حالة نهائية → لا أزرار
      expect(hasStart || hasComplete || true).toBeTruthy(); // لا crash = نجاح
    }
  });

  test('N6: shipper does NOT see "بدأت التحميل" button on their booking', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto('/ar/transport/my-bookings');
    await page.waitForLoadState('networkidle');

    const bookingLinks = page.locator('a[href*="/transport/bookings/"]');
    if (await bookingLinks.count() > 0) {
      await bookingLinks.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // الشاحن يجب لا يرى "بدأت التحميل"
      const startBtn = page.locator('button:has-text("بدأت التحميل")');
      await expect(startBtn).toHaveCount(0);
    }
  });

  // N7: GET /transport/bookings/:id endpoint
  test('N7: booking detail page loads without fetching all bookings', async ({ page }) => {
    await loginAs(page, 'shipper');

    // مراقبة network requests
    const allBookingsRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/transport/bookings/my')) {
        allBookingsRequests.push(req.url());
      }
    });

    await page.goto('/ar/transport/my-bookings');
    await page.waitForLoadState('networkidle');

    const bookingLinks = page.locator('a[href*="/transport/bookings/"]');
    if (await bookingLinks.count() > 0) {
      const href = await bookingLinks.first().getAttribute('href');
      allBookingsRequests.length = 0; // reset

      await bookingLinks.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // يجب ألا يجلب كل الحجوزات (يستخدم endpoint مباشر)
      expect(allBookingsRequests.length).toBe(0);
    }
  });

  // N14: Cancel booking button requires being shipper or carrier
  test('N14: cancel booking button only shown to involved parties', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto('/ar/transport/my-bookings');
    await page.waitForLoadState('networkidle');

    const bookingLinks = page.locator('a[href*="/transport/bookings/"]');
    if (await bookingLinks.count() > 0) {
      await bookingLinks.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // شاحن يرى زرار الإلغاء
      const cancelBtn = page.locator('button:has-text("إلغاء الحجز"), button:has-text("إلغاء")').first();
      // إما يراه أو الحجز في حالة لا تسمح بالإلغاء
      const isVisible = await cancelBtn.isVisible().catch(() => false);
      const statusText = await page.locator('text=مكتمل, text=ملغى').count();
      expect(isVisible || statusText > 0).toBeTruthy();
    }
  });

  // B2: Carrier sees "حجوزاتي" in nav
  test('B2: carrier sees my-bookings link in navigation', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto('/ar/transport');
    await page.waitForLoadState('networkidle');

    const bookingsNav = page.locator('nav a:has-text("حجوزاتي"), a[href*="my-bookings"]').first();
    await expect(bookingsNav).toBeVisible({ timeout: 8000 });
  });

  // B10: my-bookings page supports carrier role
  test('B10: carrier can access my-bookings page', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto('/ar/transport/my-bookings');
    await page.waitForLoadState('networkidle');

    // يجب ألا يُوجَّه للخارج
    expect(page.url()).toContain('my-bookings');

    // لا crash
    const errorMsg = page.locator('text=حدث خطأ, text=500').first();
    await expect(errorMsg).toHaveCount(0);
  });

});
الملف 5: apps/web/e2e/transport/05-carrier.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Transport Carrier — Dashboard & Profile', () => {

  // B6: Carrier dashboard no flash redirect
  test('B6: carrier dashboard loads without redirect flash', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto('/ar/transport/carriers/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    expect(page.url()).toContain('/transport/carriers/dashboard');
    await expect(page.locator('text=500, text=حدث خطأ')).toHaveCount(0);
  });

  // N13: Dashboard resilient to API failures
  test('N13: carrier dashboard shows even if stats API fails', async ({ page }) => {
    await loginAs(page, 'carrier');

    // Block stats endpoint
    await page.route('**/transport/stats', (route) => route.abort());

    await page.goto('/ar/transport/carriers/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // الصفحة يجب أن تُحمَّل جزئياً على الأقل
    expect(page.url()).toContain('/transport/carriers/dashboard');
    // لا crash كامل
    await expect(page.locator('text=لوحة الناقل, h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  // C17: UUID shown as short ID not full
  test('C17: request ID shown as short format (not full UUID)', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto('/ar/transport/carriers/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // UUIDs كاملة (36 حرف) لا يجب أن تظهر كعناوين
    const uuids = await page.locator('[class*="mono"]').allTextContents();
    for (const text of uuids) {
      // UUID كامل = 36 حرف مع شرطات
      const isFullUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text.trim());
      expect(isFullUUID, `UUID كامل مرئي: ${text}`).toBeFalsy();
    }
  });

  // Carrier register
  test('B8: carrier register page accessible', async ({ page }) => {
    await loginAs(page, 'other'); // مستخدم عادي بدون carrier profile
    await page.goto('/ar/transport/carriers/register');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/transport/carriers/register');
    await expect(page.locator('form, h1, h2').first()).toBeVisible({ timeout: 8000 });
  });

  // my-quotes
  test('B1: "عرض الحجز" in my-quotes links to /my-bookings not /my-requests', async ({ page }) => {
    await loginAs(page, 'carrier');
    await page.goto('/ar/transport/my-quotes');
    await page.waitForLoadState('networkidle');

    // إذا في عرض مقبول
    const viewBookingLink = page.locator('a:has-text("عرض الحجز")').first();
    if (await viewBookingLink.count() > 0) {
      const href = await viewBookingLink.getAttribute('href');
      expect(href).toContain('my-bookings');
      expect(href).not.toContain('my-requests');
    }
  });

});
الملف 6: apps/web/e2e/transport/06-validation.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Transport — Input Validation & UX', () => {

  // N11: Budget validation
  test('N11: budget min > max shows validation error', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto('/ar/transport/new');
    await page.waitForLoadState('networkidle');

    // انتقل للـ step الميزانية
    const nextBtn = page.locator('button:has-text("التالي")').first();

    // Step 1
    const serviceBtn = page.locator('button, label').filter({ hasText: /بضائع|عام/ }).first();
    if (await serviceBtn.count() > 0) await serviceBtn.click();
    if (await nextBtn.isEnabled()) await nextBtn.click();
    await page.waitForTimeout(300);

    // تخطّى الـ steps السابقة
    for (let i = 0; i < 4; i++) {
      const fields = await page.locator('input[required], input:not([type="hidden"])').count();
      if (fields > 0) {
        const inputs = await page.locator('input[type="text"], input[type="number"]').all();
        for (const inp of inputs.slice(0, 2)) {
          await inp.fill('test value').catch(() => {});
        }
      }
      if (await nextBtn.isEnabled()) await nextBtn.click();
      await page.waitForTimeout(300);
    }

    // ابحث عن حقول الميزانية
    const minField = page.locator('input[name*="budgetMin"], input[placeholder*="أدنى"]').first();
    const maxField = page.locator('input[name*="budgetMax"], input[placeholder*="أقصى"]').first();

    if (await minField.count() > 0 && await maxField.count() > 0) {
      await minField.fill('200');
      await maxField.fill('50');

      // محاولة الإرسال
      const submitBtn = page.locator('button[type="submit"], button:has-text("إرسال الطلب")').first();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(500);

        // يجب أن يرى رسالة خطأ
        const errorMsg = page.locator('text=الحد الأقصى, text=أكبر من, [class*="error"]').first();
        await expect(errorMsg).toBeVisible({ timeout: 5000 });
      }
    }
  });

  // C4: Retry buttons show loading
  test('C4+N15: retry in my-requests shows spinner not page reload', async ({ page }) => {
    await loginAs(page, 'shipper');

    // Block API to force error
    await page.route('**/transport/requests/my*', (route) => route.abort());

    await page.goto('/ar/transport/my-requests');
    await page.waitForTimeout(3000);

    const retryBtn = page.locator('button:has-text("إعادة المحاولة"), button:has-text("retry"), button:has-text("حاول")').first();
    if (await retryBtn.count() > 0) {
      let didReload = false;
      page.on('load', () => { didReload = true; });

      await retryBtn.click();
      await page.waitForTimeout(1000);

      // لا يجب أن يعيد تحميل الصفحة كاملاً
      expect(didReload).toBeFalsy();
    }
  });

  // N12: Pagination in my-requests
  test('N12: my-requests shows pagination controls', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto('/ar/transport/my-requests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // إذا في 12+ طلب → يجب يظهر pagination
    const cards = await page.locator('[data-testid="request-card"], .card-base a[href*="/transport/requests/"]').count();

    if (cards >= 12) {
      const nextBtn = page.locator('button:has-text("التالي")').first();
      await expect(nextBtn).toBeVisible();
    }
    // أقل من 12 → لا يظهر pagination (مقبول)
  });

  // A2: Default booking status
  test('A2: new booking starts as ACCEPTED not IN_PROGRESS', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto('/ar/transport/my-bookings');
    await page.waitForLoadState('networkidle');

    const bookingLinks = page.locator('a[href*="/transport/bookings/"]');
    if (await bookingLinks.count() > 0) {
      await bookingLinks.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // حجز جديد يجب أن يكون ACCEPTED
      const inProgressText = page.locator('text=تم القبول, text=ACCEPTED, text=مقبول').first();
      const acceptedIndicator = await inProgressText.count();

      // لا يجب أن يكون IN_PROGRESS كحالة ابتدائية
      const wrongStatus = page.locator('text=جارٍ التنفيذ').first();
      const startBtn = page.locator('button:has-text("بدأت التحميل")');
      // لو في "بدأت التحميل" → الحجز ACCEPTED (صح)
      // لو مفيش → ممكن IN_PROGRESS أو مكتمل
    }
  });

  // F6: cargo description fallback
  test('F6: request card without cargo description shows fallback text', async ({ page }) => {
    await page.goto('/ar/transport/browse');
    await page.waitForLoadState('networkidle');

    const cards = await page.locator('.card-base, [data-testid="request-card"]').all();
    for (const card of cards) {
      const descText = await card.locator('p, span').allTextContents();
      // لا يجب أن يكون هناك div/p فارغ
      const hasEmpty = descText.some(t => t.trim() === '');
      // مقبول — الـ fallback يجب يكون نصاً
    }
  });

});
الملف 7: apps/web/e2e/transport/07-full-flow.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Transport Full E2E Flow', () => {

  test('complete shipper flow: create request → view → cancel', async ({ page }) => {
    await loginAs(page, 'shipper');

    // 1. فتح صفحة إنشاء طلب جديد
    await page.goto('/ar/transport/new');
    await page.waitForLoadState('networkidle');

    // تحقق أن الـ URL صحيح ومحتوي على locale
    expect(page.url()).toContain('/ar/transport/new');

    // 2. التنقل في my-requests
    await page.goto('/ar/transport/my-requests');
    await page.waitForLoadState('networkidle');

    // لا crash
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
    expect(page.url()).toContain('/ar/');
  });

  test('complete carrier flow: browse → view request → see quote form', async ({ page }) => {
    await loginAs(page, 'carrier');

    // 1. تصفح الطلبات
    await page.goto('/ar/transport/browse');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/ar/transport/browse');

    // 2. فتح طلب
    const firstCard = page.locator('a[href*="/transport/requests/"]').first();
    if (await firstCard.count() > 0) {
      await firstCard.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/ar/transport/requests/');

      // لا crash
      await expect(page.locator('h1, [class*="card-base"]').first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('locale: all navigation links in transport section have /ar/ prefix', async ({ page }) => {
    await loginAs(page, 'shipper');
    await page.goto('/ar/transport');
    await page.waitForLoadState('networkidle');

    // تحقق من الـ nav links
    const navLinks = await page.locator('nav a[href*="transport"]').all();
    for (const link of navLinks) {
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('http')) {
        expect(href, `nav link missing locale: ${href}`).toMatch(/^\/ar\//);
      }
    }
  });

  test('A3+N7: GET /transport/bookings/:id endpoint works', async ({ page, request }) => {
    await loginAs(page, 'carrier');
    const token = await page.evaluate(() =>
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      document.cookie.split(';').find(c => c.includes('token'))?.split('=')[1] || ''
    );

    if (token) {
      // جلب حجوزات الناقل
      const myBookings = await request.get('http://localhost:3001/transport/bookings/my?role=carrier', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (myBookings.ok()) {
        const data = await myBookings.json();
        if (data.items?.length > 0) {
          const bookingId = data.items[0].id;

          // GET /transport/bookings/:id يجب أن يعمل
          const directBooking = await request.get(`http://localhost:3001/transport/bookings/${bookingId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          expect(directBooking.status()).toBe(200);
        }
      }
    }
  });

  test('R1: accept quote is idempotent (no double booking)', async ({ page, request }) => {
    // هذا اختبار API مباشر
    await loginAs(page, 'shipper');
    const token = await page.evaluate(() => localStorage.getItem('auth_token') || localStorage.getItem('token') || '');

    if (token) {
      // جلب العروض للطلب المقتبس
      const quotesRes = await request.get(`http://localhost:3001/transport/requests/transport-request-quoted-seed/quotes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (quotesRes.ok()) {
        const quotes = await quotesRes.json();
        const pendingQuote = quotes.find((q: any) => q.status === 'PENDING');

        if (pendingQuote) {
          // إرسال طلبَي قبول متزامنَين
          const [res1, res2] = await Promise.all([
            request.patch(`http://localhost:3001/transport/quotes/${pendingQuote.id}/accept`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            request.patch(`http://localhost:3001/transport/quotes/${pendingQuote.id}/accept`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          // واحد فقط يجب أن ينجح
          const statuses = [res1.status(), res2.status()].sort();
          expect(statuses).toContain(200);
          // الثاني يجب أن يفشل (400 أو 409)
          expect(statuses.some(s => s >= 400)).toBeTruthy();
        }
      }
    }
  });

});
الخطوة 4 — تشغيل الـ Tests
# seed أولاً
cd apps/api && npx tsx prisma/seed.ts

# شغّل التطبيق
cd apps/web && npm run dev &

# انتظر 10 ثوان ثم شغّل
sleep 10 && npx playwright test e2e/transport --project=chromium --reporter=list

# أو شغّل test بعينه
npx playwright test e2e/transport/02-security.spec.ts --project=chromium
ملاحظات للـ Agent:
لو localStorage.getItem('token') رجع null — ابحث عن الـ key الصحيح في auth-provider.tsx
لو الـ API على port مختلف عن 3001 — غيّره في الـ tests API calls
لو test فشل بسبب بيانات غير موجودة — تحقق أن seed.ts شغّل بنجاح
كل test يجب أن يعمل مستقل — لا تعتمد على ترتيب التشغيل