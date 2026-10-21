import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EquipmentListingsService } from './equipment-listings.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../locations/geo.service';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';
import { ActiveListingsLimitService } from '../common/services/active-listings-limit.service';
import { LISTING_EVENTS } from '../common/events/listing.events';
import { ListingStatus } from '@prisma/client';

describe('EquipmentListingsService - Status Transitions', () => {
  let service: EquipmentListingsService;
  let prismaMock: any;
  let sellerContactGateMock: any;
  let activeListingsLimitServiceMock: any;
  let eventEmitterMock: any;

  const baseItem = {
    id: 'eq-1',
    userId: 'owner-1',
    title: 'Excavator CAT 320',
    status: 'ACTIVE' as ListingStatus,
    listingType: 'EQUIPMENT_SALE',
    equipmentType: 'EXCAVATOR',
    version: 1,
    governorateId: null,
    wilayaId: null,
  };

  beforeEach(async () => {
    prismaMock = {
      equipmentListing: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      equipmentListingStatusLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      outboxEvent: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prismaMock)),
    };

    sellerContactGateMock = {
      assertCanPublish: jest.fn().mockResolvedValue(undefined),
    };

    activeListingsLimitServiceMock = {
      assertWithinLimit: jest.fn().mockResolvedValue(undefined),
    };

    eventEmitterMock = {
      emit: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EquipmentListingsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: GeoService, useValue: { validateLocationPair: jest.fn(), syncLocation: jest.fn() } },
        { provide: EventEmitter2, useValue: eventEmitterMock },
        { provide: SellerContactGate, useValue: sellerContactGateMock },
        { provide: ActiveListingsLimitService, useValue: activeListingsLimitServiceMock },
      ],
    }).compile();

    service = moduleRef.get<EquipmentListingsService>(EquipmentListingsService);
  });

  describe('Allowed transitions', () => {
    it('DRAFT -> ACTIVE transitions cleanly', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'DRAFT',
      });
      prismaMock.equipmentListing.update.mockResolvedValue({
        ...baseItem,
        status: 'ACTIVE',
        version: 2,
      });

      const res = await service.update('eq-1', 'owner-1', { status: 'ACTIVE' as any });

      expect(res.status).toBe('ACTIVE');
      expect(prismaMock.equipmentListingStatusLog.create).toHaveBeenCalledWith({
        data: {
          equipmentListingId: 'eq-1',
          fromStatus: 'DRAFT',
          toStatus: 'ACTIVE',
          changedBy: 'owner-1',
        },
      });
    });

    it('ACTIVE -> SOLD transitions cleanly for EQUIPMENT_SALE', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'ACTIVE',
        listingType: 'EQUIPMENT_SALE',
      });
      prismaMock.equipmentListing.update.mockResolvedValue({
        ...baseItem,
        status: 'SOLD',
        version: 2,
      });

      const res = await service.update('eq-1', 'owner-1', { status: 'SOLD' as any });

      expect(res.status).toBe('SOLD');
      expect(prismaMock.equipmentListingStatusLog.create).toHaveBeenCalledWith({
        data: {
          equipmentListingId: 'eq-1',
          fromStatus: 'ACTIVE',
          toStatus: 'SOLD',
          changedBy: 'owner-1',
        },
      });
      expect(eventEmitterMock.emit).toHaveBeenCalledWith(
        LISTING_EVENTS.STATUS_CHANGED,
        expect.objectContaining({
          entityType: 'EQUIPMENT_LISTING',
          status: 'SOLD',
        }),
      );
    });

    it('ACTIVE -> RENTED transitions cleanly for EQUIPMENT_RENT', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'ACTIVE',
        listingType: 'EQUIPMENT_RENT',
      });
      prismaMock.equipmentListing.update.mockResolvedValue({
        ...baseItem,
        status: 'RENTED',
        version: 2,
      });

      const res = await service.update('eq-1', 'owner-1', { status: 'RENTED' as any });

      expect(res.status).toBe('RENTED');
      expect(prismaMock.equipmentListingStatusLog.create).toHaveBeenCalledWith({
        data: {
          equipmentListingId: 'eq-1',
          fromStatus: 'ACTIVE',
          toStatus: 'RENTED',
          changedBy: 'owner-1',
        },
      });
    });

    it('ACTIVE -> ARCHIVED transitions cleanly', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue(baseItem);
      prismaMock.equipmentListing.update.mockResolvedValue({
        ...baseItem,
        status: 'ARCHIVED',
        version: 2,
      });

      const res = await service.update('eq-1', 'owner-1', { status: 'ARCHIVED' as any });
      expect(res.status).toBe('ARCHIVED');
    });

    it('ACTIVE -> SUSPENDED transitions cleanly', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue(baseItem);
      prismaMock.equipmentListing.update.mockResolvedValue({
        ...baseItem,
        status: 'SUSPENDED',
        version: 2,
      });

      const res = await service.update('eq-1', 'owner-1', { status: 'SUSPENDED' as any });
      expect(res.status).toBe('SUSPENDED');
    });

    it('ARCHIVED -> ACTIVE transitions cleanly', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'ARCHIVED',
      });
      prismaMock.equipmentListing.update.mockResolvedValue({
        ...baseItem,
        status: 'ACTIVE',
        version: 2,
      });

      const res = await service.update('eq-1', 'owner-1', { status: 'ACTIVE' as any });
      expect(res.status).toBe('ACTIVE');
    });

    it('RENTED -> ACTIVE transitions cleanly', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'RENTED',
        listingType: 'EQUIPMENT_RENT',
      });
      prismaMock.equipmentListing.update.mockResolvedValue({
        ...baseItem,
        status: 'ACTIVE',
        version: 2,
      });

      const res = await service.update('eq-1', 'owner-1', { status: 'ACTIVE' as any });
      expect(res.status).toBe('ACTIVE');
    });
  });

  describe('Invalid status transitions', () => {
    it('SOLD -> ACTIVE is rejected (SOLD is terminal)', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'SOLD',
      });

      await expect(
        service.update('eq-1', 'owner-1', { status: 'ACTIVE' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('SUSPENDED -> ACTIVE is rejected (admin only)', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'SUSPENDED',
      });

      await expect(
        service.update('eq-1', 'owner-1', { status: 'ACTIVE' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('DRAFT -> SOLD is rejected', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'DRAFT',
      });

      await expect(
        service.update('eq-1', 'owner-1', { status: 'SOLD' as any }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Listing-type restrictions', () => {
    it('rejects SOLD on EQUIPMENT_RENT listing', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'ACTIVE',
        listingType: 'EQUIPMENT_RENT',
      });

      await expect(
        service.update('eq-1', 'owner-1', { status: 'SOLD' as any }),
      ).rejects.toThrow('INVALID_STATUS_TRANSITION: SOLD is only allowed for EQUIPMENT_SALE');
    });

    it('rejects RENTED on EQUIPMENT_SALE listing', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'ACTIVE',
        listingType: 'EQUIPMENT_SALE',
      });

      await expect(
        service.update('eq-1', 'owner-1', { status: 'RENTED' as any }),
      ).rejects.toThrow('INVALID_STATUS_TRANSITION: RENTED is only allowed for EQUIPMENT_RENT');
    });

    it('rejects SOLD on EQUIPMENT_WANTED listing', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'ACTIVE',
        listingType: 'EQUIPMENT_WANTED',
      });

      await expect(
        service.update('eq-1', 'owner-1', { status: 'SOLD' as any }),
      ).rejects.toThrow('EQUIPMENT_WANTED listings may only transition between ACTIVE and ARCHIVED');
    });

    it('rejects RENTED on EQUIPMENT_WANTED listing', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'ACTIVE',
        listingType: 'EQUIPMENT_WANTED',
      });

      await expect(
        service.update('eq-1', 'owner-1', { status: 'RENTED' as any }),
      ).rejects.toThrow('EQUIPMENT_WANTED listings may only transition between ACTIVE and ARCHIVED');
    });
  });

  describe('Reactivation gates', () => {
    it('calls sellerContactGate.assertCanPublish when transitioning to ACTIVE', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'ARCHIVED',
      });
      prismaMock.equipmentListing.update.mockResolvedValue({
        ...baseItem,
        status: 'ACTIVE',
        version: 2,
      });

      await service.update('eq-1', 'owner-1', { status: 'ACTIVE' as any });

      expect(sellerContactGateMock.assertCanPublish).toHaveBeenCalledWith('owner-1');
    });

    it('calls activeListingsLimitService.assertWithinLimit inside transaction when transitioning to ACTIVE', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'ARCHIVED',
      });
      prismaMock.equipmentListing.update.mockResolvedValue({
        ...baseItem,
        status: 'ACTIVE',
        version: 2,
      });

      await service.update('eq-1', 'owner-1', { status: 'ACTIVE' as any });

      expect(activeListingsLimitServiceMock.assertWithinLimit).toHaveBeenCalledWith(
        'owner-1',
        prismaMock,
      );
    });

    it('fails update if sellerContactGate rejects', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'ARCHIVED',
      });
      sellerContactGateMock.assertCanPublish.mockRejectedValue(
        new ForbiddenException('يرجى إضافة رقم هاتف إلى ملفك الشخصي'),
      );

      await expect(
        service.update('eq-1', 'owner-1', { status: 'ACTIVE' as any }),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaMock.equipmentListing.update).not.toHaveBeenCalled();
    });

    it('fails update if activeListingsLimitService rejects', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'ARCHIVED',
      });
      activeListingsLimitServiceMock.assertWithinLimit.mockRejectedValue(
        new ForbiddenException('لقد بلغت الحد الأقصى للإعلانات النشطة'),
      );

      await expect(
        service.update('eq-1', 'owner-1', { status: 'ACTIVE' as any }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Status log row and no-op handling', () => {
    it('creates log row in the same transaction when status changes', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'ACTIVE',
      });
      prismaMock.equipmentListing.update.mockResolvedValue({
        ...baseItem,
        status: 'ARCHIVED',
        version: 2,
      });

      await service.update('eq-1', 'owner-1', { status: 'ARCHIVED' as any });

      expect(prismaMock.equipmentListingStatusLog.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.equipmentListingStatusLog.create).toHaveBeenCalledWith({
        data: {
          equipmentListingId: 'eq-1',
          fromStatus: 'ACTIVE',
          toStatus: 'ARCHIVED',
          changedBy: 'owner-1',
        },
      });
    });

    it('does NOT create log row when status is unchanged (no-op)', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'ACTIVE',
      });
      prismaMock.equipmentListing.update.mockResolvedValue({
        ...baseItem,
        title: 'New title',
        version: 2,
      });

      await service.update('eq-1', 'owner-1', { title: 'New title', status: 'ACTIVE' as any });

      expect(prismaMock.equipmentListingStatusLog.create).not.toHaveBeenCalled();
    });

    it('does NOT call assertWithinLimit when status is already ACTIVE (no-op status)', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...baseItem,
        status: 'ACTIVE',
      });
      prismaMock.equipmentListing.update.mockResolvedValue({
        ...baseItem,
        title: 'New title',
        version: 2,
      });

      await service.update('eq-1', 'owner-1', { title: 'New title', status: 'ACTIVE' as any });

      expect(activeListingsLimitServiceMock.assertWithinLimit).not.toHaveBeenCalled();
    });

    it('does NOT create log row when status is omitted in dto', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue(baseItem);
      prismaMock.equipmentListing.update.mockResolvedValue({
        ...baseItem,
        title: 'New title',
        version: 2,
      });

      await service.update('eq-1', 'owner-1', { title: 'New title' });

      expect(prismaMock.equipmentListingStatusLog.create).not.toHaveBeenCalled();
    });
  });
});
