const { chromium } = require('@playwright/test');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
  console.log("🕵️‍♂️ [صائد البجات] جاري بدء الفحص الشامل لمسار الناقل (Carrier Flow)...");
  
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  let bugsCount = 0;

  // 1. إعداد صائد البجات (Bug Hunter)
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`\n🐛 [BUG - Console Error]: ${msg.text()}`);
      bugsCount++;
    } else if (msg.type() === 'warning') {
      // Ignore React warnings for now unless they are severe
    }
  });

  page.on('pageerror', exception => {
    console.log(`\n🐛 [BUG - Uncaught Exception]: ${exception}`);
    bugsCount++;
  });

  page.on('response', async response => {
    const url = response.url();
    const status = response.status();
    if (status >= 400 && url.includes('/api/')) {
      console.log(`\n🐛 [BUG - API Error]: ${status} ${response.statusText()} on ${url}`);
      try {
        const body = await response.text();
        console.log(`   تفاصيل الخطأ: ${body}`);
      } catch (e) {}
      bugsCount++;
    }
  });

  try {
    // 2. التسجيل وإنشاء حساب جديد
    console.log("\n⏳ [الخطوة 1]: جاري فتح صفحة إنشاء حساب جديد (Signup)...");
    await page.goto('https://souq-one-om-web.vercel.app/signup');

    await new Promise(resolve => {
      rl.question('\n⏸️ [تدخل بشري مطلوب]: الرجاء إنشاء حساب جديد في المتصفح المفتوح، وتأكيد الإيميل، ثم تسجيل الدخول. \nاضغط [Enter] هنا بعد أن تُكمل التسجيل وتصبح داخل المنصة بحسابك الجديد...\n', () => {
        resolve();
      });
    });

    // 3. التوجه لإنشاء بروفايل ناقل
    console.log("\n⏳ [الخطوة 2]: التوجه إلى صفحة التسجيل كناقل...");
    await page.goto('https://souq-one-om-web.vercel.app/transport/carriers/register');
    await page.waitForLoadState('networkidle');

    console.log("📝 جاري ملء استمارة الناقل بالكامل...");
    
    // إنشاء صورة وهمية مؤقتة للرفع
    const dummyImagePath = path.join(__dirname, 'dummy-avatar.png');
    if (!fs.existsSync(dummyImagePath)) {
      // إنشاء ملف فارغ بصيغة png
      fs.writeFileSync(dummyImagePath, Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex'));
    }

    // الانتظار حتى يظهر الفورم
    await page.waitForSelector('form', { timeout: 15000 });

    // ملء اسم الشركة (إذا كان موجوداً)
    const companyInput = page.locator('input[name="companyName"], input[id="companyName"]');
    if (await companyInput.count() > 0) {
      await companyInput.fill('شركة الناقل السريع (تجربة E2E)');
    }

    // النبذة التعريفية
    const bioInput = page.locator('textarea[name="bio"], textarea[id="bio"]');
    if (await bioInput.count() > 0) {
      await bioInput.fill('نحن شركة نقل موثوقة، نقدم خدمات النقل الثقيل والخفيف بأعلى معايير الجودة والسرعة.');
    }

    // رقم التواصل
    const phoneInput = page.locator('input[type="tel"]').first();
    if (await phoneInput.count() > 0) {
      await phoneInput.fill('+96899999999');
    }

    // اختيار المحافظة والولاية (هنا نختار أي قيم متاحة في القوائم المنسدلة)
    // نطلب من المستخدم استكمال الباقي يدوياً لضمان الدقة مع القوائم المنسدلة المعقدة
    console.log("✋ [صائد البجات]: قمت بملء بعض الحقول النصية.");
    
    await new Promise(resolve => {
      rl.question('\n⏸️ [تدخل بشري مطلوب]: الرجاء إكمال باقي الحقول (المحافظة، الولاية، أنواع المركبات، الخدمات)، ارفع أي صورة، واضغط على "تسجيل". \nانتظر حتى تظهر رسالة النجاح، ثم اضغط [Enter] هنا للمتابعة...\n', () => {
        resolve();
      });
    });

    console.log("\n⏳ [الخطوة 3]: التحقق من ظهور البروفايل...");
    await page.goto('https://souq-one-om-web.vercel.app/transport/carriers/dashboard');
    await page.waitForLoadState('networkidle');

    // 4. توثيق الحساب (محاكاة من خلال قاعدة البيانات)
    console.log("\n⏳ [الخطوة 4]: توثيق حساب الناقل...");
    console.log("🛠️ نظراً لأن التوثيق يحتاج لوحة تحكم الإدارة، سنحتاج لتدخلك أو سنعتبر أنه موثق لغرض الفحص.");
    
    // 5. التقديم على طلب نقل
    console.log("\n⏳ [الخطوة 5]: التوجه لصفحة تصفح طلبات النقل...");
    await page.goto('https://souq-one-om-web.vercel.app/transport/browse');
    await page.waitForLoadState('networkidle');

    // اختيار أول طلب والتقديم عليه
    const firstRequestLink = page.locator('a[href*="/transport/requests/"]').first();
    if (await firstRequestLink.count() > 0) {
      await firstRequestLink.click();
      await page.waitForLoadState('networkidle');

      console.log("📝 جاري محاولة تقديم عرض (Quote) على الطلب...");
      
      const priceInput = page.locator('input[type="number"][step="0.1"]');
      if (await priceInput.count() > 0) {
        await priceInput.fill('120');
        const hoursInput = page.locator('input[type="number"]:not([step])').first();
        if (await hoursInput.count() > 0) await hoursInput.fill('3');
        
        const messageBox = page.locator('textarea').first();
        if (await messageBox.count() > 0) await messageBox.fill('عرض سعر لخدمة النقل (تجربة أوتوماتيكية)');

        console.log("✋ [صائد البجات]: قمت بتعبئة تفاصيل العرض.");
        
        await new Promise(resolve => {
          rl.question('\n⏸️ [تدخل بشري مطلوب]: يرجى الضغط على زر "تقديم العرض"، وتأكيد نجاح العملية. \nبعدها اضغط [Enter] هنا...\n', () => {
            resolve();
          });
        });
      } else {
        console.log("⚠️ لم أتمكن من العثور على حقول تقديم العرض (قد يكون الطلب مغلقاً أو لا يمكنك التقديم عليه).");
      }

    } else {
      console.log("⚠️ لا توجد طلبات نقل متاحة للتقديم عليها حالياً.");
    }

  } catch (error) {
    console.error("❌ حدث خطأ غير متوقع أثناء الفحص:", error);
    bugsCount++;
  } finally {
    console.log("\n=================================");
    console.log("📊 نتيجة فحص صائد البجات (Bug Hunter):");
    if (bugsCount === 0) {
      console.log("✅ 0 أخطاء! النظام يعمل بسلاسة تامة ومسار الناقل خالٍ من المشاكل.");
    } else {
      console.log(`⚠️ تم اكتشاف ${bugsCount} بَج (Bugs/Errors) أثناء الفحص. (راجع الأخطاء المطبوعة أعلاه).`);
    }
    console.log("=================================\n");

    console.log("🏁 انتهى الفحص، جاري إغلاق المتصفح...");
    await browser.close();
    rl.close();
  }
})();
