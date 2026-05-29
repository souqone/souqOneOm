import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Browse — Locale Links (E1-E10)', () => {
  test('E1: TransportRequestCard link includes locale', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport`);
    await page.waitForLoadState('networkidle');
    const firstCard = page.locator('a[href*="/transport/requests/"]').first();
    await expect(firstCard).toHaveAttribute('href', /\/ar\/transport\/requests\//);
  });

  test('E2: HeroSection CTA links include locale', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport`);
    await page.waitForLoadState('networkidle');
    const ctaLinks = page.locator('a[href*="/transport/new"], a[href*="/transport/carriers/register"]');
    for (const link of await ctaLinks.all()) {
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^\/ar\//);
    }
  });

  test('E5: LatestRequests "عرض الكل" link includes locale', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport`);
    await page.waitForLoadState('networkidle');
    const viewAllLink = page.getByRole('link', { name: /عرض الكل/i });
    await expect(viewAllLink).toBeVisible({ timeout: 10000 });
    await expect(viewAllLink).toHaveAttribute('href', /^\/ar\//);
  });

  test('E6: Back link in request detail includes locale', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/browse`);
    await page.waitForLoadState('networkidle');
    const firstCard = page.locator('a[href*="/transport/requests/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    const backLink = page.getByRole('link', { name: /العودة|back/i });
    await expect(backLink).toBeVisible({ timeout: 10000 });
    await expect(backLink).toHaveAttribute('href', /^\/ar\//);
  });
});

test.describe('Browse — Filter URL Persistence (F1-F5)', () => {
  test('F1: Filter by serviceType updates URL', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/browse`);
    await page.waitForLoadState('networkidle');

    // Apply a filter
    const filterBtn = page.locator('button, select').filter({ hasText: /نوع الخدمة|بضائع/i }).first();
    await expect(filterBtn).toBeVisible({ timeout: 10000 });
    await filterBtn.click();
    const goodsOption = page.getByRole('option', { name: /بضائع|GOODS/i }).or(
      page.getByRole('button', { name: /بضائع|GOODS/i })
    ).first();
    await expect(goodsOption).toBeVisible({ timeout: 10000 });
    await goodsOption.click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('serviceType');
  });

  test('F1: Filter persists after page refresh', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/browse?serviceType=GOODS`);
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('serviceType=GOODS');
  });

  test('F3: Pagination keeps filters in URL', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/browse?serviceType=GOODS`);
    await page.waitForLoadState('networkidle');

    const nextBtn = page.getByRole('button', { name: /التالي|next|2/i }).first();
    await expect(nextBtn).toBeVisible({ timeout: 10000 });
    await nextBtn.click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('serviceType=GOODS');
  });

  test('N1: Anonymous user does NOT see edit button on any card', async ({ page }) => {
    await page.goto(`${BASE}/ar/transport/browse`);
    await page.waitForLoadState('networkidle');
    const editButtons = page.getByRole('button', { name: /تعديل|edit/i });
    const editLinks = page.locator('a[href*="/edit"]');
    await expect(editButtons).toHaveCount(0);
    await expect(editLinks).toHaveCount(0);
  });
});
