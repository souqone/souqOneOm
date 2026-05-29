# مواصفات E2E Tests — قسم النقل
# Transport E2E Test Specifications — Verification of All Bug Fixes

---

## المهمة

اكتب Playwright E2E tests تتحقق من أن الـ **94 bug** التالية تم إصلاحها على Vercel.

**قاعدة صارمة جداً:** كل assertion يجب أن تكون **HARD** — لا يوجد `if (visible)` أو `try/catch` يخفي الفشل.  
لو البق مش مصلح → الـ test لازم **تفشل**. الفشل هو الدليل الصحيح.  
لو الـ test عدّت وهي الإصلاح مش تم → ده bug في الـ test نفسها.

---

## البيئة والإعدادات

### متغيرات البيئة
```
BASE_URL        = رابط Vercel (مثال: https://souqone.vercel.app)
DATABASE_URL    = connection string قاعدة بيانات Vercel
NEXT_PUBLIC_API_URL = رابط الـ API (مثال: https://api.souqone.up.railway.app)
```

### مستخدمو الـ Seed (موجودين في قاعدة البيانات)
| اسم | Email | Password | Role | ملاحظات |
|-----|-------|----------|------|---------|
| shipper | shipper@souqone.om | Test1234 | USER | صاحب seed requests |
| carrier | carrier@souqone.om | Test1234 | CARRIER | عنده carrier profile |
| other | other@souqone.om | Test1234 | USER | مستخدم لا علاقة له |
| carrierNoProfile | carrierNoProfile@souqone.om | Test1234 | CARRIER | بدون carrier profile |

**إذا هؤلاء المستخدمين غير موجودين في الـ seed → أضفهم أولاً في `apps/api/prisma/seed.ts` قبل كتابة الـ tests.**

### بيانات الـ Seed (Transport)
| ID | Status | Owner | الغرض |
|----|--------|-------|-------|
| seed-tr-open-001 | OPEN | shipper | الطلب الرئيسي للاختبار |
| seed-tr-other-002 | OPEN | other | لاختبار الـ ownership |
| seed-tr-quoted-003 | QUOTED | shipper | فيه عرض PENDING من carrier |
| seed-tq-pending-001 | PENDING | carrier | العرض على seed-tr-quoted-003 |

**إذا هذه البيانات غير موجودة → أضفها في seed.ts.**

### ملف helpers
أنشئ `apps/web/e2e/transport/helpers.ts` يحتوي على:
- `loginAs(page, user)` — تسجيل دخول بـ email/password وانتظار انتهاء الـ redirect
- `apiCall(page, method, path, body?)` — استدعاء API مباشر مع JWT token من localStorage
- ثوابت USERS و SEED_IDS

---

## ملفات الـ Tests المطلوبة

أنشئ 9 ملفات في `apps/web/e2e/transport/`:

---

## الملف 1: `01-security.spec.ts`
**يغطي:** N1, N2, N3, B3

### N1-a — زرار التعديل مخفي للزوار
- افتح `/ar/transport/browse` بدون تسجيل دخول
- **assert hard:** صفحة فيها كروت طلبات، وعدد العناصر `a[href*="/edit"], button` التي تحتوي نص "تعديل" = صفر بالضبط

### N1-b — زرار التعديل مخفي على طلبات الغير
- سجّل دخول بـ `other`
- افتح صفحة تحتوي كرت الطلب `seed-tr-open-001` (ملك shipper)
- **assert hard:** لا يوجد أي عنصر `a[href*="${SEED_IDS.openRequest}/edit"]` في الصفحة

### N1-c — زرار التعديل ظاهر للمالك فقط
- سجّل دخول بـ `shipper`
- افتح `/ar/transport/my-requests`
- **assert hard:** يوجد عنصر واحد على الأقل `a[href*="${SEED_IDS.openRequest}/edit"]`

### N2-a — صفحة التعديل تُعيد توجيه الزائر
- بدون تسجيل دخول، افتح `/ar/transport/requests/seed-tr-open-001/edit`
- **assert hard:** URL النهائي يحتوي `/login` أو لا يحتوي `/edit`

