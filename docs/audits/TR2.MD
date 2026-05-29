# خطة التنفيذ — المرحلة الثانية
# Transport Phase 2 — 23 Gaps — Execution Plan

---

## قواعد صارمة للـ Executing Agent

```
1. لا تعدّل أي ملف خارج نطاق المهمة المحددة في كل Sprint
2. بعد كل ملف تعدّله → شغّل npx tsc --noEmit وتأكد من صفر أخطاء
3. بعد كل Sprint كامل → شغّل npm run build وتأكد من نجاحه
4. كل تغيير Backend يستلزم migration إذا تعلّق بالـ schema
5. بعد كل Sprint → commit واضح بعنوان محدد ثم push
6. إذا واجهت خطأ غير متوقع → توقف وأبلغ، لا تخمّن الحل
7. لا تنشئ ملفات جديدة إلا لو مذكور صراحةً
8. لا تحذف كود موجود إلا لو مطلوب صراحةً
9. لا تعدّل ملفات tests أو CI/CD
10. اقرأ الملف كاملاً قبل تعديله
```

---

## ترتيب الـ Sprints

```
Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4 → Sprint 5 → Sprint 6
(Role)     (Notifs)   (Editing)  (Reviews)  (Chat)     (Admin+FAQ)
```

---

# Sprint 1 — Role Clarity & Onboarding
**الفجوات:** P1-4, P1-5, P1-7, P2-5, P2-10, P3-5 (6 فجوات)

---

## S1-T1 — CTA للمستخدم المسجّل في Browse (P1-5)

**الملف:** `apps/web/src/features/transport/components/BrowseContent.tsx`

ابحث عن:
```typescript
{!isAuthenticated && (
```

أضف بعده مباشرة:
```typescript
{isAuthenticated && !isCarrier && (
  <div className="flex items-center justify-between gap-4 p-4 mb-4 rounded-2xl border border-[var(--color-brand-navy)]/20 bg-[var(--color-brand-navy)]/5">
    <div>
      <p className="font-semibold text-sm text-[var(--color-on-surface)]">
        هل لديك مركبة وتريد تقديم خدمات نقل؟
      </p>
      <p className="text-xs text-[var(--color-on-surface-muted)] mt-0.5">
        سجّل كناقل مجاناً وابدأ في استقبال الطلبات
      </p>
    </div>
    <Link
      href="/transport/carriers/register"
      className="btn-primary text-sm whitespace-nowrap flex-shrink-0"
    >
      سجّل كناقل
    </Link>
  </div>
)}
```

**التحقق:**
- [ ] مستخدم مسجّل (غير ناقل) يفتح Browse → يرى البانر
- [ ] ناقل مسجّل يفتح Browse → لا يرى البانر
- [ ] زائر غير مسجّل → يرى البانر الأصلي (للـ guest)

---

## S1-T2 — بانر للـ USER في Request Detail (P2-10)

**الملف:** `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`

ابحث عن منطقة عرض نموذج العرض (بعد `canSubmitQuote` checks).

أضف هذا الـ block قبل نموذج العرض:
```typescript
{isAuthenticated && !isCarrier && !isOwner && (
  <div className="card-base p-4 text-center flex flex-col gap-3">
    <div className="w-10 h-10 rounded-full bg-[var(--color-brand-navy)]/10 flex items-center justify-center mx-auto">
      <Truck size={20} className="text-[var(--color-brand-navy)]" />
    </div>
    <div>
      <p className="font-semibold text-sm">هل تريد تقديم عرض على هذا الطلب؟</p>
      <p className="text-xs text-[var(--color-on-surface-muted)] mt-1">
        سجّل كناقل مجاناً للتمكن من تقديم عروض الأسعار
      </p>
    </div>
    <Link href="/transport/carriers/register" className="btn-primary w-full justify-center">
      سجّل كناقل الآن
    </Link>
  </div>
)}
```

**التحقق:**
- [ ] USER غير ناقل يفتح طلب شخص آخر → يرى البانر
- [ ] CARRIER يفتح نفس الطلب → لا يرى البانر
- [ ] صاحب الطلب يفتحه → لا يرى البانر

---

## S1-T3 — صفحة Onboarding للناقل الجديد (P1-7)

**ملف جديد:** `apps/web/src/app/[locale]/transport/carriers/onboarding/page.tsx`

```typescript
'use client';
import { Link } from '@/i18n/navigation';
import { Search, Tag, CheckCircle, ArrowLeft } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'تصفّح الطلبات',
    desc: 'ابحث عن طلبات تناسب مركبتك ومنطقتك من صفحة التصفح',
  },
  {
    icon: Tag,
    title: 'قدّم عرض سعر',
    desc: 'أدخل سعرك وأي ملاحظات للشاحن — العرض مجاني تماماً',
  },
  {
    icon: CheckCircle,
    title: 'ابدأ الرحلة وأتمّها',
    desc: 'بعد قبول عرضك، اضغط "بدأت التحميل" ثم "تم التسليم" عند الوصول',
  },
];

export default function CarrierOnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[var(--color-brand-navy)]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-[var(--color-brand-navy)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">
            مرحباً بك في سوق وان!
          </h1>
          <p className="text-sm text-[var(--color-on-surface-muted)] mt-2">
            تم تسجيلك كناقل بنجاح. إليك كيف تبدأ:
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {STEPS.map((step, i) => (
            <div key={i} className="card-base p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--color-brand-navy)]/10 flex items-center justify-center flex-shrink-0">
                <step.icon size={18} className="text-[var(--color-brand-navy)]" />
              </div>
              <div>
                <p className="font-semibold text-sm">{step.title}</p>
                <p className="text-xs text-[var(--color-on-surface-muted)] mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/transport/browse"
          className="btn-primary w-full justify-center flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          ابدأ تصفح الطلبات
        </Link>

        <Link
          href="/transport/carriers/dashboard"
          className="btn-ghost w-full justify-center mt-3 text-sm"
        >
          الذهاب للوحة التحكم
        </Link>
      </div>
    </div>
  );
}
```

