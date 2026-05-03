# IDE Agent Prompt — Transport Marketplace Frontend (v2)

## Context

You are working on **SouqOne** (سوق وان), Next.js 15 App Router + TypeScript strict + Tailwind CSS 4.

---

## ⚠️ أهم قاعدة في هذا الـ prompt

**اتبع الأنماط الموجودة بدقة — لا تخترع patterns جديدة.**

الـ reference files:
- Browse: `apps/web/src/features/listings/components/ListingsPageShell.tsx`
- Detail: `apps/web/src/app/[locale]/sale/[type]/[id]/sale-detail-client.tsx`
- Shell pattern: `apps/web/src/features/sale/components/SalePageShell.tsx`

---

## Conventions (من الكود الموجود)

```typescript
// ✅ CSS variables فقط — لا hex
className="bg-surface-container text-on-surface"
className="bg-primary text-on-primary"
className="border-outline-variant/40"
className="text-on-surface-variant"

// ✅ clsx للـ conditional classes
import { clsx } from 'clsx'

// ✅ Material Symbols للأيقونات الديكورية
<span className="material-symbols-outlined">inventory_2</span>

// ✅ Lucide للأيقونات داخل الكومبوننتس
import { Loader2, X, ChevronLeft } from 'lucide-react'

// ✅ next-intl للترجمة
const t = useTranslations('transport')

// ✅ i18n navigation
import { Link } from '@/i18n/navigation'
import { useRouter } from '@/i18n/navigation'

// ✅ Skeleton pattern (من sale-detail-client)
function TransportSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-48 bg-surface-container-high rounded mb-5" />
      ...
    </div>
  )
}

// ✅ Load more pattern (من ListingsPageShell)
<button onClick={() => setPage(p => p + 1)} disabled={isFetching}>
  {isFetching ? <Loader2 className="animate-spin" /> : 'تحميل المزيد'}
</button>

// ✅ Empty state pattern
<div className="flex flex-col items-center justify-center py-16 text-center border border-outline-variant/30 rounded-xl bg-background">
  <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
    <Icon className="text-on-surface-variant/40" />
  </div>
  <h3>لا توجد نتائج</h3>
</div>

// ✅ Active indicator (من CategoryBar)
isActive
  ? 'bg-primary text-on-primary shadow-md'
  : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'

// ✅ Filter sidebar sticky (من ListingsPageShell)
<aside className="hidden lg:block w-72 shrink-0 sticky top-20 h-fit">

// ✅ Mobile FAB للفلاتر
<div className="lg:hidden fixed left-4 z-40" style={{ bottom: 'calc(90px + env(safe-area-inset-bottom, 0px))' }}>
```

---

## Translation Keys

أضف في `apps/web/src/messages/ar.json` تحت `"transport"`:

