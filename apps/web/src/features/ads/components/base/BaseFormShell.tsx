'use client';

import type { ReactNode } from 'react';
import { MultiStepForm, type StepConfig } from '@/components/ui/multi-step-form';
import { FormErrorDisplay } from '@/features/ads/components/forms/shared';

interface BaseFormShellProps {
  steps: StepConfig[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void | Promise<void>;
  canProceed: boolean;
  isLoading: boolean;
  submitLabel: string;
  title: string;
  errors: string[];
  onClearErrors: () => void;
  children: ReactNode;
}

export function BaseFormShell({
  steps,
  currentStep,
  onNext,
  onBack,
  onSubmit,
  canProceed,
  isLoading,
  submitLabel,
  title,
  errors,
  onClearErrors,
  children,
}: BaseFormShellProps) {
  return (
    <>
      <MultiStepForm
        steps={steps}
        currentStep={currentStep}
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
        isLoading={isLoading}
        submitLabel={submitLabel}
        canProceed={canProceed}
        title={title}
      >
        {children}
      </MultiStepForm>
      <FormErrorDisplay errors={errors} onClose={onClearErrors} />
    </>
  );
}