**الملف:** `apps/web/src/app/[locale]/transport/carriers/register/page.tsx`

ابحث عن redirect بعد التسجيل الناجح:
```typescript
// قبل:
router.push('/transport/carriers/dashboard');

// بعد:
router.push('/transport/carriers/onboarding');
```

**التحقق:**
- [ ] تسجيل ناقل جديد → redirect لـ onboarding لا dashboard
- [ ] صفحة onboarding تعرض 3 خطوات
- [ ] زرار "ابدأ تصفح" يذهب لـ /transport/browse

---

## S1-T4 — Post-Login Redirect الذكي (P2-5)

**الملف:** ابحث في `apps/web/src/features/auth/` عن الملف الذي يتعامل مع نجاح الـ login (قد يكون `AuthModal.tsx` أو `useAuth.ts` أو `auth.slice.ts`).

في دالة onLoginSuccess أو handleLoginSuccess:
```typescript
// بعد نجاح الـ login:
const { data: carrierProfile } = await transportApi.getMyCarrierProfile().catch(() => null);

if (carrierProfile) {
  router.push('/transport/carriers/dashboard');
} else if (user.role === 'CARRIER') {
  router.push('/transport/carriers/register');
}
// else: لا تعمل redirect — ابقَ في نفس الصفحة
```

**ملاحظة:** إذا لم تجد مكان واضح لـ post-login redirect، أضف الـ check في `apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx` فقط (إذا ناقل مع profile → يُعرض dashboard, إذا CARRIER بدون profile → redirect لـ register).

**التحقق:**
- [ ] ناقل مسجّل يدخل → يذهب للـ dashboard
- [ ] CARRIER بدون profile يدخل → يذهب لـ register
- [ ] USER عادي يدخل → يبقى في نفس الصفحة

---

## S1-T5 — Tooltips في SubNavBar (P3-5 جزء منه)

**الملف:** `apps/web/src/components/layout/SubNavBar.tsx`

أضف `title` attribute لكل رابط في قائمة التنقل:
```typescript
// للشاحن:
{ href: '/transport/my-requests', label: 'طلباتي', icon: FileText,
  title: 'طلبات النقل التي أنشأتها' }
{ href: '/transport/my-bookings', label: 'حجوزاتي', icon: CalendarCheck,
  title: 'الحجوزات المكتملة وقيد التنفيذ' }

// للناقل:
{ href: '/transport/my-quotes', label: 'عروضي', icon: MessageSquare,
  title: 'العروض التي قدّمتها على طلبات الشحن' }
{ href: '/transport/my-bookings', label: 'حجوزاتي', icon: CalendarCheck,
  title: 'الرحلات المقبولة وقيد التنفيذ' }
{ href: '/transport/carriers/dashboard', label: 'لوحة الناقل', icon: LayoutDashboard,
  title: 'إدارة ملفك وعرض إحصائياتك' }
```

في JSX للرابط:
```tsx
<Link href={link.href} title={link.title} ...>
```

---

## S1-T6 — FAQ بسيط في صفحة النقل الرئيسية (P3-5)

**ملف جديد:** `apps/web/src/features/transport/components/TransportFAQ.tsx`

```typescript
'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'ما الفرق بين الشاحن والناقل؟',
    a: 'الشاحن هو من يحتاج لنقل بضاعة وينشئ طلباً. الناقل هو صاحب المركبة الذي يقدّم عروض أسعار على الطلبات.',
  },
  {
    q: 'كيف أصبح ناقلاً؟',
    a: 'اضغط على "سجّل كناقل" في القائمة أو في الصفحة الرئيسية، وأدخل بياناتك ونوع مركبتك. التسجيل مجاني.',
  },
  {
    q: 'هل يمكنني تعديل طلبي بعد نشره؟',
    a: 'نعم، يمكن تعديل الطلب طالما لم يُقبَل أي عرض بعد. اذهب لـ "طلباتي" واضغط تعديل.',
  },
  {
    q: 'متى يمكنني تقييم الناقل؟',
    a: 'بعد اكتمال الرحلة، تظهر لك خانة التقييم في صفحة الحجز.',
  },
  {
    q: 'ماذا يحدث إذا لم يصلني أي عرض؟',
    a: 'ينتهي الطلب تلقائياً بعد 7 أيام وتصلك إشعاراً. يمكنك إعادة نشره بضغطة واحدة.',
  },
  {
    q: 'هل اتصال الشاحن بالناقل متاح قبل القبول؟',
    a: 'يمكن للناقل إرسال رسالة مع عرضه. بعد القبول يُفتح تشات مباشر بين الطرفين.',
  },
];

export default function TransportFAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-12 px-4">
      <h2 className="text-xl font-bold text-center text-[var(--color-on-surface)] mb-6">
        أسئلة شائعة
      </h2>
      <div className="max-w-2xl mx-auto flex flex-col gap-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="card-base overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-right"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-medium text-sm">{faq.q}</span>
              <ChevronDown
                size={16}
                className={`flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
              />
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-sm text-[var(--color-on-surface-muted)]">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

