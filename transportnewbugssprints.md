# خطة الإصلاح — الأخطاء الجديدة في قسم النقل
# Transport New Bugs Fix Plan — Sprints 6–9

---

## قواعد صارمة للـ Executing Agent

```
1. لا تعدّل أي ملف خارج نطاق المهمة المحددة في كل Sprint
2. بعد كل ملف تعدّله → شغّل npx tsc --noEmit وتأكد من صفر أخطاء
3. بعد كل Sprint كامل → شغّل npm run build وتأكد من نجاحه
4. لا تنشئ أي ملفات جديدة إلا لو مذكور صراحة في الخطة
5. لا تغيّر أي منطق غير مذكور — فقط الإصلاحات المحددة
6. لا تحذف أي كود موجود إلا لو مطلوب صراحة
7. بعد كل Sprint → commit واضح بعنوان محدد
8. إذا واجهت خطأ غير متوقع → توقف وأبلغ، لا تخمّن الحل
```

---

## سجل الأخطاء الجديدة (17 خطأ)

| # | الخطأ | الملف | الخطورة |
|---|-------|-------|---------|
| N1 | زرار "تعديل" يظهر لأي شخص بدون ملكية أو تسجيل دخول | `TransportRequestCard.tsx` | 🔴 Critical |
| N2 | صفحة التعديل مفتوحة لأي مستخدم بدون تحقق من الملكية | `requests/[id]/edit/page.tsx` | 🔴 Critical |
| N3 | Backend update endpoint بدون ownership check | `transport-request.service.ts` | 🔴 Critical |
| N4 | الشاحن لا يرى العروض أبداً — `getRequest` لا يُرجع quotes | `requests/[id]/page.tsx` | 🔴 Critical |
| N5 | `hasAlreadyQuoted` دايماً false — ID مismatch | `requests/[id]/page.tsx` | 🔴 Critical |
| N6 | `isCarrier` في booking detail يعتمد على role مش الحجز | `bookings/[id]/page.tsx` | 🔴 Critical |
| N7 | `GET /transport/bookings/:id` غير موجود — الصفحة تجلب كل الحجوزات | `transport.controller.ts` | 🔴 Critical |
| N8 | مفيش زرار "إلغاء الطلب" للشاحن | `requests/[id]/page.tsx` | 🟠 High |
| N9 | Race condition في `acceptQuote` — status check خارج الـ transaction | `transport-quote.service.ts` | 🟠 High |
| N10 | `withdrawQuote` بدون transaction — يتعارض مع `acceptQuote` | `transport-quote.service.ts` | 🟠 High |
| N11 | Budget cross-field validation مفقود — budgetMin يمكن > budgetMax | `create-transport-request.dto.ts` | 🟠 High |
| N12 | Pagination في my-requests مثبتة على 50 | `my-requests/page.tsx` | 🟡 Medium |
| N13 | `Promise.all` في carrier dashboard — فشل API واحد يُعطّل كل الصفحة | `carriers/dashboard/page.tsx` | 🟡 Medium |
| N14 | إلغاء الحجز button بدون شرط isCarrier || isShipper | `bookings/[id]/page.tsx` | 🟡 Medium |
| N15 | `window.location.reload()` في my-requests retry | `my-requests/page.tsx` | 🟡 Medium |
| N16 | ناقل بدون carrier profile يرى نموذج تقديم عرض | `requests/[id]/page.tsx` | 🟡 Medium |
| N17 | مفيش زرار cancel request للشاحن في my-requests | `my-requests/page.tsx` | 🟡 Medium |

---

# Sprint 6 — الثغرات الأمنية (Security Critical)
**الهدف:** منع أي شخص من تعديل طلبات غيره
**أخطاء:** N1, N2, N3

---

## S6-T1 — إخفاء زرار "تعديل" إلا للمالك (N1)

**الملف:** `apps/web/src/features/transport/components/TransportRequestCard.tsx`

### الخطوة 1: أضف prop جديد للـ component

