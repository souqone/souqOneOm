import { NotFoundException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';

export function assertListingVisible(
  listing: { status: ListingStatus; sellerId: string },
  viewerId?: string,
): void {
  const PUBLIC_STATUSES: ListingStatus[] = ['ACTIVE', 'SOLD', 'RENTED'];
  if (PUBLIC_STATUSES.includes(listing.status)) return;
  if (viewerId && viewerId === listing.sellerId) return;
  throw new NotFoundException('الإعلان غير موجود');
}
