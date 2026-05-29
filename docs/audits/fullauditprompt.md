# مراجعة شاملة لكل أخطاء قسم النقل — 94 خطأ
# الريبو: souqone/souqOneOm | Branch: claude/design-review-discussion-ZjmGq

## التعليمات

اقرأ كل ملف مذكور وأبلغ عن حالة كل خطأ:
- ✅ **مصلح** — الكود الصحيح موجود
- ❌ **لسه موجود** — الكود القديم لا يزال موجوداً

في النهاية اعمل جدول بجميع الأخطاء ثم قائمة بكل ما لازم يتصلح.

---

## فئة A — Backend & Schema (8 أخطاء)

### A1 + A2
**اقرأ:** `apps/api/prisma/schema.prisma`
ابحث عن `model TransportBooking`:
- A1: نوع حقل `status` — هل `BookingStatus` ✅ أم `TransportRequestStatus` ❌؟
- A2: القيمة الافتراضية — هل `@default(ACCEPTED)` ✅ أم `@default(IN_PROGRESS)` أو `@default(PENDING)` ❌؟

### A3
**اقرأ:** `apps/api/src/transport/transport.controller.ts`
- هل `@Get('bookings/:id')` موجود؟ ✅
- هل هو مكتوب قبل `@Get('bookings/my')` في الملف؟ ✅ (ضروري وإلا `my` تُفسَّر كـ `:id`)

### A4
**اقرأ:** `apps/api/src/transport/carrier-profile.service.ts`
في دالة `setAvailability` — هل الـ prisma update يحتوي `include: { user: true }` أو `include: { user: { select: ... } }`؟

### A5
**اقرأ:** `apps/api/src/transport/transport-request.service.ts`
في دالة `myRequests` أو `findMyRequests` — هل الـ include يحتوي `user`؟

### A6
**اقرأ:** `apps/web/src/features/transport/types.ts`
ابحث عن `TransportBooking` interface/type:
- هل العلاقات `request`, `quote` معرّفة كـ required (بدون `?`) ✅ أم optional (`?`) ❌؟

### A7
**اقرأ:** `apps/web/src/features/transport/components/CreateRequestWizard.tsx`
في دالة `onSubmit` أو عند تجميع الـ DTO:
- هل `scheduledAt` يُرسَل فقط عند `timingType === 'scheduled'`؟
- أم يُرسَل دايماً حتى لو فارغ؟

### A8
**اقرأ:** `apps/web/src/features/transport/components/CreateRequestWizard.tsx`
في دالة `onSubmit`:
- هل يوجد `submittedRef` أو `isSubmittingRef` أو أي guard يمنع double submit؟ ✅
- أم لا يوجد أي guard؟ ❌

---

## فئة B — Navigation & Logic (11 خطأ)

### B1
**اقرأ:** `apps/web/src/app/[locale]/transport/my-quotes/page.tsx`
ابحث عن "عرض الحجز":
- الرابط يذهب لـ `/transport/my-requests` ❌
- أم `/transport/my-bookings` أو `/transport/bookings/:id` ✅

### B2
**اقرأ:** `apps/web/src/components/layout/SubNavBar.tsx`
- هل يوجد رابط `my-bookings` أو "حجوزاتي" في قسم الناقل؟ ✅ / ❌

### B3
**اقرأ:** `apps/web/src/app/[locale]/transport/my-quotes/page.tsx`
- هل يوجد `<AuthGuard>` حول محتوى الصفحة؟ ✅ / ❌

### B4
**اقرأ:** `apps/web/src/features/transport/components/CreateRequestWizard.tsx`
ابحث عن `STEP_FIELDS`:
- هل `timingType` أو `scheduledAt` مذكور في `STEP_FIELDS[4]`؟ ✅
- أم المصفوفة فارغة لـ Step 4؟ ❌

