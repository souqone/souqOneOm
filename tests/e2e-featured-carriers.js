const { chromium } = require('@playwright/test');

(async () => {
  console.log("🚀 جاري بدء اختبار قسم الناقلين المتميزين (Featured Carriers)...");
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`\n❌ [متصفح - خطأ]: ${msg.text()}`);
    }
  });

  try {
    // 1. اختبار الصفحة الرئيسية (Main Landing Page)
    console.log("⏳ جاري فتح الصفحة الرئيسية للمنصة...");
    await page.goto('https://souq-one-om-web.vercel.app/');
    
    // الانتظار حتى تحميل الصفحة
    await page.waitForLoadState('networkidle');

    console.log("🔍 جاري البحث عن قسم 'ناقلون متميزون' أو 'Featured Carriers'...");
    
    // البحث عن العنوان (ناقلون متميزون) أو (Featured Carriers)
    const featuredCarriersSection = page.locator('text="ناقلون متميزون"').or(page.locator('text="Featured Carriers"')).first();
    
    if (await featuredCarriersSection.isVisible()) {
      console.log("✅ ممتاز! قسم 'ناقلون متميزون' موجود في الصفحة الرئيسية.");
    } else {
      console.log("⚠️ لم يتم العثور على القسم في الصفحة الرئيسية (قد يستغرق Vercel بعض الوقت لتحديث النسخة).");
    }

    // 2. اختبار صفحة النقل (Transport Landing Page)
    console.log("\n⏳ جاري فتح صفحة النقل الرئيسية...");
    await page.goto('https://souq-one-om-web.vercel.app/transport');
    await page.waitForLoadState('networkidle');

    const transportCarriersSection = page.locator('text="ناقلون متميزون"').or(page.locator('text="Featured Carriers"')).first();
    
    if (await transportCarriersSection.isVisible()) {
      console.log("✅ رائع! قسم 'ناقلون متميزون' موجود بنجاح في صفحة النقل.");
      
      // التأكد من وجود كروت الناقلين (CarrierCard) داخل القسم إذا كان هناك ناقلون
      const cards = await page.locator('.card-base').count();
      console.log(`📊 عدد الكروت (البطاقات) المعروضة في الصفحة حالياً: ${cards}`);
      
    } else {
      console.log("⚠️ لم يتم العثور على القسم في صفحة النقل.");
    }

  } catch (error) {
    console.error("❌ حدث خطأ أثناء الاختبار:", error);
  } finally {
    console.log("\n🏁 انتهى الاختبار، جاري إغلاق المتصفح...");
    await browser.close();
  }
})();
