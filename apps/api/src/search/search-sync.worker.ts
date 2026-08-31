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

    if (action === 'DELETE') {
      switch (entityType) {
        case ENTITY_TYPES.LISTING:
          await this.searchService.removeDocument(INDEXES.LISTINGS, entityId).catch(() => {});
          break;
        case ENTITY_TYPES.BUS_LISTING:
          await this.searchService.removeDocument(INDEXES.BUSES, entityId).catch(() => {});
          break;
        case ENTITY_TYPES.EQUIPMENT_LISTING:
          await this.searchService.removeDocument(INDEXES.EQUIPMENT, entityId).catch(() => {});
          break;
        case ENTITY_TYPES.OPERATOR_LISTING:
          await this.searchService.removeDocument(INDEXES.OPERATORS, entityId).catch(() => {});
          break;
        case ENTITY_TYPES.SPARE_PART:
          await this.searchService.removeDocument(INDEXES.PARTS, entityId).catch(() => {});
          break;
        case ENTITY_TYPES.CAR_SERVICE:
          await this.searchService.removeDocument(INDEXES.SERVICES, entityId).catch(() => {});
          break;
        case ENTITY_TYPES.JOB:
          await this.searchService.removeDocument(INDEXES.JOBS, entityId).catch(() => {});
          break;
        default:
          this.logger.warn(`SearchSyncWorker: unknown entityType "${entityType}" for entity ${entityId} — job skipped`);
      }
      return;
    }

    switch (entityType) {
      case ENTITY_TYPES.LISTING: {
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
        break;
      }
      case ENTITY_TYPES.BUS_LISTING: {
        const bus = await this.prisma.busListing.findUnique({
          where: { id: entityId },
          include: { images: { orderBy: { order: 'asc' }, take: 1 } },
        });
        if (!bus) {
          await this.searchService.removeDocument(INDEXES.BUSES, entityId).catch(() => {});
          return;
        }
        await this.searchService.indexDocument(INDEXES.BUSES, {
          id: bus.id,
          title: bus.title,
          slug: bus.slug,
          description: bus.description,
          busListingType: bus.busListingType,
          busType: bus.busType,
          make: bus.make,
          model: bus.model,
          year: bus.year,
          condition: bus.condition, // Added condition based on prompt
          capacity: bus.capacity,
          price: bus.price ? Number(bus.price) : null,
          currency: bus.currency,
          isPremium: bus.isPremium,
          governorateId: bus.governorateId,
          wilayaId: bus.wilayaId,
          status: bus.status,
          viewCount: bus.viewCount,
          imageUrl: bus.images?.[0]?.url || null,
          createdAt: bus.createdAt,
        });
        break;
      }
      case ENTITY_TYPES.EQUIPMENT_LISTING: {
        const equipment = await this.prisma.equipmentListing.findUnique({
          where: { id: entityId },
          include: { images: { orderBy: { order: 'asc' }, take: 1 } },
        });
        if (!equipment) {
          await this.searchService.removeDocument(INDEXES.EQUIPMENT, entityId).catch(() => {});
          return;
        }
        await this.searchService.indexDocument(INDEXES.EQUIPMENT, {
          id: equipment.id,
          title: equipment.title,
          slug: equipment.slug,
          description: equipment.description,
          equipmentType: equipment.equipmentType,
          listingType: equipment.listingType,
          make: equipment.make,
          model: equipment.model,
          condition: equipment.condition,
          price: equipment.price ? Number(equipment.price) : null,
          dailyPrice: equipment.dailyPrice ? Number(equipment.dailyPrice) : null,
          currency: equipment.currency,
          isPremium: equipment.isPremium,
          governorateId: equipment.governorateId,
          wilayaId: equipment.wilayaId,
          status: equipment.status,
          viewCount: equipment.viewCount,
          imageUrl: equipment.images?.[0]?.url || null,
          createdAt: equipment.createdAt,
        });
        break;
      }
      case ENTITY_TYPES.OPERATOR_LISTING: {
        const operator = await this.prisma.operatorListing.findUnique({
          where: { id: entityId },
        });
        if (!operator) {
          await this.searchService.removeDocument(INDEXES.OPERATORS, entityId).catch(() => {});
          return;
        }
        await this.searchService.indexDocument(INDEXES.OPERATORS, {
          id: operator.id,
          title: operator.title,
          slug: operator.slug,
          description: operator.description,
          operatorType: operator.operatorType,
          dailyRate: operator.dailyRate ? Number(operator.dailyRate) : null,
          hourlyRate: operator.hourlyRate ? Number(operator.hourlyRate) : null,
          currency: operator.currency,
          governorateId: operator.governorateId,
          wilayaId: operator.wilayaId,
          status: operator.status,
          viewCount: operator.viewCount,
          createdAt: operator.createdAt,
        });
        break;
      }
      case ENTITY_TYPES.SPARE_PART: {
        const part = await this.prisma.sparePart.findUnique({
          where: { id: entityId },
          include: { images: { orderBy: { order: 'asc' }, take: 1 } },
        });
        if (!part) {
          await this.searchService.removeDocument(INDEXES.PARTS, entityId).catch(() => {});
          return;
        }
        await this.searchService.indexDocument(INDEXES.PARTS, {
          id: part.id,
          title: part.title,
          slug: part.slug,
          description: part.description,
          partCategory: part.partCategory,
          condition: part.condition,
          partNumber: part.partNumber,
          compatibleMakes: part.compatibleMakes,
          price: part.price ? Number(part.price) : null,
          currency: part.currency,
          isOriginal: part.isOriginal,
          hasWarranty: part.hasWarranty ?? false,
          warrantyDuration: part.warrantyDuration ?? null,
          quantity: part.quantity ?? null,
          compatibleVehicleTypes: part.compatibleVehicleTypes ?? [],
          governorateId: part.governorateId,
          wilayaId: part.wilayaId,
          status: part.status,
          imageUrl: part.images?.[0]?.url || null,
          createdAt: part.createdAt,
        });
        break;
      }
      case ENTITY_TYPES.CAR_SERVICE: {
        const service = await this.prisma.carService.findUnique({
          where: { id: entityId },
          include: { images: { orderBy: { order: 'asc' }, take: 1 } },
        });
        if (!service) {
          await this.searchService.removeDocument(INDEXES.SERVICES, entityId).catch(() => {});
          return;
        }
        await this.searchService.indexDocument(INDEXES.SERVICES, {
          id: service.id,
          title: service.title,
          slug: service.slug,
          description: service.description,
          serviceType: service.serviceType,
          providerName: service.providerName,
          providerType: service.providerType,
          priceFrom: service.priceFrom ? Number(service.priceFrom) : null,
          currency: service.currency,
          governorateId: service.governorateId,
          wilayaId: service.wilayaId,
          isHomeService: service.isHomeService,
          status: service.status,
          imageUrl: service.images?.[0]?.url || null,
          createdAt: service.createdAt,
        });
        break;
      }
      case ENTITY_TYPES.JOB: {
        const jobEntity = await this.prisma.driverJob.findUnique({
          where: { id: entityId },
        });
        if (!jobEntity) {
          await this.searchService.removeDocument(INDEXES.JOBS, entityId).catch(() => {});
          return;
        }
        await this.searchService.indexDocument(INDEXES.JOBS, {
          id: jobEntity.id,
          title: jobEntity.title,
          description: jobEntity.description,
          jobType: jobEntity.jobType,
          employmentType: jobEntity.employmentType,
          salary: jobEntity.salary ? Number(jobEntity.salary) : null,
          governorateId: jobEntity.governorateId,
          wilayaId: jobEntity.wilayaId,
          status: jobEntity.status,
          viewCount: jobEntity.viewCount,
          experienceYears: jobEntity.experienceYears,
          createdAt: jobEntity.createdAt,
        });
        break;
      }
      default:
        this.logger.warn(
          `SearchSyncWorker: unknown entityType "${entityType}" for entity ${entityId} — job skipped`
        );
        return;
    }
  }
}