### B5
**اقرأ:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`
ابحث عن أي استخدام لـ `booking.carrier.` (بدون `?.`):
- هل كل الوصول يستخدم optional chaining `?.`؟ ✅
- أم يوجد وصول مباشر بدون `?.` يمكن أن يسبب crash؟ ❌

### B6
**اقرأ:** `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`
في أعلى الـ component — هل يوجد early return أو loading state قبل التحقق من الـ carrier profile لمنع flash of content؟

### B7
**شغّل:** `find apps/web/src/app -name "page.tsx" -path "*/jobs/*"` أو ابحث عن مسار `apps/web/src/app/[locale]/jobs/my/page.tsx`
- هل الملف موجود؟ ❌ (يجب أن يكون محذوف)

### B8
**اقرأ:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`
ابحث عن `canSubmitQuote`:
- هل يوجد شرط `!!carrierProfile` أو `!!myCarrierId`؟ ✅
- أم الناقل بدون profile يشوف نموذج العرض؟ ❌

هل يوجد بانر "سجّل كناقل" للناقل بدون profile؟ ✅ / ❌

### B9 + B11
**اقرأ:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`
ابحث عن `const isCarrier`:
- هل تساوي `user?.role === 'CARRIER'` ❌
- أم `booking?.quote?.carrier?.userId === user?.id` ✅

ابحث عن `const isShipper`:
- هل تساوي `!isCarrier` ❌
- أم `booking?.request?.userId === user?.id` ✅

### B10
**اقرأ:** `apps/web/src/app/[locale]/transport/my-bookings/page.tsx`
- هل الصفحة تدعم `role='carrier'` أم فقط `role='shipper'` hardcoded؟

---

## فئة C — UX Bugs (18 خطأ)

### C1
**اقرأ:** `apps/web/src/features/transport/components/CreateRequestWizard.tsx`
في دالة `handleNext()`:
- هل يوجد `toast.error(...)` عند فشل الـ validation؟ ✅ / ❌

### C2
**اقرأ:** `apps/web/src/app/[locale]/transport/my-quotes/page.tsx`
هل يوجد `pendingWithdrawals` ref أو أي آلية لحماية state الـ WITHDRAWN عند تبديل الـ tabs أثناء سحب عرض؟

### C3
**اقرأ:** `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`
- هل يوجد `setTimeout` يُخفي error toast تلقائياً بعد ثواني؟ ✅
- هل يوجد زرار X لإغلاق الـ toast يدوياً؟ ✅

### C4
**اقرأ:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`
في الـ retry handler أو `TransportPageError`:
- هل `load()` يضبط `setLoading(true)` في أول سطر؟ ✅

### C5
**اقرأ:** `apps/web/src/features/transport/components/BrowseContent.tsx`
- هل يوجد badge يعرض عدد الفلاتر النشطة على زرار الفلتر في mobile؟

### C6
**اقرأ:** `apps/web/src/app/[locale]/transport/carriers/register/page.tsx`
في الـ `finally` block:
- هل `setSubmitting(false)` يُنفَّذ دائماً بدون شرط؟ ✅
- أم `if (!isConflict) setSubmitting(false)` ❌

### C7
**اقرأ:** `apps/web/src/app/[locale]/transport/carriers/register/page.tsx`
في loading state (`checkingProfile`):
- هل يوجد نص توضيحي مع الـ spinner مثل "جارٍ التحقق..." ✅
- أم spinner فقط بدون نص؟ ❌

### C8
**اقرأ:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`
ابحث عن عرض رسائل العروض (`message` في quote):
- هل الرسائل ظاهرة by default؟ ✅
- أم مخفية ويحتاج المستخدم يضغط لإظهارها؟ ❌

### C9
**اقرأ:** `apps/web/src/features/transport/components/RequestsGrid.tsx`
في `onPageChange` handler:
- هل يوجد `window.scrollTo({ top: 0 })` أو ما شابه؟ ✅

### C10
**اقرأ:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`
ابحث عن عرض اسم الناقل/الشركة:
- هل يوجد class `truncate` أو `overflow-hidden`؟ ✅

### C11
**اقرأ:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`
ابحث عن `onRetry`:
- هل يستخدم `window.location.reload()` ❌
- أم `load(activeTab)` أو ما شابه؟ ✅

### C12
**اقرأ:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`
في نموذج تقديم العرض، حقل السعر:
- هل يوجد تلوين أحمر `border-[var(--color-error)]` عند الخطأ؟ ✅
- أم لا يوجد visual feedback؟ ❌

