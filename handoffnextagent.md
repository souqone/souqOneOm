# Handoff Prompt — Transport Section Bug Fixes
# الريبو: souqone/souqOneOm | Branch: claude/design-review-discussion-ZjmGq

---

## سياق المشروع

**Monorepo structure:**
- `apps/api` — NestJS + Prisma (PostgreSQL)
- `apps/web` — Next.js 15 App Router + next-intl (locale prefix `/ar/`, `/en/`)
- Turbo build system

**Transport flow:**
1. Shipper ينشئ transport request
2. Carrier يقدم quote على الطلب
3. Shipper يقبل quote → booking يُنشأ تلقائياً بـ status=ACCEPTED
4. Carrier يضغط "بدأت التحميل" → status: ACCEPTED → IN_PROGRESS
5. Shipper يضغط "استلمت" → status: IN_PROGRESS → COMPLETED

**Locale links — قاعدة صارمة:**
كل الملفات في `apps/web` يجب أن تستورد `Link` من `@/i18n/navigation` وليس من `next/link`.
```typescript
import { Link } from '@/i18n/navigation'; // ✅
import Link from 'next/link';              // ❌ يكسر locale prefix
```

---

## المهمة

**اقرأ الملفات المذكورة بالضبط وأبلغ عن حالة كل bug.**

لكل bug:
- ✅ **مصلح** — الكود الصحيح موجود
- ❌ **لسه موجود** — الكود القديم لا يزال موجوداً
- اذكر رقم السطر والكود الذي وجدته

---

## المجموعة 1: Backend & Schema

### A1 + A2 — BookingStatus في Prisma Schema
**اقرأ:** `apps/api/prisma/schema.prisma`
ابحث عن `model TransportBooking` وأخبرني:
- ما نوع حقل `status`؟ هل هو `BookingStatus` أم `TransportRequestStatus`؟
- ما القيمة الافتراضية `@default`؟ هل هي `ACCEPTED` أم `PENDING` أم `IN_PROGRESS`؟

**المطلوب:**
```prisma
status BookingStatus @default(ACCEPTED)
```

---

### A3 + N7 — GET /transport/bookings/:id
**اقرأ:** `apps/api/src/transport/transport.controller.ts`
- هل `@Get('bookings/:id')` موجود؟
- هل هو مكتوب قبل `@Get('bookings/my')` في الكود؟ (ضروري وإلا `my` تُفسَّر كـ `:id`)

**المطلوب:**
```typescript
@Get('bookings/:id')  // يجب أن يكون قبل @Get('bookings/my')
getBooking(...)
```

---

### A4 — setAvailability يُرجع user
**اقرأ:** `apps/api/src/transport/carrier-profile.service.ts`
في دالة `setAvailability` — هل الـ prisma update يحتوي `include: { user: ... }`؟

---

### A5 — myRequests يُرجع user
**اقرأ:** `apps/api/src/transport/transport-request.service.ts`
في دالة `myRequests` — هل الـ include يحتوي `user`؟

---

### N3 — ownership check في update request
**اقرأ:** `apps/api/src/transport/transport-request.service.ts`
في دالة `update` — هل فيها `if (request.userId !== userId) throw new ForbiddenException`؟

**اقرأ أيضاً:** `apps/api/src/transport/transport.controller.ts`
هل `@Patch('requests/:id')` محمي بـ `@UseGuards(JwtAuthGuard)`؟

---

### N9 — acceptQuote داخل transaction
**اقرأ:** `apps/api/src/transport/transport-quote.service.ts`
في دالة `acceptQuote`:
- هل الـ status check يحدث داخل `this.prisma.$transaction`؟ ✅
- أم خارجه؟ ❌

---

### N10 — withdrawQuote داخل transaction
**اقرأ:** نفس الملف — دالة `withdrawQuote`
هل تستخدم `this.prisma.$transaction`؟

---

### N11 — Budget cross-field validation
**اقرأ:** `apps/api/src/transport/dto/create-transport-request.dto.ts`
هل يوجد validation يمنع `budgetMin > budgetMax`؟
(ابحث عن `IsBudgetRangeValid` أو `@Validate` أو custom decorator على `budgetMax`)

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
- هل يوجد استدعاء لـ `transportApi.getQuotes(id)` أو ما شابه؟
- هل هذا الاستدعاء يحدث فقط للمالك؟

---

