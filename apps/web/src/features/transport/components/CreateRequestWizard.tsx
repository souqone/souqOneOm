'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useRouter } from '@/i18n/navigation';
import { toast, Toaster } from 'sonner';
import { transportApi } from '../api';
import type { CreateTransportRequestDto, TransportServiceType } from '../types';
import WizardProgress from './WizardProgress';
import Step1ServiceType from './Step1ServiceType';
import Step2Route from './Step2Route';
import Step3Cargo from './Step3Cargo';
import Step4Timing from './Step4Timing';
import Step5Review from './Step5Review';

const STEP_TITLES = ['الخدمة', 'المسار', 'البضاعة', 'الموعد', 'المراجعة'];
const TOTAL_STEPS = 5;

export interface CreateRequestFormData {
  serviceType: 'GOODS' | 'FURNITURE' | 'CONSTRUCTION' | 'HEAVY' | 'BACKLOAD' | 'EQUIPMENT';
  fromGovernorate: string;
  fromCity?: string;
  fromAddress: string;
  toGovernorate: string;
  toCity?: string;
  toAddress: string;
  cargoDescription: string;
  weightTons?: number | string;
  requiresHelper: boolean;
  notes?: string;
  timingType: 'asap' | 'scheduled';
  scheduledAt?: string;
  isFlexible: boolean;
  budgetMin?: number | string;
  budgetMax?: number | string;
  fromLat?: number | null;
  fromLng?: number | null;
  toLat?: number | null;
  toLng?: number | null;
}

const STEP_FIELDS: Record<number, (keyof CreateRequestFormData)[]> = {
  1: ['serviceType'],
  2: ['fromGovernorate', 'fromAddress', 'toGovernorate', 'toAddress'],
  3: ['cargoDescription'],
  4: ['timingType', 'scheduledAt'],
  5: [],
};

export interface CreateRequestWizardProps {
  requestId?: string;
  initialData?: Partial<CreateRequestFormData>;
}

export default function CreateRequestWizard({ requestId, initialData }: CreateRequestWizardProps = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const router = useRouter();

  const methods = useForm<CreateRequestFormData>({
    defaultValues: initialData || {
      timingType: 'asap',
      isFlexible: false,
      requiresHelper: false,
      fromLat: null,
      fromLng: null,
      toLat: null,
      toLng: null,
    },
    mode: 'onBlur',
  });

  // Load draft from sessionStorage if no initialData is provided
  useEffect(() => {
    if (!initialData) {
      const draftStr = sessionStorage.getItem('transport_draft');
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          Object.keys(draft).forEach((key) => {
            if (draft[key] !== undefined && draft[key] !== null) {
              methods.setValue(key as keyof CreateRequestFormData, draft[key]);
            }
          });
          sessionStorage.removeItem('transport_draft');
        } catch (e) {
          console.error('Failed to parse draft from sessionStorage', e);
        }
      }
    }
  }, [initialData, methods]);

  async function handleNext() {
    const fields = STEP_FIELDS[currentStep];
    const valid = await methods.trigger(fields);
    if (valid) {
      setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
    } else {
      toast.error('يرجى إكمال الحقول المطلوبة قبل المتابعة');
    }
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  async function onSubmit(data: CreateRequestFormData) {
    if (submittedRef.current) return;

    const budgetMinNum = data.budgetMin ? Number(data.budgetMin) : undefined;
    const budgetMaxNum = data.budgetMax ? Number(data.budgetMax) : undefined;
    if (budgetMinNum !== undefined && budgetMaxNum !== undefined &&
        budgetMinNum > budgetMaxNum) {
      toast.error('الحد الأدنى للميزانية يجب أن يكون أقل من الحد الأعلى');
      submittedRef.current = false;
      setIsSubmitting(false);
      return;
    }

    submittedRef.current = true;
    setIsSubmitting(true);
    try {
      const dto: CreateTransportRequestDto = {
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
        fromLat: data.fromLat ?? undefined,
        fromLng: data.fromLng ?? undefined,
        toLat: data.toLat ?? undefined,
        toLng: data.toLng ?? undefined,
      };

      if (requestId) {
        await transportApi.updateRequest(requestId, dto);
        toast.success('تم تحديث طلبك بنجاح!');
      } else {
        await transportApi.createRequest(dto);
        toast.success('تم إرسال طلبك بنجاح! ستبدأ في استقبال العروض قريباً.');
      }
      router.push('/transport/my-requests');
    } catch {
      submittedRef.current = false;
      toast.error('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const STEP_COMPONENTS: Record<number, React.ReactElement> = {
    1: <Step1ServiceType />,
    2: <Step2Route />,
    3: <Step3Cargo />,
    4: <Step4Timing />,
    5: <Step5Review />,
  };

  const isFinalStep = currentStep === TOTAL_STEPS;

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-[var(--color-background)] flex items-start justify-center px-4 py-8" dir="rtl">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>
              {requestId ? 'تعديل طلب نقل' : 'إنشاء طلب نقل'}
            </h1>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
              {requestId ? 'قم بتحديث تفاصيل طلبك' : 'أنشئ طلبك وابدأ في استقبال العروض من المزودين'}
            </p>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <WizardProgress
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
              stepTitles={STEP_TITLES}
            />
          </div>

          {/* Card */}
          <div className="card-base p-6">
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
                {STEP_COMPONENTS[currentStep]}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--color-outline-variant)]">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="px-5 py-2.5 rounded-xl border border-[var(--color-outline-variant)] text-sm font-bold text-[var(--color-on-surface-variant)] disabled:opacity-40 hover:bg-[var(--color-surface-container)] transition-colors"
                  >
                    رجوع
                  </button>

                  {isFinalStep ? (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-navy px-6 py-2.5 text-sm disabled:opacity-60"
                    >
                      {isSubmitting ? 'جارٍ الإرسال...' : (requestId ? 'حفظ التعديلات' : 'إرسال الطلب')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="btn-navy px-6 py-2.5 text-sm"
                    >
                      التالي
                    </button>
                  )}
                </div>
              </form>
            </FormProvider>
          </div>
        </div>
      </div>
    </>
  );
}