```typescript
interface Props {
  request: TransportRequest;
  currentUserId?: string; // ✅ أضف هذا
}

export default function TransportRequestCard({ request, currentUserId }: Props) {
  const isOwner = !!currentUserId && currentUserId === request.userId;
  const canEdit = isOwner && ['OPEN', 'QUOTED'].includes(request.status);
  // ... باقي الكود
```

### الخطوة 2: ابحث عن زرار "تعديل" في JSX وغلّفه بالشرط

```tsx
// قبل:
<Link href={`/transport/requests/${request.id}/edit`} ...>
  تعديل
</Link>

// بعد:
{canEdit && (
  <Link href={`/transport/requests/${request.id}/edit`} ...>
    تعديل
  </Link>
)}
```

### الخطوة 3: مرّر `currentUserId` في كل مكان يستخدم الكرت

**ابحث عن كل استخدامات `<TransportRequestCard` في المشروع:**

```bash
grep -rn "TransportRequestCard" apps/web/src/ --include="*.tsx"
```

في كل ملف يستخدم الكرت، أضف `currentUserId`:

```tsx
// في my-requests/page.tsx:
const { user } = useAuth(); // تأكد موجود
<TransportRequestCard request={req} currentUserId={user?.id} />

// في transport/page.tsx و LatestRequests.tsx:
// إذا الصفحة لا تعرف المستخدم → لا ترسل currentUserId (الزرار لن يظهر تلقائياً)
<TransportRequestCard request={req} /> // currentUserId=undefined → canEdit=false
```

**التحقق:**
- [ ] مستخدم غير مسجّل يفتح الصفحة الرئيسية → لا يرى أي زرار تعديل
- [ ] مستخدم مسجّل يفتح browse → لا يرى تعديل على طلبات غيره
- [ ] مستخدم مسجّل يفتح my-requests → يرى تعديل على طلباته OPEN/QUOTED فقط
- [ ] `npx tsc --noEmit` → صفر أخطاء

---

## S6-T2 — حماية صفحة التعديل (N2)

**الملف:** `apps/web/src/app/[locale]/transport/requests/[id]/edit/page.tsx`

بعد تحميل بيانات الطلب (`request`)، أضف هذا الـ useEffect للتحقق من الملكية:

```typescript
const { user } = useAuth();
const router = useRouter(); // من @/i18n/navigation

// أضف هذا useEffect بعد تحميل الطلب:
useEffect(() => {
  if (loading || !request) return;

  // غير مسجّل → redirect للطلب
  if (!user) {
    router.replace(`/transport/requests/${id}`);
    return;
  }

  // ليس المالك → redirect لصفحة طلباته
  if (request.userId !== user.id) {
    router.replace('/transport/my-requests');
    return;
  }

  // الطلب في حالة لا تسمح بالتعديل
  if (!['OPEN', 'QUOTED'].includes(request.status)) {
    router.replace(`/transport/requests/${id}`);
    return;
  }
}, [loading, request, user, id, router]);
```

**أيضاً:** أضف `<AuthGuard>` حول الصفحة كاملة إن لم يكن موجوداً.

**التحقق:**
- [ ] فتح `/transport/requests/[id]/edit` بدون تسجيل دخول → redirect
- [ ] فتح رابط تعديل طلب شخص آخر → redirect لـ my-requests
- [ ] فتح تعديل طلب IN_PROGRESS → redirect لصفحة الطلب
- [ ] `npx tsc --noEmit` → صفر أخطاء

---

## S6-T3 — Ownership check في Backend (N3)

**الملف:** `apps/api/src/transport/transport-request.service.ts`

ابحث عن دالة `update(id, userId, dto)`. إذا لم تجدها، أضفها. تأكد أن فيها هذين الشرطين:

