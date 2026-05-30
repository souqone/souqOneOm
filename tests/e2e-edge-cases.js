const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 250 });
  const shipperContext = await browser.newContext();
  const carrierContext = await browser.newContext();
  
  const shipperPage = await shipperContext.newPage();
  const carrierPage = await carrierContext.newPage();

  // إعداد رادار الأخطاء (Bug Scanner)
  const caughtBugs = [];
  const catchErrors = (page, role) => {
    // رصد أعطال الجافاسكربت في المتصفح
    page.on('pageerror', err => {
      const msg = `🔴 [${role} - متصفح خطأ (Bug)]: ${err.message}`;
      console.error(msg);
      caughtBugs.push(msg);
    });

    // رصد فشل الطلبات الشبكية
    page.on('requestfailed', request => {
      const errorText = request.failure()?.errorText;
      if (errorText && errorText !== 'net::ERR_ABORTED') {
        const msg = `🔴 [${role} - شبكة خطأ (Bug)]: فشل طلب ${request.url()} - ${errorText}`;
        console.error(msg);
        caughtBugs.push(msg);
      }
    });

    // رصد رسائل الخطأ في الكونسول
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // نتجاهل أخطاء 400 المتوقعة من السيناريو 4 لأننا نختبرها عمداً
        if (!text.includes('status of 400') && !text.includes('Failed to load resource')) {
          const m = `🔴 [${role} - كونسول خطأ (Bug)]: ${text}`;
          console.error(m);
          caughtBugs.push(m);
        }
      }
    });

    // رصد استجابات الـ API الفاشلة (500 وما فوق، و 400 غير المتوقعة)
    page.on('response', async response => {
      const status = response.status();
      const url = response.url();
      if (status >= 400 && url.includes('/api/')) {
        try {
          const text = await response.text();
          // السماح بـ 400 في حالة السيناريو الرابع (Validation) 
          if (status === 400 && text.includes('must be longer than')) {
            // هذا خطأ تحقق متوقع في السيناريوهات التي نرسل فيها بيانات ناقصة
          } else {
            const m = `🔴 [${role} - API ${status} خطأ (Bug)]: ${url} -> ${text}`;
            console.error(m);
            caughtBugs.push(m);
          }
        } catch (e) {}
      }
    });
  };

  catchErrors(shipperPage, 'الشاحن');
  catchErrors(carrierPage, 'الناقل');

  console.log('\\n🚀 بدء اختبار الحالات الاستثنائية والعميقة (Edge Cases) مع رادار الأخطاء 🚀');

  // دالة مساعدة لتسجيل الدخول
  async function login(page, email, password) {
    await page.goto('https://souq-one-om-web.vercel.app/ar/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.locator('button.btn-primary[type="submit"]').click();
    await page.waitForURL(url => !url.href.includes('/login'), { timeout: 20000 });
  }

  // 0. تسجيل الدخول
  console.log('\\n▶️ المرحلة 0: تسجيل الدخول للطرفين...');
  await login(shipperPage, 'mahmudsaed997@gmail.com', '14520202');
  console.log('✅ تم دخول الشاحن بنجاح.');
  await login(carrierPage, 'mahmmouudmuhamed2097@gmail.com', '1234512345');
  console.log('✅ تم دخول الناقل بنجاح.');

  // ==========================================
  // السيناريو 1: إنشاء طلب وإلغاؤه فوراً من قبل الشاحن
  // ==========================================
  console.log('\\n▶️ السيناريو 1: الشاحن ينشئ طلباً ويلغيه فوراً...');
  await shipperPage.goto('https://souq-one-om-web.vercel.app/ar/transport/new');
  await shipperPage.waitForSelector('button.rounded-2xl');
  await shipperPage.locator('button.rounded-2xl').first().click();
  await shipperPage.click('button:has-text("التالي")');
  await shipperPage.waitForSelector('select[name="fromGovernorate"]');
  await shipperPage.selectOption('select[name="fromGovernorate"]', { index: 1 });
  await shipperPage.fill('textarea[name="fromAddress"]', 'روي، الشارع العام');
  await shipperPage.selectOption('select[name="toGovernorate"]', { index: 2 });
  await shipperPage.fill('textarea[name="toAddress"]', 'صلالة، حي النهضة');
  console.log('✅ تم إكمال بيانات المرحلة الثانية');
  await shipperPage.click('button:has-text("التالي")');
  console.log('✅ تم الضغط على التالي للذهاب للمرحلة الثالثة');

  await shipperPage.waitForSelector('textarea[name="cargoDescription"]');
  await shipperPage.fill('textarea[name="cargoDescription"]', 'اختبار الإلغاء السريع');
  await shipperPage.fill('input[name="weightTons"]', '2');
  console.log('✅ تم إكمال بيانات المرحلة الثالثة');
  await shipperPage.click('button:has-text("التالي")');
  console.log('✅ تم الضغط على التالي للذهاب للمرحلة الرابعة');
  
  // Wait for Step 4 (Timing) to actually render before clicking Next again!
  await shipperPage.waitForSelector('text=نوع التوقيت مطلوب', { state: 'hidden' }); // just wait for it to be stable
  await shipperPage.waitForTimeout(500); 
  
  await shipperPage.click('button:has-text("التالي")');
  console.log('✅ تم الضغط على التالي للذهاب للمرحلة الخامسة (المراجعة)');
  
  await shipperPage.waitForLoadState('networkidle');
  await shipperPage.waitForTimeout(1000); // wait 1s to ensure everything is stable
  
  console.log('⏳ ننتظر التحويل لصفحة طلباتي أو نضغط زر الإرسال...');
  
  try {
      // Wait for URL to change OR button to be visible
      await Promise.race([
          shipperPage.waitForURL(/\/transport\/my-requests/, { timeout: 45000 }),
          (async () => {
              const btn = shipperPage.locator('button[data-testid="submit-wizard"]');
              await btn.waitFor({ state: 'visible', timeout: 10000 });
              if (!(await btn.evaluate(b => b.disabled))) {
                  console.log('⏳ زر الإرسال متاح، جاري الضغط عليه...');
                  await btn.click();
              }
              // now wait for the url
              await shipperPage.waitForURL(/\/transport\/my-requests/, { timeout: 45000 });
          })()
      ]);
      console.log('✅ تم التحويل بنجاح لصفحة طلباتي! (تم نشر الطلب)');
  } catch (err) {
      console.log('❌ فشل النشر أو التحويل:', err.message);
      await shipperPage.screenshot({ path: 'scenario1-failed.png' });
      throw err;
  }
  
  // To get the request ID, we need to extract it from the requests list
  // since we didn't capture the API response directly.
  await shipperPage.waitForSelector('a[href*="/transport/requests/"]');
  const firstRequestUrl = await shipperPage.locator('a[href*="/transport/requests/"]').first().getAttribute('href');
  const requestUrl = 'https://souq-one-om-web.vercel.app' + firstRequestUrl;
  console.log('✅ تم نشر الطلب. الرابط:', requestUrl);

  console.log('⏳ الشاحن يضغط إلغاء الطلب...');
  await shipperPage.goto(requestUrl);
  await shipperPage.waitForSelector('button:has-text("إلغاء الطلب")');
  await shipperPage.click('button:has-text("إلغاء الطلب")');
  await shipperPage.click('button:has-text("تأكيد الإلغاء؟")');
  await shipperPage.waitForSelector('text=ملغى', { timeout: 10000 });
  console.log('✅ تم الإلغاء بنجاح من طرف الشاحن.');

  console.log('⏳ الناقل يحاول فتح رابط الطلب الملغي...');
  await carrierPage.goto(requestUrl);
  await carrierPage.waitForSelector('text=ملغى', { timeout: 10000 });
  const canQuote = await carrierPage.isVisible('button:has-text("تقديم العرض")');
  if (canQuote) throw new Error('❌ الناقل استطاع رؤية زر التسعير في طلب ملغى!');
  console.log('✅ السيناريو 1 اكتمل: النظام صد الناقل بشكل صحيح (الطلب ملغى).');


  // ==========================================
  // السيناريو 4: جدار الحماية (اختبار المدخلات الخاطئة)
  // ==========================================
  console.log('\\n▶️ السيناريو 4: محاولة إرسال طلب ببيانات ناقصة (اختبار الـ Validation)...');
  shipperPage.on('console', msg => console.log(`[SHIPPER BROWSER] ${msg.text()}`));
  await shipperPage.goto('https://souq-one-om-web.vercel.app/ar/transport/new');
  await shipperPage.waitForLoadState('domcontentloaded');
  await shipperPage.waitForSelector('button.rounded-2xl');
  await shipperPage.locator('button.rounded-2xl').nth(1).click();
  console.log('⏳ الشاحن يتنقل إلى خطوة المحافظات (Step 2)...');
  await shipperPage.click('button:has-text("التالي")');
  
  console.log('⏳ انتظار ظهور حقل المحافظة...');
  // Force clear the fields just in case they were cached from a previous scenario
  await shipperPage.selectOption('select[name="fromGovernorate"]', '');
  await shipperPage.fill('textarea[name="fromAddress"]', '');
  
  const fromGovValue = await shipperPage.$eval('select[name="fromGovernorate"]', el => el.value);
  const fromAddressValue = await shipperPage.$eval('textarea[name="fromAddress"]', el => el.value);
  console.log(`[DEBUG] fromGovernorate value: "${fromGovValue}", fromAddress: "${fromAddressValue}"`);
  
  console.log('⏳ محاولة الضغط على (التالي) والمحافظة فارغة لاختبار الـ Validation...');
  await shipperPage.click('button:has-text("التالي")');
  console.log('✅ تم الضغط على التالي. ننتظر ظهور رسالة الخطأ...');
  
  try {
    await shipperPage.waitForSelector('text="المحافظة مطلوبة"', { timeout: 10000 });
    console.log('✅ ظهرت رسالة الخطأ بشكل صحيح.');
  } catch (e) {
    console.log('❌ خطأ: لم تظهر رسالة الخطأ في الوقت المحدد. التقاط صورة...');
    await shipperPage.screenshot({ path: 'scenario4-failed.png' });
    throw e;
  }
  console.log('✅ السيناريو 4 اكتمل: تم منع الشاحن من تجاوز الخطوة ببيانات فارغة.');

  // ==========================================
  // السيناريو 2: محاولة الناقل تقديم عرضين لنفس الطلب (يجب أن يتم منعه)
  // ==========================================
  console.log('\\n▶️ السيناريو 2: إنشاء طلب، تقديم عرض، ومحاولة تقديم عرض آخر...');
  await shipperPage.goto('https://souq-one-om-web.vercel.app/ar/transport/new');
  await shipperPage.waitForSelector('button.rounded-2xl');
  await shipperPage.locator('button.rounded-2xl').nth(2).click();
  await shipperPage.click('button:has-text("التالي")');
  await shipperPage.waitForSelector('select[name="fromGovernorate"]');
  await shipperPage.selectOption('select[name="fromGovernorate"]', { index: 1 });
  await shipperPage.fill('textarea[name="fromAddress"]', 'بوشر، الغبرة');
  await shipperPage.selectOption('select[name="toGovernorate"]', { index: 3 });
  await shipperPage.fill('textarea[name="toAddress"]', 'نزوى، السوق');
  await shipperPage.click('button:has-text("التالي")');
  await shipperPage.fill('textarea[name="cargoDescription"]', 'بضائع عامة للسيناريو 2');
  await shipperPage.fill('input[name="weightTons"]', '5');
  await shipperPage.click('button:has-text("التالي")');
  await shipperPage.click('button:has-text("التالي")');
  
  {
    console.log('⏳ ننتظر التحويل لصفحة طلباتي أو نضغط زر الإرسال (السيناريو 2)...');
    
    try {
        await Promise.race([
            shipperPage.waitForURL(/\/transport\/my-requests/, { timeout: 45000 }),
            (async () => {
                const btn = shipperPage.locator('button[data-testid="submit-wizard"]');
                await btn.waitFor({ state: 'visible', timeout: 10000 });
                if (!(await btn.evaluate(b => b.disabled))) {
                    await btn.click();
                }
                await shipperPage.waitForURL(/\/transport\/my-requests/, { timeout: 45000 });
            })()
        ]);
    } catch (err) {
        console.log('❌ فشل النشر في السيناريو 2:', err.message);
        throw err;
    }
    
    await shipperPage.waitForSelector('a[href*="/transport/requests/"]');
    const firstRequestUrl = await shipperPage.locator('a[href*="/transport/requests/"]').first().getAttribute('href');
    const requestUrl2 = 'https://souq-one-om-web.vercel.app' + firstRequestUrl;

    await carrierPage.goto(requestUrl2);
    await carrierPage.waitForSelector('input[type="number"]');
    await carrierPage.fill('input[type="number"]', '40');
    await carrierPage.click('button:has-text("إرسال العرض")');
    await carrierPage.waitForSelector('text=تم إرسال عرضك', { timeout: 15000 });
    
    await carrierPage.goto(requestUrl2);
    const canQuote2 = await carrierPage.isVisible('button:has-text("إرسال العرض")');
    if (canQuote2) throw new Error('❌ الناقل استطاع الوصول لفورم التسعير مرة أخرى!');
    console.log('✅ السيناريو 2 اكتمل: النظام منع تقديم عرضين لنفس الناقل.');
  }

  // ==========================================
  // فحص نهائي للرادار
  // ==========================================
  if (caughtBugs.length > 0) {
    console.error('\\n🚨🚨🚨 الرادار التقط أخطاء (Bugs) في النظام أثناء الاختبار! 🚨🚨🚨');
    caughtBugs.forEach(b => console.error(b));
    process.exit(1);
  } else {
    console.log('\\n🎉🎉 تم الانتهاء من جميع الاختبارات، ورادار الأخطاء لم يكتشف أي بقات في النظام! 🎉🎉');
  }

  await browser.close();
})();
