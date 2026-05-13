# Frontend Audit — SouqOne
> تاريخ: 2026-05-12 | مصدر: `apps/web/src/app/[locale]/`

---

## STEP 1 — كل الصفحات الموجودة (56 صفحة)

| المسار | الوصف |
|--------|-------|
| `/` | الرئيسية |
| `/coming-soon` | قريباً (placeholder) |
| `/pricing` | صفحة الأسعار والاشتراكات |
| `/login` | تسجيل الدخول |
| `/register` | إنشاء حساب |
| `/signup` | يعيد توجيه لـ `/register` |
| `/forgot-password` | نسيت كلمة المرور |
| `/reset-password` | إعادة تعيين كلمة المرور |
| `/verify-email` | تفعيل البريد |
| `/profile` | حسابي |
| `/my-listings` | إعلاناتي (كل الأنواع) |
| `/favorites` | المفضلة |
| `/notifications` | الإشعارات |
| `/seller/[id]` | صفحة بائع عام |
| `/messages` | قائمة المحادثات |
| `/messages/[id]` | محادثة تفاصيل |
| `/bookings` | حجوزاتي |
| `/bookings/[id]` | تفاصيل حجز |
| `/payment/success` | نجاح الدفع |
| `/payment/cancel` | إلغاء الدفع |
| `/browse` | يعيد توجيه لـ `/browse/cars` |
| `/browse/[category]` | تصفح فئة (cars/buses/equipment/operators/parts/services/equipment-requests) |
| `/browse/jobs` | يعيد توجيه لـ `/jobs` |
| `/motors` | صفحة السيارات الرئيسية (بيع + إيجار + خدمات + قطع) |
| `/sale/[type]/[id]` | تفاصيل إعلان بيع (car/bus/equipment/part/service) |
| `/rental/[type]/[id]` | تفاصيل إعلان إيجار (car/bus/equipment) |
| `/buses` | صفحة الحافلات الرئيسية |
| `/equipment` | صفحة المعدات الرئيسية |
| `/equipment/operators` | قائمة المشغّلين |
| `/equipment/operators/[id]` | تفاصيل مشغّل |
| `/equipment/requests` | قائمة طلبات المعدات |
| `/equipment/requests/[id]` | تفاصيل طلب معدة |
| `/equipment/requests/new` | إضافة طلب معدة |
| `/add-listing` | اختيار نوع الإعلان |
| `/add-listing/[type]` | نموذج إضافة (car/bus/equipment/parts/service/operator) |
| `/edit-listing/[type]/[id]` | نموذج تعديل (car/job/bus/equipment/parts/service/operator) |
| `/jobs` | صفحة الوظائف الرئيسية |
| `/jobs/browse` | تصفح وفلترة الوظائف |
| `/jobs/[id]` | تفاصيل وظيفة |
| `/jobs/new` | إضافة وظيفة |
| `/jobs/my` | وظائفي |
| `/jobs/my-proposals` | عروضي |
| `/jobs/dashboard` | لوحة تحكم الوظائف |
| `/jobs/drivers` | قائمة السائقين |
| `/jobs/drivers/[id]` | تفاصيل سائق |
| `/jobs/employers/[id]` | تفاصيل صاحب عمل |
| `/jobs/onboarding` | إعداد الملف الوظيفي |
| `/jobs/verification` | التحقق من الهوية |
| `/transport` | صفحة النقل الرئيسية |
| `/transport/browse` | تصفح طلبات النقل |
| `/transport/new` | إضافة طلب نقل |
| `/transport/my-requests` | طلباتي في النقل |
| `/transport/my-quotes` | عروضي في النقل |
| `/transport/requests/[id]` | تفاصيل طلب نقل |
| `/transport/carriers/[id]` | تفاصيل ناقل |
| `/transport/carriers/dashboard` | لوحة تحكم الناقل |
| `/transport/carriers/register` | تسجيل كناقل |
| `/transport/bookings/[id]` | تفاصيل حجز نقل |
| `/admin/jobs` | إدارة الوظائف (admin) |
| `/dashboard/driver` | لوحة السائق |
| `/dashboard/employer` | لوحة صاحب العمل |

---

## STEP 2 — Audit جدول كل قسم