### N2-b — صفحة التعديل تُعيد توجيه غير المالك
- سجّل دخول بـ `other`
- افتح `/ar/transport/requests/seed-tr-open-001/edit` مباشرة
- **assert hard:** URL النهائي لا يحتوي `/edit` أو يظهر نص "غير مصرح" أو "403"

### N2-c — صفحة التعديل تعمل للمالك
- سجّل دخول بـ `shipper`
- افتح `/ar/transport/requests/seed-tr-open-001/edit`
- **assert hard:** URL لا يحتوي `/login` ويحتوي `/edit`

### N3-a — PATCH API بدون auth يرجع 401
- `PATCH {API}/transport/requests/seed-tr-open-001` بدون Authorization header
- **assert hard:** response.status === 401

### N3-b — PATCH API من غير المالك يرجع 403
- سجّل دخول بـ `other`، استخرج الـ JWT token
- `PATCH {API}/transport/requests/seed-tr-open-001` مع token الـ `other`
- **assert hard:** response.status === 403

### N3-c — PATCH API من المالك ينجح
- سجّل دخول بـ `shipper`، استخرج الـ JWT token
- `PATCH {API}/transport/requests/seed-tr-open-001` مع data صالحة
- **assert hard:** response.status === 200

### B3-a — my-quotes يحتاج تسجيل دخول
- افتح `/ar/transport/my-quotes` بدون تسجيل دخول
- **assert hard:** URL يحتوي `/login`

### B3-b — my-requests يحتاج تسجيل دخول
- افتح `/ar/transport/my-requests` بدون تسجيل دخول
- **assert hard:** URL يحتوي `/login`

### B3-c — my-bookings يحتاج تسجيل دخول
- افتح `/ar/transport/my-bookings` بدون تسجيل دخول
- **assert hard:** URL يحتوي `/login`

---

## الملف 2: `02-quotes-flow.spec.ts`
**يغطي:** N4, N5, N8, N17, A3, A4, A5, C8

### N4-a — الشاحن يرى العروض على طلبه
- سجّل دخول بـ `shipper`
- افتح `/ar/transport/requests/seed-tr-quoted-003`
- **assert hard:** يوجد على الأقل section أو heading يحتوي كلمة "العروض" أو "عروض الناقلين"
- **assert hard:** يوجد عنصر يعرض الرقم 60 (سعر العرض التجريبي)

### N4-b — الشاحن يرى زرار "قبول" على العرض
- سجّل دخول بـ `shipper`
- افتح `/ar/transport/requests/seed-tr-quoted-003`
- **assert hard:** يوجد `button` يحتوي نص "قبول" أو "Accept"

### N5-a — الناقل الذي قدّم عرضاً لا يرى النموذج مرة ثانية
- سجّل دخول بـ `carrier`
- افتح `/ar/transport/requests/seed-tr-quoted-003`
- **assert hard:** لا يوجد `input[name="price"]` في الصفحة

### N5-b — الناقل يرى رسالة "قدّمت عرضاً بالفعل"
- سجّل دخول بـ `carrier`
- افتح `/ar/transport/requests/seed-tr-quoted-003`
- **assert hard:** يوجد نص يحتوي "قدّمت" أو "بالفعل" أو "عرضك"

### N8-a — الشاحن يرى زرار "إلغاء الطلب" على طلبه OPEN
- سجّل دخول بـ `shipper`
- افتح `/ar/transport/requests/seed-tr-open-001`
- **assert hard:** يوجد `button` يحتوي نص "إلغاء الطلب"

### N8-b — غير المالك لا يرى زرار الإلغاء
- سجّل دخول بـ `other`
- افتح `/ar/transport/requests/seed-tr-open-001`
- **assert hard:** لا يوجد `button` يحتوي نص "إلغاء الطلب"

### N17-a — الشاحن يرى زرار إلغاء في my-requests
- سجّل دخول بـ `shipper`
- افتح `/ar/transport/my-requests`
- ابحث عن كرت `seed-tr-open-001`
- **assert hard:** يوجد button بنص "إلغاء" أو "Cancel" داخل أو بجوار الكرت

### A3 — GET /transport/bookings/:id endpoint يعمل
- سجّل دخول بـ `shipper`، استخرج JWT
- `GET {API}/transport/bookings/any-valid-booking-id`
- **assert hard:** response.status !== 404 (الـ endpoint موجود)
- إذا لم يوجد booking → يرجع 404 على الـ booking، لا على الـ endpoint نفسه

