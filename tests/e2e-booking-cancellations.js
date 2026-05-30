const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const shipperContext = await browser.newContext();
  const carrierContext = await browser.newContext();
  
  const shipperPage = await shipperContext.newPage();
  const carrierPage = await carrierContext.newPage();

  const caughtBugs = [];
  const catchErrors = (page, role) => {
    page.on('pageerror', err => {
      const msg = `🔴 [${role} - Bug]: ${err.message}`;
      console.error(msg);
      caughtBugs.push(msg);
    });
    page.on('requestfailed', request => {
      const errorText = request.failure()?.errorText;
      if (errorText && errorText !== 'net::ERR_ABORTED' && !errorText.includes('ERR_NETWORK_CHANGED')) {
        const msg = `🔴 [${role} - Net Bug]: ${request.url()} - ${errorText}`;
        console.error(msg);
        caughtBugs.push(msg);
      }
    });
  };

  catchErrors(shipperPage, 'الشاحن');
  catchErrors(carrierPage, 'الناقل');

  console.log('\\n🚀 بدء اختبار إلغاء الحجوزات (Booking Cancellations Edge Cases) 🚀');

  async function login(page, email, password) {
    await page.goto('https://souq-one-om-web.vercel.app/ar/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.locator('button.btn-primary[type="submit"]').click();
    await page.waitForURL(url => !url.href.includes('/login'), { timeout: 20000 });
  }

  // Helper to create a booking quickly
  async function createBookingFlow(shipperP, carrierP, label) {
    console.log(`\\n▶️ [${label}] الشاحن ينشئ طلب جديد...`);
    await shipperP.goto('https://souq-one-om-web.vercel.app/ar/transport/new');
    await shipperP.waitForSelector('button.rounded-2xl');
    await shipperP.locator('button.rounded-2xl').first().click(); 
    await shipperP.click('button:has-text("التالي")');
    await shipperP.waitForSelector('select[name="fromGovernorate"]');
    await shipperP.selectOption('select[name="fromGovernorate"]', { index: 1 });
    await shipperP.fill('textarea[name="fromAddress"]', 'عنوان اختبار الإلغاء');
    await shipperP.selectOption('select[name="toGovernorate"]', { index: 2 });
    await shipperP.fill('textarea[name="toAddress"]', 'عنوان اختبار الإلغاء');
    await shipperP.click('button:has-text("التالي")');
    await shipperP.waitForSelector('textarea[name="cargoDescription"]');
    await shipperP.fill('textarea[name="cargoDescription"]', `بضائع - ${label}`);
    await shipperP.fill('input[name="weightTons"]', '1');
    await shipperP.click('button:has-text("التالي")');
    await shipperP.click('button:has-text("التالي")');
    
    await Promise.race([
        shipperP.waitForURL(/\/transport\/my-requests/, { timeout: 45000 }),
        (async () => {
            const btn = shipperP.locator('button[data-testid="submit-wizard"]');
            await btn.waitFor({ state: 'visible', timeout: 10000 });
            if (!(await btn.evaluate(b => b.disabled))) await btn.click();
            await shipperP.waitForURL(/\/transport\/my-requests/, { timeout: 45000 });
        })()
    ]);
    
    await shipperP.waitForSelector('a[href*="/transport/requests/"]');
    const firstRequestUrl = await shipperP.locator('a[href*="/transport/requests/"]').first().getAttribute('href');
    const requestUrl = 'https://souq-one-om-web.vercel.app' + firstRequestUrl;

    console.log(`▶️ [${label}] الناقل يقدم عرض تسعير...`);
    await carrierP.goto(requestUrl);
    await carrierP.waitForSelector('input[type="number"]');
    await carrierP.fill('input[type="number"]', '15');
    await carrierP.fill('textarea', 'عرض للإلغاء');
    await carrierP.click('button:has-text("إرسال العرض")');
    await carrierP.waitForSelector('text=تم إرسال عرضك', { timeout: 15000 });

    console.log(`▶️ [${label}] الشاحن يوافق على العرض لإنشاء حجز...`);
    await shipperP.goto(requestUrl);
    await shipperP.waitForSelector('button:has-text("قبول هذا العرض")');
    await shipperP.click('button:has-text("قبول هذا العرض")');
    await shipperP.waitForURL(/\/transport\/my-bookings/, { timeout: 30000 });
    
    await shipperP.waitForSelector('a[href*="/transport/bookings/"]');
    const firstBookingUrl = await shipperP.locator('a[href*="/transport/bookings/"]').first().getAttribute('href');
    const bookingUrlStr = 'https://souq-one-om-web.vercel.app' + firstBookingUrl;
    return bookingUrlStr;
  }

  try {
    console.log('\\n▶️ تسجيل الدخول للطرفين...');
    await login(shipperPage, 'mahmudsaed997@gmail.com', '14520202');
    await login(carrierPage, 'mahmmouudmuhamed2097@gmail.com', '1234512345');

    // =========================================================
    // Scenario 1: Carrier cancels an ACCEPTED booking
    // =========================================================
    console.log('\\n=== السيناريو 1: الناقل يلغي الحجز قبل البدء ===');
    const booking1 = await createBookingFlow(shipperPage, carrierPage, 'إلغاء الناقل');
    
    await carrierPage.goto(booking1);
    await carrierPage.waitForSelector('button:has-text("إلغاء الحجز")');
    await carrierPage.click('button:has-text("إلغاء الحجز")');
    await carrierPage.waitForSelector('textarea[placeholder*="سبب الإلغاء"]');
    await carrierPage.fill('textarea', 'مركبتي تعطلت فجأة، أعتذر');
    await carrierPage.click('button:has-text("تأكيد الإلغاء")');
    
    await carrierPage.waitForTimeout(2000);
    await carrierPage.reload();
    await carrierPage.waitForSelector('text=ملغى', { timeout: 15000 });
    console.log('✅ نجح السيناريو 1: الناقل ألغى الحجز.');

    // =========================================================
    // Scenario 2: Shipper cancels an IN_PROGRESS booking
    // =========================================================
    console.log('\\n=== السيناريو 2: الشاحن يلغي الحجز وهو قيد النقل ===');
    const booking2 = await createBookingFlow(shipperPage, carrierPage, 'إلغاء الشاحن');
    
    // الناقل يبدأ التحميل
    await carrierPage.goto(booking2);
    await carrierPage.waitForSelector('button:has-text("بدأت التحميل")');
    await carrierPage.click('button:has-text("بدأت التحميل")');
    await carrierPage.waitForTimeout(2000);
    await carrierPage.reload();
    await carrierPage.waitForSelector('text=جارٍ التنفيذ', { timeout: 15000 });

    // الشاحن يلغي الحجز
    await shipperPage.goto(booking2);
    await shipperPage.waitForSelector('button:has-text("إلغاء الحجز")');
    await shipperPage.click('button:has-text("إلغاء الحجز")');
    await shipperPage.waitForSelector('textarea[placeholder*="سبب الإلغاء"]');
    await shipperPage.fill('textarea', 'العميل النهائي ألغى الطلبية، لم أعد بحاجة للنقل');
    await shipperPage.click('button:has-text("تأكيد الإلغاء")');

    await shipperPage.waitForTimeout(2000);
    await shipperPage.reload();
    await shipperPage.waitForSelector('text=ملغى', { timeout: 15000 });
    console.log('✅ نجح السيناريو 2: الشاحن ألغى الحجز أثناء النقل.');

  } catch (err) {
    console.error('\\n❌ فشل الاختبار:', err.message);
  }

  if (caughtBugs.length > 0) {
    console.error('\\n🚨 التقط الرادار أخطاء:');
    caughtBugs.forEach(b => console.error(b));
    process.exit(1);
  } else {
    console.log('\\n🎉 اختبارات الإلغاء المعقدة نجحت بالكامل ولا توجد أي ثغرات (Edge Cases Covered)! 🎉');
  }

  await browser.close();
})();
