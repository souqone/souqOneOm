'use client';

import { useTranslations } from 'next-intl';

type BookingRole = 'renter' | 'owner';

interface Props { role: BookingRole; onChange: (r: BookingRole) => void }

export function BookingsRoleToggle({ role, onChange }: Props) {
  const tb = useTranslations('bookings');

  return (
    <div className="flex bg-surface-container-low rounded-2xl p-1 gap-1">
      {(['renter', 'owner'] as BookingRole[]).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-[13px] font-semibold transition-all ${
            role === r
              ? 'bg-surface-container-lowest text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {r === 'renter' ? 'person' : 'business_center'}
          </span>
          {tb(r === 'renter' ? 'roleRenter' : 'roleOwner')}
        </button>
      ))}
    </div>
  );
}
