const { chromium } = require('@playwright/test');

(async () => {
  console.log("🕵️‍♂️ [صائد البجات] جاري بدء الفحص الشامل للوظائف + 🎨 UX & UserFlow Audit...");
  
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  
  // 📱 Start with Desktop Viewport
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  let logicBugs = 0;
  let uxBugs = 0;

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('429')) {
      // Ignore 429 and 404 for this run to focus on UX
      if (!msg.text().includes('404')) {
        console.log(`\n🐛 [BUG - Console Error]: ${msg.text()}`);
      }
    }
  });

  try {
    console.log("\n⏳ [UserFlow - Login]: فحص تجربة تسجيل الدخول...");
    await page.goto('https://souq-one-om-web.vercel.app/login');
    
    // UX Check: Are placeholders present?
    const emailPlaceholder = await page.getAttribute('input[type="email"]', 'placeholder');
    if (!emailPlaceholder) {
      console.log("🎨 [UX Bug]: حقل الإيميل لا يحتوي على Placeholder!");
      uxBugs++;
    }

    // UX Check: Validation feedback
    console.log("🎨 [UX Check]: فحص تجربة المستخدم عند الخطأ (تجاوز الإدخال والضغط على تسجيل)...");
    await page.locator('button[type="submit"]').first().click({ force: true });
    // Should show red border or error text
    await page.waitForTimeout(1000);
    const errorMsg = page.locator('.text-red-600, .border-red-500, [aria-invalid="true"]');
    if (await errorMsg.count() === 0) {
      console.log("🎨 [UX Bug]: عند ترك الحقول فارغة، لا يظهر أي تنبيه مرئي أو لون أحمر للمستخدم!");
      uxBugs++;
    } else {
      console.log("✅ [UX]: تنبيهات الأخطاء تظهر بشكل ممتاز.");
    }

    // Continue Login
    await page.fill('input[type="email"]', 'max@souq.com');
    await page.fill('input[type="password"]', '1234512345MM');
    await page.locator('button[type="submit"]').first().click({ force: true });
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
    
    console.log("\n⏳ [UserFlow - Onboarding & Empty States]: فحص شاشة إنشاء الوظيفة...");
    await page.goto('https://souq-one-om-web.vercel.app/jobs/new?type=HIRING');
    await page.waitForTimeout(4000);

    if (page.url().includes('/jobs/onboarding')) {
      // UX Check: Onboarding design
      const title = await page.textContent('h1');
      if (!title || title.trim() === '') {
        console.log("🎨 [UX Bug]: صفحة الـ Onboarding تفتقر إلى عنوان (H1) واضح يشرح للمستخدم ماذا يفعل!");
        uxBugs++;
      }
      
      const employerBtn = page.locator('button', { hasText: '👔' });
      await employerBtn.first().click({ force: true });
      await page.waitForTimeout(1000);
      
      await page.selectOption('select[name="governorate"]', { index: 1 });
      await page.fill('input[name="companyName"]', 'شركة الفحص الآلي');
      await page.fill('textarea[name="bio"]', 'نحن شركة رائدة في عمان');
      
      // UX Check: Loading State on Submit
      console.log("🎨 [UX Check]: فحص حالة التحميل (Loading State) عند الحفظ...");
      await page.locator('button[type="submit"]').first().click({ force: true });
      
      const btn = page.locator('button[type="submit"]').first();
      const isDisabled = await btn.isDisabled();
      const hasSpinner = await btn.locator('.animate-spin, svg').count() > 0;
      
      if (!isDisabled && !hasSpinner) {
        console.log("🎨 [UX Bug]: الزر لا يتحول إلى حالة 'التحميل' (Loading) ولا يتم إيقافه (Disabled) أثناء استدعاء الـ API! المستخدم قد يضغط مرتين.");
        uxBugs++;
      } else {
        console.log("✅ [UX]: حالة التحميل تعمل بشكل رائع (يمنع الضغط المزدوج).");
      }

      await page.waitForURL('**/jobs/new*', { timeout: 10000 }).catch(()=>{});
      await page.waitForTimeout(2000);
    }

    console.log("\n⏳ [UserFlow - Multi-Step Form]: فحص نموذج الوظيفة (Steppers)...");
    
    // Check if Stepper is visible
    const steps = page.locator('[data-testid="stepper-item"], .step-indicator');
    if (await steps.count() === 0) {
      console.log("🎨 [UX Bug]: لا يوجد مؤشر للخطوات (Stepper) يوضح للمستخدم مكانه الحالي في النموذج!");
      uxBugs++;
    }

    // Attempt to skip without required fields
    await page.locator('button[data-testid="next-button"]').first().click({ force: true });
    await page.waitForTimeout(500);
    
    console.log("🎨 [UX Check]: محاولة الانتقال للخطوة التالية دون تعبئة الحقول الإجبارية...");
    await page.locator('button[data-testid="next-button"]').first().click({ force: true });
    await page.waitForTimeout(500);
    
    // Did it block us?
    const isStillOnStep1 = await page.isVisible('input[name="title"]');
    if (!isStillOnStep1) {
      console.log("🐛 [UserFlow Bug]: النظام سمح بالانتقال للخطوة التالية دون تعبئة عنوان الوظيفة الإجباري!");
      logicBugs++;
    } else {
      console.log("✅ [UserFlow]: النموذج يمنع الانتقال بنجاح. ممتاز.");
      // Check if error messages are shown
      const titleError = page.locator('p.text-red-500, p.text-destructive');
      if (await titleError.count() === 0) {
        console.log("🎨 [UX Bug]: تم منع الانتقال، ولكن لا توجد رسالة خطأ صريحة توضح للمستخدم (الحقل مطلوب)!");
        uxBugs++;
      }
    }

    await page.fill('input[name="title"]', 'سائق نقل');
    await page.fill('textarea[name="description"]', 'مطلوب سائق للعمل في مسقط');
    await page.fill('input[type="number"]', '500'); 
    
    // Keyboard navigation Test
    console.log("🎨 [UX Check]: فحص التنقل بلوحة المفاتيح (Accessibility/Keyboard Nav)...");
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    await page.locator('button[data-testid="next-button"]').first().click({ force: true });
    await page.waitForTimeout(1000);

    // Change Viewport to Mobile
    console.log("\n📱 [UX Check - Responsiveness]: تبديل الشاشة إلى عرض الجوال (iPhone 12)...");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(2000);
    
    // Check if Back/Next buttons overlap or overflow on Mobile
    const nextBtnBox = await page.locator('button[data-testid="next-button"]').first().boundingBox();
    const prevBtnBox = await page.locator('button[data-testid="prev-button"]').first().boundingBox();
    
    if (nextBtnBox && prevBtnBox) {
      if (nextBtnBox.y !== prevBtnBox.y) {
        console.log("🎨 [UX Bug]: أزرار (التالي/السابق) غير مصطفة على نفس الخط في شاشة الجوال (Layout Shift)!");
        uxBugs++;
      }
    } else {
      console.log("🎨 [UX Bug]: زر (الرجوع) غير موجود! تجربة سيئة للمستخدم إذا أراد تعديل خطوة سابقة.");
      uxBugs++;
    }

    await page.locator('button[data-testid="next-button"]').first().click({ force: true });
    await page.waitForTimeout(1000);

    await page.selectOption('select', { index: 1 }); 
    
    console.log("🎨 [UX Check]: النقر على زر النشر...");
    await page.locator('button[data-testid="submit-button"]').first().click({ force: true });
    
    // Wait for the currency 400 error or redirect
    await page.waitForTimeout(3000);
    
    // Check if Toast/Snackbar appears on Error!
    const toast = page.locator('[role="status"], .toast, .snackbar, .go3958317564');
    if (await toast.count() === 0) {
      console.log("🎨 [UX Bug]: عند فشل النشر (بسبب بج Currency 400)، لم يظهر أي إشعار (Toast) للمستخدم يعلمه بالفشل! الشاشة تتجمد فقط.");
      uxBugs++;
    } else {
      console.log("✅ [UX]: إشعار الخطأ يظهر للمستخدم بشكل سليم.");
    }

  } catch (error) {
    console.error("❌ حدث خطأ غير متوقع:", error.message);
  } finally {
    console.log("\n=================================");
    console.log("📊 نتيجة فحص الـ UX & UserFlow:");
    console.log(`🐛 أخطاء المنطق (Logic/Flow): ${logicBugs}`);
    console.log(`🎨 أخطاء تجربة المستخدم (UX/UI): ${uxBugs}`);
    console.log("=================================\n");
    await browser.close();
  }
})();
