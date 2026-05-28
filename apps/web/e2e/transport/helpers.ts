import { Page } from '@playwright/test';

export const USERS = {
  shipper: { email: 'shipper@souqone.om', password: 'Test1234' },
  carrier: { email: 'carrier@souqone.om', password: 'Test1234' },
  other: { email: 'other@souqone.om', password: 'Test1234' },
} as const;

export const SEED_IDS = {
  openRequest: 'seed-tr-open-001',        // OPEN, owned by shipper
  otherRequest: 'seed-tr-other-002',      // OPEN, owned by other user
  quotedRequest: 'seed-tr-quoted-003',    // QUOTED, shipper owns, carrier quoted
  pendingQuote: 'seed-tq-pending-001',    // PENDING quote from carrier
} as const;

export async function loginAs(
  page: Page,
  user: keyof typeof USERS,
  locale = 'ar',
) {
  await page.goto(`/${locale}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', USERS[user].email);
  await page.fill('input[type="password"]', USERS[user].password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 30000,
  });
}

export async function logout(page: Page) {
  // Try clicking avatar/menu first
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
  // Wait for the transport content to be ready (not just the shell)
  await page.waitForSelector('[class*="card"], [class*="skeleton"], [class*="error"], h1', {
    timeout: 60000,
  });
}
