# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: transport\01-browse.spec.ts >> Browse — Filter URL Persistence (F1-F5) >> F3: Pagination keeps filters in URL
- Location: e2e\transport\01-browse.spec.ts:70:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /التالي|next|2/i }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('button', { name: /التالي|next|2/i }).first()

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
        - generic [ref=e31]:
          - button "person تسجيل الدخول" [ref=e32]:
            - generic [ref=e33]: person
            - text: تسجيل الدخول
          - button "إنشاء حساب" [ref=e34] [cursor=pointer]
    - main [ref=e37]:
      - generic [ref=e39]:
        - generic [ref=e40]:
          - heading "تصفّح طلبات النقل" [level=1] [ref=e41]
          - paragraph [ref=e42]: ابحث عن طلبات النقل المناسبة وقدّم عروضك
        - generic [ref=e43]:
          - generic [ref=e44]:
            - img [ref=e46]
            - generic [ref=e51]:
              - paragraph [ref=e52]: ناقل؟ سجّل وابدأ تقديم عروض على الطلبات
              - paragraph [ref=e53]: انضم لشبكة ناقلي SouqOne وحقق دخلاً إضافياً
          - link "سجّل كناقل" [ref=e54] [cursor=pointer]:
            - /url: /ar/transport/carriers/register
        - generic [ref=e55]:
          - generic [ref=e56]:
            - text: بضائع عامة
            - button "إزالة الفلتر" [ref=e57]:
              - img [ref=e58]
          - button "مسح الكل" [ref=e61]
        - generic [ref=e62]:
          - complementary [ref=e64]:
            - generic [ref=e65]:
              - generic [ref=e66]:
                - generic [ref=e67]:
                  - img [ref=e68]
                  - generic [ref=e69]: التصفية
                - button "مسح الكل" [ref=e70]:
                  - img [ref=e71]
                  - text: مسح الكل
              - generic [ref=e74]:
                - generic [ref=e75]:
                  - paragraph [ref=e76]: نوع الخدمة
                  - generic [ref=e77]:
                    - button "بضائع عامة" [ref=e78]
                    - button "أثاث ومنزليات" [ref=e79]
                    - button "مواد البناء" [ref=e80]
                    - button "شحن ثقيل" [ref=e81]
                    - button "عودة فارغة" [ref=e82]
                    - button "معدات وآليات" [ref=e83]
                - generic [ref=e84]:
                  - paragraph [ref=e85]: الحالة
                  - generic [ref=e86]:
                    - button "مفتوح" [ref=e87]
                    - button "وصلت عروض" [ref=e88]
                    - button "جارٍ التنفيذ" [ref=e89]
                - generic [ref=e91]:
                  - generic [ref=e92]:
                    - generic [ref=e93]: من محافظة
                    - combobox [ref=e94]:
                      - option "الكل" [selected]
                      - option "مسقط"
                      - option "ظفار"
                      - option "مسندم"
                      - option "البريمي"
                      - option "الداخلية"
                      - option "شمال الباطنة"
                      - option "جنوب الباطنة"
                      - option "شمال الشرقية"
                      - option "جنوب الشرقية"
                      - option "الظاهرة"
                      - option "الوسطى"
                  - generic [ref=e95]:
                    - generic [ref=e96]: المدينة
                    - combobox [disabled] [ref=e97]:
                      - option "الكل" [selected]
                - generic [ref=e99]:
                  - generic [ref=e100]:
                    - generic [ref=e101]: إلى محافظة
                    - combobox [ref=e102]:
                      - option "الكل" [selected]
                      - option "مسقط"
                      - option "ظفار"
                      - option "مسندم"
                      - option "البريمي"
                      - option "الداخلية"
                      - option "شمال الباطنة"
                      - option "جنوب الباطنة"
                      - option "شمال الشرقية"
                      - option "جنوب الشرقية"
                      - option "الظاهرة"
                      - option "الوسطى"
                  - generic [ref=e103]:
                    - generic [ref=e104]: المدينة
                    - combobox [disabled] [ref=e105]:
                      - option "الكل" [selected]
                - generic [ref=e106]:
                  - paragraph [ref=e107]: الترتيب
                  - combobox [ref=e108]:
                    - option "افتراضي" [selected]
                    - option "الأحدث أولاً"
                    - option "الأقدم أولاً"
                    - option "الميزانية الأعلى"
                    - option "الميزانية الأدنى"
                    - option "أقرب موعد"
          - generic [ref=e110]:
            - paragraph [ref=e111]: عرض 1–4 من 4 طلب
            - generic [ref=e112]:
              - link "بضائع عامة منذ 1 ساعة مفتوح مسقط — الموالح صلالة — المدينة أثاث منزلي — صناديق متنوعة للتجربة 2.5 طن في أقرب وقت 35 50 – 150 ر.ع." [ref=e113] [cursor=pointer]:
                - /url: /ar/transport/requests/seed-tr-open-001
                - generic [ref=e114]:
                  - generic [ref=e115]:
                    - img [ref=e117]
                    - generic [ref=e121]:
                      - paragraph [ref=e122]: بضائع عامة
                      - paragraph [ref=e123]: منذ 1 ساعة
                  - generic [ref=e124]: مفتوح
                - generic [ref=e131]:
                  - generic [ref=e132]:
                    - img [ref=e133]
                    - generic [ref=e136]: مسقط — الموالح
                  - generic [ref=e137]:
                    - img [ref=e138]
                    - generic [ref=e141]: صلالة — المدينة
                - paragraph [ref=e143]: أثاث منزلي — صناديق متنوعة للتجربة
                - generic [ref=e144]:
                  - generic [ref=e145]:
                    - generic [ref=e146]:
                      - img [ref=e147]
                      - text: 2.5 طن
                    - generic [ref=e150]:
                      - img [ref=e151]
                      - text: في أقرب وقت
                    - generic [ref=e154]:
                      - img [ref=e155]
                      - text: "35"
                  - generic [ref=e158]:
                    - generic [ref=e159]: 50 – 150 ر.ع.
                    - img [ref=e160]
              - link "بضائع عامة أمس مفتوح مسقط — السيب مسقط — بوشر بضاعة تجارية متنوعة في أقرب وقت 10 60 – 80 ر.ع." [ref=e163] [cursor=pointer]:
                - /url: /ar/transport/requests/cmpop8b55001zkw0paa31uotj
                - generic [ref=e164]:
                  - generic [ref=e165]:
                    - img [ref=e167]
                    - generic [ref=e171]:
                      - paragraph [ref=e172]: بضائع عامة
                      - paragraph [ref=e173]: أمس
                  - generic [ref=e174]: مفتوح
                - generic [ref=e181]:
                  - generic [ref=e182]:
                    - img [ref=e183]
                    - generic [ref=e186]: مسقط — السيب
                  - generic [ref=e187]:
                    - img [ref=e188]
                    - generic [ref=e191]: مسقط — بوشر
                - paragraph [ref=e193]: بضاعة تجارية متنوعة
                - generic [ref=e194]:
                  - generic [ref=e195]:
                    - generic [ref=e196]:
                      - img [ref=e197]
                      - text: في أقرب وقت
                    - generic [ref=e200]:
                      - img [ref=e201]
                      - text: "10"
                  - generic [ref=e204]:
                    - generic [ref=e205]: 60 – 80 ر.ع.
                    - img [ref=e206]
              - link "بضائع عامة أمس مفتوح مسقط — السيب مسقط — بوشر بضاعة تجارية متنوعة في أقرب وقت 7 60 – 80 ر.ع." [ref=e209] [cursor=pointer]:
                - /url: /ar/transport/requests/cmpop83v1001tkw0pxz67ogl7
                - generic [ref=e210]:
                  - generic [ref=e211]:
                    - img [ref=e213]
                    - generic [ref=e217]:
                      - paragraph [ref=e218]: بضائع عامة
                      - paragraph [ref=e219]: أمس
                  - generic [ref=e220]: مفتوح
                - generic [ref=e227]:
                  - generic [ref=e228]:
                    - img [ref=e229]
                    - generic [ref=e232]: مسقط — السيب
                  - generic [ref=e233]:
                    - img [ref=e234]
                    - generic [ref=e237]: مسقط — بوشر
                - paragraph [ref=e239]: بضاعة تجارية متنوعة
                - generic [ref=e240]:
                  - generic [ref=e241]:
                    - generic [ref=e242]:
                      - img [ref=e243]
                      - text: في أقرب وقت
                    - generic [ref=e246]:
                      - img [ref=e247]
                      - text: "7"
                  - generic [ref=e250]:
                    - generic [ref=e251]: 60 – 80 ر.ع.
                    - img [ref=e252]
              - 'link "بضائع عامة 5 مايو مفتوح مسقط — بوشر الظاهرة — عبري شحن بضائع متنوعة: ملابس وإلكترونيات وإكسسوارات (150 كرتونة) من المستودع إلى المحلات التجارية في عبري. 3 طن الثلاثاء، 12 مايو 1 90 – 140 ر.ع." [ref=e255] [cursor=pointer]':
                - /url: /ar/transport/requests/cmosm0cnc000fraw4g49o6s2m
                - generic [ref=e256]:
                  - generic [ref=e257]:
                    - img [ref=e259]
                    - generic [ref=e263]:
                      - paragraph [ref=e264]: بضائع عامة
                      - paragraph [ref=e265]: 5 مايو
                  - generic [ref=e266]: مفتوح
                - generic [ref=e273]:
                  - generic [ref=e274]:
                    - img [ref=e275]
                    - generic [ref=e278]: مسقط — بوشر
                  - generic [ref=e279]:
                    - img [ref=e280]
                    - generic [ref=e283]: الظاهرة — عبري
                - paragraph [ref=e285]: "شحن بضائع متنوعة: ملابس وإلكترونيات وإكسسوارات (150 كرتونة) من المستودع إلى المحلات التجارية في عبري."
                - generic [ref=e286]:
                  - generic [ref=e287]:
                    - generic [ref=e288]:
                      - img [ref=e289]
                      - text: 3 طن
                    - generic [ref=e292]:
                      - img [ref=e293]
                      - text: الثلاثاء، 12 مايو
                    - generic [ref=e295]:
                      - img [ref=e296]
                      - text: "1"
                  - generic [ref=e299]:
                    - generic [ref=e300]: 90 – 140 ر.ع.
                    - img [ref=e301]
    - contentinfo [ref=e304]:
      - generic [ref=e305]:
        - generic [ref=e306]:
          - generic [ref=e307]:
            - link "سوق وان" [ref=e308] [cursor=pointer]:
              - /url: /ar
              - img "سوق وان" [ref=e309]
            - paragraph [ref=e310]: المنصة الأولى في سلطنة عمان لبيع وشراء السيارات بكل ثقة وأمان.
            - generic [ref=e311]:
              - link "YouTube" [ref=e312] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e313]: smart_display
              - link "Instagram" [ref=e314] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e315]: photo_camera
              - link "Facebook" [ref=e316] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e317]: public
          - generic [ref=e318]:
            - heading "روابط سريعة" [level=4] [ref=e319]
            - list [ref=e320]:
              - listitem [ref=e321]:
                - link "الرئيسية" [ref=e322] [cursor=pointer]:
                  - /url: /ar
              - listitem [ref=e323]:
                - link "السيارات" [ref=e324] [cursor=pointer]:
                  - /url: /ar/cars
              - listitem [ref=e325]:
                - link "الحافلات" [ref=e326] [cursor=pointer]:
                  - /url: /ar/buses
              - listitem [ref=e327]:
                - link "المعدات" [ref=e328] [cursor=pointer]:
                  - /url: /ar/equipment
              - listitem [ref=e329]:
                - link "الوظائف" [ref=e330] [cursor=pointer]:
                  - /url: /ar/jobs
              - listitem [ref=e331]:
                - link "النقل" [ref=e332] [cursor=pointer]:
                  - /url: /ar/transport/browse
          - generic [ref=e333]:
            - heading "خدمات" [level=4] [ref=e334]
            - list [ref=e335]:
              - listitem [ref=e336]:
                - link "خدمات سيارات" [ref=e337] [cursor=pointer]:
                  - /url: /ar/browse/services
              - listitem [ref=e338]:
                - link "أضف إعلان" [ref=e339] [cursor=pointer]:
                  - /url: /ar/add-listing
          - generic [ref=e340]:
            - heading "تواصل معنا" [level=4] [ref=e341]
            - list [ref=e342]:
              - listitem [ref=e343]:
                - generic [ref=e344]: location_on
                - generic [ref=e345]: سلطنة عمان، مسقط، الغبرة الشمالية
              - listitem [ref=e346]:
                - generic [ref=e347]: call
                - generic [ref=e348]: +968 9999 0000
              - listitem [ref=e349]:
                - generic [ref=e350]: mail
                - generic [ref=e351]: info@souqone.com
        - generic [ref=e352]:
          - paragraph [ref=e353]: © 2026 سوق وان. جميع الحقوق محفوظة.
          - img "سوق وان" [ref=e354]
  - alert [ref=e355]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const BASE = process.env.BASE_URL || 'http://localhost:3000';
  4  | 
  5  | test.describe('Browse — Locale Links (E1-E10)', () => {
  6  |   test('E1: TransportRequestCard link includes locale', async ({ page }) => {
  7  |     await page.goto(`${BASE}/ar/transport`);
  8  |     await page.waitForLoadState('networkidle');
  9  |     const firstCard = page.locator('a[href*="/transport/requests/"]').first();
  10 |     await expect(firstCard).toHaveAttribute('href', /\/ar\/transport\/requests\//);
  11 |   });
  12 | 
  13 |   test('E2: HeroSection CTA links include locale', async ({ page }) => {
  14 |     await page.goto(`${BASE}/ar/transport`);
  15 |     await page.waitForLoadState('networkidle');
  16 |     const ctaLinks = page.locator('a[href*="/transport/new"], a[href*="/transport/carriers/register"]');
  17 |     for (const link of await ctaLinks.all()) {
  18 |       const href = await link.getAttribute('href');
  19 |       expect(href).toMatch(/^\/ar\//);
  20 |     }
  21 |   });
  22 | 
  23 |   test('E5: LatestRequests "عرض الكل" link includes locale', async ({ page }) => {
  24 |     await page.goto(`${BASE}/ar/transport`);
  25 |     await page.waitForLoadState('networkidle');
  26 |     const viewAllLink = page.getByRole('link', { name: /عرض الكل/i });
  27 |     await expect(viewAllLink).toBeVisible({ timeout: 10000 });
  28 |     await expect(viewAllLink).toHaveAttribute('href', /^\/ar\//);
  29 |   });
  30 | 
  31 |   test('E6: Back link in request detail includes locale', async ({ page }) => {
  32 |     await page.goto(`${BASE}/ar/transport/browse`);
  33 |     await page.waitForLoadState('networkidle');
  34 |     const firstCard = page.locator('a[href*="/transport/requests/"]').first();
  35 |     await expect(firstCard).toBeVisible({ timeout: 15000 });
  36 |     await firstCard.click();
  37 |     await page.waitForLoadState('networkidle');
  38 |     const backLink = page.getByRole('link', { name: /العودة|back/i });
  39 |     await expect(backLink).toBeVisible({ timeout: 10000 });
  40 |     await expect(backLink).toHaveAttribute('href', /^\/ar\//);
  41 |   });
  42 | });
  43 | 
  44 | test.describe('Browse — Filter URL Persistence (F1-F5)', () => {
  45 |   test('F1: Filter by serviceType updates URL', async ({ page }) => {
  46 |     await page.goto(`${BASE}/ar/transport/browse`);
  47 |     await page.waitForLoadState('networkidle');
  48 | 
  49 |     // Apply a filter
  50 |     const filterBtn = page.locator('button, select').filter({ hasText: /نوع الخدمة|بضائع/i }).first();
  51 |     await expect(filterBtn).toBeVisible({ timeout: 10000 });
  52 |     await filterBtn.click();
  53 |     const goodsOption = page.getByRole('option', { name: /بضائع|GOODS/i }).or(
  54 |       page.getByRole('button', { name: /بضائع|GOODS/i })
  55 |     ).first();
  56 |     await expect(goodsOption).toBeVisible({ timeout: 10000 });
  57 |     await goodsOption.click();
  58 |     await page.waitForLoadState('networkidle');
  59 |     expect(page.url()).toContain('serviceType');
  60 |   });
  61 | 
  62 |   test('F1: Filter persists after page refresh', async ({ page }) => {
  63 |     await page.goto(`${BASE}/ar/transport/browse?serviceType=GOODS`);
  64 |     await page.waitForLoadState('networkidle');
  65 |     await page.reload();
  66 |     await page.waitForLoadState('networkidle');
  67 |     expect(page.url()).toContain('serviceType=GOODS');
  68 |   });
  69 | 
  70 |   test('F3: Pagination keeps filters in URL', async ({ page }) => {
  71 |     await page.goto(`${BASE}/ar/transport/browse?serviceType=GOODS`);
  72 |     await page.waitForLoadState('networkidle');
  73 | 
  74 |     const nextBtn = page.getByRole('button', { name: /التالي|next|2/i }).first();
> 75 |     await expect(nextBtn).toBeVisible({ timeout: 10000 });
     |                           ^ Error: expect(locator).toBeVisible() failed
  76 |     await nextBtn.click();
  77 |     await page.waitForLoadState('networkidle');
  78 |     expect(page.url()).toContain('serviceType=GOODS');
  79 |   });
  80 | 
  81 |   test('N1: Anonymous user does NOT see edit button on any card', async ({ page }) => {
  82 |     await page.goto(`${BASE}/ar/transport/browse`);
  83 |     await page.waitForLoadState('networkidle');
  84 |     const editButtons = page.getByRole('button', { name: /تعديل|edit/i });
  85 |     const editLinks = page.locator('a[href*="/edit"]');
  86 |     await expect(editButtons).toHaveCount(0);
  87 |     await expect(editLinks).toHaveCount(0);
  88 |   });
  89 | });
  90 | 
```