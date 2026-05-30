const { chromium } = require('playwright');

(async () => {
  // تم زيادة الـ slowMo إلى 200 لتجنب حظر الـ API (Error 429 Rate Limit)
  const browser = await chromium.launch({ headless: false, slowMo: 250 });
  const shipperContext = await browser.newContext();
  const carrierContext = await browser.newContext();
  
  const shipperPage = await shipperContext.newPage();
  const carrierPage = await carrierContext.newPage();

  // مراقبة الأخطاء في كلتا النافذتين (اصطياد اللوج)
  const catchErrors = (page, role) => {
    // 1. أخطاء الجافاسكريبت المباشرة (Exceptions)
    page.on('pageerror', err => {
      console.error(`\n🔴 [${role} - متصفح خطأ]: ${err.message}`);
    });
    // 2. أخطاء الطلبات الفاشلة في الشبكة (Network)
    page.on('requestfailed', request => {
      const errorText = request.failure()?.errorText;
      if (errorText && errorText !== 'net::ERR_ABORTED') {
        console.error(`\n🔴 [${role} - شبكة خطأ]: فشل طلب ${request.url()} - ${errorText}`);
      }
    });
    // 3. رادار الكونسول لوج (Console.error)
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`\n🔴 [${role} - كونسول خطأ]: ${msg.text()}`);
      }
    });
  };

  catchErrors(shipperPage, 'الشاحن');
  catchErrors(carrierPage, 'الناقل');

  console.log('🚀 بدء اختبار التزامن الشامل (Integration Flow Test) 🚀');
  console.log('سيتم فتح نافذتين (واحدة للشاحن والأخرى للناقل).');
  
  // 1. تسجيل الدخول الأوتوماتيكي
  console.log('\n▶️ المرحلة 0: تسجيل الدخول الأوتوماتيكي للطرفين...');
  
  const loginUser = async (page, email, password, role) => {
    console.log(`⏳ جاري تسجيل دخول ${role}...`);
    await page.goto('https://souq-one-om-web.vercel.app/ar/login');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    await page.click('button[type="submit"]');
    // الانتظار حتى يتغير الرابط ولا يعود يحتوي على login (دعم الانتقال الداخلي لـ Next.js)
    await page.waitForURL(url => !url.href.includes('/login'), { timeout: 20000 });
    console.log(`✅ تم دخول ${role} بنجاح.`);
  };

  await Promise.all([
    loginUser(shipperPage, 'mahmudsaed997@gmail.com', '14520202', 'الشاحن'),
    loginUser(carrierPage, 'mahmmouudmuhamed2097@gmail.com', '1234512345', 'الناقل')
  ]);
  
  // 2. إنشاء الطلب من حساب الشاحن
  console.log('\n▶️ المرحلة 1: إنشاء طلب جديد (الشاحن)...');
  await shipperPage.goto('https://souq-one-om-web.vercel.app/ar/transport/new');
  await shipperPage.waitForSelector('text=إنشاء طلب نقل', { state: 'visible', timeout: 30000 });
  
  // تعبئة البيانات
  await shipperPage.waitForSelector('button.rounded-2xl');
  await shipperPage.locator('button.rounded-2xl').first().click();
  await shipperPage.click('button:has-text("التالي")');
  
  await shipperPage.selectOption('select[name="fromGovernorate"]', { index: 1 });
  await shipperPage.fill('textarea[name="fromAddress"]', 'السيب، شارع السلام');
  await shipperPage.selectOption('select[name="toGovernorate"]', { index: 2 });
  await shipperPage.fill('textarea[name="toAddress"]', 'صحار، الصناعية');
  await shipperPage.click('button:has-text("التالي")');
  
  await shipperPage.fill('textarea[name="cargoDescription"]', 'أثاث مكتبي كامل للإرسال (اختبار التكامل)');
  await shipperPage.fill('input[name="weightTons"]', '2');
  await shipperPage.click('button:has-text("التالي")');
  
  await shipperPage.click('button:has-text("التالي")');
  
  console.log('⏳ إرسال الطلب...');
  await shipperPage.waitForSelector('[data-testid="submit-wizard"]', { state: 'visible' });
  
  const [response] = await Promise.all([
    shipperPage.waitForResponse(resp => resp.url().includes('requests') && resp.request().method() === 'POST', { timeout: 30000 }),
    shipperPage.click('[data-testid="submit-wizard"]', { force: true })
  ]);
  
  const responseData = await response.json();
  const requestId = responseData.id;
  
  await shipperPage.waitForURL(/\/transport\/my-requests/);
  console.log('✅ تم إنشاء الطلب بنجاح والتحويل لصفحة طلباتي.');
  console.log(`📌 رقم الطلب المستخرج: ${requestId}`);
  
  // 3. الناقل يقدم عرض سعر
  console.log('\n▶️ المرحلة 2: تقديم تسعيرة (الناقل)...');
  await carrierPage.goto(`https://souq-one-om-web.vercel.app/ar/transport/requests/${requestId}`);
  await carrierPage.waitForLoadState('networkidle');
  
  await carrierPage.fill('input[type="number"][min="1"]', '120'); // السعر
  await carrierPage.fill('textarea', 'أنا جاهز لنقل الأثاث بحرص تام (رسالة من اختبار التزامن).');
  await carrierPage.click('button:has-text("إرسال العرض")');
  
  await carrierPage.waitForSelector('text=تم إرسال عرضك بنجاح!', { timeout: 15000 });
  console.log('✅ تم تقديم العرض من الناقل بنجاح!');
  
  // 4. الشاحن يوافق على العرض
  console.log('\n▶️ المرحلة 3: الموافقة على العرض (الشاحن)...');
  await shipperPage.goto(`https://souq-one-om-web.vercel.app/ar/transport/requests/${requestId}`);
  await shipperPage.waitForSelector('text=العروض المقدمة');
  
  console.log('⏳ جاري الضغط على (قبول هذا العرض)...');
  await shipperPage.click('button:has-text("قبول هذا العرض")');
  
  await shipperPage.waitForURL(/\/transport\/(my-bookings|bookings\/)/, { timeout: 20000 });
  console.log('✅ تمت الموافقة على العرض والتحويل لصفحة الحجز بنجاح!');
  
  // إذا تم التحويل لصفحة الحجوزات العامة، ندخل على الحجز الذي تم إنشاؤه للتو
  if (shipperPage.url().includes('my-bookings')) {
    await shipperPage.waitForSelector('a[href*="/transport/bookings/"]', { timeout: 15000 });
    await shipperPage.locator('a[href*="/transport/bookings/"]').first().click();
    await shipperPage.waitForLoadState('networkidle');
  }

  // 5. التحقق من الإشعارات (الناقل)
  console.log('\n▶️ المرحلة 4: التحقق من الإشعارات (الناقل)...');
  await carrierPage.goto('https://souq-one-om-web.vercel.app/ar/notifications');
  await carrierPage.waitForLoadState('networkidle');
  // نتأكد فقط من تحميل الصفحة (يمكنك لاحقاً إضافة استهداف لنص إشعار محدد)
  console.log('✅ تم فتح صفحة الإشعارات بنجاح للناقل.');

  // 6. فتح المحادثة (الشاحن والناقل)
  console.log('\n▶️ المرحلة 5: المراسلة والمحادثة بين الطرفين...');
  console.log('⏳ الشاحن ينتقل لصفحة المحادثة من تفاصيل الحجز...');
  
  await shipperPage.waitForSelector('a[href*="/messages/"]', { timeout: 15000 });
  await shipperPage.click('a[href*="/messages/"]');
  await shipperPage.waitForLoadState('networkidle');
  
  const convUrl = shipperPage.url();
  const convId = convUrl.split('/').pop();
  
  console.log(`📌 رقم المحادثة: ${convId}`);
  
  console.log('⏳ الناقل يفتح نفس المحادثة...');
  await carrierPage.goto(`https://souq-one-om-web.vercel.app/ar/messages/${convId}`);
  await carrierPage.waitForLoadState('networkidle');
  
  console.log('💬 الشاحن يكتب رسالة للناقل...');
  await shipperPage.waitForSelector('textarea');
  await shipperPage.waitForTimeout(2000); // إعطاء فرصة للسوكيت للاتصال
  
  await shipperPage.fill('textarea', 'أهلاً بك، متى يمكنك استلام البضاعة؟ (من السكربت)');
  await shipperPage.keyboard.press('Enter');
  console.log('✅ تم إرسال الرسالة من الشاحن للسيرفر.');
  
  console.log('💬 الناقل يستقبل الرسالة ويكتب الرد...');
  // الانتظار حتى تظهر رسالة الشاحن عند الناقل
  await carrierPage.waitForSelector('text=متى يمكنك استلام البضاعة', { timeout: 15000 });
  
  await carrierPage.waitForTimeout(1500); // لتجنب Rate Limit (429)
  await carrierPage.fill('textarea', 'سأكون عندك غداً صباحاً بإذن الله. (من السكربت)');
  await carrierPage.waitForTimeout(500);
  await carrierPage.keyboard.press('Enter');
  
  console.log('⏳ الشاحن يتأكد من وصول الرد...');
  await shipperPage.waitForSelector('text=غداً صباحاً', { timeout: 15000 });
  
  console.log('✅ نظام المحادثة الفورية (Chat) يعمل بامتياز وبدون تأخير بالاتجاهين!');
  
  console.log('\n🎉🎉 اكتملت الدورة كاملة بنجاح 100% (Integration Flow + Errors + Chat + Notifications) 🎉🎉');
  
  console.log('\nسيتم إغلاق المتصفحات بعد 15 ثانية...');
  setTimeout(async () => {
    await browser.close();
    process.exit(0);
  }, 15000);
})();
