const { chromium, request } = require('@playwright/test');

(async () => {
  console.log("☠️ [التدقيق الهندسي العميق] جاري بدء فحص الأمان، الثغرات، والهندسة العكسية...");
  
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const apiContext = await request.newContext({
    baseURL: 'https://caroneapi-production-255b.up.railway.app',
  });

  let securityBugs = 0;
  let apiCrashes = 0; 

  try {
    // ==========================================
    // 1. Unauthenticated Route Guard Bypass Test
    // ==========================================
    console.log("\n🕵️‍♂️ [1] فحص حماية المسارات للزوار غير المسجلين (Unauthenticated Access)...");
    
    // Use domcontentloaded instead of load to prevent timeouts on heavy pages
    await page.goto('https://souq-one-om-web.vercel.app/jobs/new?type=HIRING', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log("⚠️ تم تحميل الصفحة جزئياً..."));
    await page.waitForTimeout(4000);
    
    if (page.url().includes('/jobs/new')) {
      console.log("🚨 [SECURITY BUG]: استطاع زائر غير مسجل الدخول لصفحة إنشاء وظيفة دون أن يتم طرده للـ Login!");
      securityBugs++;
    } else {
      console.log("✅ مسارات الوظائف محمية ضد الزوار غير المسجلين.");
    }

    // ==========================================
    // 2. Login via API to get Token instantly
    // ==========================================
    console.log("\n🔐 جاري تسجيل الدخول عبر الـ API لاستخراج التوكن (JWT Token)...");
    const loginRes = await apiContext.post('/api/v1/auth/login', {
      data: { email: 'max@souq.com', password: '1234512345MM' }
    });
    
    if (!loginRes.ok()) {
      throw new Error(`فشل تسجيل الدخول عبر الـ API. Status: ${loginRes.status()}`);
    }

    const loginData = await loginRes.json();
    const accessToken = loginData.accessToken;
    
    if (!accessToken) {
      console.log("⚠️ لم نتمكن من استخراج الـ Token، سنقوم بتخطي اختبارات الـ API العميقة.");
    } else {
      console.log("✅ تم استخراج الـ Token بنجاح للبدء في الهجوم على الـ API.");

      // ==========================================
      // 3. XSS (Cross-Site Scripting) Payload Test
      // ==========================================
      console.log("\n🕵️‍♂️ [2] فحص ثغرات الحقن (XSS Injection) في بيانات الحساب...");
      const xssPayload = {
        governorate: "Muscat",
        bio: "نحن شركة <script>alert('XSS')</script> <img src='x' onerror='alert(1)'>",
        companyName: "اختبار الحقن"
      };

      const xssRes = await apiContext.post('/api/v1/jobs/employer-profile', {
        data: xssPayload,
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (xssRes.status() === 201 || xssRes.status() === 200) {
        console.log("⚠️ [WARNING]: الـ Backend قبل كود HTML/JS في حقل الـ Bio! يجب التأكد أن الـ Frontend يعمل Sanitize ولا يقرأه كـ dangerouslySetInnerHTML.");
      }

      // ==========================================
      // 4. API Fuzzing & 500 Internal Error Hunter
      // ==========================================
      console.log("\n🕵️‍♂️ [3] فحص استقرار السيرفر (API Fuzzing / 500 Error Hunter)...");
      const fuzzPayload = {
        title: 123456, // رقم بدل نص
        description: true, // منطق بدل نص
        jobType: "INVALID_ENUM", // Enum غير صحيح
        employmentType: "FULL_TIME",
        governorate: null, // Null بدل نص
      };

      const fuzzRes = await apiContext.post('/api/v1/jobs', {
        data: fuzzPayload,
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (fuzzRes.status() === 500) {
        console.log("🚨 [CATASTROPHIC BUG]: السيرفر انهار (500 Internal Server Error) عند استقبال بيانات مشوهة! الـ ValidationPipe لا يعمل بشكل سليم على كل الحقول.");
        apiCrashes++;
      } else if (fuzzRes.status() === 400) {
        console.log("✅ السيرفر صامد ويرجع 400 Bad Request بشكل سليم عند استقبال بيانات مشوهة.");
      } else {
        console.log(`⚠️ السيرفر أرجع رمز غير متوقع: ${fuzzRes.status()}`);
      }

      // ==========================================
      // 5. Privilege Escalation / Mass Assignment
      // ==========================================
      console.log("\n🕵️‍♂️ [4] محاولة ترقية الصلاحيات (Privilege Escalation)...");
      const massAssignPayload = {
        governorate: "Muscat",
        bio: "شركة عادية جداً جداً",
        role: "ADMIN",
        isAdmin: true,
        isVerified: true
      };

      const massAssignRes = await apiContext.post('/api/v1/jobs/employer-profile', {
        data: massAssignPayload,
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      const body = await massAssignRes.json().catch(() => ({}));
      if (massAssignRes.status() === 400 && body.message && JSON.stringify(body.message).includes("should not exist")) {
        console.log("✅ السيرفر محمي ضد الـ Mass Assignment (forbidNonWhitelisted يعمل).");
      } else if (massAssignRes.status() === 200 || massAssignRes.status() === 201) {
        console.log("🚨 [SECURITY BUG]: السيرفر قبل حقول إضافية خبيثة (isAdmin/role)! يجب التحقق إذا تم حفظها في قاعدة البيانات.");
        securityBugs++;
      }

      // ==========================================
      // 6. Rate Limit DoS Attack (Micro)
      // ==========================================
      console.log("\n🕵️‍♂️ [5] هجوم حجب الخدمة المصغر (Micro DoS) لفحص الـ Throttler...");
      let successCount = 0;
      let rateLimitedCount = 0;
      
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(apiContext.get('/api/v1/jobs', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }));
      }
      
      const responses = await Promise.all(requests);
      responses.forEach(res => {
        if (res.status() === 429) rateLimitedCount++;
        else if (res.status() === 200) successCount++;
        else if (res.status() === 500) apiCrashes++;
      });

      if (rateLimitedCount > 0) {
        console.log(`✅ الـ Rate Limiter يعمل بشكل ممتاز. تم حظر ${rateLimitedCount} طلب من أصل 20.`);
      } else {
        console.log(`🚨 [SECURITY WARNING]: لا يوجد Rate Limiter نشط على مسار عرض الوظائف! تم تنفيذ جميع الطلبات الـ 20 بنجاح. هذا يعرض السيرفر للـ DDoS.`);
        securityBugs++;
      }
    }

  } catch (error) {
    console.error("❌ تعطل السكربت بسبب خطأ غير متوقع:", error.message);
  } finally {
    console.log("\n=================================");
    console.log("🧨 نتيجة الفحص الهندسي العميق:");
    console.log(`🚨 ثغرات أمنية (Security): ${securityBugs}`);
    console.log(`💥 انهيار سيرفر (500 Crashes): ${apiCrashes}`);
    console.log("=================================\n");
    await browser.close();
  }
})();
