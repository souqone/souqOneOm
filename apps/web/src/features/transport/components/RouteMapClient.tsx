'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface RouteMapClientProps {
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
}

export function RouteMapClient({ fromLat, fromLng, toLat, toLng }: RouteMapClientProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map)

    const fromMarker = L.marker([fromLat, fromLng], {
      icon: L.divIcon({
        className: 'bg-transparent',
        html: '<div class="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-md"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    }).addTo(map)

    const toMarker = L.marker([toLat, toLng], {
      icon: L.divIcon({
        className: 'bg-transparent',
        html: '<div class="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-md"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    }).addTo(map)

    const polyline = L.polyline(
      [
        [fromLat, fromLng],
        [toLat, toLng],
      ],
      { color: '#3b82f6', weight: 3, dashArray: '8 6' },
    ).addTo(map)

    const group = L.featureGroup([fromMarker, toMarker, polyline])
    map.fitBounds(group.getBounds().pad(0.15))

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [fromLat, fromLng, toLat, toLng])

  return <div ref={mapRef} className="w-full h-full rounded-xl" />
}
