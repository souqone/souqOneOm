# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: transport\04-bookings.spec.ts >> Bookings — isCarrier booking-specific (N6) >> N6: Page loads booking details without full list scan (direct endpoint)
- Location: e2e\transport\04-bookings.spec.ts:7:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /قبول|Accept/i }).first()
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByRole('button', { name: /قبول|Accept/i }).first()

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
              - generic [ref=e60]: مقبول
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
              - img [ref=e139]
              - heading "تم قبول العرض" [level=2] [ref=e142]
            - link "عرض تفاصيل الحجز" [ref=e143] [cursor=pointer]:
              - /url: /ar/transport/bookings/cmpq5d4ke00d5mn0pdv1ayx6m
              - img [ref=e144]
              - text: عرض تفاصيل الحجز
          - generic [ref=e148]:
            - generic [ref=e149]:
              - heading "العروض المقدمة" [level=2] [ref=e150]
              - generic [ref=e151]: 1 عرض
            - generic [ref=e153]:
              - generic [ref=e154]:
                - generic [ref=e155]:
                  - img [ref=e157]
                  - generic [ref=e162]:
                    - link "شركة النقل التجريبية" [ref=e163] [cursor=pointer]:
                      - /url: /ar/transport/carriers/cmpq1k4mo0004razgy156ctae
                    - generic [ref=e164]:
                      - generic [ref=e165]:
                        - img [ref=e166]
                        - text: موثّق
                      - generic [ref=e168]: 0 رحلة
                - generic [ref=e169]: مقبول
              - generic [ref=e170]:
                - generic [ref=e171]:
                  - img [ref=e172]
                  - generic [ref=e175]: 60 ر.ع.
                  - generic [ref=e176]:
                    - img [ref=e177]
                    - text: 3 ساعة
                - generic [ref=e180]: منذ 1 ساعة
              - button "عرض رسالة الناقل" [ref=e182]:
                - img [ref=e183]
                - text: عرض رسالة الناقل
        - generic [ref=e186]:
          - heading "معلومات الطلب" [level=2] [ref=e187]
          - generic [ref=e188]:
            - img [ref=e189]
            - generic [ref=e191]: نُشر منذ 1 ساعة
          - generic [ref=e192]:
            - img [ref=e193]
            - generic [ref=e195]: 1 عرض مقدم
    - contentinfo [ref=e196]:
      - generic [ref=e197]:
        - generic [ref=e198]:
          - generic [ref=e199]:
            - link "سوق وان" [ref=e200] [cursor=pointer]:
              - /url: /ar
              - img "سوق وان" [ref=e201]
            - paragraph [ref=e202]: المنصة الأولى في سلطنة عمان لبيع وشراء السيارات بكل ثقة وأمان.
            - generic [ref=e203]:
              - link "YouTube" [ref=e204] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e205]: smart_display
              - link "Instagram" [ref=e206] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e207]: photo_camera
              - link "Facebook" [ref=e208] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e209]: public
          - generic [ref=e210]:
            - heading "روابط سريعة" [level=4] [ref=e211]
            - list [ref=e212]:
              - listitem [ref=e213]:
                - link "الرئيسية" [ref=e214] [cursor=pointer]:
                  - /url: /ar
              - listitem [ref=e215]:
                - link "السيارات" [ref=e216] [cursor=pointer]:
                  - /url: /ar/cars
              - listitem [ref=e217]:
                - link "الحافلات" [ref=e218] [cursor=pointer]:
                  - /url: /ar/buses
              - listitem [ref=e219]:
                - link "المعدات" [ref=e220] [cursor=pointer]:
                  - /url: /ar/equipment
              - listitem [ref=e221]:
                - link "الوظائف" [ref=e222] [cursor=pointer]:
                  - /url: /ar/jobs
              - listitem [ref=e223]:
                - link "النقل" [ref=e224] [cursor=pointer]:
                  - /url: /ar/transport/browse
          - generic [ref=e225]:
            - heading "خدمات" [level=4] [ref=e226]
            - list [ref=e227]:
              - listitem [ref=e228]:
                - link "خدمات سيارات" [ref=e229] [cursor=pointer]:
                  - /url: /ar/browse/services
              - listitem [ref=e230]:
                - link "أضف إعلان" [ref=e231] [cursor=pointer]:
                  - /url: /ar/add-listing
          - generic [ref=e232]:
            - heading "تواصل معنا" [level=4] [ref=e233]
            - list [ref=e234]:
              - listitem [ref=e235]:
                - generic [ref=e236]: location_on
                - generic [ref=e237]: سلطنة عمان، مسقط، الغبرة الشمالية
              - listitem [ref=e238]:
                - generic [ref=e239]: call
                - generic [ref=e240]: +968 9999 0000
              - listitem [ref=e241]:
                - generic [ref=e242]: mail
                - generic [ref=e243]: info@souqone.com
        - generic [ref=e244]:
          - paragraph [ref=e245]: © 2026 سوق وان. جميع الحقوق محفوظة.
          - img "سوق وان" [ref=e246]
  - alert [ref=e247]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAs, SEED_IDS } from './helpers';
  3  | 
  4  | const BASE = process.env.BASE_URL || 'http://localhost:3000';
  5  | 
  6  | test.describe('Bookings — isCarrier booking-specific (N6)', () => {
  7  |   test('N6: Page loads booking details without full list scan (direct endpoint)', async ({ page }) => {
  8  |     await loginAs(page, 'shipper');
  9  | 
  10 |     // First, accept quote to create a booking (requires quoted request with pending quote)
  11 |     await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.quotedRequest}`);
  12 |     await page.waitForLoadState('networkidle');
  13 | 
  14 |     // Try accepting the quote if not already accepted
  15 |     const acceptBtn = page.getByRole('button', { name: /قبول|Accept/i }).first();
> 16 |     await expect(acceptBtn).toBeVisible({ timeout: 20000 });
     |                             ^ Error: expect(locator).toBeVisible() failed
  17 |     await acceptBtn.click();
  18 |     
  19 |     // Should be on booking page now
  20 |     await page.waitForURL(/\/transport\/bookings\//, { timeout: 30000 });
  21 |     const bookingId = page.url().split('/bookings/')[1].split('?')[0];
  22 | 
  23 |     // Test: non-shipper carrier opening this booking sees correct buttons
  24 |     await loginAs(page, 'carrier');
  25 |     await page.goto(`${BASE}/ar/transport/bookings/${bookingId}`);
  26 |     await page.waitForLoadState('networkidle');
  27 | 
  28 |     // Carrier should see "بدأت التحميل" not "استلمت"
  29 |     const startBtn = page.getByRole('button', { name: /بدأت التحميل|بدء/i });
  30 |     const completeBtn = page.getByRole('button', { name: /استلمت|اكتمل|Complete/i });
  31 | 
  32 |     // Carrier should have start, shipper should have complete
  33 |     await expect(startBtn).toBeVisible({ timeout: 15000 });
  34 |     await expect(completeBtn).toHaveCount(0);
  35 |   });
  36 | });
  37 | 
  38 | test.describe('Bookings — Carrier Navigation (B2 + B10)', () => {
  39 |   test('B2: Carrier sees "حجوزاتي" in navigation', async ({ page }) => {
  40 |     await loginAs(page, 'carrier');
  41 |     await page.goto(`${BASE}/ar/transport`);
  42 |     await page.waitForLoadState('networkidle');
  43 | 
  44 |     const myBookingsLink = page.getByRole('link', { name: /حجوزاتي|My Bookings/i });
  45 |     await expect(myBookingsLink).toBeVisible({ timeout: 30000 });
  46 |   });
  47 | 
  48 |   test('B10: my-bookings page works for carrier (shows carrier bookings)', async ({ page }) => {
  49 |     await loginAs(page, 'carrier');
  50 |     await page.goto(`${BASE}/ar/transport/my-bookings`);
  51 |     await page.waitForLoadState('networkidle');
  52 | 
  53 |     // Should not show error — should show either bookings or empty state
  54 |     // Should not show error — should show either bookings or empty state
  55 |     const errorMsg = page.getByText(/خطأ|error|فشل/i);
  56 |     await expect(errorMsg).toHaveCount(0);
  57 | 
  58 |     // Page should be accessible
  59 |     expect(page.url()).not.toMatch(/\/login/);
  60 |   });
  61 | });
  62 | 
  63 | test.describe('Bookings — Cancel Guard (N14)', () => {
  64 |   test('N14: Anonymous user cannot see cancel booking button', async ({ page }) => {
  65 |     // Try to access a booking page without auth
  66 |     await page.goto(`${BASE}/ar/transport/bookings/any-id`);
  67 |     await page.waitForLoadState('networkidle');
  68 | 
  69 |     // Either redirected to login, or error page — no cancel button
  70 |     const cancelBtn = page.getByRole('button', { name: /إلغاء الحجز|Cancel Booking/i });
  71 |     await expect(cancelBtn).toHaveCount(0);
  72 |   });
  73 | });
  74 | 
```