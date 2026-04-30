# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: unified-search.spec.ts >> Unified Search Engine (Global Browse) >> Federated View displays tabs and clears category filters when switching
- Location: e2e\unified-search.spec.ts:24:7

# Error details

```
TimeoutError: page.goto: Timeout 60000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/browse?category=cars&make=Toyota", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e7]:
        - button "menu" [ref=e9]:
          - generic [ref=e10]: menu
        - link "SouqOne" [ref=e12] [cursor=pointer]:
          - /url: /en
          - img "SouqOne" [ref=e13]
        - generic [ref=e15]:
          - link "notifications" [ref=e16] [cursor=pointer]:
            - /url: /en/notifications
            - generic [ref=e17]: notifications
          - link "favorite" [ref=e18] [cursor=pointer]:
            - /url: /en/favorites
            - generic [ref=e19]: favorite
      - generic [ref=e21]:
        - generic [ref=e22]:
          - button "All expand_more" [ref=e24]:
            - text: All
            - generic [ref=e25]: expand_more
          - textbox "Search SouqOne..." [ref=e27]
          - button "search" [ref=e28]:
            - generic [ref=e29]: search
        - link "add" [ref=e30] [cursor=pointer]:
          - /url: /en/add-listing
          - generic [ref=e31]: add
    - complementary [ref=e32]:
      - generic [ref=e33]:
        - img "SouqOne" [ref=e35]
        - button "close" [ref=e36]:
          - generic [ref=e37]: close
      - generic [ref=e38]:
        - paragraph [ref=e39]: Browse
        - link "Home" [ref=e41] [cursor=pointer]:
          - /url: /en
          - text: Home
        - button "Cars chevron_left" [ref=e44]:
          - generic [ref=e45]: Cars
          - generic [ref=e47]: chevron_left
        - button "Buses chevron_left" [ref=e49]:
          - generic [ref=e50]: Buses
          - generic [ref=e52]: chevron_left
        - button "Equipment chevron_left" [ref=e54]:
          - generic [ref=e55]: Equipment
          - generic [ref=e57]: chevron_left
        - button "Jobs chevron_left" [ref=e59]:
          - generic [ref=e60]: Jobs
          - generic [ref=e62]: chevron_left
        - generic [ref=e63]:
          - button "Create Free Account" [ref=e64]
          - button "Login" [ref=e65]
      - generic [ref=e67]:
        - generic [ref=e68]: Settings
        - button "language عربي" [ref=e70]:
          - generic [ref=e71]: language
          - generic [ref=e72]: عربي
      - paragraph [ref=e75]: Oman's leading platform for buying and selling cars with confidence.
  - link "add_circle" [ref=e168] [cursor=pointer]:
    - /url: /en/add-listing
    - generic [ref=e170]: add_circle
  - navigation [ref=e171]:
    - generic [ref=e172]:
      - link "home Home" [ref=e173] [cursor=pointer]:
        - /url: /en
        - generic [ref=e175]: home
        - generic [ref=e176]: Home
      - button "search Search" [ref=e177]:
        - generic [ref=e178]: search
        - generic [ref=e179]: Search
      - generic [ref=e182]: Add Listing
      - button "chat Messages" [ref=e183]:
        - generic [ref=e184]: chat
        - generic [ref=e185]: Messages
      - button "person My Account" [ref=e186]:
        - generic [ref=e187]: person
        - generic [ref=e188]: My Account
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
> 27 |     await page.goto('/browse?category=cars&make=Toyota');
     |                ^ TimeoutError: page.goto: Timeout 60000ms exceeded.
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