```json
"transport": {
  "title": "النقل والشحن",
  "subtitle": "اطلب خدمة نقل أو قدّم عرضاً",
  "newRequest": "أنشئ طلب نقل",
  "browseRequests": "تصفح الطلبات",
  "becomeCarrier": "سجّل كمزود",
  "serviceTypes": {
    "GOODS": "بضائع عامة",
    "FURNITURE": "أثاث",
    "CONSTRUCTION": "مواد بناء",
    "HEAVY": "معدات ثقيلة",
    "BACKLOAD": "حمولات راجعة",
    "EQUIPMENT": "تأجير معدات"
  },
  "status": {
    "OPEN": "مفتوح",
    "QUOTED": "وصلت عروض",
    "ACCEPTED": "تم القبول",
    "IN_PROGRESS": "جارٍ التنفيذ",
    "COMPLETED": "مكتمل",
    "CANCELLED": "ملغى",
    "EXPIRED": "منتهي"
  },
  "quoteStatus": {
    "PENDING": "بانتظار الرد",
    "ACCEPTED": "مقبول",
    "REJECTED": "مرفوض",
    "WITHDRAWN": "مسحوب"
  },
  "fields": {
    "from": "من",
    "to": "إلى",
    "cargo": "وصف الحمولة",
    "weight": "الوزن (طن)",
    "scheduledAt": "التوقيت",
    "asap": "أسرع وقت ممكن",
    "flexible": "مرن في الوقت",
    "budgetMin": "الحد الأدنى للميزانية",
    "budgetMax": "الحد الأقصى للميزانية",
    "requiresHelper": "يحتاج عمال مساعدة",
    "notes": "ملاحظات إضافية",
    "price": "السعر (ر.ع.)",
    "estimatedHours": "وقت التسليم المتوقع (ساعة)",
    "message": "رسالة للشيبر"
  },
  "actions": {
    "submitQuote": "قدّم عرضاً",
    "acceptQuote": "قبول العرض",
    "withdrawQuote": "سحب العرض",
    "cancelRequest": "إلغاء الطلب",
    "startTrip": "بدأت التحميل",
    "completeTrip": "استلمت — اكتمل",
    "cancelBooking": "إلغاء"
  },
  "steps": {
    "serviceType": "نوع الخدمة",
    "route": "المسار",
    "cargo": "الحمولة",
    "timing": "التوقيت والميزانية",
    "review": "مراجعة ونشر"
  },
  "empty": {
    "requests": "لا توجد طلبات متاحة حالياً",
    "quotes": "لم تصلك عروض بعد",
    "myRequests": "لم تنشئ أي طلبات بعد",
    "myQuotes": "لم تقدم أي عروض بعد"
  },
  "filters": "الفلاتر",
  "sortBy": "ترتيب",
  "loadMore": "تحميل المزيد",
  "remaining": "{n} متبقي",
  "noResults": "لا توجد نتائج",
  "tryChangeFilters": "جرّب تغيير الفلاتر",
  "clearFilters": "مسح الفلاتر"
}
```

---

## Types

`apps/web/src/features/transport/types.ts`:

```typescript
export type TransportServiceType =
  | 'GOODS' | 'FURNITURE' | 'CONSTRUCTION'
  | 'HEAVY' | 'BACKLOAD' | 'EQUIPMENT'

export type TransportRequestStatus =
  | 'OPEN' | 'QUOTED' | 'ACCEPTED'
  | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'

export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'

export type VehicleType =
  | 'PICKUP' | 'VAN' | 'TRUCK_SMALL' | 'TRUCK_LARGE'
  | 'TRAILER' | 'EXCAVATOR' | 'TIPPER' | 'CRANE' | 'OTHER'

export interface CarrierProfile {
  id: string
  userId: string
  companyName?: string
  bio?: string
  vehicleTypes: VehicleType[]
  serviceTypes: TransportServiceType[]
  governorate: string
  city?: string
  contactPhone?: string
  whatsapp?: string
  isAvailable: boolean
  isVerified: boolean
  completedTrips: number
  averageRating: number
  reviewCount: number
  user: {
    id: string
    username: string
    displayName?: string
    avatarUrl?: string
    isVerified: boolean
  }
  createdAt: string
}

export interface TransportRequest {
  id: string
  userId: string
  user: {
    id: string
    username: string
    displayName?: string
    avatarUrl?: string
    isVerified: boolean
  }
  serviceType: TransportServiceType
  status: TransportRequestStatus
  fromGovernorate: string
  fromCity?: string
  fromAddress: string
  fromLat?: number
  fromLng?: number
  toGovernorate: string
  toCity?: string
  toAddress: string
  toLat?: number
  toLng?: number
  cargoDescription: string
  weightTons?: number
  requiresHelper: boolean
  notes?: string
  scheduledAt?: string
  isFlexible: boolean
  budgetMin?: number
  budgetMax?: number
  currency: string
  viewCount: number
  expiresAt?: string
  _count: { quotes: number }
  booking?: TransportBooking
  createdAt: string
}

export interface TransportQuote {
  id: string
  requestId: string
  carrierId: string
  carrier: CarrierProfile
  status: QuoteStatus
  price: number
  currency: string
  estimatedHours?: number
  message?: string
  createdAt: string
}

export interface TransportBooking {
  id: string
  requestId: string
  quoteId: string
  status: TransportRequestStatus
  confirmedAt: string
  completedAt?: string
  cancelledAt?: string
  cancellationReason?: string
  quote?: TransportQuote
  request?: TransportRequest
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface CreateRequestForm {
  serviceType: TransportServiceType | ''
  fromGovernorate: string
  fromCity: string
  fromAddress: string
  fromLat?: number
  fromLng?: number
  toGovernorate: string
  toCity: string
  toAddress: string
  toLat?: number
  toLng?: number
  cargoDescription: string
  weightTons?: number
  requiresHelper: boolean
  notes: string
  scheduledAt: string
  isFlexible: boolean
  budgetMin?: number
  budgetMax?: number
}
```