### A4 — setAvailability يرجع user data
- سجّل دخول بـ `carrier`، استخرج JWT
- `PATCH {API}/transport/carrier-profile/availability` مع `{isAvailable: false}`
- **assert hard:** response.status === 200
- **assert hard:** body يحتوي على `user` object مع `displayName`

### A5 — myRequests يرجع user data
- سجّل دخول بـ `shipper`، استخرج JWT
- `GET {API}/transport/requests/my`
- **assert hard:** كل item في response.items يحتوي على `user.displayName`

### C8 — Quote messages ظاهرة بدون click
- سجّل دخول بـ `shipper`
- افتح `/ar/transport/requests/seed-tr-quoted-003`
- **assert hard:** نص رسالة العرض (مثال "يسعدني") ظاهر مباشرة بدون ضغط أي زرار

---

## الملف 3: `03-bookings.spec.ts`
**يغطي:** N6, N7, N14, B9, A1, A2, B5

### N7 — GET /transport/bookings/:id endpoint موجود في API
- سجّل دخول بـ `shipper`، استخرج JWT
- `GET {API}/transport/bookings/fake-id-123`
- **assert hard:** response.status === 404 (لا 404 "Cannot GET" — بل 404 "الحجز غير موجود")
- النص في body يحتوي "الحجز غير موجود" أو "Not Found" — لا "Cannot GET /..."

### N7-b — صفحة الحجز تُحمَّل بدون جلب كل الحجوزات
- للتحقق من هذا: افتح صفحة الحجز وراقب network requests
- **assert hard:** لا يوجد request إلى `/transport/bookings/my` عند تحميل صفحة `/transport/bookings/:id`
- يوجد request إلى `/transport/bookings/:id` مباشرة

### N6-a — الناقل الفعلي يرى "بدأت التحميل" عند ACCEPTED
- هذا يحتاج حجز موجود في الـ seed أو إنشاء واحد
- إذا وُجد booking بـ status ACCEPTED:
  - سجّل دخول بـ `carrier` (ناقل الحجز)
  - افتح `/ar/transport/bookings/:bookingId`
  - **assert hard:** يوجد `button` بنص "بدأت التحميل" أو "Start"
  - **assert hard:** لا يوجد `button` بنص "استلمت" أو "Complete"

### N6-b — الشاحن يرى "استلمت" عند IN_PROGRESS
- إذا وُجد booking بـ status IN_PROGRESS:
  - سجّل دخول بـ `shipper`
  - افتح `/ar/transport/bookings/:bookingId`
  - **assert hard:** يوجد `button` بنص "استلمت" أو "Complete"
  - **assert hard:** لا يوجد `button` بنص "بدأت التحميل"

### N14 — زرار إلغاء الحجز مخفي للغرباء
- سجّل دخول بـ `other`
- إذا استطعت الوصول لرابط حجز (يحتاج ID حقيقي)
- **assert hard:** لا يوجد `button` بنص "إلغاء الحجز"

### A1 — BookingStatus enum صحيح
- سجّل دخول بـ `carrier`، استخرج JWT
- `GET {API}/transport/bookings/my?role=carrier`
- **assert hard:** كل booking.status قيمته من: "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"
- **assert hard:** لا يوجد booking.status === "OPEN" أو "QUOTED" أو "EXPIRED"

### A2 — الحجز الجديد يبدأ بـ ACCEPTED لا IN_PROGRESS
- بعد قبول عرض (أو عبر الـ seed data)
- `GET {API}/transport/bookings/my?role=carrier`
- **assert hard:** الحجز الجديد له status === "ACCEPTED"

### B5 — صفحة الحجز لا تكرش عند غياب carrier data
- إذا وُجد حجز بدون carrier profile مكتمل (edge case)
- افتح `/ar/transport/bookings/:id`
- **assert hard:** الصفحة تُحمَّل (لا `console.error` type crash، لا blank page)
- **assert hard:** يظهر محتوى الصفحة الأساسي

---

## الملف 4: `04-locale-links.spec.ts`
**يغطي:** E1, E2, E3, E4, E5, E6, E7, E8, E9, E10

