const https = require('https');

(async () => {
  console.log("🔍 [إثبات بج الـ Bio] محاكاة الإرسال عبر API مباشرة (بدون UI)...");

  try {
    // 1. Login to get token
    const loginPayload = JSON.stringify({
      email: 'max@souq.com',
      password: '1234512345MM'
    });

    const loginResponse = await new Promise((resolve, reject) => {
      const req = https.request('https://caroneapi-production-255b.up.railway.app/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': loginPayload.length
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.write(loginPayload);
      req.end();
    });

    if (loginResponse.status !== 200 && loginResponse.status !== 201) {
      console.log(`❌ فشل الدخول. السيرفر رد بـ ${loginResponse.status}`);
      return;
    }

    const token = loginResponse.data.accessToken;
    console.log("✅ تم تسجيل الدخول والحصول على الـ Token بنجاح.");

    // 2. Send empty Bio to Employer Profile endpoint
    const profilePayload = JSON.stringify({
      companyName: "شركة إثبات البج",
      governorate: "Muscat",
      bio: "" // هذا هو الحقل الفارغ الذي يسبب الكارثة
    });

    console.log("⏳ يتم الآن إرسال بيانات إنشاء ملف الشركة بحقل bio فارغ...");
    
    const profileResponse = await new Promise((resolve, reject) => {
      const req = https.request('https://caroneapi-production-255b.up.railway.app/api/v1/jobs/employer-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(profilePayload),
          'Authorization': `Bearer ${token}`
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.write(profilePayload);
      req.end();
    });

    console.log("\n==============================================");
    console.log("📤 [البيانات المرسلة - Payload]:");
    console.log(JSON.stringify(JSON.parse(profilePayload), null, 2));
    console.log("----------------------------------------------");
    console.log(`📥 [حالة الاستجابة - Status]: ${profileResponse.status}`);
    console.log("📥 [رد السيرفر - Response Body]:");
    console.log(profileResponse.body);
    console.log("==============================================\n");

    if (profileResponse.status === 400 && profileResponse.body.includes('bio')) {
      console.log("🚨 [مُثبت ومؤكد 100%]: السيرفر يرفض إكمال التسجيل! الواجهة ترسل حقل bio فارغ (\"\") بدلاً من undefined، والسيرفر يفشله في شرط الطول (MinLength 10).");
    } else {
      console.log("⚠️ الاستجابة غير متوقعة. قد يكون البج تم حله أو غير موجود أصلاً.");
    }

  } catch (error) {
    console.error("❌ حدث خطأ:", error.message);
  }
})();
