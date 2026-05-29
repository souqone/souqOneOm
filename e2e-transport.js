const { chromium } = require('@playwright/test');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
  console.log("🚀 جاري تشغيل المتصفح لعمل اختبار حقيقي (E2E) المتقدم...");
  
  // Launch browser with headless: false
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. الاستماع للأخطاء البرمجية في المتصفح (Console Errors & Page Errors)
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`\n🔴 [متصفح - خطأ]: ${msg.text()}`);
    }
  });

  page.on('pageerror', exception => {
    console.log(`\n💥 [متصفح - استثناء]: ${exception}`);
  });

  // 2. الاستماع لطلبات الشبكة لمعرفة سبب فشل إرسال الطلب (Network requests)
  page.on('response', async response => {
    const url = response.url();
    // نراقب فقط طلبات الـ API الخاصة بالنقل
    if (url.includes('/api/trpc') || url.includes('/api') && url.includes('transport')) {
      if (!response.ok()) {
        console.log(`\n🛑 [شبكة - فشل API]: ${response.status()} ${response.statusText()} - ${url}`);
        try {
          const body = await response.text();
          console.log(`   تفاصيل الخطأ: ${body}`);
        } catch (e) {}
      }
    }
  });

  console.log("🌐 الانتقال إلى الموقع...");
  await page.goto('https://souq-one-om-web.vercel.app/login');

  await new Promise(resolve => {
    rl.question('\n🛑 [توقف مؤقت]: الرجاء تسجيل الدخول في المتصفح المفتوح.\nبعد الوصول للصفحة الرئيسية، اضغط على زر [Enter] هنا في الـ Terminal للمتابعة...\n', () => {
      resolve();
    });
  });

  console.log("\n▶️ استكمال الاختبار: جاري إنشاء طلب نقل جديد...");

  try {
    await page.goto('https://souq-one-om-web.vercel.app/transport/new');

    // Wait for the form to load (the H1 title)
    await page.waitForSelector('text=إنشاء طلب نقل');
    console.log("✅ تم الوصول لصفحة إنشاء الطلب");

    // Step 1: Service Type
    // Use a very safe locator: looking for buttons with rounded-2xl class which are the service cards.
    await page.waitForSelector('button.rounded-2xl');
    await page.locator('button.rounded-2xl').first().click();
    await page.click('button:has-text("التالي")');
    console.log("✅ تم تخطي الخطوة 1 (اختيار الخدمة)");

    // Step 2: Route
    console.log("⏳ جاري تعبئة الخطوة 2 (المسار)...");
    await page.selectOption('select[name="fromGovernorate"]', { index: 1 }); // select second option
    await page.fill('textarea[name="fromAddress"]', 'السيب، شارع السلام، بجوار المخبز');
    
    await page.selectOption('select[name="toGovernorate"]', { index: 2 }); // select third option
    await page.fill('textarea[name="toAddress"]', 'صحار، المنطقة الصناعية');
    
    await page.click('button:has-text("التالي")');
    console.log("✅ تم تعبئة الخطوة 2");

    // Step 3: Cargo
    console.log("⏳ جاري تعبئة الخطوة 3 (البضاعة)...");
    await page.fill('textarea[name="cargoDescription"]', '10 كراتين ملابس جاهزة، قابلة للكسر، يرجى التعامل بحذر.');
    await page.fill('input[name="weightTons"]', '2');
    
    await page.click('button:has-text("التالي")');
    console.log("✅ تم تعبئة الخطوة 3");

    // Step 4: Timing
    console.log("⏳ جاري تعبئة الخطوة 4 (الموعد)...");
    await page.click('button:has-text("التالي")');
    console.log("✅ تم تعبئة الخطوة 4");

    // Step 5: Review
    console.log("⏳ نحن في الخطوة الأخيرة (المراجعة)...");
    
    // Capture the API response when we click submit
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('requests') && resp.request().method() === 'POST', { timeout: 30000 }),
      page.click('[data-testid="submit-wizard"]')
    ]);

    if (response) {
      console.log(`\n🔍 حالة الاستجابة من السيرفر: ${response.status()}`);
      if (response.ok()) {
        console.log("✅ تم إرسال الطلب وقبوله في السيرفر!");
        await page.waitForURL('**/transport/my-requests', { timeout: 15000 });
        console.log("🎉 نجاح! تم تحويلك إلى صفحة طلباتي.");
      } else {
        console.log("❌ السيرفر رفض الطلب. تفقد الأخطاء بالأعلى.");
      }
    } else {
      console.log("⚠️ لم يتم التقاط طلب API مباشر، قد يكون السيرفر بطيئاً أو لم يتم الإرسال أصلاً.");
    }
    
    console.log("\nالاختبار انتهى. سيبقى المتصفح مفتوحاً لمدة 10 ثوانٍ ثم يغلق...");
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error("❌ فشل الاختبار:", error);
  }

  await browser.close();
  rl.close();
})();
