# خطة الإصلاح الشاملة — قسم النقل
# Transport System — Full Bug Fix Plan

---

## قواعد صارمة للـ Executing Agent

```
1. لا تعدّل أي ملف خارج نطاق المهمة المحددة في كل Sprint
2. بعد كل ملف تعدّله → شغّل `npx tsc --noEmit` وتأكد من صفر أخطاء
3. بعد كل Sprint كامل → شغّل `npm run build` وتأكد من نجاحه
4. لا تنشئ أي ملفات جديدة إلا لو مذكور صراحة في الخطة
5. لا تغيّر أي منطق غير مذكور — فقط الإصلاحات المحددة
6. لا تحذف أي كود موجود إلا لو مطلوب صراحة
7. كل تغيير Backend يستلزم migration إذا تعلّق بالـ schema
8. بعد كل Sprint → commit واضح بعنوان محدد
9. إذا واجهت خطأ غير متوقع → توقف وأبلغ، لا تخمّن الحل
10. لا تعدّل ملفات الـ tests أو الـ CI/CD
```

---

## سجل الأخطاء الكامل (67 خطأ)

### فئة A — Backend & Schema 🔴 (8)
| # | الخطأ | الملف |
|---|-------|-------|
| A1 | `TransportBooking.status` يستخدم `TransportRequestStatus` بدل `BookingStatus` | `schema.prisma:1790` |
| A2 | Default booking status = `IN_PROGRESS` بدل `ACCEPTED` | `schema.prisma:1790` |
| A3 | مفيش `GET /transport/bookings/:id` | `transport.controller.ts` |
| A4 | `setAvailability()` لا تُرجع `user` | `carrier-profile.service.ts:127` |
| A5 | `myRequests()` لا تُرجع `user` | `transport-request.service.ts:205` |
| A6 | Types frontend تعرّف علاقات الـ booking كـ optional وهي مش كذلك | `types.ts:132` |
| A7 | `scheduledAt` لا يُرسَل عند timingType=scheduled وحقل فارغ | `CreateRequestWizard.tsx:93` |
| A8 | Double submit في الـ wizard — بدون debounce | `CreateRequestWizard.tsx:162` |

### فئة B — Navigation & Logic 🟠 (11)
| # | الخطأ | الملف |
|---|-------|-------|
| B1 | "عرض الحجز" في my-quotes يوجّه لـ `/my-requests` | `my-quotes/page.tsx:241` |
| B2 | الناقل مفيش "حجوزاتي" في nav — dead end | `SubNavBar.tsx` |
| B3 | `my-quotes/page.tsx` بدون `AuthGuard` | `my-quotes/page.tsx` |
| B4 | Step 4 wizard بدون validation على `scheduledAt` | `CreateRequestWizard.tsx:46` |
| B5 | `booking.carrier` بدون null check → crash | `bookings/[id]:329` |
| B6 | Carrier dashboard redirect flash of content | `carriers/dashboard:50` |
| B7 | `/jobs/my/page.tsx` لا يزال موجوداً | `jobs/my/page.tsx` |
| B8 | ناقل بدون profile يشوف نموذج العرض — خطأ عام عند الإرسال | `requests/[id]:362` |
| B9 | `isCarrier` في booking detail خاطئ — role-based مش booking-specific | `bookings/[id]:159` |
| B10 | `my-bookings` للشاحن فقط — الناقل مفيش صفحة حجوزاته | `my-bookings/page.tsx` |
| B11 | `isCarrier` check مكرر مع B9 — نفس المشكلة | `bookings/[id]` |

### فئة C — UX Bugs 🟡 (18)
| # | الخطأ | الملف |
|---|-------|-------|
| C1 | Wizard validation صامت — لا toast عند فشل التحقق | `CreateRequestWizard.tsx:68` |
| C2 | Race condition: سحب عرض + تبديل tab | `my-quotes/page.tsx:68` |
| C3 | Error toast في carrier dashboard لا يُغلق | `carriers/dashboard:330` |
| C4 | Retry buttons بدون loading indicator | `my-quotes` + `my-requests` |
| C5 | Mobile filter badge لا يعرض عدد الفلاتر | `BrowseContent.tsx` |
| C6 | Carrier register زرار يتجمّد عند 409 | `carriers/register:118` |
| C7 | Spinner في carrier register بدون نص | `carriers/register:65` |
| C8 | Quote messages مخفية by default | `requests/[id]:139` |
| C9 | Pagination لا تـscroll للأعلى | `RequestsGrid.tsx:72` |
| C10 | أسماء طويلة تكسر layout — بدون truncate | `bookings/[id]:323` |
| C11 | `window.location.reload()` في retry | `my-requests/page.tsx` |
| C12 | حقل السعر بدون تلوين أحمر عند خطأ | `requests/[id]:226` |
| C13 | حقل الساعات يقبل صفر/سالب | `requests/[id]:242` |
| C14 | حقل الرسالة يقبل whitespace فقط | `requests/[id]:256` |
| C15 | Tabs بدون skeleton عند التبديل | `my-requests` + `my-quotes` |
| C16 | زرار cancel booking بدون confirmation dialog | `bookings/[id]` |
| C17 | UUID يظهر كـ requestId في carrier dashboard | `carriers/dashboard:267` |
| C18 | إحداثيات الخريطة لا تظهر في Step5Review | `Step5Review.tsx` |

