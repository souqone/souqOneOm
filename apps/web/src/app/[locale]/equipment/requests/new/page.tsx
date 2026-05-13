'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { AuthGuard } from '@/components/auth-guard';
import { MultiStepForm } from '@/components/ui/multi-step-form';
import { FormErrorOverlay } from '@/components/form-error-overlay';
import { useCreateEquipmentRequest } from '@/lib/api/equipment';
import { useToast } from '@/components/toast';
import { getGovernorates, type LocationOption } from '@/lib/location-data';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

const EQUIP_TYPES = [
  { value: 'EXCAVATOR', key: 'eqrTypeExcavator', icon: 'precision_manufacturing' },
  { value: 'CRANE', key: 'eqrTypeCrane', icon: 'switch_access_2' },
  { value: 'LOADER', key: 'eqrTypeLoader', icon: 'front_loader' },
  { value: 'BULLDOZER', key: 'eqrTypeBulldozer', icon: 'agriculture' },
  { value: 'FORKLIFT', key: 'eqrTypeForklift', icon: 'forklift' },
  { value: 'CONCRETE_MIXER', key: 'eqrTypeConcreteMixer', icon: 'blender' },
  { value: 'GENERATOR', key: 'eqrTypeGenerator', icon: 'bolt' },
  { value: 'COMPRESSOR', key: 'eqrTypeCompressor', icon: 'air' },
  { value: 'SCAFFOLDING', key: 'eqrTypeScaffolding', icon: 'construction' },
  { value: 'WELDING_MACHINE', key: 'eqrTypeWelding', icon: 'hardware' },
  { value: 'TRUCK', key: 'eqrTypeTruck', icon: 'local_shipping' },
  { value: 'DUMP_TRUCK', key: 'eqrTypeDumpTruck', icon: 'local_shipping' },
  { value: 'WATER_TANKER', key: 'eqrTypeWaterTanker', icon: 'water_drop' },
  { value: 'LIGHT_EQUIPMENT', key: 'eqrTypeLightEquip', icon: 'build' },
  { value: 'OTHER_EQUIPMENT', key: 'eqrTypeOther', icon: 'category' },
];

const sectionCls = 'card-base p-5';
const labelCls = 'block text-sm font-bold text-[var(--color-on-surface)] mb-1.5';
const inputCls = 'input-base text-sm';