**القاعدة:** كل رابط داخلي في transport يجب أن يبدأ بـ `/ar/` (أو `/en/` في English mode).

### E1 — TransportRequestCard links
- افتح `/ar/transport/browse`
- **assert hard:** كل `a[href*="/transport/requests/"]` في الصفحة → href يبدأ بـ `/ar/`

### E2 — HeroSection CTA buttons
- افتح `/ar/transport`
- **assert hard:** الرابط "أنشئ طلب نقل" → href يبدأ بـ `/ar/`
- **assert hard:** الرابط "سجّل كناقل" في HeroSection → href يبدأ بـ `/ar/`

### E3 — CarrierCTA links
- افتح `/ar/transport`
- ابحث عن قسم CarrierCTA (عادة في أسفل الصفحة)
- **assert hard:** كل `a[href]` داخل قسم CarrierCTA → href يبدأ بـ `/ar/`

### E4 — ServiceTypesGrid category links
- افتح `/ar/transport`
- ابحث عن قسم أنواع الخدمات (شاحنات، أثاث، إلخ)
- **assert hard:** كل `a[href*="/transport/browse"]` → href يبدأ بـ `/ar/`

### E5 — LatestRequests "عرض الكل"
- افتح `/ar/transport`
- **assert hard:** `a` بنص "عرض الكل" أو "View All" → href يبدأ بـ `/ar/`

### E6 — "العودة للتصفح" في request detail
- افتح أي صفحة `/ar/transport/requests/:id`
- **assert hard:** `a` أو `button` بنص "العودة" أو "Back" أو "التصفح" → href يبدأ بـ `/ar/`

### E7 — Filter URL في ServiceTypesGrid
- افتح `/ar/transport` واضغط على نوع خدمة في الـ grid
- **assert hard:** URL النهائي يبدأ بـ `/ar/transport/browse`

### E8 — carriers/register links
- افتح `/ar/transport/carriers/register`
- **assert hard:** كل الروابط الداخلية (`a[href^="/transport"]`) → href يبدأ بـ `/ar/`

### E9 — my-quotes links
- سجّل دخول بـ `carrier`
- افتح `/ar/transport/my-quotes`
- **assert hard:** كل `a[href*="/transport/"]` → href يبدأ بـ `/ar/`

### E10 — carriers/dashboard links
- سجّل دخول بـ `carrier`
- افتح `/ar/transport/carriers/dashboard`
- **assert hard:** كل `a[href*="/transport/"]` → href يبدأ بـ `/ar/`

---

## الملف 5: `05-browse-filters.spec.ts`
**يغطي:** F1, F2, F3, F4, F5, F6, F10

### F1 — Filter يُحدّث URL
- افتح `/ar/transport/browse`
- اختر فلتر serviceType = GOODS (أياً كانت طريقة الـ UI)
- **assert hard:** `page.url()` يحتوي `serviceType=GOODS`

### F1-refresh — Filter يبقى بعد Refresh
- افتح `/ar/transport/browse?serviceType=GOODS`
- اعمل `page.reload()`
- **assert hard:** `page.url()` لا يزال يحتوي `serviceType=GOODS`
- **assert hard:** الـ UI يعكس الفلتر المحدد (الـ button أو select قيمته GOODS)

### F3 — Pagination تحتفظ بالفلاتر
- افتح `/ar/transport/browse?serviceType=GOODS`
- اضغط على زرار "التالي" أو "2" للـ pagination
- **assert hard:** `page.url()` يحتوي كلاً من `serviceType=GOODS` و `page=2`

### F5 — "مسح الفلاتر" يُعيد URL للأساس
- افتح `/ar/transport/browse?serviceType=GOODS&fromGovernorate=مسقط`
- اضغط على "مسح الفلاتر" أو "Clear"
- **assert hard:** `page.url()` لا يحتوي `serviceType` أو `fromGovernorate`

### F6 — CargoDescription Fallback
- إذا وُجد طلب بدون cargoDescription في الـ browse
- **assert hard:** مكان الـ description يعرض نصاً fallback (مثل "لم يتم تحديد وصف") — لا يترك المكان فارغاً أو يعرض `undefined`/`null`

