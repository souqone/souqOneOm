'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUpdateDriverProfile } from '@/lib/api/jobs';

interface DriverAvailabilityToggleProps {
  isAvailable: boolean;
}

export function DriverAvailabilityToggle({ isAvailable: initialAvailable }: DriverAvailabilityToggleProps) {
  const tp = useTranslations('pages');
  const updateProfile = useUpdateDriverProfile();
  const [isAvailable, setIsAvailable] = useState(initialAvailable);

  const handleToggle = () => {
    const next = !isAvailable;
    setIsAvailable(next);
    updateProfile.mutate(
      { isAvailable: next },
      { onError: () => setIsAvailable(!next) },
    );
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-on-surface text-[13px]">{tp('availability')}</p>
          <p className={`text-[11px] mt-0.5 font-medium ${isAvailable ? 'text-green-600' : 'text-on-surface-variant/50'}`}>
            {isAvailable ? tp('availableNow') : tp('notAvailable')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={updateProfile.isPending}
          aria-label={tp('toggleAvailability')}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0
                     focus:outline-none focus:ring-2 focus:ring-primary/30
                     ${isAvailable ? 'bg-green-400' : 'bg-surface-container-high'}
                     disabled:opacity-50`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-background rounded-full shadow-sm transition-all duration-200
                       ${isAvailable ? 'right-1' : 'left-1'}`}
          />
        </button>
      </div>
    </div>
  );
}
