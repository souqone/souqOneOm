'use client';

import type { UploadedImage } from '@/features/ads/components/image-uploader';

interface ExistingImagesGridProps {
  images: UploadedImage[];
  onRemove: (id: string) => void;
}

export function ExistingImagesGrid({ images, onRemove }: ExistingImagesGridProps) {
  const existing = images.filter((img) => img.id && !img.file);
  if (!existing.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {existing.map((img) => (
        <div key={img.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--color-outline-variant)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => img.id && onRemove(img.id)}
            className="absolute top-0.5 end-0.5 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