export default function NewEquipmentRequestPage() {
  const tp = useTranslations('pages');
  const router = useRouter();
  const { addToast } = useToast();
  const createReq = useCreateEquipmentRequest();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const [equipmentType, setEquipmentType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [rentalDuration, setRentalDuration] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [withOperator, setWithOperator] = useState(false);
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [siteDetails, setSiteDetails] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [contactPhone, setContactPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const locale = useLocale();
  const governorateOptions = getGovernorates('OM', locale);

  const steps = [
    { label: tp('eqrStep1'), icon: 'construction' },
    { label: tp('eqrStep2'), icon: 'description' },
    { label: tp('eqrStep3'), icon: 'payments' },
    { label: tp('eqrStep4'), icon: 'location_on' },
  ];
  const maxStep = steps.length - 1;

  const canProceed =
    step === 0 ? !!equipmentType :
    step === 1 ? !!(title && description) :
    step === 2 ? true :
    true;

  async function handleSubmit() {
    const errs: string[] = [];
    if (!title) errs.push(tp('eqrErrTitle'));
    if (!description) errs.push(tp('eqrErrDesc'));
    if (!equipmentType) errs.push(tp('eqrErrType'));
    if (errs.length) { setErrors(errs); return; }

    try {
      const data: Record<string, unknown> = {
        title, description, equipmentType,
        quantity: quantity ? Number(quantity) : 1,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        rentalDuration: rentalDuration || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        withOperator,
        governorate: governorate || undefined,
        city: city || undefined,
        siteDetails: siteDetails || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        contactPhone: contactPhone || undefined,
        whatsapp: whatsapp || undefined,
      };

      const result = await createReq.mutateAsync(data);
      addToast('success', tp('eqrSuccess'));
      router.push(`/equipment/requests/${result.id}`);
    } catch (e: any) {
      addToast('error', e?.message || tp('eqrError'));
    }
  }

  return (
    <AuthGuard>
      <Navbar />
      <main className="pt-28 pb-16 max-w-[900px] mx-auto px-4 md:px-8">
        <MultiStepForm
          steps={steps}
          currentStep={step}
          onNext={() => { setStep(s => Math.min(s + 1, maxStep)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onBack={() => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onSubmit={handleSubmit}
          isLoading={createReq.isPending}
          submitLabel={tp('eqrSubmitLabel')}
          canProceed={canProceed}
          title={tp('eqrTitle')}
        >
          {/* Step 0 */}
          {step === 0 && (
            <section className={sectionCls}>
              <h3 className="font-black text-base text-on-surface mb-4">{tp('eqrHeadType')}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {EQUIP_TYPES.map(eq => (
                  <button key={eq.value} type="button" onClick={() => setEquipmentType(eq.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${equipmentType === eq.value ? 'border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5' : 'border-[var(--color-outline-variant)] hover:border-[var(--color-brand-navy)]/30'}`}>
                    <span className="material-symbols-outlined text-xl text-[var(--color-brand-navy)]">{eq.icon}</span>
                    <span className="text-[10px] font-bold">{tp(eq.key)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <section className={sectionCls}>
              <h3 className="font-black text-base text-on-surface mb-4">{tp('eqrHeadDetails')}</h3>
              <div className="space-y-4">
                <div><label className={labelCls}>{tp('eqrLabelTitle')}</label><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder={tp('eqrPlaceholderTitle')} /></div>
                <div><label className={labelCls}>{tp('eqrLabelDesc')}</label><textarea className={`${inputCls} min-h-[120px]`} value={description} onChange={e => setDescription(e.target.value)} placeholder={tp('eqrPlaceholderDesc')} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>{tp('eqrLabelQuantity')}</label><input type="number" min="1" className={inputCls} value={quantity} onChange={e => setQuantity(e.target.value)} /></div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer mt-7">
                      <input type="checkbox" checked={withOperator} onChange={e => setWithOperator(e.target.checked)} className="w-4 h-4 rounded" />
                      <span className="text-sm font-bold">{tp('eqrNeedOperator')}</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <section className={sectionCls}>
              <h3 className="font-black text-base text-on-surface mb-4">{tp('eqrHeadBudget')}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>{tp('eqrLabelBudgetMin')}</label><input type="number" className={inputCls} value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder="50" /></div>
                  <div><label className={labelCls}>{tp('eqrLabelBudgetMax')}</label><input type="number" className={inputCls} value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="200" /></div>
                </div>
                <div><label className={labelCls}>{tp('eqrLabelRentalDuration')}</label><input className={inputCls} value={rentalDuration} onChange={e => setRentalDuration(e.target.value)} placeholder={tp('eqrPlaceholderRental')} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>{tp('eqrLabelStartDate')}</label><input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                  <div><label className={labelCls}>{tp('eqrLabelEndDate')}</label><input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                </div>
              </div>
            </section>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <section className={sectionCls}>
                <h3 className="font-black text-base text-on-surface mb-4">{tp('eqrHeadLocation')}</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelCls}>{tp('eqrLabelGovernorate')}</label>
                    <select className={inputCls} value={governorate} onChange={e => setGovernorate(e.target.value)}>
                      <option value="">{tp('eqrSelectGovernorate')}</option>
                      {governorateOptions.map((g: LocationOption) => <option key={g.value} value={g.label}>{g.label}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>{tp('eqrLabelCity')}</label><input className={inputCls} value={city} onChange={e => setCity(e.target.value)} placeholder={tp('eqrPlaceholderCity')} /></div>
                </div>
                <div className="mb-4"><label className={labelCls}>{tp('eqrLabelSiteDetails')}</label><input className={inputCls} value={siteDetails} onChange={e => setSiteDetails(e.target.value)} placeholder={tp('eqrPlaceholderSite')} /></div>
                <LocationPicker latitude={latitude} longitude={longitude} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />
              </section>
              <section className={sectionCls}>
                <h3 className="font-black text-base text-on-surface mb-4">{tp('eqrHeadContact')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>{tp('eqrLabelPhone')}</label><input className={inputCls} value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+968" /></div>
                  <div><label className={labelCls}>{tp('eqrLabelWhatsapp')}</label><input className={inputCls} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+968" /></div>
                </div>
              </section>
            </div>
          )}
        </MultiStepForm>

        {errors.length > 0 && <FormErrorOverlay messages={errors} onClose={() => setErrors([])} />}
      </main>
    </AuthGuard>
  );
}