### N5 — hasAlreadyQuoted ID fix
**اقرأ:** نفس الملف
ابحث عن `hasAlreadyQuoted`.
- هل يقارن `q.carrierId === user?.id`؟ ❌ (غلط — user.id ≠ carrierId)
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
- هل يوجد زرار إلغاء الطلب (نص "إلغاء الطلب" أو cancelRequest handler)؟
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
هل زرار "إلغاء الحجز" يظهر فقط لـ `isCarrier || isShipper`؟

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
هل يوجد زرار إلغاء الطلب على الكروت (للطلبات OPEN/QUOTED)؟

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
- يوجّه لـ `/transport/my-requests`؟ ❌
- يوجّه لـ `/transport/my-bookings` أو `/transport/bookings/:id`؟ ✅

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
- هل `handleFilterChange` يستخدم `router.replace` لتحديث الـ URL؟
- هل الـ pagination تحافظ على الفلاتر في الـ URL؟

---

### F2, F4 — Wilayat في API
**اقرأ:** نفس الملف
- هل `fromWilayat` و `toWilayat` يُمرَّران في الـ request params؟

---

## المجموعة 5: UX

### C1 — Wizard validation toast
**اقرأ:** `apps/web/src/features/transport/components/CreateRequestWizard.tsx`
في `handleNext()` — هل يوجد `toast.error(...)` عند فشل الـ validation؟

---

### C3 — Error toast auto-close
**اقرأ:** `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`
هل يوجد `setTimeout` يُخفي الـ error toast تلقائياً؟

---

### C6 — Carrier register freeze
**اقرأ:** `apps/web/src/app/[locale]/transport/carriers/register/page.tsx`
في الـ `finally` block — هل `setSubmitting(false)` يُنفَّذ دائماً بدون شرط؟

---

### C17 — UUID مختصر في dashboard
**اقرأ:** `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`
ابحث عن عرض الـ `requestId`.
هل يستخدم `.slice(0, 8)` أو ما شابه؟

---

## الإبلاغ النهائي

بعد فحص كل الملفات، اعمل جدول بهذا الشكل:

| Bug | الحالة | الملف | السطر | الكود الموجود |
|-----|--------|-------|-------|--------------|
| A1 | ✅/❌ | schema.prisma | X | ... |
| A2 | ✅/❌ | schema.prisma | X | ... |
| A3 | ✅/❌ | transport.controller.ts | X | ... |
| A4 | ✅/❌ | carrier-profile.service.ts | X | ... |
| A5 | ✅/❌ | transport-request.service.ts | X | ... |
| N3 | ✅/❌ | transport-request.service.ts | X | ... |
| N7 | ✅/❌ | transport.controller.ts | X | ... |
| N9 | ✅/❌ | transport-quote.service.ts | X | ... |
| N10 | ✅/❌ | transport-quote.service.ts | X | ... |
| N11 | ✅/❌ | create-transport-request.dto.ts | X | ... |
| N1 | ✅/❌ | TransportRequestCard.tsx | X | ... |
| N2 | ✅/❌ | requests/[id]/edit/page.tsx | X | ... |
| N4 | ✅/❌ | requests/[id]/page.tsx | X | ... |
| N5 | ✅/❌ | requests/[id]/page.tsx | X | ... |
| N6 | ✅/❌ | bookings/[id]/page.tsx | X | ... |
| N8 | ✅/❌ | requests/[id]/page.tsx | X | ... |
| N12 | ✅/❌ | my-requests/page.tsx | X | ... |
| N13 | ✅/❌ | carriers/dashboard/page.tsx | X | ... |
| N14 | ✅/❌ | bookings/[id]/page.tsx | X | ... |
| N15 | ✅/❌ | my-requests/page.tsx | X | ... |
| N16 | ✅/❌ | requests/[id]/page.tsx | X | ... |
| N17 | ✅/❌ | my-requests/page.tsx | X | ... |
| E1 | ✅/❌ | TransportRequestCard.tsx | X | ... |
| E2 | ✅/❌ | HeroSection.tsx | X | ... |
| E3 | ✅/❌ | CarrierCTA.tsx | X | ... |
| E4 | ✅/❌ | ServiceTypesGrid.tsx | X | ... |
| E5 | ✅/❌ | LatestRequests.tsx | X | ... |
| E6 | ✅/❌ | requests/[id]/page.tsx | X | ... |
| E8 | ✅/❌ | carriers/register/page.tsx | X | ... |
| E9 | ✅/❌ | my-quotes/page.tsx | X | ... |
| E10 | ✅/❌ | carriers/dashboard/page.tsx | X | ... |
| B1 | ✅/❌ | my-quotes/page.tsx | X | ... |
| B2 | ✅/❌ | SubNavBar.tsx | X | ... |
| B3 | ✅/❌ | my-quotes/page.tsx | X | ... |
| F1 | ✅/❌ | BrowseContent.tsx | X | ... |
| F2 | ✅/❌ | BrowseContent.tsx | X | ... |
| C1 | ✅/❌ | CreateRequestWizard.tsx | X | ... |
| C3 | ✅/❌ | carriers/dashboard/page.tsx | X | ... |
| C6 | ✅/❌ | carriers/register/page.tsx | X | ... |
| C17 | ✅/❌ | carriers/dashboard/page.tsx | X | ... |

