'use client';

import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

export interface StepConfig {
  label: string;
  icon?: string;
}

interface MultiStepFormProps {
  steps: StepConfig[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  canProceed?: boolean;
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function MultiStepForm({
  steps,
  currentStep,
  onNext,
  onBack,
  onSubmit,
  isLoading = false,
  submitLabel,
  canProceed = true,
  children,
  title,
  subtitle,
}: MultiStepFormProps) {
  const tp = useTranslations('pages');
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  const wizardStep = currentStep + 1;
  const totalSteps = steps.length;
  const progressPercent = totalSteps > 1 ? ((wizardStep - 1) / (totalSteps - 1)) * 100 : 100;

  return (
    <div className="w-full max-w-2xl mx-auto" data-testid="form-shell">
      {/* ── Page Title ── */}
      {title && (
        <div className="mb-6">
          <h1 className="text-xl font-black text-[var(--color-on-surface)] text-center">{title}</h1>
          {subtitle && (
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1 text-center">{subtitle}</p>
          )}
        </div>
      )}

      {/* ── WizardProgress ── */}
      <div className="mb-6">
        {/* Amber progress bar */}
        <div className="h-1.5 bg-[var(--color-surface-container-high)] rounded-full mb-5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, var(--color-brand-amber) 0%, #f59e0b 100%)',
            }}
          />
        </div>

        {/* Step dots */}
        <div className="flex items-start justify-center gap-0">
          {steps.map((step, index) => {
            const stepNum = index + 1;
            const isCompleted = stepNum < wizardStep;
            const isCurrent = stepNum === wizardStep;
            return (
              <div key={index} className="flex flex-col items-center gap-1.5 flex-1 px-1">
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
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Card: content + navigation ── */}
      <div className="card-base p-5 sm:p-6">
        {/* Step content */}
        {children}

        {/* Navigation — inside card with border-t separator */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--color-outline-variant)]">
          {!isFirst ? (
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              data-testid="back-button"
              className="px-5 py-2.5 rounded-xl border border-[var(--color-outline-variant)] text-sm font-bold text-[var(--color-on-surface-variant)] disabled:opacity-40 hover:bg-[var(--color-surface-container)] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined icon-flip text-sm">chevron_right</span>
              {tp('multiStepPrev')}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs text-[var(--color-on-surface-muted)] hidden sm:inline">
              {tp('multiStepOf', { current: currentStep + 1, total: steps.length })}
            </span>
            {isLast ? (
              <button
                type="button"
                onClick={onSubmit}
                disabled={isLoading || !canProceed}
                data-testid="submit-button"
                className="btn-navy px-6 py-2.5 text-sm disabled:opacity-60 active:scale-[0.97]"
              >
                {isLoading && (
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                )}
                {isLoading ? tp('multiStepSaving') : (submitLabel || tp('multiStepSubmit'))}
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                disabled={!canProceed}
                data-testid="next-button"
                className="btn-navy px-6 py-2.5 text-sm disabled:opacity-50 active:scale-[0.97]"
              >
                {tp('multiStepNext')}
                <span className="material-symbols-outlined icon-flip text-sm">chevron_left</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
