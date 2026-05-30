# 🚛 Transport Notification Flow — Full Journey Audit

> مراجعة شاملة لكل إشعار في رحلة النقل من بداية الطلب حتى التقييم  
> Generated: 2026-05-30 | Audited against: `transport-request.service.ts`, `transport-quote.service.ts`, `transport-booking.service.ts`, `transport-review.service.ts`, `transport-expiry.service.ts`

---

## 🗺️ المخطط الزمني الكامل للرحلة

```
[SHIPPER]                           [CARRIER(S)]                     [SYSTEM/CRON]
    │                                    │                                 │
    ▼                                    │                                 │
1. Create Request ──────────────────► SYSTEM notify (≤30 carriers)        │
    │                  [rate-limited 5/carrier/day]                        │
    │                                    │                                 │
    ▼                                    │                                 │
2. Edit Request                          │                                 │
   (silent ❌)                           │                                 │
    │                                    │                                 │
    ▼                                    │                                 │
3. Cancel Request ──────────────────► TRANSPORT_REQUEST_CANCELLED          │
   (OPEN or QUOTED)          (each carrier with PENDING quote)             │
    │                                    │                                 │
    │              OR                    │                                 │
    │                                    ▼                                 │
    │                        4. Submit Quote                               │
    │◄──── TRANSPORT_QUOTE_RECEIVED ─────┘                                │
    │              (shipper)                                               │
    │                                    │                                 │
    ▼                                    │                                 │
5. Accept Quote ──────────────────── TRANSPORT_QUOTE_ACCEPTED             │
    │              (accepted carrier)    │                                 │
    │              ──────────────────► TRANSPORT_QUOTE_REJECTED            │
    │              (all other carriers)  │                                 │
    │                                    │                                 │
    │              OR                    │                                 │
    │                                    ▼                                 │
    │                        6. Withdraw Quote                             │
    │◄── TRANSPORT_QUOTE_REJECTED ───────┘                                │
    │    (shipper — carrier withdrew)                                      │
    │                                    │                                 │
    ▼                                    │                                 │
[BOOKING CREATED — inside acceptQuote() transaction]                      │
    │                                    │                                 │
    ▼                                    │                                 │
7. Start Loading (IN_PROGRESS) ◄── carrier action                         │
    │◄──── TRANSPORT_BOOKING_CONFIRMED ──┘                                │
    │      (shipper — "بدأ النقل")                                         │
    │                                    │                                 │
    ▼                                    │                                 │
8. Complete (COMPLETED) ◄── shipper action                                │
    └──────────────────────────────────► TRANSPORT_REQUEST_CLOSED         │
                         (carrier — "تم إتمام الطلب")                      │
    │                                    │                                 │
    ▼                                    │                                 │
9. Review ─────────────────────────────► REVIEW_RECEIVED                  │
    (shipper reviews carrier)  (carrier)                                  │
    │                                    │                                 │
    │                         [OR — Booking Cancelled]                     │
    │◄── TRANSPORT_BOOKING_CANCELLED ────┘                                │
    │    (other party)                                                     │
    │◄── TRANSPORT_BOOKING_CANCELLED                                       │
    │    (shipper extra: "طلبك متاح مجدداً" if carrier cancelled)          │
    │                                                                      │
    │                                         ─────────────────────────► CRON (3AM)
    │                                         TRANSPORT_REQUEST_EXPIRED    │
    │◄─────────────────────────────────────────────────────────────────── │
    │    (shipper — if request expires without accepted quote)             │
```

---

## 📋 تفصيل كل خطوة

---

### 1. Create Request — إنشاء طلب

| البند | التفاصيل |
|-------|----------|
| **الملف** | `transport-request.service.ts` → `create()` + `notifyMatchingCarriers()` |
| **من يتلقى؟** | الناقلون المتطابقون (نفس المحافظة + نوع الخدمة + `isAvailable: true`) حتى 30 ناقل |
| **النوع** | `SYSTEM` |
| **العنوان** | `طلب نقل جديد قريب منك` |
| **النص** | `طلب {serviceType} من {fromGovernorate} إلى {toGovernorate}` |
| **البيانات** | `{ requestId }` |
| **مرة واحدة؟** | نعم — لكل طلب مرة واحدة |
| **يتكرر؟** | نعم — كل طلب جديد يُرسل مجموعة جديدة |
| **Rate Limit** | ✅ 5 إشعارات/ناقل/يوم عبر Redis INCR |

