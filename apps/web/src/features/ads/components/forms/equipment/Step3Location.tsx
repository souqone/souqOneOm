'use client';

import { useTranslations } from 'next-intl';
import { LocationSection, FormSection } from '@/features/ads/components/forms/shared';
import { ContactSection } from '@/features/ads/components/forms/shared/ContactSection';
import { ExistingImagesGrid } from '@/features/ads/components/forms/shared/ExistingImagesGrid';
import { ImageUploader, type UploadedImage } from '@/features/ads/components/image-uploader';
import type { LocationOption } from '@/lib/location-data';
import type { EquipmentFormData } from './types';

interface Step3Props {
  form: EquipmentFormData;
  onChange: (updates: Partial<EquipmentFormData>) => void;
  selectedGov: string;
  onGovChange: (v: string) => void;
  governorateOptions: LocationOption[];
  cityOptions: LocationOption[];
  images: UploadedImage[];
  onImagesChange: (imgs: UploadedImage[]) => void;
  onRemoveExistingImage: (id: string) => void;
  isEdit: boolean;
}

export function Step3Location({
  form, onChange, selectedGov, onGovChange,
  governorateOptions, cityOptions,
  images, onImagesChange, onRemoveExistingImage, isEdit,
}: Step3Props) {
  const tp = useTranslations('pages');

  return (
    <div className="space-y-6">
      <LocationSection
        selectedGov={selectedGov}
        onGovChange={(gov) => { onGovChange(gov); onChange({ governorate: gov, city: '' }); }}
        city={form.city}
        onCityChange={(city) => onChange({ city })}
        latitude={form.latitude}
        longitude={form.longitude}
        onLocationChange={(lat, lng) => onChange({ latitude: lat, longitude: lng })}
        governorateOptions={governorateOptions}
        cityOptions={cityOptions}
      />

      <FormSection icon="call" title={tp('eqLabelLocationContact')}>
        <ContactSection
          phoneLabel={tp('eqLabelPhone')}
          whatsappLabel={tp('eqLabelWhatsapp')}
          contactPhone={form.contactPhone}
          whatsapp={form.whatsapp}
          onPhoneChange={(v) => onChange({ contactPhone: v })}
          onWhatsappChange={(v) => onChange({ whatsapp: v })}
        />
      </FormSection>

      <FormSection icon="photo_camera" title={tp('eqLabelPhotos')}>
        {isEdit && <ExistingImagesGrid images={images} onRemove={onRemoveExistingImage} />}
        <ImageUploader
          images={images.filter((img) => !img.id)}
          onChange={(newImgs) => onImagesChange([...images.filter((img) => img.id && !img.file), ...newImgs])}
          maxImages={10}
        />
      </FormSection>
    </div>
  );
}