ثم في النهاية:
- **عدد الـ bugs المصلحة:** X من 40
- **البجات اللي لسه تحتاج إصلاح:** قائمة بأسمائها

---

## بعد الإبلاغ — خطة الإصلاح

إذا وُجدت bugs غير مصلحة، نفّذها حسب هذا الترتيب:

### الأولوية 1 — Backend (افعلها أولاً)
- **A1+A2:** في `schema.prisma` غيّر `TransportBooking.status` من `TransportRequestStatus @default(IN_PROGRESS)` إلى `BookingStatus @default(ACCEPTED)` ثم شغّل `npx prisma migrate dev --name fix-booking-status`
- **A3+N7:** أضف endpoint في `transport.controller.ts`:
  ```typescript
  @UseGuards(JwtAuthGuard)
  @Get('bookings/:id')
  getBooking(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.transportBookingService.getBooking(id, user.sub);
  }
  ```
  (ضعه قبل `@Get('bookings/my')`)
  وأضف دالة `getBooking()` المناسبة في `transport-booking.service.ts`
- **N9+N10:** wrap الـ status checks داخل `this.prisma.$transaction()`
- **N11:** أضف cross-field validation في `create-transport-request.dto.ts`

### الأولوية 2 — Frontend Security
- **N1:** أضف `currentUserId` prop لـ `TransportRequestCard` واعرض زرار التعديل فقط للمالك
- **N2:** أضف ownership check في صفحة `/edit`
- **N6:** غيّر `isCarrier` من `user?.role === 'CARRIER'` إلى `booking?.quote?.carrier?.userId === user?.id`
- **N3:** أضف `ForbiddenException` في دالة `update` بالـ service

### الأولوية 3 — Locale Links (E1-E10)
في كل ملف مذكور: استبدل `import Link from 'next/link'` بـ `import { Link } from '@/i18n/navigation'`

### الأولوية 4 — Navigation
- **B1:** غيّر رابط "عرض الحجز" من `/transport/my-requests` إلى `/transport/my-bookings`
- **B2:** أضف رابط "حجوزاتي" في `SubNavBar.tsx` للناقل
- **B3:** أضف `<AuthGuard>` في `my-quotes/page.tsx` (إذا لم يكن موجوداً)

### الأولوية 5 — UX + Data
- **N4:** أضف استدعاء `getQuotes(id)` في `requests/[id]/page.tsx` للمالك فقط
- **N5:** صحّح `hasAlreadyQuoted` ليقارن بـ carrier profile ID مش user ID
- **N8:** أضف زرار إلغاء الطلب للمالك في `requests/[id]/page.tsx`
- **N13:** غيّر `Promise.all` إلى `Promise.allSettled` في carrier dashboard
- **N15:** غيّر `window.location.reload()` إلى `load(activeTab)` في my-requests
- **N16:** أضف check للـ carrier profile في `canSubmitQuote`
- **N17:** أضف زرار إلغاء على كروت my-requests
- **C1:** أضف `toast.error(...)` في `handleNext()` عند فشل الـ validation
- **C3:** أضف `setTimeout` 5000ms لإخفاء error toast تلقائياً
- **C6:** أزل الشرط من `finally` block في carrier register — `setSubmitting(false)` يجب أن يُنفَّذ دائماً
- **C17:** أضف `.slice(0, 8)` على `requestId` في carrier dashboard
- **F1+F3:** أضف `router.replace` في `handleFilterChange` في `BrowseContent.tsx`
- **F2+F4:** مرّر `fromWilayat` و `toWilayat` في الـ request params

---

## قواعد مهمة

```
1. بعد كل ملف تعدّله → شغّل `npx tsc --noEmit` وتأكد من صفر أخطاء
2. بعد كل مجموعة → شغّل `npm run build`
3. لا تغيّر أي كود غير مذكور في هذه الخطة
4. لا تعدّل ملفات الـ tests أو الـ CI/CD
5. Branch: claude/design-review-discussion-ZjmGq
6. بعد الانتهاء → commit + push إلى البرانش
```

**commit message نهائي:**
```
fix(transport): fix all critical transport section bugs (A1-A8, B1-B3, E1-E10, N1-N17, F1-F4, C1-C17)
```
