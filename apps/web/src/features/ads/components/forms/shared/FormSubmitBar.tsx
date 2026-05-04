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
    <div className="sticky bottom-0 z-30 bg-surface/95 dark:bg-surface/95 backdrop-blur-sm border-t border-outline-variant/10 py-4 px-4">
      <div className="max-w-[900px] mx-auto flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-5 py-3 rounded-2xl text-sm font-bold text-on-surface-variant border border-outline-variant/20 bg-surface-container-low hover:bg-surface-container transition-all disabled:opacity-50 shrink-0"
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
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black bg-primary text-on-primary hover:brightness-110 transition-all disabled:opacity-50 shadow-lg"
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
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black bg-primary text-on-primary hover:brightness-110 transition-all disabled:opacity-50 shadow-lg"
          >
            {nextLabel}
            <span className="material-symbols-outlined text-base icon-flip">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  );
}
