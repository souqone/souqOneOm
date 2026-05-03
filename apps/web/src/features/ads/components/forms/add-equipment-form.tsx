'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { MultiStepForm } from '@/components/ui/multi-step-form';
import { ImageUploader, type UploadedImage } from '@/features/ads/components/image-uploader';
import { FormErrorDisplay } from '@/features/ads/components/forms/shared';
import { useCreateEquipmentListing } from '@/lib/api/equipment';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities, type LocationOption } from '@/lib/location-data';
import { apiFetch } from '@/lib/auth';
import { inputCls, labelCls, sectionCls, sectionTitleCls, chipCls, checkboxLabelCls, checkboxCls, checkboxTextCls } from '@/lib/constants/form-styles';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

const EQUIP_TYPE_KEYS = [
  { value: 'EXCAVATOR', labelKey: 'eqExcavator', icon: 'precision_manufacturing' },
  { value: 'CRANE', labelKey: 'eqCrane', icon: 'switch_access_2' },
  { value: 'LOADER', labelKey: 'eqLoader', icon: 'front_loader' },
  { value: 'BULLDOZER', labelKey: 'eqBulldozer', icon: 'agriculture' },
  { value: 'FORKLIFT', labelKey: 'eqForklift', icon: 'forklift' },
  { value: 'CONCRETE_MIXER', labelKey: 'eqConcreteMixer', icon: 'blender' },
  { value: 'GENERATOR', labelKey: 'eqGenerator', icon: 'bolt' },
  { value: 'COMPRESSOR', labelKey: 'eqCompressor', icon: 'air' },
  { value: 'SCAFFOLDING', labelKey: 'eqScaffolding', icon: 'construction' },
  { value: 'WELDING_MACHINE', labelKey: 'eqWelding', icon: 'hardware' },
  { value: 'TRUCK', labelKey: 'eqTruck', icon: 'local_shipping' },
  { value: 'DUMP_TRUCK', labelKey: 'eqDumpTruck', icon: 'local_shipping' },
  { value: 'WATER_TANKER', labelKey: 'eqWaterTanker', icon: 'water_drop' },
  { value: 'LIGHT_EQUIPMENT', labelKey: 'eqLightEquip', icon: 'build' },
  { value: 'OTHER_EQUIPMENT', labelKey: 'eqOther', icon: 'category' },
] as const;

const CONDITION_KEYS = [
  { value: 'NEW', labelKey: 'eqCondNew' }, { value: 'LIKE_NEW', labelKey: 'eqCondLikeNew' },
  { value: 'GOOD', labelKey: 'eqCondGood' }, { value: 'USED', labelKey: 'eqCondUsed' },
  { value: 'FAIR', labelKey: 'eqCondFair' },
] as const;

function normalizeListingType(type: string | null) {
  if (type === 'SALE') return 'EQUIPMENT_SALE';
  if (type === 'RENTAL') return 'EQUIPMENT_RENT';
  if (type === 'EQUIPMENT_SALE' || type === 'EQUIPMENT_RENT') return type;
  return '';
}

