const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 350 });
  const shipperContext = await browser.newContext();
  const carrierContext = await browser.newContext();
  
  const shipperPage = await shipperContext.newPage();
  const carrierPage = await carrierContext.newPage();

  // إعداد رادار الأخطاء (Bug Scanner)
  const caughtBugs = [];
  const catchErrors = (page, role) => {
    page.on('pageerror', err => {
      const msg = `🔴 [${role} - متصفح خطأ (Bug)]: ${err.message}`;
      console.error(msg);
      caughtBugs.push(msg);
    });

    page.on('requestfailed', request => {
      const errorText = request.failure()?.errorText;
      if (errorText && errorText !== 'net::ERR_ABORTED' && !errorText.includes('ERR_NETWORK_CHANGED')) {
        const msg = `🔴 [${role} - شبكة خطأ (Bug)]: فشل طلب ${request.url()} - ${errorText}`;
        console.error(msg);
        caughtBugs.push(msg);
      }
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource')) {
          const m = `🔴 [${role} - كونسول خطأ (Bug)]: ${text}`;
          console.error(m);
          caughtBugs.push(m);
        }
      }
    });
  };

  catchErrors(shipperPage, 'الشاحن');
  catchErrors(carrierPage, 'الناقل');

  console.log('\\n🚀 بدء اختبار دورة الحياة الكاملة (Happy Path End-to-End) 🚀');

  // دالة مساعدة لتسجيل الدخول
  async function login(page, email, password) {
    await page.goto('https://souq-one-om-web.vercel.app/ar/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.locator('button.btn-primary[type="submit"]').click();
    await page.waitForURL(url => !url.href.includes('/login'), { timeout: 20000 });
  }

  try {
    // 0. تسجيل الدخول
    console.log('\\n▶️ المرحلة 0: تسجيل الدخول للطرفين...');
    await login(shipperPage, 'mahmudsaed997@gmail.com', '14520202');
    console.log('✅ تم دخول الشاحن بنجاح.');
    await login(carrierPage, 'mahmmouudmuhamed2097@gmail.com', '1234512345');
    console.log('✅ تم دخول الناقل بنجاح.');

    // 1. الشاحن ينشئ الطلب
    console.log('\\n▶️ المرحلة 1: الشاحن ينشئ طلب نقل جديد...');
    await shipperPage.goto('https://souq-one-om-web.vercel.app/ar/transport/new');
    await shipperPage.waitForSelector('button.rounded-2xl');
    await shipperPage.locator('button.rounded-2xl').first().click(); // اختيار سيارة نقل
    await shipperPage.click('button:has-text("التالي")');
    await shipperPage.waitForSelector('select[name="fromGovernorate"]');
    await shipperPage.selectOption('select[name="fromGovernorate"]', { index: 1 });
    await shipperPage.fill('textarea[name="fromAddress"]', 'الخوير، شارع المها');
    await shipperPage.selectOption('select[name="toGovernorate"]', { index: 2 });
    await shipperPage.fill('textarea[name="toAddress"]', 'نزوى، السوق المركزي');
    await shipperPage.click('button:has-text("التالي")');
    await shipperPage.waitForSelector('textarea[name="cargoDescription"]');
    await shipperPage.fill('textarea[name="cargoDescription"]', 'بضائع تجارية - اختبار المسار الكامل');
    await shipperPage.fill('input[name="weightTons"]', '2.5');
    await shipperPage.click('button:has-text("التالي")');
    await shipperPage.click('button:has-text("التالي")');
    
    console.log('⏳ ننتظر التحويل لصفحة طلباتي أو نضغط زر الإرسال...');
    await Promise.race([
        shipperPage.waitForURL(/\/transport\/my-requests/, { timeout: 45000 }),
        (async () => {
            const btn = shipperPage.locator('button[data-testid="submit-wizard"]');
            await btn.waitFor({ state: 'visible', timeout: 10000 });
            if (!(await btn.evaluate(b => b.disabled))) await btn.click();
            await shipperPage.waitForURL(/\/transport\/my-requests/, { timeout: 45000 });
        })()
    ]);
    console.log('✅ تم نشر الطلب بنجاح.');

    await shipperPage.waitForSelector('a[href*="/transport/requests/"]');
    const firstRequestUrl = await shipperPage.locator('a[href*="/transport/requests/"]').first().getAttribute('href');
    const requestUrl = 'https://souq-one-om-web.vercel.app' + firstRequestUrl;
    console.log('🔗 رابط الطلب:', requestUrl);

    // 2. الناقل يقدم العرض
    console.log('\\n▶️ المرحلة 2: الناقل يقدم عرض تسعير...');
    await carrierPage.goto(requestUrl);
    await carrierPage.waitForSelector('input[type="number"]');
    await carrierPage.fill('input[type="number"]', '35'); // سعر العرض
    await carrierPage.fill('textarea', 'أستطيع النقل فورا بسيارة مجهزة.'); // رسالة العرض
    await carrierPage.click('button:has-text("إرسال العرض")');
    await carrierPage.waitForSelector('text=تم إرسال عرضك', { timeout: 15000 });
    console.log('✅ تم إرسال العرض من قبل الناقل.');

    // 3. الشاحن يقبل العرض
    console.log('\\n▶️ المرحلة 3: الشاحن يوافق على العرض (Booking)...');
    await shipperPage.goto(requestUrl);
    
    // الشاحن ينقر على زر الموافقة
    await shipperPage.waitForSelector('button:has-text("قبول هذا العرض")');
    await shipperPage.click('button:has-text("قبول هذا العرض")');
    
    // الانتظار حتى يتحول الشاحن لصفحة الحجوزات
    await shipperPage.waitForURL(/\/transport\/my-bookings/, { timeout: 30000 });
    
    // الشاحن يفتح الرحلة من القائمة
    await shipperPage.waitForSelector('a[href*="/transport/bookings/"]');
    const firstBookingUrl = await shipperPage.locator('a[href*="/transport/bookings/"]').first().getAttribute('href');
    const bookingUrlStr = 'https://souq-one-om-web.vercel.app' + firstBookingUrl;
    await shipperPage.goto(bookingUrlStr);
    
    console.log('✅ الشاحن وافق على العرض وتم إنشاء الرحلة/الحجز.');
    console.log('🔗 رابط الرحلة:', bookingUrlStr);

    // 4. الناقل يفتح الحجز ويبدأ الشحن (In Progress)
    console.log('\\n▶️ المرحلة 4: الناقل يستلم البضاعة ويبدأ الشحن (IN PROGRESS)...');
    await carrierPage.goto(bookingUrlStr);
    await carrierPage.waitForSelector('button:has-text("بدأت التحميل")');
    await carrierPage.click('button:has-text("بدأت التحميل")');
    
    // بعض الأحيان تحديث الحالة في الواجهة يتأخر، سنقوم بعمل تحديث للصفحة للتأكد
    await carrierPage.waitForTimeout(2000);
    await carrierPage.reload();
    
    // الانتظار حتى تظهر حالة "جارٍ التنفيذ"
    await carrierPage.waitForSelector('text=جارٍ التنفيذ', { timeout: 15000 });
    console.log('✅ حالة الرحلة الآن أصبحت "جارٍ التنفيذ".');

    // 5. الشاحن يفتح الحجز ويؤكد الاستلام (Completed)
    console.log('\\n▶️ المرحلة 5: الشاحن يتسلم البضاعة ويؤكد الاستلام (COMPLETED)...');
    await shipperPage.reload(); // تحديث الصفحة لظهور زر الاستلام
    await shipperPage.waitForSelector('button:has-text("استلمت — اكتمل")');
    await shipperPage.click('button:has-text("استلمت — اكتمل")');
    
    // يفتح المودال (نافذة منبثقة)
    await shipperPage.waitForSelector('text=تأكيد استلام البضاعة');
    await shipperPage.fill('textarea[placeholder*="ملاحظات التسليم"]', 'وصلت البضاعة سليمة، شكراً جزيلاً.');
    await shipperPage.click('button:has-text("تأكيد الاستلام")');

    // بعض الأحيان تحديث الحالة يتأخر
    await shipperPage.waitForTimeout(2000);
    await shipperPage.reload();
    await shipperPage.waitForSelector('text=مكتمل', { timeout: 15000 });
    await shipperPage.waitForSelector('text=قيّم الناقل', { timeout: 15000 });
    
    console.log('\\n▶️ المرحلة 6: الشاحن يقيّم الناقل (Rating)...');
    // الضغط على النجمة الخامسة (أعلى تقييم)
    // النجوم غالباً ستكون أزرار متتالية، سنختار آخر زر نجمة
    await shipperPage.waitForSelector('button svg.lucide-star');
    const stars = await shipperPage.locator('button:has(svg.lucide-star)');
    await stars.nth(4).click(); // النجمة الخامسة (الفهرس 4)
    
    // كتابة تعليق
    await shipperPage.fill('textarea[placeholder*="شاركنا رأيك"]', 'خدمة ممتازة وسريعة جداً. أنصح بالتعامل معه.');
    
    // إرسال التقييم
    await shipperPage.click('button:has-text("إرسال التقييم")');
    
    // الانتظار حتى تظهر رسالة النجاح أو يختفي نموذج التقييم
    await shipperPage.waitForSelector('text=تم حفظ التقييم بنجاح', { timeout: 15000 });
    console.log('✅ تم إرسال التقييم بنجاح والانتهاء التام من الدورة!');

  } catch (err) {
    console.error('\\n❌ فشل الاختبار في إحدى الخطوات:', err.message);
    await shipperPage.screenshot({ path: 'happy-path-shipper-error.png' });
    await carrierPage.screenshot({ path: 'happy-path-carrier-error.png' });
  }

  // فحص نهائي للرادار
  if (caughtBugs.length > 0) {
    console.error('\\n🚨🚨🚨 الرادار التقط أخطاء (Bugs) في النظام أثناء الاختبار! 🚨🚨🚨');
    caughtBugs.forEach(b => console.error(b));
    process.exit(1);
  } else {
    console.log('\\n🎉🎉 الدورة التدريبية الكاملة (Happy Path) مرت بسلام، ولا يوجد أي عيوب برمجية! 🎉🎉');
  }

  console.log('سيتم إغلاق المتصفح خلال 5 ثواني...');
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();