### F10 — Sort يُحفظ في URL
- افتح `/ar/transport/browse`
- اختر ترتيب مختلف (مثل "الأحدث" أو "السعر")
- **assert hard:** `page.url()` يحتوي `sortBy=...`

### F2 — Wilayat يُرسَل للـ API
- افتح `/ar/transport/browse`
- اختر محافظة ثم اختر ولاية
- **assert hard:** network request إلى `/transport/requests` يحتوي `fromWilayat` في الـ query string

---

## الملف 6: `06-wizard.spec.ts`
**يغطي:** A7, A8, B4, C1, F8, F9, C18

### A7 — scheduledAt يُرسَل للـ API عند اختيار "موعد محدد"
- سجّل دخول بـ `shipper`
- مر بالـ wizard حتى Step 4
- اختر "موعد محدد" وحدد تاريخاً مستقبلياً
- اكمل حتى الإرسال
- **assert hard:** الـ API request إلى `POST /transport/requests` يحتوي `scheduledAt` في الـ body (مش null أو undefined)

### B4 / F8 — Step 4: "موعد محدد" بدون تاريخ يمنع المتابعة
- سجّل دخول بـ `shipper`، اوصل لـ Step 4
- اختر "موعد محدد" بدون تحديد تاريخ
- اضغط "التالي"
- **assert hard:** الـ URL لا يزال يحتوي `/transport/new` (لم ينتقل للـ step التالية)
- **assert hard:** يوجد رسالة خطأ واضحة (نص يحتوي "موعد" أو "تاريخ" أو "مطلوب")

### C1 — Wizard: الضغط على "التالي" بحقل فارغ يُظهر toast أو error
- سجّل دخول بـ `shipper`
- افتح `/ar/transport/new` (Step 1)
- اضغط "التالي" فوراً بدون اختيار service type
- **assert hard:** لا ينتقل للـ Step 2 (URL لا يزال `/transport/new` أو step indicator يظهر 1)
- **assert hard:** يوجد رسالة خطأ مرئية

### A8 — Double Submit: طلب واحد فقط
- سجّل دخول بـ `shipper`
- اكمل الـ wizard وصل لزرار الإرسال
- اضغط الزرار مرتين بسرعة متتالية (doubleClick أو click + click بدون انتظار)
- **assert hard:** عدد الـ POST requests إلى `/transport/requests` = 1 بالضبط

### F9 / C18 — Step5Review: تأكيد الخريطة إذا تم تحديد إحداثيات
- سجّل دخول بـ `shipper`
- اوصل لـ Step 5 مع تحديد نقطة على الخريطة في Step 2
- **assert hard:** يظهر نص "تم تحديد الموقع" أو أيقونة map pin في الـ review

---

## الملف 7: `07-carrier.spec.ts`
**يغطي:** N13, N16, B1, B2, B6, B8, B10, C3, C6, C7, C17

### N13 — Carrier Dashboard لا يكرش لو API فشل
- سجّل دخول بـ `carrier`
- افتح `/ar/transport/carriers/dashboard`
- **assert hard:** الصفحة تعرض محتوى (heading أو stats) — لا blank page
- **assert hard:** لا يوجد runtime error مرئي في الصفحة

### N16 — Carrier بدون Profile يرى Banner لا نموذج
- سجّل دخول بـ `carrierNoProfile`
- افتح `/ar/transport/requests/seed-tr-open-001`
- **assert hard:** يوجد نص يحتوي "سجّل كناقل" أو "إنشاء ملف ناقل"
- **assert hard:** لا يوجد `input[name="price"]`

### B1 — "عرض الحجز" يذهب لـ /my-bookings لا /my-requests
- سجّل دخول بـ `carrier`
- افتح `/ar/transport/my-quotes`
- إذا وُجد عرض مقبول (ACCEPTED):
  - **assert hard:** الرابط "عرض الحجز" → href يحتوي `/my-bookings` أو `/bookings/`
  - **assert hard:** href لا يحتوي `/my-requests`

### B2 — الناقل يرى "حجوزاتي" في الـ nav
- سجّل دخول بـ `carrier`
- افتح `/ar/transport`
- **assert hard:** يوجد `a` بنص "حجوزاتي" أو "My Bookings" في شريط التنقل