**الملف:** `apps/web/src/app/[locale]/transport/page.tsx`

أضف `<TransportFAQ />` قبل آخر section في الصفحة.

---

## ✅ نهاية Sprint 1

```bash
cd apps/web && npx tsc --noEmit   # يجب صفر أخطاء
cd apps/web && npm run build      # يجب أن ينجح
```

**Checklist:**
- [ ] مستخدم مسجّل في Browse → يرى بانر "سجّل كناقل"
- [ ] USER في request detail → يرى دعوة التحوّل لناقل
- [ ] تسجيل ناقل جديد → يذهب لـ onboarding لا dashboard
- [ ] Tooltips على روابط التنقل
- [ ] FAQ يظهر في صفحة النقل الرئيسية

**commit:** `feat(transport): Sprint 1 - role clarity, onboarding page, authenticated user CTAs, FAQ`

---

# Sprint 2 — Missing Notifications
**الفجوات:** P1-2, P1-3, P2-6, P2-7 (4 فجوات)

---

## S2-T1 — إشعار قبول العرض للناقل (P1-2)

**الملف:** `apps/api/src/transport/transport-quote.service.ts`

ابحث عن دالة `acceptQuote()`. بعد إنشاء الحجز (بعد `this.prisma.transportBooking.create`) أضف:

```typescript
// إشعار للناقل المقبول
await this.notificationsService.create({
  userId: acceptedQuote.carrier.userId,
  type: 'TRANSPORT_QUOTE_ACCEPTED',
  title: 'تم قبول عرضك! 🎉',
  body: `وافق الشاحن على عرضك بسعر ${acceptedQuote.price} ر.ع. — يمكنك الآن بدء الرحلة`,
  data: { bookingId: booking.id, requestId },
});
```

**الملف:** `apps/web/src/lib/constants/notifications.ts`

أضف النوع الجديد في الـ NOTIFICATION_CONFIG object:
```typescript
TRANSPORT_QUOTE_ACCEPTED: {
  icon: CheckCheck,
  color: 'text-green-500',
  getLink: (data: { bookingId: string }) => `/transport/bookings/${data.bookingId}`,
},
```

---

## S2-T2 — إشعار رفض العروض للناقلين الآخرين (P1-3)

**الملف:** `apps/api/src/transport/transport-quote.service.ts`

في نفس دالة `acceptQuote()` — بعد رفض باقي العروض في الـ transaction، أضف loop:

```typescript
// ابحث عن العروض المرفوضة (كل العروض غير المقبول)
const rejectedQuotes = await this.prisma.transportQuote.findMany({
  where: {
    requestId,
    id: { not: acceptedQuoteId },
    status: 'REJECTED',
  },
  include: { carrier: { select: { userId: true } } },
});

// أرسل إشعار لكل ناقل مرفوض
for (const quote of rejectedQuotes) {
  await this.notificationsService.create({
    userId: quote.carrier.userId,
    type: 'TRANSPORT_QUOTE_REJECTED',
    title: 'تم اختيار ناقل آخر',
    body: 'اختار الشاحن عرضاً آخر على هذا الطلب. تابع الطلبات الجديدة في التصفح',
    data: { requestId },
  });
}
```

**الملف:** `apps/web/src/lib/constants/notifications.ts`

```typescript
TRANSPORT_QUOTE_REJECTED: {
  icon: XCircle,
  color: 'text-orange-500',
  getLink: (data: { requestId: string }) => `/transport/browse`,
},
```

---

## S2-T3 — إشعار إلغاء الطلب لمن قدّم عروضاً (P2-6)

**الملف:** `apps/api/src/transport/transport-request.service.ts`

ابحث عن دالة `cancel()`. بعد تحديث حالة الطلب للـ CANCELLED أضف:

```typescript
// جلب الناقلين الذين قدّموا عروضاً معلّقة
const pendingQuotes = await this.prisma.transportQuote.findMany({
  where: { requestId, status: 'PENDING' },
  include: { carrier: { select: { userId: true } } },
});

// إشعار لكل ناقل
for (const quote of pendingQuotes) {
  await this.notificationsService.create({
    userId: quote.carrier.userId,
    type: 'TRANSPORT_REQUEST_CANCELLED',
    title: 'تم إلغاء الطلب',
    body: 'أُلغي الطلب الذي قدّمت عليه عرضاً من قِبَل الشاحن',
    data: { requestId },
  });
}
```

**الملف:** `apps/web/src/lib/constants/notifications.ts`

