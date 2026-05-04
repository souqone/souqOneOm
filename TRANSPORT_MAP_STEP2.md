# Transport — Add Leaflet Map to Step 2 (Route Picker)

## GOAL
Add an optional Leaflet/OpenStreetMap map to Step 2 of the transport request wizard.
The user can click on the map to pin the from-location and to-location.
Coordinates are saved as `fromLat`, `fromLng`, `toLat`, `toLng` — all optional.

---

## READ FIRST

```
- apps/web/src/features/transport/components/Step2Route.tsx
- apps/web/src/features/transport/components/CreateRequestWizard.tsx
- apps/web/src/features/transport/types.ts
```

---

## STEP 1 — Install dependency

```bash
pnpm add leaflet @types/leaflet
```

---

## STEP 2 — Create RouteMap component

Create: `apps/web/src/features/transport/components/RouteMap.tsx`

This component:
- Loads Leaflet CSS dynamically (no external CDN link needed in layout)
- Centers on Oman: `[23.5859, 58.4059]`, zoom 6
- On click → calls `onFromChange(lat, lng)` or `onToChange(lat, lng)` depending on `mode` prop
- Green SVG pin for "from", amber SVG pin for "to"
- Dashed amber polyline between the two points when both are set
- `fitBounds` to show both pins when both are set

```tsx
'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, Marker, Polyline } from 'leaflet'

export interface RouteMapProps {
  mode: 'from' | 'to'
  fromLatLng: [number, number] | null
  toLatLng: [number, number] | null
  onFromChange: (latLng: [number, number]) => void
  onToChange: (latLng: [number, number]) => void
}

const OMAN_CENTER: [number, number] = [23.5859, 58.4059]
const OMAN_ZOOM = 6

function makePinIcon(L: typeof import('leaflet'), color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
    <path fill="${color}" stroke="white" stroke-width="1.5"
      d="M12 0C7.6 0 4 3.6 4 8c0 6 8 16 8 16s8-10 8-16c0-4.4-3.6-8-8-8z"/>
    <circle fill="white" cx="12" cy="8" r="3.5"/>
  </svg>`
  return L.divIcon({ html: svg, className: '', iconSize: [24, 32], iconAnchor: [12, 32] })
}