### B6 — Carrier Dashboard لا flash of content عند redirect
- بدون تسجيل دخول، افتح `/ar/transport/carriers/dashboard`
- **assert hard:** لا يظهر محتوى الداشبورد (حتى لو لثانية واحدة) قبل الـ redirect
- **assert hard:** يحدث redirect لـ /login أو /register

### B8 — Carrier بدون Profile: رسالة واضحة لا error عام
- سجّل دخول بـ `carrierNoProfile`
- افتح `/ar/transport/requests/seed-tr-open-001`
- **assert hard:** لا يوجد نص "SERVER_ERROR" أو "حدث خطأ" عند محاولة الوصول لنموذج العرض
- **assert hard:** يوجد نص توجيهي "سجّل كناقل"

### B10 — my-bookings تعمل للناقل
- سجّل دخول بـ `carrier`
- افتح `/ar/transport/my-bookings`
- **assert hard:** URL لا يحتوي `/login`
- **assert hard:** الصفحة تعرض محتوى (قائمة أو رسالة "لا توجد حجوزات")

### C3 — Error Toast في dashboard يختفي تلقائياً
- سجّل دخول بـ `carrier`
- في الـ dashboard، افعل إجراء يُسبب خطأ (مثل toggle availability مع network block)
- **assert hard:** الـ error toast يختفي بعد 5 ثواني (أو يوجد زرار X لإغلاقه)

### C6 — Carrier Register: زرار لا يتجمّد عند 409
- سجّل دخول بـ `carrier` (عنده profile بالفعل)
- افتح `/ar/transport/carriers/register` وحاول التسجيل مرة ثانية
- **assert hard:** بعد ظهور رسالة الخطأ (409)، الـ button يُعاد تفعيله (ليس disabled بعد 3 ثواني)

### C7 — Carrier Register Spinner مع نص
- افتح `/ar/transport/carriers/register` كناقل جديد
- لحظة تحميل الصفحة الأولى (checking profile)
- **assert hard:** إذا ظهر spinner → يوجد نص بجانبه (مثل "جارٍ التحقق...")

### C17 — UUID مختصر في Carrier Dashboard
- سجّل دخول بـ `carrier`
- افتح `/ar/transport/carriers/dashboard`
- **assert hard:** لا يوجد نص بصيغة full UUID `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` في الصفحة

---

## الملف 8: `08-ux-validation.spec.ts`
**يغطي:** C2, C4, C9, C10, C11, C12, C13, C14, C15, C16, N11, N12, N15

### N11 — Budget Validation: budgetMin > budgetMax يرجع 400
- سجّل دخول بـ `shipper`، استخرج JWT
- `POST {API}/transport/requests` مع `{budgetMin: 500, budgetMax: 100, ...required fields}`
- **assert hard:** response.status === 400
- **assert hard:** body يحتوي رسالة عن الـ budget

### N11-b — Budget Validation في الـ UI
- سجّل دخول بـ `shipper`، وصل للـ wizard
- في Step الـ budget، أدخل min=500 وmax=100
- اضغط التالي
- **assert hard:** الصفحة لا تنتقل للخطوة التالية أو تظهر رسالة خطأ

### N12 — my-requests Pagination (مش hardcoded 50)
- سجّل دخول بـ `shipper`
- افتح `/ar/transport/my-requests`
- **assert hard:** الـ API request يذهب لـ `/transport/requests/my` مع `limit=12` (مش 50)

### N15 — Retry بدون window.location.reload
- سجّل دخول بـ `shipper`
- افتح `/ar/transport/my-requests`
- Block الـ API (page.route to fail)
- انتظر ظهور error state
- اضغط "إعادة المحاولة" أو "Retry"
- **assert hard:** لا يحدث full page navigation (راقب `page.on('framenavigated')`)

### C2 — Race Condition في my-quotes
- سجّل دخول بـ `carrier`
- افتح `/ar/transport/my-quotes`
- ابدأ سحب عرض (اضغط withdraw) ثم غيّر الـ tab فوراً
- انتظر انتهاء الـ request
- **assert hard:** العرض المسحوب يظهر بـ status "مسحوب" أو "WITHDRAWN" — لا يرجع لـ PENDING