#### ❌ Missing Notifications
- **الشاحن** لا يتلقى تأكيداً بإنشاء طلبه (confirmation)
- **الناقلون** لا يُبلَّغون عند **إعادة النشر** (repost) بعد انتهاء الصلاحية

#### ⚠️ Issues
- النوع `SYSTEM` عام جداً — يجب أن يكون `TRANSPORT_REQUEST_NEW` ليُميَّز في الـ frontend
- الإشعار لا يذكر وصف البضاعة (`cargoDescription`) الذي قد يكون أهم من نوع الخدمة

---

### 2. Edit Request — تعديل الطلب

| البند | التفاصيل |
|-------|----------|
| **الملف** | `transport-request.service.ts` → `update()` |
| **من يتلقى؟** | **لا أحد** ❌ |
| **النوع** | — |
| **مرة واحدة؟** | — |

#### ❌ Missing Notifications — كل هذه مفقودة
| المشكلة | التأثير |
|---------|---------|
| الناقلون الذين قدّموا عروضاً لا يعلمون أن الطلب تغيّر | قد يقبل ناقل عرضاً على معلومات قديمة |
| لا يوجد "تم تعديل الطلب" للناقلين | حالة تنافس: الناقل يرى نسخة مختلفة عما اتُّفق عليه |

#### 💡 المطلوب
```typescript
// إرسال لكل ناقل لديه quote PENDING
TRANSPORT_REQUEST_UPDATED → carriers with PENDING quotes
```

---

### 3. Cancel Request — إلغاء الطلب

| البند | التفاصيل |
|-------|----------|
| **الملف** | `transport-request.service.ts` → `cancel()` |
| **الشرط** | الطلب في حالة `OPEN` أو `QUOTED` فقط |
| **من يتلقى؟** | كل ناقل لديه `quote.status === PENDING` |
| **النوع** | `TRANSPORT_REQUEST_CANCELLED` |
| **العنوان** | `إلغاء طلب نقل` |
| **النص** | `تم إلغاء طلب النقل الذي قدمت عرضاً عليه` |
| **البيانات** | `{ requestId }` |
| **مرة واحدة؟** | نعم |
| **يتكرر؟** | لا — الإلغاء نهائي |

#### ❌ Missing Notifications
- **الشاحن** لا يتلقى تأكيداً بنجاح الإلغاء (API response كافٍ لكن الإشعار مهم للـ push)
- النص لا يذكر تفاصيل الطلب (من/إلى)

---

### 4. Submit Quote — تقديم عرض سعر

| البند | التفاصيل |
|-------|----------|
| **الملف** | `transport-quote.service.ts` → `submitQuote()` |
| **من يتلقى؟** | الشاحن (صاحب الطلب) |
| **النوع** | `TRANSPORT_QUOTE_RECEIVED` |
| **العنوان** | `عرض سعر جديد` |
| **النص** | `وصلك عرض بسعر {price} ر.ع.` |
| **البيانات** | `{ requestId, quoteId }` |
| **مرة واحدة؟** | نعم — لكل عرض مقدَّم |
| **يتكرر؟** | نعم — كل ناقل يقدّم عرضاً يُرسل إشعاراً |
| **Rate Limit للناقل** | ✅ 20 عرض/يوم (غير موثق) / 50 عرض/يوم (موثق) عبر Redis |

#### ⚠️ Issues
- النص لا يذكر **اسم الناقل** — الشاحن لا يعرف من أرسل العرض حتى يفتح التطبيق
- إذا قدّم 10 ناقلين عروضاً في دقيقة — الشاحن يتلقى **10 إشعارات متتالية** (لا يوجد debounce)

#### 💡 المقترح
```typescript
body: `وصلك عرض من ${carrier.user.displayName} بسعر ${price} ر.ع.`
```

---

### 5. Accept Quote — قبول عرض

| البند | التفاصيل |
|-------|----------|
| **الملف** | `transport-quote.service.ts` → `acceptQuote()` → `sendAcceptanceNotifications()` |
| **Transaction** | ✅ Serializable — atomic |
| **يُرسل خارج الـ transaction؟** | ✅ نعم — بعد انتهائها |

#### الإشعارات المرسلة

