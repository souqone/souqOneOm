import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService, INDEXES } from './search.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';

@Processor('search-sync')
export class SearchSyncWorker {
  private readonly logger = new Logger(SearchSyncWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  @Process('sync-entity')
  async handleSync(job: Job) {
    const { entityId, entityType, action } = job.data;
    this.logger.debug(`Processing search sync job ${job.id} for ${entityType} ${entityId}`);

    if (entityType === ENTITY_TYPES.LISTING) {
      if (action === 'DELETE') {
        await this.searchService.removeDocument(INDEXES.LISTINGS, entityId).catch(() => {});
        return;
      }

      // UPSERT or other actions: always fetch latest state from DB
      const listing = await this.prisma.listing.findUnique({
        where: { id: entityId },
        include: {
          brand: true,
          carModel: true,
          carTrim: true,
          images: { orderBy: { order: 'asc' }, take: 1 },
        },
      });

      if (!listing) {
        this.logger.warn(`Listing ${entityId} not found during search sync, removing from index if exists`);
        await this.searchService.removeDocument(INDEXES.LISTINGS, entityId).catch(() => {});
        return;
      }

      // Map to search document
      await this.searchService.indexDocument(INDEXES.LISTINGS, {
        id: listing.id,
        title: listing.title,
        slug: listing.slug,
        description: listing.description,
        make: listing.make,
        model: listing.model,
        year: listing.year,
        price: Number(listing.price),
        currency: listing.currency,
        mileage: listing.mileage,
        fuelType: listing.fuelType,
        transmission: listing.transmission,
        condition: listing.condition,
        listingType: listing.listingType,
        governorateId: listing.governorateId,
        wilayaId: listing.wilayaId,
        isPremium: listing.isPremium,
        status: listing.status,
        viewCount: listing.viewCount,
        imageUrl: listing.images?.[0]?.url || null,
        createdAt: listing.createdAt,
      });
    }
  }
}
