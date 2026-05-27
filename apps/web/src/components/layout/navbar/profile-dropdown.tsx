'use client';

import Image from 'next/image';
import { forwardRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getImageUrl } from '@/lib/image-utils';

interface ProfileDropdownProps {
  open: boolean;
  toggle: () => void;
  close: () => void;
  user: { username: string; displayName?: string | null; email: string; avatarUrl?: string | null };
  onLogout: () => void;
}

export const ProfileDropdown = forwardRef<HTMLDivElement, ProfileDropdownProps>(
  ({ open, toggle, close, user, onLogout }, ref) => {
    const t = useTranslations('common');

    const menuItems = [
      { href: '/profile', icon: 'person', label: t('profile') },
      { href: '/my-listings', icon: 'directions_car', label: t('myListings') },
      { href: '/jobs/dashboard', icon: 'work', label: t('myJobListings') },
      { href: '/messages', icon: 'chat', label: t('messages') },
      { href: '/favorites', icon: 'favorite', label: t('favorites') },
      { href: '/profile?tab=settings', icon: 'settings', label: t('settings') },
    ];
    return (
      <div ref={ref} className="relative hidden lg:block">
        <button
          onClick={toggle}
          className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 transition-all
            hover:bg-surface-container-low ${open ? 'bg-surface-container-low' : ''}`}
        >
          {user.avatarUrl ? (
            <Image src={getImageUrl(user.avatarUrl) || ''} alt={user.displayName || user.username} width={28} height={28} className="w-7 h-7 rounded-full object-cover ring-2 ring-primary/20" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary text-[11px] font-black ring-2 ring-primary/20">
              {user.username[0]?.toUpperCase()}
            </div>
          )}
          <span className={`material-symbols-outlined text-xs text-outline transition-transform ${open ? 'rotate-180' : ''}`}>expand_more</span>
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-2 w-56 bg-surface-container-lowest rounded-lg py-1.5 border border-outline-variant/20 shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-3">
              {user.avatarUrl ? (
                <Image src={getImageUrl(user.avatarUrl) || ''} alt={user.displayName || user.username} width={32} height={32} className="w-8 h-8 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-black text-xs shrink-0">
                  {user.username[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-on-surface text-sm truncate">{user.displayName || user.username}</p>
                <p className="text-[11px] text-on-surface-variant truncate">{user.email}</p>
              </div>
            </div>
            <div className="py-1">
              {menuItems.map(({ href, icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-base shrink-0">{icon}</span> {label}
                </Link>
              ))}
            </div>
            <div className="border-t border-outline-variant/20 py-1">
              <button
                onClick={() => { onLogout(); close(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-error hover:bg-error-container/20 transition-colors"
              >
                <span className="material-symbols-outlined text-base shrink-0">logout</span> {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

ProfileDropdown.displayName = 'ProfileDropdown';