### C13
**اقرأ:** نفس الملف — حقل الساعات:
- هل يوجد validation يمنع صفر أو سالب؟ ✅ / ❌

### C14
**اقرأ:** نفس الملف — حقل الرسالة:
- هل يوجد `.trim()` أو validation يمنع whitespace-only؟ ✅ / ❌

### C15
**اقرأ:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx` و `my-quotes/page.tsx`
عند تبديل الـ tabs:
- هل يوجد skeleton loading بدل المحتوى القديم؟ ✅
- أم المحتوى القديم يظل ظاهراً أثناء التحميل؟ ❌

### C16
**اقرأ:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`
عند إلغاء الحجز:
- هل يوجد confirmation dialog/modal قبل الإلغاء؟ ✅
- أم الإلغاء فوري بدون تأكيد؟ ❌

### C17
**اقرأ:** `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`
ابحث عن عرض `requestId`:
- هل يستخدم `.slice(0, 8)` أو ما شابه لتقصير الـ UUID؟ ✅
- أم يعرض الـ UUID كاملاً؟ ❌

### C18
**اقرأ:** `apps/web/src/features/transport/components/Step5Review.tsx`
- هل يوجد تأكيد بصري (أيقونة أو نص) يدل على تحديد الموقع على الخريطة؟ ✅

---

## فئة E — Locale Links (10 أخطاء)

### قاعدة E1-E10
كل الملفات التالية يجب أن تستورد:
```typescript
import { Link } from '@/i18n/navigation'; // ✅
// وليس:
import Link from 'next/link'; // ❌
```

**اقرأ كل ملف وأبلغ عن الـ import:**

### E1
`apps/web/src/features/transport/components/TransportRequestCard.tsx`
- Import من `@/i18n/navigation`؟ ✅ / ❌

### E2
`apps/web/src/features/transport/components/HeroSection.tsx`
- Import من `@/i18n/navigation`؟ ✅ / ❌

### E3
`apps/web/src/features/transport/components/CarrierCTA.tsx`
- Import من `@/i18n/navigation`؟ ✅ / ❌

### E4
`apps/web/src/features/transport/components/ServiceTypesGrid.tsx`
- Import من `@/i18n/navigation`؟ ✅ / ❌

### E5
`apps/web/src/features/transport/components/LatestRequests.tsx`
- Import من `@/i18n/navigation`؟ ✅ / ❌

### E6
`apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`
- Import من `@/i18n/navigation`؟ ✅ / ❌
- رابط "العودة للتصفح" يستخدم `<Link>` من `@/i18n/navigation`؟ ✅ / ❌

### E7
`apps/web/src/features/transport/components/ServiceTypesGrid.tsx`
- روابط الفلاتر (category links) تستخدم `<Link>` من `@/i18n/navigation`؟ ✅ / ❌

### E8
`apps/web/src/app/[locale]/transport/carriers/register/page.tsx`
- Import من `@/i18n/navigation`؟ ✅ / ❌

### E9
`apps/web/src/app/[locale]/transport/my-quotes/page.tsx`
- Import من `@/i18n/navigation`؟ ✅ / ❌

### E10
`apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`
- Import من `@/i18n/navigation`؟ ✅ / ❌

---

## فئة F — Filter & Browse (10 أخطاء)

### F1
**اقرأ:** `apps/web/src/features/transport/components/BrowseContent.tsx`
في `handleFilterChange`:
- هل يستخدم `router.replace(...)` لتحديث الـ URL؟ ✅ / ❌

### F2
**اقرأ:** نفس الملف — الـ request params المُرسَلة للـ API:
- هل `fromWilayat` يُمرَّر؟ ✅ / ❌

### F3
**اقرأ:** نفس الملف — في `handlePageChange`:
- هل يحتفظ بالفلاتر الموجودة في الـ URL عند تغيير الصفحة؟ ✅ / ❌

### F4
**اقرأ:** نفس الملف:
- هل `toWilayat` يُمرَّر في الـ request params؟ ✅ / ❌