```typescript
async update(id: string, userId: string, dto: Partial<CreateTransportRequestDto>) {
  const request = await this.prisma.transportRequest.findUnique({ where: { id } });
  if (!request) throw new NotFoundException('طلب النقل غير موجود');

  // ✅ ownership check — لازم يكون موجود
  if (request.userId !== userId) {
    throw new ForbiddenException('لا يمكنك تعديل طلب غيرك');
  }

  // ✅ status check
  if (!['OPEN', 'QUOTED'].includes(request.status)) {
    throw new BadRequestException('لا يمكن تعديل هذا الطلب في حالته الحالية');
  }

  const updated = await this.prisma.transportRequest.update({
    where: { id },
    data: {
      ...(dto.serviceType   && { serviceType: dto.serviceType }),
      ...(dto.fromGovernorate && { fromGovernorate: dto.fromGovernorate }),
      ...(dto.fromAddress    && { fromAddress: dto.fromAddress }),
      ...(dto.toGovernorate  && { toGovernorate: dto.toGovernorate }),
      ...(dto.toAddress      && { toAddress: dto.toAddress }),
      ...(dto.cargoDescription && { cargoDescription: dto.cargoDescription }),
      ...(dto.scheduledAt    && { scheduledAt: new Date(dto.scheduledAt) }),
      ...(dto.budgetMin != null && { budgetMin: new Prisma.Decimal(dto.budgetMin) }),
      ...(dto.budgetMax != null && { budgetMax: new Prisma.Decimal(dto.budgetMax) }),
    },
  });

  await this.redis.delPattern('transport:list:*');
  await this.redis.del(`transport:request:${id}`);
  return updated;
}
```

**الملف:** `apps/api/src/transport/transport.controller.ts`

تأكد أن الـ endpoint محمي بـ `@UseGuards(JwtAuthGuard)`:

```typescript
@UseGuards(JwtAuthGuard)
@Patch('requests/:id')
updateRequest(
  @Param('id') id: string,
  @CurrentUser() user: JwtPayload,
  @Body() dto: Partial<CreateTransportRequestDto>,
) {
  return this.transportRequestService.update(id, user.sub, dto);
}
```

**التحقق:**
- [ ] `PATCH /transport/requests/:id` بدون token → 401
- [ ] `PATCH /transport/requests/:id` بـ token مستخدم آخر → 403
- [ ] `PATCH /transport/requests/:id` بـ token المالك على طلب OPEN → نجاح
- [ ] `PATCH /transport/requests/:id` على طلب IN_PROGRESS → 400
- [ ] `npx tsc --noEmit` → صفر أخطاء

---

## ✅ نهاية Sprint 6

```bash
cd apps/api && npm run build
cd apps/web && npm run build
```

**سيناريو اختبار:**
```
1. مستخدم غير مسجّل يفتح /transport → لا يرى أي زرار تعديل
2. مستخدم A يحاول فتح /transport/requests/[B's request]/edit → redirect
3. curl PATCH /transport/requests/:id بدون JWT → 401
4. curl PATCH /transport/requests/:id بـ JWT مستخدم آخر → 403
```

**commit:** `fix(transport): Sprint 6 - restrict edit to owner, add ownership checks`

---

# Sprint 7 — الـ Flow الأساسي المكسور
**الهدف:** إصلاح رحلة الشاحن والناقل الأساسية
**أخطاء:** N4, N5, N6, N7, N8

---

## S7-T1 — تحميل العروض للشاحن + إصلاح hasAlreadyQuoted (N4 + N5)

**الملف:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`

### الخطوة 1: أضف state لـ carrier profile ID

في أعلى الـ component أضف:
```typescript
const [myCarrierId, setMyCarrierId] = useState<string | null>(null);
```

### الخطوة 2: عدّل دالة `load()` بالكامل

```typescript
const load = async () => {
  setLoading(true);
  setError('');
  try {
    const req = await transportApi.getRequest(id);

    // جلب العروض لصاحب الطلب
    if (user && req.userId === user.id) {
      try {
        const quotesData = await transportApi.getQuotes(id);
        setRequest({ ...req, quotes: quotesData });
      } catch {
        setRequest(req);
      }
    } else {
      setRequest(req);
    }

    // جلب carrier profile ID لمنع التكرار
    if (user?.role === 'CARRIER') {
      try {
        const profile = await transportApi.getMyCarrierProfile();
        setMyCarrierId(profile.id);
      } catch {
        // مستخدم بدون carrier profile
      }
    }
  } catch {
    setError('تعذّر تحميل تفاصيل الطلب');
  } finally {
    setLoading(false);
  }
};
```

### الخطوة 3: عدّل الـ useEffect

```typescript
useEffect(() => {
  if (id) load();
}, [id, user?.id]); // أضف user?.id
```

### الخطوة 4: أصلح `hasAlreadyQuoted`

```typescript
// قبل:
const hasAlreadyQuoted = quotes.some((q) => q.carrierId === user?.id);

