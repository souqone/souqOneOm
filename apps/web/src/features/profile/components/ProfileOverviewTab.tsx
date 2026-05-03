import { Link } from '@/i18n/navigation';
import { ListingCard } from '@/features/listings/components/ListingCard';
import type { UnifiedListingItem } from '@/features/listings/types/unified-item.types';
import { ProfileSettingsCard } from './ProfileSettingsCard';

interface ProfileOverviewTabProps {
  listings: UnifiedListingItem[];
  onOpenSettings: () => void;
  onOpenSecurity: () => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  labels: {
    addListing: string;
    recentListings: string;
    noListings: string;
    noListingsDesc: string;
    addFirst: string;
    edit: string;
    delete: string;
    personalInfo: string;
    personalInfoDesc: string;
    contactInfo: string;
    contactInfoDesc: string;
    security: string;
    securityDesc: string;
  };
}

export function ProfileOverviewTab({ listings, onOpenSettings, onOpenSecurity, onDelete, isDeleting, labels }: ProfileOverviewTabProps) {
  const recentListings = listings.slice(0, 3);

  return (
    <div className="p-4 space-y-4">
      <Link href="/add-listing" className="w-full h-11 rounded-2xl bg-primary text-on-primary text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm shadow-primary/20">
        <span className="material-symbols-outlined text-base">add</span>
        {labels.addListing}
      </Link>

      <section className="space-y-3">
        <h2 className="text-[14px] font-bold text-on-surface">{labels.recentListings}</h2>
        {recentListings.length > 0 ? (
          recentListings.map((listing) => (
            <div key={listing.id} className="relative">
              <ListingCard item={listing} />
              <div className="absolute top-2 left-2 flex gap-1.5 z-20">
                <Link href={`/edit-listing/car/${listing.id}`} aria-label={labels.edit} className="w-8 h-8 rounded-lg bg-background/90 backdrop-blur-sm border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-base">edit</span>
                </Link>
                <button type="button" disabled={isDeleting} onClick={(e) => { e.stopPropagation(); onDelete(listing.id); }} aria-label={labels.delete} className="w-8 h-8 rounded-lg bg-background/90 backdrop-blur-sm border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors shadow-sm disabled:opacity-60">
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-primary">inventory_2</span>
            </div>
            <p className="text-[14px] font-medium text-on-surface mb-1">{labels.noListings}</p>
            <p className="text-[12px] text-on-surface-variant mb-4">{labels.noListingsDesc}</p>
            <Link href="/add-listing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-[13px] font-medium hover:bg-primary/90 transition-colors">
              <span className="material-symbols-outlined text-base">add</span>
              {labels.addFirst}
            </Link>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3" id="profile-settings">
        <ProfileSettingsCard icon="person" label={labels.personalInfo} description={labels.personalInfoDesc} onClick={onOpenSettings} />
        <ProfileSettingsCard icon="contact_phone" label={labels.contactInfo} description={labels.contactInfoDesc} onClick={onOpenSettings} />
        <ProfileSettingsCard icon="lock" label={labels.security} description={labels.securityDesc} onClick={onOpenSecurity} />
      </section>
    </div>
  );
}
