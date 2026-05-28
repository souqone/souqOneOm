'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap } from 'leaflet'

// Fallback governorate coordinates for Oman
const GOV_COORDS: Record<string, [number, number]> = {
  'مسقط':          [23.5880, 58.3829],
  'ظفار':           [17.0194, 54.0934],
  'شمال الباطنة':  [24.1407, 56.2581],
  'جنوب الباطنة':  [23.4821, 57.5547],
  'شمال الشرقية': [22.5000, 59.5100],
  'جنوب الشرقية': [22.0000, 59.9000],
  'الداخلية':      [22.9333, 57.5333],
  'الظاهرة':       [23.2900, 56.2200],
  'الوسطى':        [20.5000, 56.5000],
  'البريمي':        [24.2311, 55.7575],
  'مسندم':         [26.1729, 56.1852],
}

export interface RouteMapViewProps {
  fromLat?: number | null
  fromLng?: number | null
  fromGovernorate?: string
  fromCity?: string
  fromAddress?: string
  fromLabel?: string
  toLat?: number | null
  toLng?: number | null
  toGovernorate?: string
  toCity?: string
  toAddress?: string
  toLabel?: string
  height?: number
}

async function nominatim(query: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=om`,
      { headers: { 'User-Agent': 'SouqOne/1.0', 'Accept-Language': 'ar' } }
    )
    const data: { lat: string; lon: string }[] = await res.json()
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
  } catch {}
  return null
}

export default function RouteMapView({
  fromLat, fromLng, fromGovernorate, fromCity, fromAddress,
  fromLabel = 'نقطة الانطلاق',
  toLat, toLng, toGovernorate, toCity, toAddress,
  toLabel = 'الوجهة',
  height = 260,
}: RouteMapViewProps) {
  const [geocoding, setGeocoding] = useState(false)

  const origin = fromLat && fromLng
    ? `${fromLat},${fromLng}`
    : [fromAddress, fromCity, fromGovernorate].filter(Boolean).join(', ')

  const destination = toLat && toLng
    ? `${toLat},${toLng}`
    : [toAddress, toCity, toGovernorate].filter(Boolean).join(', ')

  const directionsUrl = origin && destination
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`
    : null

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    async function init() {
      const L = await import('leaflet')
      if (cancelled || !containerRef.current || mapRef.current) return

      // Resolve from coordinates
      let fromCoords: [number, number] | null =
        fromLat && fromLng ? [fromLat, fromLng] : null
      let needsDelay = false
      if (!fromCoords) {
        setGeocoding(true)
        needsDelay = true
        const q = [fromAddress, fromCity, fromGovernorate, 'عُمان'].filter(Boolean).join(', ')
        fromCoords = await nominatim(q)
        if (!fromCoords && fromGovernorate) fromCoords = GOV_COORDS[fromGovernorate] ?? null
      }

      // Respect Nominatim rate limit (1 req/sec) only if geocoding was used
      if (needsDelay) {
        await new Promise(r => setTimeout(r, 1100))
      }
      if (cancelled) return

      // Resolve to coordinates
      let toCoords: [number, number] | null =
        toLat && toLng ? [toLat, toLng] : null
      if (!toCoords) {
        const q = [toAddress, toCity, toGovernorate, 'عُمان'].filter(Boolean).join(', ')
        toCoords = await nominatim(q)
        if (!toCoords && toGovernorate) toCoords = GOV_COORDS[toGovernorate] ?? null
      }

      setGeocoding(false)
      if (cancelled || !containerRef.current || mapRef.current) return

      const center: [number, number] = fromCoords ?? toCoords ?? [23.5880, 58.3829]
      const map = L.map(containerRef.current, {
        center,
        zoom: 7,
        scrollWheelZoom: false,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      function pinIcon(color: string) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
          <path fill="${color}" stroke="white" stroke-width="1.5" d="M12 0C7.6 0 4 3.6 4 8c0 6 8 16 8 16s8-10 8-16c0-4.4-3.6-8-8-8z"/>
          <circle fill="white" cx="12" cy="8" r="3.5"/>
        </svg>`
        return L.divIcon({ html: svg, className: '', iconSize: [24, 32], iconAnchor: [12, 32] })
      }

      if (fromCoords) {
        L.marker(fromCoords, { icon: pinIcon('#22c55e') })
          .addTo(map)
          .bindPopup(`<b>${fromLabel}</b><br/>${fromAddress ?? fromGovernorate ?? ''}`)
      }

      if (toCoords) {
        L.marker(toCoords, { icon: pinIcon('#ef4444') })
          .addTo(map)
          .bindPopup(`<b>${toLabel}</b><br/>${toAddress ?? toGovernorate ?? ''}`)
      }

      if (fromCoords && toCoords) {
        L.polyline([fromCoords, toCoords], {
          color: '#f59e0b', weight: 3, dashArray: '8 6', opacity: 0.85,
        }).addTo(map)
        map.fitBounds(L.latLngBounds([fromCoords, toCoords]), { padding: [40, 40] })
      } else if (fromCoords) {
        map.setView(fromCoords, 10)
      } else if (toCoords) {
        map.setView(toCoords, 10)
      }

      mapRef.current = map
    }

    init()
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div
          ref={containerRef}
          className="w-full rounded-xl overflow-hidden border border-[var(--color-outline-variant)]"
          style={{ height }}
        />
        {geocoding && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
            <span className="text-xs font-bold text-[var(--color-on-surface-variant)] animate-pulse">جارٍ تحديد الموقع بدقة…</span>
          </div>
        )}
      </div>
      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-[var(--color-outline-variant)] text-sm font-bold text-[var(--color-brand-navy)] bg-[var(--color-surface-container)] hover:bg-[var(--color-brand-navy)] hover:text-white transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          فتح الاتجاهات في خرائط Google
        </a>
      )}
      <div className="flex items-center gap-4 text-xs text-[var(--color-on-surface-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
          {fromLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
          {toLabel}
        </span>
      </div>
    </div>
  )
}
