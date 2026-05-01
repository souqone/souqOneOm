import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { VerifiedBadge } from '@/components/verified-badge';
import { getImageUrl } from '@/lib/image-utils';
import { getCountryLabel, getGovernorateLabel, getCityLabel, resolveLocationLabel } from '@/lib/location-data';
import type { UserProfile } from '@/lib/api/users';

interface ProfileHeroProps {
  user: UserProfile;
  stats: {
    listingsCount: number;
    favoritesCount: number;
    bookingsCount: number;
  };
  onAvatarClick: () => void;
  avatarUploading: boolean;
  labels: {
    editProfile: string;
    memberSince: string;
    listings: string;
    favorites: string;
    bookings: string;
  };
}

export function ProfileHero({ user, stats, onAvatarClick, avatarUploading, labels }: ProfileHeroProps) {
  const locale = useLocale();
  const initial = (user.displayName || user.username)[0]?.toUpperCase();

  return (
    <div>
      <div className="relative h-36 md:h-44 bg-gradient-to-bl from-[#004ac6] via-[#1d4ed8] to-[#0B2447] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h30v30H0zm30 30h30v30H30z\' fill=\'%23fff\' fill-opacity=\'.5\'/%3E%3C/svg%3E")', backgroundSize: '30px 30px' }} />
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-10 md:-mt-12">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4 md:p-5">
          <div className="flex items-end justify-between gap-4">
            <button
              type="button"
              onClick={onAvatarClick}
              disabled={avatarUploading}
              className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-background shadow-xl overflow-hidden group flex-shrink-0"
            >
              {user.avatarUrl ? (
                <Image src={getImageUrl(user.avatarUrl) || ''} alt={user.displayName || user.username} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-[#0B2447] flex items-center justify-center text-on-primary font-black text-3xl md:text-4xl">
                  {initial}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading
                  ? <span className="material-symbols-outlined text-white text-xl animate-spin">progress_activity</span>
                  : <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                }
              </div>
            </button>

            <Link href="#profile-settings" className="h-9 px-4 rounded-full border border-outline-variant/30 text-on-surface-variant text-xs font-medium flex items-center gap-1.5 hover:border-primary/30 hover:text-primary transition-all">
              <span className="material-symbols-outlined text-sm">edit</span>
              {labels.editProfile}
            </Link>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <h1 className="text-[18px] md:text-[20px] font-semibold text-on-surface">{user.displayName || user.username}</h1>
            {user.isVerified && <VerifiedBadge />}
          </div>

          <p className="text-[12px] text-on-surface-variant mt-0.5">
            @{user.username} · {labels.memberSince}
          </p>

          {(user.country || user.governorate || user.city) && (
            <p className="flex items-center gap-1 text-[11px] text-on-surface-variant mt-1">
              <span className="material-symbols-outlined text-xs">location_on</span>
              {user.country
                ? [
                    getCountryLabel(user.country, locale),
                    user.governorate ? getGovernorateLabel(user.country, user.governorate, locale) : null,
                    user.city && user.governorate ? getCityLabel(user.country, user.governorate, user.city, locale) : null,
                  ].filter(Boolean).join('، ')
                : resolveLocationLabel(user.governorate, locale) || user.governorate
              }
            </p>
          )}

          {user.bio && <p className="text-[12px] text-on-surface-variant mt-2 leading-relaxed">{user.bio}</p>}

          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: labels.listings, value: stats.listingsCount },
              { label: labels.favorites, value: stats.favoritesCount },
              { label: labels.bookings, value: stats.bookingsCount },
            ].map((s) => (
              <div key={s.label} className="bg-surface-container-low rounded-xl p-3 text-center">
                <p className="text-[18px] font-semibold text-on-surface">{s.value}</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
