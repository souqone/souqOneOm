'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

// ─── Types ───

export interface UploadedImage {
  id?: string;        // DB id (for existing images)
  url: string;        // Preview URL or remote URL
  file?: File;        // Local file (for new uploads)
  isPrimary: boolean;
  order: number;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

// ─── Component ───

export function ImageUploader({
  images,
  onChange,
  maxImages = 10,
  disabled = false,
}: ImageUploaderProps) {
  const tp = useTranslations('pages');
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = images.length < maxImages;

  // ─── File Selection ───

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      const valid = fileArray.filter((f) => {
        if (!allowed.includes(f.type)) return false;
        if (f.size > maxSize) return false;
        return true;
      });

      const slotsLeft = maxImages - images.length;
      const toAdd = valid.slice(0, slotsLeft);

      if (toAdd.length === 0) return;

      const newImages: UploadedImage[] = toAdd.map((file, i) => ({
        url: URL.createObjectURL(file),
        file,
        isPrimary: images.length === 0 && i === 0,
        order: images.length + i,
      }));

      onChange([...images, ...newImages]);
    },
    [images, maxImages, onChange],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = ''; // reset so same file can be re-selected
    }
  };

  // ─── Drag & Drop (file upload) ───

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // ─── Reorder (drag between items) ───

  const handleItemDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);

    // Update order and primary
    const updated = reordered.map((img, i) => ({
      ...img,
      order: i,
      isPrimary: i === 0,
    }));

    setDragIndex(index);
    onChange(updated);
  };

  const handleItemDragEnd = () => {
    setDragIndex(null);
  };

  // ─── Remove ───

  const removeImage = (index: number) => {
    const updated = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({
        ...img,
        order: i,
        isPrimary: i === 0,
      }));
    onChange(updated);
  };

  // ─── Set Primary ───

  const setPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {canAddMore && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-8
            flex flex-col items-center justify-center gap-3
            transition-all cursor-pointer
            ${dragOver
              ? 'border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5 scale-[1.01]'
              : 'border-[var(--color-outline-variant)]/40 hover:border-[var(--color-brand-navy)]/50 hover:bg-[var(--color-surface-container)]'}
            ${disabled ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand-navy)]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[var(--color-brand-navy)] text-3xl">
              add_photo_alternate
            </span>
          </div>
          <div className="text-center">
            <p className="font-bold text-[var(--color-on-surface)] text-sm">
              {tp('imgUploadDrag')}
            </p>
            <p className="text-[var(--color-on-surface-variant)] text-xs mt-1">
              {tp('imgUploadHint', { current: images.length, max: maxImages })}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((img, index) => (
            <div
              key={img.url}
              draggable={!disabled}
              onDragStart={() => handleItemDragStart(index)}
              onDragOver={(e) => handleItemDragOver(e, index)}
              onDragEnd={handleItemDragEnd}
              className={`
                relative group aspect-square rounded-xl overflow-hidden
                border-2 transition-all cursor-grab active:cursor-grabbing
                ${img.isPrimary ? 'border-[var(--color-brand-navy)] ring-2 ring-[var(--color-brand-navy)]/20' : 'border-transparent'}
                ${dragIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}
              `}
            >
              {/* Image */}
              <Image
                src={img.url}
                alt={tp('imgUploadAlt', { index: index + 1 })}
                fill
                className="object-cover"
                draggable={false}
                unoptimized
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {/* Set Primary */}
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPrimary(index); }}
                    className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-[var(--color-brand-navy)] hover:bg-white transition-colors"
                    title={tp('imgUploadSetPrimary')}
                  >
                    <span className="material-symbols-outlined text-lg">star</span>
                  </button>
                )}

                {/* Remove */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                    className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-error hover:bg-white transition-colors"
                    title={tp('imgUploadDelete')}
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                )}
              </div>

              {/* Primary Badge */}
              {img.isPrimary && (
                <div className="absolute top-2 end-2 bg-[var(--color-brand-navy)] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {tp('imgUploadPrimary')}
                </div>
              )}

              {/* Order Badge */}
              <div className="absolute bottom-2 start-2 bg-black/60 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {index + 1}
              </div>

              {/* Upload Progress (for new files) */}
              {img.file && !img.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-brand-navy)]/20">
                  <div className="h-full bg-[var(--color-brand-navy)] animate-pulse w-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length > 1 && (
        <p className="text-xs text-[var(--color-on-surface-variant)]">
          <span className="material-symbols-outlined text-sm align-text-bottom ms-1">drag_indicator</span>
          {tp('imgUploadReorder')}
        </p>
      )}
    </div>
  );
}