```typescript
TRANSPORT_REQUEST_CANCELLED: {
  icon: XCircle,
  color: 'text-red-500',
  getLink: () => `/transport/browse`,
},
```

---

## S2-T4 — إشعار انتهاء صلاحية الطلب للشاحن (P2-7)

**الملف:** `apps/api/src/transport/transport-request.service.ts`

ابحث عن دالة الـ cron job التي تُعلّم الطلبات كـ EXPIRED (قد تكون في ملف منفصل — ابحث عن `@Cron` في مجلد transport).

بعد تحديث الطلبات المنتهية أضف:
```typescript
for (const req of expiredRequests) {
  await this.notificationsService.create({
    userId: req.userId,
    type: 'TRANSPORT_REQUEST_EXPIRED',
    title: 'انتهت صلاحية طلبك',
    body: `انتهت مدة طلب النقل "${req.cargoDescription ?? 'طلبك'}" بدون عروض. يمكنك إعادة نشره`,
    data: { requestId: req.id },
  });
}
```

**الملف:** `apps/web/src/lib/constants/notifications.ts`

```typescript
TRANSPORT_REQUEST_EXPIRED: {
  icon: Clock,
  color: 'text-gray-500',
  getLink: (data: { requestId: string }) => `/transport/my-requests`,
},
```

**ملاحظة:** تأكد من import الـ icons الجديدة (CheckCheck, XCircle, Clock) في notifications.ts.

---

## ✅ نهاية Sprint 2

```bash
cd apps/api && npx tsc --noEmit
cd apps/api && npm run build
```

**Checklist:**
- [ ] شاحن يقبل عرضاً → الناقل المقبول يتلقى إشعار "تم قبول عرضك"
- [ ] شاحن يقبل عرضاً → باقي الناقلين يتلقون إشعار "تم اختيار ناقل آخر"
- [ ] شاحن يلغي طلب → الناقلون الذين قدّموا عروضاً يتلقون إشعار
- [ ] طلب ينتهي بـ cron → الشاحن يتلقى إشعار "انتهت صلاحية طلبك"

**commit:** `feat(transport): Sprint 2 - missing notifications (quote accepted/rejected, request cancelled/expired)`

---

# Sprint 3 — Request Editing & Repost
**الفجوات:** P1-6, P3-6 (3 مهام)

---

## S3-T1 — ربط endpoint تعديل الطلب (P1-6)

**الملف:** `apps/api/src/transport/transport-request.service.ts`

أضف دالة `update()`:
```typescript
async update(requestId: string, userId: string, dto: UpdateTransportRequestDto) {
  const req = await this.prisma.transportRequest.findUnique({
    where: { id: requestId },
  });
  if (!req) throw new NotFoundException('الطلب غير موجود');
  if (req.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل هذا الطلب');
  if (!['OPEN', 'QUOTED'].includes(req.status)) {
    throw new BadRequestException('لا يمكن تعديل الطلب بعد قبول عرض');
  }
  return this.prisma.transportRequest.update({
    where: { id: requestId },
    data: dto,
  });
}
```

**الملف:** `apps/api/src/transport/transport.controller.ts`

أضف endpoint (قبل `getRequest`):
```typescript
@UseGuards(JwtAuthGuard)
@Patch('requests/:id')
updateRequest(
  @Param('id') id: string,
  @Body() dto: UpdateTransportRequestDto,
  @CurrentUser() user: JwtPayload,
) {
  return this.transportRequestService.update(id, user.sub, dto);
}
```

**الملف:** `apps/web/src/features/transport/api.ts`

أضف دالة:
```typescript
updateRequest(id: string, data: Partial<CreateRequestDto>) {
  return apiRequest<TransportRequest>(`/transport/requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
```

**الملف:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`

أضف زرار "تعديل" لكل طلب بحالة OPEN أو QUOTED:
```tsx
{(req.status === 'OPEN' || req.status === 'QUOTED') && (
  <Link
    href={`/transport/requests/${req.id}/edit`}
    className="btn-outline text-xs px-3 py-1.5"
  >
    تعديل
  </Link>
)}
```

**ملف جديد:** `apps/web/src/app/[locale]/transport/requests/[id]/edit/page.tsx`

```typescript
'use client';
// صفحة تعديل تعيد استخدام نموذج CreateRequest مع بيانات الطلب المحمّلة مسبقاً
// 1. جلب بيانات الطلب الحالية
// 2. تعبئة النموذج بالبيانات
// 3. عند الحفظ → PATCH /transport/requests/:id
// 4. redirect لـ /transport/my-requests بعد النجاح

export default function EditRequestPage({ params }: { params: { id: string } }) {
  // استخدم نفس CreateRequestWizard لكن بـ defaultValues من الطلب الحالي
  // وعدّل onSubmit ليستدعي updateRequest بدل createRequest
}
```

**التحقق بعد التعديل `npx tsc --noEmit`**

---

## S3-T2 — إعادة نشر طلب منتهي الصلاحية (P3-6 جزء 1)

**الملف:** `apps/api/src/transport/transport-request.service.ts`

