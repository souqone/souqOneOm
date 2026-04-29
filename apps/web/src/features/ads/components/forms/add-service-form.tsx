'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import { MultiStepForm } from '@/components/ui/multi-step-form';
import { ImageUploader, type UploadedImage } from '@/features/ads/components/image-uploader';
import { useCreateCarService } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { useToast } from '@/components/toast';
import { API_BASE } from '@/lib/config';
import { getGovernorates, getCities } from '@/lib/location-data';
import { inputCls, labelCls, sectionCls, sectionTitleCls, chipCls, checkboxLabelCls, checkboxCls, checkboxTextCls } from '@/lib/constants/form-styles';
import { FormErrorOverlay } from '@/components/form-error-overlay';
import { useTranslations, useLocale } from 'next-intl';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

const SERVICE_TYPES = [
  { value: 'MAINTENANCE', key: 'svcMaintenance' },
  { value: 'CLEANING', key: 'svcCleaning' },
  { value: 'MODIFICATION', key: 'svcModification' },
  { value: 'INSPECTION', key: 'svcInspection' },
  { value: 'BODYWORK', key: 'svcBodywork' },
  { value: 'ACCESSORIES_INSTALL', key: 'svcAccessories' },
  { value: 'KEYS_LOCKS', key: 'svcKeys' },
  { value: 'TOWING', key: 'svcTowing' },
  { value: 'OTHER_SERVICE', key: 'svcOther' },
];

const PROVIDER_TYPES = [
  { value: 'WORKSHOP', key: 'svcProvWorkshop' },
  { value: 'INDIVIDUAL', key: 'svcProvIndividual' },
  { value: 'MOBILE', key: 'svcProvMobile' },
  { value: 'COMPANY', key: 'svcProvCompany' },
];

const DAYS = [
  { value: 'SAT', key: 'tripDaySat' },
  { value: 'SUN', key: 'tripDaySun' },
  { value: 'MON', key: 'tripDayMon' },
  { value: 'TUE', key: 'tripDayTue' },
  { value: 'WED', key: 'tripDayWed' },
  { value: 'THU', key: 'tripDayThu' },
  { value: 'FRI', key: 'tripDayFri' },
];