### فئة E — Locale Links 🔴 (10)
| # | الخطأ | الملف |
|---|-------|-------|
| E1 | `TransportRequestCard` — href بدون locale | `TransportRequestCard.tsx:46` |
| E2 | `HeroSection` — روابط CTA بدون locale | `HeroSection.tsx:53-66` |
| E3 | `CarrierCTA` — روابط بدون locale | `CarrierCTA.tsx:70-81` |
| E4 | `ServiceTypesGrid` — روابط categories بدون locale | `ServiceTypesGrid.tsx:84` |
| E5 | `LatestRequests` — "عرض الكل" بدون locale | `LatestRequests.tsx:25` |
| E6 | `requests/[id]` — "العودة للتصفح" بدون locale | `requests/[id]/page.tsx:379` |
| E7 | `ServiceTypesGrid` — filter URL بدون locale | `ServiceTypesGrid.tsx:84` |
| E8 | `carriers/register` — روابط داخلية بدون locale | `carriers/register/page.tsx` |
| E9 | `my-quotes` — روابط داخلية بدون locale | `my-quotes/page.tsx` |
| E10 | `carriers/dashboard` — روابط بدون locale | `carriers/dashboard/page.tsx` |

### فئة F — Filter & Browse 🟠 (10)
| # | الخطأ | الملف |
|---|-------|-------|
| F1 | فلاتر البحث لا تُحفظ في URL | `BrowseContent.tsx:36` |
| F2 | Wilayat لا يُرسَل للـ API | `BrowseContent.tsx:52` |
| F3 | Pagination لا تحتفظ بالفلاتر | `BrowseContent.tsx` |
| F4 | `fromWilayat/toWilayat` في interface لكن لا تُمرَّر | `types.ts:203` |
| F5 | مفيش "مسح كل الفلاتر" مع URL update | `BrowseContent.tsx` |
| F6 | `cargoDescription` بدون fallback في request card | `TransportRequestCard.tsx:100` |
| F7 | `RouteMapView` ينتظر 1.1s دايماً حتى بدون geocoding | `RouteMapView.tsx:98` |
| F8 | `scheduledAt` خارج STEP_FIELDS — لا validation | `CreateRequestWizard.tsx:46` |
| F9 | Step5Review لا تعرض تأكيد الخريطة | `Step5Review.tsx` |
| F10 | Sort option لا يُحفظ في URL | `BrowseContent.tsx` |

### فئة D — i18n 🟢 (20)
| # | الخطأ |
|---|-------|
| D1-D20 | نصوص Arabic hardcoded في: HeroSection, constants.ts (status labels), date format, wizard steps, RequestCard, error messages, CarrierCTA, ServiceTypesGrid, LatestRequests, fallback 'ناقل' |

---

# Sprint 1 — الكسور الكاملة (Critical Blockers)
**الهدف:** إصلاح ما يمنع الاستخدام الأساسي للنظام
**أخطاء:** A1, A2, A3, B9, E1-E10, B1, B2

---

## S1-T1 — إصلاح Prisma Schema (A1 + A2)

**الملف:** `apps/api/prisma/schema.prisma`

ابحث عن `TransportBooking` model وغيّر:
```prisma
// قبل:
status TransportRequestStatus @default(IN_PROGRESS)

// بعد:
status BookingStatus @default(ACCEPTED)
```

**بعد التعديل:**
```bash
cd apps/api
npx prisma migrate dev --name fix-booking-status-type
npx prisma generate
```

**التحقق:**
- [ ] Migration نجحت بدون أخطاء
- [ ] `npx prisma studio` → فتح جدول `TransportBooking` → عمود `status` يقبل: ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED فقط
- [ ] `npx tsc --noEmit` في `apps/api` → صفر أخطاء

---

## S1-T2 — إضافة `GET /transport/bookings/:id` (A3)

**الملف 1:** `apps/api/src/transport/transport-booking.service.ts`

أضف الدالة التالية بعد `getMyBookings()`:
```typescript
async getBooking(bookingId: string, userId: string) {
  const booking = await this.prisma.transportBooking.findUnique({
    where: { id: bookingId },
    include: {
      request: { include: { user: { select: USER_SELECT } } },
      quote: { include: { carrier: { include: { user: { select: USER_SELECT } } } } },
    },
  });
  if (!booking) throw new NotFoundException('الحجز غير موجود');

  const isShipper = booking.request.userId === userId;
  const isCarrier = booking.quote.carrier.userId === userId;
  if (!isShipper && !isCarrier) {
    throw new ForbiddenException('لا يمكنك عرض هذا الحجز');
  }
  return booking;
}
```

**الملف 2:** `apps/api/src/transport/transport.controller.ts`

أضف endpoint قبل `getMyBookings`:
```typescript
@UseGuards(JwtAuthGuard)
@Get('bookings/:id')
getBooking(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
  return this.transportBookingService.getBooking(id, user.sub);
}
```

**الملف 3:** `apps/web/src/features/transport/api.ts`

أضف دالة جديدة:
```typescript
getBooking(id: string) {
  return apiRequest<TransportBooking>(`/transport/bookings/${id}`);
}
```