أضف دالة `repost()`:
```typescript
async repost(requestId: string, userId: string) {
  const req = await this.prisma.transportRequest.findUnique({
    where: { id: requestId },
  });
  if (!req) throw new NotFoundException();
  if (req.userId !== userId) throw new ForbiddenException();
  if (req.status !== 'EXPIRED') {
    throw new BadRequestException('يمكن إعادة النشر للطلبات المنتهية الصلاحية فقط');
  }
  return this.prisma.transportRequest.update({
    where: { id: requestId },
    data: {
      status: 'OPEN',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}
```

**الملف:** `apps/api/src/transport/transport.controller.ts`

```typescript
@UseGuards(JwtAuthGuard)
@Post('requests/:id/repost')
repostRequest(
  @Param('id') id: string,
  @CurrentUser() user: JwtPayload,
) {
  return this.transportRequestService.repost(id, user.sub);
}
```

**الملف:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`

أضف زرار "إعادة نشر":
```tsx
{req.status === 'EXPIRED' && (
  <button
    onClick={() => handleRepost(req.id)}
    className="btn-secondary text-xs px-3 py-1.5"
  >
    إعادة نشر
  </button>
)}
```

أضف دالة `handleRepost`:
```typescript
const handleRepost = async (id: string) => {
  try {
    await transportApi.repostRequest(id);
    toast.success('تم إعادة نشر الطلب بنجاح');
    load(activeTab); // إعادة تحميل القائمة
  } catch {
    toast.error('تعذّرت إعادة النشر');
  }
};
```

---

## S3-T3 — نسخ طلب موجود (P3-6 جزء 2)

**الملف:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`

أضف زرار "نسخ":
```tsx
<button
  onClick={() => handleDuplicate(req)}
  className="btn-ghost text-xs px-3 py-1.5"
>
  نسخ
</button>
```

أضف دالة `handleDuplicate`:
```typescript
const handleDuplicate = (req: TransportRequest) => {
  // احفظ البيانات في sessionStorage
  sessionStorage.setItem('transport_draft', JSON.stringify({
    serviceType: req.serviceType,
    fromGovernorate: req.fromGovernorate,
    fromAddress: req.fromAddress,
    toGovernorate: req.toGovernorate,
    toAddress: req.toAddress,
    cargoDescription: req.cargoDescription,
    budgetMin: req.budgetMin,
    budgetMax: req.budgetMax,
  }));
  router.push('/transport/new');
};
```

**الملف:** `apps/web/src/features/transport/components/CreateRequestWizard.tsx`

في أعلى الـ component أضف:
```typescript
useEffect(() => {
  const draft = sessionStorage.getItem('transport_draft');
  if (draft) {
    try {
      methods.reset({ ...methods.getValues(), ...JSON.parse(draft) });
      sessionStorage.removeItem('transport_draft');
    } catch {
      sessionStorage.removeItem('transport_draft');
    }
  }
}, []); // مرة واحدة عند الـ mount
```

---

## ✅ نهاية Sprint 3

```bash
cd apps/api && npx tsc --noEmit && npm run build
cd apps/web && npx tsc --noEmit && npm run build
```

**Checklist:**
- [ ] PATCH /transport/requests/:id موجود ويعمل
- [ ] زرار "تعديل" يظهر فقط لطلبات OPEN أو QUOTED
- [ ] زرار "إعادة نشر" يظهر فقط لطلبات EXPIRED
- [ ] بعد "إعادة نشر" → الطلب يصبح OPEN مرة ثانية
- [ ] زرار "نسخ" → يفتح الـ wizard مع البيانات محمّلة

**commit:** `feat(transport): Sprint 3 - request editing endpoint, repost expired, duplicate request`

---

# Sprint 4 — Rating & Reviews System
**الفجوات:** P1-1, P2-9 (نظام كامل)

---

## S4-T1 — Prisma Schema للتقييمات

**الملف:** `apps/api/prisma/schema.prisma`

ابحث عن model TransportBooking وأضف relation:
```prisma
// في TransportBooking:
review TransportReview?
```

أضف model جديد (بعد TransportBooking):
```prisma
model TransportReview {
  id         String   @id @default(cuid())
  bookingId  String   @unique
  booking    TransportBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  reviewerId String
  reviewer   User     @relation("TransportReviewsGiven", fields: [reviewerId], references: [id])
  carrierId  String
  carrier    CarrierProfile @relation(fields: [carrierId], references: [id])
  rating     Int
  comment    String?
  createdAt  DateTime @default(now())

  @@index([carrierId])
  @@index([reviewerId])
}
```

في model CarrierProfile أضف:
```prisma
reviews TransportReview[]
```

في model User أضف:
```prisma
transportReviewsGiven TransportReview[] @relation("TransportReviewsGiven")
```

```bash
cd apps/api
npx prisma migrate dev --name add-transport-reviews
npx prisma generate
```

---

## S4-T2 — Review Service

**ملف جديد:** `apps/api/src/transport/transport-review.service.ts`

