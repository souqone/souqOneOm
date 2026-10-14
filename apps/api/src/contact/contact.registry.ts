import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertListingVisible, assertEntityVisible } from '../listings/listing-visibility';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';

export interface ContactTarget {
  ownerId: string;
  whatsappEnabled: boolean;
}

export interface ContactRegistryEntry {
  entityType: string;
  loadTarget: (prisma: PrismaService, entityId: string, viewerId: string) => Promise<ContactTarget>;
}

export const CONTACT_REGISTRY: Record<string, ContactRegistryEntry> = {
  [ENTITY_TYPES.LISTING]: {
    entityType: ENTITY_TYPES.LISTING,
    loadTarget: async (prisma, entityId, viewerId) => {
      const listing = await prisma.listing.findUnique({
        where: { id: entityId },
        select: { id: true, sellerId: true, status: true, whatsappEnabled: true },
      });
      if (!listing) throw new NotFoundException('الإعلان غير موجود');
      assertListingVisible(listing, viewerId);
      return { ownerId: listing.sellerId, whatsappEnabled: listing.whatsappEnabled };
    },
  },

  [ENTITY_TYPES.BUS_LISTING]: {
    entityType: ENTITY_TYPES.BUS_LISTING,
    loadTarget: async (prisma, entityId, viewerId) => {
      const bus = await prisma.busListing.findFirst({
        where: { id: entityId, deletedAt: null },
        select: { id: true, userId: true, status: true, whatsappEnabled: true },
      });
      if (!bus) throw new NotFoundException('الإعلان غير موجود');
      assertEntityVisible(bus, bus.userId, viewerId);
      return { ownerId: bus.userId, whatsappEnabled: bus.whatsappEnabled };
    },
  },

  [ENTITY_TYPES.EQUIPMENT_LISTING]: {
    entityType: ENTITY_TYPES.EQUIPMENT_LISTING,
    loadTarget: async (prisma, entityId, viewerId) => {
      const item = await prisma.equipmentListing.findUnique({
        where: { id: entityId },
        select: { id: true, userId: true, status: true, whatsappEnabled: true },
      });
      if (!item) throw new NotFoundException('المعدة غير موجودة');
      assertEntityVisible(item, item.userId, viewerId, 'المعدة غير موجودة');
      return { ownerId: item.userId, whatsappEnabled: item.whatsappEnabled };
    },
  },

  [ENTITY_TYPES.OPERATOR_LISTING]: {
    entityType: ENTITY_TYPES.OPERATOR_LISTING,
    loadTarget: async (prisma, entityId, viewerId) => {
      const item = await prisma.operatorListing.findUnique({
        where: { id: entityId },
        select: { id: true, userId: true, status: true, whatsappEnabled: true },
      });
      if (!item) throw new NotFoundException('إعلان المشغل غير موجود');
      assertEntityVisible(item, item.userId, viewerId, 'إعلان المشغل غير موجود');
      return { ownerId: item.userId, whatsappEnabled: item.whatsappEnabled };
    },
  },

  [ENTITY_TYPES.SPARE_PART]: {
    entityType: ENTITY_TYPES.SPARE_PART,
    loadTarget: async (prisma, entityId, viewerId) => {
      const item = await prisma.sparePart.findUnique({
        where: { id: entityId },
        select: { id: true, sellerId: true, status: true, whatsappEnabled: true },
      });
      if (!item) throw new NotFoundException('قطعة الغيار غير موجودة');
      assertEntityVisible(item, item.sellerId, viewerId, 'قطعة الغيار غير موجودة');
      return { ownerId: item.sellerId, whatsappEnabled: item.whatsappEnabled };
    },
  },

  [ENTITY_TYPES.CAR_SERVICE]: {
    entityType: ENTITY_TYPES.CAR_SERVICE,
    loadTarget: async (prisma, entityId, viewerId) => {
      const item = await prisma.carService.findUnique({
        where: { id: entityId },
        select: { id: true, userId: true, status: true, whatsappEnabled: true },
      });
      if (!item) throw new NotFoundException('الخدمة غير موجودة');
      assertEntityVisible(item, item.userId, viewerId, 'الخدمة غير موجودة');
      return { ownerId: item.userId, whatsappEnabled: item.whatsappEnabled };
    },
  },

  [ENTITY_TYPES.DRIVER_JOB]: {
    entityType: ENTITY_TYPES.DRIVER_JOB,
    loadTarget: async (prisma, entityId, viewerId) => {
      const job = await prisma.driverJob.findFirst({
        where: { OR: [{ id: entityId }, { slug: entityId }] },
        select: { id: true, userId: true, status: true, whatsappEnabled: true },
      });
      if (!job) throw new NotFoundException('الوظيفة غير موجودة');
      if (job.status !== 'ACTIVE' && job.userId !== viewerId) {
        throw new NotFoundException('الوظيفة غير موجودة');
      }
      return { ownerId: job.userId, whatsappEnabled: job.whatsappEnabled };
    },
  },

  [ENTITY_TYPES.JOB]: {
    entityType: ENTITY_TYPES.JOB,
    loadTarget: async (prisma, entityId, viewerId) => {
      return CONTACT_REGISTRY[ENTITY_TYPES.DRIVER_JOB].loadTarget(prisma, entityId, viewerId);
    },
  },

  [ENTITY_TYPES.DRIVER_PROFILE]: {
    entityType: ENTITY_TYPES.DRIVER_PROFILE,
    loadTarget: async (prisma, entityId) => {
      const profile = await prisma.driverProfile.findUnique({
        where: { id: entityId },
        select: { id: true, userId: true, whatsappEnabled: true },
      });
      if (!profile) throw new NotFoundException('بروفايل السائق غير موجود');
      return { ownerId: profile.userId, whatsappEnabled: profile.whatsappEnabled };
    },
  },

  [ENTITY_TYPES.EMPLOYER_PROFILE]: {
    entityType: ENTITY_TYPES.EMPLOYER_PROFILE,
    loadTarget: async (prisma, entityId) => {
      const profile = await prisma.employerProfile.findUnique({
        where: { id: entityId },
        select: { id: true, userId: true, whatsappEnabled: true },
      });
      if (!profile) throw new NotFoundException('بروفايل صاحب العمل غير موجود');
      return { ownerId: profile.userId, whatsappEnabled: profile.whatsappEnabled };
    },
  },

  [ENTITY_TYPES.CARRIER_PROFILE]: {
    entityType: ENTITY_TYPES.CARRIER_PROFILE,
    loadTarget: async (prisma, entityId) => {
      const profile = await prisma.carrierProfile.findUnique({
        where: { id: entityId },
        select: { id: true, userId: true, whatsappEnabled: true },
      });
      if (!profile) throw new NotFoundException('الناقل غير موجود');
      return { ownerId: profile.userId, whatsappEnabled: profile.whatsappEnabled };
    },
  },

  [ENTITY_TYPES.TRANSPORT_REQUEST]: {
    entityType: ENTITY_TYPES.TRANSPORT_REQUEST,
    loadTarget: async (prisma, entityId, viewerId) => {
      const req = await prisma.transportRequest.findUnique({
        where: { id: entityId },
        select: { id: true, userId: true, status: true },
      });
      if (!req) throw new NotFoundException('طلب النقل غير موجود');
      const isPublic = ['OPEN', 'QUOTED'].includes(req.status);
      if (!isPublic && req.userId !== viewerId) {
        throw new NotFoundException('طلب النقل غير موجود');
      }
      return { ownerId: req.userId, whatsappEnabled: false };
    },
  },
};

export const CONTACT_ENTITY_TYPES: string[] = Object.keys(CONTACT_REGISTRY);
