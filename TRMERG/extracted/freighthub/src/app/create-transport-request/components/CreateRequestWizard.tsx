'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import WizardProgress from './WizardProgress';
import Step1ServiceType from './Step1ServiceType';
import Step2Route from './Step2Route';
import Step3Cargo from './Step3Cargo';
import Step4Timing from './Step4Timing';
import Step5Review from './Step5Review';
import { transportApi } from '@/features/transport/api';
import type { CreateRequestDto, TransportServiceType } from '@/features/transport/types';

export const createRequestSchema = z.object({
  serviceType: z.enum(['GOODS', 'FURNITURE', 'CONSTRUCTION', 'HEAVY', 'BACKLOAD', 'EQUIPMENT'], {
    required_error: 'يرجى اختيار نوع الخدمة',
  }),
  fromGovernorate: z.string().min(1, 'يرجى اختيار محافظة الانطلاق'),
  fromCity: z.string().optional(),
  fromAddress: z.string().min(5, 'يرجى إدخال عنوان التحميل (5 أحرف على الأقل)'),
  toGovernorate: z.string().min(1, 'يرجى اختيار محافظة الوصول'),
  toCity: z.string().optional(),
  toAddress: z.string().min(5, 'يرجى إدخال عنوان التسليم (5 أحرف على الأقل)'),
  cargoDescription: z.string().min(5, 'يرجى وصف البضاعة (5 أحرف على الأقل)'),
  weightTons: z.coerce.number().min(0.1, 'الوزن يجب أن يكون أكبر من صفر').optional().or(z.literal('')),
  requiresHelper: z.boolean().default(false),
  notes: z.string().optional(),
  timingType: z.enum(['asap', 'scheduled']).default('asap'),
  scheduledAt: z.string().optional(),
  isFlexible: z.boolean().default(true),
  budgetMin: z.coerce.number().min(0).optional().or(z.literal('')),
  budgetMax: z.coerce.number().min(0).optional().or(z.literal('')),
});

export type CreateRequestFormData = z.infer<typeof createRequestSchema>;

const STEP_TITLES = [
  'نوع الخدمة',
  'مسار الرحلة',
  'تفاصيل البضاعة',
  'الموعد والميزانية',
  'مراجعة وإرسال',
];

const STEP_VALIDATION_FIELDS: (keyof CreateRequestFormData)[][] = [
  ['serviceType'],
  ['fromGovernorate', 'fromAddress', 'toGovernorate', 'toAddress'],
  ['cargoDescription'],
  [],
  [],
];

export default function CreateRequestWizard() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const methods = useForm<CreateRequestFormData>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      requiresHelper: false,
      isFlexible: true,
      timingType: 'asap',
    },
    mode: 'onTouched',
  });

  const { handleSubmit, trigger } = methods;

  async function handleNext() {
    const fieldsToValidate = STEP_VALIDATION_FIELDS[step - 1];
    const valid = await trigger(fieldsToValidate);
    if (valid) {
      setStep((s) => Math.min(s + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function onSubmit(data: CreateRequestFormData) {
    setIsSubmitting(true);
    try {
      const dto: CreateRequestDto = {
        serviceType: data.serviceType as TransportServiceType,
        fromGovernorate: data.fromGovernorate,
        fromCity: data.fromCity,
        fromAddress: data.fromAddress,
        toGovernorate: data.toGovernorate,
        toCity: data.toCity,
        toAddress: data.toAddress,
        cargoDescription: data.cargoDescription,
        weightTons: data.weightTons ? Number(data.weightTons) : undefined,
        requiresHelper: data.requiresHelper,
        notes: data.notes,
        scheduledAt: data.timingType === 'scheduled' ? data.scheduledAt : undefined,
        isFlexible: data.isFlexible,
        budgetMin: data.budgetMin ? Number(data.budgetMin) : undefined,
        budgetMax: data.budgetMax ? Number(data.budgetMax) : undefined,
      };
      // BACKEND INTEGRATION POINT: transportApi.createRequest(dto)
      await transportApi.createRequest(dto);
      toast.success('تم إنشاء طلب النقل بنجاح! ستصلك العروض قريباً.');
      router.push('/browse-transport-requests');
    } catch {
      toast.error('حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <div dir="rtl">
        {/* Page Title */}
        <div className="mb-6">
          <h1
            className="text-2xl sm:text-3xl text-[var(--color-on-surface)]"
            style={{ fontWeight: 800 }}
          >
            أنشئ طلب نقل جديد
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            أكمل الخطوات التالية لنشر طلبك وبدء استقبال العروض
          </p>
        </div>

        {/* Progress */}
        <WizardProgress currentStep={step} totalSteps={5} stepTitles={STEP_TITLES} />

        {/* Step Content */}
        <div className="card-base p-5 sm:p-7 mt-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {step === 1 && <Step1ServiceType />}
            {step === 2 && <Step2Route />}
            {step === 3 && <Step3Cargo />}
            {step === 4 && <Step4Timing />}
            {step === 5 && <Step5Review />}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--color-outline-variant)]">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-outline)] text-sm font-bold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              >
                رجوع
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-on-surface-muted)]">
                  الخطوة {step} من 5
                </span>
              </div>

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary text-sm py-2.5 px-6"
                >
                  التالي
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-sm py-2.5 px-6 min-w-[120px] justify-center"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      جارٍ الإرسال...
                    </span>
                  ) : (
                    'إرسال الطلب'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </FormProvider>
  );
}