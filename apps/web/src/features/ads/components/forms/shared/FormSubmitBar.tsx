'use client';

interface FormSubmitBarProps {
  onBack?: () => void;
  onNext?: () => void;
  isLastStep?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  nextLabel?: string;
  submitLabel?: string;
  backLabel?: string;
  canProceed?: boolean;
}

export function FormSubmitBar({
  onBack,
  onNext,
  isLastStep = false,
  isLoading = false,
  loadingText = 'جاري الحفظ...',
  nextLabel = 'التالي',
  submitLabel = 'نشر الإعلان',
  backLabel = 'السابق',
  canProceed = true,
}: FormSubmitBarProps) {
  const isSubmit = isLastStep || !onNext;

  return (
    <div className="sticky bottom-0 z-30 backdrop-blur-sm border-t border-[var(--color-outline-variant)] py-4 px-4" style={{ background: 'color-mix(in srgb, var(--color-surface) 95%, transparent)' }}>
      <div className="max-w-[900px] mx-auto flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-5 py-3 rounded-2xl text-sm font-bold text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] transition-all disabled:opacity-50 shrink-0"
          >
            <span className="material-symbols-outlined text-base icon-flip">arrow_forward</span>
            {backLabel}
          </button>
        )}

        {isSubmit ? (
          <button
            type={onNext ? 'button' : 'submit'}
            onClick={onNext}
            disabled={isLoading || !canProceed}
            className="btn-navy flex-1 justify-center py-3 text-sm disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">
                  progress_activity
                </span>
                {loadingText}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">check_circle</span>
                {submitLabel}
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={isLoading || !canProceed}
            className="btn-navy flex-1 justify-center py-3 text-sm disabled:opacity-50"
          >
            {nextLabel}
            <span className="material-symbols-outlined text-base icon-flip">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  );
}
