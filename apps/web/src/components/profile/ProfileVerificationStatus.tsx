import { useLocale } from 'next-intl';
import { resolveLocationLabel } from '@/lib/location-data';
import type { UserProfile } from '@/lib/api/users';

interface ProfileVerificationStatusProps {
  user: UserProfile;
  onAddPhone: () => void;
  labels: {
    phoneVerified: string;
    addPhone: string;
    accountVerified: string;
    verifyEmail: string;
  };
}

export function ProfileVerificationStatus({ user, onAddPhone, labels }: ProfileVerificationStatusProps) {
  const locale = useLocale();

  return (
    <div className="flex gap-2 flex-wrap px-4 py-3 max-w-5xl mx-auto md:px-6">
      <VerifiedPill label={user.phone ? labels.phoneVerified : labels.addPhone} verified={!!user.phone} onClick={user.phone ? undefined : onAddPhone} />
      <VerifiedPill label={user.isVerified ? labels.accountVerified : labels.verifyEmail} verified={user.isVerified} />
      {user.governorate && (
        <VerifiedPill label={resolveLocationLabel(user.governorate, locale) || user.governorate} verified />
      )}
    </div>
  );
}

function VerifiedPill({ label, verified, onClick }: { label: string; verified: boolean; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${
        verified
          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
          : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:border-primary/40 cursor-pointer transition-colors'
      }`}
    >
      <span className="material-symbols-outlined text-xs" style={verified ? { fontVariationSettings: "'FILL' 1" } : undefined}>
        {verified ? 'check_circle' : 'radio_button_unchecked'}
      </span>
      {label}
    </span>
  );
}
