# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: transport\04-bookings.spec.ts >> Bookings — isCarrier booking-specific (N6) >> N6: Page loads booking details without full list scan (direct endpoint)
- Location: e2e\transport\04-bookings.spec.ts:7:7

# Error details

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /تسجيل الدخول|دخول|Login|Sign in/i }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - link "سوق وان" [ref=e8] [cursor=pointer]:
          - /url: /ar
          - img "سوق وان" [ref=e9]
        - button "Switch to dark mode" [ref=e10]:
          - generic [ref=e11]: dark_mode
      - navigation [ref=e13]:
        - link "الرئيسية" [ref=e15] [cursor=pointer]:
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
    - main [ref=e40]:
      - generic [ref=e43]:
        - generic [ref=e46]: المنصة العُمانية الأولى للمركبات والمعدات
        - generic [ref=e47]:
          - link "تصفّح الإعلانات" [ref=e48] [cursor=pointer]:
            - /url: /ar/cars/browse
            - img [ref=e49]
            - text: تصفّح الإعلانات
          - link "أضف إعلانك مجاناً" [ref=e52] [cursor=pointer]:
            - /url: /ar/cars/new
            - text: أضف إعلانك مجاناً
            - img [ref=e53]
        - generic [ref=e54]:
          - link "سيارات" [ref=e55] [cursor=pointer]:
            - /url: /ar/cars/browse
            - img [ref=e56]
            - text: سيارات
          - link "حافلات" [ref=e60] [cursor=pointer]:
            - /url: /ar/browse/buses
            - img [ref=e61]
            - text: حافلات
          - link "معدات" [ref=e65] [cursor=pointer]:
            - /url: /ar/browse/equipment
            - img [ref=e66]
            - text: معدات
          - link "قطع" [ref=e70] [cursor=pointer]:
            - /url: /ar/browse/parts
            - img [ref=e71]
            - text: قطع
          - link "وظائف" [ref=e73] [cursor=pointer]:
            - /url: /ar/jobs
            - img [ref=e74]
            - text: وظائف
      - generic [ref=e79]:
        - button "كل الخدمات" [ref=e81]:
          - text: كل الخدمات
          - img [ref=e82]
        - generic [ref=e84]:
          - textbox "ابحث في كل الخدمات..." [ref=e85]
          - button [ref=e86]:
            - img [ref=e87]
        - link "أضف إعلان" [ref=e90] [cursor=pointer]:
          - /url: /ar/add-listing
          - img [ref=e91]
          - generic [ref=e92]: أضف إعلان
      - generic [ref=e94]:
        - heading "الأقسام الأكثر طلباً" [level=2] [ref=e97]
        - generic [ref=e98]:
          - link "سيارات سيارات بيع وإيجار" [ref=e99] [cursor=pointer]:
            - /url: /ar/cars/browse
            - img "سيارات" [ref=e102]
            - generic [ref=e103]:
              - heading "سيارات" [level=3] [ref=e104]
              - paragraph [ref=e105]: بيع وإيجار
          - link "حافلات حافلات بيع وإيجار وعقود" [ref=e106] [cursor=pointer]:
            - /url: /ar/browse/buses
            - img "حافلات" [ref=e109]
            - generic [ref=e110]:
              - heading "حافلات" [level=3] [ref=e111]
              - paragraph [ref=e112]: بيع وإيجار وعقود
          - link "قطع غيار قطع غيار أصلية وبديلة" [ref=e113] [cursor=pointer]:
            - /url: /ar/browse/parts
            - img "قطع غيار" [ref=e116]
            - generic [ref=e117]:
              - heading "قطع غيار" [level=3] [ref=e118]
              - paragraph [ref=e119]: أصلية وبديلة
          - link "خدمات سيارات خدمات سيارات صيانة وفحص" [ref=e120] [cursor=pointer]:
            - /url: /ar/browse/services
            - img "خدمات سيارات" [ref=e123]
            - generic [ref=e124]:
              - heading "خدمات سيارات" [level=3] [ref=e125]
              - paragraph [ref=e126]: صيانة وفحص
          - link "معدات ثقيلة معدات ثقيلة بيع وتأجير" [ref=e127] [cursor=pointer]:
            - /url: /ar/browse/equipment
            - img "معدات ثقيلة" [ref=e130]
            - generic [ref=e131]:
              - heading "معدات ثقيلة" [level=3] [ref=e132]
              - paragraph [ref=e133]: بيع وتأجير
          - link "وظائف وظائف سائقين وشركات" [ref=e134] [cursor=pointer]:
            - /url: /ar/jobs
            - img "وظائف" [ref=e137]
            - generic [ref=e138]:
              - heading "وظائف" [level=3] [ref=e139]
              - paragraph [ref=e140]: سائقين وشركات
          - link "إيجار سيارات إيجار سيارات يومي وشهري" [ref=e141] [cursor=pointer]:
            - /url: /ar/cars/browse?listingType=RENTAL
            - img "إيجار سيارات" [ref=e144]
            - generic [ref=e145]:
              - heading "إيجار سيارات" [level=3] [ref=e146]
              - paragraph [ref=e147]: يومي وشهري
      - generic [ref=e148]:
        - generic [ref=e149]:
          - heading "خدمات سريعة بالقرب منك" [level=2] [ref=e152]
          - generic [ref=e153]:
            - generic [ref=e154]:
              - button "Scroll start" [ref=e155]:
                - img [ref=e156]
              - button "Scroll end" [disabled] [ref=e158]:
                - img [ref=e159]
            - link "الخدمات ←" [ref=e161] [cursor=pointer]:
              - /url: /ar/browse/services
        - generic [ref=e162]:
          - link "electrical_services كهربائي سيارات" [ref=e163] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=MAINTENANCE
            - generic [ref=e165]: electrical_services
            - generic [ref=e166]: كهربائي سيارات
          - link "oil_barrel تبديل زيت" [ref=e167] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=MAINTENANCE
            - generic [ref=e169]: oil_barrel
            - generic [ref=e170]: تبديل زيت
          - link "car_crash سطحة ونش" [ref=e171] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=TOWING
            - generic [ref=e173]: car_crash
            - generic [ref=e174]: سطحة ونش
          - link "tire_repair بنشر متنقل" [ref=e175] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=MAINTENANCE
            - generic [ref=e177]: tire_repair
            - generic [ref=e178]: بنشر متنقل
          - link "battery_charging_full بطارية متنقلة" [ref=e179] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=MAINTENANCE
            - generic [ref=e181]: battery_charging_full
            - generic [ref=e182]: بطارية متنقلة
          - link "local_car_wash غسيل وتلميع" [ref=e183] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=CLEANING
            - generic [ref=e185]: local_car_wash
            - generic [ref=e186]: غسيل وتلميع
          - link "build صيانة وإصلاح" [ref=e187] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=MAINTENANCE
            - generic [ref=e189]: build
            - generic [ref=e190]: صيانة وإصلاح
          - link "search_check_2 فحص سيارات" [ref=e191] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=INSPECTION
            - generic [ref=e193]: search_check_2
            - generic [ref=e194]: فحص سيارات
          - link "format_paint سمكرة ودهان" [ref=e195] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=BODYWORK
            - generic [ref=e197]: format_paint
            - generic [ref=e198]: سمكرة ودهان
          - link "tune تعديل وتزويد" [ref=e199] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=MODIFICATION
            - generic [ref=e201]: tune
            - generic [ref=e202]: تعديل وتزويد
          - link "dashboard_customize تركيب إكسسوارات" [ref=e203] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=ACCESSORIES_INSTALL
            - generic [ref=e205]: dashboard_customize
            - generic [ref=e206]: تركيب إكسسوارات
          - link "key مفاتيح وأقفال" [ref=e207] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=KEYS_LOCKS
            - generic [ref=e209]: key
            - generic [ref=e210]: مفاتيح وأقفال
      - generic [ref=e213]:
        - generic [ref=e214]:
          - generic [ref=e215]:
            - heading "أحدث السيارات" [level=2] [ref=e218]
            - paragraph [ref=e219]: سيارات جديدة ومستعملة للبيع والإيجار في سلطنة عمان
          - link "عرض الكل ←" [ref=e220] [cursor=pointer]:
            - /url: /ar/cars/browse
        - generic [ref=e222]:
          - button "السابق" [ref=e223]:
            - img [ref=e224]
          - generic [ref=e226]:
            - generic [ref=e228] [cursor=pointer]:
              - generic [ref=e230]:
                - generic [ref=e231]:
                  - img [ref=e234]
                  - generic [ref=e238]: لا توجد صورة
                - generic [ref=e239]:
                  - img [ref=e240]
                  - text: للبيع
                - button "إضافة للمفضلة" [ref=e242]:
                  - img [ref=e243]
              - generic [ref=e245]:
                - heading "Toyota Camry 2022" [level=3] [ref=e247]
                - generic [ref=e248]:
                  - generic [ref=e249]:
                    - img [ref=e251]
                    - generic [ref=e253]: "2022"
                  - generic [ref=e254]:
                    - img [ref=e256]
                    - generic [ref=e259]: أوتوماتيك
                  - generic [ref=e260]:
                    - img [ref=e262]
                    - generic [ref=e268]: silver
                  - generic [ref=e269]:
                    - img [ref=e271]
                    - generic [ref=e274]: بنزين
                - separator [ref=e276]
                - generic [ref=e277]:
                  - generic [ref=e278]:
                    - img [ref=e279]
                    - generic [ref=e282]: عُمان، شمال الباطنة
                  - generic [ref=e283]:
                    - generic [ref=e284]: ر.ع
                    - generic [ref=e285]: 5,000
            - generic [ref=e287] [cursor=pointer]:
              - generic [ref=e288]:
                - generic [ref=e289]:
                  - img "Toyota Camry 2025" [ref=e290]
                  - generic [ref=e291]:
                    - img [ref=e292]
                    - text: للإيجار
                  - button "إضافة للمفضلة" [ref=e294]:
                    - img [ref=e295]
                - generic [ref=e297]:
                  - button "Toyota Camry 2025 1" [ref=e298]
                  - button "Toyota Camry 2025 2" [ref=e299]
                  - button "Toyota Camry 2025 3" [ref=e300]
                  - button "Toyota Camry 2025 4" [ref=e301]
              - generic [ref=e302]:
                - heading "Toyota Camry 2025" [level=3] [ref=e304]
                - generic [ref=e305]:
                  - generic [ref=e306]:
                    - img [ref=e308]
                    - generic [ref=e310]: "2025"
                  - generic [ref=e311]:
                    - img [ref=e313]
                    - generic [ref=e316]: أوتوماتيك
                  - generic [ref=e317]:
                    - img [ref=e319]
                    - generic [ref=e325]: white
                  - generic [ref=e326]:
                    - img [ref=e328]
                    - generic [ref=e331]: بنزين
                - separator [ref=e332]
                - generic [ref=e333]:
                  - generic [ref=e334]:
                    - img [ref=e335]
                    - generic [ref=e338]: عُمان، شمال الباطنة
                  - generic [ref=e339]:
                    - generic [ref=e340]: ر.ع / يومياً
                    - generic [ref=e341]: "15"
            - generic [ref=e343] [cursor=pointer]:
              - generic [ref=e345]:
                - img "Audi Q7 2023" [ref=e346]
                - generic [ref=e347]:
                  - img [ref=e348]
                  - text: للبيع
                - button "إضافة للمفضلة" [ref=e350]:
                  - img [ref=e351]
              - generic [ref=e353]:
                - generic [ref=e354]:
                  - heading "Audi Q7 2023" [level=3] [ref=e355]
                  - generic [ref=e356]:
                    - generic [ref=e357]: verified
                    - text: موثق
                - generic [ref=e358]:
                  - generic [ref=e359]:
                    - img [ref=e361]
                    - generic [ref=e363]: "2023"
                  - generic [ref=e364]:
                    - img [ref=e366]
                    - generic [ref=e369]: أوتوماتيك
                  - generic [ref=e370]:
                    - img [ref=e372]
                    - generic [ref=e378]: كحلي
                  - generic [ref=e379]:
                    - img [ref=e381]
                    - generic [ref=e384]: بنزين
                - separator [ref=e386]
                - generic [ref=e387]:
                  - generic [ref=e388]:
                    - img [ref=e389]
                    - generic [ref=e392]: عُمان، مسقط
                  - generic [ref=e393]:
                    - generic [ref=e394]: ر.ع
                    - generic [ref=e395]: 24,000
            - generic [ref=e397] [cursor=pointer]:
              - generic [ref=e399]:
                - img "Kia K5 2023" [ref=e400]
                - generic [ref=e401]:
                  - img [ref=e402]
                  - text: للبيع
                - button "إضافة للمفضلة" [ref=e404]:
                  - img [ref=e405]
              - generic [ref=e407]:
                - generic [ref=e408]:
                  - heading "Kia K5 2023" [level=3] [ref=e409]
                  - generic [ref=e410]:
                    - generic [ref=e411]: verified
                    - text: موثق
                - generic [ref=e412]:
                  - generic [ref=e413]:
                    - img [ref=e415]
                    - generic [ref=e417]: "2023"
                  - generic [ref=e418]:
                    - img [ref=e420]
                    - generic [ref=e423]: أوتوماتيك
                  - generic [ref=e424]:
                    - img [ref=e426]
                    - generic [ref=e432]: رمادي داكن
                  - generic [ref=e433]:
                    - img [ref=e435]
                    - generic [ref=e438]: بنزين
                - separator [ref=e440]
                - generic [ref=e441]:
                  - generic [ref=e442]:
                    - img [ref=e443]
                    - generic [ref=e446]: عُمان، جنوب الباطنة
                  - generic [ref=e447]:
                    - generic [ref=e448]: ر.ع
                    - generic [ref=e449]: 6,800
    - contentinfo [ref=e690]:
      - generic [ref=e691]:
        - generic [ref=e692]:
          - generic [ref=e693]:
            - link "سوق وان" [ref=e694] [cursor=pointer]:
              - /url: /ar
              - img "سوق وان" [ref=e695]
            - paragraph [ref=e696]: المنصة الأولى في سلطنة عمان لبيع وشراء السيارات بكل ثقة وأمان.
            - generic [ref=e697]:
              - link "YouTube" [ref=e698] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e699]: smart_display
              - link "Instagram" [ref=e700] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e701]: photo_camera
              - link "Facebook" [ref=e702] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e703]: public
          - generic [ref=e704]:
            - heading "روابط سريعة" [level=4] [ref=e705]
            - list [ref=e706]:
              - listitem [ref=e707]:
                - link "الرئيسية" [ref=e708] [cursor=pointer]:
                  - /url: /ar
              - listitem [ref=e709]:
                - link "السيارات" [ref=e710] [cursor=pointer]:
                  - /url: /ar/cars
              - listitem [ref=e711]:
                - link "الحافلات" [ref=e712] [cursor=pointer]:
                  - /url: /ar/buses
              - listitem [ref=e713]:
                - link "المعدات" [ref=e714] [cursor=pointer]:
                  - /url: /ar/equipment
              - listitem [ref=e715]:
                - link "الوظائف" [ref=e716] [cursor=pointer]:
                  - /url: /ar/jobs
              - listitem [ref=e717]:
                - link "النقل" [ref=e718] [cursor=pointer]:
                  - /url: /ar/transport/browse
          - generic [ref=e719]:
            - heading "خدمات" [level=4] [ref=e720]
            - list [ref=e721]:
              - listitem [ref=e722]:
                - link "خدمات سيارات" [ref=e723] [cursor=pointer]:
                  - /url: /ar/browse/services
              - listitem [ref=e724]:
                - link "أضف إعلان" [ref=e725] [cursor=pointer]:
                  - /url: /ar/add-listing
          - generic [ref=e726]:
            - heading "تواصل معنا" [level=4] [ref=e727]
            - list [ref=e728]:
              - listitem [ref=e729]:
                - generic [ref=e730]: location_on
                - generic [ref=e731]: سلطنة عمان، مسقط، الغبرة الشمالية
              - listitem [ref=e732]:
                - generic [ref=e733]: call
                - generic [ref=e734]: +968 9999 0000
              - listitem [ref=e735]:
                - generic [ref=e736]: mail
                - generic [ref=e737]: info@souqone.com
        - generic [ref=e738]:
          - paragraph [ref=e739]: © 2026 سوق وان. جميع الحقوق محفوظة.
          - img "سوق وان" [ref=e740]
  - alert [ref=e741]