// بعد:
const hasAlreadyQuoted = myCarrierId
  ? quotes.some((q) => q.carrierId === myCarrierId)
  : false;
```

**التحقق:**
- [ ] شاحن يفتح طلبه → يرى العروض الفعلية
- [ ] شاحن يرى زرار "قبول" على كل عرض PENDING
- [ ] ناقل قدّم عرض → يفتح الصفحة → لا يرى النموذج مرة ثانية
- [ ] `npx tsc --noEmit` → صفر أخطاء

---

## S7-T2 — إضافة `GET /transport/bookings/:id` (N7)

**الملف:** `apps/api/src/transport/transport-booking.service.ts`

أضف هذه الدالة قبل `getMyBookings()` مباشرة:

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

**الملف:** `apps/api/src/transport/transport.controller.ts`

⚠️ **ضروري:** أضف endpoint **قبل** `@Get('bookings/my')` في ترتيب الكود:

```typescript
// هذا أولاً:
@UseGuards(JwtAuthGuard)
@Get('bookings/:id')
getBooking(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
  return this.transportBookingService.getBooking(id, user.sub);
}

// ثم هذا:
@UseGuards(JwtAuthGuard)
@Get('bookings/my')
getMyBookings(...) { ... }
```

**الملف:** `apps/web/src/features/transport/api.ts`

أضف في قسم Bookings:

```typescript
getBooking(id: string) {
  return apiRequest<TransportBooking>(`/transport/bookings/${id}`);
},
```

**الملف:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`

عدّل الـ `useEffect` — الجزء الذي يجلب الحجز:

```typescript
// قبل:
const res = await transportApi.myBookings('shipper');
let found = res.items.find((b) => b.id === id);
if (!found) {
  const res2 = await transportApi.myBookings('carrier');
  found = res2.items.find((b) => b.id === id);
}
if (!found) throw new Error('not found');
setBooking({ ...found, carrier: found.quote?.carrier });

// بعد:
const found = await transportApi.getBooking(id);
setBooking({ ...found, carrier: found.quote?.carrier });
```

**التحقق:**
- [ ] فتح `/transport/bookings/:id` → يُحمَّل مباشرة بدون جلب كل الحجوزات
- [ ] حجز قديم (> 12) → يظهر بشكل صحيح
- [ ] فتح ID وهمي → رسالة خطأ واضحة
- [ ] مستخدم غير مرتبط بالحجز → 403
- [ ] `npx tsc --noEmit` → صفر أخطاء

---

## S7-T3 — إصلاح `isCarrier`/`isShipper` في Booking Detail (N6)