| المتلقي | النوع | العنوان | النص |
|---------|-------|---------|------|
| الناقل المقبول | `TRANSPORT_QUOTE_ACCEPTED` | `تم قبول عرضك` | `تم قبول عرضك على طلب النقل` |
| كل ناقل مرفوض | `TRANSPORT_QUOTE_REJECTED` | `تم رفض عرضك` | `تم اختيار ناقل آخر للطلب` |

#### ❌ Missing Notifications
- **الشاحن** لا يتلقى تأكيد إنشاء الحجز (Booking Created)
  - صحيح أنه هو مَن بدأ القبول، لكن push notification مهم للـ confirmation receipt
  - البيانات: `{ bookingId, conversationId }` للانتقال مباشرة للمحادثة

#### ⚠️ Issues
- النص "تم اختيار ناقل آخر" لا يوضح أي طلب (يجب إضافة `requestId` في data) ✅ موجود
- لا يوجد إشعار للناقل المقبول يحتوي على `conversationId` للانتقال مباشرة للمحادثة

---

### 6. Withdraw Quote — سحب العرض

| البند | التفاصيل |
|-------|----------|
| **الملف** | `transport-quote.service.ts` → `withdrawQuote()` |
| **من يتلقى؟** | الشاحن |
| **النوع** | `TRANSPORT_QUOTE_REJECTED` ⚠️ |
| **العنوان** | `سحب عرض سعر` |
| **النص** | `قام أحد الناقلين بسحب عرضه على طلبك` |
| **البيانات** | `{ requestId }` |
| **مرة واحدة؟** | نعم |

#### ⚠️ Issues
- يستخدم `TRANSPORT_QUOTE_REJECTED` لحدثٍ مختلف تماماً (سحب ≠ رفض)
  - هذا يُسبب ارتباكاً في الـ frontend: icon أحمر بدل برتقالي مثلاً
  - **المقترح**: نوع منفصل `TRANSPORT_QUOTE_WITHDRAWN`
- النص لا يذكر اسم الناقل الذي سحب

---

### 7. Create Booking — إنشاء الحجز

> يحدث **داخل نفس transaction** لـ `acceptQuote()`

| البند | التفاصيل |
|-------|----------|
| **الملف** | `transport-quote.service.ts` → `acceptQuote()` (inside `$transaction`) |
| **إشعار مستقل؟** | **لا** ❌ |

#### ❌ Missing Notification
```
الشاحن ← TRANSPORT_BOOKING_CONFIRMED: "تم إنشاء حجزك — انضم للمحادثة مع الناقل"
data: { bookingId, conversationId }
```

---

### 8. Start Loading / In Progress — بدء التحميل

| البند | التفاصيل |
|-------|----------|
| **الملف** | `transport-booking.service.ts` → `markInProgress()` |
| **من يبدأها؟** | الناقل |
| **من يتلقى؟** | الشاحن |
| **النوع** | `TRANSPORT_BOOKING_CONFIRMED` ⚠️ |
| **العنوان** | `بدأ النقل` |
| **النص** | `الناقل بدأ في تنفيذ طلبك` |
| **البيانات** | `{ bookingId }` |
| **مرة واحدة؟** | نعم |

#### ⚠️ Issues
- النوع `TRANSPORT_BOOKING_CONFIRMED` مُضلِّل: الـ Booking تم تأكيده عند acceptQuote، هذا "بدء التنفيذ"
  - **المقترح**: `TRANSPORT_IN_PROGRESS` أو `TRANSPORT_STARTED`
- لا يوجد تمييز بين "Start Loading" و"In Transit" — كلاهما نفس الحدث (`IN_PROGRESS`)
  - إذا أراد الشاحن معرفة أن البضاعة في الطريق vs لا تزال تُحمَّل، لا يوجد فرق

---

### 9. Delivered / Completed — اكتمال التسليم

| البند | التفاصيل |
|-------|----------|
| **الملف** | `transport-booking.service.ts` → `complete()` |
| **من يبدأها؟** | الشاحن |
| **من يتلقى؟** | الناقل |
| **النوع** | `TRANSPORT_REQUEST_CLOSED` ⚠️ |
| **العنوان** | `تم إتمام الطلب` |
| **النص** | `تم تأكيد إتمام طلب النقل بنجاح` |
| **البيانات** | `{ bookingId }` |
| **مرة واحدة؟** | نعم |
| **Side effects** | `carrierProfile.completedTrips += 1` ✅ |

