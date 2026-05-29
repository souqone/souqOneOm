# التحقق من إصلاح كل بجات قسم النقل
# اقرأ كل ملف محدد وأبلغ عن نتيجة كل بق بالضبط

---

## قواعد الإبلاغ

لكل بق:
- ✅ **مصلح** — إذا الكود الصحيح موجود
- ❌ **لسه موجود** — إذا الكود القديم لا يزال موجوداً
- اذكر رقم السطر ومحتوى الكود الذي وجدته

---

## المجموعة 1: Backend & Schema

### A1 + A2 — BookingStatus في Prisma Schema
**اقرأ:** `apps/api/prisma/schema.prisma`
ابحث عن model `TransportBooking` وأخبرني:
- ما نوع حقل `status`؟ هل هو `BookingStatus` أم `TransportRequestStatus`؟
- ما القيمة الافتراضية `@default`؟ هل هي `ACCEPTED` أم `PENDING` أم `IN_PROGRESS`؟

**المطلوب:**
```prisma
status BookingStatus @default(ACCEPTED)
```

---

### A3 + N7 — GET /transport/bookings/:id
**اقرأ:** `apps/api/src/transport/transport.controller.ts`
ابحث عن `@Get('bookings/:id')` وأبلغ:
- هل الـ endpoint موجود؟
- هل هو قبل `@Get('bookings/my')` في الكود؟

**المطلوب:**
```typescript
@Get('bookings/:id')  // يجب أن يكون قبل @Get('bookings/my')
getBooking(...)
```

---

### A4 — setAvailability يُرجع user
**اقرأ:** `apps/api/src/transport/carrier-profile.service.ts`
ابحث عن دالة `setAvailability` أو ما يتعلق بـ `isAvailable` update.
هل الـ update يحتوي `include: { user: ... }`؟

---

### A5 — myRequests يُرجع user
**اقرأ:** `apps/api/src/transport/transport-request.service.ts`
ابحث عن دالة `myRequests` أو `findMyRequests`.
هل الـ include يحتوي `user`؟

---

### N3 — Backend ownership check في update
**اقرأ:** `apps/api/src/transport/transport-request.service.ts`
ابحث عن دالة `update`.
هل فيها check `if (request.userId !== userId) throw new ForbiddenException`؟

**اقرأ أيضاً:** `apps/api/src/transport/transport.controller.ts`
هل يوجد `@Patch('requests/:id')` endpoint محمي بـ `@UseGuards(JwtAuthGuard)`؟

---

### N9 — acceptQuote داخل transaction
**اقرأ:** `apps/api/src/transport/transport-quote.service.ts`
في دالة `acceptQuote`:
- هل الـ status check يحدث داخل `this.prisma.$transaction`؟
- أم خارجه؟

---

### N10 — withdrawQuote داخل transaction
**اقرأ:** نفس الملف
في دالة `withdrawQuote`:
- هل تستخدم `this.prisma.$transaction`؟

---

### N11 — Budget cross-field validation
**اقرأ:** `apps/api/src/transport/dto/create-transport-request.dto.ts`
هل يوجد validation يمنع `budgetMin > budgetMax`؟
(ابحث عن `IsBudgetRangeValid` أو `@Validate` أو `refine` أو custom decorator على `budgetMax`)

---

## المجموعة 2: Frontend — Core Flow

### N1 — Edit button ownership في TransportRequestCard
**اقرأ:** `apps/web/src/features/transport/components/TransportRequestCard.tsx`
- هل يوجد prop اسمه `currentUserId`؟
- هل يوجد `isOwner` أو `canEdit` variable؟
- هل زرار التعديل مغلف بشرط ملكية؟

**المطلوب:**
```typescript
const isOwner = !!currentUserId && currentUserId === request.userId;
const canEdit = isOwner && ['OPEN', 'QUOTED'].includes(request.status);
{canEdit && <Link href={`.../edit`}>تعديل</Link>}
```

---

### N2 — Edit page ownership check
**اقرأ:** `apps/web/src/app/[locale]/transport/requests/[id]/edit/page.tsx`
- هل يوجد check `if (request.userId !== user.id)` يعمل redirect؟
- هل يوجد `AuthGuard`؟

---

### N4 — الشاحن يحمّل العروض
**اقرأ:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`
في دالة `load()` أو `useEffect`:
- هل يوجد استدعاء لـ `transportApi.getQuotes(id)` أو `getRequest` مع quotes في الـ include؟
- هل هذا الاستدعاء يحدث فقط للمالك؟

---

### N5 — hasAlreadyQuoted ID fix
**اقرأ:** نفس الملف
ابحث عن `hasAlreadyQuoted`.
- هل يقارن `q.carrierId === user?.id`؟ ❌ (غلط)
- أم يقارن `q.carrierId === myCarrierId` حيث `myCarrierId` هو ID الـ carrier profile؟ ✅

---

### N6 — isCarrier booking-specific
**اقرأ:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`
ابحث عن `const isCarrier`.
- هل تساوي `user?.role === 'CARRIER'`؟ ❌
- أم `booking?.quote?.carrier?.userId === user?.id`؟ ✅

---