### F5
**اقرأ:** `apps/web/src/features/transport/components/BrowseContent.tsx` أو `FilterPanel.tsx`
- هل يوجد زرار "مسح كل الفلاتر" يُعيد ضبط الـ URL أيضاً؟ ✅ / ❌

### F6
**اقرأ:** `apps/web/src/features/transport/components/TransportRequestCard.tsx`
- هل `cargoDescription` له fallback نص عند كونه فارغاً؟ مثل `|| 'لم يتم تحديد وصف'` ✅ / ❌

### F7
**اقرأ:** `apps/web/src/features/transport/components/RouteMapView.tsx`
- هل الـ `setTimeout(1100)` مشروط (فقط عند الحاجة للـ geocoding)؟ ✅
- أم يُنفَّذ دايماً؟ ❌

### F8
**اقرأ:** `apps/web/src/features/transport/components/CreateRequestWizard.tsx`
في `STEP_FIELDS`:
- هل `scheduledAt` أو `timingType` مذكور في الـ validation fields للـ Step 4؟ ✅ / ❌

### F9
**اقرأ:** `apps/web/src/features/transport/components/Step5Review.tsx`
- هل يوجد تأكيد بصري لتحديد الموقع على الخريطة؟ ✅ / ❌

### F10
**اقرأ:** `apps/web/src/features/transport/components/BrowseContent.tsx`
- هل `sortBy` يُحفظ في الـ URL params؟ ✅ / ❌

---

## فئة N — Security & Logic Bugs (17 خطأ)

### N1
**اقرأ:** `apps/web/src/features/transport/components/TransportRequestCard.tsx`
- هل يوجد prop `currentUserId`؟ ✅ / ❌
- هل زرار "تعديل" يظهر فقط عند `currentUserId === request.userId`؟ ✅ / ❌
- هل الـ canEdit يتحقق من الـ status أيضاً (`OPEN` أو `QUOTED` فقط)؟ ✅ / ❌

### N2
**اقرأ:** `apps/web/src/app/[locale]/transport/requests/[id]/edit/page.tsx`
- هل يوجد ownership check يعمل redirect إذا `request.userId !== user.id`؟ ✅ / ❌
- هل يوجد `AuthGuard`؟ ✅ / ❌

### N3
**اقرأ:** `apps/api/src/transport/transport-request.service.ts`
في دالة `update`:
- هل يوجد `if (request.userId !== userId) throw new ForbiddenException(...)`؟ ✅ / ❌

**اقرأ أيضاً:** `apps/api/src/transport/transport.controller.ts`
- هل `@Patch('requests/:id')` محمي بـ `@UseGuards(JwtAuthGuard)`؟ ✅ / ❌

### N4
**اقرأ:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`
- هل يوجد استدعاء لـ `transportApi.getQuotes(id)` أو ما يعادله؟ ✅ / ❌
- هل هذا الاستدعاء يحدث فقط للمالك (`isOwner`)؟ ✅ / ❌

### N5
**اقرأ:** نفس الملف — ابحث عن `hasAlreadyQuoted`:
- هل يقارن `q.carrierId === user?.id` ❌ (user.id ≠ carrierId)
- أم `q.carrierId === myCarrierId` حيث `myCarrierId` = ID الـ carrier profile ✅

### N6
**اقرأ:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`
- `const isCarrier = user?.role === 'CARRIER'` ❌
- `const isCarrier = booking?.quote?.carrier?.userId === user?.id` ✅

### N7
**اقرأ:** `apps/api/src/transport/transport.controller.ts`
- هل `@Get('bookings/:id')` موجود وقبل `@Get('bookings/my')`؟ ✅ / ❌