export function AddServiceForm() {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || '';
  const create = useCreateCarService();
  const { addToast } = useToast();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<UploadedImage[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    serviceType: initialType,
    providerType: 'WORKSHOP',
    providerName: '',
    specializations: [] as string[],
    priceFrom: '',
    priceTo: '',
    isHomeService: false,
    workingHoursOpen: '08:00',
    workingHoursClose: '20:00',
    workingDays: ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU'] as string[],
    governorate: '',
    city: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    contactPhone: '',
    whatsapp: '',
    website: '',
  });

  const [selectedGov, setSelectedGov] = useState('');
  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', selectedGov, locale);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const steps = [
    { label: tp('svcStepBasic') },
    { label: tp('svcStepDetails') },
    { label: tp('svcStepLocation') },
  ];

  const canProceed = step === 0 ? !!form.serviceType && !!form.title && !!form.providerName : step === 1 ? true : !!form.governorate;

  async function handleSubmit() {
    setErrorMessages([]);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        serviceType: form.serviceType,
        providerType: form.providerType,
        providerName: form.providerName,
        governorate: form.governorate,
        isHomeService: form.isHomeService,
        workingDays: form.workingDays,
      };
      if (form.specializations.length) payload.specializations = form.specializations;
      if (form.priceFrom) payload.priceFrom = parseFloat(form.priceFrom);
      if (form.priceTo) payload.priceTo = parseFloat(form.priceTo);
      if (form.workingHoursOpen) payload.workingHoursOpen = form.workingHoursOpen;
      if (form.workingHoursClose) payload.workingHoursClose = form.workingHoursClose;
      if (form.city) payload.city = form.city;
      if (form.address) payload.address = form.address;
      if (form.latitude) payload.latitude = form.latitude;
      if (form.longitude) payload.longitude = form.longitude;
      if (form.contactPhone) payload.contactPhone = form.contactPhone;
      if (form.whatsapp) payload.whatsapp = form.whatsapp;
      if (form.website) payload.website = form.website;

      const svc = await create.mutateAsync(payload);

      if (images.length > 0) {
        const token = getAuthToken();
        for (const img of images) {
          if (img.file) {
            const fd = new FormData();
            fd.append('file', img.file);
            fd.append('isPrimary', String(img.isPrimary));
            await fetch(`${API_BASE}/api/v1/uploads/services/${svc.id}/images`, {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: fd,
            });
          }
        }
      }

      addToast('success', tp('svcSuccess'));
      router.push(`/sale/service/${svc.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : tp('svcError');
      setErrorMessages(msg.split('\n').filter(Boolean));
    }
  }

  const isLoading = create.isPending;

  return (
    <>
      <MultiStepForm
        steps={steps}
        currentStep={step}
        onNext={() => { setStep(s => Math.min(s + 1, 2)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onBack={() => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel={tp('svcSubmit')}
        canProceed={canProceed}
        title={tp('svcTitle')}
      >
        {step === 0 && (
          <div className="space-y-8">
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">handyman</span>{tp('svcLabelType')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SERVICE_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => set('serviceType', t.value)}
                    className={chipCls(form.serviceType === t.value)}>
                    {tp(t.key)}
                  </button>
                ))}
              </div>
            </section>

            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">add_photo_alternate</span>{tp('svcLabelPhotos')}</h2>
              <ImageUploader images={images} onChange={setImages} disabled={isLoading} />
            </section>

            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">storefront</span>{tp('svcLabelProvider')}</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>{tp('svcLabelTitle')}</label>
                  <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder={tp('svcPlaceholderTitle')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{tp('svcLabelProvName')}</label>
                  <input type="text" value={form.providerName} onChange={e => set('providerName', e.target.value)} placeholder={tp('svcPlaceholderProvName')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{tp('svcLabelProvType')}</label>
                  <div className="flex gap-3 flex-wrap">
                    {PROVIDER_TYPES.map(p => (
                      <button key={p.value} type="button" onClick={() => set('providerType', p.value)}
                        className={chipCls(form.providerType === p.value)}>
                        {tp(p.key)}
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
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">description</span>{tp('svcLabelDetails')}</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>{tp('svcLabelDesc')}</label>
                  <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder={tp('svcPlaceholderDesc')} className={inputCls + ' resize-none'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('svcLabelPriceFrom')}</label>
                    <input type="number" step="0.01" value={form.priceFrom} onChange={e => set('priceFrom', e.target.value)} placeholder="5.000" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{tp('svcLabelPriceTo')}</label>
                    <input type="number" step="0.01" value={form.priceTo} onChange={e => set('priceTo', e.target.value)} placeholder="50.000" className={inputCls} />
                  </div>
                </div>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.isHomeService} onChange={e => set('isHomeService', e.target.checked)} className={checkboxCls} />
                  <span className={checkboxTextCls}>{tp('svcLabelHomeService')}</span>
                </label>
              </div>
            </section>

            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">schedule</span>{tp('svcLabelHours')}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('svcLabelOpenTime')}</label>
                    <input type="time" value={form.workingHoursOpen} onChange={e => set('workingHoursOpen', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{tp('svcLabelCloseTime')}</label>
                    <input type="time" value={form.workingHoursClose} onChange={e => set('workingHoursClose', e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{tp('svcLabelWorkDays')}</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(d => (
                      <button key={d.value} type="button" onClick={() => set('workingDays', form.workingDays.includes(d.value) ? form.workingDays.filter(x => x !== d.value) : [...form.workingDays, d.value])}
                        className={chipCls(form.workingDays.includes(d.value))}>
                        {tp(d.key)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">location_on</span>{tp('svcLabelLocation')}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('svcLabelGov')}</label>
                    <select value={selectedGov} onChange={e => { setSelectedGov(e.target.value); set('governorate', e.target.value); set('city', ''); }} className={inputCls}>
                      <option value="">{tp('svcSelect')}</option>
                      {governorateOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{tp('svcLabelCity')}</label>
                    <select value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} disabled={!selectedGov}>
                      <option value="">{tp('svcSelect')}</option>
                      {cityOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{tp('svcLabelAddress')}</label>
                  <input type="text" value={form.address} onChange={e => set('address', e.target.value)} placeholder={tp('svcPlaceholderAddress')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{tp('svcLabelMap')}</label>
                  <LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng); }} />
                </div>
              </div>
            </section>

            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">contact_phone</span>{tp('svcLabelContact')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{tp('svcLabelPhone')}</label>
                  <div className="flex items-center gap-0">
                    <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                    <input type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" className={inputCls + ' rounded-s-none'} dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{tp('svcLabelWhatsapp')}</label>
                  <div className="flex items-center gap-0">
                    <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                    <input type="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" className={inputCls + ' rounded-s-none'} dir="ltr" />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className={labelCls}>{tp('svcLabelWebsite')}</label>
                <input type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." className={inputCls} />
              </div>
            </section>

            {errorMessages.length > 0 && <FormErrorOverlay messages={errorMessages} onClose={() => setErrorMessages([])} />}
          </div>
        )}
      </MultiStepForm>
    </>
  );
}
