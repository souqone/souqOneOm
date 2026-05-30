const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('request', req => console.log('➡️ REQ:', req.method(), req.url()));
  page.on('response', res => console.log('⬅️ RES:', res.status(), res.url()));
  page.on('console', msg => console.log('💻 CONSOLE:', msg.text()));

  await page.goto('https://souq-one-om-web.vercel.app/ar/login');
  await page.fill('input[type="email"]', 'mahmudsaed997@gmail.com');
  await page.fill('input[type="password"]', '14520202');
  await page.locator('button.btn-primary[type="submit"]').click();
  await page.waitForURL(url => !url.href.includes('/login'));
  console.log('✅ Login done.');

  await page.goto('https://souq-one-om-web.vercel.app/ar/transport/new');
  console.log('✅ Wizard opened.');
  
  await page.waitForSelector('button.rounded-2xl');
  await page.locator('button.rounded-2xl').first().click();
  await page.click('button:has-text("التالي")');
  console.log('✅ Step 1 done.');

  await page.waitForSelector('select[name="fromGovernorate"]');
  await page.selectOption('select[name="fromGovernorate"]', { index: 1 });
  await page.fill('textarea[name="fromAddress"]', 'روي، الشارع العام');
  await page.selectOption('select[name="toGovernorate"]', { index: 2 });
  await page.fill('textarea[name="toAddress"]', 'صلالة، حي النهضة');
  await page.click('button:has-text("التالي")');
  console.log('✅ Step 2 done.');

  await page.waitForSelector('textarea[name="cargoDescription"]');
  await page.fill('textarea[name="cargoDescription"]', 'اختبار الإلغاء السريع');
  await page.fill('input[name="weightTons"]', '2');
  await page.click('button:has-text("التالي")');
  console.log('✅ Step 3 done.');

  await page.waitForTimeout(1000); 

  console.log('⏳ Clicking next on Step 4...');
  await page.click('button:has-text("التالي")');
  console.log('✅ Step 4 done.');

  console.log('⏳ Waiting for Step 5...');
  try {
    await page.waitForSelector('button:has-text("إرسال الطلب")', { timeout: 10000 });
    console.log('✅ Found submit button!');
    await page.click('button:has-text("إرسال الطلب")');
    console.log('✅ Clicked submit button!');
  } catch (e) {
    console.log('❌ Failed to find or click submit button:', e.message);
    await page.screenshot({ path: 'debug-fail.png' });
  }

  await page.waitForTimeout(5000);
  await browser.close();
})();
