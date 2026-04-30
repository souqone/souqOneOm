# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: unified-search.spec.ts >> Unified Search Engine (Global Browse) >> Navbar search redirects to /browse with query param
- Location: e2e\unified-search.spec.ts:5:7

# Error details

```
TimeoutError: page.goto: Timeout 60000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e6]:
        - button "menu" [ref=e8]:
          - generic [ref=e9]: menu
        - link "SouqOne" [ref=e11] [cursor=pointer]:
          - /url: /en
          - img "SouqOne" [ref=e12]
        - generic [ref=e14]:
          - link "notifications" [ref=e15] [cursor=pointer]:
            - /url: /en/notifications
            - generic [ref=e16]: notifications
          - link "favorite" [ref=e17] [cursor=pointer]:
            - /url: /en/favorites
            - generic [ref=e18]: favorite
      - generic [ref=e20]:
        - generic [ref=e21]:
          - button "All expand_more" [ref=e23]:
            - text: All
            - generic [ref=e24]: expand_more
          - textbox "Search SouqOne..." [ref=e26]
          - button "search" [ref=e27]:
            - generic [ref=e28]: search
        - link "add" [ref=e29] [cursor=pointer]:
          - /url: /en/add-listing
          - generic [ref=e30]: add
    - complementary [ref=e31]:
      - generic [ref=e32]:
        - img "SouqOne" [ref=e34]
        - button "close" [ref=e35]:
          - generic [ref=e36]: close
      - generic [ref=e37]:
        - paragraph [ref=e38]: Browse
        - link "Home" [ref=e40] [cursor=pointer]:
          - /url: /en
          - text: Home
        - button "Cars chevron_left" [ref=e43]:
          - generic [ref=e44]: Cars
          - generic [ref=e46]: chevron_left
        - button "Buses chevron_left" [ref=e48]:
          - generic [ref=e49]: Buses
          - generic [ref=e51]: chevron_left
        - button "Equipment chevron_left" [ref=e53]:
          - generic [ref=e54]: Equipment
          - generic [ref=e56]: chevron_left
        - button "Jobs chevron_left" [ref=e58]:
          - generic [ref=e59]: Jobs
          - generic [ref=e61]: chevron_left
        - generic [ref=e62]:
          - button "Create Free Account" [ref=e63]
          - button "Login" [ref=e64]
      - generic [ref=e66]:
        - generic [ref=e67]: Settings
        - button "language عربي" [ref=e69]:
          - generic [ref=e70]: language
          - generic [ref=e71]: عربي
      - paragraph [ref=e74]: Oman's leading platform for buying and selling cars with confidence.
    - main [ref=e75]:
      - generic [ref=e76]:
        - generic [ref=e79]:
          - button "location_on All Oman expand_more" [ref=e80]:
            - generic [ref=e81]: location_on
            - generic [ref=e82]: All Oman
            - generic [ref=e83]: expand_more
          - textbox "Search for cars, buses, jobs, services.." [ref=e84]
          - button "search" [ref=e85]:
            - generic [ref=e86]: search
        - generic [ref=e88]:
          - img "سوق وان" [ref=e89]
          - img "سوق وان" [ref=e90]
          - generic [ref=e92]:
            - button [ref=e93]
            - button [ref=e94]
          - generic [ref=e95]:
            - 'heading "Oman''s #1 Platform" [level=1] [ref=e96]'
            - paragraph [ref=e97]: For cars, buses, equipment, services & user companies
            - generic [ref=e98]:
              - link "add_circle Post Your Listing" [ref=e99] [cursor=pointer]:
                - /url: /en/add-listing
                - generic [ref=e100]: add_circle
                - text: Post Your Listing
              - link "explore Explore Listings" [ref=e101] [cursor=pointer]:
                - /url: /en/browse/cars
                - generic [ref=e102]: explore
                - text: Explore Listings
            - generic [ref=e103]:
              - generic [ref=e104]:
                - generic [ref=e105]: verified_user
                - text: Trusted & Safe
              - generic [ref=e106]:
                - generic [ref=e107]: bolt
                - text: Fast & Easy
              - generic [ref=e108]:
                - generic [ref=e109]: workspace_premium
                - text: Free & Guaranteed
      - generic [ref=e111]:
        - heading "Most Popular Categories" [level=2] [ref=e114]
        - generic [ref=e115]:
          - link "Cars Cars" [ref=e116] [cursor=pointer]:
            - /url: /en/browse/cars
            - img "Cars" [ref=e119]
            - heading "Cars" [level=3] [ref=e121]
          - link "Buses Buses" [ref=e122] [cursor=pointer]:
            - /url: /en/browse/buses
            - img "Buses" [ref=e125]
            - heading "Buses" [level=3] [ref=e127]
          - link "Spare Parts Spare Parts" [ref=e128] [cursor=pointer]:
            - /url: /en/browse/parts
            - img "Spare Parts" [ref=e131]
            - heading "Spare Parts" [level=3] [ref=e133]
          - link "Car Services Car Services" [ref=e134] [cursor=pointer]:
            - /url: /en/browse/services
            - img "Car Services" [ref=e137]
            - heading "Car Services" [level=3] [ref=e139]
          - link "Heavy Equipment Heavy Equipment" [ref=e140] [cursor=pointer]:
            - /url: /en/browse/equipment
            - img "Heavy Equipment" [ref=e143]
            - heading "Heavy Equipment" [level=3] [ref=e145]
          - link "Jobs Jobs" [ref=e146] [cursor=pointer]:
            - /url: /en/browse/jobs
            - img "Jobs" [ref=e149]
            - heading "Jobs" [level=3] [ref=e151]
          - link "Car Rental Car Rental" [ref=e152] [cursor=pointer]:
            - /url: /en/browse/cars?listingType=RENTAL
            - img "Car Rental" [ref=e155]
            - heading "Car Rental" [level=3] [ref=e157]
      - generic [ref=e158]:
        - generic [ref=e159]:
          - heading "Quick Services Near You" [level=2] [ref=e162]
          - link "Services →" [ref=e164] [cursor=pointer]:
            - /url: /en/browse/services
        - generic [ref=e165]:
          - link "electrical_services Car Electrician" [ref=e166] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=MAINTENANCE
            - generic [ref=e168]: electrical_services
            - generic [ref=e169]: Car Electrician
          - link "oil_barrel Oil Change" [ref=e170] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=MAINTENANCE
            - generic [ref=e172]: oil_barrel
            - generic [ref=e173]: Oil Change
          - link "car_crash Towing & Recovery" [ref=e174] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=TOWING
            - generic [ref=e176]: car_crash
            - generic [ref=e177]: Towing & Recovery
          - link "tire_repair Mobile Tire" [ref=e178] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=MAINTENANCE
            - generic [ref=e180]: tire_repair
            - generic [ref=e181]: Mobile Tire
          - link "battery_charging_full Mobile Battery" [ref=e182] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=MAINTENANCE
            - generic [ref=e184]: battery_charging_full
            - generic [ref=e185]: Mobile Battery
          - link "local_car_wash Car Wash & Polish" [ref=e186] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=CLEANING
            - generic [ref=e188]: local_car_wash
            - generic [ref=e189]: Car Wash & Polish
          - link "build Maintenance & Repair" [ref=e190] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=MAINTENANCE
            - generic [ref=e192]: build
            - generic [ref=e193]: Maintenance & Repair
          - link "search_check_2 Car Inspection" [ref=e194] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=INSPECTION
            - generic [ref=e196]: search_check_2
            - generic [ref=e197]: Car Inspection
          - link "format_paint Body & Paint" [ref=e198] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=BODYWORK
            - generic [ref=e200]: format_paint
            - generic [ref=e201]: Body & Paint
          - link "tune Modification" [ref=e202] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=MODIFICATION
            - generic [ref=e204]: tune
            - generic [ref=e205]: Modification
          - link "dashboard_customize Accessories" [ref=e206] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=ACCESSORIES_INSTALL
            - generic [ref=e208]: dashboard_customize
            - generic [ref=e209]: Accessories
          - link "key Keys & Locks" [ref=e210] [cursor=pointer]:
            - /url: /en/browse/services?serviceType=KEYS_LOCKS
            - generic [ref=e212]: key
            - generic [ref=e213]: Keys & Locks
      - generic [ref=e216]:
        - generic [ref=e217]:
          - generic [ref=e218]:
            - heading "Latest Cars" [level=2] [ref=e221]
            - paragraph [ref=e222]: New and used cars for sale and rent in Oman
          - link "View All →" [ref=e223] [cursor=pointer]:
            - /url: /en/browse/cars
        - generic [ref=e225]:
          - generic [ref=e226] [cursor=pointer]:
            - generic [ref=e228]:
              - img "Audi Q7 2023" [ref=e229]
              - generic [ref=e230]: For Sale
            - generic [ref=e231]:
              - generic [ref=e232]:
                - heading "Audi Q7 2023" [level=3] [ref=e233]
                - generic [ref=e234]:
                  - generic [ref=e235]: verified
                  - text: موثق
              - generic [ref=e236]:
                - generic [ref=e237]:
                  - img [ref=e239]
                  - generic [ref=e242]: Used
                - generic [ref=e243]:
                  - img [ref=e245]
                  - generic [ref=e247]: "2023"
                - generic [ref=e248]:
                  - img [ref=e250]
                  - generic [ref=e253]: 22,000 km
                - generic [ref=e254]:
                  - img [ref=e256]
                  - generic [ref=e259]: Automatic
                - generic [ref=e260]:
                  - img [ref=e262]
                  - generic [ref=e265]: Petrol
              - separator [ref=e266]
              - generic [ref=e267]:
                - generic [ref=e268]:
                  - img [ref=e269]
                  - generic [ref=e272]: Oman، Muscat
                - generic [ref=e273]: 24,000 ر.ع
          - generic [ref=e274] [cursor=pointer]:
            - generic [ref=e276]:
              - img "Kia K5 2023" [ref=e277]
              - generic [ref=e278]: For Sale
            - generic [ref=e279]:
              - generic [ref=e280]:
                - heading "Kia K5 2023" [level=3] [ref=e281]
                - generic [ref=e282]:
                  - generic [ref=e283]: verified
                  - text: موثق
              - generic [ref=e284]:
                - generic [ref=e285]:
                  - img [ref=e287]
                  - generic [ref=e290]: Used
                - generic [ref=e291]:
                  - img [ref=e293]
                  - generic [ref=e295]: "2023"
                - generic [ref=e296]:
                  - img [ref=e298]
                  - generic [ref=e301]: 15,000 km
                - generic [ref=e302]:
                  - img [ref=e304]
                  - generic [ref=e307]: Automatic
                - generic [ref=e308]:
                  - img [ref=e310]
                  - generic [ref=e313]: Petrol
              - separator [ref=e315]
              - generic [ref=e316]:
                - generic [ref=e317]:
                  - img [ref=e318]
                  - generic [ref=e321]: Oman، South Al Batinah
                - generic [ref=e322]: 6,800 ر.ع
          - generic [ref=e323] [cursor=pointer]:
            - generic [ref=e325]:
              - img "Hyundai Tucson 2024" [ref=e326]
              - generic [ref=e327]: For Sale
            - generic [ref=e328]:
              - generic [ref=e329]:
                - heading "Hyundai Tucson 2024" [level=3] [ref=e330]
                - generic [ref=e331]:
                  - generic [ref=e332]: verified
                  - text: موثق
              - generic [ref=e333]:
                - generic [ref=e334]:
                  - img [ref=e336]
                  - generic [ref=e339]: New
                - generic [ref=e340]:
                  - img [ref=e342]
                  - generic [ref=e344]: "2024"
                - generic [ref=e345]:
                  - img [ref=e347]
                  - generic [ref=e350]: Automatic
                - generic [ref=e351]:
                  - img [ref=e353]
                  - generic [ref=e356]: Petrol
                - generic [ref=e357]:
                  - img [ref=e359]
                  - generic [ref=e363]: SUV
              - separator [ref=e364]
              - generic [ref=e365]:
                - generic [ref=e366]:
                  - img [ref=e367]
                  - generic [ref=e370]: Oman، Ad Dakhiliyah
                - generic [ref=e371]: 8,500 ر.ع
          - generic [ref=e372] [cursor=pointer]:
            - generic [ref=e374]:
              - img "Porsche Cayenne GTS 2022" [ref=e375]
              - generic [ref=e376]: For Sale
              - generic [ref=e377]:
                - img [ref=e378]
                - text: Featured
            - generic [ref=e380]:
              - generic [ref=e381]:
                - heading "Porsche Cayenne GTS 2022" [level=3] [ref=e382]
                - generic [ref=e383]:
                  - generic [ref=e384]: verified
                  - text: موثق
              - generic [ref=e385]:
                - generic [ref=e386]:
                  - img [ref=e388]
                  - generic [ref=e391]: Good
                - generic [ref=e392]:
                  - img [ref=e394]
                  - generic [ref=e396]: "2022"
                - generic [ref=e397]:
                  - img [ref=e399]
                  - generic [ref=e402]: 30,000 km
                - generic [ref=e403]:
                  - img [ref=e405]
                  - generic [ref=e408]: Automatic
                - generic [ref=e409]:
                  - img [ref=e411]
                  - generic [ref=e414]: Petrol
              - separator [ref=e415]
              - generic [ref=e416]:
                - generic [ref=e417]:
                  - img [ref=e418]
                  - generic [ref=e421]: Oman، Muscat
                - generic [ref=e422]: 38,000 ر.ع
      - generic [ref=e664]:
        - generic [ref=e665]:
          - generic [ref=e666]: campaign
          - generic [ref=e667]: +125,000
          - generic [ref=e668]: Active Listings
        - generic [ref=e669]:
          - generic [ref=e670]: group
          - generic [ref=e671]: +85,000
          - generic [ref=e672]: Trusted Users
        - generic [ref=e673]:
          - generic [ref=e674]: verified_user
          - generic [ref=e675]: 100%
          - generic [ref=e676]: Safe Platform
        - generic [ref=e677]:
          - generic [ref=e678]: support_agent
          - generic [ref=e679]: 24/7
          - generic [ref=e680]: Support
  - link "add_circle" [ref=e682] [cursor=pointer]:
    - /url: /en/add-listing
    - generic [ref=e684]: add_circle
  - navigation [ref=e685]:
    - generic [ref=e686]:
      - link "home Home" [ref=e687] [cursor=pointer]:
        - /url: /en
        - generic [ref=e689]: home
        - generic [ref=e690]: Home
      - button "search Search" [ref=e691]:
        - generic [ref=e692]: search
        - generic [ref=e693]: Search
      - generic [ref=e696]: Add Listing
      - button "chat Messages" [ref=e697]:
        - generic [ref=e698]: chat
        - generic [ref=e699]: Messages
      - button "person My Account" [ref=e700]:
        - generic [ref=e701]: person
        - generic [ref=e702]: My Account
  - button "Open Next.js Dev Tools" [ref=e708] [cursor=pointer]:
    - img [ref=e709]
  - alert [ref=e712]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Unified Search Engine (Global Browse)', () => {
  4  | 
  5  |   test('Navbar search redirects to /browse with query param', async ({ page }) => {
  6  |     // Go to homepage
> 7  |     await page.goto('/');
     |                ^ TimeoutError: page.goto: Timeout 60000ms exceeded.
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