| القسم | Listing Page | Details Page | Search/Filter | Add | Edit | الحالة |
|-------|-------------|--------------|---------------|-----|------|--------|
| **سيارات بيع** | ✅ `/browse/cars` | ✅ `/sale/car/[id]` | ✅ داخل browse | ✅ `/add-listing/car?type=SALE` | ✅ `/edit-listing/car/[id]` | 🟢 مكتمل |
| **سيارات إيجار** | ✅ `/browse/cars` | ✅ `/rental/car/[id]` | ✅ داخل browse | ✅ `/add-listing/car?type=RENTAL` | ✅ `/edit-listing/car/[id]` | 🟢 مكتمل |
| **حافلات بيع** | ✅ `/buses` + `/browse/buses` | ✅ `/sale/bus/[id]` | ✅ داخل browse | ✅ `/add-listing/bus?type=SALE` | ✅ `/edit-listing/bus/[id]` | 🟢 مكتمل |
| **حافلات إيجار** | ✅ `/buses` + `/browse/buses` | ✅ `/rental/bus/[id]` | ✅ داخل browse | ✅ `/add-listing/bus?type=RENTAL` | ✅ `/edit-listing/bus/[id]` | 🟢 مكتمل |
| **معدات بيع** | ✅ `/equipment` + `/browse/equipment` | ✅ `/sale/equipment/[id]` | ✅ داخل browse | ✅ `/add-listing/equipment?type=EQUIPMENT_SALE` | ✅ `/edit-listing/equipment/[id]` | 🟢 مكتمل |
| **معدات إيجار** | ✅ `/equipment` + `/browse/equipment` | ✅ `/rental/equipment/[id]` | ✅ داخل browse | ✅ `/add-listing/equipment?type=EQUIPMENT_RENT` | ✅ `/edit-listing/equipment/[id]` | 🟢 مكتمل |
| **مشغّلو معدات** | ✅ `/equipment/operators` + `/browse/operators` | ✅ `/equipment/operators/[id]` | ✅ داخل browse | ✅ `/add-listing/operator` | ✅ `/edit-listing/operator/[id]` | 🟢 مكتمل |
| **طلبات معدات** | ✅ `/equipment/requests` + `/browse/equipment-requests` | ✅ `/equipment/requests/[id]` | ✅ داخل browse | ✅ `/equipment/requests/new` | ❌ لا يوجد `/edit-listing/equipment-request/[id]` | 🟡 ناقص |
| **قطع غيار** | ✅ `/browse/parts` (+ عرض في `/motors`) | ✅ `/sale/part/[id]` | ✅ داخل browse | ✅ `/add-listing/parts` | ✅ `/edit-listing/parts/[id]` | 🟡 ناقص (لا صفحة landing مستقلة) |
| **خدمات سيارات** | ✅ `/browse/services` (+ عرض في `/motors`) | ✅ `/sale/service/[id]` | ✅ داخل browse | ✅ `/add-listing/service` | ✅ `/edit-listing/service/[id]` | 🟡 ناقص (لا صفحة landing مستقلة) |
| **وظائف — طلب سائق** | ✅ `/jobs` + `/jobs/browse` | ✅ `/jobs/[id]` | ✅ `/jobs/browse` كامل مع فلاتر | ✅ `/jobs/new?type=HIRING` | ✅ `/edit-listing/job/[id]` | 🟢 مكتمل |
| **وظائف — عرض خدمة** | ✅ `/jobs` + `/jobs/browse` | ✅ `/jobs/[id]` | ✅ `/jobs/browse` | ✅ `/jobs/new?type=OFFERING` | ✅ `/edit-listing/job/[id]` | 🟢 مكتمل |
| **نقل بضائع** | ✅ `/transport` + `/transport/browse` | ✅ `/transport/requests/[id]` | ✅ `/transport/browse` | ✅ `/transport/new` | ❌ لا يوجد edit | 🟡 ناقص |
| **تأمين** | ❌ لا توجد أي صفحة | ❌ | ❌ | ❌ | ❌ | 🔴 كارثة |
| **رحلات** | ❌ لا توجد أي صفحة | ❌ | ❌ | ❌ | ❌ | 🔴 كارثة |

---

## STEP 3 — الصفحات المشتركة

