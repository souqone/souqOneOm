/**
 * Unified photo gallery component with Lightbox, Desktop Grid, and Mobile Swiper.
 * Extracted from cars/[id]/page.tsx for reuse across all listing types.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamic import for Lightbox (heavy component)
const Lightbox = dynamic(() => import('./Lightbox'), { ssr: false });

interface PhotoGalleryProps {
  images: string[];
  title: string;
  /** Material icon name for placeholder (default: 'image') */
  placeholderIcon?: string;
}

/**
 * Main photo gallery component.
 * Renders desktop grid + mobile swiper, manages lightbox state.
 */
export function PhotoGallery({ images, title, placeholderIcon = 'image' }: PhotoGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const handleShowAll = useCallback((idx: number) => {
    setLightboxIdx(idx);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxIdx(null);
  }, []);

  return (
    <>
      {lightboxIdx !== null && (
        <Lightbox
          images={images.map((url, i) => ({ id: String(i), url }))}
          startIndex={lightboxIdx}
          onClose={handleCloseLightbox}
        />
      )}

      {/* Desktop Grid */}
      <PhotoGrid
        images={images}
        title={title}
        onShowAll={handleShowAll}
        placeholderIcon={placeholderIcon}
      />

      {/* Mobile Swiper */}
      <MobileSwiper
        images={images}
        title={title}
        onShowAll={handleShowAll}
        placeholderIcon={placeholderIcon}
      />
    </>
  );
}

// ─── Desktop Photo Grid ────────────────────────────────────────────────────

interface PhotoGridProps {
  images: string[];
  title: string;
  onShowAll: (idx: number) => void;
  placeholderIcon: string;
}

