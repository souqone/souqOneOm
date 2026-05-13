'use client';

import { FormSection, FormChipGroup } from '@/features/ads/components/forms/shared';
import { ExistingImagesGrid } from '@/features/ads/components/forms/shared/ExistingImagesGrid';
import { ImageUploader, type UploadedImage } from '@/features/ads/components/image-uploader';
import { SERVICE_TYPES, PROVIDER_TYPES, type ServiceFormData } from './types';

interface Step0Props {
  form: ServiceFormData;
  onChange: (updates: Partial<ServiceFormData>) => void;
  images: UploadedImage[];
  onImagesChange: (imgs: UploadedImage[]) => void;
  onRemoveExistingImage: (id: string) => void;
  isEdit: boolean;
  isLoading?: boolean;
}

export function Step0ServiceType({ form, onChange, images, onImagesChange, onRemoveExistingImage, isEdit, isLoading }: Step0Props) {
  return (
    <div className="space-y-8">
      <FormSection icon="home_repair_service" title="نوع الخدمة">
        <FormChipGroup
          options={SERVICE_TYPES}
          value={form.serviceType}
          onChange={(v) => onChange({ serviceType: v as string })}
          variant="card"
          columns={3}
        />
      </FormSection>

      <FormSection icon="storefront" title="نوع المزوّد">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROVIDER_TYPES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange({ providerType: p.value })}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-start ${
                form.providerType === p.value
                  ? 'border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5'
                  : 'border-[var(--color-outline-variant)] hover:border-[var(--color-brand-navy)]/40 bg-white'
              }`}
            >
              <span className={`material-symbols-outlined text-2xl shrink-0 ${form.providerType === p.value ? 'text-[var(--color-brand-navy)]' : 'text-[var(--color-on-surface-variant)]'}`}>
                {p.icon}
              </span>
              <div>
                <p className="font-black text-sm text-[var(--color-on-surface)]">{p.label}</p>
                <p className="text-xs text-[var(--color-on-surface-variant)]">{p.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection icon="photo_camera" title="صور الخدمة">
        <p className="text-xs text-[var(--color-on-surface-variant)]/60 mb-3">
          أضف صوراً للورشة أو المعدات — تزيد من مصداقية إعلانك
        </p>
        {isEdit && <ExistingImagesGrid images={images} onRemove={onRemoveExistingImage} />}
        <ImageUploader
          images={images.filter((img) => !img.id)}
          onChange={(newImgs) => onImagesChange([...images.filter((img) => img.id && !img.file), ...newImgs])}
          maxImages={10}
          disabled={isLoading}
        />
      </FormSection>
    </div>
  );
}