### C4 — Retry button يعرض loading
- سجّل دخول بـ `shipper`
- أحدث error state في my-requests
- اضغط Retry
- **assert hard:** يوجد spinner أو loading indicator بعد الضغط مباشرة

### C9 — Pagination تـ scroll للأعلى
- افتح `/ar/transport/browse`
- اسكرول للأسفل
- اضغط على الصفحة 2
- **assert hard:** `window.scrollY` يساوي 0 أو قريب منه

### C10 — أسماء طويلة لا تكسر layout
- في صفحة bookings، لو وُجد carrier بـ companyName طويل جداً
- **assert hard:** العنصر لا يتجاوز حدود الـ card (overflow hidden أو truncated)

### C11 — Retry في my-requests يستخدم in-app reload
- نفس N15 — تأكيد إضافي أن `window.location.reload` غير مستخدم

### C12 — حقل السعر يتلوّن أحمر عند خطأ
- سجّل دخول بـ `carrier`
- افتح صفحة طلب OPEN
- اضغط "تقديم العرض" بدون إدخال سعر
- **assert hard:** الـ input لحقل السعر يحتوي class أو style يشير للخطأ (border-red أو ring-red)

### C13 — حقل الساعات يرفض صفر أو سالب
- سجّل دخول بـ `carrier`
- افتح صفحة طلب OPEN، أدخل سعراً صحيحاً
- أدخل `estimatedHours = 0` أو `-1`
- اضغط "تقديم العرض"
- **assert hard:** يظهر رسالة خطأ على هذا الحقل — لا يُرسَل الـ request

### C14 — حقل الرسالة يرفض whitespace فقط
- سجّل دخول بـ `carrier`
- افتح صفحة طلب OPEN
- أدخل message = "   " (مسافات فقط)
- اضغط submit
- **assert hard:** إما يُنظّف الـ whitespace أو يظهر خطأ — لا يُرسَل كـ whitespace

### C15 — Skeleton يظهر عند تبديل الـ tabs
- سجّل دخول بـ `shipper`
- افتح `/ar/transport/my-requests`
- اضغط على tab "مفتوح" ثم "مكتمل" سريعاً
- **assert hard:** يوجد loading state (spinner أو skeleton) بين التبديلات

### C16 — Cancel Booking يطلب تأكيد
- لو وُجد booking قابل للإلغاء
- سجّل دخول بـ shipper أو carrier المرتبطين
- اضغط "إلغاء الحجز"
- **assert hard:** يظهر dialog تأكيد قبل تنفيذ الإلغاء (native confirm أو modal)

---

## الملف 9: `09-i18n.spec.ts`
**يغطي:** D1-D20

**القاعدة:** بعد تبديل اللغة لـ English (`/en/`)، لا يجوز ظهور أي نص عربي hardcoded.

### D1-D4 — Status Labels بالإنجليزية
- افتح `/en/transport/browse`
- **assert hard:** الـ status badges (OPEN, QUOTED, etc.) تعرض كلمات إنجليزية: "Open", "Quoted", "Completed", "Cancelled"
- **assert hard:** لا تعرض "مفتوح", "مكتمل", إلخ

### D5 — Fallback "Carrier" بدل "ناقل"
- افتح `/en/transport` أو أي صفحة بها "ناقل" كـ fallback
- **assert hard:** لا يظهر نص "ناقل" في الـ English version — يظهر "Carrier" بدلاً منه

### D6 — التواريخ بصيغة إنجليزية
- افتح `/en/transport/browse`
- **assert hard:** التواريخ المعروضة بصيغة إنجليزية (مثل "Jan 1, 2025" لا "١ يناير ٢٠٢٥")

### D7-D9 — HeroSection, CarrierCTA, ServiceTypesGrid بالإنجليزية
- افتح `/en/transport`
- **assert hard:** العناوين الرئيسية في الصفحة بالإنجليزية (لا عربية hardcoded)

### D10-D13 — Wizard Steps بالإنجليزية
- افتح `/en/transport/new`
- **assert hard:** عناوين وأزرار الـ wizard بالإنجليزية

### D14-D20 — نصوص متنوعة
- افتح `/en/transport/my-requests`, `/en/transport/my-quotes`, `/en/transport/carriers/dashboard`
- **assert hard:** رسائل الـ empty state, error messages, button labels كلها بالإنجليزية