function PhotoGrid({ images, title, onShowAll, placeholderIcon }: PhotoGridProps) {
  const count = images.length;

  const Placeholder = () => (
    <div className="w-full h-full bg-gradient-to-br from-surface-container-high/60 via-surface-container to-surface-container-low flex flex-col items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
      <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest/80 shadow-sm flex items-center justify-center border border-outline-variant/15">
        <span className="material-symbols-outlined text-2xl text-on-surface-variant/30">{placeholderIcon}</span>
      </div>
    </div>
  );

  const ShowAllBtn = () => (
    <button
      onClick={() => onShowAll(0)}
      className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-outline-variant/30 rounded-lg px-3 py-1.5 text-[12px] font-medium text-on-surface shadow-sm hover:bg-white transition-colors cursor-pointer z-10 flex items-center gap-1.5"
    >
      <span className="material-symbols-outlined text-sm">grid_view</span>
      عرض كل الصور ({count})
    </button>
  );

  // ── 0 images — placeholder ──
  if (count === 0) {
    return (
      <div className="hidden md:block relative">
        <div className="rounded-2xl overflow-hidden" style={{ height: 370 }}>
          <Placeholder />
        </div>
      </div>
    );
  }

  // ── 1 image — full-width hero ──
  if (count === 1) {
    return (
      <div className="hidden md:block relative">
        <button onClick={() => onShowAll(0)} className="w-full rounded-2xl overflow-hidden relative block" style={{ height: 370 }}>
          <Image src={images[0]} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="100vw" />
        </button>
        <ShowAllBtn />
      </div>
    );
  }

  // ── 2 images — side by side ──
  if (count === 2) {
    return (
      <div className="hidden md:block relative">
        <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden" style={{ height: 370 }}>
          {images.map((url, i) => (
            <button key={i} onClick={() => onShowAll(i)} className="relative overflow-hidden group">
              <Image src={url} alt={`${title} ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="50vw" />
            </button>
          ))}
        </div>
        <ShowAllBtn />
      </div>
    );
  }

  // ── 3 images — large left + 2 stacked right ──
  if (count === 3) {
    return (
      <div className="hidden md:block relative">
        <div className="grid gap-1 rounded-2xl overflow-hidden" style={{ gridTemplateColumns: '2fr 1fr', gridTemplateRows: '185px 185px' }}>
          <button onClick={() => onShowAll(0)} className="relative row-span-2 overflow-hidden group" style={{ gridRow: '1 / 3' }}>
            <Image src={images[0]} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="66vw" />
          </button>
          {images.slice(1, 3).map((url, i) => (
            <button key={i} onClick={() => onShowAll(i + 1)} className="relative overflow-hidden group bg-surface-container">
              <Image src={url} alt={`${title} ${i + 2}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="33vw" />
            </button>
          ))}
        </div>
        <ShowAllBtn />
      </div>
    );
  }

  // ── 4 images — large left + 3 stacked right ──
  if (count === 4) {
    return (
      <div className="hidden md:block relative">
        <div className="grid gap-1 rounded-2xl overflow-hidden" style={{ gridTemplateColumns: '2fr 1fr', gridTemplateRows: '124px 123px 123px' }}>
          <button onClick={() => onShowAll(0)} className="relative row-span-3 overflow-hidden group" style={{ gridRow: '1 / 4' }}>
            <Image src={images[0]} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="66vw" />
          </button>
          {images.slice(1, 4).map((url, i) => (
            <button key={i} onClick={() => onShowAll(i + 1)} className="relative overflow-hidden group bg-surface-container">
              <Image src={url} alt={`${title} ${i + 2}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="33vw" />
            </button>
          ))}
        </div>
        <ShowAllBtn />
      </div>
    );
  }

  // ── 5+ images — original 2fr 1fr 1fr grid ──
  return (
    <div className="hidden md:block relative">
      <div
        className="grid gap-1 rounded-2xl overflow-hidden"
        style={{ gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '185px 185px' }}
      >
        {/* Main large — spans 2 rows */}
        <button
          onClick={() => onShowAll(0)}
          className="relative col-span-1 row-span-2 overflow-hidden"
          style={{ gridRow: '1 / 3', gridColumn: '1 / 2' }}
        >
          <Image
            src={images[0]}
            alt={title}
            fill
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            sizes="50vw"
          />
        </button>

        {/* 4 small cells */}
        {images.slice(1, 5).map((url, i) => (
          <button
            key={i}
            onClick={() => onShowAll(i + 1)}
            className="relative overflow-hidden group bg-surface-container"
          >
            <Image
              src={url}
              alt={`${title} ${i + 2}`}
              fill
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              sizes="25vw"
            />
            {/* +N overlay on last cell */}
            {i === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-black text-xl">+{images.length - 5}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <ShowAllBtn />
    </div>
  );
}

// ─── Mobile Photo Swiper ───────────────────────────────────────────────────

interface MobileSwiperProps {
  images: string[];
  title: string;
  onShowAll: (idx: number) => void;
  placeholderIcon: string;
}

function MobileSwiper({ images, title, onShowAll, placeholderIcon }: MobileSwiperProps) {
  const [idx, setIdx] = useState(0);
  const touchStart = useRef(0);

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = e.changedTouches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setIdx((i) => Math.min(i + 1, images.length - 1));
      else setIdx((i) => Math.max(i - 1, 0));
    }
  }

  if (!images.length) {
    return (
      <div className="md:hidden h-64 bg-gradient-to-br from-surface-container-high/60 via-surface-container to-surface-container-low flex flex-col items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest/80 shadow-sm flex items-center justify-center border border-outline-variant/15">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">{placeholderIcon}</span>
        </div>
        <span className="mt-2.5 text-[11px] font-medium text-on-surface-variant/25 tracking-wide">لا توجد صورة</span>
      </div>
    );
  }

  return (
    <div
      className="md:hidden relative h-64 overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Image
        src={images[idx]}
        alt={title}
        fill
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
        {idx + 1} / {images.length}
      </div>
      <button
        onClick={() => onShowAll(idx)}
        className="absolute bottom-3 left-3 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-sm">grid_view</span>الكل
      </button>
      {images.length > 1 && (
        <div className="absolute bottom-10 inset-x-0 flex justify-center gap-1">
          {images.slice(0, 8).map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? 'bg-white w-4' : 'bg-white/50 w-1.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
