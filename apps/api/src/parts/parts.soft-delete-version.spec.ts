import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PartsService } from './parts.service';
import { UploadImageManagerService } from '../uploads/upload-image-manager.service';
import { FavoritesService } from '../favorites/favorites.service';
import { CONTACT_REGISTRY } from '../contact/contact.registry';
import { SearchSyncWorker } from '../search/search-sync.worker';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';
import { INDEXES } from '../search/search.service';
import { Prisma } from '@prisma/client';

describe('SpareParts - Soft Delete & Versioning (Task D-105 / PB-1)', () => {
  let partsService: PartsService;
  let prismaMock: any;
  let eventEmitterMock: any;
  let geoServiceMock: any;

  const mockPart: any = {
    id: 'part-100',
    sellerId: 'user-seller',
    title: 'Brake Pads Camry 2020',
    slug: 'brake-pads-camry-2020-part-100',
    description: 'Original brake pads in good condition',
    partCategory: 'BRAKE_SYSTEM',
    condition: 'USED',
    price: new Prisma.Decimal(25),
    currency: 'OMR',
    status: 'ACTIVE',
    version: 1,
    deletedAt: null,
    hiddenByOwnerStatus: false,
    viewCount: 10,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    images: [{ id: 'img-part-1', url: 'https://cdn.example.com/part1.jpg', order: 0, isPrimary: true }],
  };

  beforeEach(() => {
    prismaMock = {
      sparePart: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === mockPart.id) return Promise.resolve({ ...mockPart });
          return Promise.resolve(null);
        }),
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === mockPart.id && (where.deletedAt === null ? mockPart.deletedAt === null : true)) {
            return Promise.resolve({ ...mockPart });
          }
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockResolvedValue([{ ...mockPart }]),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          return Promise.resolve({ ...mockPart, ...data, version: (mockPart.version || 1) + 1 });
        }),
        delete: jest.fn(),
      },
      sparePartImage: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === 'img-part-1') {
            return Promise.resolve({
              id: 'img-part-1',
              url: 'https://cdn.example.com/part1.jpg',
              sparePartId: mockPart.id,
              sparePart: { ...mockPart },
            });
          }
          return Promise.resolve(null);
        }),
        findFirst: jest.fn().mockResolvedValue({ id: 'img-part-1', isPrimary: true }),
        create: jest.fn().mockResolvedValue({ id: 'img-part-2', url: 'https://cdn.example.com/part2.jpg' }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(1),
        aggregate: jest.fn().mockResolvedValue({ _max: { order: 0 } }),
      },
      outboxEvent: {
        create: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
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
      validateLocationPair: jest.fn().mockResolvedValue(undefined),
    };

    partsService = new PartsService(
      geoServiceMock as any,
      prismaMock as any,
      eventEmitterMock as any,
      { assertCanPublish: jest.fn().mockResolvedValue(true) } as any,
      { assertWithinLimit: jest.fn().mockResolvedValue(true) } as any,
    );
  });

  describe('Soft Delete in PartsService', () => {
    it('sets deletedAt = now(), increments version, writes outbox DELETE event, calls polymorphic cleanup, and does NOT hard delete', async () => {
      const res = await partsService.remove(mockPart.id, mockPart.sellerId);

      expect(res).toEqual({ message: 'تم حذف الإعلان بنجاح' });
      expect(prismaMock.sparePart.update).toHaveBeenCalledWith({
        where: { id: mockPart.id, deletedAt: null },
        data: {
          deletedAt: expect.any(Date),
          version: { increment: 1 },
        },
      });
      expect(prismaMock.sparePart.delete).not.toHaveBeenCalled();
      expect(prismaMock.outboxEvent.create).toHaveBeenCalledWith({
        data: {
          entityType: ENTITY_TYPES.SPARE_PART,
          entityId: mockPart.id,
          action: 'DELETE',
        },
      });
      expect(prismaMock.cleanupPolymorphicOrphans).toHaveBeenCalledWith('SPARE_PART', mockPart.id);
      expect(eventEmitterMock.emit).toHaveBeenCalled();
    });

    it('throws NotFoundException on remove if listing is already soft-deleted (idempotent / double delete)', async () => {
      prismaMock.sparePart.findUnique.mockResolvedValueOnce({
        ...mockPart,
        deletedAt: new Date(),
      });

      await expect(partsService.remove(mockPart.id, mockPart.sellerId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.sparePart.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException if non-owner attempts remove', async () => {
      await expect(partsService.remove(mockPart.id, 'intruder-user')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prismaMock.sparePart.update).not.toHaveBeenCalled();
    });

    it('findOne throws NotFoundException when part is soft-deleted', async () => {
      prismaMock.sparePart.findUnique.mockResolvedValueOnce({
        ...mockPart,
        deletedAt: new Date(),
      });

      await expect(partsService.findOne(mockPart.id)).rejects.toThrow(NotFoundException);
    });

    it('findAll applies deletedAt: null filter', async () => {
      await partsService.findAll({} as any);

      expect(prismaMock.sparePart.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            deletedAt: null,
            hiddenByOwnerStatus: false,
          }),
        }),
      );
    });

    it('myParts applies deletedAt: null filter', async () => {
      await partsService.myParts(mockPart.sellerId);

      expect(prismaMock.sparePart.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sellerId: mockPart.sellerId,
            deletedAt: null,
          }),
        }),
      );
    });
  });

  describe('Optimistic Concurrency & Versioning in PartsService', () => {
    it('throws ConflictException (409) when supplied version does not match stored version', async () => {
      await expect(
        partsService.update(mockPart.id, mockPart.sellerId, {
          title: 'Updated title',
          version: 999, // Stale version
        } as any),
      ).rejects.toThrow(ConflictException);

      expect(prismaMock.sparePart.update).not.toHaveBeenCalled();
    });

    it('increments version and updates listing when version matches', async () => {
      await partsService.update(mockPart.id, mockPart.sellerId, {
        title: 'Updated title',
        version: 1, // Matches mockPart.version
      } as any);

      expect(prismaMock.sparePart.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPart.id, version: 1, deletedAt: null },
          data: expect.objectContaining({
            title: 'Updated title',
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
      prismaMock.sparePart.findUnique
        .mockResolvedValueOnce({ ...mockPart, version: 1 }) // 1st: pre-flight read
        .mockResolvedValueOnce({ ...mockPart, version: 2, deletedAt: null }); // 2nd: P2025 re-read in catch
      prismaMock.sparePart.update.mockRejectedValueOnce(p2025Error);

      await expect(
        partsService.update(mockPart.id, mockPart.sellerId, {
          title: 'Concurrent update',
          version: 1,
        } as any),
      ).rejects.toThrow(ConflictException);

      expect(prismaMock.sparePart.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.sparePart.findUnique).toHaveBeenCalledTimes(2);
    });

    it('allows version-less update for backward compatibility (increments version for future reads)', async () => {
      await partsService.update(mockPart.id, mockPart.sellerId, {
        title: 'Legacy update without version',
      } as any);

      expect(prismaMock.sparePart.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPart.id, deletedAt: null },
          data: expect.objectContaining({
            title: 'Legacy update without version',
            version: { increment: 1 },
          }),
        }),
      );
    });

    it('update where-clause contains deletedAt: null both with and without version', async () => {
      // With version
      await partsService.update(mockPart.id, mockPart.sellerId, {
        title: 'Versioned update',
        version: 1,
      } as any);
      expect(prismaMock.sparePart.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { id: mockPart.id, version: 1, deletedAt: null },
        }),
      );

      // Without version
      await partsService.update(mockPart.id, mockPart.sellerId, {
        title: 'Versionless update',
      } as any);
      expect(prismaMock.sparePart.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { id: mockPart.id, deletedAt: null },
        }),
      );
    });

    it('handles P2025 race on update: throws NotFoundException when row was soft-deleted in between', async () => {
      const p2025 = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.0.0',
      });
      prismaMock.sparePart.findUnique
        .mockResolvedValueOnce({ ...mockPart, version: 1 }) // 1st: pre-flight read
        .mockResolvedValueOnce({ ...mockPart, deletedAt: new Date() }); // 2nd: P2025 re-read in catch
      prismaMock.sparePart.update.mockRejectedValueOnce(p2025);

      await expect(
        partsService.update(mockPart.id, mockPart.sellerId, {
          title: 'Update on concurrently deleted part',
          version: 1,
        } as any),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.sparePart.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.sparePart.findUnique).toHaveBeenCalledTimes(2);
    });

    it('remove() where clause contains deletedAt: null and throws NotFoundException on second concurrent delete (P2025)', async () => {
      // First remove: verifies where: { id, deletedAt: null }
      await partsService.remove(mockPart.id, mockPart.sellerId);
      expect(prismaMock.sparePart.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPart.id, deletedAt: null },
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
      prismaMock.sparePart.findUnique.mockResolvedValueOnce({ ...mockPart, deletedAt: null });
      prismaMock.sparePart.update.mockRejectedValueOnce(p2025);
      await expect(
        partsService.remove(mockPart.id, mockPart.sellerId),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.outboxEvent.create).not.toHaveBeenCalled();
      expect(prismaMock.cleanupPolymorphicOrphans).not.toHaveBeenCalled();
    });
  });

  describe('Consumer Integration: Uploads, Favorites, Contact, Search', () => {
    it('UploadImageManagerService.addImageToPart throws NotFoundException for soft-deleted part', async () => {
      prismaMock.sparePart.findFirst.mockResolvedValueOnce(null);
      const uploadService = new UploadImageManagerService(
        prismaMock as any,
        { deleteFile: jest.fn() } as any,
        { del: jest.fn(), delPattern: jest.fn() } as any,
      );

      await expect(
        uploadService.addImageToPart(mockPart.id, mockPart.sellerId, 'https://cdn.example.com/new.jpg', false),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.sparePart.findFirst).toHaveBeenCalledWith({
        where: { id: mockPart.id, deletedAt: null },
      });
    });

    it('UploadImageManagerService.removeImageFromPart throws NotFoundException for soft-deleted part', async () => {
      prismaMock.sparePartImage.findUnique.mockResolvedValueOnce({
        id: 'img-part-1',
        url: 'https://cdn.example.com/part1.jpg',
        sparePart: { id: mockPart.id, sellerId: mockPart.sellerId, deletedAt: new Date() },
      });

      const uploadService = new UploadImageManagerService(
        prismaMock as any,
        { deleteFile: jest.fn() } as any,
        { del: jest.fn(), delPattern: jest.fn() } as any,
      );

      await expect(
        uploadService.removeImageFromPart('img-part-1', mockPart.sellerId),
      ).rejects.toThrow(NotFoundException);
    });

    it('FavoritesService skips soft-deleted parts across resolvers', async () => {
      const favService = new FavoritesService(
        prismaMock as any,
        { create: jest.fn() } as any,
      );

      // findFirst returns null for deletedAt: null
      prismaMock.sparePart.findFirst.mockResolvedValue(null);

      await expect(
        favService.toggle('SPARE_PART', mockPart.id, 'fav-user'),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.sparePart.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPart.id, deletedAt: null },
        }),
      );
    });

    it('ContactRegistry throws NotFoundException for soft-deleted parts', async () => {
      const entry = CONTACT_REGISTRY[ENTITY_TYPES.SPARE_PART];
      prismaMock.sparePart.findUnique.mockResolvedValueOnce({
        ...mockPart,
        deletedAt: new Date(),
      });

      await expect(
        entry.loadTarget(prismaMock as any, mockPart.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('SearchSyncWorker removes soft-deleted part from Meilisearch index', async () => {
      const searchServiceMock = {
        removeDocument: jest.fn().mockResolvedValue(undefined),
        indexDocument: jest.fn().mockResolvedValue(undefined),
      };

      const worker = new SearchSyncWorker(
        prismaMock as any,
        searchServiceMock as any,
      );

      prismaMock.sparePart.findUnique.mockResolvedValueOnce({
        ...mockPart,
        deletedAt: new Date(),
      });

      await worker.handleSync({
        data: {
          entityType: ENTITY_TYPES.SPARE_PART,
          entityId: mockPart.id,
          action: 'UPSERT',
        },
      } as any);

      expect(searchServiceMock.removeDocument).toHaveBeenCalledWith(INDEXES.PARTS, mockPart.id);
      expect(searchServiceMock.indexDocument).not.toHaveBeenCalled();
    });
  });
});
