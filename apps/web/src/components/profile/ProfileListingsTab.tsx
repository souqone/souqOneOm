import { Link } from '@/i18n/navigation';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import type { UnifiedListingItem } from '@/features/listings/types/unified-item.types';

interface ProfileListingsTabProps {
  listings: UnifiedListingItem[];
  isDeleting: boolean;
  onDelete: (id: string) => void;
  labels: {
    emptyTitle: string;
    emptyDescription: string;
    addFirst: string;
    edit: string;
    delete: string;
  };
}

export function ProfileListingsTab({ listings, isDeleting, onDelete, labels }: ProfileListingsTabProps) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-3xl">inventory_2</span>
        </div>
        <p className="text-on-surface font-bold">{labels.emptyTitle}</p>
        <p className="text-on-surface-variant text-sm">{labels.emptyDescription}</p>
        <Link href="/add-listing" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary px-6 py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors">
          <span className="material-symbols-outlined text-base">add</span>
          {labels.addFirst}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
      {listings.map((listing) => (
        <div key={listing.id} className="relative">
          <UnifiedCard item={listing} />
          <div className="absolute top-2 left-2 flex gap-1.5 z-20">
            <Link href={`/edit-listing/car/${listing.id}`} aria-label={labels.edit} className="w-8 h-8 rounded-lg bg-background/90 backdrop-blur-sm border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors shadow-sm">
              <span className="material-symbols-outlined text-base">edit</span>
            </Link>
            <button type="button" disabled={isDeleting} onClick={(e) => { e.stopPropagation(); onDelete(listing.id); }} aria-label={labels.delete} className="w-8 h-8 rounded-lg bg-background/90 backdrop-blur-sm border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors shadow-sm disabled:opacity-60">
              <span className="material-symbols-outlined text-base">delete</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
