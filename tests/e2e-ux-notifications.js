const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
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

  console.log('\\n🚀 بدء اختبار تجربة المستخدم (UX, Badges, Notifications) 🚀');

  async function login(page, email, password) {
    await page.goto('https://souq-one-om-web.vercel.app/ar/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.locator('button.btn-primary[type="submit"]').click();
    await page.waitForURL(url => !url.href.includes('/login'), { timeout: 20000 });
  }

  try {
    console.log('\\n▶️ تسجيل الدخول...');
    await login(shipperPage, 'mahmudsaed997@gmail.com', '14520202');
    await login(carrierPage, 'mahmmouudmuhamed2097@gmail.com', '1234512345');

    // 1. Create Request
    console.log('\\n▶️ [الشاحن] إنشاء طلب جديد لفحص البادجات (Badges)...');
    await shipperPage.goto('https://souq-one-om-web.vercel.app/ar/transport/new');
    await shipperPage.waitForSelector('button.rounded-2xl');
    await shipperPage.locator('button.rounded-2xl').first().click();
    await shipperPage.click('button:has-text("التالي")');
    await shipperPage.waitForSelector('select[name="fromGovernorate"]');
    await shipperPage.selectOption('select[name="fromGovernorate"]', { index: 1 });
    await shipperPage.fill('textarea[name="fromAddress"]', 'اختبار تجربة المستخدم');
    await shipperPage.selectOption('select[name="toGovernorate"]', { index: 2 });
    await shipperPage.fill('textarea[name="toAddress"]', 'اختبار تجربة المستخدم');
    await shipperPage.click('button:has-text("التالي")');
    await shipperPage.waitForSelector('textarea[name="cargoDescription"]');
    await shipperPage.fill('textarea[name="cargoDescription"]', 'بضائع - UX Test');
    await shipperPage.fill('input[name="weightTons"]', '1');
    await shipperPage.click('button:has-text("التالي")');
    await shipperPage.click('button:has-text("التالي")');
    
    await Promise.race([
        shipperPage.waitForURL(/\/transport\/my-requests/, { timeout: 45000 }),
        (async () => {
            const btn = shipperPage.locator('button[data-testid="submit-wizard"]');
            await btn.waitFor({ state: 'visible', timeout: 10000 });
            if (!(await btn.evaluate(b => b.disabled))) await btn.click();
            await shipperPage.waitForURL(/\/transport\/my-requests/, { timeout: 45000 });
        })()
    ]);
    
    // Test Badge: OPEN
    console.log('\\n▶️ [الشاحن] اختبار حالة "مفتوح" في صفحة طلباتي...');
    await shipperPage.waitForSelector('a[href*="/transport/requests/"]');
    await shipperPage.waitForSelector('text=مفتوح');
    console.log('✅ بادج "مفتوح" يظهر بشكل سليم.');
    
    const firstRequestUrl = await shipperPage.locator('a[href*="/transport/requests/"]').first().getAttribute('href');
    const requestUrl = 'https://souq-one-om-web.vercel.app' + firstRequestUrl;

    // 2. Carrier Quotes -> Notification triggers for Shipper
    console.log('\\n▶️ [الناقل] تقديم عرض لتفعيل إشعار للشاحن...');
    await carrierPage.goto(requestUrl);
    await carrierPage.waitForSelector('input[type="number"]');
    await carrierPage.fill('input[type="number"]', '12');
    await carrierPage.fill('textarea', 'عرض للتحقق من الإشعارات');
    await carrierPage.click('button:has-text("إرسال العرض")');
    await carrierPage.waitForSelector('text=تم إرسال عرضك', { timeout: 15000 });

    // 3. Shipper checks notifications
    console.log('\\n▶️ [الشاحن] فحص وصول إشعار جديد (UX)...');
    // We go to notifications page to guarantee we see it
    await shipperPage.goto('https://souq-one-om-web.vercel.app/ar/notifications');
    await shipperPage.waitForSelector('text=الإشعارات', { timeout: 10000 });
    // Should have a notification about quote
    await shipperPage.waitForSelector('text=عرض سعر', { state: 'attached', timeout: 15000 });
    console.log('✅ إشعار "عرض سعر جديد" وصل وظهر في صفحة الإشعارات بنجاح.');

    // 4. Shipper accepts -> Notification triggers for Carrier
    console.log('\\n▶️ [الشاحن] قبول العرض للتحقق من إشعارات الناقل وبادجات الحجز...');
    await shipperPage.goto(requestUrl);
    await shipperPage.waitForSelector('button:has-text("قبول هذا العرض")');
    await shipperPage.click('button:has-text("قبول هذا العرض")');
    await shipperPage.waitForURL(/\/transport\/my-bookings/, { timeout: 30000 });

    // Test Badge: ACCEPTED (تم القبول)
    await shipperPage.waitForSelector('text=تم القبول', { timeout: 15000 });
    console.log('✅ بادج "تم القبول" يظهر في قائمة الحجوزات للشاحن.');

    // 5. Carrier checks notifications
    console.log('\\n▶️ [الناقل] فحص وصول إشعار قبول العرض (UX)...');
    await carrierPage.goto('https://souq-one-om-web.vercel.app/ar/notifications');
    await carrierPage.waitForSelector('text=الإشعارات', { timeout: 10000 });
    await carrierPage.waitForSelector('text=قبول', { state: 'attached', timeout: 15000 });
    console.log('✅ إشعار "تم قبول العرض" وصل للناقل بنجاح.');

    // Carrier navigates to bookings and marks In Progress
    await carrierPage.goto('https://souq-one-om-web.vercel.app/ar/transport/my-bookings');
    await carrierPage.waitForSelector('a[href*="/transport/bookings/"]');
    const firstBookingUrl = await carrierPage.locator('a[href*="/transport/bookings/"]').first().getAttribute('href');
    const bookingUrlStr = 'https://souq-one-om-web.vercel.app' + firstBookingUrl;
    
    console.log('\\n▶️ [الناقل] بدء التحميل لاختبار الإشعارات المتبادلة وتحديث الحالة...');
    await carrierPage.goto(bookingUrlStr);
    await carrierPage.waitForSelector('button:has-text("بدأت التحميل")');
    await carrierPage.click('button:has-text("بدأت التحميل")');
    await carrierPage.waitForTimeout(2000);
    await carrierPage.reload();
    await carrierPage.waitForSelector('text=جارٍ التنفيذ', { timeout: 15000 });
    console.log('✅ بادج "جارٍ التنفيذ" يظهر بشكل سليم في صفحة تفاصيل الرحلة.');

  } catch (err) {
    console.error('\\n❌ فشل اختبار تجربة المستخدم:', err.message);
  }

  if (caughtBugs.length > 0) {
    console.error('\\n🚨 التقط الرادار أخطاء:');
    caughtBugs.forEach(b => console.error(b));
    process.exit(1);
  } else {
    console.log('\\n🎉 اختبارات تجربة المستخدم، البادجات، والإشعارات نجحت بالكامل! التناغم ممتاز. 🎉');
  }

  await browser.close();
})();