**الملف 4:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`

عدّل الـ `useEffect` من:
```typescript
const res = await transportApi.myBookings('shipper');
let found = res.items.find((b) => b.id === id);
if (!found) {
  const res2 = await transportApi.myBookings('carrier');
  found = res2.items.find((b) => b.id === id);
}
if (!found) throw new Error('not found');
setBooking({ ...found, carrier: found.quote?.carrier });
```
إلى:
```typescript
const found = await transportApi.getBooking(id);
setBooking({ ...found, carrier: found.quote?.carrier });
```

**التحقق:**
- [ ] `npx tsc --noEmit` في كلا المشروعين → صفر أخطاء
- [ ] اختبار يدوي: فتح `/transport/bookings/[id]` بـ ID حقيقي → تحمّل بدون "جلب كل الحجوزات"
- [ ] اختبار: فتح بـ ID وهمي → يظهر رسالة خطأ محترمة
- [ ] اختبار: شخص ثالث لا علاقة له بالحجز يحاول الوصول → 403

---

## S1-T3 — إصلاح `isCarrier` في Booking Detail (B9)

**الملف:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`

عدّل السطرين:
```typescript
// قبل:
const isCarrier = user?.role === 'CARRIER';
const isShipper = !isCarrier;

// بعد:
const isCarrier = booking?.quote?.carrier?.userId === user?.id;
const isShipper = booking?.request?.userId === user?.id;
```

**التحقق:**
- [ ] ناقل الحجز الفعلي يشوف "بدأت التحميل" فقط
- [ ] ناقل آخر غير مرتبط بالحجز لا يشوف الأزرار
- [ ] الشاحن يشوف "استلمت — اكتمل" فقط عند IN_PROGRESS

---

## S1-T4 — إصلاح Locale Links (E1-E10)

**الشرط:** كل الملفات دي لازم تستبدل:
```typescript
import Link from 'next/link'; // ❌
// بـ:
import { Link } from '@/i18n/navigation'; // ✅
```

**الملفات التي تحتاج تعديل:**
1. `apps/web/src/features/transport/components/TransportRequestCard.tsx`
2. `apps/web/src/features/transport/components/HeroSection.tsx`
3. `apps/web/src/features/transport/components/CarrierCTA.tsx`
4. `apps/web/src/features/transport/components/ServiceTypesGrid.tsx`
5. `apps/web/src/features/transport/components/LatestRequests.tsx`
6. `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx` (رابط "العودة للتصفح")
7. `apps/web/src/app/[locale]/transport/carriers/register/page.tsx`
8. `apps/web/src/app/[locale]/transport/my-quotes/page.tsx`
9. `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`

**لكل ملف:**
1. تحقق من الـ import الحالي للـ `Link`
2. إذا كان من `next/link` → غيّره لـ `@/i18n/navigation`
3. لا تغيّر أي شيء آخر في الملف

**التحقق:**
- [ ] `npx tsc --noEmit` → صفر أخطاء
- [ ] اضغط على أي request card → تذهب لـ `/ar/transport/requests/:id` (مع locale)
- [ ] اضغط "أنشئ طلب نقل" في HeroSection → `ar/transport/new`
- [ ] اضغط "سجّل كناقل" في CarrierCTA → `ar/transport/carriers/register`

---

## S1-T5 — إصلاح رابط "عرض الحجز" في my-quotes (B1)

**الملف:** `apps/web/src/app/[locale]/transport/my-quotes/page.tsx`

**الخطوة 1:** في Backend، تأكد إن `getMyQuotes()` بيُرجع `bookingId` على كل quote مقبول.

افحص `transport-quote.service.ts` → دالة `getMyQuotes()`:
```typescript
// أضف في الـ include:
include: {
  request: { select: { id: true, fromGovernorate: true, toGovernorate: true } },
}
```

**الخطوة 2:** في Frontend، عدّل الرابط:
```typescript
// قبل:
{quote.status === 'ACCEPTED' && (
  <Link href="/transport/my-requests">عرض الحجز</Link>
)}

// بعد:
{quote.status === 'ACCEPTED' && (
  <Link href="/transport/my-bookings">عرض الحجز</Link>
)}
```

**التحقق:**
- [ ] ناقل بعرض مقبول يضغط "عرض الحجز" → يروح لصفحة حجوزاته
- [ ] الرابط يحتوي على locale

---

## S1-T6 — صفحة my-bookings تدعم الناقل (B2 + B10)

**الملف:** `apps/web/src/app/[locale]/transport/my-bookings/page.tsx`

عدّل الصفحة لتدعم كلا الـ roles:
```typescript
// أضف في أعلى الـ component:
const { isCarrier } = useTransportRole(); // أو useMyCarrierProfile
const role = isCarrier ? 'carrier' : 'shipper';

// في الـ fetch:
const res = await transportApi.myBookings(role); // بدل 'shipper' hardcoded
```

**الملف:** `apps/web/src/components/layout/SubNavBar.tsx`

أضف رابط "حجوزاتي" للناقل:
```typescript
if (isCarrier) {
  links.push(
    { href: '/transport/my-quotes', label: 'عروضي', icon: MessageSquare },
    { href: '/transport/my-bookings', label: 'حجوزاتي', icon: CalendarCheck }, // ✅ جديد
    { href: '/transport/carriers/dashboard', label: 'لوحة الناقل', icon: LayoutDashboard },
  );
}
```

**التحقق:**
- [ ] ناقل مسجّل يشوف "حجوزاتي" في النav
- [ ] فتح الصفحة يعرض حجوزات الناقل (carrier role)
- [ ] شاحن يشوف حجوزاته (shipper role)

---

## ✅ نهاية Sprint 1 — اختبار شامل

```bash
cd apps/api && npm run build   # يجب أن ينجح
cd apps/web && npm run build   # يجب أن ينجح
```