---

## قواعد كتابة الـ Tests (مهمة جداً)

### 1. HARD Assertions فقط
```typescript
// ✅ صح
await expect(page.locator('button[text="تعديل"]')).toHaveCount(0);
await expect(page.locator('input[name="price"]')).not.toBeVisible();

// ❌ غلط — هذا يخفي الفشل
if (await element.isVisible().catch(() => false)) {
  await expect(element).toHaveText('...');
}
```

### 2. لا `try/catch` تخفي الأخطاء
```typescript
// ❌ غلط
try {
  await expect(element).toBeVisible();
} catch {
  // ignoring...
}

// ✅ صح — دع الـ test تفشل بصراحة
await expect(element).toBeVisible({ timeout: 30000 });
```

### 3. Network Monitoring للـ API tests
```typescript
// لمراقبة الـ requests
const requests: string[] = [];
page.on('request', req => {
  if (req.url().includes('/transport/')) requests.push(req.url());
});
```

### 4. JWT extraction من localStorage
```typescript
const token = await page.evaluate(() => localStorage.getItem('accessToken'));
const response = await page.request.get(`${apiBase}/transport/requests/my`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 5. Timeouts مناسبة لـ Vercel
```typescript
// أطول من localhost بسبب network latency
await expect(element).toBeVisible({ timeout: 30000 });
await page.waitForLoadState('networkidle', { timeout: 60000 });
```

---

## إعداد الـ `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    // NO webServer block — Vercel is already running
    actionTimeout: 30000,
    navigationTimeout: 120000,
  },
  timeout: 120000,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

---

## إعداد الـ `global-setup.ts`

```typescript
// يعمل seed للـ DB (local أو remote) حسب الـ env
// إذا BASE_URL موجود → يستخدم DATABASE_URL للـ seed على Vercel DB
// إذا لا → يعمل seed محلياً
```

---

## GitHub Actions Job

في `.github/workflows/ci.yml`، أضف job جديدة `test-transport-e2e`:
- تشتغل بعد `deploy` (needs: deploy)
- تشغّل فقط على `main` push
- تعمل seed على Vercel DB باستخدام `DATABASE_URL` secret
- تشغّل `npx playwright test e2e/transport/` مع `BASE_URL = PROD_WEB_URL`
- ترفع HTML report كـ artifact لمدة 14 يوم

---

## ملخص التغطية

| الملف | الـ bugs المغطاة | العدد |
|-------|----------------|-------|
| 01-security.spec.ts | N1-N3, B3 | 12 test |
| 02-quotes-flow.spec.ts | N4, N5, N8, N17, A3-A5, C8 | 10 test |
| 03-bookings.spec.ts | N6, N7, N14, A1, A2, B5, B9 | 9 test |
| 04-locale-links.spec.ts | E1-E10 | 10 test |
| 05-browse-filters.spec.ts | F1-F3, F5, F6, F10, F2 | 8 test |
| 06-wizard.spec.ts | A7, A8, B4, C1, F8, F9, C18 | 7 test |
| 07-carrier.spec.ts | N13, N16, B1, B2, B6, B8, B10, C3, C6, C7, C17 | 11 test |
| 08-ux-validation.spec.ts | C2, C4, C9-C16, N11, N12, N15 | 13 test |
| 09-i18n.spec.ts | D1-D20 | 10 test |
| **المجموع** | **94 bug** | **~90 test** |

---

## الـ Bugs المتبقية (تحتاج Setup خاص)

هذه الـ bugs صعب اختبارها بـ Playwright لكن يمكن التحقق منها بـ API test أو unit test:
- **N9, N10** — Race conditions في acceptQuote/withdrawQuote → تحتاج concurrent requests
- **A6** — TypeScript types (compile-time فقط)
- **D1-D20** — i18n يحتاج كل النصوص مضافة لـ messages files

---

## أمر التشغيل

```bash
# على Vercel
BASE_URL=https://souqone.vercel.app \
DATABASE_URL=postgresql://... \
NEXT_PUBLIC_API_URL=https://api.up.railway.app \
npx playwright test e2e/transport/ --project=chromium

# لرؤية الـ report
npx playwright show-report
```