#### ❌ Missing Notifications
| المشكلة | التأثير |
|---------|---------|
| الشاحن لا يتلقى تأكيداً (هو بدأ الإتمام) | لا يوجد push للتأكيد |
| لا يوجد **Review Reminder** بعد الاكتمال | نسبة التقييمات ستكون منخفضة |

#### ⚠️ Issues
- النوع `TRANSPORT_REQUEST_CLOSED` يُشير للطلب لا للحجز — مُضلِّل
  - **المقترح**: `TRANSPORT_BOOKING_COMPLETED`

#### 💡 Review Reminder المقترح
```typescript
// بعد complete() مباشرة — fire and forget
this.notifications.create({
  type: 'REVIEW_RECEIVED', // أو نوع جديد: REVIEW_REMINDER
  title: 'كيف كانت تجربتك؟',
  body: 'قيّم الناقل وساعد الآخرين في اختياراتهم',
  userId: booking.request.userId,  // الشاحن
  data: { bookingId }
}).catch(() => {});
```

---

### 10. Cancel Booking — إلغاء الحجز

| البند | التفاصيل |
|-------|----------|
| **الملف** | `transport-booking.service.ts` → `cancel()` |
| **من يمكنه الإلغاء؟** | الشاحن أو الناقل |
| **الشرط** | `status` ليس `COMPLETED` أو `CANCELLED` |
| **Request يعود لـ** | `OPEN` (يمكن استقبال عروض جديدة) ✅ |

#### الإشعارات المرسلة

| السيناريو | المتلقي | النوع | العنوان | النص |
|-----------|---------|-------|---------|------|
| أي طرف يلغي | الطرف الآخر | `TRANSPORT_BOOKING_CANCELLED` | `تم إلغاء الحجز` | `تم إلغاء حجز النقل` أو السبب |
| الناقل يلغي | الشاحن (إضافي) | `TRANSPORT_BOOKING_CANCELLED` | `طلبك متاح مجدداً` | `ألغى الناقل الحجز — طلبك الآن مفتوح لاستقبال عروض جديدة` |

#### ⚠️ Issues
- نفس النوع `TRANSPORT_BOOKING_CANCELLED` للحالتين — الـ frontend لا يُفرّق بين "أنت ألغيت" و"الناقل ألغى"
- عند إلغاء الناقل: الشاحن يتلقى **إشعارَين** — الأول العام والثاني "طلبك متاح" (مقبول لكن يمكن دمجهما)

---

### 11. Review — التقييم

| البند | التفاصيل |
|-------|----------|
| **الملف** | `transport-review.service.ts` → `createReview()` |
| **من يُقيِّم؟** | الشاحن فقط |
| **الشرط** | `booking.status === COMPLETED` |
| **من يتلقى؟** | الناقل |
| **النوع** | `REVIEW_RECEIVED` |
| **العنوان** | `تقييم جديد` |
| **النص** | `لقد حصلت على تقييم {rating} نجوم من العميل` |
| **البيانات** | `{ bookingId, rating }` |
| **Duplicate check** | ✅ يمنع التكرار عبر unique constraint |
| **يحدّث** | `carrierProfile.averageRating` + `carrierProfile.reviewCount` ✅ |

#### ❌ Missing Notifications
- **الناقل لا يمكنه تقييم الشاحن** — التقييم أحادي الاتجاه فقط
- لا يوجد notification للشاحن يؤكد إرسال تقييمه

---

### 12. Request Expired — انتهاء الصلاحية (CRON)

| البند | التفاصيل |
|-------|----------|
| **الملف** | `transport-expiry.service.ts` → `expireOldRequests()` |
| **التوقيت** | يومياً 3:00 صباحاً |
| **الشرط** | `status IN (OPEN, QUOTED)` AND `expiresAt < now()` |
| **من يتلقى؟** | الشاحن (صاحب الطلب) |
| **النوع** | `TRANSPORT_REQUEST_EXPIRED` |
| **العنوان** | `انتهاء طلب نقل` |
| **النص** | `طلب نقل "{cargoDescription}" من {fromGovernorate} إلى {toGovernorate} انتهت صلاحيته ولم يُقبل أي عرض` |
| **البيانات** | `{ requestId }` |
| **يُبطل الـ Cache** | ✅ |