### N8
**اقرأ:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`
- هل يوجد زرار "إلغاء الطلب" أو `cancelRequest` handler؟ ✅ / ❌
- هل يظهر فقط للمالك؟ ✅ / ❌
- هل يظهر فقط عند status `OPEN` أو `QUOTED`؟ ✅ / ❌

### N9
**اقرأ:** `apps/api/src/transport/transport-quote.service.ts`
في دالة `acceptQuote`:
- هل الـ status check والـ update يحدثان داخل `this.prisma.$transaction(...)`؟ ✅ / ❌

### N10
**اقرأ:** نفس الملف — دالة `withdrawQuote`:
- هل تستخدم `this.prisma.$transaction(...)`؟ ✅ / ❌

### N11
**اقرأ:** `apps/api/src/transport/dto/create-transport-request.dto.ts`
- هل يوجد validation يمنع `budgetMin > budgetMax`؟
  (ابحث عن `@Validate`, `refine`, custom decorator, أو `IsBudgetRangeValid`) ✅ / ❌

### N12
**اقرأ:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`
- ما الـ `limit` المستخدم في `transportApi.myRequests(page, limit, ...)`؟ (المطلوب 12 أو 10، وليس 50 أو 100)
- هل يوجد pagination UI؟ ✅ / ❌

### N13
**اقرأ:** `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`
- `Promise.all([...])` ❌ (إذا واحدة فشلت كلهم فشلوا)
- `Promise.allSettled([...])` ✅

### N14
**اقرأ:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`
- هل زرار "إلغاء الحجز" مغلف بشرط `isCarrier || isShipper`؟ ✅ / ❌

### N15
**اقرأ:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`
- `onRetry={() => window.location.reload()}` ❌
- `onRetry={() => load(activeTab)}` ✅

### N16
**اقرأ:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`
- هل `canSubmitQuote` يحتوي `!!carrierProfile` أو `!!myCarrierId`؟ ✅ / ❌
- هل يوجد بانر للناقل بدون profile؟ ✅ / ❌

### N17
**اقرأ:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`
- هل يوجد زرار إلغاء على كروت الطلبات (للطلبات OPEN/QUOTED)؟ ✅ / ❌

---

## فئة D — i18n & Hardcoded Strings (20 خطأ)

### D1
**اقرأ:** `apps/web/src/features/transport/components/HeroSection.tsx`
- هل النصوص تستخدم `useTranslations` أو `t('...')`؟ ✅
- أم نصوص عربية hardcoded مثل `"خدمة نقل البضائع"` ❌

### D2
**اقرأ:** `apps/web/src/features/transport/constants.ts`
- هل status labels (OPEN, QUOTED, etc.) موجودة كـ objects مع نصوص عربية hardcoded؟ ❌
- أم تستخدم helper functions مع `t(key)`؟ ✅

### D3
**اقرأ:** `apps/web/src/messages/ar.json`
- هل يوجد قسم `transport.requestStatus` يحتوي ترجمات الـ statuses؟ ✅ / ❌

### D4
**اقرأ:** `apps/web/src/messages/en.json`
- هل يوجد `transport.requestStatus` بالإنجليزية؟ ✅ / ❌

### D5
**اقرأ:** أي ملف يعرض اسم الناقل — ابحث عن `?? 'ناقل'`:
- هل `'ناقل'` hardcoded؟ ❌
- أم يستخدم `t('transport.carrier.unknown')`؟ ✅

### D6
**اقرأ:** الملفات التي تستخدم `toLocaleDateString`:
- هل locale التاريخ hardcoded كـ `'ar-OM-u-nu-latn'` دايماً؟ ❌
- أم يتغير بناءً على locale الصفحة؟ ✅

### D7
**اقرأ:** `apps/web/src/features/transport/components/CarrierCTA.tsx`
- هل النصوص hardcoded بالعربي؟ ❌
- أم تستخدم `useTranslations`؟ ✅

### D8
**اقرأ:** `apps/web/src/features/transport/components/ServiceTypesGrid.tsx`
- هل أسماء الخدمات (نقل عام، نقل أثاث، إلخ) hardcoded؟ ❌
- أم تستخدم `useTranslations`؟ ✅

### D9
**اقرأ:** `apps/web/src/features/transport/components/LatestRequests.tsx`
- هل النصوص hardcoded؟ ❌ أم `useTranslations`؟ ✅

### D10-D13
**اقرأ:** `apps/web/src/features/transport/components/Step1ServiceType.tsx`, `Step2Route.tsx`, `Step3Cargo.tsx`, `Step4Timing.tsx`
- هل النصوص في كل step hardcoded بالعربي؟ ❌
- أم تستخدم `useTranslations`؟ ✅

