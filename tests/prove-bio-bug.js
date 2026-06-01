const { chromium } = require('@playwright/test');

(async () => {
  console.log("🔍 [إثبات بج الـ Bio] جاري الدخول للواجهة...");
  
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('https://souq-one-om-web.vercel.app/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'max@souq.com');
    await page.fill('input[type="password"]', '1234512345MM');
    await page.locator('button[type="submit"]').first().click({ force: true });
    
    await page.waitForSelector('input[type="email"]', { state: 'hidden', timeout: 10000 });
    console.log("✅ تم تسجيل الدخول بنجاح.");

    await page.goto('https://souq-one-om-web.vercel.app/jobs/onboarding', { waitUntil: 'networkidle' });
    console.log(`✅ فتحنا صفحة الـ Onboarding. الرابط الحالي: ${page.url()}`);
    
    await page.screenshot({ path: 'evidence/onboarding_screen.png' });
    console.log("📸 تم حفظ صورة الشاشة في evidence/onboarding_screen.png لنتأكد من حالتها.");
    
    const bodyText = await page.locator('body').innerText();
    console.log("-----------------------------------------");
    console.log(bodyText.substring(0, 500));
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("❌ تعطل السكربت:", error.message);
  } finally {
    await browser.close();
  }
})();