**الملف:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`

ابحث عن السطرين:
```typescript
const isCarrier = user?.role === 'CARRIER';
const isShipper = !isCarrier;
```

غيّرهما إلى:
```typescript
const isCarrier = booking?.quote?.carrier?.userId === user?.id;
const isShipper = booking?.request?.userId === user?.id;
```

**أيضاً:** أضف شرط لزرار "إلغاء الحجز" (N14):

```tsx
// قبل:
{booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (

// بعد:
{booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (isCarrier || isShipper) && (
```

**التحقق:**
- [ ] الناقل الفعلي للحجز → يرى "بدأت التحميل" عند ACCEPTED فقط
- [ ] الشاحن الفعلي → يرى "استلمت — اكتمل" عند IN_PROGRESS فقط
- [ ] مستخدم بـ role=CARRIER هو شاحن في هذا الحجز → يرى "استلمت — اكتمل" صح
- [ ] مستخدم غير مرتبط → لا يرى أزرار إلغاء
- [ ] `npx tsc --noEmit` → صفر أخطاء

---

## S7-T4 — زرار "إلغاء الطلب" للشاحن (N8)

**الملف:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`

### الخطوة 1: أضف state وhandler

```typescript
const [cancelling, setCancelling] = useState(false);

const handleCancelRequest = async () => {
  if (!request) return;
  if (!confirm('هل تريد إلغاء هذا الطلب؟')) return;
  setCancelling(true);
  try {
    await transportApi.cancelRequest(request.id);
    setRequest((prev) => prev ? { ...prev, status: 'CANCELLED' } : prev);
  } catch {
    // API يعرض الخطأ
  } finally {
    setCancelling(false);
  }
};
```

### الخطوة 2: أضف الزرار في JSX

ابحث عن القسم الخاص بالـ Owner actions (بعد `acceptedQuote && request.booking`).

أضف:
```tsx
{isOwner && ['OPEN', 'QUOTED'].includes(request.status) && (
  <div className="card-base p-4">
    <button
      onClick={handleCancelRequest}
      disabled={cancelling}
      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[var(--color-error)] text-[var(--color-error)] text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
    >
      {cancelling
        ? <Loader2 size={15} className="animate-spin" />
        : <XCircle size={15} />
      }
      إلغاء الطلب
    </button>
  </div>
)}
```

أضف `XCircle` لقائمة الـ imports إن لم يكن موجوداً.

**التحقق:**
- [ ] شاحن يفتح طلب OPEN → يرى زرار إلغاء
- [ ] شاحن يضغط إلغاء → تأكيد → الطلب يتحول CANCELLED
- [ ] الزرار يختفي بعد الإلغاء
- [ ] `npx tsc --noEmit` → صفر أخطاء

---

## ✅ نهاية Sprint 7

```bash
cd apps/api && npm run build
cd apps/web && npm run build
```

**سيناريو اختبار:**
```
1. شاحن يفتح طلبه → يرى قائمة العروض الحقيقية
2. شاحن يقبل عرض → redirect لـ /bookings/:id
3. صفحة الحجز تُحمَّل مباشرة
4. الناقل الحقيقي يرى "بدأت التحميل"
5. الشاحن يرى "استلمت — اكتمل"
6. شاحن يضغط "إلغاء الطلب" → تأكيد → نجاح
```

**commit:** `fix(transport): Sprint 7 - fix quote loading, booking ownership, getBooking endpoint`

---

# Sprint 8 — Race Conditions
**الهدف:** منع الحجز المزدوج والحالات المتضاربة
**أخطاء:** N9, N10

---

## S8-T1 — إصلاح Race Condition في `acceptQuote` (N9)

**الملف:** `apps/api/src/transport/transport-quote.service.ts`

**المشكلة:** Status check يحدث خارج الـ transaction → طلبان متزامنان يمكنهما إنشاء حجزين.

**الإصلاح:** انقل **كل** الـ checks داخل الـ transaction باستخدام pessimistic locking:

```typescript
async acceptQuote(quoteId: string, userId: string) {
  // الـ transaction يبدأ أولاً — مع lock
  return this.prisma.$transaction(async (tx) => {

    // 1. جلب العرض مع lock (داخل الـ transaction)
    const quote = await tx.transportQuote.findUnique({
      where: { id: quoteId },
      include: { request: true, carrier: true },
    });
    if (!quote) throw new NotFoundException('العرض غير موجود');

    // 2. ownership check (داخل الـ transaction)
    if (quote.request.userId !== userId) {
      throw new ForbiddenException('لا يمكنك قبول عرض على طلب غيرك');
    }

    // 3. status checks (داخل الـ transaction)
    if (quote.status !== 'PENDING') {
      throw new BadRequestException('لا يمكن قبول هذا العرض');
    }
    if (!['OPEN', 'QUOTED'].includes(quote.request.status)) {
      throw new BadRequestException('لا يمكن قبول عرض على هذا الطلب');
    }

    // 4. تحديث العرض المقبول
    const acceptedQuote = await tx.transportQuote.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' },
    });

    // 5. رفض باقي العروض
    const pendingQuotes = await tx.transportQuote.findMany({
      where: { requestId: quote.requestId, status: 'PENDING', id: { not: quoteId } },
      select: { id: true, carrier: { select: { userId: true } } },
    });

    await tx.transportQuote.updateMany({
      where: { requestId: quote.requestId, status: 'PENDING', id: { not: quoteId } },
      data: { status: 'REJECTED' },
    });

    // 6. تحديث الطلب
    await tx.transportRequest.update({
      where: { id: quote.requestId },
      data: { status: 'ACCEPTED' },
    });

    // 7. إنشاء Conversation
    const conversation = await tx.conversation.create({
      data: { type: 'TRANSPORT', participants: { create: [
        { userId: quote.request.userId },
        { userId: quote.carrier.userId },
      ]}},
    });

    // 8. إنشاء الحجز
    const booking = await tx.transportBooking.create({
      data: {
        requestId: quote.requestId,
        quoteId,
        conversationId: conversation.id,
        status: 'ACCEPTED',
      },
      include: {
        request: { include: { user: { select: USER_SELECT } } },
        quote: { include: { carrier: { include: { user: { select: USER_SELECT } } } } },
      },
    });

    return { booking, pendingQuotes };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  }).then(async ({ booking, pendingQuotes }) => {
    // الإشعارات خارج الـ transaction (non-blocking)
    this.sendAcceptanceNotifications(booking, pendingQuotes).catch(() => {});
    return booking;
  });
}

// دالة مساعدة للإشعارات
private async sendAcceptanceNotifications(booking: any, pendingQuotes: any[]) {
  await this.notifications.create({
    type: 'TRANSPORT_QUOTE_ACCEPTED',
    title: 'تم قبول عرضك',
    body: `تم قبول عرضك على طلب النقل`,
    userId: booking.quote.carrier.userId,
    data: { bookingId: booking.id },
  });

  for (const q of pendingQuotes) {
    await this.notifications.create({
      type: 'TRANSPORT_QUOTE_REJECTED',
      title: 'تم رفض عرضك',
      body: 'تم اختيار ناقل آخر للطلب',
      userId: q.carrier.userId,
      data: { requestId: booking.requestId },
    }).catch(() => {});
  }
}
```

**التحقق:**
- [ ] `npx tsc --noEmit` → صفر أخطاء
- [ ] قبول عرض → حجز واحد فقط يُنشأ
- [ ] لا يمكن قبول عرض مسبوق بعرض آخر

---

## S8-T2 — إصلاح `withdrawQuote` Race Condition (N10)

**الملف:** `apps/api/src/transport/transport-quote.service.ts`

**المشكلة:** `withdrawQuote` لا يستخدم transaction → يمكن أن يُسحَب عرض بينما يُقبَل.

**الإصلاح:**

```typescript
async withdrawQuote(quoteId: string, userId: string) {
  return this.prisma.$transaction(async (tx) => {
    // جلب العرض داخل الـ transaction
    const quote = await tx.transportQuote.findUnique({
      where: { id: quoteId },
      include: { carrier: true },
    });
    if (!quote) throw new NotFoundException('العرض غير موجود');

    // ownership check
    if (quote.carrier.userId !== userId) {
      throw new ForbiddenException('لا يمكنك سحب عرض غيرك');
    }

    // يمكن سحب العروض PENDING فقط
    if (quote.status !== 'PENDING') {
      throw new BadRequestException('لا يمكن سحب هذا العرض');
    }

    // تحديث داخل الـ transaction
    return tx.transportQuote.update({
      where: { id: quoteId },
      data: { status: 'WITHDRAWN' },
    });
  });
}
```

**التحقق:**
- [ ] سحب عرض PENDING → نجاح
- [ ] سحب عرض ACCEPTED → 400
- [ ] `npx tsc --noEmit` → صفر أخطاء

---

## ✅ نهاية Sprint 8

```bash
cd apps/api && npm run build
```

**commit:** `fix(transport): Sprint 8 - fix race conditions in acceptQuote and withdrawQuote`

---

# Sprint 9 — UX & Validation
**الهدف:** إصلاح مشاكل UX والـ validation المتبقية
**أخطاء:** N11, N12, N13, N15, N16

---

## S9-T1 — Budget Cross-Field Validation (N11)

**الملف:** `apps/api/src/transport/dto/create-transport-request.dto.ts`

أضف custom validator بعد حقول الـ budget:

```typescript
import { ValidateIf, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// Custom validator
function IsBudgetRangeValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBudgetRangeValid',
      target: (object as any).constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          if (obj.budgetMin != null && value != null) {
            return Number(obj.budgetMin) <= Number(value);
          }
          return true;
        },
        defaultMessage() {
          return 'الحد الأقصى للميزانية يجب أن يكون أكبر من أو يساوي الحد الأدنى';
        },
      },
    });
  };
}
```

ثم أضف على حقل `budgetMax`:
```typescript
@IsOptional()
@Min(1, { message: 'الحد الأقصى للميزانية يجب أن يكون أكبر من 0' })
@IsBudgetRangeValid()
budgetMax?: number;
```

وعدّل `budgetMin`:
```typescript
@IsOptional()
@Min(1, { message: 'الحد الأدنى للميزانية يجب أن يكون أكبر من 0' })
budgetMin?: number;
```

**التحقق:**
- [ ] `budgetMin: 100, budgetMax: 50` → 400 validation error
- [ ] `budgetMin: 0` → 400 validation error
- [ ] `budgetMin: 50, budgetMax: 100` → نجاح
- [ ] `npx tsc --noEmit` → صفر أخطاء

---

## S9-T2 — إضافة Pagination في my-requests (N12)

**الملف:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`

### الخطوة 1: أضف state للـ pagination

```typescript
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const ITEMS_PER_PAGE = 12;
```

### الخطوة 2: عدّل دالة `load()`

```typescript
const load = async (tab: TabStatus, page = 1) => {
  setLoading(true);
  setError('');
  try {
    const res = await transportApi.myRequests(page, ITEMS_PER_PAGE, tab === 'ALL' ? undefined : tab);
    setRequests(res.items);
    setTotalPages(res.meta.totalPages);
    setCurrentPage(page);
  } catch {
    setError('تعذّر تحميل طلباتك');
  } finally {
    setLoading(false);
  }
};
```

### الخطوة 3: أضف pagination UI في JSX

بعد الـ grid أضف:
```tsx
{totalPages > 1 && (
  <div className="flex items-center justify-center gap-2 mt-6">
    <button
      onClick={() => load(activeTab, currentPage - 1)}
      disabled={currentPage === 1 || loading}
      className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-40"
    >
      السابق
    </button>
    <span className="text-sm text-[var(--color-on-surface-muted)]">
      {currentPage} / {totalPages}
    </span>
    <button
      onClick={() => load(activeTab, currentPage + 1)}
      disabled={currentPage === totalPages || loading}
      className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-40"
    >
      التالي
    </button>
  </div>
)}
```

### الخطوة 4: أصلح الـ useEffect

```typescript
useEffect(() => { load(activeTab, 1); }, [activeTab]);
```

**التحقق:**
- [ ] مستخدم بأكثر من 12 طلب → يرى أزرار pagination
- [ ] الضغط على التالي → يجلب الصفحة الثانية
- [ ] تغيير الـ tab → يرجع للصفحة 1

---

## S9-T3 — إصلاح Carrier Dashboard من Promise.all Crash (N13)

**الملف:** `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx`

ابحث عن `Promise.all([...])` في الـ dashboard وغيّره لـ `Promise.allSettled`:

```typescript
// قبل:
const [quotesRes, statsRes, profileRes] = await Promise.all([
  transportApi.myQuotes(...),
  transportApi.getStats(),
  transportApi.getMyCarrierProfile(),
]);

// بعد:
const [quotesResult, statsResult, profileResult] = await Promise.allSettled([
  transportApi.myQuotes(...),
  transportApi.getStats(),
  transportApi.getMyCarrierProfile(),
]);

// معالجة كل نتيجة على حدة:
if (quotesResult.status === 'fulfilled') setQuotes(quotesResult.value.items);
if (statsResult.status === 'fulfilled') setStats(statsResult.value);
if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
// فشل أي منها لا يُعطّل الباقي
```

---

## S9-T4 — إصلاح Retry في my-requests (N15)

**الملف:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`

```typescript
// قبل:
<TransportPageError message={error} onRetry={() => window.location.reload()} />

// بعد:
<TransportPageError message={error} onRetry={() => load(activeTab, 1)} />
```

---

## S9-T5 — ناقل بدون Profile (N16)

**الملف:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`

في قسم `canSubmitQuote`، أضف شرط وجود الـ carrier profile:

```typescript
const canSubmitQuote =
  !isOwner &&
  isCarrier &&
  !!myCarrierId &&     // ✅ يجب أن يكون عنده carrier profile
  request.status === 'OPEN' &&
  !hasAlreadyQuoted &&
  !quoteSent;
```

وأضف رسالة واضحة للناقل بدون profile:

```tsx
{!isOwner && isCarrier && !myCarrierId && !loading && (
  <div className="card-base p-5 flex flex-col items-center gap-3 text-center">
    <p className="text-sm text-[var(--color-on-surface-muted)]">
      يجب إنشاء ملف ناقل أولاً لتقديم عروض
    </p>
    <Link href="/transport/carriers/register" className="btn-primary w-full justify-center">
      سجّل كناقل الآن
    </Link>
  </div>
)}
```

---

## ✅ نهاية Sprint 9

```bash
cd apps/api && npm run build
cd apps/web && npm run build
```

**commit:** `fix(transport): Sprint 9 - budget validation, pagination, dashboard resilience, UX fixes`

---

# الاختبار النهائي الشامل

```bash
cd apps/api && npm run build && echo "API ✅"
cd apps/web && npm run build && echo "WEB ✅"
```

## Checklist يدوي

### الأمان:
- [ ] مستخدم غير مسجّل → لا يرى زرار تعديل على أي كرت
- [ ] مستخدم مسجّل → تعديل يظهر على طلباته فقط
- [ ] `/requests/[id]/edit` لطلب شخص آخر → redirect
- [ ] API `PATCH /transport/requests/:id` بدون ملكية → 403

### الـ Flow:
- [ ] شاحن يفتح طلبه → يرى العروض
- [ ] شاحن يقبل عرض → redirect لـ bookings/:id
- [ ] bookings/:id يُحمَّل مباشرة بـ endpoint مباشر
- [ ] الناقل الحقيقي → "بدأت التحميل"
- [ ] الشاحن الحقيقي → "استلمت — اكتمل"
- [ ] مستخدم CARRIER هو شاحن في حجز → يرى "استلمت — اكتمل" صح
- [ ] شاحن يضغط "إلغاء الطلب" → نجاح

### السلامة:
- [ ] قبول عرض مرتين في نفس الوقت → حجز واحد فقط
- [ ] budgetMin > budgetMax → 400
- [ ] my-requests > 12 طلب → pagination تعمل

### UX:
- [ ] carrier dashboard يعمل حتى لو API واحد فشل
- [ ] ناقل بدون profile → يرى رسالة "سجّل كناقل"
- [ ] Retry في my-requests → spinner يظهر مباشرة

---

## ترتيب التنفيذ

```
Sprint 6 (Security)   ← أولاً — ثغرة أمنية
    ↓
Sprint 7 (Core Flow)  ← ثانياً — الـ flow مكسور
    ↓
Sprint 8 (Race)       ← ثالثاً — data integrity
    ↓
Sprint 9 (UX)         ← أخيراً — تحسينات
```