**سيناريو اختبار يدوي كامل:**
```
1. ناقل يفتح request → يقدم عرض → يروح my-quotes → يشوف العرض
2. شاحن يقبل العرض → يُعاد توجيهه لـ /bookings/:id
3. صفحة booking تفتح مباشرة بدون fetch كل الحجوزات
4. الناقل يفتح my-bookings → يشوف حجزه
5. الناقل يضغط "بدأت التحميل" → ينجح (مش يفشل بسبب A2)
6. كل الروابط تحتوي على locale (/ar/...)
```

**commit:** `fix(transport): Sprint 1 - critical blockers, schema fix, booking endpoint, locale links`

---

# Sprint 2 — سلامة البيانات (Data Integrity)
**الهدف:** منع فقدان البيانات والـ crashes
**أخطاء:** A4, A5, A7, A8, B3, B5, B8, C6

---

## S2-T1 — إصلاح `setAvailability()` (A4)

**الملف:** `apps/api/src/transport/carrier-profile.service.ts`

```typescript
// قبل:
return this.prisma.carrierProfile.update({
  where: { userId },
  data: { isAvailable },
});

// بعد:
return this.prisma.carrierProfile.update({
  where: { userId },
  data: { isAvailable },
  include: { user: { select: USER_SELECT } }, // ✅
});
```

**التحقق:**
- [ ] تغيير availability في dashboard → لا crash
- [ ] Response يحتوي على `user.displayName`

---

## S2-T2 — إصلاح `myRequests()` (A5)

**الملف:** `apps/api/src/transport/transport-request.service.ts`

في دالة `myRequests()` أضف `user` للـ include:
```typescript
include: {
  user: { select: USER_SELECT }, // ✅ إضافة
  _count: { select: { quotes: true } },
  booking: true,
},
```

**التحقق:**
- [ ] صفحة my-requests → بيانات المستخدم ظاهرة على كل طلب

---

## S2-T3 — Validation على `scheduledAt` (A7 + B4 + F8)

**الملف:** `apps/web/src/features/transport/components/CreateRequestWizard.tsx`

عدّل `STEP_FIELDS`:
```typescript
const STEP_FIELDS: Record<number, (keyof CreateRequestFormData)[]> = {
  1: ['serviceType'],
  2: ['fromGovernorate', 'fromAddress', 'toGovernorate', 'toAddress'],
  3: ['cargoDescription'],
  4: ['timingType'], // ✅ إضافة timingType
  5: [],
};
```

**الملف:** `apps/web/src/features/transport/components/Step4Timing.tsx`

أضف validation على `scheduledAt`:
```typescript
// في الـ schema أو validation:
const schema = z.object({
  timingType: z.enum(['asap', 'scheduled']),
  scheduledAt: z.string().optional(),
}).refine((data) => {
  if (data.timingType === 'scheduled') {
    return !!data.scheduledAt && data.scheduledAt.length > 0;
  }
  return true;
}, {
  message: 'يرجى تحديد الموعد',
  path: ['scheduledAt'],
});
```

في الـ JSX، أضف رسالة الخطأ:
```tsx
{errors.scheduledAt && (
  <p className="text-xs text-[var(--color-error)] mt-1">
    {errors.scheduledAt.message}
  </p>
)}
```

**التحقق:**
- [ ] اختيار "موعد محدد" بدون تاريخ → الـ Next button معطّل أو تظهر رسالة خطأ
- [ ] اختيار "موعد محدد" مع تاريخ → يمشي للخطوة التالية
- [ ] اختيار "في أقرب وقت" → يمشي مباشرة

---

## S2-T4 — منع Double Submit (A8)

**الملف:** `apps/web/src/features/transport/components/CreateRequestWizard.tsx`

```typescript
// أضف ref في أعلى الـ component:
const submittedRef = useRef(false);

// عدّل onSubmit:
async function onSubmit(data: CreateRequestFormData) {
  if (submittedRef.current) return; // ✅ منع التكرار
  submittedRef.current = true;
  setIsSubmitting(true);
  try {
    // ... existing code
    await transportApi.createRequest(dto);
    toast.success('تم إرسال طلبك بنجاح!');
    router.push('/transport/my-requests');
  } catch (err) {
    submittedRef.current = false; // ✅ السماح بإعادة المحاولة
    toast.error('حدث خطأ. يرجى المحاولة مرة أخرى.');
  } finally {
    setIsSubmitting(false);
  }
}
```

**التحقق:**
- [ ] ضغط "إرسال" مرتين بسرعة → طلب واحد فقط يُنشأ

---

## S2-T5 — AuthGuard على my-quotes (B3)

**الملف:** `apps/web/src/app/[locale]/transport/my-quotes/page.tsx`

```typescript
export default function MyQuotesPage() {
  return (
    <AuthGuard> {/* ✅ إضافة */}
      <MyQuotesContent />
    </AuthGuard>
  );
}
```

**التحقق:**
- [ ] فتح `/transport/my-quotes` بدون تسجيل دخول → redirect لصفحة Login

---

## S2-T6 — Null Check على `booking.carrier` (B5)

**الملف:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`

ابحث عن كل استخدام لـ `booking.carrier.` بدون `?.`:
```typescript
// قبل:
{booking.carrier.averageRating.toFixed(1)}

// بعد:
{booking.carrier?.averageRating != null && (
  <span>{booking.carrier.averageRating.toFixed(1)}</span>
)}
```

**التحقق:**
- [ ] `npx tsc --noEmit` → صفر أخطاء
- [ ] حجز بدون carrier info → لا crash

---

## S2-T7 — توجيه ناقل بدون Profile (B8)

**الملف:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`

