# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: transport\06-validation.spec.ts >> Browse — Pagination (N12) >> N12: my-requests shows proper pagination (not hardcoded 50)
- Location: e2e\transport\06-validation.spec.ts:63:7

# Error details

```
Error: page.goto: Target page, context or browser has been closed
Call log:
  - navigating to "https://souq-one-om-web.vercel.app/ar", waiting until "load"

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
> 28 |   await page.goto(`${BASE}/${locale}`);
     |              ^ Error: page.goto: Target page, context or browser has been closed
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