```typescript
import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { USER_SELECT } from '../common/constants';

@Injectable()
export class TransportReviewService {
  constructor(private prisma: PrismaService) {}

  async createReview(bookingId: string, shipperId: string, dto: { rating: number; comment?: string }) {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('التقييم يجب أن يكون بين 1 و 5');
    }

    const booking = await this.prisma.transportBooking.findUnique({
      where: { id: bookingId },
      include: {
        request: { select: { userId: true } },
        quote: { include: { carrier: { select: { id: true, userId: true } } } },
      },
    });

    if (!booking) throw new NotFoundException('الحجز غير موجود');
    if (booking.request.userId !== shipperId) throw new ForbiddenException();
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('يمكن التقييم فقط بعد اكتمال الرحلة');
    }

    const existing = await this.prisma.transportReview.findUnique({ where: { bookingId } });
    if (existing) throw new ConflictException('تم تقييم هذه الرحلة مسبقاً');

    const review = await this.prisma.transportReview.create({
      data: {
        bookingId,
        reviewerId: shipperId,
        carrierId: booking.quote.carrier.id,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
    });

    // تحديث averageRating و reviewCount
    const stats = await this.prisma.transportReview.aggregate({
      where: { carrierId: booking.quote.carrier.id },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await this.prisma.carrierProfile.update({
      where: { id: booking.quote.carrier.id },
      data: {
        averageRating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
        reviewCount: stats._count._all,
      },
    });

    return review;
  }

  async getCarrierReviews(carrierId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transportReview.findMany({
        where: { carrierId },
        include: { reviewer: { select: USER_SELECT } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transportReview.count({ where: { carrierId } }),
    ]);
    return { items, total, page, limit };
  }

  async getBookingReview(bookingId: string) {
    return this.prisma.transportReview.findUnique({
      where: { bookingId },
      include: { reviewer: { select: USER_SELECT } },
    });
  }
}
```

---

## S4-T3 — Review Endpoints في Controller

**الملف:** `apps/api/src/transport/transport.controller.ts`

أضف الـ endpoints:
```typescript
@UseGuards(JwtAuthGuard)
@Post('bookings/:id/review')
createReview(
  @Param('id') id: string,
  @Body() dto: { rating: number; comment?: string },
  @CurrentUser() user: JwtPayload,
) {
  return this.transportReviewService.createReview(id, user.sub, dto);
}

@Get('carriers/:id/reviews')
getCarrierReviews(
  @Param('id') carrierId: string,
  @Query('page') page = '1',
) {
  return this.transportReviewService.getCarrierReviews(carrierId, Number(page));
}

@UseGuards(JwtAuthGuard)
@Get('bookings/:id/review')
getBookingReview(@Param('id') id: string) {
  return this.transportReviewService.getBookingReview(id);
}
```

أضف `TransportReviewService` في providers في module.

---

## S4-T4 — Review Form في Booking Detail

**الملف:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`

أضف state للتقييم:
```typescript
const [review, setReview] = useState<{ rating: number; comment: string; submitted: boolean } | null>(null);
const [existingReview, setExistingReview] = useState<TransportReview | null>(null);

// في useEffect بعد تحميل الحجز:
if (data.status === 'COMPLETED') {
  const rev = await transportApi.getBookingReview(id).catch(() => null);
  setExistingReview(rev);
}
```

أضف في JSX بعد بطاقة معلومات الحجز:
```tsx
{/* قسم التقييم — للشاحن فقط بعد الاكتمال */}
{isShipper && booking.status === 'COMPLETED' && (
  <section className="card-base p-4">
    <h3 className="font-semibold mb-3">تقييم الناقل</h3>
    {existingReview ? (
      // عرض التقييم المُقدَّم
      <div className="flex flex-col gap-2">
        <StarRating value={existingReview.rating} readOnly />
        {existingReview.comment && (
          <p className="text-sm text-[var(--color-on-surface-muted)]">{existingReview.comment}</p>
        )}
        <p className="text-xs text-[var(--color-on-surface-muted)]">
          تم تقديم التقييم
        </p>
      </div>
    ) : (
      // نموذج التقييم
      <div className="flex flex-col gap-3">
        <StarRatingInput
          value={reviewRating}
          onChange={setReviewRating}
        />
        <textarea
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          placeholder="أضف تعليقاً (اختياري)"
          className="w-full px-3 py-2 rounded-xl border border-[var(--color-outline-variant)] text-sm resize-none"
          rows={3}
        />
        <button
          onClick={handleSubmitReview}
          disabled={!reviewRating || submittingReview}
          className="btn-primary w-full justify-center"
        >
          {submittingReview ? 'جارٍ الإرسال...' : 'إرسال التقييم'}
        </button>
      </div>
    )}
  </section>
)}
```

**ملف جديد:** `apps/web/src/features/transport/components/StarRating.tsx`

```typescript
// مكوّن بسيط لعرض وإدخال التقييم بالنجوم (1-5)
// يدعم mode: 'display' | 'input'
// في الـ display: يعرض نجوم ذهبية حسب الرقم
// في الـ input: نجوم قابلة للضغط
```

---

## S4-T5 — Reviews في صفحة الناقل العامة (P2-9)

**الملف:** `apps/web/src/app/[locale]/transport/carriers/[id]/page.tsx`

أضف جلب التقييمات:
```typescript
const [reviews, setReviews] = useState<{ items: TransportReview[]; total: number } | null>(null);