أضف check للـ carrier profile:
```typescript
// في أعلى الـ component (مع باقي الـ hooks):
const { data: carrierProfile, isLoading: checkingCarrier } = useMyCarrierProfile(
  isAuthenticated && isCarrier
);

// عدّل canSubmitQuote:
const canSubmitQuote =
  !isOwner &&
  isCarrier &&
  !!carrierProfile && // ✅ إضافة
  request.status === 'OPEN' &&
  !hasAlreadyQuoted &&
  !quoteSent;

// في JSX — إذا ناقل بدون profile:
{isCarrier && !checkingCarrier && !carrierProfile && (
  <div className="card-base p-4 text-center flex flex-col gap-3">
    <p className="text-sm text-[var(--color-on-surface-muted)]">
      يجب إنشاء ملف ناقل أولاً لتقديم عروض على الطلبات
    </p>
    <Link href="/transport/carriers/register" className="btn-primary w-full justify-center">
      سجّل كناقل الآن
    </Link>
  </div>
)}
```

**التحقق:**
- [ ] مستخدم بـ CARRIER role بدون profile → يشوف بانر "سجّل كناقل" مش نموذج العرض
- [ ] مستخدم بـ CARRIER role مع profile → يشوف نموذج العرض

---

## S2-T8 — إصلاح Carrier Register freeze على 409 (C6)

**الملف:** `apps/web/src/app/[locale]/transport/carriers/register/page.tsx`

```typescript
// قبل:
} finally {
  if (!isConflict) setSubmitting(false);
}

// بعد:
} finally {
  setSubmitting(false); // ✅ دايماً نفعّل الزرار
}
```

**التحقق:**
- [ ] تسجيل ناقل موجود أصلاً (409) → الزرار يُفعَّل بعد 2 ثانية من الـ redirect

---

## ✅ نهاية Sprint 2 — اختبار شامل

```bash
cd apps/api && npm run build
cd apps/web && npm run build
```

**سيناريوهات الاختبار:**
```
1. ضغط "إرسال" مرتين → طلب واحد فقط
2. اختيار "موعد محدد" → حقل التاريخ إلزامي
3. ناقل بدون profile → يشوف بانر التسجيل مش نموذج
4. تغيير availability → لا crash، response يحمل user
5. فتح my-quotes بدون دخول → redirect للـ login
6. فتح booking بدون carrier → لا crash
```

**commit:** `fix(transport): Sprint 2 - data integrity, validation, auth guards`

---

# Sprint 3 — UX Improvements
**الهدف:** تحسين تجربة المستخدم وإصلاح الـ UX bugs
**أخطاء:** C1-C18 (ما عدا C6 المُصلح في Sprint 2)

---

## S3-T1 — Wizard Validation Toast (C1)

**الملف:** `apps/web/src/features/transport/components/CreateRequestWizard.tsx`

```typescript
async function handleNext() {
  const fields = STEP_FIELDS[currentStep];
  const valid = await methods.trigger(fields);
  if (valid) {
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  } else {
    // ✅ إضافة: أظهر رسالة واضحة
    toast.error('يرجى إكمال جميع الحقول المطلوبة قبل المتابعة');
  }
}
```

**التحقق:**
- [ ] الضغط على "التالي" بحقول فارغة → toast error يظهر
- [ ] الحقول نفسها تتلوّن باللون الأحمر (React Hook Form يتولى ذلك تلقائياً)

---

## S3-T2 — إصلاح Race Condition في my-quotes (C2)

**الملف:** `apps/web/src/app/[locale]/transport/my-quotes/page.tsx`

```typescript
// أضف ref في أعلى الـ component:
const pendingWithdrawals = useRef<Set<string>>(new Set());

const handleWithdraw = async (quoteId: string) => {
  pendingWithdrawals.current.add(quoteId);
  setWithdrawing(quoteId);
  try {
    await transportApi.withdrawQuote(quoteId);
    setQuotes(prev =>
      prev.map(q => q.id === quoteId ? { ...q, status: 'WITHDRAWN' as QuoteStatus } : q)
    );
  } catch {
    setWithdrawError('تعذّر سحب العرض، حاول مجدداً');
  } finally {
    pendingWithdrawals.current.delete(quoteId);
    setWithdrawing(null);
  }
};

// في load() — حفاظ على الـ withdrawn state:
const newQuotes = res.items.map(q =>
  pendingWithdrawals.current.has(q.id) ? { ...q, status: 'WITHDRAWN' as QuoteStatus } : q
);
setQuotes(newQuotes);
```

**التحقق:**
- [ ] سحب عرض → تبديل tab فوراً → العرض يبقى WITHDRAWN

---

## S3-T3 — Error Toast إغلاق تلقائي (C3)

**الملف:** `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`

```typescript
// أضف useEffect:
useEffect(() => {
  if (!toggleError) return;
  const timer = setTimeout(() => setToggleError(null), 5000);
  return () => clearTimeout(timer);
}, [toggleError]);

// في JSX أضف زرار إغلاق:
{toggleError && (
  <div className="fixed bottom-20 inset-x-4 ... flex items-center justify-between gap-3">
    <span>{toggleError}</span>
    <button
      onClick={() => setToggleError(null)}
      className="text-white/80 hover:text-white text-lg leading-none"
    >
      ✕
    </button>
  </div>
)}
```

**التحقق:**
- [ ] Error toast يختفي بعد 5 ثواني تلقائياً
- [ ] زرار X يغلقه فوراً

