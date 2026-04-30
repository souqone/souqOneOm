# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: unified-search.spec.ts >> Unified Search Engine (Global Browse) >> Navbar search redirects to /browse with query param
- Location: e2e\unified-search.spec.ts:5:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/browse\?q=%D8%AA%D9%88%D9%8A%D9%88%D8%AA%D8%A7/
Received string:  "http://localhost:3000/en"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    8 × unexpected value "http://localhost:3000/en"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - link "SouqOne" [ref=e8] [cursor=pointer]:
            - /url: /en
            - img "SouqOne" [ref=e9]
          - button "language عربي" [ref=e10]:
            - generic [ref=e11]: language
            - generic [ref=e12]: عربي
          - button "Switch to dark mode" [ref=e13]:
            - generic [ref=e14]: dark_mode
        - navigation [ref=e16]:
          - link "Home" [ref=e18] [cursor=pointer]:
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
          - textbox "Search SouqOne..." [active] [ref=e45]: تويوتا
          - button "search" [ref=e46]:
            - generic [ref=e47]: search
        - link "add Add Listing" [ref=e48] [cursor=pointer]:
          - /url: /en/add-listing
          - generic [ref=e49]: add
          - generic [ref=e50]: Add Listing
    - main [ref=e51]:
      - generic [ref=e52]:
        - generic [ref=e55]:
          - button "location_on All Oman expand_more" [ref=e56]:
            - generic [ref=e57]: location_on
            - generic [ref=e58]: All Oman
            - generic [ref=e59]: expand_more
          - textbox "Search for cars, buses, jobs, services.." [ref=e60]
          - button "search" [ref=e61]:
            - generic [ref=e62]: search
        - generic [ref=e64]:
          - img "سوق وان" [ref=e65]
          - img "سوق وان" [ref=e66]
          - generic [ref=e68]:
            - button [ref=e69]
            - button [ref=e70]
          - generic [ref=e71]:
            - 'heading "Oman''s #1 Platform" [level=1] [ref=e72]'
            - paragraph [ref=e73]: For cars, buses, equipment, services & user companies
            - generic [ref=e74]:
              - link "add_circle Post Your Listing" [ref=e75] [cursor=pointer]:
                - /url: /en/add-listing
                - generic [ref=e76]: add_circle
                - text: Post Your Listing
              - link "explore Explore Listings" [ref=e77] [cursor=pointer]:
                - /url: /en/browse/cars
                - generic [ref=e78]: explore
                - text: Explore Listings
            - generic [ref=e79]:
              - generic [ref=e80]:
                - generic [ref=e81]: verified_user
                - text: Trusted & Safe
              - generic [ref=e82]:
                - generic [ref=e83]: bolt
                - text: Fast & Easy
              - generic [ref=e84]:
                - generic [ref=e85]: workspace_premium
                - text: Free & Guaranteed
      - generic [ref=e87]:
        - heading "Most Popular Categories" [level=2] [ref=e90]
        - generic [ref=e91]:
          - link "Cars Cars Buy & Rent" [ref=e92] [cursor=pointer]:
            - /url: /en/browse/cars
            - img "Cars" [ref=e95]
            - generic [ref=e96]:
              - heading "Cars" [level=3] [ref=e97]
              - paragraph [ref=e98]: Buy & Rent
          - link "Buses Buses Sale, rental & contracts" [ref=e99] [cursor=pointer]:
            - /url: /en/browse/buses
            - img "Buses" [ref=e102]
            - generic [ref=e103]:
              - heading "Buses" [level=3] [ref=e104]
              - paragraph [ref=e105]: Sale, rental & contracts
          - link "Spare Parts Spare Parts OEM & Aftermarket" [ref=e106] [cursor=pointer]:
            - /url: /en/browse/parts
            - img "Spare Parts" [ref=e109]
            - generic [ref=e110]:
              - heading "Spare Parts" [level=3] [ref=e111]
              - paragraph [ref=e112]: OEM & Aftermarket
          - link "Car Services Car Services Maintenance & Inspection" [ref=e113] [cursor=pointer]:
            - /url: /en/browse/services
            - img "Car Services" [ref=e116]
            - generic [ref=e117]:
              - heading "Car Services" [level=3] [ref=e118]
              - paragraph [ref=e119]: Maintenance & Inspection
          - link "Heavy Equipment Heavy Equipment Buy & Rent" [ref=e120] [cursor=pointer]:
            - /url: /en/browse/equipment
            - img "Heavy Equipment" [ref=e123]
            - generic [ref=e124]:
              - heading "Heavy Equipment" [level=3] [ref=e125]
              - paragraph [ref=e126]: Buy & Rent
          - link "Jobs Jobs Drivers & Companies" [ref=e127] [cursor=pointer]:
            - /url: /en/browse/jobs
            - img "Jobs" [ref=e130]
            - generic [ref=e131]:
              - heading "Jobs" [level=3] [ref=e132]
              - paragraph [ref=e133]: Drivers & Companies
          - link "Car Rental Car Rental Daily & monthly" [ref=e134] [cursor=pointer]:
            - /url: /en/browse/cars?listingType=RENTAL
            - img "Car Rental" [ref=e137]
            - generic [ref=e138]:
              - heading "Car Rental" [level=3] [ref=e139]
              - paragraph [ref=e140]: Daily & monthly
      - generic [ref=e141]:
        - generic [ref=e142]:
          - heading "Quick Services Near You" [level=2] [ref=e145]
          - generic [ref=e146]:
            - generic [ref=e147]:
              - button "Scroll start" [disabled] [ref=e148]:
                - img [ref=e149]
              - button "Scroll end" [ref=e151]:
                - img [ref=e152]
            - link "Services →" [ref=e154] [cursor=pointer]:
              - /url: /en/browse/services
        - generic [ref=e155]:
          - link "electrical_services Car Electrician" [ref=e156] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=MAINTENANCE
            - generic [ref=e158]: electrical_services
            - generic [ref=e159]: Car Electrician
          - link "oil_barrel Oil Change" [ref=e160] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=MAINTENANCE
            - generic [ref=e162]: oil_barrel
            - generic [ref=e163]: Oil Change
          - link "car_crash Towing & Recovery" [ref=e164] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=TOWING
            - generic [ref=e166]: car_crash
            - generic [ref=e167]: Towing & Recovery
          - link "tire_repair Mobile Tire" [ref=e168] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=MAINTENANCE
            - generic [ref=e170]: tire_repair
            - generic [ref=e171]: Mobile Tire
          - link "battery_charging_full Mobile Battery" [ref=e172] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=MAINTENANCE
            - generic [ref=e174]: battery_charging_full
            - generic [ref=e175]: Mobile Battery
          - link "local_car_wash Car Wash & Polish" [ref=e176] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=CLEANING
            - generic [ref=e178]: local_car_wash
            - generic [ref=e179]: Car Wash & Polish
          - link "build Maintenance & Repair" [ref=e180] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=MAINTENANCE
            - generic [ref=e182]: build
            - generic [ref=e183]: Maintenance & Repair
          - link "search_check_2 Car Inspection" [ref=e184] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=INSPECTION
            - generic [ref=e186]: search_check_2
            - generic [ref=e187]: Car Inspection
          - link "format_paint Body & Paint" [ref=e188] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=BODYWORK
            - generic [ref=e190]: format_paint
            - generic [ref=e191]: Body & Paint
          - link "tune Modification" [ref=e192] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=MODIFICATION
            - generic [ref=e194]: tune
            - generic [ref=e195]: Modification
          - link "dashboard_customize Accessories" [ref=e196] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=ACCESSORIES_INSTALL
            - generic [ref=e198]: dashboard_customize
            - generic [ref=e199]: Accessories
          - link "key Keys & Locks" [ref=e200] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=KEYS_LOCKS
            - generic [ref=e202]: key
            - generic [ref=e203]: Keys & Locks
      - generic [ref=e206]:
        - generic [ref=e207]:
          - generic [ref=e208]:
            - heading "Latest Cars" [level=2] [ref=e211]
            - paragraph [ref=e212]: New and used cars for sale and rent in Oman
          - link "View All →" [ref=e213] [cursor=pointer]:
            - /url: /en/browse/cars
        - generic [ref=e215]:
          - generic [ref=e216] [cursor=pointer]:
            - generic [ref=e218]:
              - img "Audi Q7 2023" [ref=e219]
              - generic [ref=e220]: For Sale
            - generic [ref=e221]:
              - generic [ref=e222]:
                - heading "Audi Q7 2023" [level=3] [ref=e223]
                - generic [ref=e224]:
                  - generic [ref=e225]: verified
                  - text: موثق
              - generic [ref=e226]:
                - generic [ref=e227]:
                  - img [ref=e229]
                  - generic [ref=e232]: Used
                - generic [ref=e233]:
                  - img [ref=e235]
                  - generic [ref=e237]: "2023"
                - generic [ref=e238]:
                  - img [ref=e240]
                  - generic [ref=e243]: 22,000 km
                - generic [ref=e244]:
                  - img [ref=e246]
                  - generic [ref=e249]: Automatic
                - generic [ref=e250]:
                  - img [ref=e252]
                  - generic [ref=e255]: Petrol
              - separator [ref=e257]
              - generic [ref=e258]:
                - generic [ref=e259]:
                  - img [ref=e260]
                  - generic [ref=e263]: Oman، Muscat
                - generic [ref=e264]: 24,000 ر.ع
          - generic [ref=e265] [cursor=pointer]:
            - generic [ref=e267]:
              - img "Kia K5 2023" [ref=e268]
              - generic [ref=e269]: For Sale
            - generic [ref=e270]:
              - generic [ref=e271]:
                - heading "Kia K5 2023" [level=3] [ref=e272]
                - generic [ref=e273]:
                  - generic [ref=e274]: verified
                  - text: موثق
              - generic [ref=e275]:
                - generic [ref=e276]:
                  - img [ref=e278]
                  - generic [ref=e281]: Used
                - generic [ref=e282]:
                  - img [ref=e284]
                  - generic [ref=e286]: "2023"
                - generic [ref=e287]:
                  - img [ref=e289]
                  - generic [ref=e292]: 15,000 km
                - generic [ref=e293]:
                  - img [ref=e295]
                  - generic [ref=e298]: Automatic
                - generic [ref=e299]:
                  - img [ref=e301]
                  - generic [ref=e304]: Petrol
              - separator [ref=e306]
              - generic [ref=e307]:
                - generic [ref=e308]:
                  - img [ref=e309]
                  - generic [ref=e312]: Oman، South Al Batinah
                - generic [ref=e313]: 6,800 ر.ع
          - generic [ref=e314] [cursor=pointer]:
            - generic [ref=e316]:
              - img "Hyundai Tucson 2024" [ref=e317]
              - generic [ref=e318]: For Sale
            - generic [ref=e319]:
              - generic [ref=e320]:
                - heading "Hyundai Tucson 2024" [level=3] [ref=e321]
                - generic [ref=e322]:
                  - generic [ref=e323]: verified
                  - text: موثق
              - generic [ref=e324]:
                - generic [ref=e325]:
                  - img [ref=e327]
                  - generic [ref=e330]: New
                - generic [ref=e331]:
                  - img [ref=e333]
                  - generic [ref=e335]: "2024"
                - generic [ref=e336]:
                  - img [ref=e338]
                  - generic [ref=e341]: Automatic
                - generic [ref=e342]:
                  - img [ref=e344]
                  - generic [ref=e347]: Petrol
                - generic [ref=e348]:
                  - img [ref=e350]
                  - generic [ref=e354]: SUV
              - separator [ref=e356]
              - generic [ref=e357]:
                - generic [ref=e358]:
                  - img [ref=e359]
                  - generic [ref=e362]: Oman، Ad Dakhiliyah
                - generic [ref=e363]: 8,500 ر.ع
          - generic [ref=e364] [cursor=pointer]:
            - generic [ref=e366]:
              - img "Porsche Cayenne GTS 2022" [ref=e367]
              - generic [ref=e368]: For Sale
              - generic [ref=e369]:
                - img [ref=e370]
                - text: Featured
            - generic [ref=e372]:
              - generic [ref=e373]:
                - heading "Porsche Cayenne GTS 2022" [level=3] [ref=e374]
                - generic [ref=e375]:
                  - generic [ref=e376]: verified
                  - text: موثق
              - generic [ref=e377]:
                - generic [ref=e378]:
                  - img [ref=e380]
                  - generic [ref=e383]: Good
                - generic [ref=e384]:
                  - img [ref=e386]
                  - generic [ref=e388]: "2022"
                - generic [ref=e389]:
                  - img [ref=e391]
                  - generic [ref=e394]: 30,000 km
                - generic [ref=e395]:
                  - img [ref=e397]
                  - generic [ref=e400]: Automatic
                - generic [ref=e401]:
                  - img [ref=e403]
                  - generic [ref=e406]: Petrol
              - separator [ref=e407]
              - generic [ref=e408]:
                - generic [ref=e409]:
                  - img [ref=e410]
                  - generic [ref=e413]: Oman، Muscat
                - generic [ref=e414]: 38,000 ر.ع
    - contentinfo [ref=e655]:
      - generic [ref=e657]:
        - generic [ref=e658]:
          - generic [ref=e659]:
            - link "SouqOne" [ref=e660] [cursor=pointer]:
              - /url: /en
              - img "SouqOne" [ref=e661]
            - paragraph [ref=e662]: Oman's leading platform for buying and selling cars with confidence.
          - generic [ref=e663]:
            - heading "Quick Links" [level=4] [ref=e664]
            - list [ref=e665]:
              - listitem [ref=e666]:
                - link "Home" [ref=e667] [cursor=pointer]:
                  - /url: /en
              - listitem [ref=e668]:
                - link "Cars for Sale" [ref=e669] [cursor=pointer]:
                  - /url: /en/browse/cars
              - listitem [ref=e670]:
                - link "Cars for Rent" [ref=e671] [cursor=pointer]:
                  - /url: /en/browse/cars?listingType=RENTAL
              - listitem [ref=e672]:
                - link "Spare Parts" [ref=e673] [cursor=pointer]:
                  - /url: /en/browse/parts
              - listitem [ref=e674]:
                - link "Driver Jobs" [ref=e675] [cursor=pointer]:
                  - /url: /en/jobs
          - generic [ref=e676]:
            - heading "Services" [level=4] [ref=e677]
            - list [ref=e678]:
              - listitem [ref=e679]:
                - link "Car Services" [ref=e680] [cursor=pointer]:
                  - /url: /en/browse/services
              - listitem [ref=e681]:
                - link "Add Listing" [ref=e682] [cursor=pointer]:
                  - /url: /en/add-listing
          - generic [ref=e683]:
            - heading "Contact Us" [level=4] [ref=e684]
            - list [ref=e685]:
              - listitem [ref=e686]:
                - generic [ref=e687]: location_on
                - generic [ref=e688]: Sultanate of Oman, Muscat, Al Ghubra
              - listitem [ref=e689]:
                - generic [ref=e690]: call
                - generic [ref=e691]: +968 9999 0000
              - listitem [ref=e692]:
                - generic [ref=e693]: mail
                - generic [ref=e694]: info@souqone.com
            - generic [ref=e695]:
              - link "YouTube" [ref=e696] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e697]: smart_display
              - link "Instagram" [ref=e698] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e699]: photo_camera
              - link "Facebook" [ref=e700] [cursor=pointer]:
                - /url: "#"
                - generic [ref=e701]: public
        - generic [ref=e702]:
          - generic [ref=e703]:
            - generic [ref=e704]: © 2026
            - img "SouqOne" [ref=e705]
            - generic [ref=e706]: . All rights reserved.
          - img "SouqOne" [ref=e707]
  - button "Open Next.js Dev Tools" [ref=e713] [cursor=pointer]:
    - img [ref=e714]
  - alert [ref=e717]
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
> 18 |     await expect(page).toHaveURL(/\/browse\?q=%D8%AA%D9%88%D9%8A%D9%88%D8%AA%D8%A7/); // %D8%AA%D9%88%D9%8A%D9%88%D8%AA%D8%A7 is URL encoded "تويوتا"
     |                        ^ Error: expect(page).toHaveURL(expected) failed
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
  46 |     await expect(page.getByText('لا توجد نتائج مطابقة')).toBeVisible();
  47 | 
  48 |     // Verify trending searches appear
  49 |     await expect(page.getByText('الأكثر بحثاً')).toBeVisible();
  50 |     await expect(page.getByRole('button', { name: 'تويوتا' })).toBeVisible();
  51 |   });
  52 | 
  53 | });
  54 | 
```