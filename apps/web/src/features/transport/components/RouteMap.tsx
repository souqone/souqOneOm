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