---

## S3-T4 — Loading State في Retry Buttons (C4)

**الملفات:** `my-quotes/page.tsx` + `my-requests/page.tsx`

```typescript
// تأكد أن load() يضبط setLoading(true) أول ما بتُنادى:
const load = async (tab: TabStatus) => {
  setLoading(true); // ✅ هذا لازم يكون أول سطر
  setError('');
  try { ... }
};

// في TransportPageError component:
// onRetry={() => load(activeTab)} ✅ مش window.location.reload()
```

**التحقق (C11 أيضاً):**
- [ ] ضغط Retry → spinner يظهر مباشرة → بيانات تظهر
- [ ] الـ tab المحدود لا يتغير عند الـ retry

---

## S3-T5 — Carrier Spinner نص توضيحي (C7)

**الملف:** `apps/web/src/app/[locale]/transport/carriers/register/page.tsx`

```typescript
// قبل:
if (checkingProfile) {
  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-[var(--color-brand-navy)]" />
    </div>
  );
}

// بعد:
if (checkingProfile) {
  return (
    <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 size={28} className="animate-spin text-[var(--color-brand-navy)]" />
      <p className="text-sm text-[var(--color-on-surface-muted)]">جارٍ التحقق من ملفك...</p>
    </div>
  );
}
```

---

## S3-T6 — Scroll to Top عند Pagination (C9)

**الملف:** `apps/web/src/features/transport/components/RequestsGrid.tsx`

```typescript
// في onPageChange handler:
const handlePageChange = (page: number) => {
  onPageChange(page);
  window.scrollTo({ top: 0, behavior: 'smooth' }); // ✅
};
```

---

## S3-T7 — Text Truncation للأسماء الطويلة (C10)

**الملف:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`

ابحث عن عرض اسم الناقل/الشركة وأضف `truncate`:
```tsx
<p className="text-base font-bold text-[var(--color-on-surface)] truncate"> {/* ✅ */}
  {booking.carrier?.companyName ?? booking.carrier?.user?.displayName}
</p>
```

---

## S3-T8 — حقل السعر تلوين عند الخطأ (C12)

**الملف:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`

```typescript
// أضف state للـ price error:
const [priceError, setPriceError] = useState('');

// في validation:
if (!price || Number(price) <= 0) {
  setPriceError('يرجى إدخال سعر صحيح');
  return;
}
setPriceError('');

// في JSX:
<input
  className={`w-full px-3 py-2.5 rounded-xl border ... ${
    priceError ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]' : 'border-[var(--color-outline-variant)]'
  }`}
/>
{priceError && (
  <p className="text-xs text-[var(--color-error)] mt-1">{priceError}</p>
)}
```

---

## S3-T9 — حقل الساعات validation (C13) + Whitespace (C14)

**الملف:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`

```typescript
// في handleSubmit:
const hours = estimatedHours ? Number(estimatedHours) : undefined;
if (hours !== undefined && (hours <= 0 || !Number.isFinite(hours))) {
  setError('عدد الساعات يجب أن يكون رقماً موجباً');
  return;
}

// للـ message:
message: message.trim() || undefined, // هذا موجود أصلاً ✅
// لكن أضف validation:
if (message && !message.trim()) {
  // مسح الـ whitespace-only
  setMessage('');
}
```

---

## S3-T10 — UUID مختصر في Carrier Dashboard (C17)

**الملف:** `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`

```typescript
// قبل:
<p className="text-xs font-mono">#{q.requestId}</p>

// بعد (عرض أول 8 أحرف فقط):
<p className="text-xs font-mono">#{q.requestId.slice(0, 8)}...</p>
```

---

## S3-T11 — تأكيد الخريطة في Step5Review (C18 + F9)

**الملف:** `apps/web/src/features/transport/components/Step5Review.tsx`

```typescript
// في قسم عرض المسار أضف:
{(data.fromLat && data.fromLng) && (
  <span className="inline-flex items-center gap-1 text-xs text-[var(--color-success)]">
    <MapPin size={10} />
    تم تحديد الموقع على الخريطة
  </span>
)}
```

---

## ✅ نهاية Sprint 3 — اختبار شامل

```bash
cd apps/web && npm run build
```

**سيناريوهات:**
```
1. Wizard → "التالي" بحقول فارغة → toast + تلوين أحمر
2. my-quotes → سحب عرض + تبديل tab سريع → لا race condition
3. Error toast → يختفي بعد 5s أو بالضغط على X
4. Pagination → يذهب للأعلى
5. اسم شركة طويل → truncated بـ "..."
6. السعر خاطئ → حقل يتلوّن أحمر
7. carrier register → spinner مع نص
```

**commit:** `fix(transport): Sprint 3 - UX improvements, validation, race conditions`

---

# Sprint 4 — Browse & Filter
**الهدف:** إصلاح الفلاتر وحالات الـ Browse
**أخطاء:** F1-F10

---

## S4-T1 — حفظ الفلاتر في URL (F1 + F3 + F5 + F10)

**الملف:** `apps/web/src/features/transport/components/BrowseContent.tsx`

```typescript
import { useRouter, usePathname } from '@/i18n/navigation';

