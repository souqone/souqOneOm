# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: unified-search.spec.ts >> Unified Search Engine (Global Browse) >> Empty search state displays trending and fallback suggestions
- Location: e2e\unified-search.spec.ts:41:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('لا توجد نتائج مطابقة')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('لا توجد نتائج مطابقة')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e7]:
        - generic [ref=e8]:
          - link "SouqOne" [ref=e9] [cursor=pointer]:
            - /url: /en
            - img "SouqOne" [ref=e10]
          - button "language عربي" [ref=e11]:
            - generic [ref=e12]: language
            - generic [ref=e13]: عربي
          - button "Switch to dark mode" [ref=e14]:
            - generic [ref=e15]: dark_mode
        - navigation [ref=e17]:
          - link "Home" [ref=e19] [cursor=pointer]:
            - /url: /en
            - text: Home
          - link "Cars" [ref=e21] [cursor=pointer]:
            - /url: /en/motors
            - text: Cars
          - link "Buses" [ref=e23] [cursor=pointer]:
            - /url: /en/browse/buses
            - text: Buses
          - link "Equipment" [ref=e25] [cursor=pointer]:
            - /url: /en/equipment
            - text: Equipment
          - link "Jobs" [ref=e27] [cursor=pointer]:
            - /url: /en/jobs
            - text: Jobs
        - generic [ref=e28]:
          - button "search" [ref=e29]:
            - generic [ref=e30]: search
          - link "favorite" [ref=e31] [cursor=pointer]:
            - /url: /en/favorites
            - generic [ref=e32]: favorite
          - generic [ref=e34]:
            - button "person Login" [ref=e35]:
              - generic [ref=e36]: person
              - text: Login
            - button "Register" [ref=e37]
      - generic [ref=e39]:
        - generic [ref=e40]:
          - button "All expand_more" [ref=e42]:
            - text: All
            - generic [ref=e43]: expand_more
          - textbox "Search SouqOne..." [ref=e45]
          - button "search" [ref=e46]:
            - generic [ref=e47]: search
        - link "add Add Listing" [ref=e48] [cursor=pointer]:
          - /url: /en/add-listing
          - generic [ref=e49]: add
          - generic [ref=e50]: Add Listing
    - generic [ref=e52]:
      - generic [ref=e53]:
        - img [ref=e55]
        - heading "Results for \"9999999999XYZ\"" [level=1] [ref=e58]
      - generic [ref=e59]:
        - textbox "ابحث عن سيارات، قطع، خدمات، وظائف..." [ref=e60]: 9999999999XYZ
        - button [ref=e61]:
          - img [ref=e62]
        - button [ref=e65]:
          - img [ref=e66]
      - generic [ref=e70]:
        - button "grid_view الكل" [ref=e71]:
          - generic [ref=e72]: grid_view
          - generic [ref=e73]: الكل
        - button "directions_car سيارات" [ref=e74]:
          - generic [ref=e75]: directions_car
          - generic [ref=e76]: سيارات
        - button "directions_bus حافلات" [ref=e77]:
          - generic [ref=e78]: directions_bus
          - generic [ref=e79]: حافلات
        - button "settings قطع غيار" [ref=e80]:
          - generic [ref=e81]: settings
          - generic [ref=e82]: قطع غيار
        - button "build خدمات" [ref=e83]:
          - generic [ref=e84]: build
          - generic [ref=e85]: خدمات
        - button "work وظائف" [ref=e86]:
          - generic [ref=e87]: work
          - generic [ref=e88]: وظائف
    - generic [ref=e89]:
      - complementary [ref=e90]:
        - generic [ref=e91]:
          - generic [ref=e93]:
            - img [ref=e94]
            - text: Filters
          - generic [ref=e95]:
            - generic [ref=e96]:
              - button "المحافظة" [ref=e97] [cursor=pointer]:
                - generic [ref=e98]: المحافظة
                - img [ref=e99]
              - generic [ref=e104]:
                - button "All" [ref=e105] [cursor=pointer]
                - button "مسقط" [ref=e106] [cursor=pointer]
                - button "ظفار" [ref=e107] [cursor=pointer]
                - button "الداخلية" [ref=e108] [cursor=pointer]
                - button "شمال الباطنة" [ref=e109] [cursor=pointer]
                - button "جنوب الباطنة" [ref=e110] [cursor=pointer]
                - button "شمال الشرقية" [ref=e111] [cursor=pointer]
                - button "جنوب الشرقية" [ref=e112] [cursor=pointer]
                - button "الظاهرة" [ref=e113] [cursor=pointer]
                - button "البريمي" [ref=e114] [cursor=pointer]
                - button "الوسطى" [ref=e115] [cursor=pointer]
                - button "مسندم" [ref=e116] [cursor=pointer]
            - generic [ref=e117]:
              - button "السعر" [ref=e118] [cursor=pointer]:
                - generic [ref=e119]: السعر
                - img [ref=e120]
              - generic [ref=e125]:
                - generic [ref=e126]:
                  - generic [ref=e127]: 0 ر.ع
                  - generic [ref=e128]: —
                  - generic [ref=e129]: ١٠٠k ر.ع
                - generic [ref=e130]:
                  - slider "الحد الأدنى" [ref=e134]
                  - slider "الحد الأقصى" [ref=e136]
      - main [ref=e137]:
        - generic [ref=e138]:
          - generic [ref=e139]: ٠ listing
          - generic [ref=e140]:
            - generic [ref=e141]: "Sort:"
            - combobox [ref=e142] [cursor=pointer]:
              - option "الأكثر صلة" [selected]
              - option "الأحدث"
              - 'option "السعر: الأقل"'
              - 'option "السعر: الأعلى"'
        - generic [ref=e143]:
          - img [ref=e145]
          - heading "No results found" [level=3] [ref=e150]
          - paragraph [ref=e151]: Try changing or clearing your filters for more results
          - generic [ref=e153]:
            - generic [ref=e154]:
              - img [ref=e155]
              - generic [ref=e158]: الأكثر بحثاً
            - generic [ref=e159]:
              - button "تويوتا" [ref=e160]
              - button "لاندكروزر" [ref=e161]
              - button "إيجار" [ref=e162]
              - button "صيانة" [ref=e163]
              - button "سائق" [ref=e164]
    - contentinfo [ref=e165]:
      - generic [ref=e167]:
        - generic [ref=e168]:
          - generic [ref=e169]:
            - link "SouqOne" [ref=e170] [cursor=pointer]:
              - /url: /en
              - img "SouqOne" [ref=e171]
            - paragraph [ref=e172]: Oman's leading platform for buying and selling cars with confidence.
          - generic [ref=e173]:
            - heading "Quick Links" [level=4] [ref=e174]
            - list [ref=e175]:
              - listitem [ref=e176]:
                - link "Home" [ref=e177] [cursor=pointer]:
                  - /url: /en
              - listitem [ref=e178]:
                - link "Cars for Sale" [ref=e179] [cursor=pointer]:
                  - /url: /en/browse/cars
              - listitem [ref=e180]:
                - link "Cars for Rent" [ref=e181] [cursor=pointer]:
                  - /url: /en/browse/cars?listingType=RENTAL
              - listitem [ref=e182]:
                - link "Spare Parts" [ref=e183] [cursor=pointer]:
                  - /url: /en/browse/parts
              - listitem [ref=e184]:
                - link "Driver Jobs" [ref=e185] [cursor=pointer]:
                  - /url: /en/jobs
          - generic [ref=e186]:
            - heading "Services" [level=4] [ref=e187]
            - list [ref=e188]:
              - listitem [ref=e189]:
                - link "Car Services" [ref=e190] [cursor=pointer]:
                  - /url: /en/browse/services
              - listitem [ref=e191]:
                - link "Add Listing" [ref=e192] [cursor=pointer]:
                  - /url: /en/add-listing
          - generic [ref=e193]:
            - heading "Contact Us" [level=4] [ref=e194]
            - list [ref=e195]:
              - listitem [ref=e196]:
                - generic [ref=e197]: location_on
                - generic [ref=e198]: Sultanate of Oman, Muscat, Al Ghubra
              - listitem [ref=e199]:
                - generic [ref=e200]: call
                - generic [ref=e201]: +968 9999 0000
              - listitem [ref=e202]:
                - generic [ref=e203]: mail
                - generic [ref=e204]: info@souqone.com
            - generic [ref=e205]:
              - link "YouTube" [ref=e206] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e207]: smart_display
              - link "Instagram" [ref=e208] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e209]: photo_camera
              - link "Facebook" [ref=e210] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e211]: public
        - generic [ref=e212]:
          - generic [ref=e213]:
            - generic [ref=e214]: © 2026
            - img "SouqOne" [ref=e215]
            - generic [ref=e216]: . All rights reserved.
          - img "SouqOne" [ref=e217]
  - button "Open Next.js Dev Tools" [ref=e223] [cursor=pointer]:
    - img [ref=e224]
  - alert [ref=e227]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Unified Search Engine (Global Browse)', () => {
  4  | 
  5  |   test('Navbar search redirects to /browse with query param', async ({ page }) => {
  6  |     // Go to homepage
  7  |     await page.goto('/');
  8  | 
  9  |     // Wait for the navbar to be visible and type a search query
  10 |     const searchInput = page.locator('form input[type="text"]').first();
  11 |     await searchInput.waitFor({ state: 'visible' });
  12 |     
  13 |     // Type and press Enter
  14 |     await searchInput.fill('تويوتا');
  15 |     await searchInput.press('Enter');
  16 | 
  17 |     // Verify URL
  18 |     await expect(page).toHaveURL(/\/browse\?q=%D8%AA%D9%88%D9%8A%D9%88%D8%AA%D8%A7/); // %D8%AA%D9%88%D9%8A%D9%88%D8%AA%D8%A7 is URL encoded "تويوتا"
  19 | 
  20 |     // Wait for the results header to appear
  21 |     await expect(page.getByRole('heading', { level: 1 })).toContainText('تويوتا');
  22 |   });
  23 | 
  24 |   test('Federated View displays tabs and clears category filters when switching', async ({ page }) => {
  25 |     // Go to a specific category search with a category-specific filter
  26 |     // Category: cars, Make: Toyota
  27 |     await page.goto('/browse?category=cars&make=Toyota');
  28 | 
  29 |     // Wait for the page to load
  30 |     await expect(page.getByRole('heading', { level: 1 })).toContainText('سيارات');
  31 | 
  32 |     // Click the "وظائف" (Jobs) tab
  33 |     const jobsTab = page.getByRole('button', { name: 'وظائف' });
  34 |     await jobsTab.waitFor({ state: 'visible' });
  35 |     await jobsTab.click();
  36 | 
  37 |     // Verify URL: it should have category=jobs, but make=Toyota MUST BE REMOVED.
  38 |     await expect(page).toHaveURL(/\/browse\?category=jobs$/);
  39 |   });
  40 | 
  41 |   test('Empty search state displays trending and fallback suggestions', async ({ page }) => {
  42 |     // Navigate to a browse page that definitely has no results
  43 |     await page.goto('/browse?q=9999999999XYZ');
  44 | 
  45 |     // Verify no results message appears
> 46 |     await expect(page.getByText('لا توجد نتائج مطابقة')).toBeVisible();
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  47 | 
  48 |     // Verify trending searches appear
  49 |     await expect(page.getByText('الأكثر بحثاً')).toBeVisible();
  50 |     await expect(page.getByRole('button', { name: 'تويوتا' })).toBeVisible();
  51 |   });
  52 | 
  53 | });
  54 | 
```