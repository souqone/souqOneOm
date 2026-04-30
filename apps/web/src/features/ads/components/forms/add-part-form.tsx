'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { MultiStepForm } from '@/components/ui/multi-step-form';
import { ImageUploader, type UploadedImage } from '@/features/ads/components/image-uploader';
import { useCreatePart, useBrands } from '@/lib/api';
import { apiFetch } from '@/lib/auth';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities } from '@/lib/location-data';
import { inputCls, labelCls, sectionCls, sectionTitleCls, chipCls, checkboxLabelCls, checkboxCls, checkboxTextCls } from '@/lib/constants/form-styles';
import { FormErrorOverlay } from '@/components/form-error-overlay';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

const PART_CATEGORIES = [
  { value: 'ENGINE', key: 'partCatEngine' },
  { value: 'BODY', key: 'partCatBody' },
  { value: 'ELECTRICAL', key: 'partCatElectrical' },
  { value: 'SUSPENSION', key: 'partCatSuspension' },
  { value: 'BRAKES', key: 'partCatBrakes' },
  { value: 'INTERIOR', key: 'partCatInterior' },
  { value: 'TIRES', key: 'partCatTires' },
  { value: 'BATTERIES', key: 'partCatBatteries' },
  { value: 'OILS', key: 'partCatOils' },
  { value: 'ACCESSORIES', key: 'partCatAccessories' },
  { value: 'OTHER', key: 'partCatOther' },
];

