import { Page } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

export const USERS = {
  shipper: { email: 'shipper@souqone.om', password: 'Test1234' },
  carrier: { email: 'carrier@souqone.om', password: 'Test1234' },
  carrierNoProfile: { email: 'carrierNoProfile@souqone.om', password: 'Test1234' },
  other: { email: 'other@souqone.om', password: 'Test1234' },
} as const;

export const SEED_IDS = {
  openRequest: 'seed-tr-open-001',        // OPEN, owned by shipper
  otherRequest: 'seed-tr-other-002',      // OPEN, owned by other user
  quotedRequest: 'seed-tr-quoted-003',    // QUOTED, shipper owns, carrier quoted
  pendingQuote: 'seed-tq-pending-001',    // PENDING quote from carrier
} as const;

/**
 * Login via the Auth Modal (the app uses a modal, not a standalone login page)
 */
export async function loginAs(
  page: Page,
  user: keyof typeof USERS,
  locale = 'ar',
) {
  // Go to home page first
  await page.goto(`${BASE}/${locale}`);
  await page.waitForLoadState('networkidle');

  // Click the login button in the header to open the Auth Modal
  const loginBtn = page.getByRole('button', { name: /تسجيل الدخول|دخول|Login|Sign in/i }).first();
  await loginBtn.click();

  // Wait for the modal to appear with the email input
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });

  // Fill credentials
  await page.fill('input[type="email"]', USERS[user].email);
  await page.fill('input[type="password"]', USERS[user].password);

  // Submit the login form
  const form = page.locator('form').filter({ has: page.locator('input[type="email"]') });
  await form.locator('button[type="submit"]').click({ force: true });

  // Wait for modal to close (login success)
  await page.waitForFunction(
    () => !document.querySelector('input[type="email"]'),
    { timeout: 30000 }
  );

  // Small pause for auth state to settle
  await page.waitForTimeout(1000);
}

export async function logout(page: Page) {
  const avatarBtn = page.locator('[data-testid="user-menu"], [aria-label="القائمة"]').first();
  if (await avatarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await avatarBtn.click();
    const logoutBtn = page.getByRole('button', { name: /تسجيل الخروج|Logout/i });
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click();
      return;
    }
  }
  // Fallback: clear storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
  });
  await page.reload();
}

export async function waitForTransportPage(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[class*="card"], [class*="skeleton"], [class*="error"], h1', {
    timeout: 60000,
  });
}
