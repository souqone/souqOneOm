# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: transport\03-request-flow.spec.ts >> Request Flow — hasAlreadyQuoted (N5) >> N5: Carrier who already quoted sees "already quoted" message, not the form
- Location: e2e\transport\03-request-flow.spec.ts:40:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/قدّمت عرضاً|سبق تقديم|عرض موجود/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/قدّمت عرضاً|سبق تقديم|عرض موجود/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e7]:
      - generic [ref=e8]:
        - link "سوق وان" [ref=e9] [cursor=pointer]:
          - /url: /ar
          - img "سوق وان" [ref=e10]
        - button "Switch to dark mode" [ref=e11]:
          - generic [ref=e12]: dark_mode
      - navigation [ref=e14]:
        - link "الرئيسية" [ref=e16] [cursor=pointer]:
          - /url: /ar
          - text: الرئيسية
        - link "سيارات" [ref=e18] [cursor=pointer]:
          - /url: /ar/cars
          - text: سيارات
        - link "حافلات" [ref=e20] [cursor=pointer]:
          - /url: /ar/buses
          - text: حافلات
        - link "معدات" [ref=e22] [cursor=pointer]:
          - /url: /ar/equipment
          - text: معدات
        - link "طلبات نقل" [ref=e24] [cursor=pointer]:
          - /url: /ar/transport
          - text: طلبات نقل
        - link "وظائف" [ref=e26] [cursor=pointer]:
          - /url: /ar/jobs
          - text: وظائف
      - generic [ref=e27]:
        - link "favorite" [ref=e28] [cursor=pointer]:
          - /url: /ar/favorites
          - generic [ref=e29]: favorite
        - link "chat" [ref=e31] [cursor=pointer]:
          - /url: /ar/messages
          - generic [ref=e32]: chat
        - button "notifications" [ref=e34]:
          - generic [ref=e35]: notifications
        - button "T expand_more" [ref=e37]:
          - generic [ref=e38]: T
          - generic [ref=e39]: expand_more
    - generic [ref=e42]:
      - link "العودة للتصفح" [ref=e44] [cursor=pointer]:
        - /url: /ar/transport/browse
        - img [ref=e45]
        - text: العودة للتصفح
      - generic [ref=e47]:
        - generic [ref=e48]:
          - generic [ref=e49]:
            - generic [ref=e50]:
              - generic [ref=e51]:
                - img [ref=e53]
                - generic [ref=e57]:
                  - heading "بضائع عامة" [level=1] [ref=e58]
                  - paragraph [ref=e59]: "#seed-tr-"
              - generic [ref=e60]: وصلت عروض
            - generic [ref=e67]:
              - generic [ref=e68]:
                - paragraph [ref=e69]: نقطة الانطلاق
                - paragraph [ref=e70]:
                  - img [ref=e71]
                  - text: مسقط — الرحاب
                - paragraph [ref=e74]: طريق السلطان قابوس
              - generic [ref=e75]:
                - paragraph [ref=e76]: الوجهة
                - paragraph [ref=e77]:
                  - img [ref=e78]
                  - text: مسقط — العذيبة
                - paragraph [ref=e81]: المنطقة الصناعية
          - generic [ref=e82]:
            - heading "الخريطة" [level=2] [ref=e83]
            - generic [ref=e84]:
              - generic [ref=e86]:
                - generic:
                  - generic:
                    - img
                  - generic:
                    - button [ref=e87] [cursor=pointer]:
                      - img [ref=e88]
                    - button [ref=e91] [cursor=pointer]:
                      - img [ref=e92]
                - generic:
                  - generic [ref=e95]:
                    - button "Zoom in" [disabled] [ref=e96]:
                      - generic [ref=e97]: +
                    - button "Zoom out" [ref=e98] [cursor=pointer]:
                      - generic [ref=e99]: −
                  - generic [ref=e100]:
                    - link "Leaflet" [ref=e101] [cursor=pointer]:
                      - /url: https://leafletjs.com
                      - img [ref=e102]
                      - text: Leaflet
                    - text: "| © OpenStreetMap contributors"
              - link "فتح الاتجاهات في خرائط Google" [ref=e106] [cursor=pointer]:
                - /url: https://www.google.com/maps/dir/?api=1&origin=%D8%B7%D8%B1%D9%8A%D9%82%20%D8%A7%D9%84%D8%B3%D9%84%D8%B7%D8%A7%D9%86%20%D9%82%D8%A7%D8%A8%D9%88%D8%B3%2C%20%D8%A7%D9%84%D8%B1%D8%AD%D8%A7%D8%A8%2C%20%D9%85%D8%B3%D9%82%D8%B7&destination=%D8%A7%D9%84%D9%85%D9%86%D8%B7%D9%82%D8%A9%20%D8%A7%D9%84%D8%B5%D9%86%D8%A7%D8%B9%D9%8A%D8%A9%2C%20%D8%A7%D9%84%D8%B9%D8%B0%D9%8A%D8%A8%D8%A9%2C%20%D9%85%D8%B3%D9%82%D8%B7&travelmode=driving
                - img [ref=e107]
                - text: فتح الاتجاهات في خرائط Google
              - generic [ref=e109]:
                - generic [ref=e110]: مسقط — الرحاب
                - generic [ref=e112]: مسقط — العذيبة
          - generic [ref=e114]:
            - heading "تفاصيل البضاعة" [level=2] [ref=e115]
            - paragraph [ref=e116]: بضائع تجارية — طرود صغيرة
            - generic [ref=e118]:
              - img [ref=e119]
              - generic [ref=e123]:
                - text: "الوزن:"
                - generic [ref=e124]: 0.5 طن
          - generic [ref=e125]:
            - heading "الموعد والميزانية" [level=2] [ref=e126]
            - generic [ref=e127]:
              - generic [ref=e128]:
                - img [ref=e129]
                - generic [ref=e131]: في أقرب وقت
              - generic [ref=e132]:
                - img [ref=e133]
                - generic [ref=e136]: 30 – 80 ر.ع.
        - generic [ref=e137]:
          - generic [ref=e138]:
            - heading "معلومات الطلب" [level=2] [ref=e139]
            - generic [ref=e140]:
              - img [ref=e141]
              - generic [ref=e143]: نُشر منذ 1 ساعة
            - generic [ref=e144]:
              - img [ref=e145]
              - generic [ref=e147]: 1 عرض مقدم
          - generic [ref=e148]:
            - img [ref=e150]
            - generic [ref=e155]:
              - paragraph [ref=e156]: هل تريد تقديم عرض على هذا الطلب؟
              - paragraph [ref=e157]: سجّل كناقل مجاناً للتمكن من تقديم عروض الأسعار
            - link "سجّل كناقل الآن" [ref=e158] [cursor=pointer]:
              - /url: /ar/transport/carriers/register
    - contentinfo [ref=e159]:
      - generic [ref=e160]:
        - generic [ref=e161]:
          - generic [ref=e162]:
            - link "سوق وان" [ref=e163] [cursor=pointer]:
              - /url: /ar
              - img "سوق وان" [ref=e164]
            - paragraph [ref=e165]: المنصة الأولى في سلطنة عمان لبيع وشراء السيارات بكل ثقة وأمان.
            - generic [ref=e166]:
              - link "YouTube" [ref=e167] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e168]: smart_display
              - link "Instagram" [ref=e169] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e170]: photo_camera
              - link "Facebook" [ref=e171] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e172]: public
          - generic [ref=e173]:
            - heading "روابط سريعة" [level=4] [ref=e174]
            - list [ref=e175]:
              - listitem [ref=e176]:
                - link "الرئيسية" [ref=e177] [cursor=pointer]:
                  - /url: /ar
              - listitem [ref=e178]:
                - link "السيارات" [ref=e179] [cursor=pointer]:
                  - /url: /ar/cars
              - listitem [ref=e180]:
                - link "الحافلات" [ref=e181] [cursor=pointer]:
                  - /url: /ar/buses
              - listitem [ref=e182]:
                - link "المعدات" [ref=e183] [cursor=pointer]:
                  - /url: /ar/equipment
              - listitem [ref=e184]:
                - link "الوظائف" [ref=e185] [cursor=pointer]:
                  - /url: /ar/jobs
              - listitem [ref=e186]:
                - link "النقل" [ref=e187] [cursor=pointer]:
                  - /url: /ar/transport/browse
          - generic [ref=e188]:
            - heading "خدمات" [level=4] [ref=e189]
            - list [ref=e190]:
              - listitem [ref=e191]:
                - link "خدمات سيارات" [ref=e192] [cursor=pointer]:
                  - /url: /ar/browse/services
              - listitem [ref=e193]:
                - link "أضف إعلان" [ref=e194] [cursor=pointer]:
                  - /url: /ar/add-listing
          - generic [ref=e195]:
            - heading "تواصل معنا" [level=4] [ref=e196]
            - list [ref=e197]:
              - listitem [ref=e198]:
                - generic [ref=e199]: location_on
                - generic [ref=e200]: سلطنة عمان، مسقط، الغبرة الشمالية
              - listitem [ref=e201]:
                - generic [ref=e202]: call
                - generic [ref=e203]: +968 9999 0000
              - listitem [ref=e204]:
                - generic [ref=e205]: mail
                - generic [ref=e206]: info@souqone.com
        - generic [ref=e207]:
          - paragraph [ref=e208]: © 2026 سوق وان. جميع الحقوق محفوظة.
          - img "سوق وان" [ref=e209]
  - alert [ref=e210]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { loginAs, SEED_IDS } from './helpers';
  3   | 
  4   | const BASE = process.env.BASE_URL || 'http://localhost:3000';
  5   | 
  6   | test.describe('Request Flow — Shipper Sees Quotes (N4)', () => {
  7   |   test('N4: Shipper sees quotes section on their QUOTED request', async ({ page }) => {
  8   |     await loginAs(page, 'shipper');
  9   |     await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.quotedRequest}`);
  10  |     await page.waitForLoadState('networkidle');
  11  | 
  12  |     // Quotes section must be visible for owner
  13  |     const quotesSection = page
  14  |       .getByText(/العروض|الأسعار المقدمة|عروض الناقلين/i)
  15  |       .first();
  16  |     await expect(quotesSection).toBeVisible({ timeout: 30000 });
  17  |   });
  18  | 
  19  |   test('N4: Shipper sees the pending quote amount', async ({ page }) => {
  20  |     await loginAs(page, 'shipper');
  21  |     await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.quotedRequest}`);
  22  |     await page.waitForLoadState('networkidle');
  23  | 
  24  |     // The seed quote has price=60 — should appear somewhere
  25  |     const priceText = page.getByText(/60/);
  26  |     await expect(priceText).toBeVisible({ timeout: 30000 });
  27  |   });
  28  | 
  29  |   test('N4: Shipper can accept the quote', async ({ page }) => {
  30  |     await loginAs(page, 'shipper');
  31  |     await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.quotedRequest}`);
  32  |     await page.waitForLoadState('networkidle');
  33  | 
  34  |     const acceptBtn = page.getByRole('button', { name: /قبول|Accept/i }).first();
  35  |     await expect(acceptBtn).toBeVisible({ timeout: 30000 });
  36  |   });
  37  | });
  38  | 
  39  | test.describe('Request Flow — hasAlreadyQuoted (N5)', () => {
  40  |   test('N5: Carrier who already quoted sees "already quoted" message, not the form', async ({ page }) => {
  41  |     await loginAs(page, 'carrier');
  42  |     await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.quotedRequest}`);
  43  |     await page.waitForLoadState('networkidle');
  44  | 
  45  |     // Carrier already has seed-tq-pending-001 on this request
  46  |     // Should see a message saying they already submitted, NOT the quote form
  47  |     const alreadyQuotedMsg = page.getByText(/قدّمت عرضاً|سبق تقديم|عرض موجود/i);
  48  |     const submitForm = page.locator('form').filter({ has: page.locator('input[name="price"]') });
  49  | 
  50  |     await expect(submitForm).not.toBeVisible({ timeout: 5000 });