const PART_CONDITIONS = [
  { value: 'NEW', key: 'partCondNew' },
  { value: 'USED', key: 'partCondUsed' },
  { value: 'REFURBISHED', key: 'partCondRefurb' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i);

export function AddPartForm() {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('cat') || '';
  const createPart = useCreatePart();
  const { addToast } = useToast();
  const { data: brands = [] } = useBrands();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const brandsRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (brandsRef.current && !brandsRef.current.contains(e.target as Node)) setBrandsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleBrand(name: string) {
    set('compatibleMakes', form.compatibleMakes.includes(name)
      ? form.compatibleMakes.filter(b => b !== name)
      : [...form.compatibleMakes, name]);
  }
  const [images, setImages] = useState<UploadedImage[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    partCategory: initialCat,
    condition: 'USED',
    partNumber: '',
    compatibleMakes: [] as string[],
    compatibleModels: [] as string[],
    yearFrom: '',
    yearTo: '',
    isOriginal: false,
    price: '',
    isPriceNegotiable: false,
    governorate: '',
    city: '',
    latitude: null as number | null,
    longitude: null as number | null,
    contactPhone: '',
    whatsapp: '',
  });

  const [selectedGov, setSelectedGov] = useState('');
  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', selectedGov, locale);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const steps = [
    { label: tp('partStepBasic') },
    { label: tp('partStepDetails') },
    { label: tp('partStepPrice') },
  ];

  const canProceed = step === 0
    ? !!form.partCategory && !!form.title
    : step === 1
      ? true
      : !!form.price;

  async function handleSubmit() {
    setErrorMessages([]);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        partCategory: form.partCategory,
        condition: form.condition,
        price: parseFloat(form.price),
        isPriceNegotiable: form.isPriceNegotiable,
      };
      if (form.partNumber) payload.partNumber = form.partNumber;
      if (form.compatibleMakes.length) payload.compatibleMakes = form.compatibleMakes;
      if (form.compatibleModels.length) payload.compatibleModels = form.compatibleModels;
      if (form.yearFrom) payload.yearFrom = parseInt(form.yearFrom);
      if (form.yearTo) payload.yearTo = parseInt(form.yearTo);
      if (form.isOriginal) payload.isOriginal = true;
      if (form.governorate) payload.governorate = form.governorate;
      if (form.city) payload.city = form.city;
      if (form.latitude) payload.latitude = form.latitude;
      if (form.longitude) payload.longitude = form.longitude;
      if (form.contactPhone) payload.contactPhone = form.contactPhone;
      if (form.whatsapp) payload.whatsapp = form.whatsapp;

      const part = await createPart.mutateAsync(payload);

      if (images.length > 0) {
        for (const img of images) {
          if (img.file) {
            const fd = new FormData();
            fd.append('file', img.file);
            fd.append('isPrimary', String(img.isPrimary));
            await apiFetch(`/uploads/parts/${part.id}/images`, {
              method: 'POST',
              body: fd,
            });
          }
        }
      }

      addToast('success', tp('partSuccess'));
      router.push(`/sale/part/${part.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : tp('partError');
      setErrorMessages(msg.split('\n').filter(Boolean));
    }
  }

  const isLoading = createPart.isPending;

  return (
    <>
      <MultiStepForm
        steps={steps}
        currentStep={step}
        onNext={() => { setStep(s => Math.min(s + 1, 2)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onBack={() => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel={tp('partSubmit')}
        canProceed={canProceed}
        title={tp('partTitle')}
      >
        {step === 0 && (
          <div className="space-y-8">
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">settings</span>{tp('partLabelSection')}</h2>
              <div className="flex items-center gap-3 bg-surface-container-low/50 dark:bg-surface-container-high/30 rounded-xl px-4 py-3 mb-4 border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary text-lg">garage_home</span>
                <span className="text-sm text-on-surface-variant">{tp('partBreadcrumb1')}</span>
                <span className="material-symbols-outlined icon-flip text-on-surface-variant/30 text-xs">chevron_left</span>
                <span className="text-sm font-bold text-on-surface">{tp('partBreadcrumb2')}</span>
              </div>
              <label className={labelCls}>{tp('partLabelCategory')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PART_CATEGORIES.map(c => (
                  <button key={c.value} type="button" onClick={() => set('partCategory', c.value)}
                    className={chipCls(form.partCategory === c.value)}>
                    {tp(c.key)}
                  </button>
                ))}
              </div>
            </section>

            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">add_photo_alternate</span>{tp('partLabelPhotos')}</h2>
              <ImageUploader images={images} onChange={setImages} disabled={isLoading} />
            </section>

            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">edit_note</span>{tp('partLabelBasicInfo')}</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>{tp('partLabelTitle')}</label>
                  <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder={tp('partPlaceholderTitle')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{tp('partLabelCondition')}</label>
                  <div className="flex gap-3">
                    {PART_CONDITIONS.map(c => (
                      <button key={c.value} type="button" onClick={() => set('condition', c.value)}
                        className={chipCls(form.condition === c.value) + ' flex-1'}>
                        {tp(c.key)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8">
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">info</span>{tp('partLabelDetailsSection')}</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>{tp('partLabelOEM')}</label>
                  <input type="text" value={form.partNumber} onChange={e => set('partNumber', e.target.value)} placeholder={tp('partPlaceholderOptional')} className={inputCls} />
                </div>
                <div ref={brandsRef} className="relative">
                  <label className={labelCls}>{tp('partLabelBrands')}</label>
                  <button
                    type="button"
                    onClick={() => setBrandsOpen(!brandsOpen)}
                    className={inputCls + ' flex items-center justify-between text-start'}
                  >
                    <span className={form.compatibleMakes.length ? 'text-on-surface' : 'text-on-surface-variant/50'}>
                      {form.compatibleMakes.length
                        ? form.compatibleMakes.map(m => {
                            const b = brands.find(br => br.name === m);
                            return b?.nameAr || b?.name || m;
                          }).join(', ')
                        : tp('partSelect')}
                    </span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
                  </button>
                  {brandsOpen && (
                    <div className="absolute z-50 top-full mt-1 inset-x-0 max-h-52 overflow-y-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container shadow-lg py-1">
                      {brands.map(b => (
                        <label key={b.id} className="flex items-center gap-2 px-3 py-2 hover:bg-surface-container-low transition-colors cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={form.compatibleMakes.includes(b.name)}
                            onChange={() => toggleBrand(b.name)}
                            className={checkboxCls}
                          />
                          <span className="text-on-surface">{b.nameAr || b.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('partLabelYearFrom')}</label>
                    <select value={form.yearFrom} onChange={e => set('yearFrom', e.target.value)} className={inputCls}>
                      <option value="">{tp('partSelect')}</option>
                      {YEAR_OPTIONS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{tp('partLabelYearTo')}</label>
                    <select value={form.yearTo} onChange={e => set('yearTo', e.target.value)} className={inputCls}>
                      <option value="">{tp('partSelect')}</option>
                      {YEAR_OPTIONS.filter(y => !form.yearFrom || y >= parseInt(form.yearFrom)).map(y => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.isOriginal} onChange={e => set('isOriginal', e.target.checked)} className={checkboxCls} />
                  <span className={checkboxTextCls}>{tp('partLabelOriginal')}</span>
                </label>
                <div>
                  <label className={labelCls}>{tp('partLabelDesc')}</label>
                  <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder={tp('partPlaceholderDesc')} className={inputCls + ' resize-none'} />
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">sell</span>{tp('partLabelPrice')}</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>{tp('partLabelPriceOMR')}</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.000" className={inputCls} />
                </div>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.isPriceNegotiable} onChange={e => set('isPriceNegotiable', e.target.checked)} className={checkboxCls} />
                  <span className={checkboxTextCls}>{tp('partLabelNegotiable')}</span>
                </label>
              </div>
            </section>

            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">location_on</span>{tp('partLabelLocationContact')}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('partLabelGov')}</label>
                    <select value={selectedGov} onChange={e => { setSelectedGov(e.target.value); set('governorate', e.target.value); set('city', ''); }} className={inputCls}>
                      <option value="">{tp('partSelect')}</option>
                      {governorateOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{tp('partLabelCity')}</label>
                    <select value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} disabled={!selectedGov}>
                      <option value="">{tp('partSelect')}</option>
                      {cityOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className={labelCls}>{tp('partLabelMap')}</label>
                  <LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng); }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('partLabelPhone')}</label>
                    <div className="flex items-center gap-0">
                      <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                      <input type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" className={inputCls + ' rounded-s-none'} dir="ltr" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{tp('partLabelWhatsapp')}</label>
                    <div className="flex items-center gap-0">
                      <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                      <input type="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" className={inputCls + ' rounded-s-none'} dir="ltr" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {errorMessages.length > 0 && <FormErrorOverlay messages={errorMessages} onClose={() => setErrorMessages([])} />}
          </div>
        )}
      </MultiStepForm>
    </>
  );
}
