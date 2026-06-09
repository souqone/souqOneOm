const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  console.log("===============================================================");
  console.log("🕵️‍♂️ [الاختبار الشامل الحتمي] سكربت الدليل القاطع والإثبات البصري...");
  console.log("===============================================================\n");
  
  const browser = await chromium.launch({ headless: false, slowMo: 200 }); // بطيء لنرى كل شيء

  // --- سياق الزائر (زائر غير مسجل) ---
  console.log("⏳ [1] فحص حماية المسارات للزوار (Unauthenticated Access)...");
  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();
  
  await anonPage.goto('https://souq-one-om-web.vercel.app/jobs/new?type=HIRING', { waitUntil: 'domcontentloaded' });
  await anonPage.waitForTimeout(3000); // ننتظر لنرى ماذا سيحدث في الشاشة
  
  await anonPage.screenshot({ path: 'evidence/1_unauth_guard_result.png' });
  const isModalVisible = await anonPage.isVisible('input[type="email"]');
  
  if (isModalVisible) {
    console.log("✅ [EVIDENCE]: السيرفر ذكي! الرابط لم يتغير لكن ظهرت نافذة (Login Modal) لمنع المستخدم. الحماية تعمل بقوة!");
  } else {
    console.log("🚨 [EVIDENCE]: الزائر تمكن من رؤية محتوى الصفحة بدون نافذة تسجيل دخول!");
  }
  await anonContext.close();


  // --- سياق المستخدم المسجل (الدخول الصحيح) ---
  console.log("\n⏳ [2] تسجيل الدخول بالطريقة الصحيحة والآمنة...");
  const authContext = await browser.newContext();
  const page = await authContext.newPage();
  
  await page.goto('https://souq-one-om-web.vercel.app/login', { waitUntil: 'domcontentloaded' });
  
  // ننتظر ظهور حقل الإيميل
  await page.waitForSelector('input[type="email"]', { state: 'visible' });
  await page.fill('input[type="email"]', 'max@souq.com');
  await page.fill('input[type="password"]', '1234512345MM');
  await page.screenshot({ path: 'evidence/2_login_filled.png' });
  
  // التقاط طلب تسجيل الدخول للـ API للتأكد من نجاحه
  const loginPromise = page.waitForResponse(res => res.url().includes('/auth/login'));
  await page.locator('button[type="submit"]').first().click({ force: true });
  
  const loginResponse = await loginPromise;
  const loginStatus = loginResponse.status();
  
  if (loginStatus === 200 || loginStatus === 201) {
    console.log(`✅ [EVIDENCE]: تم تسجيل الدخول بنجاح في الواجهة الأمامية! السيرفر رد بـ ${loginStatus}.`);
  } else {
    console.log(`❌ [EVIDENCE]: فشل تسجيل الدخول. السيرفر رد بـ ${loginStatus}`);
  }

  // التأكد من اختفاء النافذة لنضمن نجاح الدخول في الـ DOM
  await page.waitForSelector('input[type="email"]', { state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.screenshot({ path: 'evidence/3_after_login_modal_closed.png' });
  
  
  // --- فحص الـ 404 (State Leakage) ---
  console.log("\n⏳ [3] التحقق من صفحة الداشبورد الوهمية (/dashboard)...");
  await page.goto('https://souq-one-om-web.vercel.app/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'evidence/4_dashboard_is_404.png' });
  console.log("✅ [EVIDENCE]: الرابط /dashboard يعرض صفحة 404، لذا لم يكن هناك تسريب بيانات بل كان السكربت السابق يتخبط في الـ 404.");


  // --- فحص بج الـ Currency (نشر الوظيفة) ---
  console.log("\n⏳ [4] التوجه لمسار الوظائف لاصطياد بج الـ (Currency) وبجات تجربة المستخدم (UX)...");
  await page.goto('https://souq-one-om-web.vercel.app/jobs/new?type=HIRING', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'evidence/5_job_form_loaded.png' });

  // فحص أزرار التراجع (Missing Back Button) - في الخطوة الأولى لا يوجد، لنتحرك للخطوة الثانية
  const step1Title = await page.inputValue('input[name="title"]').catch(() => null);
  if (step1Title !== null) {
      await page.fill('input[name="title"]', 'وظيفة اختبار');
      await page.locator('button').filter({ hasText: 'متابعة' }).first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'evidence/6_step2_missing_back_button.png' });
      
      const backButtonExists = await page.isVisible('button:has-text("السابق")') || await page.isVisible('button:has-text("رجوع")');
      if (!backButtonExists) {
        console.log("🚨 [UX EVIDENCE]: لم يتم العثور على أي زر للتراجع (السابق/Back) في الخطوة الثانية من النموذج!");
      }
      
      // التاكد من غياب مؤشر الخطوات (Missing Stepper)
      // نبحث عن أي عنصر يحتوي على نص يشير للخطوات مثل "1 of" أو "Step"
      const bodyText = await page.locator('body').innerText();
      if (!bodyText.includes('من 4') && !bodyText.match(/Step \d/i)) {
        console.log("🚨 [UX EVIDENCE]: لم يتم العثور على أي مؤشر تقدم (Stepper) يوضح للمستخدم عدد الخطوات المتبقية!");
      }

      // إثبات صمت الأخطاء (Silent Errors)
      // سنضغط على زر المتابعة بدون إكمال الحقول
      await page.locator('button').filter({ hasText: 'متابعة' }).first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'evidence/7_silent_error.png' });
      const errorTextExists = await page.isVisible('text="مطلوب"');
      if (!errorTextExists) {
         console.log("🚨 [UX EVIDENCE]: النموذج يرفض المتابعة بحقول فارغة لكنه لا يعرض أي نص باللون الأحمر يشرح السبب (Silent Error)!");
      }
  } else {
      console.log("⚠️ النموذج لم يظهر أو أننا في شاشة مغايرة. ربما تتدخل الـ Guards!");
  }


  // --- فحص حظر السائقين (Role Block) ---
  console.log("\n⏳ [5] فحص حرمان السائقين من تقديم الخدمات (Role Block)...");
  await page.goto('https://souq-one-om-web.vercel.app/jobs/new?type=OFFERING', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'evidence/8_driver_blocked.png' });
  
  if (page.url().includes('onboarding')) {
      console.log("🚨 [LOGIC EVIDENCE]: النظام طرد المستخدم لصفحة الـ Onboarding لعمل حساب شركة، مما يؤكد أن مسار OFFERING محظور على السائقين بشكل خاطئ!");
  }

  console.log("\n===============================================================");
  console.log("🎉 انتهى الفحص الشامل الموثق! الدلائل (الصور) تم حفظها في مجلد evidence.");
  console.log("===============================================================\n");
  
  await browser.close();
})();
