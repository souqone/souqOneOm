# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: transport\02-security.spec.ts >> Security — AuthGuard (B3) >> B3: /transport/my-bookings requires authentication
- Location: e2e\transport\02-security.spec.ts:117:7

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /\/login/
Received string:  "https://souq-one-om-web.vercel.app/ar/transport/my-bookings"
```

# Page snapshot

```yaml
- generic [ref=e1]:
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
    - contentinfo [ref=e36]:
      - generic [ref=e37]:
        - generic [ref=e38]:
          - generic [ref=e39]:
            - link "سوق وان" [ref=e40] [cursor=pointer]:
              - /url: /ar
              - img "سوق وان" [ref=e41]
            - paragraph [ref=e42]: المنصة الأولى في سلطنة عمان لبيع وشراء السيارات بكل ثقة وأمان.
            - generic [ref=e43]:
              - link "YouTube" [ref=e44] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e45]: smart_display
              - link "Instagram" [ref=e46] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e47]: photo_camera
              - link "Facebook" [ref=e48] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e49]: public
          - generic [ref=e50]:
            - heading "روابط سريعة" [level=4] [ref=e51]
            - list [ref=e52]:
              - listitem [ref=e53]:
                - link "الرئيسية" [ref=e54] [cursor=pointer]:
                  - /url: /ar
              - listitem [ref=e55]:
                - link "السيارات" [ref=e56] [cursor=pointer]:
                  - /url: /ar/cars
              - listitem [ref=e57]:
                - link "الحافلات" [ref=e58] [cursor=pointer]:
                  - /url: /ar/buses
              - listitem [ref=e59]:
                - link "المعدات" [ref=e60] [cursor=pointer]:
                  - /url: /ar/equipment
              - listitem [ref=e61]:
                - link "الوظائف" [ref=e62] [cursor=pointer]:
                  - /url: /ar/jobs
              - listitem [ref=e63]:
                - link "النقل" [ref=e64] [cursor=pointer]:
                  - /url: /ar/transport/browse
          - generic [ref=e65]:
            - heading "خدمات" [level=4] [ref=e66]
            - list [ref=e67]:
              - listitem [ref=e68]:
                - link "خدمات سيارات" [ref=e69] [cursor=pointer]:
                  - /url: /ar/browse/services
              - listitem [ref=e70]:
                - link "أضف إعلان" [ref=e71] [cursor=pointer]:
                  - /url: /ar/add-listing
          - generic [ref=e72]:
            - heading "تواصل معنا" [level=4] [ref=e73]
            - list [ref=e74]:
              - listitem [ref=e75]:
                - generic [ref=e76]: location_on
                - generic [ref=e77]: سلطنة عمان، مسقط، الغبرة الشمالية
              - listitem [ref=e78]:
                - generic [ref=e79]: call
                - generic [ref=e80]: +968 9999 0000
              - listitem [ref=e81]:
                - generic [ref=e82]: mail
                - generic [ref=e83]: info@souqone.com
        - generic [ref=e84]:
          - paragraph [ref=e85]: © 2026 سوق وان. جميع الحقوق محفوظة.
          - img "سوق وان" [ref=e86]
  - alert [ref=e87]
  - generic [ref=e90]:
    - img [ref=e92]
    - generic [ref=e219]:
      - heading "تسجيل الدخول" [level=2] [ref=e220]
      - paragraph [ref=e221]: أهلاً بك، سجّل دخولك للمتابعة
    - generic [ref=e223]:
      - generic [ref=e224]:
        - generic [ref=e225]:
          - generic [ref=e227]: البريد الإلكتروني
          - generic [ref=e228]:
            - textbox "البريد الإلكتروني" [active] [ref=e229]
            - generic: mail
        - generic [ref=e230]:
          - generic [ref=e231]:
            - generic [ref=e232]: كلمة المرور
            - button "نسيت كلمة المرور؟" [ref=e233]
          - generic [ref=e234]:
            - textbox "••••••••" [ref=e235]
            - generic: lock
            - button "visibility" [ref=e236] [cursor=pointer]
        - button "تسجيل الدخول login" [ref=e237] [cursor=pointer]:
          - text: تسجيل الدخول
          - generic [ref=e238]: login
      - generic [ref=e241]: أو
      - button "المتابعة مع Google" [disabled] [ref=e243]:
        - img [ref=e244]
        - text: المتابعة مع Google
      - paragraph [ref=e249]:
        - text: ليس لديك حساب؟
        - button "إنشاء حساب جديد" [ref=e250]
