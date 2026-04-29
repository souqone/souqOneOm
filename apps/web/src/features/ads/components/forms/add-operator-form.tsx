'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { MultiStepForm } from '@/components/ui/multi-step-form';
import { FormErrorOverlay } from '@/components/form-error-overlay';
import { useCreateOperatorListing } from '@/lib/api/equipment';
import { useToast } from '@/components/toast';
import { getGovernorates, type LocationOption } from '@/lib/location-data';
import { inputCls, labelCls, sectionCls, sectionTitleCls, chipCls, checkboxLabelCls, checkboxCls, checkboxTextCls } from '@/lib/constants/form-styles';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

const OPERATOR_TYPES = [
  { value: 'DRIVER', labelKey: 'opTypeDriver', icon: 'drive_eta', descKey: 'opTypeDriverDesc' },
  { value: 'OPERATOR', labelKey: 'opTypeOperator', icon: 'precision_manufacturing', descKey: 'opTypeOperatorDesc' },
  { value: 'TECHNICIAN', labelKey: 'opTypeTechnician', icon: 'build', descKey: 'opTypeTechnicianDesc' },
  { value: 'MAINTENANCE', labelKey: 'opTypeMaintenance', icon: 'handyman', descKey: 'opTypeMaintenanceDesc' },
];

const EQUIP_TYPES = [
  { value: 'EXCAVATOR', key: 'opExcavator' }, { value: 'CRANE', key: 'opCrane' },
  { value: 'LOADER', key: 'opLoader' }, { value: 'BULLDOZER', key: 'opBulldozer' },
  { value: 'FORKLIFT', key: 'opForklift' }, { value: 'CONCRETE_MIXER', key: 'opConcreteMixer' },
  { value: 'GENERATOR', key: 'opGenerator' }, { value: 'COMPRESSOR', key: 'opCompressor' },
  { value: 'TRUCK', key: 'opTruck' }, { value: 'DUMP_TRUCK', key: 'opDumpTruck' },
  { value: 'WATER_TANKER', key: 'opWaterTanker' }, { value: 'LIGHT_EQUIPMENT', key: 'opLightEquip' },
];