### D14
**اقرأ:** `apps/web/src/features/transport/components/TransportRequestCard.tsx`
- هل نصوص الكارت مثل "من:", "إلى:", "البضاعة:" hardcoded؟ ❌ أم `t()`؟ ✅

### D15-D16
**اقرأ:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`
- رسائل الخطأ مثل "حدث خطأ" hardcoded؟ ❌ أم `t()`؟ ✅

### D17-D20
**اقرأ:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`, `my-quotes/page.tsx`
- نصوص التبويبات (كل الطلبات، مفتوح، مقبول، إلخ) hardcoded؟ ❌ أم `t()`؟ ✅

---

## الإبلاغ النهائي

اعمل جدول بهذا الشكل لكل الـ 94 bug:

| Bug | الحالة | الملف | السطر | ملاحظة |
|-----|--------|-------|-------|--------|
| A1  | ✅/❌  | schema.prisma | X | ... |
| A2  | ✅/❌  | schema.prisma | X | ... |
| A3  | ✅/❌  | transport.controller.ts | X | ... |
| A4  | ✅/❌  | carrier-profile.service.ts | X | ... |
| A5  | ✅/❌  | transport-request.service.ts | X | ... |
| A6  | ✅/❌  | types.ts | X | ... |
| A7  | ✅/❌  | CreateRequestWizard.tsx | X | ... |
| A8  | ✅/❌  | CreateRequestWizard.tsx | X | ... |
| B1  | ✅/❌  | my-quotes/page.tsx | X | ... |
| B2  | ✅/❌  | SubNavBar.tsx | X | ... |
| B3  | ✅/❌  | my-quotes/page.tsx | X | ... |
| B4  | ✅/❌  | CreateRequestWizard.tsx | X | ... |
| B5  | ✅/❌  | bookings/[id]/page.tsx | X | ... |
| B6  | ✅/❌  | carriers/dashboard/page.tsx | X | ... |
| B7  | ✅/❌  | jobs/my/page.tsx | X | ... |
| B8  | ✅/❌  | requests/[id]/page.tsx | X | ... |
| B9  | ✅/❌  | bookings/[id]/page.tsx | X | ... |
| B10 | ✅/❌  | my-bookings/page.tsx | X | ... |
| B11 | ✅/❌  | bookings/[id]/page.tsx | X | ... |
| C1  | ✅/❌  | CreateRequestWizard.tsx | X | ... |
| C2  | ✅/❌  | my-quotes/page.tsx | X | ... |
| C3  | ✅/❌  | carriers/dashboard/page.tsx | X | ... |
| C4  | ✅/❌  | my-requests/page.tsx | X | ... |
| C5  | ✅/❌  | BrowseContent.tsx | X | ... |
| C6  | ✅/❌  | carriers/register/page.tsx | X | ... |
| C7  | ✅/❌  | carriers/register/page.tsx | X | ... |
| C8  | ✅/❌  | requests/[id]/page.tsx | X | ... |
| C9  | ✅/❌  | RequestsGrid.tsx | X | ... |
| C10 | ✅/❌  | bookings/[id]/page.tsx | X | ... |
| C11 | ✅/❌  | my-requests/page.tsx | X | ... |
| C12 | ✅/❌  | requests/[id]/page.tsx | X | ... |
| C13 | ✅/❌  | requests/[id]/page.tsx | X | ... |
| C14 | ✅/❌  | requests/[id]/page.tsx | X | ... |
| C15 | ✅/❌  | my-requests + my-quotes | X | ... |
| C16 | ✅/❌  | bookings/[id]/page.tsx | X | ... |
| C17 | ✅/❌  | carriers/dashboard/page.tsx | X | ... |
| C18 | ✅/❌  | Step5Review.tsx | X | ... |
| E1  | ✅/❌  | TransportRequestCard.tsx | X | ... |
| E2  | ✅/❌  | HeroSection.tsx | X | ... |
| E3  | ✅/❌  | CarrierCTA.tsx | X | ... |
| E4  | ✅/❌  | ServiceTypesGrid.tsx | X | ... |
| E5  | ✅/❌  | LatestRequests.tsx | X | ... |
| E6  | ✅/❌  | requests/[id]/page.tsx | X | ... |
| E7  | ✅/❌  | ServiceTypesGrid.tsx | X | ... |
| E8  | ✅/❌  | carriers/register/page.tsx | X | ... |
| E9  | ✅/❌  | my-quotes/page.tsx | X | ... |
| E10 | ✅/❌  | carriers/dashboard/page.tsx | X | ... |
| F1  | ✅/❌  | BrowseContent.tsx | X | ... |
| F2  | ✅/❌  | BrowseContent.tsx | X | ... |
| F3  | ✅/❌  | BrowseContent.tsx | X | ... |
| F4  | ✅/❌  | BrowseContent.tsx | X | ... |
| F5  | ✅/❌  | BrowseContent.tsx | X | ... |
| F6  | ✅/❌  | TransportRequestCard.tsx | X | ... |
| F7  | ✅/❌  | RouteMapView.tsx | X | ... |
| F8  | ✅/❌  | CreateRequestWizard.tsx | X | ... |
| F9  | ✅/❌  | Step5Review.tsx | X | ... |
| F10 | ✅/❌  | BrowseContent.tsx | X | ... |
| N1  | ✅/❌  | TransportRequestCard.tsx | X | ... |
| N2  | ✅/❌  | requests/[id]/edit/page.tsx | X | ... |
| N3  | ✅/❌  | transport-request.service.ts | X | ... |
| N4  | ✅/❌  | requests/[id]/page.tsx | X | ... |
| N5  | ✅/❌  | requests/[id]/page.tsx | X | ... |
| N6  | ✅/❌  | bookings/[id]/page.tsx | X | ... |
| N7  | ✅/❌  | transport.controller.ts | X | ... |
| N8  | ✅/❌  | requests/[id]/page.tsx | X | ... |
| N9  | ✅/❌  | transport-quote.service.ts | X | ... |
| N10 | ✅/❌  | transport-quote.service.ts | X | ... |
| N11 | ✅/❌  | create-transport-request.dto.ts | X | ... |
| N12 | ✅/❌  | my-requests/page.tsx | X | ... |
| N13 | ✅/❌  | carriers/dashboard/page.tsx | X | ... |
| N14 | ✅/❌  | bookings/[id]/page.tsx | X | ... |
| N15 | ✅/❌  | my-requests/page.tsx | X | ... |
| N16 | ✅/❌  | requests/[id]/page.tsx | X | ... |
| N17 | ✅/❌  | my-requests/page.tsx | X | ... |
| D1  | ✅/❌  | HeroSection.tsx | X | ... |
| D2  | ✅/❌  | constants.ts | X | ... |
| D3  | ✅/❌  | ar.json | X | ... |
| D4  | ✅/❌  | en.json | X | ... |
| D5  | ✅/❌  | (any file with 'ناقل' fallback) | X | ... |
| D6  | ✅/❌  | (any file with toLocaleDateString) | X | ... |
| D7  | ✅/❌  | CarrierCTA.tsx | X | ... |
| D8  | ✅/❌  | ServiceTypesGrid.tsx | X | ... |
| D9  | ✅/❌  | LatestRequests.tsx | X | ... |
| D10 | ✅/❌  | Step1ServiceType.tsx | X | ... |
| D11 | ✅/❌  | Step2Route.tsx | X | ... |
| D12 | ✅/❌  | Step3Cargo.tsx | X | ... |
| D13 | ✅/❌  | Step4Timing.tsx | X | ... |
| D14 | ✅/❌  | TransportRequestCard.tsx | X | ... |
| D15 | ✅/❌  | requests/[id]/page.tsx | X | ... |
| D16 | ✅/❌  | requests/[id]/page.tsx | X | ... |
| D17 | ✅/❌  | my-requests/page.tsx | X | ... |
| D18 | ✅/❌  | my-quotes/page.tsx | X | ... |
| D19 | ✅/❌  | (transport pages general) | X | ... |
| D20 | ✅/❌  | (transport pages general) | X | ... |

ثم في النهاية:
- **عدد الـ bugs المصلحة:** X من 94
- **البجات اللي لسه تحتاج إصلاح:** قائمة مرتبة حسب الأولوية
