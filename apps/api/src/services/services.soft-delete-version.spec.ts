import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { UploadImageManagerService } from '../uploads/upload-image-manager.service';
import { FavoritesService } from '../favorites/favorites.service';
import { CONTACT_REGISTRY } from '../contact/contact.registry';
import { SearchSyncWorker } from '../search/search-sync.worker';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';
import { INDEXES } from '../search/search.service';
import { Prisma } from '@prisma/client';

describe('CarServices - Soft Delete, Versioning & Image Cache (Task D-105 / PB-1)', () => {
  let servicesService: ServicesService;
  let prismaMock: any;
  let redisMock: any;
  let eventEmitterMock: any;
  let geoServiceMock: any;

  const mockService: any = {
    id: 'srv-100',
    userId: 'user-service-owner',
    title: 'Precision Wheel Alignment & Balancing',
    slug: 'precision-wheel-alignment-srv-100',
    description: 'Computerized laser alignment for all Japanese and German cars',
    serviceType: 'TIRES_WHEELS',
    providerType: 'GARAGE',
    providerName: 'Precision Auto Care',
    specializations: ['ALIGNMENT', 'BALANCING'],
    priceFrom: new Prisma.Decimal(15),
    priceTo: new Prisma.Decimal(35),
    currency: 'OMR',
    status: 'ACTIVE',
    version: 1,
    deletedAt: null,
    hiddenByOwnerStatus: false,
    viewCount: 20,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    images: [{ id: 'img-srv-1', url: 'https://cdn.example.com/srv1.jpg', order: 0, isPrimary: true }],
  };

  beforeEach(() => {
    redisMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      delPattern: jest.fn().mockResolvedValue(1),
    };

    prismaMock = {
      carService: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === mockService.id) return Promise.resolve({ ...mockService });
          if (where.slug === mockService.slug) return Promise.resolve({ ...mockService });
          return Promise.resolve(null);
        }),
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === mockService.id && (where.deletedAt === null ? mockService.deletedAt === null : true)) {
            return Promise.resolve({ ...mockService });
          }
          if (where.slug === mockService.slug && (where.deletedAt === null ? mockService.deletedAt === null : true)) {
            return Promise.resolve({ ...mockService });
          }
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockResolvedValue([{ ...mockService }]),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          return Promise.resolve({ ...mockService, ...data, version: (mockService.version || 1) + 1 });
        }),
        delete: jest.fn(),
      },
      carServiceImage: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === 'img-srv-1') {
            return Promise.resolve({
              id: 'img-srv-1',
              url: 'https://cdn.example.com/srv1.jpg',
              carServiceId: mockService.id,
              carService: { ...mockService },
            });
          }
          return Promise.resolve(null);
        }),
        findFirst: jest.fn().mockResolvedValue({ id: 'img-srv-1', isPrimary: true }),
        create: jest.fn().mockResolvedValue({ id: 'img-srv-2', url: 'https://cdn.example.com/srv2.jpg' }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(1),
        aggregate: jest.fn().mockResolvedValue({ _max: { order: 0 } }),
      },
      outboxEvent: {
        create: jest.fn().mockResolvedValue({ id: 'outbox-srv-1' }),
      },
      cleanupPolymorphicOrphans: jest.fn().mockResolvedValue(undefined),
      $transaction: jest.fn().mockImplementation(async (callback: any) => {
        if (typeof callback === 'function') {
          return callback(prismaMock);
        }
        return Promise.all(callback);
      }),
    };

    eventEmitterMock = {
      emit: jest.fn(),
    };

    geoServiceMock = {
      syncLocation: jest.fn().mockResolvedValue(undefined),
      clearLocation: jest.fn().mockResolvedValue(undefined),
    };

    servicesService = new ServicesService(
      geoServiceMock as any,
      prismaMock as any,
      redisMock as any,
      eventEmitterMock as any,
      { assertCanPublish: jest.fn().mockResolvedValue(true) } as any,
      { assertWithinLimit: jest.fn().mockResolvedValue(true) } as any,
    );
  });

  describe('Soft Delete in ServicesService (BaseListingService)', () => {
    it('sets deletedAt = now(), increments version, writes outbox DELETE event, invalidates caches, and does NOT hard delete', async () => {
      const res = await servicesService.remove(mockService.id, mockService.userId);

      expect(res).toEqual({ message: 'تم حذف الإعلان بنجاح' });
      expect(prismaMock.carService.update).toHaveBeenCalledWith({
        where: { id: mockService.id, deletedAt: null },
        data: {
          deletedAt: expect.any(Date),
          version: { increment: 1 },
        },
      });
      expect(prismaMock.carService.delete).not.toHaveBeenCalled();
      expect(prismaMock.outboxEvent.create).toHaveBeenCalledWith({
        data: {
          entityType: ENTITY_TYPES.CAR_SERVICE,
          entityId: mockService.id,
          action: 'DELETE',
        },
      });
      expect(prismaMock.cleanupPolymorphicOrphans).toHaveBeenCalledWith('CAR_SERVICE', mockService.id);
      expect(redisMock.del).toHaveBeenCalledWith(`carService:detail:${mockService.id}`);
      expect(redisMock.delPattern).toHaveBeenCalledWith('carService:list:*');
    });

    it('throws NotFoundException on remove if listing is already soft-deleted (idempotent / double delete)', async () => {
      prismaMock.carService.findUnique.mockResolvedValueOnce({
        ...mockService,
        deletedAt: new Date(),
      });

      await expect(servicesService.remove(mockService.id, mockService.userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.carService.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException if non-owner attempts remove', async () => {
      await expect(servicesService.remove(mockService.id, 'intruder-user')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prismaMock.carService.update).not.toHaveBeenCalled();
    });

    it('findOne throws NotFoundException when service is soft-deleted', async () => {
      prismaMock.carService.findUnique.mockResolvedValueOnce({
        ...mockService,
        deletedAt: new Date(),
      });

      await expect(servicesService.findOne(mockService.id)).rejects.toThrow(NotFoundException);
    });

    it('findBySlug throws NotFoundException when service is soft-deleted', async () => {
      prismaMock.carService.findUnique.mockResolvedValueOnce({
        ...mockService,
        deletedAt: new Date(),
      });

      await expect(servicesService.findBySlug(mockService.slug)).rejects.toThrow(NotFoundException);
    });

    it('findAll applies deletedAt: null filter', async () => {
      await servicesService.findAll({} as any);

      expect(prismaMock.carService.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            deletedAt: null,
            hiddenByOwnerStatus: false,
          }),
        }),
      );
    });

    it('myListings applies deletedAt: null filter', async () => {
      await servicesService.myListings(mockService.userId);

      expect(prismaMock.carService.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockService.userId,
            deletedAt: null,
          }),
        }),
      );
    });

    it('toggleStatus throws NotFoundException when service is soft-deleted', async () => {
      prismaMock.carService.findUnique.mockResolvedValueOnce({
        ...mockService,
        deletedAt: new Date(),
      });

      await expect(servicesService.toggleStatus(mockService.id, mockService.userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Optimistic Concurrency & Versioning in ServicesService', () => {
    it('throws ConflictException (409) when supplied version does not match stored version', async () => {
      await expect(
        servicesService.update(mockService.id, mockService.userId, {
          title: 'Updated Service Title',
          version: 999, // Stale version
        }),
      ).rejects.toThrow(ConflictException);

      expect(prismaMock.carService.update).not.toHaveBeenCalled();
    });

    it('increments version and updates listing when version matches', async () => {
      await servicesService.update(mockService.id, mockService.userId, {
        title: 'Updated Service Title',
        version: 1, // Matches mockService.version
      });

      expect(prismaMock.carService.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockService.id, version: 1, deletedAt: null },
          data: expect.objectContaining({
            title: 'Updated Service Title',
            version: { increment: 1 },
          }),
        }),
      );
    });

    it('maps Prisma P2025 error on concurrent update to 409 ConflictException when row is live', async () => {
      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record to update not found.',
        { code: 'P2025', clientVersion: '6.0.0' },
      );
      prismaMock.carService.findUnique
        .mockResolvedValueOnce({ ...mockService, version: 1 }) // 1st: geo check in ServicesService
        .mockResolvedValueOnce({ ...mockService, version: 1 }) // 2nd: findOne pre-flight in BaseListingService
        .mockResolvedValueOnce({ ...mockService, version: 2, deletedAt: null }); // 3rd: P2025 re-read in catch
      prismaMock.carService.update.mockRejectedValueOnce(p2025Error);

      await expect(
        servicesService.update(mockService.id, mockService.userId, {
          title: 'Concurrent update',
          version: 1,
        }),
      ).rejects.toThrow(ConflictException);

      expect(prismaMock.carService.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.carService.findUnique).toHaveBeenCalledTimes(3);
    });

    it('allows version-less update for backward compatibility (increments version for future reads)', async () => {
      await servicesService.update(mockService.id, mockService.userId, {
        title: 'Legacy update without version',
      });

      expect(prismaMock.carService.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockService.id, deletedAt: null },
          data: expect.objectContaining({
            title: 'Legacy update without version',
            version: { increment: 1 },
          }),
        }),
      );
    });

    it('update where-clause contains deletedAt: null both with and without version', async () => {
      // With version
      await servicesService.update(mockService.id, mockService.userId, {
        title: 'Versioned update',
        version: 1,
      });
      expect(prismaMock.carService.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { id: mockService.id, version: 1, deletedAt: null },
        }),
      );

      // Without version
      await servicesService.update(mockService.id, mockService.userId, {
        title: 'Versionless update',
      });
      expect(prismaMock.carService.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { id: mockService.id, deletedAt: null },
        }),
      );
    });

    it('handles P2025 race on update: throws NotFoundException when row was soft-deleted in between', async () => {
      const p2025 = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.0.0',
      });
      prismaMock.carService.findUnique
        .mockResolvedValueOnce({ ...mockService, version: 1 }) // 1st: geo check in ServicesService
        .mockResolvedValueOnce({ ...mockService, version: 1 }) // 2nd: findOne pre-flight in BaseListingService
        .mockResolvedValueOnce({ ...mockService, deletedAt: new Date() }); // 3rd: P2025 re-read in catch
      prismaMock.carService.update.mockRejectedValueOnce(p2025);

      await expect(
        servicesService.update(mockService.id, mockService.userId, {
          title: 'Update on concurrently deleted service',
          version: 1,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.carService.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.carService.findUnique).toHaveBeenCalledTimes(3);
    });

    it('remove() where clause contains deletedAt: null and throws NotFoundException on second concurrent delete (P2025)', async () => {
      // First remove: verifies where: { id, deletedAt: null }
      await servicesService.remove(mockService.id, mockService.userId);
      expect(prismaMock.carService.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockService.id, deletedAt: null },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            version: { increment: 1 },
          }),
        }),
      );

      // Concurrent remove with P2025: pre-flight live, update rejects P2025 -> NotFoundException
      prismaMock.outboxEvent.create.mockClear();
      prismaMock.cleanupPolymorphicOrphans.mockClear();
      const p2025 = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.0.0',
      });
      prismaMock.carService.findUnique.mockResolvedValueOnce({ ...mockService, deletedAt: null });
      prismaMock.carService.update.mockRejectedValueOnce(p2025);
      await expect(
        servicesService.remove(mockService.id, mockService.userId),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.outboxEvent.create).not.toHaveBeenCalled();
      expect(prismaMock.cleanupPolymorphicOrphans).not.toHaveBeenCalled();
    });
  });

  describe('Service Image Upload Cache Invalidation (Audit 316 Claim 6 Defect 1)', () => {
    it('addImageToService invalidates carService:detail:<id> and carService:list:* cache', async () => {
      const uploadService = new UploadImageManagerService(
        prismaMock as any,
        { deleteFile: jest.fn() } as any,
        redisMock as any,
      );

      await uploadService.addImageToService(
        mockService.id,
        mockService.userId,
        'https://cdn.example.com/srv-new.jpg',
        false,
      );

      expect(redisMock.del).toHaveBeenCalledWith(`carService:detail:${mockService.id}`);
      expect(redisMock.delPattern).toHaveBeenCalledWith('carService:list:*');
    });

    it('removeImageFromService invalidates carService:detail:<id> and carService:list:* cache', async () => {
      const uploadService = new UploadImageManagerService(
        prismaMock as any,
        { deleteFile: jest.fn() } as any,
        redisMock as any,
      );

      await uploadService.removeImageFromService('img-srv-1', mockService.userId);

      expect(redisMock.del).toHaveBeenCalledWith(`carService:detail:${mockService.id}`);
      expect(redisMock.delPattern).toHaveBeenCalledWith('carService:list:*');
    });

    it('addImageToService throws NotFoundException for soft-deleted service', async () => {
      prismaMock.carService.findFirst.mockResolvedValueOnce(null);
      const uploadService = new UploadImageManagerService(
        prismaMock as any,
        { deleteFile: jest.fn() } as any,
        redisMock as any,
      );

      await expect(
        uploadService.addImageToService(mockService.id, mockService.userId, 'https://cdn.example.com/new.jpg', false),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.carService.findFirst).toHaveBeenCalledWith({
        where: { id: mockService.id, deletedAt: null },
      });
    });

    it('removeImageFromService throws NotFoundException for soft-deleted service', async () => {
      prismaMock.carServiceImage.findUnique.mockResolvedValueOnce({
        id: 'img-srv-1',
        url: 'https://cdn.example.com/srv1.jpg',
        carService: { id: mockService.id, userId: mockService.userId, deletedAt: new Date() },
      });

      const uploadService = new UploadImageManagerService(
        prismaMock as any,
        { deleteFile: jest.fn() } as any,
        redisMock as any,
      );

      await expect(
        uploadService.removeImageFromService('img-srv-1', mockService.userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Consumer Integration: Favorites, Contact, Search', () => {
    it('FavoritesService skips soft-deleted services across resolvers', async () => {
      const favService = new FavoritesService(
        prismaMock as any,
        { create: jest.fn() } as any,
      );

      prismaMock.carService.findFirst.mockResolvedValue(null);

      await expect(
        favService.toggle('CAR_SERVICE', mockService.id, 'fav-user'),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.carService.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockService.id, deletedAt: null },
        }),
      );
    });

    it('ContactRegistry throws NotFoundException for soft-deleted service', async () => {
      const entry = CONTACT_REGISTRY[ENTITY_TYPES.CAR_SERVICE];
      prismaMock.carService.findUnique.mockResolvedValueOnce({
        ...mockService,
        deletedAt: new Date(),
      });

      await expect(
        entry.loadTarget(prismaMock as any, mockService.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('SearchSyncWorker removes soft-deleted service from Meilisearch index', async () => {
      const searchServiceMock = {
        removeDocument: jest.fn().mockResolvedValue(undefined),
        indexDocument: jest.fn().mockResolvedValue(undefined),
      };

      const worker = new SearchSyncWorker(
        prismaMock as any,
        searchServiceMock as any,
      );

      prismaMock.carService.findUnique.mockResolvedValueOnce({
        ...mockService,
        deletedAt: new Date(),
      });

      await worker.handleSync({
        data: {
          entityType: ENTITY_TYPES.CAR_SERVICE,
          entityId: mockService.id,
          action: 'UPSERT',
        },
      } as any);

      expect(searchServiceMock.removeDocument).toHaveBeenCalledWith(INDEXES.SERVICES, mockService.id);
      expect(searchServiceMock.indexDocument).not.toHaveBeenCalled();
    });
  });
});
