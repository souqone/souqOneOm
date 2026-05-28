# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: transport\03-request-flow.spec.ts >> Request Flow — Carrier No Profile (N16) >> N16: User with CARRIER role but no profile sees registration banner, not quote form
- Location: e2e\transport\03-request-flow.spec.ts:76:7

# Error details

```
TimeoutError: page.waitForFunction: Timeout 30000ms exceeded.
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
        - generic [ref=e31]:
          - button "person تسجيل الدخول" [ref=e32]:
            - generic [ref=e33]: person
            - text: تسجيل الدخول
          - button "إنشاء حساب" [ref=e34] [cursor=pointer]
    - main [ref=e35]:
      - generic [ref=e38]:
        - generic [ref=e41]: المنصة العُمانية الأولى للمركبات والمعدات
        - generic [ref=e42]:
          - link "تصفّح الإعلانات" [ref=e43] [cursor=pointer]:
            - /url: /ar/cars/browse
            - img [ref=e44]
            - text: تصفّح الإعلانات
          - link "أضف إعلانك مجاناً" [ref=e47] [cursor=pointer]:
            - /url: /ar/cars/new
            - text: أضف إعلانك مجاناً
            - img [ref=e48]
        - generic [ref=e49]:
          - link "سيارات" [ref=e50] [cursor=pointer]:
            - /url: /ar/cars/browse
            - img [ref=e51]
            - text: سيارات
          - link "حافلات" [ref=e55] [cursor=pointer]:
            - /url: /ar/browse/buses
            - img [ref=e56]
            - text: حافلات
          - link "معدات" [ref=e60] [cursor=pointer]:
            - /url: /ar/browse/equipment
            - img [ref=e61]
            - text: معدات
          - link "قطع" [ref=e65] [cursor=pointer]:
            - /url: /ar/browse/parts
            - img [ref=e66]
            - text: قطع
          - link "وظائف" [ref=e68] [cursor=pointer]:
            - /url: /ar/jobs
            - img [ref=e69]
            - text: وظائف
      - generic [ref=e74]:
        - button "كل الخدمات" [ref=e76]:
          - text: كل الخدمات
          - img [ref=e77]
        - generic [ref=e79]:
          - textbox "ابحث في كل الخدمات..." [ref=e80]
          - button [ref=e81]:
            - img [ref=e82]
        - link "أضف إعلان" [ref=e85] [cursor=pointer]:
          - /url: /ar/add-listing
          - img [ref=e86]
          - generic [ref=e87]: أضف إعلان
      - generic [ref=e89]:
        - heading "الأقسام الأكثر طلباً" [level=2] [ref=e92]
        - generic [ref=e93]:
          - link "سيارات سيارات بيع وإيجار" [ref=e94] [cursor=pointer]:
            - /url: /ar/cars/browse
            - img "سيارات" [ref=e97]
            - generic [ref=e98]:
              - heading "سيارات" [level=3] [ref=e99]
              - paragraph [ref=e100]: بيع وإيجار
          - link "حافلات حافلات بيع وإيجار وعقود" [ref=e101] [cursor=pointer]:
            - /url: /ar/browse/buses
            - img "حافلات" [ref=e104]
            - generic [ref=e105]:
              - heading "حافلات" [level=3] [ref=e106]
              - paragraph [ref=e107]: بيع وإيجار وعقود
          - link "قطع غيار قطع غيار أصلية وبديلة" [ref=e108] [cursor=pointer]:
            - /url: /ar/browse/parts
            - img "قطع غيار" [ref=e111]
            - generic [ref=e112]:
              - heading "قطع غيار" [level=3] [ref=e113]
              - paragraph [ref=e114]: أصلية وبديلة
          - link "خدمات سيارات خدمات سيارات صيانة وفحص" [ref=e115] [cursor=pointer]:
            - /url: /ar/browse/services
            - img "خدمات سيارات" [ref=e118]
            - generic [ref=e119]:
              - heading "خدمات سيارات" [level=3] [ref=e120]
              - paragraph [ref=e121]: صيانة وفحص
          - link "معدات ثقيلة معدات ثقيلة بيع وتأجير" [ref=e122] [cursor=pointer]:
            - /url: /ar/browse/equipment
            - img "معدات ثقيلة" [ref=e125]
            - generic [ref=e126]:
              - heading "معدات ثقيلة" [level=3] [ref=e127]
              - paragraph [ref=e128]: بيع وتأجير
          - link "وظائف وظائف سائقين وشركات" [ref=e129] [cursor=pointer]:
            - /url: /ar/jobs
            - img "وظائف" [ref=e132]
            - generic [ref=e133]:
              - heading "وظائف" [level=3] [ref=e134]
              - paragraph [ref=e135]: سائقين وشركات
          - link "إيجار سيارات إيجار سيارات يومي وشهري" [ref=e136] [cursor=pointer]:
            - /url: /ar/cars/browse?listingType=RENTAL
            - img "إيجار سيارات" [ref=e139]
            - generic [ref=e140]:
              - heading "إيجار سيارات" [level=3] [ref=e141]
              - paragraph [ref=e142]: يومي وشهري
      - generic [ref=e143]:
        - generic [ref=e144]:
          - heading "خدمات سريعة بالقرب منك" [level=2] [ref=e147]
          - generic [ref=e148]:
            - generic [ref=e149]:
              - button "Scroll start" [ref=e150]:
                - img [ref=e151]
              - button "Scroll end" [disabled] [ref=e153]:
                - img [ref=e154]
            - link "الخدمات ←" [ref=e156] [cursor=pointer]:
              - /url: /ar/browse/services
        - generic [ref=e157]:
          - link "electrical_services كهربائي سيارات" [ref=e158] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=MAINTENANCE
            - generic [ref=e160]: electrical_services
            - generic [ref=e161]: كهربائي سيارات
          - link "oil_barrel تبديل زيت" [ref=e162] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=MAINTENANCE
            - generic [ref=e164]: oil_barrel
            - generic [ref=e165]: تبديل زيت
          - link "car_crash سطحة ونش" [ref=e166] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=TOWING
            - generic [ref=e168]: car_crash
            - generic [ref=e169]: سطحة ونش
          - link "tire_repair بنشر متنقل" [ref=e170] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=MAINTENANCE
            - generic [ref=e172]: tire_repair
            - generic [ref=e173]: بنشر متنقل
          - link "battery_charging_full بطارية متنقلة" [ref=e174] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=MAINTENANCE
            - generic [ref=e176]: battery_charging_full
            - generic [ref=e177]: بطارية متنقلة
          - link "local_car_wash غسيل وتلميع" [ref=e178] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=CLEANING
            - generic [ref=e180]: local_car_wash
            - generic [ref=e181]: غسيل وتلميع
          - link "build صيانة وإصلاح" [ref=e182] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=MAINTENANCE
            - generic [ref=e184]: build
            - generic [ref=e185]: صيانة وإصلاح
          - link "search_check_2 فحص سيارات" [ref=e186] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=INSPECTION
            - generic [ref=e188]: search_check_2
            - generic [ref=e189]: فحص سيارات
          - link "format_paint سمكرة ودهان" [ref=e190] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=BODYWORK
            - generic [ref=e192]: format_paint
            - generic [ref=e193]: سمكرة ودهان
          - link "tune تعديل وتزويد" [ref=e194] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=MODIFICATION
            - generic [ref=e196]: tune
            - generic [ref=e197]: تعديل وتزويد
          - link "dashboard_customize تركيب إكسسوارات" [ref=e198] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=ACCESSORIES_INSTALL
            - generic [ref=e200]: dashboard_customize
            - generic [ref=e201]: تركيب إكسسوارات
          - link "key مفاتيح وأقفال" [ref=e202] [cursor=pointer]:
            - /url: /ar/browse/services?serviceType=KEYS_LOCKS
            - generic [ref=e204]: key
            - generic [ref=e205]: مفاتيح وأقفال
      - generic [ref=e208]:
        - generic [ref=e209]:
          - generic [ref=e210]:
            - heading "أحدث السيارات" [level=2] [ref=e213]
            - paragraph [ref=e214]: سيارات جديدة ومستعملة للبيع والإيجار في سلطنة عمان
          - link "عرض الكل ←" [ref=e215] [cursor=pointer]:
            - /url: /ar/cars/browse
        - generic [ref=e217]:
          - button "السابق" [ref=e218]:
            - img [ref=e219]
          - generic [ref=e221]:
            - generic [ref=e223] [cursor=pointer]:
              - generic [ref=e225]:
                - generic [ref=e226]:
                  - img [ref=e229]
                  - generic [ref=e233]: لا توجد صورة
                - generic [ref=e234]:
                  - img [ref=e235]
                  - text: للبيع
              - generic [ref=e237]:
                - heading "Toyota Camry 2022" [level=3] [ref=e239]
                - generic [ref=e240]:
                  - generic [ref=e241]:
                    - img [ref=e243]
                    - generic [ref=e245]: "2022"
                  - generic [ref=e246]:
                    - img [ref=e248]
                    - generic [ref=e251]: أوتوماتيك
                  - generic [ref=e252]:
                    - img [ref=e254]
                    - generic [ref=e260]: silver
                  - generic [ref=e261]:
                    - img [ref=e263]
                    - generic [ref=e266]: بنزين
                - separator [ref=e268]
                - generic [ref=e269]:
                  - generic [ref=e270]:
                    - img [ref=e271]
                    - generic [ref=e274]: عُمان، شمال الباطنة
                  - generic [ref=e275]:
                    - generic [ref=e276]: ر.ع
                    - generic [ref=e277]: 5,000
            - generic [ref=e279] [cursor=pointer]:
              - generic [ref=e280]:
                - generic [ref=e281]:
                  - img "Toyota Camry 2025" [ref=e282]
                  - generic [ref=e283]:
                    - img [ref=e284]
                    - text: للإيجار
                - generic [ref=e286]:
                  - button "Toyota Camry 2025 1" [ref=e287]
                  - button "Toyota Camry 2025 2" [ref=e288]
                  - button "Toyota Camry 2025 3" [ref=e289]
                  - button "Toyota Camry 2025 4" [ref=e290]
              - generic [ref=e291]:
                - heading "Toyota Camry 2025" [level=3] [ref=e293]
                - generic [ref=e294]:
                  - generic [ref=e295]:
                    - img [ref=e297]
                    - generic [ref=e299]: "2025"
                  - generic [ref=e300]:
                    - img [ref=e302]
                    - generic [ref=e305]: أوتوماتيك
                  - generic [ref=e306]:
                    - img [ref=e308]
                    - generic [ref=e314]: white
                  - generic [ref=e315]:
                    - img [ref=e317]
                    - generic [ref=e320]: بنزين
                - separator [ref=e321]
                - generic [ref=e322]:
                  - generic [ref=e323]:
                    - img [ref=e324]
                    - generic [ref=e327]: عُمان، شمال الباطنة
                  - generic [ref=e328]:
                    - generic [ref=e329]: ر.ع / يومياً
                    - generic [ref=e330]: "15"
            - generic [ref=e332] [cursor=pointer]:
              - generic [ref=e334]:
                - img "Audi Q7 2023" [ref=e335]
                - generic [ref=e336]:
                  - img [ref=e337]
                  - text: للبيع
              - generic [ref=e339]:
                - generic [ref=e340]:
                  - heading "Audi Q7 2023" [level=3] [ref=e341]
                  - generic [ref=e342]:
                    - generic [ref=e343]: verified
                    - text: موثق
                - generic [ref=e344]:
                  - generic [ref=e345]:
                    - img [ref=e347]
                    - generic [ref=e349]: "2023"
                  - generic [ref=e350]:
                    - img [ref=e352]
                    - generic [ref=e355]: أوتوماتيك
                  - generic [ref=e356]:
                    - img [ref=e358]
                    - generic [ref=e364]: كحلي
                  - generic [ref=e365]:
                    - img [ref=e367]
                    - generic [ref=e370]: بنزين
                - separator [ref=e372]
                - generic [ref=e373]:
                  - generic [ref=e374]:
                    - img [ref=e375]
                    - generic [ref=e378]: عُمان، مسقط
                  - generic [ref=e379]:
                    - generic [ref=e380]: ر.ع
                    - generic [ref=e381]: 24,000
            - generic [ref=e383] [cursor=pointer]:
              - generic [ref=e385]:
                - img "Kia K5 2023" [ref=e386]
                - generic [ref=e387]:
                  - img [ref=e388]
                  - text: للبيع
              - generic [ref=e390]:
                - generic [ref=e391]:
                  - heading "Kia K5 2023" [level=3] [ref=e392]
                  - generic [ref=e393]:
                    - generic [ref=e394]: verified
                    - text: موثق
                - generic [ref=e395]:
                  - generic [ref=e396]:
                    - img [ref=e398]
                    - generic [ref=e400]: "2023"
                  - generic [ref=e401]:
                    - img [ref=e403]
                    - generic [ref=e406]: أوتوماتيك
                  - generic [ref=e407]:
                    - img [ref=e409]
                    - generic [ref=e415]: رمادي داكن
                  - generic [ref=e416]:
                    - img [ref=e418]
                    - generic [ref=e421]: بنزين
                - separator [ref=e423]
                - generic [ref=e424]:
                  - generic [ref=e425]:
                    - img [ref=e426]
                    - generic [ref=e429]: عُمان، جنوب الباطنة
                  - generic [ref=e430]:
                    - generic [ref=e431]: ر.ع
                    - generic [ref=e432]: 6,800
    - contentinfo [ref=e673]:
      - generic [ref=e674]:
        - generic [ref=e675]:
          - generic [ref=e676]:
            - link "سوق وان" [ref=e677] [cursor=pointer]:
              - /url: /ar
              - img "سوق وان" [ref=e678]
            - paragraph [ref=e679]: المنصة الأولى في سلطنة عمان لبيع وشراء السيارات بكل ثقة وأمان.
            - generic [ref=e680]:
              - link "YouTube" [ref=e681] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e682]: smart_display
              - link "Instagram" [ref=e683] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e684]: photo_camera
              - link "Facebook" [ref=e685] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e686]: public
          - generic [ref=e687]:
            - heading "روابط سريعة" [level=4] [ref=e688]
            - list [ref=e689]:
              - listitem [ref=e690]:
                - link "الرئيسية" [ref=e691] [cursor=pointer]:
                  - /url: /ar
              - listitem [ref=e692]:
                - link "السيارات" [ref=e693] [cursor=pointer]:
                  - /url: /ar/cars
              - listitem [ref=e694]:
                - link "الحافلات" [ref=e695] [cursor=pointer]:
                  - /url: /ar/buses
              - listitem [ref=e696]:
                - link "المعدات" [ref=e697] [cursor=pointer]:
                  - /url: /ar/equipment
              - listitem [ref=e698]:
                - link "الوظائف" [ref=e699] [cursor=pointer]:
                  - /url: /ar/jobs
              - listitem [ref=e700]:
                - link "النقل" [ref=e701] [cursor=pointer]:
                  - /url: /ar/transport/browse
          - generic [ref=e702]:
            - heading "خدمات" [level=4] [ref=e703]
            - list [ref=e704]:
              - listitem [ref=e705]:
                - link "خدمات سيارات" [ref=e706] [cursor=pointer]:
                  - /url: /ar/browse/services
              - listitem [ref=e707]:
                - link "أضف إعلان" [ref=e708] [cursor=pointer]:
                  - /url: /ar/add-listing
          - generic [ref=e709]:
            - heading "تواصل معنا" [level=4] [ref=e710]
            - list [ref=e711]:
              - listitem [ref=e712]:
                - generic [ref=e713]: location_on
                - generic [ref=e714]: سلطنة عمان، مسقط، الغبرة الشمالية
              - listitem [ref=e715]:
                - generic [ref=e716]: call
                - generic [ref=e717]: +968 9999 0000
              - listitem [ref=e718]:
                - generic [ref=e719]: mail
                - generic [ref=e720]: info@souqone.com
        - generic [ref=e721]:
          - paragraph [ref=e722]: © 2026 سوق وان. جميع الحقوق محفوظة.
          - img "سوق وان" [ref=e723]
  - alert [ref=e724]
  - generic [ref=e727]:
    - img [ref=e729]
    - generic [ref=e856]:
      - heading "تسجيل الدخول" [level=2] [ref=e857]
      - paragraph [ref=e858]: أهلاً بك، سجّل دخولك للمتابعة
    - generic [ref=e860]:
      - generic [ref=e861]:
        - generic [ref=e862]:
          - generic [ref=e864]: البريد الإلكتروني
          - generic [ref=e865]:
            - textbox "البريد الإلكتروني" [ref=e866]: carrierNoProfile@souqone.om
            - generic: mail
        - generic [ref=e867]:
          - generic [ref=e868]:
            - generic [ref=e869]: كلمة المرور
            - button "نسيت كلمة المرور؟" [ref=e870]
          - generic [ref=e871]:
            - textbox "••••••••" [ref=e872]: Test1234
            - generic: lock
            - button "visibility" [ref=e873] [cursor=pointer]
        - generic [ref=e874]:
          - generic [ref=e875]: error
          - text: بيانات الدخول غير صحيحة
        - button "تسجيل الدخول login" [ref=e876] [cursor=pointer]:
          - text: تسجيل الدخول
          - generic [ref=e877]: login
      - generic [ref=e880]: أو
      - button "المتابعة مع Google" [disabled] [ref=e882]:
        - img [ref=e883]
        - text: المتابعة مع Google
      - paragraph [ref=e888]:
        - text: ليس لديك حساب؟
        - button "إنشاء حساب جديد" [ref=e889]
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
  33 |   await loginBtn.click();
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
> 47 |   await page.waitForFunction(
     |              ^ TimeoutError: page.waitForFunction: Timeout 30000ms exceeded.
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