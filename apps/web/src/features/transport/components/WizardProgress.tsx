'use client';

import { Check } from 'lucide-react';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export default function WizardProgress({ currentStep, totalSteps, stepTitles }: WizardProgressProps) {
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div dir="rtl">
      <div className="h-1.5 bg-[var(--color-surface-container-high)] rounded-full mb-5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, var(--color-brand-amber) 0%, #f59e0b 100%)',
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide pb-1">
        {stepTitles.map((title, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div
              key={`wizard-step-${stepNum}`}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-[60px]"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[var(--color-brand-green)] text-white shadow-sm'
                    : isCurrent
                    ? 'bg-[var(--color-brand-navy)] text-white shadow-md ring-4 ring-[var(--color-brand-navy)]/20'
                    : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-muted)]'
                }`}
              >
                {isCompleted ? <Check size={14} /> : stepNum}
              </div>
              <span
                className={`text-[10px] font-semibold text-center leading-tight ${
                  isCurrent
                    ? 'text-[var(--color-brand-navy)]'
                    : isCompleted
                    ? 'text-[var(--color-brand-green)]'
                    : 'text-[var(--color-on-surface-muted)]'
                }`}
              >
                {title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
