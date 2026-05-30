'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import { transportApi } from '../api';
import { useUploadImage } from '@/lib/api';
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_COLORS,
  SERVICE_TYPE_BG_COLORS,
  VEHICLE_TYPE_LABELS,
  OMAN_GOVERNORATES,
} from '../constants';
import { Loader2, Phone, MessageCircle, AlertCircle, Upload, ShieldCheck } from 'lucide-react';
import type { VehicleType, TransportServiceType } from '../types';

const ALL_VEHICLE_TYPES: VehicleType[] = [
  'PICKUP', 'VAN', 'TRUCK_SMALL', 'TRUCK_LARGE', 'TRAILER', 'EXCAVATOR', 'TIPPER', 'CRANE', 'OTHER',
];

const ALL_SERVICE_TYPES: TransportServiceType[] = [
  'GOODS', 'FURNITURE', 'CONSTRUCTION', 'HEAVY', 'BACKLOAD', 'EQUIPMENT',
];

const OMAN_PHONE_REGEX = /^(\+968)?[789]\d{7}$/;

const schema = z.object({
  companyName: z.string().min(2, 'الاسم مطلوب (على الأقل حرفين)'),
  bio: z.string().min(10, 'النبذة مطلوبة (على الأقل 10 أحرف)'),
  vehicleTypes: z.array(z.string()).min(1, 'اختر نوع مركبة واحد على الأقل'),
  serviceTypes: z.array(z.string()).min(1, 'اختر خدمة واحدة على الأقل'),
  governorate: z.string().min(1, 'اختر المحافظة'),
  city: z.string().min(2, 'المدينة مطلوبة'),
  contactPhone: z.string().regex(OMAN_PHONE_REGEX, 'رقم عماني غير صالح'),
  whatsapp: z.string().regex(OMAN_PHONE_REGEX, 'رقم واتساب عماني غير صالح'),
  idCardUrl: z.string().url('يرجى رفع صورة البطاقة الشخصية'),
  licenseUrl: z.string().url('يرجى رفع صورة الرخصة'),
});

type FormData = z.infer<typeof schema>;