> 51  |     await expect(alreadyQuotedMsg).toBeVisible({ timeout: 10000 });
      |                                    ^ Error: expect(locator).toBeVisible() failed
  52  |   });
  53  | });
  54  | 
  55  | test.describe('Request Flow — Cancel Request Button (N8)', () => {
  56  |   test('N8: Shipper sees cancel button on their OPEN request', async ({ page }) => {
  57  |     await loginAs(page, 'shipper');
  58  |     await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}`);
  59  |     await page.waitForLoadState('networkidle');
  60  | 
  61  |     const cancelBtn = page.getByRole('button', { name: /إلغاء الطلب|Cancel/i });
  62  |     await expect(cancelBtn).toBeVisible({ timeout: 30000 });
  63  |   });
  64  | 
  65  |   test('N8: Non-owner does NOT see cancel button', async ({ page }) => {
  66  |     await loginAs(page, 'other');
  67  |     await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}`);
  68  |     await page.waitForLoadState('networkidle');
  69  | 
  70  |     const cancelBtn = page.getByRole('button', { name: /إلغاء الطلب/i });
  71  |     await expect(cancelBtn).toHaveCount(0);
  72  |   });
  73  | });
  74  | 
  75  | test.describe('Request Flow — Carrier No Profile (N16)', () => {
  76  |   test('N16: User with CARRIER role but no profile sees registration banner, not quote form', async ({ page }) => {
  77  |     await loginAs(page, 'carrierNoProfile');
  78  |     await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}`);
  79  |     await page.waitForLoadState('networkidle');
  80  | 
  81  |     // Carrier WITHOUT profile should see banner, NOT the quote form
  82  |     const quoteSection = page.locator('form, [data-testid="quote-form"], input[name="price"]').first();
  83  |     const regBanner = page.getByText(/سجّل كناقل|إنشاء ملف ناقل/i);
  84  | 
  85  |     const hasForm = await quoteSection.isVisible({ timeout: 5000 }).catch(() => false);
  86  |     const hasBanner = await regBanner.isVisible({ timeout: 10000 }).catch(() => false);
  87  | 
  88  |     expect(hasForm).toBeFalsy();
  89  |     expect(hasBanner).toBeTruthy();
  90  |   });
  91  | });
  92  | 
  93  | test.describe('Wizard Validation (A7 + C1)', () => {
  94  |   test('A7+C1: Wizard Step 4 — "scheduled" without date shows error', async ({ page }) => {
  95  |     await loginAs(page, 'shipper');
  96  |     await page.goto(`${BASE}/ar/transport/new`);
  97  |     await page.waitForLoadState('networkidle');
  98  | 
  99  |     // Step 1 — select service type
  100 |     const goodsBtn = page.getByRole('button', { name: /بضائع|GOODS/i }).first();
  101 |     if (await goodsBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
  102 |       await goodsBtn.click();
  103 |     }
  104 |     const nextBtn = page.getByRole('button', { name: /التالي|Next/i });
  105 |     await nextBtn.click();
  106 | 
  107 |     // Step 2 — fill from/to (minimal)
  108 |     await page.waitForLoadState('networkidle');
  109 |     const fromInput = page.locator('input[name="fromGovernorate"], input[placeholder*="من"]').first();
  110 |     if (await fromInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  111 |       await fromInput.fill('مسقط');
  112 |     }
  113 |     const toInput = page.locator('input[name="toGovernorate"], input[placeholder*="إلى"]').first();
  114 |     if (await toInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  115 |       await toInput.fill('صلالة');
  116 |     }
  117 |     const fromAddr = page.locator('input[name="fromAddress"]').first();
  118 |     if (await fromAddr.isVisible({ timeout: 3000 }).catch(() => false)) {
  119 |       await fromAddr.fill('شارع الرئيسي');
  120 |     }
  121 |     const toAddr = page.locator('input[name="toAddress"]').first();
  122 |     if (await toAddr.isVisible({ timeout: 3000 }).catch(() => false)) {
  123 |       await toAddr.fill('شارع صلالة');
  124 |     }
  125 |     await nextBtn.click();
  126 | 
  127 |     // Step 3 — cargo description
  128 |     await page.waitForLoadState('networkidle');
  129 |     const cargoInput = page.locator('textarea, input[name="cargoDescription"]').first();
  130 |     if (await cargoInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  131 |       await cargoInput.fill('بضائع تجريبية');
  132 |     }
  133 |     await nextBtn.click();
  134 | 
  135 |     // Step 4 — select "scheduled" without choosing a date
  136 |     await page.waitForLoadState('networkidle');
  137 |     const scheduledOption = page.getByRole('button', { name: /موعد محدد|scheduled/i }).or(
  138 |       page.locator('input[value="scheduled"]')
  139 |     ).first();
  140 |     if (await scheduledOption.isVisible({ timeout: 5000 }).catch(() => false)) {
  141 |       await scheduledOption.click();
  142 |     }
  143 | 
  144 |     // Try to go next WITHOUT choosing date
  145 |     await nextBtn.click();
  146 | 
  147 |     // Should show validation error — either toast or inline message
  148 |     const errorMsg = page.getByText(/يرجى تحديد الموعد|الموعد مطلوب|حقل إلزامي/i);
  149 |     const toastError = page.locator('[class*="toast"], [role="alert"]').filter({ hasText: /مطلوب|إكمال|يرجى/i });
  150 | 
  151 |     const hasInlineError = await errorMsg.isVisible({ timeout: 10000 }).catch(() => false);
```