```

# Test source

```ts
  20  |     await loginAs(page, 'other');
  21  |     await page.goto(`${BASE}/ar/transport/browse`);
  22  |     await page.waitForLoadState('networkidle');
  23  | 
  24  |     // Find shipper's request card (seed-tr-open-001)
  25  |     const shipperCard = page.locator(`a[href*="${SEED_IDS.openRequest}"]`).first();
  26  |     await expect(shipperCard).toBeVisible({ timeout: 20000 });
  27  |     const editBtn = shipperCard.locator('button, a').filter({ hasText: /تعديل|edit/i });
  28  |     await expect(editBtn).toHaveCount(0);
  29  |   });
  30  | 
  31  |   test('N1-c: Anonymous user sees NO edit button in browse', async ({ page }) => {
  32  |     await page.goto(`${BASE}/ar/transport/browse`);
  33  |     await page.waitForLoadState('networkidle');
  34  |     const editButtons = page.getByRole('button', { name: /تعديل|edit/i });
  35  |     await expect(editButtons).toHaveCount(0);
  36  |   });
  37  | });
  38  | 
  39  | test.describe('Security — Edit Page Access (N2)', () => {
  40  |   test('N2-a: Anonymous cannot access edit page (redirect or show request view)', async ({ page }) => {
  41  |     await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}/edit`);
  42  |     await page.waitForLoadState('networkidle');
  43  |     // App either redirects to /login OR falls back to request view — both are acceptable
  44  |     // What's NOT acceptable is showing the actual edit form to anonymous user
  45  |     const editForm = page.locator('form').filter({ has: page.locator('input[name="cargoDescription"], textarea[name="cargoDescription"]') });
  46  |     const hasEditForm = await editForm.isVisible({ timeout: 5000 }).catch(() => false);
  47  |     expect(hasEditForm).toBeFalsy();
  48  |   });
  49  | 
  50  |   test('N2-b: Non-owner gets 403 or redirected from edit page', async ({ page }) => {
  51  |     await loginAs(page, 'other');
  52  |     await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}/edit`);
  53  |     await page.waitForLoadState('networkidle');
  54  |     expect(page.url()).not.toContain('/edit');
  55  |   });
  56  | 
  57  |   test('N2-c: Owner can access edit page', async ({ page }) => {
  58  |     await loginAs(page, 'shipper');
  59  |     await page.goto(`${BASE}/ar/transport/requests/${SEED_IDS.openRequest}/edit`);
  60  |     await page.waitForLoadState('networkidle');
  61  |     // Should NOT redirect to login
  62  |     expect(page.url()).not.toMatch(/\/login/);
  63  |   });
  64  | });
  65  | 
  66  | test.describe('Security — API Ownership (N3)', () => {
  67  |   test('N3: PATCH request by non-owner returns 401 or 403', async ({ page }) => {
  68  |     await loginAs(page, 'other');
  69  |     // Use the same origin as the web app (Next.js proxies API calls)
  70  |     const apiBase = BASE.replace(/\/$/, '');
  71  | 
  72  |     const cookies = await page.context().cookies();
  73  |     const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  74  | 
  75  |     const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  76  | 
  77  |     const response = await page.request.patch(
  78  |       `${apiBase}/api/transport/requests/${SEED_IDS.openRequest}`,
  79  |       {
  80  |         headers: {
  81  |           Authorization: token ? `Bearer ${token}` : '',
  82  |           'Content-Type': 'application/json',
  83  |           Cookie: cookieStr,
  84  |         },
  85  |         data: { cargoDescription: 'HIJACKED BY NON-OWNER' },
  86  |       }
  87  |     );
  88  | 
  89  |     expect([401, 403, 404]).toContain(response.status());
  90  |   });
  91  | 
  92  |   test('N3: PATCH request without auth returns 401', async ({ page }) => {
  93  |     const apiBase = BASE.replace(/\/$/, '');
  94  |     const response = await page.request.patch(
  95  |       `${apiBase}/api/transport/requests/${SEED_IDS.openRequest}`,
  96  |       {
  97  |         data: { cargoDescription: 'HIJACKED ANONYMOUS' },
  98  |       }
  99  |     );
  100 |     expect([401, 403]).toContain(response.status());
  101 |   });
  102 | });
  103 | 
  104 | test.describe('Security — AuthGuard (B3)', () => {
  105 |   test('B3: /transport/my-quotes requires authentication', async ({ page }) => {
  106 |     await page.goto(`${BASE}/ar/transport/my-quotes`);
  107 |     await page.waitForLoadState('networkidle');
  108 |     expect(page.url()).toMatch(/\/login/);
  109 |   });
  110 | 
  111 |   test('B3: /transport/my-requests requires authentication', async ({ page }) => {
  112 |     await page.goto(`${BASE}/ar/transport/my-requests`);
  113 |     await page.waitForLoadState('networkidle');
  114 |     expect(page.url()).toMatch(/\/login/);
  115 |   });
  116 | 
  117 |   test('B3: /transport/my-bookings requires authentication', async ({ page }) => {
  118 |     await page.goto(`${BASE}/ar/transport/my-bookings`);
  119 |     await page.waitForLoadState('networkidle');
> 120 |     expect(page.url()).toMatch(/\/login/);
      |                        ^ Error: expect(received).toMatch(expected)
  121 |   });
  122 | });
  123 | 
```