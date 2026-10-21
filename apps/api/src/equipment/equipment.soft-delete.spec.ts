import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EquipmentListingsService } from './equipment-listings.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../locations/geo.service';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';
import { ActiveListingsLimitService } from '../common/services/active-listings-limit.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';
import { LISTING_EVENTS } from '../common/events/listing.events';
import { isEntityPubliclyVisible } from '../common/public-visibility';

describe('EquipmentListingsService - Soft Delete (Task EB3)', () => {
  let service: EquipmentListingsService;
  let prismaMock: any;
  let eventEmitterMock: any;

  const mockListing: any = {
    id: 'eq-100',
    userId: 'user-owner',
    title: 'Excavator Cat 320D',
    slug: 'excavator-cat-320d-eq-100',
    description: 'Heavy excavator for construction',
    equipmentType: 'EXCAVATOR',
    listingType: 'EQUIPMENT_SALE',
    status: 'ACTIVE',
    version: 2,
    deletedAt: null,
    hiddenByOwnerStatus: false,
    viewCount: 15,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    images: [{ id: 'img-1', url: 'https://cdn.example.com/1.jpg', order: 0, isPrimary: true }],
  };

  beforeEach(async () => {
    prismaMock = {
      equipmentListing: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === mockListing.id) return Promise.resolve({ ...mockListing });
          if (where.slug === mockListing.slug) return Promise.resolve({ ...mockListing });
          return Promise.resolve(null);
        }),
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === mockListing.id && (where.deletedAt === null ? mockListing.deletedAt === null : true)) {
            return Promise.resolve({ ...mockListing });
          }
          if (where.slug === mockListing.slug && (where.deletedAt === null ? mockListing.deletedAt === null : true)) {
            return Promise.resolve({ ...mockListing });
          }
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockResolvedValue([{ ...mockListing }]),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          return Promise.resolve({ ...mockListing, ...data });
        }),
        delete: jest.fn(),
      },
      equipmentListingImage: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === 'img-1') {
            return Promise.resolve({
              id: 'img-1',
              url: 'https://cdn.example.com/1.jpg',
              equipmentListingId: mockListing.id,
              equipmentListing: { ...mockListing },
            });
          }
          return Promise.resolve(null);
        }),
        delete: jest.fn().mockResolvedValue({ id: 'img-1' }),
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(1),
        aggregate: jest.fn().mockResolvedValue({ _max: { order: 0 } }),
        create: jest.fn().mockResolvedValue({ id: 'img-2' }),
      },
      equipmentListingStatusLog: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
      outboxEvent: {
        create: jest.fn().mockResolvedValue({ id: 'event-1' }),
      },
      favorite: {
        count: jest.fn().mockResolvedValue(5),
      },
      conversation: {
        count: jest.fn().mockResolvedValue(3),
      },
      cleanupPolymorphicOrphans: jest.fn().mockResolvedValue(undefined),
      $transaction: jest.fn(async (arg: any) => {
        if (typeof arg === 'function') {
          return arg(prismaMock);
        }
        return Promise.all(arg);
      }),
    };

    eventEmitterMock = {
      emit: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentListingsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
        { provide: GeoService, useValue: { validateLocationPair: jest.fn() } },
        { provide: SellerContactGate, useValue: { assertCanPublish: jest.fn() } },
        { provide: ActiveListingsLimitService, useValue: { assertWithinLimit: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get<EquipmentListingsService>(EquipmentListingsService);
  });

  describe('1. remove() soft delete behavior', () => {
    it('sets deletedAt = now(), increments version, writes outbox DELETE event, calls polymorphic cleanup, and does NOT hard delete', async () => {
      const result = await service.remove(mockListing.id, mockListing.userId);

      expect(result).toEqual({ deleted: true });
      // MUST NOT call hard delete
      expect(prismaMock.equipmentListing.delete).not.toHaveBeenCalled();

      // MUST call update with deletedAt and version increment inside tx
      expect(prismaMock.equipmentListing.update).toHaveBeenCalledWith({
        where: { id: mockListing.id },
        data: {
          deletedAt: expect.any(Date),
          version: { increment: 1 },
        },
      });

      // MUST write outbox DELETE event
      expect(prismaMock.outboxEvent.create).toHaveBeenCalledWith({
        data: {
          entityType: ENTITY_TYPES.EQUIPMENT_LISTING,
          entityId: mockListing.id,
          action: 'DELETE',
        },
      });

      // MUST clean up polymorphic orphans
      expect(prismaMock.cleanupPolymorphicOrphans).toHaveBeenCalledWith(
        'EQUIPMENT_LISTING',
        mockListing.id,
      );

      // MUST emit DELETED event
      expect(eventEmitterMock.emit).toHaveBeenCalledWith(
        LISTING_EVENTS.DELETED,
        expect.objectContaining({ listingId: mockListing.id, entityType: ENTITY_TYPES.EQUIPMENT_LISTING }),
      );
    });

    it('throws 404 NotFoundException on a second remove call (already soft-deleted)', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValueOnce({
        ...mockListing,
        deletedAt: new Date('2026-10-21T18:00:00.000Z'),
      });

      await expect(service.remove(mockListing.id, mockListing.userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.equipmentListing.update).not.toHaveBeenCalled();
    });

    it('throws 403 ForbiddenException when non-owner attempts remove', async () => {
      await expect(service.remove(mockListing.id, 'another-user')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prismaMock.equipmentListing.update).not.toHaveBeenCalled();
    });
  });

  describe('2. Public and owner reads exclude soft-deleted listings', () => {
    it('findAll applies deletedAt: null filter', async () => {
      await service.findAll({});

      expect(prismaMock.equipmentListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            deletedAt: null,
            hiddenByOwnerStatus: false,
          }),
        }),
      );
    });

    it('findOne throws 404 NotFoundException when listing is soft-deleted even for owner', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValueOnce({
        ...mockListing,
        deletedAt: new Date('2026-10-21T18:00:00.000Z'),
      });

      await expect(service.findOne(mockListing.id, { sub: mockListing.userId, role: 'USER' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('findBySlug throws 404 NotFoundException when listing is soft-deleted even for owner', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValueOnce({
        ...mockListing,
        deletedAt: new Date('2026-10-21T18:00:00.000Z'),
      });

      await expect(service.findBySlug(mockListing.slug, { sub: mockListing.userId, role: 'USER' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('my() applies deletedAt: null filter', async () => {
      await service.my('user-owner', 1, 20);

      expect(prismaMock.equipmentListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-owner',
            deletedAt: null,
          },
        }),
      );
      expect(prismaMock.equipmentListing.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-owner',
          deletedAt: null,
        },
      });
    });

    it('update() throws 404 when listing is soft-deleted', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValueOnce({
        ...mockListing,
        deletedAt: new Date('2026-10-21T18:00:00.000Z'),
      });

      await expect(service.update(mockListing.id, mockListing.userId, { title: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('addImages() throws 404 when listing is soft-deleted', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValueOnce({
        ...mockListing,
        deletedAt: new Date('2026-10-21T18:00:00.000Z'),
      });

      await expect(service.addImages(mockListing.id, mockListing.userId, ['https://example.com/2.jpg'])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('removeImage() throws 404 when parent listing is soft-deleted', async () => {
      prismaMock.equipmentListingImage.findUnique.mockResolvedValueOnce({
        id: 'img-1',
        equipmentListingId: mockListing.id,
        equipmentListing: {
          ...mockListing,
          deletedAt: new Date('2026-10-21T18:00:00.000Z'),
        },
      });

      await expect(service.removeImage('img-1', mockListing.userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('getStatusHistory() throws 404 when listing is soft-deleted', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValueOnce({
        ...mockListing,
        deletedAt: new Date('2026-10-21T18:00:00.000Z'),
      });

      await expect(service.getStatusHistory(mockListing.id, mockListing.userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('getStats() throws 404 when listing is soft-deleted', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValueOnce({
        ...mockListing,
        deletedAt: new Date('2026-10-21T18:00:00.000Z'),
      });

      await expect(service.getStats(mockListing.id, mockListing.userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('3. public-visibility rule for equipmentListing', () => {
    it('considers active equipment with deletedAt = null visible to the public', () => {
      const visible = isEntityPubliclyVisible('equipmentListing', {
        status: 'ACTIVE',
        deletedAt: null,
        hiddenByOwnerStatus: false,
      });
      expect(visible).toBe(true);
    });

    it('considers active equipment with deletedAt != null NOT visible to the public', () => {
      const visible = isEntityPubliclyVisible('equipmentListing', {
        status: 'ACTIVE',
        deletedAt: new Date(),
        hiddenByOwnerStatus: false,
      });
      expect(visible).toBe(false);
    });
  });

  describe('4. cross-consumer soft-delete enforcement (Uploads, Favorites, Payments Activation)', () => {
    it('UploadImageManagerService.addImageToEquipment throws 404 for soft-deleted listing', async () => {
      const { UploadImageManagerService } = await import('../uploads/upload-image-manager.service');
      const uploadService = new UploadImageManagerService(prismaMock as any);

      // findFirst returns null when deletedAt: null is queried against deleted listing
      prismaMock.equipmentListing.findFirst.mockResolvedValueOnce(null);

      await expect(
        uploadService.addImageToEquipment(mockListing.id, mockListing.userId, 'https://cdn.example.com/new.jpg', false),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.equipmentListing.findFirst).toHaveBeenCalledWith({
        where: { id: mockListing.id, deletedAt: null },
      });
    });

    it('PaymentActivationService.activateFeatured excludes soft-deleted equipment listings', async () => {
      const { PaymentActivationService } = await import('../payments/payment-activation.service');
      const paymentActivation = new PaymentActivationService(
        prismaMock as any,
        { create: jest.fn() } as any,
      );

      prismaMock.equipmentListing.updateMany = jest.fn().mockResolvedValue({ count: 0 });

      await paymentActivation.activateFeatured('EQUIPMENT_LISTING', mockListing.id);

      expect(prismaMock.equipmentListing.updateMany).toHaveBeenCalledWith({
        where: { id: mockListing.id, deletedAt: null },
        data: expect.objectContaining({ isPremium: true }),
      });
    });

    it('FavoritesService skips soft-deleted equipment listings during toggle/resolution', async () => {
      const { FavoritesService } = await import('../favorites/favorites.service');
      const favService = new FavoritesService(
        prismaMock as any,
        { create: jest.fn() } as any,
      );

      // resolveEntityTitle checks findFirst({ where: { id, deletedAt: null } })
      prismaMock.equipmentListing.findFirst.mockResolvedValueOnce(null);

      await expect(
        favService.toggle('EQUIPMENT_LISTING', mockListing.id, 'user-fav-1'),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.equipmentListing.findFirst).toHaveBeenCalledWith({
        where: { id: mockListing.id, deletedAt: null },
        select: { title: true },
      });
    });
  });
});