---

## Constants

`apps/web/src/features/transport/constants.ts`:

```typescript
import type { TransportServiceType, VehicleType, TransportRequestStatus } from './types'

export const SERVICE_TYPE_ICONS: Record<TransportServiceType, string> = {
  GOODS: 'inventory_2',
  FURNITURE: 'chair',
  CONSTRUCTION: 'construction',
  HEAVY: 'precision_manufacturing',
  BACKLOAD: 'swap_horiz',
  EQUIPMENT: 'agriculture',
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  PICKUP: 'بيك أب',
  VAN: 'فان',
  TRUCK_SMALL: 'شاحنة صغيرة',
  TRUCK_LARGE: 'شاحنة كبيرة',
  TRAILER: 'تريلا',
  EXCAVATOR: 'حفار',
  TIPPER: 'قلاب',
  CRANE: 'رافعة',
  OTHER: 'أخرى',
}

export const OMAN_GOVERNORATES = [
  'مسقط', 'ظفار', 'مسندم', 'البريمي', 'الداخلية',
  'الشرقية الشمالية', 'الشرقية الجنوبية', 'الوسطى',
  'الباطنة الشمالية', 'الباطنة الجنوبية', 'الظاهرة',
]

// نفس نمط badge النظام الموجود — dot ملوّن فقط
export const STATUS_DOT_COLORS: Record<TransportRequestStatus, string> = {
  OPEN: 'bg-green-500',
  QUOTED: 'bg-amber-500',
  ACCEPTED: 'bg-blue-500',
  IN_PROGRESS: 'bg-purple-500',
  COMPLETED: 'bg-green-600',
  CANCELLED: 'bg-red-500',
  EXPIRED: 'bg-gray-400',
}

export const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'الأحدث' },
  { value: 'createdAt_asc', label: 'الأقدم' },
  { value: 'budgetMax_desc', label: 'الميزانية الأعلى' },
  { value: 'scheduledAt_asc', label: 'الأقرب موعداً' },
]
```

---

## API Layer

`apps/web/src/features/transport/api.ts`:

```typescript
const BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transport`

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const transportApi = {
  getRequests: (params: Record<string, string>) =>
    fetch(`${BASE}/requests?${new URLSearchParams(params)}`).then(r => r.json()),
  getRequest: (id: string) =>
    fetch(`${BASE}/requests/${id}`).then(r => r.json()),
  createRequest: (body: unknown) =>
    fetch(`${BASE}/requests`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(r => r.json()),
  cancelRequest: (id: string) =>
    fetch(`${BASE}/requests/${id}/cancel`, { method: 'PATCH', headers: authHeaders() }).then(r => r.json()),
  myRequests: (page = 1) =>
    fetch(`${BASE}/requests/my?page=${page}`, { headers: authHeaders() }).then(r => r.json()),
  getQuotes: (requestId: string) =>
    fetch(`${BASE}/requests/${requestId}/quotes`, { headers: authHeaders() }).then(r => r.json()),
  submitQuote: (requestId: string, body: unknown) =>
    fetch(`${BASE}/requests/${requestId}/quotes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(r => r.json()),
  acceptQuote: (quoteId: string) =>
    fetch(`${BASE}/quotes/${quoteId}/accept`, { method: 'PATCH', headers: authHeaders() }).then(r => r.json()),
  withdrawQuote: (quoteId: string) =>
    fetch(`${BASE}/quotes/${quoteId}/withdraw`, { method: 'PATCH', headers: authHeaders() }).then(r => r.json()),
  myQuotes: (page = 1) =>
    fetch(`${BASE}/quotes/my?page=${page}`, { headers: authHeaders() }).then(r => r.json()),
  markInProgress: (bookingId: string) =>
    fetch(`${BASE}/bookings/${bookingId}/start`, { method: 'PATCH', headers: authHeaders() }).then(r => r.json()),
  completeBooking: (bookingId: string) =>
    fetch(`${BASE}/bookings/${bookingId}/complete`, { method: 'PATCH', headers: authHeaders() }).then(r => r.json()),
  cancelBooking: (bookingId: string, reason?: string) =>
    fetch(`${BASE}/bookings/${bookingId}/cancel`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ reason }) }).then(r => r.json()),
  myBookings: (role: 'shipper' | 'carrier', page = 1) =>
    fetch(`${BASE}/bookings/my?role=${role}&page=${page}`, { headers: authHeaders() }).then(r => r.json()),
  getCarriers: (params: Record<string, string>) =>
    fetch(`${BASE}/carriers?${new URLSearchParams(params)}`).then(r => r.json()),
  getCarrier: (id: string) =>
    fetch(`${BASE}/carriers/${id}`).then(r => r.json()),
  createCarrierProfile: (body: unknown) =>
    fetch(`${BASE}/carrier-profile`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(r => r.json()),
  updateCarrierProfile: (body: unknown) =>
    fetch(`${BASE}/carrier-profile`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) }).then(r => r.json()),
  getMyCarrierProfile: () =>
    fetch(`${BASE}/carrier-profile/me`, { headers: authHeaders() }).then(r => r.json()),
  setAvailability: (isAvailable: boolean) =>
    fetch(`${BASE}/carrier-profile/availability`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ isAvailable }) }).then(r => r.json()),
}
```

---

## Shared Components

`apps/web/src/features/transport/components/`

---

### `TransportRequestCard.tsx`

**Reference:** `ListingCard.tsx` في features/listings — نفس الـ horizontal card style

```
Layout (RTL horizontal card):
┌─────────────────────────────────────────────────────────┐
│ [أيقونة نوع الخدمة]  من: مسقط  ←→  إلى: صلالة  [حالة •] │
│                       وصف الحمولة (مقطوع)               │
│                       الوزن · التوقيت    الميزانية ر.ع.  │
│                       عروض: 3 · منذ ساعتين              │
└─────────────────────────────────────────────────────────┘
```

- Service icon: `material-symbols-outlined` في دائرة `bg-amber-500/10 text-amber-600`
- Status badge: نقطة ملوّنة + نص — **نفس نمط badges النظام** (dark semi-transparent background + colored dot)
- Route: `من {fromGovernorate} ← إلى {toGovernorate}` مع سهم RTL
- Budget: `{min} - {max} ر.ع.` أو `"غير محدد"`
- Clicking → `/transport/requests/{id}`
- Hover: `hover:border-outline-variant/60 hover:shadow-sm transition-all`

```typescript
interface TransportRequestCardProps {
  request: TransportRequest
  showActions?: boolean
}
```

---

### `ServiceTypeSelector.tsx`

Grid 2×3 cards للاختيار:

```
┌──────────┐ ┌──────────┐ ┌──────────┐
│  📦      │ │  🪑      │ │  🏗️     │
│ بضائع   │ │  أثاث   │ │مواد بناء │
└──────────┘ └──────────┘ └──────────┘
```

- كل card: `material-symbols-outlined` كبير + اسم
- Selected: `border-2 border-[var(--color-brand-amber)] bg-amber-500/5`
- Unselected: `border border-outline-variant/40 hover:border-outline-variant/80`
- Transition: `transition-all duration-200`

```typescript
interface Props {
  value: TransportServiceType | ''
  onChange: (type: TransportServiceType) => void
}
```

---

### `RouteMap.tsx`

**مهم:** Leaflet لا يدعم SSR — استخدم dynamic import:

```typescript
// RouteMap.tsx (wrapper)
import dynamic from 'next/dynamic'
const RouteMapClient = dynamic(() => import('./RouteMapClient'), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-surface-container animate-pulse rounded-2xl" />,
})
export { RouteMapClient as RouteMap }

// RouteMapClient.tsx (الكود الفعلي)
'use client'
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
```

Props:
```typescript
interface Props {
  from?: { lat: number; lng: number; label: string }
  to?: { lat: number; lng: number; label: string }
  height?: string // default '300px'
}
```

إذا مفيش coordinates: اعرض placeholder بدل الخريطة:
```
<div className="h-[300px] bg-surface-container rounded-2xl flex items-center justify-center">
  <span className="text-on-surface-variant text-sm">الخريطة غير متاحة</span>
</div>
```

---

### `RequestStatusTimeline.tsx`

Timeline أفقي — **نفس نمط stepper الموجود في add-listing:**

```
OPEN ──●── QUOTED ──○── ACCEPTED ──○── IN_PROGRESS ──○── COMPLETED
```

- مكتمل: `bg-primary text-on-primary`
- حالي: `bg-amber-500 text-white ring-2 ring-amber-500/30`
- قادم: `bg-surface-container border border-outline-variant/40 text-on-surface-variant`
- الخطوط الواصلة: `bg-primary` للمكتملة، `bg-outline-variant/40` للقادمة

---

### `QuoteCard.tsx`

```
┌──────────────────────────────────────────────────┐
│ [Avatar] اسم الكاري  ★4.8  رحلات: 23  [موثّق✓] │
│                                                   │
│          150.000 ر.ع.    ⏱ 4 ساعات تقريباً      │
│          "رسالة المزود هنا..."                    │
│                                                   │
│                          [زر قبول العرض]          │
└──────────────────────────────────────────────────┘
```

- السعر: `text-3xl font-bold text-on-surface`
- زر القبول: يظهر فقط إذا `isOwner && quote.status === 'PENDING'`
- زر السحب: يظهر إذا `isCarrier && quote.status === 'PENDING'`
- `QuoteStatus` badge: نفس نمط النقطة الملوّنة

---

### `BookingActions.tsx`

```typescript
interface Props {
  booking: TransportBooking
  userRole: 'shipper' | 'carrier' | 'other'
  onAction: (action: 'start' | 'complete' | 'cancel') => void
  isLoading?: boolean
}
```

- `carrier` + `ACCEPTED`: زر "بدأت التحميل" (amber)
- `shipper` + `IN_PROGRESS`: زر "استلمت — اكتمل" (green)
- كلاهما + ليس `COMPLETED`: زر "إلغاء" (outlined red)

---

## Pages

---

### Page 1: `/transport` — الرئيسية

`apps/web/src/app/[locale]/transport/page.tsx`

**Reference:** hero section من `apps/web/src/features/home/`

**Sections:**

**Hero:**
```
bg-[var(--color-brand-navy)] text-white
عنوان كبير + subtitle + زرين:
- "أنشئ طلب نقل" → /transport/new  (bg-amber-500)
- "أنا مزود" → /transport/carrier/register  (border border-white/40)
```

**أنواع الخدمات:**
```
عنوان: "ماذا تريد أن تنقل؟"
Grid 3×2 — كل card تنقل لـ /transport/browse?serviceType=X
```

**آخر الطلبات:**
```
fetch أحدث 6 طلبات (server-side)
{requests.map(r => <TransportRequestCard request={r} />)}
زر "عرض الكل" → /transport/browse
```

**CTA للمزودين:**
```
bg-surface-container rounded-2xl p-8
"هل لديك شاحنة أو معدة؟ انضم كمزود واستقبل طلبات في منطقتك"
زر → /transport/carrier/register
```

---

### Page 2: `/transport/new` — إنشاء طلب

`apps/web/src/app/[locale]/transport/new/page.tsx`
`apps/web/src/features/transport/CreateRequestFlow.tsx` (client component)

**Reference:** `/add-listing/[type]` — نفس الـ stepper pattern

**Progress bar:**
```tsx
<div className="h-1 bg-surface-container-high rounded-full overflow-hidden mb-8">
  <div
    className="h-full bg-amber-500 transition-all duration-500"
    style={{ width: `${(step / 5) * 100}%` }}
  />
</div>
```

**Step indicator:**
```
[1] نوع الخدمة  [2] المسار  [3] الحمولة  [4] التوقيت  [5] مراجعة
```
نفس نمط `RequestStatusTimeline`.

**الخطوة 1 — نوع الخدمة:**
```tsx
<ServiceTypeSelector value={form.serviceType} onChange={v => setForm(f => ({...f, serviceType: v}))} />
```
زر "التالي" يظهر فقط بعد الاختيار.

**الخطوة 2 — المسار:**
```
من:
  [select: المحافظة] [input: المدينة]
  [input: العنوان التفصيلي]

[سهم RTL فاصل]

إلى:
  [select: المحافظة] [input: المدينة]
  [input: العنوان التفصيلي]

<RouteMap /> (اختياري — يظهر إذا أدخل coordinates)
```

**الخطوة 3 — الحمولة:**
```
[textarea: وصف الحمولة *]
[number: الوزن بالطن]
[toggle: يحتاج عمال مساعدة]
[textarea: ملاحظات إضافية]
```

**الخطوة 4 — التوقيت والميزانية:**
```
[toggle] أسرع وقت ممكن / حدد وقتاً
  ↳ إذا حدد: [datetime-local input]
  ↳ [checkbox] مرن في الوقت

الميزانية:
[checkbox] لا أريد تحديد ميزانية
  ↳ إذا محدد: [number: من] [number: إلى] ر.ع.
```

**الخطوة 5 — مراجعة:**
```
Summary card لكل المعلومات
[زر نشر الطلب]
  ↳ onClick: transportApi.createRequest(form)
  ↳ success: router.push(`/transport/requests/${result.id}`)
```

**Transitions:** Framer Motion `AnimatePresence` بين الخطوات:
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={step}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
  >
    {/* step content */}
  </motion.div>
</AnimatePresence>
```

---

### Page 3: `/transport/browse` — تصفح الطلبات

`apps/web/src/app/[locale]/transport/browse/page.tsx`
`apps/web/src/features/transport/TransportBrowseShell.tsx` (client)

**Reference:** `ListingsPageShell.tsx` — **نفس الـ layout بالضبط**

```
<Navbar />

[FilterSidebar — sticky — lg:block hidden]    [قائمة الطلبات]

<Footer />

[Mobile FAB للفلاتر — lg:hidden]
```

**FilterSidebar للنقل:**
```
- نوع الخدمة (checkboxes مع أيقونات Material Symbols)
- من محافظة (select من OMAN_GOVERNORATES)
- إلى محافظة (select)
- الترتيب (select من SORT_OPTIONS)
```

**قائمة الطلبات:**
- نفس pattern `ListingCard` — `space-y-2`
- `{requests.map(r => <TransportRequestCard request={r} />)}`
- Load more button (نفس نمط ListingsPageShell)
- Loading: skeleton cards `animate-pulse`
- Empty states: نفس pattern الموجود (بدون فلاتر / مع فلاتر)

**URL params:** الفلاتر تُحفظ في `useSearchParams` + `router.push`

---

### Page 4: `/transport/requests/[id]` — تفاصيل الطلب

`apps/web/src/app/[locale]/transport/requests/[id]/page.tsx`
`apps/web/src/features/transport/RequestDetailClient.tsx` (client)

**Reference:** `sale-detail-client.tsx` + `SalePageShell.tsx` — **نفس الـ pattern**

```typescript
// page.tsx — Server Component
export async function generateMetadata({ params }) {
  const { id } = await params
  const data = await fetch(`${BASE}/transport/requests/${id}`).then(r => r.json())
  return {
    title: `نقل ${data.serviceType} من ${data.fromGovernorate} | سوق وان`,
  }
}

export default function RequestPage() {
  return <RequestDetailClient />
}
```

```typescript
// RequestDetailClient.tsx — Client Component
// نفس نمط SaleDetailClient: useParams → fetch → skeleton → error → content
```

**Skeleton:** نفس نمط `SalePageSkeleton` — `animate-pulse` blocks

**Layout (بعد التحميل):**
```
max-w-5xl mx-auto px-4 md:px-8 pt-16 pb-28 lg:pb-16

<RequestStatusTimeline status={request.status} />

grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8:

  [تفاصيل — يمين]:
    - من/إلى (addresses كاملة)
    - <RouteMap from={...} to={...} />
    - تفاصيل الحمولة (وصف، وزن، يحتاج مساعدة)
    - التوقيت والميزانية
    - صاحب الطلب (avatar + اسم + تاريخ)

  [Sidebar — يسار]:
    إذا صاحب الطلب (request.userId === currentUser.id):
      - عدد العروض
      - {quotes.map(q => <QuoteCard isOwner={true} />)}
      - زر إلغاء الطلب

    إذا مزود:
      - إذا قدّم عرض: <QuoteCard isCarrier={true} /> + زر سحب
      - إذا لم يقدم: فورم تقديم عرض (price + estimatedHours + message)

    إذا زائر:
      - "سجّل دخول لتقديم عرض"

    إذا status = ACCEPTED/IN_PROGRESS/COMPLETED:
      - العرض المقبول فقط
      - زر "عرض الحجز" → /transport/bookings/{booking.id}
```

---

### Page 5: `/transport/bookings/[id]` — تفاصيل الحجز

`apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`

**Reference:** `/bookings` page — نفس نمط tracking

**Layout:** `max-w-2xl mx-auto px-4 py-8`

```
[حالة الحجز الكبيرة + أيقونة]
<RequestStatusTimeline status={booking.status} />

[تفاصيل الرحلة]
  - من → إلى
  - نوع الخدمة + وصف الحمولة

[العرض المقبول]
  - avatar + اسم الكاري + تقييم
  - السعر المتفق + الوقت المتوقع
  - [زر واتساب] إذا whatsapp متاح

<BookingActions booking={booking} userRole={...} onAction={...} />
```

---

### Page 6: `/transport/carrier/register`

`apps/web/src/app/[locale]/transport/carrier/register/page.tsx`

**Reference:** form style من `/add-listing/[type]` — نفس input classes

فورم في صفحة واحدة (مش stepper):
```
max-w-2xl mx-auto px-4 py-8

[companyName — اختياري]
[bio — textarea — اختياري]
[vehicleTypes — checkboxes grid مع أيقونات]
[serviceTypes — checkboxes grid]
[governorate — select]
[city — text]
[contactPhone]
[whatsapp]

[زر إنشاء البروفايل]
```

Input classes (نفس الموجود):
```tsx
className="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
```

بعد submit → redirect لـ `/transport/carrier/dashboard`

---

### Page 7: `/transport/carrier/dashboard`

`apps/web/src/app/[locale]/transport/carrier/dashboard/page.tsx`

**لا reference — بناء من الصفر**

```
<Navbar />

max-w-4xl mx-auto px-4 py-8:

  [Availability Toggle — بارز في الأعلى]:
    <div className="rounded-2xl bg-surface-container p-6 flex items-center justify-between mb-6">
      <div>
        <h2>أنا متاح الآن</h2>
        <p className="text-sm text-on-surface-variant">عندما تكون متاحاً ستظهر للعملاء</p>
      </div>
      [Toggle button كبير — amber إذا متاح / gray إذا لا]
    </div>

  [Stats Grid — 4 cards]:
    grid grid-cols-2 md:grid-cols-4 gap-4 mb-8
    - عروض مقدمة
    - عروض مقبولة
    - رحلات مكتملة
    - متوسط التقييم ★

  [الطلبات القريبة]:
    عنوان: "طلبات في منطقتك"
    fetch: /transport/requests?fromGovernorate={carrier.governorate}&status=OPEN&limit=5
    {requests.map(r => <TransportRequestCard request={r} showActions />)}

  [عروضي الأخيرة]:
    عنوان: "آخر عروضي"
    fetch: /transport/quotes/my?limit=5
    {quotes.map(q => <QuoteCard />)}

<Footer />
```

---

### Page 8: `/transport/my-requests`

`apps/web/src/app/[locale]/transport/my-requests/page.tsx`

**Reference:** `/my-listings` — نفس الـ filter tabs pattern

```
<Navbar />

Filter tabs (نفس نمط my-listings):
[الكل] [مفتوح] [وصلت عروض] [مكتمل] [ملغى]

{requests.map(r => (
  <TransportRequestCard key={r.id} request={r} />
))}

Empty state لكل tab

<Footer />
```

---

### Page 9: `/transport/my-quotes`

`apps/web/src/app/[locale]/transport/my-quotes/page.tsx`

**Reference:** نفس نمط my-listings

Filter tabs: [الكل] [بانتظار الرد] [مقبول] [مرفوض]

كل عرض يعرض:
```
┌─────────────────────────────────────────────────┐
│ [نوع الخدمة أيقونة]  من X → إلى Y              │
│ عرضي: 150.000 ر.ع.          [حالة العرض badge]  │
│ [زر سحب العرض] إذا PENDING                      │
│ [زر عرض الحجز] إذا ACCEPTED                     │
└─────────────────────────────────────────────────┘
```

---

### Page 10: `/transport/carrier/[id]` — بروفايل المزود

`apps/web/src/app/[locale]/transport/carrier/[id]/page.tsx`

**Reference:** `/seller/[id]` — نفس الـ public profile layout

```
<Navbar />

max-w-3xl mx-auto px-4 py-8:

  [Header]:
    avatar كبير + اسم + isVerified badge
    isAvailable badge: "متاح الآن ●" (green) أو "غير متاح" (gray)

  [Stats row]:
    رحلات مكتملة · تقييم ★ · عضو منذ

  [chips]: أنواع المركبات + أنواع الخدمات
    className="px-3 py-1 rounded-full bg-surface-container text-sm"

  [المنطقة]

  [bio]

  [زر واتساب] إذا whatsapp متاح:
    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500 text-white"

<Footer />
```

---

## Navigation

في `apps/web/src/components/layout/navbar.tsx` — أضف رابط:
```tsx
<Link href="/transport">النقل والشحن</Link>
```

---

## Layout

`apps/web/src/app/[locale]/transport/layout.tsx`:
```typescript
export default function TransportLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>
}
```

---

## Execution Order

1. Types + Constants + API layer
2. Shared components:
   - `TransportRequestCard`
   - `ServiceTypeSelector`
   - `RouteMap` + `RouteMapClient`
   - `RequestStatusTimeline`
   - `QuoteCard`
   - `BookingActions`
3. `/transport` — الرئيسية
4. `/transport/new` — CreateRequestFlow
5. `/transport/browse` — TransportBrowseShell
6. `/transport/requests/[id]` — RequestDetailClient
7. `/transport/bookings/[id]`
8. `/transport/carrier/register`
9. `/transport/carrier/dashboard`
10. `/transport/my-requests`
11. `/transport/my-quotes`
12. `/transport/carrier/[id]`
13. Layout + Navbar link

---

## Rules

- **لا نص عربي hardcoded** — كل شيء من `useTranslations('transport')`
- **لا hex colors** — CSS variables فقط
- **RTL everywhere** — لا `ltr` hardcoded
- **Leaflet** بـ `dynamic import + ssr: false` فقط
- **Loading skeleton** على كل API call (نفس نمط `animate-pulse`)
- **Error state** بـ `<ErrorState />` component الموجود
- **Mobile-first** — responsive على كل الشاشات
- اتبع **نفس class names** الموجودة في الكود (`bg-surface-container`, `text-on-surface-variant`, إلخ)
- **لا تستخدم** `any` في TypeScript