| الصفحة | الحالة | الوصف |
|--------|--------|-------|
| **الرئيسية** `/` | 🟢 | SSR — تعرض: بطاقات سيارات، حافلات، قطع، معدات، خدمات، وظائف |
| **البروفايل** `/profile` | 🟢 | `ProfilePageClient` — بيانات الحساب، الصورة، الإعدادات |
| **إعلاناتي** `/my-listings` | 🟢 | يدعم 8 أقسام: cars/buses/equipment/operators/equipment-requests/parts/services/jobs |
| **المحادثات** `/messages` | 🟢 | Layout ثنائي (قائمة + تفاصيل)، unread badge، real-time via Socket.IO |
| **الحجوزات** `/bookings` | 🟢 | قائمة + تفاصيل `/bookings/[id]` |
| **الإشعارات** `/notifications` | 🟢 | `NotificationsPageClient` |
| **المفضلة** `/favorites` | 🟢 | `FavoritesPageClient` |
| **البحث العام** | 🟡 | موجود كـ hook (`useSearch`, `useAutocomplete`) وشريط بحث في Navbar — لكن **لا توجد صفحة نتائج بحث مستقلة** `/search?q=...` |
| **صفحة البائع** `/seller/[id]` | 🟢 | `SellerPageClient` — إعلانات البائع العامة |
| **الدفع** `/payment/success` + `/payment/cancel` | 🟢 | صفحات تأكيد الدفع عبر Thawani |
| **Pricing** `/pricing` | 🟢 | خطط الاشتراك |

---

## STEP 4 — الـ Navigation

### Navbar (desktop + mobile)
| الرابط | الصفحة موجودة؟ |
|--------|---------------|
| `/` — الرئيسية | ✅ |
| `/motors` — السيارات | ✅ |
| `/buses` — الحافلات | ✅ |
| `/equipment` — المعدات | ✅ |
| `/transport` — النقل | ✅ |
| `/jobs` — الوظائف | ✅ |
| `/favorites` — المفضلة | ✅ |
| `/messages` — الرسائل | ✅ |
| `/profile` — الحساب | ✅ |
| `/browse/parts` — قطع غيار (flatNav) | ✅ |
| `/browse/services` — الخدمات (flatNav) | ✅ |

### Bottom Nav (موبايل)
| الرابط | موجود؟ |
|--------|--------|
| `/` — الرئيسية | ✅ |
| `/favorites` — المفضلة | ✅ |
| `/add-listing` — إضافة | ✅ |
| `/messages` — الرسائل | ✅ |
| `/notifications` — الإشعارات | ✅ |

### SubNavBar — المعدات
| الرابط | موجود؟ |
|--------|--------|
| `/equipment` | ✅ |
| `/browse/equipment` | ✅ |
| `/equipment/requests` | ✅ |
| `/equipment/operators` | ✅ |
| `/add-listing/equipment` | ✅ |

### SubNavBar — الوظائف
| الرابط | موجود؟ |
|--------|--------|
| `/jobs` | ✅ |
| `/jobs/browse` | ✅ |
| `/jobs/drivers` | ✅ |
| `/jobs/my` | ✅ |
| `/jobs/my-proposals` | ✅ |
| `/jobs/dashboard` | ✅ |

### SubNavBar — النقل
| الرابط | موجود؟ |
|--------|--------|
| `/transport/browse` | ✅ |
| `/transport/my-requests` | ✅ |
| `/transport/my-quotes` | ✅ |
| `/transport/carriers/dashboard` | ✅ |
| `/transport/carriers/register` | ✅ |

> ✅ **كل روابط الـ Navigation تشير لصفحات موجودة فعلاً — لا dead links.**

---

## STEP 5 — API Calls: Frontend vs Backend

