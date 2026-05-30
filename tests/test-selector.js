const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login
  await page.goto('https://souq-one-om-web.vercel.app/ar/login');
  await page.fill('input[name="phone"]', '90000001');
  await page.fill('input[name="password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/transport');

  // Go to new request
  await page.goto('https://souq-one-om-web.vercel.app/ar/transport/new');
  await page.waitForSelector('button.rounded-2xl');
  await page.locator('button.rounded-2xl').nth(1).click();
  await page.click('button:has-text("التالي")');
  
  await page.waitForSelector('select[name="fromGovernorate"]');
  await page.click('button:has-text("التالي")');
  
  // Wait 1 second for validation to appear
  await page.waitForTimeout(1000);
  
  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('page-state.html', html);
  console.log('Saved page state. Errors:');
  const errors = await page.locator('p.text-\\[var\\(--color-error\\)\\]').allTextContents();
  console.log(errors);
  const toasts = await page.locator('[data-sonner-toast]').allTextContents();
  console.log('Toasts:', toasts);
  
  await browser.close();
})();