export function AddEquipmentForm() {
  const tp = useTranslations('pages');
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = normalizeListingType(searchParams.get('type'));
  const { addToast } = useToast();
  const createEquip = useCreateEquipmentListing();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);

  // Form state
  const [listingType, setListingType] = useState(initialType);
  const [equipmentType, setEquipmentType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [condition, setCondition] = useState('USED');
  const [capacity, setCapacity] = useState('');
  const [power, setPower] = useState('');
  const [weight, setWeight] = useState('');
  const [hoursUsed, setHoursUsed] = useState('');
  const [price, setPrice] = useState('');
  const [dailyPrice, setDailyPrice] = useState('');
  const [weeklyPrice, setWeeklyPrice] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [isPriceNegotiable, setIsPriceNegotiable] = useState(false);
  const [withOperator, setWithOperator] = useState(false);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [minRentalDays, setMinRentalDays] = useState('');
  const [features, setFeatures] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [insuranceIncluded, setInsuranceIncluded] = useState(false);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [contactPhone, setContactPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const locale = useLocale();
  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = governorate ? getCities('OM', governorate, locale) : [];

  const steps = [
    { label: tp('eqStepType'), icon: 'category' },
    { label: tp('eqStepSpecs'), icon: 'settings' },
    { label: tp('eqStepPrice'), icon: 'payments' },
    { label: tp('eqStepPhotos'), icon: 'photo_camera' },
  ];
  const maxStep = steps.length - 1;

  const canProceed =
    step === 0 ? !!(listingType && equipmentType) :
    step === 1 ? !!(title && description) :
    step === 2 ? (listingType === 'EQUIPMENT_SALE' ? !!price : !!(dailyPrice || monthlyPrice)) :
    true;

  async function handleSubmit() {
    const errs: string[] = [];
    if (!title) errs.push(tp('eqErrTitle'));
    if (!description) errs.push(tp('eqErrDesc'));
    if (errs.length) { setErrors(errs); return; }

    try {
      const data: Record<string, unknown> = {
        title, description, equipmentType, listingType, condition,
        make: make || undefined, model: model || undefined,
        year: year ? Number(year) : undefined,
        capacity: capacity || undefined, power: power || undefined,
        weight: weight || undefined, hoursUsed: hoursUsed ? Number(hoursUsed) : undefined,
        price: price ? Number(price) : undefined,
        dailyPrice: dailyPrice ? Number(dailyPrice) : undefined,
        weeklyPrice: weeklyPrice ? Number(weeklyPrice) : undefined,
        monthlyPrice: monthlyPrice ? Number(monthlyPrice) : undefined,
        isPriceNegotiable, withOperator, deliveryAvailable,
        minRentalDays: minRentalDays ? Number(minRentalDays) : undefined,
        features: features ? features.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        depositAmount: depositAmount ? Number(depositAmount) : undefined,
        insuranceIncluded: listingType === 'EQUIPMENT_RENT' ? insuranceIncluded : undefined,
        availableFrom: availableFrom || undefined,
        availableTo: availableTo || undefined,
        cancellationPolicy: cancellationPolicy || undefined,
        governorate: governorate || undefined, city: city || undefined,
        latitude: latitude ?? undefined, longitude: longitude ?? undefined,
        contactPhone: contactPhone || undefined, whatsapp: whatsapp || undefined,
      };

      const result = await createEquip.mutateAsync(data);

      // Upload images
      for (const img of images) {
        if (img.file) {
          const fd = new FormData();
          fd.append('file', img.file);
          await apiFetch(`/uploads/equipment/${result.id}/images`, {
            method: 'POST',
            body: fd,
          });
        }
      }

      addToast('success', tp('eqSuccess'));
      router.push(`${result.listingType === 'EQUIPMENT_RENT' ? '/rental' : '/sale'}/equipment/${result.id}`);
    } catch (e: any) {
      setErrors([e?.message || tp('eqError')]);
    }
  }

  const isLoading = createEquip.isPending;

  return (
    <>
      <MultiStepForm
        steps={steps}
        currentStep={step}
        onNext={() => { setStep(s => Math.min(s + 1, maxStep)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onBack={() => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel={tp('eqSubmit')}
        canProceed={canProceed}
        title={tp('eqTitle')}
      >
        {/* ── Step 0: Type ── */}
        {step === 0 && (
          <div className="space-y-8">
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">category</span>{tp('eqLabelAdType')}</h2>
              <div className="grid grid-cols-2 gap-3">
                {[{ v: 'EQUIPMENT_SALE', lKey: 'eqTypeSale' as const, i: 'sell', dKey: 'eqTypeSaleDesc' as const }, { v: 'EQUIPMENT_RENT', lKey: 'eqTypeRent' as const, i: 'car_rental', dKey: 'eqTypeRentDesc' as const }].map(opt => (
                  <button key={opt.v} type="button" onClick={() => setListingType(opt.v)}
                    className={`p-4 rounded-2xl border-2 text-start transition-all ${listingType === opt.v ? 'border-primary bg-primary/5' : 'border-outline-variant/10 hover:border-primary/30'}`}>
                    <span className="material-symbols-outlined text-2xl text-primary mb-2 block">{opt.i}</span>
                    <p className="font-bold text-sm">{tp(opt.lKey)}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">{tp(opt.dKey)}</p>
                  </button>
                ))}
              </div>
            </section>
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">construction</span>{tp('eqLabelEquipType')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {EQUIP_TYPE_KEYS.map(t => (
                  <button key={t.value} type="button" onClick={() => setEquipmentType(t.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${equipmentType === t.value ? 'border-primary bg-primary/5' : 'border-outline-variant/10 hover:border-primary/30'}`}>
                    <span className="material-symbols-outlined text-xl text-primary">{t.icon}</span>
                    <span className="text-[10px] font-bold">{tp(t.labelKey)}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── Step 1: Specs ── */}
        {step === 1 && (
          <div className="space-y-6">
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">edit_note</span>{tp('eqLabelBasicInfo')}</h2>
              <div className="space-y-4">
                <div><label className={labelCls}>{tp('eqLabelTitle')}</label><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder={tp('eqPlaceholderTitle')} /></div>
                <div><label className={labelCls}>{tp('eqLabelDesc')}</label><textarea className={`${inputCls} min-h-[100px]`} value={description} onChange={e => setDescription(e.target.value)} placeholder={tp('eqPlaceholderDesc')} /></div>
              </div>
            </section>
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">settings</span>{tp('eqLabelTechSpecs')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>{tp('eqLabelBrand')}</label><input className={inputCls} value={make} onChange={e => setMake(e.target.value)} placeholder="Caterpillar" /></div>
                <div><label className={labelCls}>{tp('eqLabelModel')}</label><input className={inputCls} value={model} onChange={e => setModel(e.target.value)} placeholder="320D" /></div>
                <div><label className={labelCls}>{tp('eqLabelYear')}</label><input type="number" className={inputCls} value={year} onChange={e => setYear(e.target.value)} placeholder="2020" /></div>
                <div>
                  <label className={labelCls}>{tp('eqLabelCondition')}</label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITION_KEYS.map(c => (
                      <button key={c.value} type="button" onClick={() => setCondition(c.value)}
                        className={chipCls(condition === c.value)}>{tp(c.labelKey)}</button>
                    ))}
                  </div>
                </div>
                <div><label className={labelCls}>{tp('eqLabelCapacity')}</label><input className={inputCls} value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="20 ton" /></div>
                <div><label className={labelCls}>{tp('eqLabelPower')}</label><input className={inputCls} value={power} onChange={e => setPower(e.target.value)} placeholder="150 HP" /></div>
                <div><label className={labelCls}>{tp('eqLabelWeight')}</label><input className={inputCls} value={weight} onChange={e => setWeight(e.target.value)} placeholder="22,000 kg" /></div>
                <div><label className={labelCls}>{tp('eqLabelHours')}</label><input type="number" className={inputCls} value={hoursUsed} onChange={e => setHoursUsed(e.target.value)} placeholder="5000" /></div>
              </div>
            </section>
          </div>
        )}

        {/* ── Step 2: Price & Location ── */}
        {step === 2 && (
          <div className="space-y-6">
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">payments</span>{tp('eqLabelPrice')}</h2>
              <div className="space-y-4">
                {listingType === 'EQUIPMENT_SALE' ? (
                  <div><label className={labelCls}>{tp('eqLabelSalePrice')}</label><input type="number" className={inputCls} value={price} onChange={e => setPrice(e.target.value)} placeholder="0.000" /></div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className={labelCls}>{tp('eqLabelDaily')}</label><input type="number" className={inputCls} value={dailyPrice} onChange={e => setDailyPrice(e.target.value)} /></div>
                    <div><label className={labelCls}>{tp('eqLabelWeekly')}</label><input type="number" className={inputCls} value={weeklyPrice} onChange={e => setWeeklyPrice(e.target.value)} /></div>
                    <div><label className={labelCls}>{tp('eqLabelMonthly')}</label><input type="number" className={inputCls} value={monthlyPrice} onChange={e => setMonthlyPrice(e.target.value)} /></div>
                  </div>
                )}
                <div className="flex flex-wrap gap-5">
                  <label className={checkboxLabelCls}><input type="checkbox" checked={isPriceNegotiable} onChange={e => setIsPriceNegotiable(e.target.checked)} className={checkboxCls} /><span className={checkboxTextCls}>{tp('eqLabelNegotiable')}</span></label>
                  <label className={checkboxLabelCls}><input type="checkbox" checked={withOperator} onChange={e => setWithOperator(e.target.checked)} className={checkboxCls} /><span className={checkboxTextCls}>{tp('eqLabelWithOperator')}</span></label>
                  <label className={checkboxLabelCls}><input type="checkbox" checked={deliveryAvailable} onChange={e => setDeliveryAvailable(e.target.checked)} className={checkboxCls} /><span className={checkboxTextCls}>{tp('eqLabelDelivery')}</span></label>
                </div>
                {listingType === 'EQUIPMENT_RENT' && (
                  <div><label className={labelCls}>{tp('eqLabelMinRental')}</label><input type="number" className={inputCls} value={minRentalDays} onChange={e => setMinRentalDays(e.target.value)} /></div>
                )}
              </div>
              {listingType === 'EQUIPMENT_RENT' && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className={labelCls}>{tp('eqLabelFeatures')}</label>
                    <input className={inputCls} value={features} onChange={e => setFeatures(e.target.value)} placeholder={tp('eqPlaceholderFeatures')} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{tp('eqLabelDeposit')}</label>
                      <input type="number" className={inputCls} value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder={tp('eqPlaceholderOptional')} />
                    </div>
                    <div>
                      <label className={labelCls}>{tp('eqLabelAvailableFrom')}</label>
                      <input type="date" className={inputCls} value={availableFrom} onChange={e => setAvailableFrom(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>{tp('eqLabelAvailableTo')}</label>
                      <input type="date" className={inputCls} value={availableTo} onChange={e => setAvailableTo(e.target.value)} />
                    </div>
                  </div>
                  <label className={checkboxLabelCls}>
                    <input type="checkbox" checked={insuranceIncluded} onChange={e => setInsuranceIncluded(e.target.checked)} className={checkboxCls} />
                    <span className={checkboxTextCls}>{tp('eqLabelInsurance')}</span>
                  </label>
                  <div>
                    <label className={labelCls}>{tp('eqLabelCancellation')}</label>
                    <textarea className={inputCls + ' min-h-[80px]'} rows={3} value={cancellationPolicy} onChange={e => setCancellationPolicy(e.target.value)} placeholder={tp('eqPlaceholderCancellation')} />
                  </div>
                </div>
              )}
            </section>
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">location_on</span>{tp('eqLabelLocationContact')}</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelCls}>{tp('eqLabelGovernorate')}</label>
                  <select className={inputCls} value={governorate} onChange={e => setGovernorate(e.target.value)}>
                    <option value="">{tp('eqSelectGovernorate')}</option>
                    {governorateOptions.map((g: LocationOption) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{tp('eqLabelCity')}</label>
                  <select className={inputCls} value={city} onChange={e => setCity(e.target.value)} disabled={!governorate}>
                    <option value="">{tp('eqPlaceholderCity')}</option>
                    {cityOptions.map((c: LocationOption) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{tp('eqLabelPhone')}</label>
                  <div className="flex items-center gap-0">
                    <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                    <input type="tel" className={inputCls + ' rounded-s-none'} value={contactPhone} onChange={e => setContactPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{tp('eqLabelWhatsapp')}</label>
                  <div className="flex items-center gap-0">
                    <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                    <input type="tel" className={inputCls + ' rounded-s-none'} value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" dir="ltr" />
                  </div>
                </div>
              </div>
              <LocationPicker latitude={latitude} longitude={longitude} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />
            </section>
          </div>
        )}

        {/* ── Step 3: Images ── */}
        {step === 3 && (
          <section className={sectionCls}>
            <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">add_photo_alternate</span>{tp('eqLabelPhotos')}</h2>
            <ImageUploader images={images} onChange={setImages} />
          </section>
        )}
      </MultiStepForm>

      <FormErrorDisplay errors={errors} onClose={() => setErrors([])} />
    </>
  );
}