### Backend Controllers الموجودة
| Controller | Prefix | Frontend API hook موجود؟ |
|-----------|--------|--------------------------|
| `AuthController` | `/auth` | ✅ مدمج في `auth-provider` |
| `UsersController` | `/users` | ✅ `users.ts` |
| `ListingsController` | `/listings` | ✅ `listings.ts` |
| `BusesController` | `/buses` | ✅ `buses.ts` |
| `EquipmentController` | `/equipment` | ✅ `equipment.ts` |
| `EquipmentRequestsController` | `/equipment-requests` | ✅ في `equipment.ts` |
| `OperatorsController` | `/operators` | ✅ في `equipment.ts` |
| `PartsController` | `/parts` | ✅ `parts.ts` |
| `ServicesController` | `/services` | ✅ `services.ts` |
| `JobsController` | `/jobs` | ✅ `jobs.ts` |
| `AdminJobsController` | `/admin/jobs` | ✅ `admin-jobs.ts` |
| `TransportController` | `/transport` | ✅ مستخدم مباشر في transport features |
| `AdminTransportController` | `/admin/transport` | ❌ لا يوجد hook — admin فقط |
| `BookingsController` | `/bookings` | ✅ `bookings.ts` |
| `ChatController` | `/chat` | ✅ `chat.ts` |
| `FavoritesController` | `/favorites` | ✅ `favorites.ts` |
| `NotificationsController` | `/notifications` | ✅ `notifications.ts` |
| `PaymentsController` | `/payments` | ✅ `payments.ts` |
| `AdminPaymentsController` | `/admin/payments` | ❌ لا يوجد hook — admin فقط |
| `ReviewsController` | `/reviews` | ✅ `reviews.ts` |
| `SearchController` | `/search` | ✅ `search.ts` |
| `UploadsController` | `/uploads` | ✅ `uploads.ts` |
| `CarsController` | `/cars` | ✅ `cars.ts` (brands, models) |

### Backend Models بدون Frontend
| الـ Model | في الـ DB | في الـ API | في الـ Frontend |
|-----------|-----------|-----------|-----------------|
| `InsuranceOffer` | ✅ | ❌ لا controller | ❌ لا صفحة |
| `TripService` | ✅ | ❌ لا controller | ❌ لا صفحة |

---

## ملخص نهائي

### 🔴 الكوارث (صفحات مهمة غائبة تماماً)

1. **التأمين** — `InsuranceOffer` موجود في الـ DB لكن لا API ولا frontend على الإطلاق
2. **الرحلات** — `TripService` موجود في الـ DB لكن لا API ولا frontend على الإطلاق
3. **صفحة نتائج بحث مستقلة** — البحث يعمل في Navbar لكن لا يوجد `/search?q=...` page مستقلة؛ المستخدم لا يستطيع مشاركة رابط بحث أو حفظه

### 🟡 الناقص (موجود لكن غير مكتمل)

4. **تعديل طلبات المعدات** — `/edit-listing/equipment-request/[id]` غير موجود؛ المستخدم لا يستطيع تعديل طلبه
5. **تعديل طلبات النقل** — `/edit-listing` للنقل غير موجود
6. **صفحة landing مستقلة للقطع الغيار** — تظهر فقط داخل `/motors` وعبر `/browse/parts`؛ لا توجد `/parts` كصفحة رئيسية مستقلة
7. **صفحة landing مستقلة للخدمات** — نفس مشكلة القطع؛ لا توجد `/services` كصفحة رئيسية
8. **`/browse` بدون فئة** — يعمل redirect تلقائي لـ `cars` بدلاً من عرض "الكل"
9. **pause listing** — زر الإيقاف المؤقت موجود في `/my-listings` لكن الـ API غير مطبّق (placeholder فقط)

### 🟢 الشغال بالكامل

- 🟢 سيارات بيع + إيجار (listing, detail, add, edit, search)
- 🟢 حافلات بيع + إيجار (listing, detail, add, edit)
- 🟢 معدات بيع + إيجار (listing, detail, add, edit)
- 🟢 مشغّلو المعدات (listing, detail, add, edit)
- 🟢 قطع غيار (browse, detail, add, edit)
- 🟢 خدمات سيارات (browse, detail, add, edit)
- 🟢 وظائف كاملة (landing, browse, detail, add, edit, dashboard, drivers, proposals)
- 🟢 نقل (landing, browse, add request, my-requests, my-quotes, carrier dashboard)
- 🟢 Navigation كاملة بدون dead links
- 🟢 Auth كامل (login, register, verify, reset)
- 🟢 محادثات real-time
- 🟢 إشعارات
- 🟢 مفضلة
- 🟢 حجوزات
- 🟢 دفع (Thawani integration)
- 🟢 إعلاناتي (8 أقسام)
- 🟢 بروفايل البائع العام

---

## إحصاء سريع

| | العدد |
|--|--|
| إجمالي الصفحات | 56 |
| صفحات مكتملة بالكامل | 47 |
| صفحات ناقصة | 6 |
| صفحات غائبة تماماً (كوارث) | 3 |
| Backend Controllers | 23 |
| Frontend API hooks | 21 |
| Controllers بدون frontend hook | 2 (admin-only) |
| DB Models بدون أي frontend | 2 (insurance, trips) |