// عدّل handleFilterChange:
const handleFilterChange = useCallback((newFilters: BrowseFilters) => {
  setFilters(newFilters);
  setCurrentPage(1);

  // ✅ تحديث URL
  const params = new URLSearchParams();
  if (newFilters.serviceType) params.set('serviceType', newFilters.serviceType);
  if (newFilters.status) params.set('status', newFilters.status);
  if (newFilters.fromGovernorate) params.set('fromGovernorate', newFilters.fromGovernorate);
  if (newFilters.fromWilayat) params.set('fromWilayat', newFilters.fromWilayat);
  if (newFilters.toGovernorate) params.set('toGovernorate', newFilters.toGovernorate);
  if (newFilters.toWilayat) params.set('toWilayat', newFilters.toWilayat);
  if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);

  const query = params.toString();
  router.replace(query ? `?${query}` : pathname, { scroll: false });
}, [router, pathname]);

// عدّل handlePageChange:
const handlePageChange = useCallback((page: number) => {
  setCurrentPage(page);
  // أبقِ الفلاتر في URL عند تغيير الصفحة
  const params = new URLSearchParams(searchParams.toString());
  params.set('page', String(page));
  router.replace(`?${params.toString()}`, { scroll: false });
}, [router, searchParams]);
```

**التحقق:**
- [ ] فلتر بنوع خدمة → URL يتحدث → refresh → الفلتر لا يزال مطبّق
- [ ] صفحة 2 → URL يحتوي `?page=2&serviceType=...`

---

## S4-T2 — Wilayat في API (F2 + F4)

**الملف:** `apps/web/src/features/transport/types.ts`

```typescript
export interface GetRequestsParams {
  page?: number;
  limit?: number;
  serviceType?: TransportServiceType;
  status?: TransportRequestStatus;
  fromGovernorate?: string;
  fromWilayat?: string; // ✅ إضافة
  toGovernorate?: string;
  toWilayat?: string;   // ✅ إضافة
  sortBy?: 'createdAt' | 'budgetMax' | 'scheduledAt';
  sortOrder?: 'asc' | 'desc';
}
```

**الملف:** `apps/web/src/features/transport/components/BrowseContent.tsx`

```typescript
const requestParams: GetRequestsParams = {
  page: currentPage,
  limit: 12,
  ...(filters.serviceType && { serviceType: filters.serviceType as TransportServiceType }),
  ...(filters.status && { status: filters.status as TransportRequestStatus }),
  ...(filters.fromGovernorate && { fromGovernorate: filters.fromGovernorate }),
  ...(filters.fromWilayat && { fromWilayat: filters.fromWilayat }), // ✅
  ...(filters.toGovernorate && { toGovernorate: filters.toGovernorate }),
  ...(filters.toWilayat && { toWilayat: filters.toWilayat }), // ✅
  ...parseSortBy(filters.sortBy),
};
```

**Backend:** تأكد أن `transport-request.service.ts` → `findAll()` يدعم `fromWilayat/toWilayat` في الـ where clause.

---

## S4-T3 — Cargo Description Fallback (F6)

**الملف:** `apps/web/src/features/transport/components/TransportRequestCard.tsx`

```typescript
// قبل:
<p>{request.cargoDescription}</p>

// بعد:
<p>{request.cargoDescription || 'لم يتم تحديد وصف للبضاعة'}</p>
```

---

## S4-T4 — RouteMapView تحسين الـ delay (F7)

**الملف:** `apps/web/src/features/transport/components/RouteMapView.tsx`

```typescript
// قبل: انتظار 1.1s دايماً
await new Promise(r => setTimeout(r, 1100));

// بعد: انتظار فقط لو طلبنا geocoding للعنوان الأول
let waitNeeded = false;
if (!fromCoords) {
  setGeocoding(true);
  fromCoords = await nominatim(q);
  waitNeeded = true;
}
if (waitNeeded) {
  await new Promise(r => setTimeout(r, 1100)); // ✅ فقط لو احتجنا
}
```

---

## ✅ نهاية Sprint 4 — اختبار شامل

```bash
cd apps/web && npm run build
```

**سيناريوهات:**
```
1. Browse → فلتر بـ "نقل عام" → refresh → الفلتر محفوظ في URL
2. Browse → صفحة 2 → الفلاتر محفوظة
3. Browse → فلتر بمحافظة → نتائج صح
4. Request card فارغ الوصف → نص fallback يظهر
5. خريطة تفتح → delay أقل لو الإحداثيات موجودة
```

**commit:** `fix(transport): Sprint 4 - browse filters URL persistence, wilayat API`

---

# Sprint 5 — i18n & Translations
**الهدف:** إزالة كل النصوص الـ hardcoded
**أخطاء:** D1-D20

---

## S5-T1 — Status Labels (D2, D3, D4)

**الملف:** `apps/web/src/messages/ar.json`

أضف في قسم `transport`:
```json
"transport": {
  "requestStatus": {
    "OPEN": "مفتوح",
    "QUOTED": "وصلت عروض",
    "ACCEPTED": "مقبول",
    "IN_PROGRESS": "جارٍ التنفيذ",
    "COMPLETED": "مكتمل",
    "CANCELLED": "ملغى",
    "EXPIRED": "منتهي الصلاحية"
  },
  "quoteStatus": {
    "PENDING": "بانتظار الرد",
    "ACCEPTED": "مقبول",
    "REJECTED": "مرفوض",
    "WITHDRAWN": "مسحوب"
  },
  "bookingStatus": {
    "ACCEPTED": "تم القبول",
    "IN_PROGRESS": "جارٍ التنفيذ",
    "COMPLETED": "مكتمل",
    "CANCELLED": "ملغى"
  }
}
```

**الملف:** `apps/web/src/messages/en.json`

```json
"transport": {
  "requestStatus": {
    "OPEN": "Open",
    "QUOTED": "Quoted",
    "ACCEPTED": "Accepted",
    "IN_PROGRESS": "In Progress",
    "COMPLETED": "Completed",
    "CANCELLED": "Cancelled",
    "EXPIRED": "Expired"
  }
}
```

**الملف:** `apps/web/src/features/transport/constants.ts`

```typescript
// احذف الـ objects الـ hardcoded وأضف helper functions:
export const getRequestStatusLabel = (status: string, t: (key: string) => string) =>
  t(`transport.requestStatus.${status}`) || status;