export function AddOperatorForm() {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const { addToast } = useToast();
  const createOp = useCreateOperatorListing();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const [operatorType, setOperatorType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [specializations, setSpecializations] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [certifications, setCertifications] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [isPriceNegotiable, setIsPriceNegotiable] = useState(false);
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [contactPhone, setContactPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const governorateOptions = getGovernorates('OM', locale);

  const steps = [
    { label: tp('opStepType'), icon: 'engineering' },
    { label: tp('opStepInfo'), icon: 'description' },
    { label: tp('opStepPrice'), icon: 'payments' },
  ];
  const maxStep = steps.length - 1;

  const canProceed =
    step === 0 ? !!operatorType :
    step === 1 ? !!(title && description) :
    true;

  function toggleEquipType(v: string) {
    setEquipmentTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  async function handleSubmit() {
    const errs: string[] = [];
    if (!title) errs.push(tp('opErrTitle'));
    if (!description) errs.push(tp('opErrDesc'));
    if (errs.length) { setErrors(errs); return; }

    try {
      const data: Record<string, unknown> = {
        title, description, operatorType,
        specializations: specializations ? specializations.split(',').map(s => s.trim()).filter(Boolean) : [],
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
        equipmentTypes: equipmentTypes.length ? equipmentTypes : undefined,
        certifications: certifications ? certifications.split(',').map(s => s.trim()).filter(Boolean) : [],
        dailyRate: dailyRate ? Number(dailyRate) : undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        isPriceNegotiable,
        governorate: governorate || undefined, city: city || undefined,
        latitude: latitude ?? undefined, longitude: longitude ?? undefined,
        contactPhone: contactPhone || undefined, whatsapp: whatsapp || undefined,
      };

      const result = await createOp.mutateAsync(data);
      addToast('success', tp('opSuccess'));
      router.push(`/equipment/operators/${result.id}`);
    } catch (e: any) {
      addToast('error', e?.message || tp('opError'));
    }
  }

  return (
    <>
      <MultiStepForm
        steps={steps}
        currentStep={step}
        onNext={() => { setStep(s => Math.min(s + 1, maxStep)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onBack={() => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSubmit={handleSubmit}
        isLoading={createOp.isPending}
        submitLabel={tp('opSubmit')}
        canProceed={canProceed}
        title={tp('opTitle')}
      >
        {/* Step 0 */}
        {step === 0 && (
          <section className={sectionCls}>
            <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">engineering</span>{tp('opLabelServiceType')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {OPERATOR_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setOperatorType(t.value)}
                  className={`p-4 rounded-2xl border-2 text-start transition-all ${operatorType === t.value ? 'border-primary bg-primary/5' : 'border-outline-variant/10 hover:border-primary/30'}`}>
                  <span className="material-symbols-outlined text-2xl text-primary mb-2 block">{t.icon}</span>
                  <p className="font-bold text-sm">{tp(t.labelKey)}</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">{tp(t.descKey)}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">edit_note</span>{tp('opLabelBasicInfo')}</h2>
              <div className="space-y-4">
                <div><label className={labelCls}>{tp('opLabelTitle')}</label><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder={tp('opPlaceholderTitle')} /></div>
                <div><label className={labelCls}>{tp('opLabelDesc')}</label><textarea className={`${inputCls} min-h-[100px]`} value={description} onChange={e => setDescription(e.target.value)} placeholder={tp('opPlaceholderDesc')} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>{tp('opLabelExperience')}</label><input type="number" className={inputCls} value={experienceYears} onChange={e => setExperienceYears(e.target.value)} placeholder="10" /></div>
                  <div><label className={labelCls}>{tp('opLabelSpecializations')}</label><input className={inputCls} value={specializations} onChange={e => setSpecializations(e.target.value)} placeholder={tp('opPlaceholderSpec')} /></div>
                </div>
                <div><label className={labelCls}>{tp('opLabelCerts')}</label><input className={inputCls} value={certifications} onChange={e => setCertifications(e.target.value)} placeholder={tp('opPlaceholderCerts')} /></div>
              </div>
            </section>
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">construction</span>{tp('opLabelEquipTypes')}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {EQUIP_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => toggleEquipType(t.value)}
                    className={chipCls(equipmentTypes.includes(t.value))}>
                    {tp(t.key)}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">payments</span>{tp('opLabelPrices')}</h2>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div><label className={labelCls}>{tp('opLabelDailyRate')}</label><input type="number" className={inputCls} value={dailyRate} onChange={e => setDailyRate(e.target.value)} /></div>
                <div><label className={labelCls}>{tp('opLabelHourlyRate')}</label><input type="number" className={inputCls} value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} /></div>
              </div>
              <label className={checkboxLabelCls}><input type="checkbox" checked={isPriceNegotiable} onChange={e => setIsPriceNegotiable(e.target.checked)} className={checkboxCls} /><span className={checkboxTextCls}>{tp('opLabelNegotiable')}</span></label>
            </section>
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">location_on</span>{tp('opLabelLocationContact')}</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelCls}>{tp('opLabelGov')}</label>
                  <select className={inputCls} value={governorate} onChange={e => setGovernorate(e.target.value)}>
                    <option value="">{tp('opSelectGov')}</option>
                    {governorateOptions.map((g: LocationOption) => <option key={g.value} value={g.label}>{g.label}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>{tp('opLabelCity')}</label><input className={inputCls} value={city} onChange={e => setCity(e.target.value)} /></div>
                <div>
                  <label className={labelCls}>{tp('opLabelPhone')}</label>
                  <div className="flex items-center gap-0">
                    <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                    <input type="tel" className={inputCls + ' rounded-s-none'} value={contactPhone} onChange={e => setContactPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{tp('opLabelWhatsapp')}</label>
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
      </MultiStepForm>

      {errors.length > 0 && <FormErrorOverlay messages={errors} onClose={() => setErrors([])} />}
    </>
  );
}