```

# Test source

```ts
  1  | import { Page } from '@playwright/test';
  2  | 
  3  | const BASE = process.env.BASE_URL || 'http://localhost:3000';
  4  | 
  5  | export const USERS = {
  6  |   shipper: { email: 'shipper@souqone.om', password: 'Test1234' },
  7  |   carrier: { email: 'carrier@souqone.om', password: 'Test1234' },
  8  |   carrierNoProfile: { email: 'carrierNoProfile@souqone.om', password: 'Test1234' },
  9  |   other: { email: 'other@souqone.om', password: 'Test1234' },
  10 | } as const;
  11 | 
  12 | export const SEED_IDS = {
  13 |   openRequest: 'seed-tr-open-001',        // OPEN, owned by shipper
  14 |   otherRequest: 'seed-tr-other-002',      // OPEN, owned by other user
  15 |   quotedRequest: 'seed-tr-quoted-003',    // QUOTED, shipper owns, carrier quoted
  16 |   pendingQuote: 'seed-tq-pending-001',    // PENDING quote from carrier
  17 | } as const;
  18 | 
  19 | /**
  20 |  * Login via the Auth Modal (the app uses a modal, not a standalone login page)
  21 |  */
  22 | export async function loginAs(
  23 |   page: Page,
  24 |   user: keyof typeof USERS,
  25 |   locale = 'ar',
  26 | ) {
  27 |   // Go to home page first
  28 |   await page.goto(`${BASE}/${locale}`);
  29 |   await page.waitForLoadState('networkidle');
  30 | 
  31 |   // Click the login button in the header to open the Auth Modal
  32 |   const loginBtn = page.getByRole('button', { name: /تسجيل الدخول|دخول|Login|Sign in/i }).first();
> 33 |   await loginBtn.click();
     |                  ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  34 | 
  35 |   // Wait for the modal to appear with the email input
  36 |   await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  37 | 
  38 |   // Fill credentials
  39 |   await page.fill('input[type="email"]', USERS[user].email);
  40 |   await page.fill('input[type="password"]', USERS[user].password);
  41 | 
  42 |   // Submit the login form
  43 |   const form = page.locator('form').filter({ has: page.locator('input[type="email"]') });
  44 |   await form.locator('button[type="submit"]').click({ force: true });
  45 | 
  46 |   // Wait for modal to close (login success)
  47 |   await page.waitForFunction(
  48 |     () => !document.querySelector('input[type="email"]'),
  49 |     { timeout: 30000 }
  50 |   );
  51 | 
  52 |   // Small pause for auth state to settle
  53 |   await page.waitForTimeout(1000);
  54 | }
  55 | 
  56 | export async function logout(page: Page) {
  57 |   const avatarBtn = page.locator('[data-testid="user-menu"], [aria-label="القائمة"]').first();
  58 |   if (await avatarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  59 |     await avatarBtn.click();
  60 |     const logoutBtn = page.getByRole('button', { name: /تسجيل الخروج|Logout/i });
  61 |     if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  62 |       await logoutBtn.click();
  63 |       return;
  64 |     }
  65 |   }
  66 |   // Fallback: clear storage
  67 |   await page.evaluate(() => {
  68 |     localStorage.clear();
  69 |     sessionStorage.clear();
  70 |     document.cookie.split(';').forEach((c) => {
  71 |       document.cookie = c
  72 |         .replace(/^ +/, '')
  73 |         .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
  74 |     });
  75 |   });
  76 |   await page.reload();
  77 | }
  78 | 
  79 | export async function waitForTransportPage(page: Page) {
  80 |   await page.waitForLoadState('networkidle');
  81 |   await page.waitForSelector('[class*="card"], [class*="skeleton"], [class*="error"], h1', {
  82 |     timeout: 60000,
  83 |   });
  84 | }
  85 | 
```