### N8 — Cancel request button
**اقرأ:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`
- هل يوجد `cancelRequest` handler؟
- هل يوجد button بنص "إلغاء الطلب"؟
- هل يظهر فقط للمالك وعلى الطلبات OPEN/QUOTED؟

---

### N12 — Pagination في my-requests
**اقرأ:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`
- ما الـ `limit` المستخدم في `transportApi.myRequests(page, limit, ...)`؟
- هل يوجد pagination UI (أزرار التالي/السابق)؟

---

### N13 — Promise.allSettled في carrier dashboard
**اقرأ:** `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`
- هل يستخدم `Promise.all` أم `Promise.allSettled`؟

---

### N14 — Cancel booking guard
**اقرأ:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`
ابحث عن زرار "إلغاء الحجز".
هل يظهر فقط لـ `isCarrier || isShipper`؟

---

### N15 — Retry بدون window.location.reload
**اقرأ:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`
ابحث عن `onRetry`.
- هل يستخدم `window.location.reload()`؟ ❌
- أم `load(activeTab)` أو ما شابه؟ ✅

---

### N16 — Carrier بدون profile
**اقرأ:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`
في `canSubmitQuote`:
- هل يوجد شرط `!!myCarrierId` أو `!!carrierProfile`؟
- هل يوجد بانر "سجّل كناقل" للناقل بدون profile؟

---

### N17 — Cancel button في my-requests
**اقرأ:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`
هل يوجد زرار إلغاء الطلب على الكروت؟

---

## المجموعة 3: Navigation & Locale Links

### E1-E10 — Locale Links
**اقرأ كل ملف وأبلغ عن الـ import:**

1. `apps/web/src/features/transport/components/TransportRequestCard.tsx`
2. `apps/web/src/features/transport/components/HeroSection.tsx`
3. `apps/web/src/features/transport/components/CarrierCTA.tsx`
4. `apps/web/src/features/transport/components/ServiceTypesGrid.tsx`
5. `apps/web/src/features/transport/components/LatestRequests.tsx`
6. `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`
7. `apps/web/src/app/[locale]/transport/carriers/register/page.tsx`
8. `apps/web/src/app/[locale]/transport/my-quotes/page.tsx`
9. `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`

**لكل ملف:**
- `import Link from 'next/link'` ❌
- `import { Link } from '@/i18n/navigation'` ✅

---

### B1 — "عرض الحجز" link في my-quotes
**اقرأ:** `apps/web/src/app/[locale]/transport/my-quotes/page.tsx`
ابحث عن "عرض الحجز" أو رابط يتعلق بالحجوزات.
هل يذهب لـ `/transport/my-requests`؟ ❌
أم `/transport/my-bookings` أو `/transport/bookings/:id`؟ ✅

---

### B2 — "حجوزاتي" في SubNavBar
**اقرأ:** `apps/web/src/components/layout/SubNavBar.tsx`
هل يوجد رابط "حجوزاتي" أو `my-bookings` للناقل؟

---

### B3 — AuthGuard على my-quotes
**اقرأ:** `apps/web/src/app/[locale]/transport/my-quotes/page.tsx`
هل يوجد `<AuthGuard>` حول محتوى الصفحة؟

---

## المجموعة 4: Browse & Filters

### F1, F3, F5, F10 — Filter URL Persistence
**اقرأ:** `apps/web/src/features/transport/components/BrowseContent.tsx`
- هل `handleFilterChange` يستخدم `router.replace` أو `router.push` لتحديث الـ URL؟
- هل الـ pagination تحافظ على الفلاتر في الـ URL؟

---

### F2, F4 — Wilayat في API
**اقرأ:** نفس الملف
- هل `fromWilayat` و `toWilayat` يُمرَّران في الـ request params؟

---

## المجموعة 5: UX

### C1 — Wizard validation toast
**اقرأ:** `apps/web/src/features/transport/components/CreateRequestWizard.tsx`
في `handleNext()`:
هل يوجد `toast.error(...)` عند فشل الـ validation؟

### C3 — Error toast auto-close
**اقرأ:** `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`
هل يوجد `setTimeout` يُخفي الـ error toast تلقائياً؟

### C6 — Carrier register freeze
**اقرأ:** `apps/web/src/app/[locale]/transport/carriers/register/page.tsx`
في الـ `finally` block:
هل `setSubmitting(false)` يُنفَّذ دائماً؟ أم يعتمد على شرط؟

### C17 — UUID مختصر في dashboard
**اقرأ:** `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`
ابحث عن عرض الـ `requestId`.
هل يستخدم `.slice(0, 8)` أو ما شابه؟

---

## الإبلاغ النهائي

بعد فحص كل الملفات، اعمل جدول بهذا الشكل:

| Bug | الحالة | الملف | السطر | الملاحظة |
|-----|--------|-------|-------|----------|
| A1 | ✅/❌ | schema.prisma | X | ... |
| A2 | ✅/❌ | schema.prisma | X | ... |
| ... | ... | ... | ... | ... |

ثم في النهاية:
- **عدد الـ bugs المصلحة:** X من 30
- **البجات اللي لسه تحتاج إصلاح:** قائمة بأسمائها