export default function RouteMap({ mode, fromLatLng, toLatLng, onFromChange, onToChange }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<LeafletMap | null>(null)
  const fromMarker   = useRef<Marker | null>(null)
  const toMarker     = useRef<Marker | null>(null)
  const polyline     = useRef<Polyline | null>(null)
  const modeRef      = useRef(mode)
  const onFromRef    = useRef(onFromChange)
  const onToRef      = useRef(onToChange)

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { onFromRef.current = onFromChange }, [onFromChange])
  useEffect(() => { onToRef.current  = onToChange  }, [onToChange])

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    import('leaflet').then((L) => {
      if (!containerRef.current || mapRef.current) return
      const map = L.map(containerRef.current, { center: OMAN_CENTER, zoom: OMAN_ZOOM })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        modeRef.current === 'from'
          ? onFromRef.current([lat, lng])
          : onToRef.current([lat, lng])
      })
      mapRef.current = map
    })

    return () => { mapRef.current?.remove(); mapRef.current = null }
  }, [])

  // Sync from marker
  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then((L) => {
      fromMarker.current?.remove()
      fromMarker.current = null
      if (fromLatLng) {
        fromMarker.current = L.marker(fromLatLng, { icon: makePinIcon(L, '#22c55e') })
          .addTo(mapRef.current!).bindPopup('نقطة التحميل')
      }
      syncLine(L)
      fitView(mapRef.current!)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLatLng])

  // Sync to marker
  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then((L) => {
      toMarker.current?.remove()
      toMarker.current = null
      if (toLatLng) {
        toMarker.current = L.marker(toLatLng, { icon: makePinIcon(L, '#f59e0b') })
          .addTo(mapRef.current!).bindPopup('نقطة التسليم')
      }
      syncLine(L)
      fitView(mapRef.current!)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toLatLng])

  function syncLine(L: typeof import('leaflet')) {
    polyline.current?.remove(); polyline.current = null
    if (fromLatLng && toLatLng) {
      polyline.current = L.polyline([fromLatLng, toLatLng], {
        color: '#f59e0b', weight: 3, dashArray: '8 6', opacity: 0.8,
      }).addTo(mapRef.current!)
    }
  }

  function fitView(map: LeafletMap) {
    import('leaflet').then((L) => {
      if (fromLatLng && toLatLng)
        map.fitBounds(L.latLngBounds([fromLatLng, toLatLng]), { padding: [50, 50] })
      else if (fromLatLng) map.setView(fromLatLng, 10)
      else if (toLatLng)   map.setView(toLatLng,   10)
    })
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-[var(--color-outline-variant)]"
      style={{ height: '280px' }}
    />
  )
}
```

---

## STEP 3 — Update CreateRequestWizard.tsx

### 3a — Add 4 optional fields to the zod schema

In `createRequestSchema`, after `toAddress`, add:

```ts
fromLat: z.number().nullable().optional(),
fromLng: z.number().nullable().optional(),
toLat:   z.number().nullable().optional(),
toLng:   z.number().nullable().optional(),
```

### 3b — Add defaults in useForm

```ts
defaultValues: {
  requiresHelper: false,
  isFlexible: true,
  timingType: 'asap',
  fromLat: null,
  fromLng: null,
  toLat:   null,
  toLng:   null,
},
```

### 3c — Pass coordinates to the API in onSubmit

In the submit handler, pass the coordinates along:

```ts
await transportApi.createRequest({
  ...data,
  fromLat: data.fromLat ?? undefined,
  fromLng: data.fromLng ?? undefined,
  toLat:   data.toLat   ?? undefined,
  toLng:   data.toLng   ?? undefined,
})
```

---

## STEP 4 — Replace Step2Route.tsx

Replace `apps/web/src/features/transport/components/Step2Route.tsx` with the version below.

Changes vs original:
1. `fromLat`, `fromLng`, `toLat`, `toLng` wired via `useController`
2. A collapsible "تحديد الموقع على الخريطة" section at the bottom (closed by default)
3. Inside it: two toggle buttons (from / to mode) + `<RouteMap />` (loaded via `dynamic({ ssr: false })`)
4. After placing the from-pin, mode auto-switches to "to"
5. Coordinate badge shown next to each section header when set
6. "مسح الدبابيس" button clears all coordinates
7. Coordinates are optional — form submits fine without them

```
DO NOT change any className, style, padding, margin, color, or any visual
property in the existing sections (from/to address fields).
Only ADD the new map section below them.
```

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useFormContext, useController } from 'react-hook-form'
import { MapPin, ArrowDown, Navigation, LocateFixed } from 'lucide-react'
import { useState, useCallback } from 'react'
import type { CreateRequestFormData } from './CreateRequestWizard'
import { OMAN_GOVERNORATES } from '@/features/transport/constants'

const RouteMap = dynamic(() => import('./RouteMap'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] flex items-center justify-center"
      style={{ height: '280px' }}
    >
      <span className="text-sm text-[var(--color-on-surface-muted)]">جارٍ تحميل الخريطة…</span>
    </div>
  ),
})

export default function Step2Route() {
  const { register, watch, control, formState: { errors } } = useFormContext<CreateRequestFormData>()

  const fromGov = watch('fromGovernorate')
  const toGov   = watch('toGovernorate')

  const { field: fromLatField } = useController({ name: 'fromLat', control })
  const { field: fromLngField } = useController({ name: 'fromLng', control })
  const { field: toLatField }   = useController({ name: 'toLat',   control })
  const { field: toLngField }   = useController({ name: 'toLng',   control })

  const [pinMode, setPinMode] = useState<'from' | 'to'>('from')
  const [showMap, setShowMap] = useState(false)

  const fromLatLng: [number, number] | null =
    fromLatField.value != null && fromLngField.value != null
      ? [fromLatField.value as number, fromLngField.value as number]
      : null

  const toLatLng: [number, number] | null =
    toLatField.value != null && toLngField.value != null
      ? [toLatField.value as number, toLngField.value as number]
      : null

  const handleFromChange = useCallback(([lat, lng]: [number, number]) => {
    fromLatField.onChange(lat)
    fromLngField.onChange(lng)
    setPinMode('to')
  }, [fromLatField, fromLngField])

  const handleToChange = useCallback(([lat, lng]: [number, number]) => {
    toLatField.onChange(lat)
    toLngField.onChange(lng)
  }, [toLatField, toLngField])

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl text-[var(--color-on-surface)] mb-1" style={{ fontWeight: 700 }}>
          مسار الرحلة
        </h2>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          حدّد نقطة التحميل ونقطة التسليم
        </p>
      </div>

      {/* Route visual — COPY AS-IS from original */}
      {(fromGov || toGov) && (
        <div className="bg-[var(--color-surface-container)] rounded-2xl p-4 mb-5 flex items-center gap-3">
          <div className="flex flex-col items-center gap-0">
            <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-green-50" />
            <div className="w-0 border-r-2 border-dashed border-amber-400 h-8 my-1" />
            <div className="w-3 h-3 rounded-full border-2 border-amber-500 bg-amber-50" />
          </div>
          <div className="flex flex-col justify-between gap-2 min-w-0 flex-1">
            <span className="text-sm font-bold text-[var(--color-on-surface)] truncate">{fromGov || '—'}</span>
            <span className="text-sm font-bold text-[var(--color-on-surface)] truncate">{toGov || '—'}</span>
          </div>
          {fromGov && toGov && (
            <span className="text-xs font-bold text-[var(--color-brand-amber)] bg-[var(--color-brand-amber)]/10 px-2.5 py-1 rounded-full">
              مسار محدد ✓
            </span>
          )}
        </div>
      )}

      <div className="space-y-5">
        {/* From section — COPY AS-IS from original, only add coordinate badge next to the h3 */}
        <div className="border border-[var(--color-outline-variant)] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center">
              <MapPin size={13} className="text-green-600" />
            </div>
            <h3 className="font-bold text-sm text-[var(--color-on-surface)]">نقطة التحميل</h3>
            {fromLatLng && (
              <span className="mr-auto text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                <LocateFixed size={10} className="inline ml-0.5" />
                {fromLatLng[0].toFixed(4)}, {fromLatLng[1].toFixed(4)}
              </span>
            )}
          </div>
          {/* ... rest of from section exactly as-is from original ... */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                المحافظة <span className="text-[var(--color-error)]">*</span>
              </label>
              <select
                {...register('fromGovernorate')}
                className={`input-base text-sm ${errors.fromGovernorate ? 'border-[var(--color-error)]' : ''}`}
              >
                <option value="">اختر المحافظة</option>
                {OMAN_GOVERNORATES.map((gov) => (
                  <option key={`from-gov-step2-${gov}`} value={gov}>{gov}</option>
                ))}
              </select>
              {errors.fromGovernorate && (
                <p className="mt-1 text-xs text-[var(--color-error)] font-semibold">{errors.fromGovernorate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                المدينة / الحي
                <span className="text-[var(--color-on-surface-muted)] font-normal mr-1">(اختياري)</span>
              </label>
              <input {...register('fromCity')} type="text" placeholder="مثال: السيب، الخوير" className="input-base text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
              العنوان التفصيلي <span className="text-[var(--color-error)]">*</span>
            </label>
            <p className="text-[11px] text-[var(--color-on-surface-muted)] mb-2">
              أدخل العنوان الكامل لموقع التحميل لمساعدة المزودين في التخطيط
            </p>
            <textarea
              {...register('fromAddress')}
              rows={2}
              placeholder="مثال: المنطقة الصناعية، السيب، بالقرب من دوار الميناء"
              className={`input-base text-sm resize-none ${errors.fromAddress ? 'border-[var(--color-error)]' : ''}`}
            />
            {errors.fromAddress && (
              <p className="mt-1 text-xs text-[var(--color-error)] font-semibold">{errors.fromAddress.message}</p>
            )}
          </div>
        </div>

        {/* Arrow — COPY AS-IS */}
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-full bg-[var(--color-brand-amber)]/10 flex items-center justify-center">
            <ArrowDown size={18} className="text-[var(--color-brand-amber)]" />
          </div>
        </div>

        {/* To section — COPY AS-IS from original, only add coordinate badge next to the h3 */}
        <div className="border border-[var(--color-outline-variant)] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-amber-50 border-2 border-amber-500 flex items-center justify-center">
              <MapPin size={13} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-sm text-[var(--color-on-surface)]">نقطة التسليم</h3>
            {toLatLng && (
              <span className="mr-auto text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <LocateFixed size={10} className="inline ml-0.5" />
                {toLatLng[0].toFixed(4)}, {toLatLng[1].toFixed(4)}
              </span>
            )}
          </div>
          {/* ... rest of to section exactly as-is from original ... */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                المحافظة <span className="text-[var(--color-error)]">*</span>
              </label>
              <select
                {...register('toGovernorate')}
                className={`input-base text-sm ${errors.toGovernorate ? 'border-[var(--color-error)]' : ''}`}
              >
                <option value="">اختر المحافظة</option>
                {OMAN_GOVERNORATES.map((gov) => (
                  <option key={`to-gov-step2-${gov}`} value={gov}>{gov}</option>
                ))}
              </select>
              {errors.toGovernorate && (
                <p className="mt-1 text-xs text-[var(--color-error)] font-semibold">{errors.toGovernorate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                المدينة / الحي
                <span className="text-[var(--color-on-surface-muted)] font-normal mr-1">(اختياري)</span>
              </label>
              <input {...register('toCity')} type="text" placeholder="مثال: نزوى، صلالة" className="input-base text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
              العنوان التفصيلي <span className="text-[var(--color-error)]">*</span>
            </label>
            <p className="text-[11px] text-[var(--color-on-surface-muted)] mb-2">
              أدخل العنوان الكامل لموقع التسليم
            </p>
            <textarea
              {...register('toAddress')}
              rows={2}
              placeholder="مثال: حي الحمراء، نزوى، بالقرب من مستشفى نزوى"
              className={`input-base text-sm resize-none ${errors.toAddress ? 'border-[var(--color-error)]' : ''}`}
            />
            {errors.toAddress && (
              <p className="mt-1 text-xs text-[var(--color-error)] font-semibold">{errors.toAddress.message}</p>
            )}
          </div>
        </div>

        {/* ── NEW: Map section ─────────────────────────────────── */}
        <div className="border border-[var(--color-outline-variant)] rounded-2xl p-4">
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-sm font-bold text-[var(--color-on-surface)]"
          >
            <span className="flex items-center gap-2">
              <Navigation size={15} className="text-[var(--color-brand-navy)]" />
              تحديد الموقع على الخريطة
              <span className="text-xs font-normal text-[var(--color-on-surface-muted)]">(اختياري)</span>
            </span>
            <span className="text-[var(--color-on-surface-muted)] text-xs">{showMap ? '▲ إخفاء' : '▼ عرض'}</span>
          </button>

          {showMap && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
                <span className="text-[var(--color-on-surface-variant)]">اضغط على الخريطة لتحديد:</span>
                <button
                  type="button"
                  onClick={() => setPinMode('from')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    pinMode === 'from'
                      ? 'bg-green-500 text-white'
                      : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-current opacity-80" />
                  نقطة التحميل {fromLatLng && '✓'}
                </button>
                <button
                  type="button"
                  onClick={() => setPinMode('to')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    pinMode === 'to'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-current opacity-80" />
                  نقطة التسليم {toLatLng && '✓'}
                </button>
                {(fromLatLng || toLatLng) && (
                  <button
                    type="button"
                    onClick={() => {
                      fromLatField.onChange(null); fromLngField.onChange(null)
                      toLatField.onChange(null);   toLngField.onChange(null)
                    }}
                    className="mr-auto text-xs text-[var(--color-error)] hover:underline"
                  >
                    مسح الدبابيس
                  </button>
                )}
              </div>

              <RouteMap
                mode={pinMode}
                fromLatLng={fromLatLng}
                toLatLng={toLatLng}
                onFromChange={handleFromChange}
                onToChange={handleToChange}
              />

              <p className="text-[11px] text-[var(--color-on-surface-muted)]">
                الإحداثيات اختيارية — تساعد الناقلين على تقدير المسافة بدقة أكبر.
              </p>
            </div>
          )}
        </div>
        {/* ── END new map section ──────────────────────────────── */}

      </div>
    </div>
  )
}
```

---

## VERIFY

```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
0 errors required.

Then check:
1. `/transport/new` → Step 2 loads, form fields exactly as before
2. Click "تحديد الموقع على الخريطة" → map appears
3. Click map → green pin appears, mode auto-switches to "to"
4. Click again → amber pin appears, dashed line connects them
5. Coordinate badges show under each section header
6. "مسح الدبابيس" removes both pins
7. Submit without ever opening map → works fine
8. No TypeScript errors