#### ❌ Missing Notifications
- الناقلون الذين قدّموا عروضاً `PENDING` لا يُبلَّغون أن الطلب انتهى
  - العروض تبقى بحالة `PENDING` في DB (لا يوجد cleanup للعروض عند الانتهاء)

---

### 13. Repost Request — إعادة النشر

| البند | التفاصيل |
|-------|----------|
| **الملف** | `transport-request.service.ts` → `repost()` |
| **الشرط** | `status === EXPIRED` فقط |
| **إشعار للناقلين؟** | **لا** ❌ |

#### ❌ Missing Notification
عند إعادة النشر، الناقلون المتطابقون لا يُبلَّغون — يجب استدعاء `notifyMatchingCarriers()` مرة أخرى.

---

## 🔴 ملخص المشاكل الحرجة

### ❌ إشعارات مفقودة كلياً

| # | الخطوة | الإشعار المفقود | المتلقي | الأثر |
|---|--------|----------------|---------|-------|
| 1 | Edit Request | "تم تعديل الطلب" | الناقلون الذين قدّموا عروضاً | يقبل ناقل عرضاً على معلومات قديمة |
| 2 | Accept Quote | "تم إنشاء الحجز" | الشاحن | لا يعرف أن المحادثة جاهزة |
| 3 | Complete | "تم إتمام طلبك" | الشاحن | لا push confirmation |
| 4 | Complete | "كيف كانت تجربتك؟" (review reminder) | الشاحن | نسبة تقييم منخفضة |
| 5 | Repost | "طلب نقل جديد قريب منك" | الناقلون | الطلب المعاد نشره لا يظهر لأحد |
| 6 | Expiry | "انتهت صلاحية الطلب الذي قدّمت عليه" | الناقلون بعروض PENDING | يظنون عروضهم لا تزال نشطة |
| 7 | Review | الناقل لا يمكنه تقييم الشاحن | — | تقييم أحادي الاتجاه |

### ⚠️ أنواع إشعارات مضللة

| الخطوة | النوع الحالي | المشكلة | المقترح |
|--------|-------------|---------|---------|
| Withdraw Quote | `TRANSPORT_QUOTE_REJECTED` | سحب ≠ رفض | `TRANSPORT_QUOTE_WITHDRAWN` |
| Start Loading | `TRANSPORT_BOOKING_CONFIRMED` | الحجز سبق تأكيده | `TRANSPORT_BOOKING_STARTED` |
| Complete | `TRANSPORT_REQUEST_CLOSED` | يُشير للطلب لا الحجز | `TRANSPORT_BOOKING_COMPLETED` |
| New Request | `SYSTEM` | عام جداً | `TRANSPORT_REQUEST_NEW` |

### ⚠️ محتوى إشعارات يفتقر للسياق

| الخطوة | المشكلة | المقترح |
|--------|---------|---------|
| Submit Quote | لا يذكر اسم الناقل | أضف `carrier.user.displayName` |
| Withdraw Quote | لا يذكر من سحب | أضف `carrier.user.displayName` |
| Cancel Booking | لا يذكر تفاصيل الرحلة | أضف من/إلى |
| Submit Quote spam | 10+ ناقلين يرسلون دفعة واحدة | فكر في debounce / digest |

---

## 📊 جدول الإشعارات الكاملة (الحالية + المقترحة)

