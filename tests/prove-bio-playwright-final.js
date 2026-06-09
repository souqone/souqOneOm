const { chromium } = require('@playwright/test');

(async () => {
  console.log("===============================================================");
  console.log("🔥 التحدي قُبل! جاري تنفيذ الاختبار بالواجهة المرئية (Playwright)...");
  console.log("===============================================================\n");
  
  // البطيء جداً (slowMo: 300) لكي تستمتع برؤية السكربت وهو يكتب ويضغط بدقة!
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("1️⃣ الذهاب لمسار /login لفتح نافذة الدخول تلقائياً...");
    await page.goto('https://souq-one-om-web.vercel.app/login', { waitUntil: 'domcontentloaded' });
    
    console.log("2️⃣ انتظار ظهور حقل الإيميل في النافذة المنبثقة...");
    await page.waitForSelector('input[type="email"]', { state: 'visible' });
    
    console.log("3️⃣ كتابة البيانات...");
    await page.fill('input[type="email"]', 'max@souq.com');
    await page.fill('input[type="password"]', '1234512345MM');
    
    console.log("4️⃣ الضغط على زر (تسجيل الدخول) الصحيح بدقة متناهية...");
    // سحر الـ Locators: نبحث عن النموذج (Form) الذي يحتوي على حقل الإيميل، ثم نضغط على زر الإرسال بداخله!
    // هذا يضمن أننا لن نضغط على زر النشرة البريدية أو البحث.
    const loginForm = page.locator('form').filter({ has: page.locator('input[type="email"]') });
    await loginForm.locator('button[type="submit"]').click();
    
    console.log("5️⃣ انتظار اختفاء نافذة الدخول (دليل النجاح)...");
    await page.waitForSelector('input[type="email"]', { state: 'hidden', timeout: 15000 });
    console.log("✅ تمت عملية تسجيل الدخول بنجاح تام وتم إغلاق النافذة!");

    console.log("\n6️⃣ التوجه إلى مسار إنشاء ملف الشركة (/jobs/onboarding)...");
    await page.goto('https://souq-one-om-web.vercel.app/jobs/onboarding', { waitUntil: 'domcontentloaded' });
    
    console.log("7️⃣ البحث عن أيقونة 👔 واختيار (تأسيس شركة)...");
    await page.waitForSelector('text=👔', { state: 'visible', timeout: 15000 });
    // سنضغط على الزر الأب الذي يحتوي على الأيقونة
    await page.locator('button').filter({ hasText: '👔' }).click();
    console.log("✅ تم اختيار قسم صاحب العمل بنجاح.");

    console.log("8️⃣ تعبئة حقول الشركة وترك حقل Bio فارغاً...");
    await page.waitForSelector('select[name="governorate"]');
    
    // تعبئة البيانات المطلوبة
    await page.locator('select[name="governorate"]').selectOption({ index: 1 }); // مسقط
    await page.fill('input[name="companyName"]', 'شركة التحدي الكبير');
    await page.fill('textarea[name="bio"]', ''); // نؤكد تفريغه
    
    console.log("9️⃣ إرسال النموذج واصطياد الطلب (Network Interception)...");
    
    // تجهيز الشبكة للاصطياد
    const requestPromise = page.waitForRequest(req => req.url().includes('/employer-profile') && req.method() === 'POST');
    const responsePromise = page.waitForResponse(res => res.url().includes('/employer-profile') && res.request().method() === 'POST');

    // الضغط على زر الإنشاء بدقة متناهية داخل الفورم الصحيح
    const employerForm = page.locator('form').filter({ has: page.locator('select[name="governorate"]') });
    await employerForm.locator('button[type="submit"]').click();

    // ننتظر الرد من سيرفرك
    const request = await requestPromise;
    const response = await responsePromise;
    
    const payload = request.postDataJSON();
    const status = response.status();
    const bodyText = await response.text();

    console.log("\n==============================================");
    console.log("📤 [البيانات المرسلة - Payload]:");
    console.log(JSON.stringify(payload, null, 2));
    console.log("----------------------------------------------");
    console.log(`📥 [حالة الاستجابة - Status]: ${status}`);
    console.log("📥 [رد السيرفر - Response Body]:");
    console.log(bodyText);
    console.log("==============================================\n");

    if (status === 400 && bodyText.includes('bio')) {
      console.log("🏆 التحدي اكتمل! لقد رأيت بعينك السكربت وهو يسجل الدخول، يختار الشركة، يرسل النموذج فارغاً، ويفشله السيرفر بـ 400 Bad Request!");
    } else {
      console.log("⚠️ حدث شيء غير متوقع في استجابة السيرفر.");
    }

  } catch (error) {
    console.error("\n❌ فشل التحدي بسبب خطأ غير متوقع:", error.message);
  } finally {
    // ترك المتصفح مفتوحاً لثواني إضافية لتستمتع بالمنظر
    await page.waitForTimeout(4000);
    await browser.close();
  }
})();
