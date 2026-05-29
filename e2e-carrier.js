const { chromium } = require('@playwright/test');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
  console.log("🚀 جاري تشغيل المتصفح لعمل اختبار حقيقي لدور (الناقل)...");
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. اصطياد الأخطاء البرمجية
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`\n🔴 [متصفح - خطأ]: ${msg.text()}`);
    }
  });

  page.on('pageerror', exception => {
    console.log(`\n💥 [متصفح - استثناء]: ${exception}`);
  });

  // 2. مراقبة طلبات الشبكة الخاصة بالعروض
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api') && url.includes('quotes')) {
      console.log(`\n📡 [شبكة - طلب إضافة عرض]: ${response.status()} ${response.statusText()} - ${url}`);
      if (!response.ok()) {
        try {
          const body = await response.text();
          console.log(`   تفاصيل الخطأ من السيرفر: ${body}`);
        } catch (e) {}
      }
    }
  });

  console.log("🌐 الانتقال إلى صفحة تسجيل الدخول...");
  await page.goto('https://souq-one-om-web.vercel.app/login');

  await new Promise(resolve => {
    rl.question('\n🛑 [توقف مؤقت]: الرجاء تسجيل الدخول في المتصفح المفتوح باستخدام حساب (ناقل).\nبعد الوصول للصفحة الرئيسية، اضغط على زر [Enter] هنا في الـ Terminal للمتابعة...\n', () => {
      resolve();
    });
  });

  console.log("\n▶️ استكمال الاختبار: جاري البحث عن طلبات مفتوحة لتقديم عرض...");

  try {
    // الذهاب إلى صفحة تصفح الطلبات
    await page.goto('https://souq-one-om-web.vercel.app/transport/browse');
    await page.waitForSelector('.card-base', { timeout: 15000 });
    console.log("✅ تم تحميل صفحة تصفح الطلبات.");

    // العثور على أول طلب مفتوح والضغط عليه
    // Assuming request cards are links (<a> tags) containing href to /requests/
    const requestCard = page.locator('a[href*="/transport/requests/"]').first();
    await requestCard.click();
    console.log("✅ تم الدخول إلى تفاصيل أول طلب متاح.");

    // انتظار تحميل تفاصيل الطلب ونموذج تقديم العرض
    await page.waitForSelector('text=السعر المقترح', { timeout: 15000 });
    console.log("✅ صفحة تفاصيل الطلب جاهزة.");

    console.log("⏳ جاري تعبئة تفاصيل العرض (السعر، الساعات، الرسالة)...");
    
    // Fill the quote form
    // Price input is the first number input with min="1" step="0.1"
    await page.locator('input[type="number"][step="0.1"]').fill('150');
    
    // Hours input is the second number input without step
    await page.locator('input[type="number"]:not([step])').first().fill('5');
    
    // Message textarea
    await page.locator('textarea').first().fill('أنا مستعد لنقل الشحنة بكل أمان وسرعة. لدي خبرة ممتازة في هذا المسار.');
    
    console.log("✅ تم تعبئة البيانات.");
    console.log("⏳ جاري الضغط على (إرسال العرض)...");

    // Wait for the quote submission API
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('quotes') && resp.request().method() === 'POST', { timeout: 15000 }).catch(() => null),
      page.click('button:has-text("إرسال العرض")', { force: true }) // force in case of floating elements
    ]);

    if (response) {
      if (response.ok()) {
        console.log("✅ تم قبول العرض بنجاح في السيرفر!");
      } else {
        console.log("❌ السيرفر رفض العرض. راجع الأخطاء المطبوعة بالأعلى.");
      }
    } else {
      console.log("⚠️ لم يتم التقاط استجابة الـ API. تأكد من أن الواجهة أرسلت الطلب فعلاً.");
    }

    console.log("\nالاختبار انتهى. سيبقى المتصفح مفتوحاً لمدة 10 ثوانٍ ثم يغلق...");
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error("❌ فشل الاختبار:", error);
  }

  await browser.close();
  rl.close();
})();
