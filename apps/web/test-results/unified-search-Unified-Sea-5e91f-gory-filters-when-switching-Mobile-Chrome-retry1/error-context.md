# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: unified-search.spec.ts >> Unified Search Engine (Global Browse) >> Federated View displays tabs and clears category filters when switching
- Location: e2e\unified-search.spec.ts:24:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('heading', { level: 1 })
Expected substring: "سيارات"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for getByRole('heading', { level: 1 })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [active]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - navigation [ref=e7]:
          - button "previous" [disabled] [ref=e8]:
            - img "previous" [ref=e9]
          - generic [ref=e11]:
            - generic [ref=e12]: 1/
            - text: "1"
          - button "next" [disabled] [ref=e13]:
            - img "next" [ref=e14]
        - link "Next.js 15.5.14 (outdated) Webpack" [ref=e17] [cursor=pointer]:
          - /url: https://nextjs.org/docs/messages/version-staleness
          - img [ref=e18]
          - generic "An outdated version detected (latest is 16.2.4), upgrade is highly recommended!" [ref=e20]: Next.js 15.5.14 (outdated)
          - generic [ref=e21]: Webpack
      - dialog "Runtime TypeError" [ref=e23]:
        - generic [ref=e26]:
          - generic [ref=e27]:
            - generic [ref=e28]:
              - generic [ref=e30]: Runtime TypeError
              - generic [ref=e31]:
                - button "Copy Error Info" [ref=e32] [cursor=pointer]:
                  - img [ref=e33]
                - button "No related documentation found" [disabled] [ref=e35]:
                  - img [ref=e36]
                - link "Learn more about enabling Node.js inspector for server code with Chrome DevTools" [ref=e38] [cursor=pointer]:
                  - /url: https://nextjs.org/docs/app/building-your-application/configuring/debugging#server-side-code
                  - img [ref=e39]
            - paragraph [ref=e48]: config is not iterable
          - generic [ref=e49]:
            - generic [ref=e50]:
              - paragraph [ref=e52]:
                - img [ref=e54]
                - generic [ref=e58]: src\features\listings\utils\filter-helpers.ts (71:23) @ parseUrlFilters
                - button "Open in editor" [ref=e59] [cursor=pointer]:
                  - img [ref=e61]
              - generic [ref=e64]:
                - generic [ref=e65]: "69 | const filters: ActiveFilters = {}"
                - generic [ref=e66]: 70 |
                - generic [ref=e67]: "> 71 | for (const field of config) {"
                - generic [ref=e68]: "| ^"
                - generic [ref=e69]: "72 | if (field.type === 'range') {"
                - generic [ref=e70]: 73 | const parsed = parseRangeKey(field.key)
                - generic [ref=e71]: 74 | const [minKey, maxKey] = parsed ?? [field.key + 'Min', field.key + 'Max']
            - generic [ref=e72]:
              - generic [ref=e73]:
                - paragraph [ref=e74]:
                  - text: Call Stack
                  - generic [ref=e75]: "20"
                - button "Show 14 ignore-listed frame(s)" [ref=e76] [cursor=pointer]:
                  - text: Show 14 ignore-listed frame(s)
                  - img [ref=e77]
              - generic [ref=e79]:
                - generic [ref=e80]:
                  - text: parseUrlFilters
                  - button "Open parseUrlFilters in editor" [ref=e81] [cursor=pointer]:
                    - img [ref=e82]
                - text: src\features\listings\utils\filter-helpers.ts (71:23)
              - generic [ref=e84]:
                - generic [ref=e85]:
                  - text: useFilterState.useMemo[filters]
                  - button "Open useFilterState.useMemo[filters] in editor" [ref=e86] [cursor=pointer]:
                    - img [ref=e87]
                - text: src\features\listings\hooks\useFilterState.ts (28:26)
              - generic [ref=e89]:
                - generic [ref=e90]:
                  - text: useFilterState
                  - button "Open useFilterState in editor" [ref=e91] [cursor=pointer]:
                    - img [ref=e92]
                - text: src\features\listings\hooks\useFilterState.ts (27:26)
              - generic [ref=e94]:
                - generic [ref=e95]:
                  - text: ShellContent
                  - button "Open ShellContent in editor" [ref=e96] [cursor=pointer]:
                    - img [ref=e97]
                - text: src\features\listings\components\BrowseGlobalShell.tsx (115:76)
              - generic [ref=e99]:
                - generic [ref=e100]:
                  - text: BrowseGlobalShell
                  - button "Open BrowseGlobalShell in editor" [ref=e101] [cursor=pointer]:
                    - img [ref=e102]
                - text: src\features\listings\components\BrowseGlobalShell.tsx (84:7)
              - generic [ref=e104]:
                - generic [ref=e105]:
                  - text: BrowseGlobalPage
                  - button "Open BrowseGlobalPage in editor" [ref=e106] [cursor=pointer]:
                    - img [ref=e107]
                - text: src\app\[locale]\browse\page.tsx (10:10)
        - generic [ref=e109]:
          - generic [ref=e110]: "1"
          - generic [ref=e111]: "2"
    - generic [ref=e116] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e117]:
        - img [ref=e118]
      - generic [ref=e121]:
        - button "Open issues overlay" [ref=e122]:
          - generic [ref=e123]:
            - generic [ref=e124]: "0"
            - generic [ref=e125]: "1"
          - generic [ref=e126]: Issue
        - button "Collapse issues badge" [ref=e127]:
          - img [ref=e128]
  - 'heading "Application error: a client-side exception has occurred while loading localhost (see the browser console for more information)." [level=2] [ref=e132]'
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
> 30 |     await expect(page.getByRole('heading', { level: 1 })).toContainText('سيارات');
     |                                                           ^ Error: expect(locator).toContainText(expected) failed
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