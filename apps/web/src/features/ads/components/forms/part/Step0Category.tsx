'use client';

import { useTranslations } from 'next-intl';
import { FormSection, FormInput } from '@/features/ads/components/forms/shared';
import { ExistingImagesGrid } from '@/features/ads/components/forms/shared/ExistingImagesGrid';
import { ImageUploader, type UploadedImage } from '@/features/ads/components/image-uploader';
import { labelCls, chipCls } from '@/lib/constants/form-styles';
import { PART_CATEGORIES, PART_CONDITIONS, type PartFormData } from './types';

interface Step0Props {
  form: PartFormData;
  onChange: (updates: Partial<PartFormData>) => void;
  images: UploadedImage[];
  onImagesChange: (imgs: UploadedImage[]) => void;
  onRemoveExistingImage: (id: string) => void;
  isEdit: boolean;
  isLoading?: boolean;
}

export function Step0Category({ form, onChange, images, onImagesChange, onRemoveExistingImage, isEdit, isLoading }: Step0Props) {
  const tp = useTranslations('pages');

  return (
    <div className="space-y-8">
      <FormSection icon="settings" title={tp('partLabelSection')}>
        <div className="flex items-center gap-3 bg-[var(--color-surface-container)] rounded-xl px-4 py-3 mb-4 border border-[var(--color-outline-variant)]">
          <span className="material-symbols-outlined text-[var(--color-brand-navy)] text-lg">garage_home</span>
          <span className="text-sm text-[var(--color-on-surface-variant)]">{tp('partBreadcrumb1')}</span>
          <span className="material-symbols-outlined icon-flip text-[var(--color-on-surface-variant)]/30 text-xs">chevron_left</span>
          <span className="text-sm font-bold text-[var(--color-on-surface)]">{tp('partBreadcrumb2')}</span>
        </div>
        <label className={labelCls}>{tp('partLabelCategory')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {PART_CATEGORIES.map((c) => (
            <button key={c.value} type="button" onClick={() => onChange({ partCategory: c.value })} className={chipCls(form.partCategory === c.value)}>
              {tp(c.key)}
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection icon="add_photo_alternate" title={tp('partLabelPhotos')}>
        {isEdit && <ExistingImagesGrid images={images} onRemove={onRemoveExistingImage} />}
        <ImageUploader
          images={images.filter((img) => !img.id)}
          onChange={(newImgs) => onImagesChange([...images.filter((img) => img.id && !img.file), ...newImgs])}
          disabled={isLoading}
        />
      </FormSection>

      <FormSection icon="edit_note" title={tp('partLabelBasicInfo')}>
        <div className="space-y-4">
          <FormInput label={tp('partLabelTitle')} name="title" value={form.title} onChange={(v) => onChange({ title: v })} placeholder={tp('partPlaceholderTitle')} required />
          <div>
            <label className={labelCls}>{tp('partLabelCondition')}</label>
            <div className="flex gap-3 mt-2">
              {PART_CONDITIONS.map((c) => (
                <button key={c.value} type="button" onClick={() => onChange({ condition: c.value })} className={chipCls(form.condition === c.value) + ' flex-1'}>
                  {tp(c.key)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