export const getQuoteStatusLabel = (status: string, t: (key: string) => string) =>
  t(`transport.quoteStatus.${status}`) || status;
```

---

## S5-T2 — Hero + Browse + CTA Components (D1, D6-D9)

**الملف:** `apps/web/src/features/transport/components/HeroSection.tsx`

```typescript
const t = useTranslations('transport');

// استبدل كل النصوص الـ hardcoded بـ t('key')
// مثال:
<h1>{t('hero.title')}</h1>
<p>{t('hero.subtitle')}</p>
```

أضف المفاتيح المقابلة في `ar.json` و `en.json`.

**الملف:** `apps/web/src/features/transport/components/ServiceTypesGrid.tsx`

```typescript
const t = useTranslations('transport');
<h2>{t('serviceTypes.title')}</h2>
```

---

## S5-T3 — Wizard Steps النصوص (D10-D13)

لكل ملف من `Step1-Step4`:
- استخرج جميع النصوص الـ hardcoded
- أضف مفاتيح في `ar.json` و `en.json`
- استخدم `useTranslations('transport')`

**الشرط:** لا تغيّر منطق الـ validation أو الـ layout — فقط النصوص.

---

## S5-T4 — Date Format ديناميكي (D6)

**جميع الملفات** التي تستخدم `'ar-OM-u-nu-latn'`:

```typescript
// بدل:
new Date(date).toLocaleDateString('ar-OM-u-nu-latn', {...})

// استخدم:
const locale = useLocale(); // من next-intl
new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US', {...})
```

---

## S5-T5 — Fallback Strings (D7, D5)

```typescript
// بدل:
{quote.carrier?.companyName ?? quote.carrier?.user?.displayName ?? 'ناقل'}

// استخدم:
const t = useTranslations('transport');
{quote.carrier?.companyName ?? quote.carrier?.user?.displayName ?? t('carrier.unknown')}
```

---

## ✅ نهاية Sprint 5 — اختبار شامل

```bash
cd apps/web && npm run build
```

**سيناريوهات:**
```
1. تبديل اللغة للإنجليزية → كل النصوص تتترجم
2. Status OPEN يظهر "Open" بالإنجليزية
3. التواريخ تُعرض بالصيغة المناسبة للغة
4. مفيش نص Arabic يظهر في الـ English mode
```

**commit:** `fix(transport): Sprint 5 - i18n, remove hardcoded Arabic strings`

---

# اختبار نهائي شامل بعد كل Sprints

```bash
# Build كامل للمشروع:
cd apps/api && npm run build && echo "API ✅"
cd apps/web && npm run build && echo "WEB ✅"
npx tsc --noEmit && echo "Types ✅"
```

## Checklist يدوي كامل

### Shipper Flow:
- [ ] يفتح `/transport/new` → يملأ 5 خطوات → يضغط إرسال → طلب واحد فقط يُنشأ
- [ ] اختيار "موعد محدد" بدون تاريخ → رسالة خطأ واضحة
- [ ] يذهب لـ my-requests → يشوف طلبه
- [ ] يفتح تفاصيل الطلب → يشوف العروض
- [ ] يقبل عرض → redirect لـ `/transport/bookings/:id`
- [ ] صفحة الحجز تُحمَّل مباشرة (بدون جلب كل الحجوزات)
- [ ] يضغط "استلمت — اكتمل" → ينجح عند IN_PROGRESS فقط
- [ ] يذهب لـ my-bookings → يشوف الحجز كشاحن

### Carrier Flow:
- [ ] يسجّل كناقل → يُحوَّل للـ dashboard
- [ ] يفتح browse → يفلتر → الفلاتر محفوظة في URL
- [ ] يفتح request → يشوف نموذج تقديم عرض (لو عنده profile)
- [ ] بدون profile → يشوف بانر "سجّل كناقل"
- [ ] يقدم عرض → يذهب لـ my-quotes → يشوف عرضه
- [ ] بعد قبول العرض → يضغط "عرض الحجز" → يذهب لـ my-bookings
- [ ] يفتح الحجز → يضغط "بدأت التحميل" → ينجح (status ACCEPTED → IN_PROGRESS)
- [ ] يغيّر availability → لا crash

### Navigation:
- [ ] كل الروابط تحتوي على locale (/ar/...)
- [ ] فلاتر Browse تُحفظ في URL
- [ ] Pagination تحتفظ بالفلاتر
- [ ] Refresh يحافظ على الفلاتر والـ tab المحدد

---

## ترتيب الـ Sprints

```
Sprint 1 (Critical)  → يجب يكتمل قبل أي sprint آخر
    ↓
Sprint 2 (Data)      → يجب قبل Sprint 3
    ↓
Sprint 3 (UX)  ←→   Sprint 4 (Browse)   ← يمكن تنفيذهم بالتوازي
    ↓
Sprint 5 (i18n)      → آخر sprint
```