useEffect(() => {
  transportApi.getCarrierReviews(carrierId).then(setReviews);
}, [carrierId]);
```

أضف قسم التقييمات في الـ JSX:
```tsx
<section className="mt-6">
  <h3 className="font-semibold mb-4">
    تقييمات العملاء
    {reviews?.total ? ` (${reviews.total})` : ''}
  </h3>
  {!reviews?.items.length ? (
    <p className="text-sm text-[var(--color-on-surface-muted)] text-center py-6">
      لا توجد تقييمات بعد
    </p>
  ) : (
    <div className="flex flex-col gap-3">
      {reviews.items.map((review) => (
        <div key={review.id} className="card-base p-4">
          <div className="flex items-center justify-between mb-2">
            <StarRating value={review.rating} readOnly size="sm" />
            <span className="text-xs text-[var(--color-on-surface-muted)]">
              {new Date(review.createdAt).toLocaleDateString('ar-OM')}
            </span>
          </div>
          {review.comment && (
            <p className="text-sm text-[var(--color-on-surface)]">{review.comment}</p>
          )}
          <p className="text-xs text-[var(--color-on-surface-muted)] mt-2">
            {review.reviewer?.displayName ?? 'مستخدم'}
          </p>
        </div>
      ))}
    </div>
  )}
</section>
```

---

## ✅ نهاية Sprint 4

```bash
cd apps/api && npx tsc --noEmit && npm run build
cd apps/web && npx tsc --noEmit && npm run build
```

**Checklist:**
- [ ] Migration نجحت بدون أخطاء
- [ ] POST /transport/bookings/:id/review يعمل
- [ ] GET /transport/carriers/:id/reviews يعمل
- [ ] averageRating يتحدث بعد كل تقييم
- [ ] شاحن يرى نموذج التقييم بعد الاكتمال
- [ ] صفحة الناقل العامة تعرض التقييمات

**commit:** `feat(transport): Sprint 4 - rating & review system (schema, service, endpoints, UI)`

---

# Sprint 5 — In-Booking Chat & Proof of Delivery
**الفجوات:** P2-1, P2-4

---

## S5-T1 — ربط المحادثة بالحجز

**الملف:** `apps/api/prisma/schema.prisma`

ابحث عن model TransportBooking وأضف:
```prisma
conversationId String? @unique
conversation   Conversation? @relation(fields: [conversationId], references: [id])
```

ابحث عن model Conversation وأضف:
```prisma
transportBooking TransportBooking?
```

```bash
npx prisma migrate dev --name link-booking-to-conversation
npx prisma generate
```

---

## S5-T2 — إنشاء محادثة عند قبول العرض

**الملف:** `apps/api/src/transport/transport-quote.service.ts`

في `acceptQuote()` بعد إنشاء الحجز:
```typescript
// إنشاء محادثة بين الشاحن والناقل
const conversation = await this.prisma.conversation.create({
  data: {
    participants: {
      create: [
        { userId: shipperId },
        { userId: acceptedQuote.carrier.userId },
      ],
    },
  },
});

// ربط المحادثة بالحجز
await this.prisma.transportBooking.update({
  where: { id: booking.id },
  data: { conversationId: conversation.id },
});
```

---

## S5-T3 — Chat في صفحة الحجز

**الملف:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`

ابحث عن مكوّن المحادثة المستخدم في باقي التطبيق (قد يكون `ConversationView` أو `ChatWindow`).

إذا وجدته، أضف في الـ JSX:
```tsx
{booking.conversationId && (
  <section className="mt-6">
    <h3 className="font-semibold mb-3">المحادثة مع {isShipper ? 'الناقل' : 'الشاحن'}</h3>
    <ConversationView conversationId={booking.conversationId} />
  </section>
)}
```

إذا لم تجد مكوّناً جاهزاً، أضف رابطاً فقط:
```tsx
{booking.conversationId && (
  <Link
    href={`/chat/${booking.conversationId}`}
    className="btn-outline w-full justify-center flex items-center gap-2"
  >
    <MessageSquare size={16} />
    فتح المحادثة
  </Link>
)}
```

---

## S5-T4 — Proof of Delivery (P2-4)

**الملف:** `apps/api/prisma/schema.prisma`

في model TransportBooking أضف:
```prisma
deliveryNote     String?
completedAt      DateTime?
```

```bash
npx prisma migrate dev --name add-delivery-fields
npx prisma generate
```

**الملف:** `apps/api/src/transport/transport-booking.service.ts`

في دالة `complete()` أضف `completedAt`:
```typescript
data: {
  status: 'COMPLETED',
  completedAt: new Date(),
  // deliveryNote يُمرَّر من الـ DTO إذا متاح
}
```

**الملف:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`

بدل زرار "استلمت" المباشر، أضف confirmation:
```tsx
const [showCompleteModal, setShowCompleteModal] = useState(false);

// بدل onClick المباشر:
<button onClick={() => setShowCompleteModal(true)} className="btn-primary">
  استلمت — إتمام الرحلة
</button>

{showCompleteModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="card-base p-6 max-w-sm w-full flex flex-col gap-4">
      <h3 className="font-bold text-lg">تأكيد استلام البضاعة</h3>
      <p className="text-sm text-[var(--color-on-surface-muted)]">
        بعد التأكيد ستُوسَّم الرحلة كمكتملة ولا يمكن التراجع
      </p>
      <textarea
        value={deliveryNote}
        onChange={(e) => setDeliveryNote(e.target.value)}
        placeholder="ملاحظات التسليم (اختياري)"
        className="w-full px-3 py-2 rounded-xl border border-[var(--color-outline-variant)] text-sm resize-none"
        rows={2}
      />
      <div className="flex gap-3">
        <button
          onClick={() => setShowCompleteModal(false)}
          className="btn-ghost flex-1"
        >
          إلغاء
        </button>
        <button
          onClick={handleComplete}
          className="btn-primary flex-1"
        >
          تأكيد الاستلام
        </button>
      </div>
    </div>
  </div>
)}
```

---

## ✅ نهاية Sprint 5

```bash
cd apps/api && npx tsc --noEmit && npm run build
cd apps/web && npx tsc --noEmit && npm run build
```

**Checklist:**
- [ ] قبول عرض → ينشئ محادثة تلقائياً
- [ ] صفحة الحجز تعرض رابط/مكوّن المحادثة
- [ ] زرار "استلمت" يعرض modal تأكيد
- [ ] modal يحتوي حقل ملاحظة اختياري

**commit:** `feat(transport): Sprint 5 - in-booking chat link, proof of delivery modal`

---

# Sprint 6 — Admin Web UI
**الفجوات:** P2-8

---

## S6-T1 — صفحة Dashboard للـ Admin

**ملف جديد:** `apps/web/src/app/[locale]/admin/transport/page.tsx`

```typescript
// يستدعي: GET /admin/transport/stats
// يعرض:
// - إجمالي الطلبات (مقسّمة حسب الحالة)
// - إجمالي الحجوزات
// - إجمالي الناقلين (مقسّمة: متاح/غير متاح)
// - طلبات انتهت صلاحيتها هذا الأسبوع
// - آخر 10 طلبات منشورة (جدول بسيط)
```

---

## S6-T2 — صفحة إدارة الطلبات

**ملف جديد:** `apps/web/src/app/[locale]/admin/transport/requests/page.tsx`

```typescript
// يستدعي: GET /admin/transport/requests (مع pagination وفلاتر)
// جدول يعرض: ID مختصر، نوع الخدمة، المحافظة، الحالة، تاريخ الإنشاء
// Actions: تغيير الحالة (PATCH)، حذف (DELETE)
```

---

## S6-T3 — صفحة إدارة الناقلين

**ملف جديد:** `apps/web/src/app/[locale]/admin/transport/carriers/page.tsx`

```typescript
// يستدعي: GET /admin/transport/carriers
// جدول يعرض: اسم الشركة، المحافظة، عدد الرحلات، التقييم، التحقق (isVerified)
// Actions: تفعيل/تعطيل الـ availability، تعديل isVerified
```

---

## S6-T4 — رابط في Admin Navigation

**الملف:** ابحث عن `apps/web/src/app/[locale]/admin/` عن ملف التنقل أو الـ layout.

أضف روابط:
```typescript
{ href: '/admin/transport', label: 'النقل — Dashboard' },
{ href: '/admin/transport/requests', label: 'الطلبات' },
{ href: '/admin/transport/carriers', label: 'الناقلون' },
```

---

## ✅ نهاية Sprint 6

```bash
cd apps/web && npx tsc --noEmit && npm run build
```

**commit:** `feat(transport): Sprint 6 - admin web UI for transport (dashboard, requests, carriers)`

---

# ترتيب التنفيذ والأولويات

```
Sprint 1 (Role/Onboarding)   ← أهم — يجب أولاً لأنه يؤثر على اكتساب الناقلين
     ↓
Sprint 2 (Notifications)      ← أهم — الناقلون لا يعلمون بحالة عروضهم
     ↓
Sprint 3 (Request Editing)    ← مهم — DTO موجود، فقط ربط
     ↓
Sprint 4 (Reviews)            ← مهم — بدون تقييمات لا يوجد ثقة في المنصة
     ↓
Sprint 5 (Chat + Delivery)    ← متوسط — تحسين التواصل
     ↓
Sprint 6 (Admin UI)           ← آخراً — ليس للمستخدم النهائي
```

---

# إجمالي الخطة

| Sprint | الموضوع | عدد الفجوات | الملفات المتأثرة |
|--------|---------|-------------|-----------------|
| Sprint 1 | Role & Onboarding | 6 | BrowseContent, requests/[id], carriers/register, SubNavBar, transport/page |
| Sprint 2 | Notifications | 4 | transport-quote.service, transport-request.service, notifications.ts |
| Sprint 3 | Request Editing | 3 | transport.controller, transport-request.service, my-requests/page, edit/page (جديد) |
| Sprint 4 | Reviews | 2 | schema.prisma (migration), review.service (جديد), transport.controller, bookings/[id], carriers/[id] |
| Sprint 5 | Chat & Delivery | 2 | schema.prisma (migration), transport-quote.service, bookings/[id] |
| Sprint 6 | Admin UI | 1 | admin/transport/* (3 ملفات جديدة) |
| **المجموع** | | **23 فجوة** | |
