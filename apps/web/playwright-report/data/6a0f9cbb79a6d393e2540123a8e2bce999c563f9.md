# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: transport\01-browse.spec.ts >> Browse — Filter URL Persistence (F1-F5) >> F1: Filter by serviceType updates URL
- Location: e2e\transport\01-browse.spec.ts:45:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('button, select').filter({ hasText: /نوع الخدمة|بضائع/i }).first()
Expected: visible
Received: hidden
Timeout:  10000ms

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('button, select').filter({ hasText: /نوع الخدمة|بضائع/i }).first()
    13 × locator resolved to <button class="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border-2 transition-all border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]">…</button>
       - unexpected value "hidden"

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
          - complementary [ref=e57]:
            - generic [ref=e58]:
              - generic [ref=e60]:
                - img [ref=e61]
                - generic [ref=e62]: التصفية
              - generic [ref=e63]:
                - generic [ref=e64]:
                  - paragraph [ref=e65]: نوع الخدمة
                  - generic [ref=e66]:
                    - button "بضائع عامة" [ref=e67]
                    - button "أثاث ومنزليات" [ref=e68]
                    - button "مواد البناء" [ref=e69]
                    - button "شحن ثقيل" [ref=e70]
                    - button "عودة فارغة" [ref=e71]
                    - button "معدات وآليات" [ref=e72]
                - generic [ref=e73]:
                  - paragraph [ref=e74]: الحالة
                  - generic [ref=e75]:
                    - button "مفتوح" [ref=e76]
                    - button "وصلت عروض" [ref=e77]
                    - button "جارٍ التنفيذ" [ref=e78]
                - generic [ref=e80]:
                  - generic [ref=e81]:
                    - generic [ref=e82]: من محافظة
                    - combobox [ref=e83]:
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
                  - generic [ref=e84]:
                    - generic [ref=e85]: المدينة
                    - combobox [disabled] [ref=e86]:
                      - option "الكل" [selected]
                - generic [ref=e88]:
                  - generic [ref=e89]:
                    - generic [ref=e90]: إلى محافظة
                    - combobox [ref=e91]:
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
                  - generic [ref=e92]:
                    - generic [ref=e93]: المدينة
                    - combobox [disabled] [ref=e94]:
                      - option "الكل" [selected]
                - generic [ref=e95]:
                  - paragraph [ref=e96]: الترتيب
                  - combobox [ref=e97]:
                    - option "افتراضي" [selected]
                    - option "الأحدث أولاً"
                    - option "الأقدم أولاً"
                    - option "الميزانية الأعلى"
                    - option "الميزانية الأدنى"
                    - option "أقرب موعد"
          - generic [ref=e99]:
            - paragraph [ref=e100]: عرض 1–7 من 7 طلب
            - generic [ref=e101]:
              - link "أثاث ومنزليات منذ 1 ساعة مفتوح مسقط — بوشر نزوى — نزوى أثاث مكتبي — خزائن ومكاتب 1 طن في أقرب وقت 2 80 – 200 ر.ع." [ref=e102] [cursor=pointer]:
                - /url: /ar/transport/requests/seed-tr-other-002
                - generic [ref=e103]:
                  - generic [ref=e104]:
                    - img [ref=e106]
                    - generic [ref=e109]:
                      - paragraph [ref=e110]: أثاث ومنزليات
                      - paragraph [ref=e111]: منذ 1 ساعة
                  - generic [ref=e112]: مفتوح
                - generic [ref=e119]:
                  - generic [ref=e120]:
                    - img [ref=e121]
                    - generic [ref=e124]: مسقط — بوشر
                  - generic [ref=e125]:
                    - img [ref=e126]
                    - generic [ref=e129]: نزوى — نزوى
                - paragraph [ref=e131]: أثاث مكتبي — خزائن ومكاتب
                - generic [ref=e132]:
                  - generic [ref=e133]:
                    - generic [ref=e134]:
                      - img [ref=e135]
                      - text: 1 طن
                    - generic [ref=e138]:
                      - img [ref=e139]
                      - text: في أقرب وقت
                    - generic [ref=e142]:
                      - img [ref=e143]
                      - text: "2"
                  - generic [ref=e146]:
                    - generic [ref=e147]: 80 – 200 ر.ع.
                    - img [ref=e148]
              - link "بضائع عامة منذ 1 ساعة مفتوح مسقط — الموالح صلالة — المدينة أثاث منزلي — صناديق متنوعة للتجربة 2.5 طن في أقرب وقت 35 50 – 150 ر.ع." [ref=e151] [cursor=pointer]:
                - /url: /ar/transport/requests/seed-tr-open-001
                - generic [ref=e152]:
                  - generic [ref=e153]:
                    - img [ref=e155]
                    - generic [ref=e159]:
                      - paragraph [ref=e160]: بضائع عامة
                      - paragraph [ref=e161]: منذ 1 ساعة
                  - generic [ref=e162]: مفتوح
                - generic [ref=e169]:
                  - generic [ref=e170]:
                    - img [ref=e171]
                    - generic [ref=e174]: مسقط — الموالح
                  - generic [ref=e175]:
                    - img [ref=e176]
                    - generic [ref=e179]: صلالة — المدينة
                - paragraph [ref=e181]: أثاث منزلي — صناديق متنوعة للتجربة
                - generic [ref=e182]:
                  - generic [ref=e183]:
                    - generic [ref=e184]:
                      - img [ref=e185]
                      - text: 2.5 طن
                    - generic [ref=e188]:
                      - img [ref=e189]
                      - text: في أقرب وقت
                    - generic [ref=e192]:
                      - img [ref=e193]
                      - text: "35"
                  - generic [ref=e196]:
                    - generic [ref=e197]: 50 – 150 ر.ع.
                    - img [ref=e198]
              - link "بضائع عامة أمس مفتوح مسقط — السيب مسقط — بوشر بضاعة تجارية متنوعة في أقرب وقت 10 60 – 80 ر.ع." [ref=e201] [cursor=pointer]:
                - /url: /ar/transport/requests/cmpop8b55001zkw0paa31uotj
                - generic [ref=e202]:
                  - generic [ref=e203]:
                    - img [ref=e205]
                    - generic [ref=e209]:
                      - paragraph [ref=e210]: بضائع عامة
                      - paragraph [ref=e211]: أمس
                  - generic [ref=e212]: مفتوح
                - generic [ref=e219]:
                  - generic [ref=e220]:
                    - img [ref=e221]
                    - generic [ref=e224]: مسقط — السيب
                  - generic [ref=e225]:
                    - img [ref=e226]
                    - generic [ref=e229]: مسقط — بوشر
                - paragraph [ref=e231]: بضاعة تجارية متنوعة
                - generic [ref=e232]:
                  - generic [ref=e233]:
                    - generic [ref=e234]:
                      - img [ref=e235]
                      - text: في أقرب وقت
                    - generic [ref=e238]:
                      - img [ref=e239]
                      - text: "10"
                  - generic [ref=e242]:
                    - generic [ref=e243]: 60 – 80 ر.ع.
                    - img [ref=e244]
              - link "بضائع عامة أمس مفتوح مسقط — السيب مسقط — بوشر بضاعة تجارية متنوعة في أقرب وقت 7 60 – 80 ر.ع." [ref=e247] [cursor=pointer]:
                - /url: /ar/transport/requests/cmpop83v1001tkw0pxz67ogl7
                - generic [ref=e248]:
                  - generic [ref=e249]:
                    - img [ref=e251]
                    - generic [ref=e255]:
                      - paragraph [ref=e256]: بضائع عامة
                      - paragraph [ref=e257]: أمس
                  - generic [ref=e258]: مفتوح
                - generic [ref=e265]:
                  - generic [ref=e266]:
                    - img [ref=e267]
                    - generic [ref=e270]: مسقط — السيب
                  - generic [ref=e271]:
                    - img [ref=e272]
                    - generic [ref=e275]: مسقط — بوشر
                - paragraph [ref=e277]: بضاعة تجارية متنوعة
                - generic [ref=e278]:
                  - generic [ref=e279]:
                    - generic [ref=e280]:
                      - img [ref=e281]
                      - text: في أقرب وقت
                    - generic [ref=e284]:
                      - img [ref=e285]
                      - text: "7"
                  - generic [ref=e288]:
                    - generic [ref=e289]: 60 – 80 ر.ع.
                    - img [ref=e290]
              - 'link "بضائع عامة 5 مايو مفتوح مسقط — بوشر الظاهرة — عبري شحن بضائع متنوعة: ملابس وإلكترونيات وإكسسوارات (150 كرتونة) من المستودع إلى المحلات التجارية في عبري. 3 طن الثلاثاء، 12 مايو 1 90 – 140 ر.ع." [ref=e293] [cursor=pointer]':
                - /url: /ar/transport/requests/cmosm0cnc000fraw4g49o6s2m
                - generic [ref=e294]:
                  - generic [ref=e295]:
                    - img [ref=e297]
                    - generic [ref=e301]:
                      - paragraph [ref=e302]: بضائع عامة
                      - paragraph [ref=e303]: 5 مايو
                  - generic [ref=e304]: مفتوح
                - generic [ref=e311]:
                  - generic [ref=e312]:
                    - img [ref=e313]
                    - generic [ref=e316]: مسقط — بوشر
                  - generic [ref=e317]:
                    - img [ref=e318]
                    - generic [ref=e321]: الظاهرة — عبري
                - paragraph [ref=e323]: "شحن بضائع متنوعة: ملابس وإلكترونيات وإكسسوارات (150 كرتونة) من المستودع إلى المحلات التجارية في عبري."
                - generic [ref=e324]:
                  - generic [ref=e325]:
                    - generic [ref=e326]:
                      - img [ref=e327]
                      - text: 3 طن
                    - generic [ref=e330]:
                      - img [ref=e331]
                      - text: الثلاثاء، 12 مايو
                    - generic [ref=e333]:
                      - img [ref=e334]
                      - text: "1"
                  - generic [ref=e337]:
                    - generic [ref=e338]: 90 – 140 ر.ع.
                    - img [ref=e339]
              - 'link "عودة فارغة 5 مايو مفتوح ظفار — صلالة مسقط — بوشر باك لود (مشاركة شحنة): 15 صندوق بضاعة متنوعة وزنها الإجمالي نحو 500 كجم فقط. 0.5 طن في أقرب وقت 2 30 – 60 ر.ع." [ref=e342] [cursor=pointer]':
                - /url: /ar/transport/requests/cmosm0c94000braw487x0znjj
                - generic [ref=e343]:
                  - generic [ref=e344]:
                    - img [ref=e346]
                    - generic [ref=e349]:
                      - paragraph [ref=e350]: عودة فارغة
                      - paragraph [ref=e351]: 5 مايو
                  - generic [ref=e352]: مفتوح
                - generic [ref=e359]:
                  - generic [ref=e360]:
                    - img [ref=e361]
                    - generic [ref=e364]: ظفار — صلالة
                  - generic [ref=e365]:
                    - img [ref=e366]
                    - generic [ref=e369]: مسقط — بوشر
                - paragraph [ref=e371]: "باك لود (مشاركة شحنة): 15 صندوق بضاعة متنوعة وزنها الإجمالي نحو 500 كجم فقط."
                - generic [ref=e372]:
                  - generic [ref=e373]:
                    - generic [ref=e374]:
                      - img [ref=e375]
                      - text: 0.5 طن
                    - generic [ref=e378]:
                      - img [ref=e379]
                      - text: في أقرب وقت
                    - generic [ref=e382]:
                      - img [ref=e383]
                      - text: "2"
                  - generic [ref=e386]:
                    - generic [ref=e387]: 30 – 60 ر.ع.
                    - img [ref=e388]
              - link "أثاث ومنزليات 5 مايو مفتوح مسقط — بوشر ظفار — صلالة نقل أثاث منزل كامل (غرفة نوم، صالة، مطبخ) من مسقط إلى صلالة. الكميات متوسطة وتشمل قطع كبيرة. 3.5 طن الجمعة، 8 مايو 1 120 – 180 ر.ع." [ref=e391] [cursor=pointer]:
                - /url: /ar/transport/requests/cmosm0bgl0001raw4ljuf6rag
                - generic [ref=e392]:
                  - generic [ref=e393]:
                    - img [ref=e395]
                    - generic [ref=e398]:
                      - paragraph [ref=e399]: أثاث ومنزليات
                      - paragraph [ref=e400]: 5 مايو
                  - generic [ref=e401]: مفتوح
                - generic [ref=e408]:
                  - generic [ref=e409]:
                    - img [ref=e410]
                    - generic [ref=e413]: مسقط — بوشر
                  - generic [ref=e414]:
                    - img [ref=e415]
                    - generic [ref=e418]: ظفار — صلالة
                - paragraph [ref=e420]: نقل أثاث منزل كامل (غرفة نوم، صالة، مطبخ) من مسقط إلى صلالة. الكميات متوسطة وتشمل قطع كبيرة.
                - generic [ref=e421]:
                  - generic [ref=e422]:
                    - generic [ref=e423]:
                      - img [ref=e424]
                      - text: 3.5 طن
                    - generic [ref=e427]:
                      - img [ref=e428]
                      - text: الجمعة، 8 مايو
                    - generic [ref=e430]:
                      - img [ref=e431]
                      - text: "1"
                  - generic [ref=e434]:
                    - generic [ref=e435]: 120 – 180 ر.ع.
                    - img [ref=e436]
    - contentinfo [ref=e439]:
      - generic [ref=e440]:
        - generic [ref=e441]:
          - generic [ref=e442]:
            - link "سوق وان" [ref=e443] [cursor=pointer]:
              - /url: /ar
              - img "سوق وان" [ref=e444]
            - paragraph [ref=e445]: المنصة الأولى في سلطنة عمان لبيع وشراء السيارات بكل ثقة وأمان.
            - generic [ref=e446]:
              - link "YouTube" [ref=e447] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e448]: smart_display
              - link "Instagram" [ref=e449] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e450]: photo_camera
              - link "Facebook" [ref=e451] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e452]: public
          - generic [ref=e453]:
            - heading "روابط سريعة" [level=4] [ref=e454]
            - list [ref=e455]:
              - listitem [ref=e456]:
                - link "الرئيسية" [ref=e457] [cursor=pointer]:
                  - /url: /ar
              - listitem [ref=e458]:
                - link "السيارات" [ref=e459] [cursor=pointer]:
                  - /url: /ar/cars
              - listitem [ref=e460]:
                - link "الحافلات" [ref=e461] [cursor=pointer]:
                  - /url: /ar/buses
              - listitem [ref=e462]:
                - link "المعدات" [ref=e463] [cursor=pointer]:
                  - /url: /ar/equipment
              - listitem [ref=e464]:
                - link "الوظائف" [ref=e465] [cursor=pointer]:
                  - /url: /ar/jobs
              - listitem [ref=e466]:
                - link "النقل" [ref=e467] [cursor=pointer]:
                  - /url: /ar/transport/browse
          - generic [ref=e468]:
            - heading "خدمات" [level=4] [ref=e469]
            - list [ref=e470]:
              - listitem [ref=e471]:
                - link "خدمات سيارات" [ref=e472] [cursor=pointer]:
                  - /url: /ar/browse/services
              - listitem [ref=e473]:
                - link "أضف إعلان" [ref=e474] [cursor=pointer]:
                  - /url: /ar/add-listing
          - generic [ref=e475]:
            - heading "تواصل معنا" [level=4] [ref=e476]
            - list [ref=e477]:
              - listitem [ref=e478]:
                - generic [ref=e479]: location_on
                - generic [ref=e480]: سلطنة عمان، مسقط، الغبرة الشمالية
              - listitem [ref=e481]:
                - generic [ref=e482]: call
                - generic [ref=e483]: +968 9999 0000
              - listitem [ref=e484]:
                - generic [ref=e485]: mail
                - generic [ref=e486]: info@souqone.com
        - generic [ref=e487]:
          - paragraph [ref=e488]: © 2026 سوق وان. جميع الحقوق محفوظة.
          - img "سوق وان" [ref=e489]
  - alert [ref=e490]
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
> 51 |     await expect(filterBtn).toBeVisible({ timeout: 10000 });
     |                             ^ Error: expect(locator).toBeVisible() failed
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
  75 |     await expect(nextBtn).toBeVisible({ timeout: 10000 });
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