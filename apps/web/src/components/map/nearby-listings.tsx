'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { haversineDistance } from '@/lib/geo-utils';
import { useTranslations, useLocale } from 'next-intl';
import { resolveLocationLabel } from '@/lib/location-data';

interface NearbyListing {
  id: string;
  title: string;
  price: string;
  currency: string;
  latitude: number | null;
  longitude: number | null;
  make: string;
  model: string;
  year: number;
  governorate: string | null;
  imageUrl?: string | null;
  listingType?: 'SALE' | 'RENTAL';
}

interface NearbyListingsProps {
  listings: NearbyListing[];
  maxItems?: number;
}

export default function NearbyListings({ listings, maxItems = 6 }: NearbyListingsProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'loading'>('prompt');

  useEffect(() => {
    // Check if we already have cached location
    const cachedLat = sessionStorage.getItem('userLat');
    const cachedLng = sessionStorage.getItem('userLng');
    if (cachedLat && cachedLng) {
      setUserLat(parseFloat(cachedLat));
      setUserLng(parseFloat(cachedLng));
      setPermissionState('granted');
    }
  }, []);

  function requestLocation() {
    if (!navigator.geolocation) {
      setPermissionState('denied');
      return;
    }

    setPermissionState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        setPermissionState('granted');
        sessionStorage.setItem('userLat', String(lat));
        sessionStorage.setItem('userLng', String(lng));
      },
      () => {
        setPermissionState('denied');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Filter listings that have coordinates and compute distance
  const withDistance = listings
    .filter(l => l.latitude && l.longitude && userLat && userLng)
    .map(l => ({
      ...l,
      distance: haversineDistance(userLat!, userLng!, l.latitude!, l.longitude!),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxItems);

  // If not granted yet, show prompt
  if (permissionState === 'prompt' || permissionState === 'loading') {
    return (
      <div className="bg-surface-container-lowest rounded-3xl p-8 text-center">
        <span className="material-symbols-outlined text-5xl text-primary/40 mb-4 block">near_me</span>
        <h3 className="text-xl font-extrabold mb-2">{tp('nearbyTitle')}</h3>
        <p className="text-on-surface-variant text-sm mb-6 max-w-md mx-auto">
          {tp('nearbyPermissionDesc')}
        </p>
        <button
          onClick={requestLocation}
          disabled={permissionState === 'loading'}
          className="bg-primary text-on-primary hover:brightness-110 rounded-lg shadow-ambient px-8 py-3.5 text-sm font-bold disabled:opacity-60"
        >
          {permissionState === 'loading' ? (
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              {tp('nearbyLocating')}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">my_location</span>
              {tp('nearbyLocateMe')}
            </span>
          )}
        </button>
      </div>
    );
  }

  if (permissionState === 'denied') {
    return null; // Don't show section if denied
  }

  if (withDistance.length === 0) {
    return null; // No nearby listings with coordinates
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-[3px] rounded-full bg-primary" />
            <span className="text-primary font-extrabold text-[11px] tracking-[0.2em] uppercase">{tp('nearbyLabel')}</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-on-surface">{tp('nearbyTitle')}</h2>
        </div>
        <Link href="/cars/browse" className="hidden sm:flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold text-sm group">
          {tp('nearbyViewAll')}
          <span className="material-symbols-outlined icon-flip text-lg rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1 transition-transform">arrow_back</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {withDistance.map((item) => (
          <Link
            key={item.id}
            href={`/sale/car/${item.id}`}
            className="bg-surface-container-lowest rounded-2xl overflow-hidden hover:shadow-xl transition-all group"
          >
            <div className="aspect-video relative overflow-hidden">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-surface-container-low flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">directions_car</span>
                </div>
              )}

              {/* Distance badge */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <span className="material-symbols-outlined text-sm text-primary">near_me</span>
                <span className="text-xs font-bold text-on-surface">
                  {item.distance < 1 ? tp('nearbyMeters', { distance: Math.round(item.distance * 1000) }) : tp('nearbyKm', { distance: item.distance })}
                </span>
              </div>

              {/* Type badge */}
              {item.listingType === 'RENTAL' && (
                <div className="absolute top-3 left-3 bg-primary/90 text-on-primary px-2.5 py-1 rounded-full text-[11px] font-bold">
                  {tp('nearbyRental')}
                </div>
              )}
            </div>

            <div className="p-4">
              <h4 className="font-bold text-on-surface text-sm line-clamp-1 mb-1">{item.title}</h4>
              <p className="text-xs text-on-surface-variant mb-2">
                {item.make} {item.model} · {item.year}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-primary font-extrabold">
                  {Number(item.price).toLocaleString('en-US')} <small className="text-xs font-medium text-on-surface-variant">{item.currency}</small>
                </span>
                {item.governorate && (
                  <span className="text-[11px] text-on-surface-variant flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">location_on</span>
                    {resolveLocationLabel(item.governorate, locale) ?? item.governorate}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