| # | الحدث | المُرسِل | المتلقي | النوع الحالي | الحالة |
|---|-------|---------|---------|-------------|--------|
| 1 | Create Request | Shipper | Carriers (≤30) | `SYSTEM` | ✅ موجود |
| 2 | Edit Request | Shipper | Carriers w/ quotes | — | ❌ مفقود |
| 3 | Cancel Request | Shipper | Carriers w/ PENDING quotes | `TRANSPORT_REQUEST_CANCELLED` | ✅ موجود |
| 4 | Submit Quote | Carrier | Shipper | `TRANSPORT_QUOTE_RECEIVED` | ✅ موجود |
| 5 | Accept Quote → carrier accepted | Shipper | Accepted carrier | `TRANSPORT_QUOTE_ACCEPTED` | ✅ موجود |
| 6 | Accept Quote → others rejected | Shipper | Other carriers | `TRANSPORT_QUOTE_REJECTED` | ✅ موجود |
| 7 | Accept Quote → booking created | Shipper | **Shipper** | — | ❌ مفقود |
| 8 | Withdraw Quote | Carrier | Shipper | `TRANSPORT_QUOTE_REJECTED` | ⚠️ نوع خاطئ |
| 9 | Start Loading | Carrier | Shipper | `TRANSPORT_BOOKING_CONFIRMED` | ⚠️ نوع مضلل |
| 10 | Complete | Shipper | Carrier | `TRANSPORT_REQUEST_CLOSED` | ⚠️ نوع مضلل |
| 11 | Complete | Shipper | **Shipper** | — | ❌ مفقود |
| 12 | Complete → review reminder | System | **Shipper** | — | ❌ مفقود |
| 13 | Cancel Booking (either) | Shipper/Carrier | Other party | `TRANSPORT_BOOKING_CANCELLED` | ✅ موجود |
| 14 | Cancel Booking (carrier) | Carrier | Shipper (extra) | `TRANSPORT_BOOKING_CANCELLED` | ✅ موجود |
| 15 | Review | Shipper | Carrier | `REVIEW_RECEIVED` | ✅ موجود |
| 16 | Carrier review shipper | — | Shipper | — | ❌ مفقود |
| 17 | Expiry (cron 3AM) | System | Shipper | `TRANSPORT_REQUEST_EXPIRED` | ✅ موجود |
| 18 | Expiry (cron 3AM) | System | **Carriers w/ PENDING** | — | ❌ مفقود |
| 19 | Repost | Shipper | Carriers | — | ❌ مفقود |

**الإحصاء:**
- ✅ موجودة ومشتغلة: **12**
- ❌ مفقودة: **7**
- ⚠️ موجودة لكن بنوع خاطئ: **3**

---

## 💡 خطة الإصلاح المقترحة (بالأولوية)

### 🔴 Priority 1 — تؤثر على تجربة المستخدم مباشرة

```typescript
// 1. Edit Request → notify carriers
// transport-request.service.ts → update()
if (pendingQuotes.length > 0) {
  await Promise.allSettled(pendingQuotes.map(q =>
    this.notifications.create({
      type: 'TRANSPORT_REQUEST_UPDATED', // نوع جديد
      title: 'تم تعديل طلب النقل',
      body: `تم تعديل الطلب الذي قدّمت عليه عرضاً`,
      userId: q.carrier.userId,
      data: { requestId: id },
    })
  ));
}

// 2. Accept Quote → confirm to shipper
// transport-quote.service.ts → after acceptQuote()
await this.notifications.create({
  type: 'TRANSPORT_BOOKING_CONFIRMED',
  title: 'تم إنشاء حجزك',
  body: 'تم قبول العرض وإنشاء الحجز — انضم للمحادثة',
  userId: quote.request.userId,
  data: { bookingId: booking.id, conversationId: conversation.id },
});

// 3. Complete → review reminder to shipper
// transport-booking.service.ts → complete()
this.notifications.create({
  type: 'REVIEW_REMINDER', // نوع جديد
  title: 'كيف كانت تجربتك؟',
  body: 'قيّم الناقل وساعد الآخرين في اختياراتهم',
  userId: booking.request.userId,
  data: { bookingId },
}).catch(() => {});
```

### 🟠 Priority 2 — إصلاح الأنواع المضللة

```typescript
// 4. Add to NotificationType enum (schema.prisma):
TRANSPORT_QUOTE_WITHDRAWN
TRANSPORT_BOOKING_STARTED
TRANSPORT_BOOKING_COMPLETED
TRANSPORT_REQUEST_NEW
REVIEW_REMINDER
TRANSPORT_REQUEST_UPDATED

// 5. Repost → notify carriers
// transport-request.service.ts → repost()
this.notifyMatchingCarriers({ id, serviceType, fromGovernorate, toGovernorate })
  .catch(err => this.logger.error(...));
```

### 🟡 Priority 3 — تحسينات

```typescript
// 6. Expiry → notify carriers with PENDING quotes
// transport-expiry.service.ts → expireOldRequests()
// Include quotes in the select, notify each carrier

// 7. Add carrier name to quote notification
body: `وصلك عرض من ${carrier.user.displayName} بسعر ${dto.price} ر.ع.`

// 8. Quote spam debounce
// Consider: send digest notification after 5-min window ("وصلك 3 عروض جديدة")
```

---

*آخر تحديث: 2026-05-30*
