const { chromium, request } = require('@playwright/test');

(async () => {
  console.log("☠️ [التدقيق الهندسي العميق] إثبات أنني أستطيع تسجيل الدخول...");
  
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("\n🔐 جاري تسجيل الدخول من الواجهة...");
    // Go to home directly and open modal
    await page.goto('https://souq-one-om-web.vercel.app/');
    
    // Trigger login modal
    await page.locator('button, a').filter({ hasText: /تسجيل|دخول|Login/i }).first().click();
    
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'max@souq.com');
    await page.fill('input[type="password"]', '1234512345MM');
    
    const loginResponsePromise = page.waitForResponse(response => 
      response.url().includes('/auth/login')
    );
    
    await page.locator('button[type="submit"]').filter({ hasText: /تسجيل|دخول|Login/i }).first().click({ force: true });
    
    const loginRes = await loginResponsePromise;
    console.log(`📡 استجابة السيرفر للـ Login: ${loginRes.status()}`);
    
    // Wait for modal to close
    await page.waitForSelector('input[type="email"]', { state: 'hidden' });
    console.log("✅ تم إغلاق الـ Modal بنجاح. نحن الآن مسجلين للدخول!");

    // ==========================================
    // 7. Data Leakage / State Leakage in UI (RE-TEST)
    // ==========================================
    console.log("\n🕵️‍♂️ فحص تسريب البيانات عند تسجيل الخروج (State Leakage) الحقيقي...");
    await page.goto('https://souq-one-om-web.vercel.app/dashboard');
    await page.waitForTimeout(3000);
    
    if (!page.url().includes('/dashboard')) {
      console.log("❌ لم نصل للداشبورد. الحماية منعتنا.");
    } else {
      console.log("✅ نحن داخل الداشبورد. جاري تسجيل الخروج بمسح الكوكيز...");
      
      await context.clearCookies();
      await page.evaluate(() => window.localStorage.clear());
      await page.evaluate(() => window.sessionStorage.clear());
      
      await page.reload();
      await page.waitForTimeout(3000);
      
      if (page.url().includes('/dashboard')) {
        console.log("🚨 [LOGIC BUG]: المستخدم مسح الكوكيز ولكنه ما زال قادراً على رؤية الـ Dashboard!");
      } else {
        console.log("✅ حماية التوجيه الأمامي تعمل وتطرد المستخدم بعد تسجيل الخروج.");
      }
    }

  } catch (error) {
    console.error("❌ تعطل السكربت بسبب خطأ غير متوقع:", error.message);
  } finally {
    await browser.close();
  }
})();