export default function CarrierRegistrationForm() {
  const router = useRouter();
  const uploadMutation = useUploadImage();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleTypes: [],
      serviceTypes: [],
      idCardUrl: '',
      licenseUrl: '',
    }
  });

  const idCardUrl = watch('idCardUrl');
  const licenseUrl = watch('licenseUrl');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'idCardUrl' | 'licenseUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const toastId = toast.loading('جاري رفع الصورة...');
      const result = await uploadMutation.mutateAsync(file);
      setValue(fieldName, result.url, { shouldValidate: true });
      toast.success('تم الرفع بنجاح', { id: toastId });
    } catch (err) {
      toast.error('حدث خطأ أثناء الرفع، حاول مرة أخرى');
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await transportApi.createCarrierProfile({
        ...data,
        vehicleTypes: data.vehicleTypes as VehicleType[],
        serviceTypes: data.serviceTypes as TransportServiceType[],
      });
      toast.success('تم إنشاء الملف بنجاح! سيتم مراجعته قريباً.');
      router.replace('/transport/carriers/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'حدث خطأ أثناء إرسال الطلب');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" dir="rtl">
      
      {/* 1. Basic Info */}
      <div className="card-base p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand-navy)]/10 flex items-center justify-center">
            <span className="text-[var(--color-brand-navy)] font-bold">1</span>
          </div>
          <h2 className="text-base font-bold text-[var(--color-on-surface)]">المعلومات الأساسية</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">
              اسم الشركة أو الفرد <span className="text-red-500">*</span>
            </label>
            <input {...register('companyName')} className="input-base" placeholder="مثال: شركة النقل السريع" />
            {errors.companyName && <p className="text-xs text-[var(--color-error)] mt-1">{errors.companyName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">
              نبذة عنك وعن خدماتك <span className="text-red-500">*</span>
            </label>
            <textarea {...register('bio')} className="input-base resize-none" rows={3} placeholder="اكتب نبذة مقنعة للعملاء تفصل فيها خبرتك وخدماتك..." />
            {errors.bio && <p className="text-xs text-[var(--color-error)] mt-1">{errors.bio.message}</p>}
          </div>
        </div>
      </div>

      {/* 2. Vehicles and Services */}
      <div className="card-base p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand-navy)]/10 flex items-center justify-center">
            <span className="text-[var(--color-brand-navy)] font-bold">2</span>
          </div>
          <h2 className="text-base font-bold text-[var(--color-on-surface)]">المركبات والخدمات</h2>
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-2">
            أنواع المركبات المملوكة <span className="text-red-500">*</span>
          </label>
          <Controller
            control={control}
            name="vehicleTypes"
            render={({ field: { value, onChange } }) => (
              <div className="flex flex-wrap gap-2">
                {ALL_VEHICLE_TYPES.map((v) => {
                  const isSelected = value.includes(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onChange(isSelected ? value.filter(x => x !== v) : [...value, v])}
                      className={`px-3 py-2 border rounded-xl text-sm font-semibold transition-all ${
                        isSelected 
                          ? 'bg-[var(--color-brand-navy)] border-[var(--color-brand-navy)] text-white' 
                          : 'bg-white border-[var(--color-outline)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-brand-navy)]'
                      }`}
                    >
                      {VEHICLE_TYPE_LABELS[v]}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.vehicleTypes && <p className="text-xs text-[var(--color-error)] mt-1">{errors.vehicleTypes.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-2">
            أنواع الخدمات المقدمة <span className="text-red-500">*</span>
          </label>
          <Controller
            control={control}
            name="serviceTypes"
            render={({ field: { value, onChange } }) => (
              <div className="flex flex-wrap gap-2">
                {ALL_SERVICE_TYPES.map((s) => {
                  const isSelected = value.includes(s);
                  const color = SERVICE_TYPE_COLORS[s];
                  const bg = SERVICE_TYPE_BG_COLORS[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onChange(isSelected ? value.filter(x => x !== s) : [...value, s])}
                      className={`px-3 py-2 border rounded-xl text-sm font-semibold transition-all ${
                        isSelected ? 'border-2' : 'bg-white border-[var(--color-outline)] text-[var(--color-on-surface-variant)]'
                      }`}
                      style={isSelected ? { backgroundColor: bg, borderColor: color, color } : {}}
                    >
                      {SERVICE_TYPE_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.serviceTypes && <p className="text-xs text-[var(--color-error)] mt-1">{errors.serviceTypes.message}</p>}
        </div>
      </div>

      {/* 3. Location and Contact */}
      <div className="card-base p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand-navy)]/10 flex items-center justify-center">
            <span className="text-[var(--color-brand-navy)] font-bold">3</span>
          </div>
          <h2 className="text-base font-bold text-[var(--color-on-surface)]">المنطقة والتواصل</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">
              المحافظة <span className="text-red-500">*</span>
            </label>
            <select {...register('governorate')} className="input-base">
              <option value="">اختر المحافظة</option>
              {OMAN_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            {errors.governorate && <p className="text-xs text-[var(--color-error)] mt-1">{errors.governorate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">
              المدينة (الولاية) <span className="text-red-500">*</span>
            </label>
            <input {...register('city')} className="input-base" placeholder="مثال: السيب" />
            {errors.city && <p className="text-xs text-[var(--color-error)] mt-1">{errors.city.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">
              رقم الهاتف <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="tel" {...register('contactPhone')} className="input-base pr-9" placeholder="+968 9xxx xxxx" dir="ltr" />
            </div>
            {errors.contactPhone && <p className="text-xs text-[var(--color-error)] mt-1 text-right">{errors.contactPhone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">
              رقم الواتساب <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MessageCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="tel" {...register('whatsapp')} className="input-base pr-9" placeholder="+968 9xxx xxxx" dir="ltr" />
            </div>
            {errors.whatsapp && <p className="text-xs text-[var(--color-error)] mt-1 text-right">{errors.whatsapp.message}</p>}
          </div>
        </div>
      </div>

      {/* 4. Verification Docs */}
      <div className="card-base p-5 flex flex-col gap-4 border border-[var(--color-brand-navy)]/30 bg-[var(--color-brand-navy)]/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand-navy)] flex items-center justify-center">
            <span className="text-white font-bold">4</span>
          </div>
          <h2 className="text-base font-bold text-[var(--color-brand-navy)]">التوثيق الإلزامي</h2>
        </div>
        <p className="text-sm text-[var(--color-on-surface-variant)]">لضمان موثوقية المنصة وجودة الخدمات المقدمة للعملاء، يجب إرفاق المستندات التالية.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-bold text-[var(--color-on-surface-variant)]">
              صورة البطاقة الشخصية <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full h-32 border-2 border-dashed border-[var(--color-outline)] rounded-xl flex items-center justify-center bg-white overflow-hidden group">
              {idCardUrl ? (
                <img src={idCardUrl} alt="البطاقة" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-[var(--color-on-surface-muted)]">
                  <Upload size={24} className="mb-2 group-hover:text-[var(--color-brand-navy)] transition-colors" />
                  <span className="text-xs font-semibold">اضغط لرفع الصورة</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'idCardUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            {errors.idCardUrl && <p className="text-xs text-[var(--color-error)]">{errors.idCardUrl.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-sm font-bold text-[var(--color-on-surface-variant)]">
              صورة رخصة القيادة / المركبة <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full h-32 border-2 border-dashed border-[var(--color-outline)] rounded-xl flex items-center justify-center bg-white overflow-hidden group">
              {licenseUrl ? (
                <img src={licenseUrl} alt="الرخصة" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-[var(--color-on-surface-muted)]">
                  <Upload size={24} className="mb-2 group-hover:text-[var(--color-brand-navy)] transition-colors" />
                  <span className="text-xs font-semibold">اضغط لرفع الصورة</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'licenseUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            {errors.licenseUrl && <p className="text-xs text-[var(--color-error)]">{errors.licenseUrl.message}</p>}
          </div>
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3 mt-2 text-base shadow-lg shadow-[var(--color-brand-navy)]/20">
        {submitting ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
        تأكيد ورفع طلب التوثيق
      </button>

      {Object.keys(errors).length > 0 && (
        <div className="bg-[var(--color-error-light)] text-[var(--color-error)] p-3 rounded-xl flex items-center gap-2 text-sm font-bold mt-2">
          <AlertCircle size={18} />
          <span>يرجى التأكد من ملء جميع الحقول الإجبارية بالشكل الصحيح.</span>
        </div>
      )}
    </form>
  );
}
