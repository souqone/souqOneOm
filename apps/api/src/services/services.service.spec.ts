import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SearchService } from '../search/search.service';

// ── Mocks ──────────────────────────────────────────
const mockPrisma = {
  carService: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  cleanupPolymorphicOrphans: jest.fn(),
};

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  delPattern: jest.fn().mockResolvedValue(undefined),
  setNX: jest.fn().mockResolvedValue(true),
  isReady: jest.fn().mockReturnValue(true),
};

const mockSearch = {
  indexDocument: jest.fn().mockResolvedValue(undefined),
  removeDocument: jest.fn().mockResolvedValue(undefined),
};

const mockEventEmitter = {
  emit: jest.fn(),
};

// ── Test data ──────────────────────────────────────
const mockItem = {
  id: 'svc-1',
  title: 'خدمة تغيير زيت',
  slug: 'test-slug',
  description: 'وصف الخدمة',
  serviceType: 'MAINTENANCE',
  providerType: 'WORKSHOP',
  providerName: 'ورشة الأمان',
  priceFrom: { toNumber: () => 5 },
  currency: 'OMR',
  governorate: 'مسقط',
  status: 'ACTIVE',
  userId: 'user-1',
  viewCount: 0,
  createdAt: new Date(),
  images: [{ url: 'https://img.test/1.jpg' }],
  user: { id: 'user-1', username: 'test', displayName: 'Test', avatarUrl: null },
};

describe('ServicesService', () => {
  let service: ServicesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: SearchService, useValue: mockSearch },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  // ══════════════════════════════════════
  // CREATE
  // ══════════════════════════════════════
  describe('create', () => {
    it('should create a service and sync to Meilisearch', async () => {
      mockPrisma.carService.create.mockResolvedValue(mockItem);

      const dto = {
        title: 'خدمة تغيير زيت',
        description: 'وصف الخدمة بالتفصيل',
        serviceType: 'MAINTENANCE',
        providerType: 'WORKSHOP',
        providerName: 'ورشة الأمان',
        governorate: 'مسقط',
      };

      const result = await service.create(dto as any, 'user-1');

      expect(result).toEqual(mockItem);
      expect(mockPrisma.carService.create).toHaveBeenCalledTimes(1);
      expect(mockSearch.indexDocument).toHaveBeenCalledTimes(1);
      expect(mockRedis.delPattern).toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════
  // FIND ALL (cached)
  // ══════════════════════════════════════
  describe('findAll', () => {
    it('should return paginated results', async () => {
      mockPrisma.carService.findMany.mockResolvedValue([mockItem]);
      mockPrisma.carService.count.mockResolvedValue(1);
      mockRedis.get.mockResolvedValue(null);

      const result = await service.findAll({ page: '1', limit: '20' });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should return cached results when available', async () => {
      const cached = { items: [mockItem], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };
      mockRedis.get.mockResolvedValue(cached);

      const result = await service.findAll({ page: '1', limit: '20' });

      expect(result).toEqual(cached);
      expect(mockPrisma.carService.findMany).not.toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
      mockPrisma.carService.findMany.mockResolvedValue([]);
      mockPrisma.carService.count.mockResolvedValue(0);
      mockRedis.get.mockResolvedValue(null);

      await service.findAll({
        search: 'زيت',
        serviceType: 'MAINTENANCE' as any,
        governorate: 'مسقط',
        page: '1',
        limit: '20',
      });

      const callArgs = mockPrisma.carService.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.serviceType).toBe('MAINTENANCE');
      expect(callArgs.where.governorate).toBe('مسقط');
    });
  });

  // ══════════════════════════════════════
  // FIND ONE (viewCount rate-limited)
  // ══════════════════════════════════════
  describe('findOne', () => {
    it('should increment viewCount on first view from an IP', async () => {
      mockPrisma.carService.findUnique.mockResolvedValue(mockItem);
      mockRedis.get.mockResolvedValue(null); // no cache, no view lock

      const result = await service.findOne('svc-1', '192.168.1.1');

      expect(result).toEqual(mockItem);
      expect(mockPrisma.carService.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { viewCount: { increment: 1 } } }),
      );
    });

    it('should NOT increment viewCount for duplicate IP within cooldown', async () => {
      mockRedis.get.mockResolvedValueOnce(null); // no cache for detail
      mockPrisma.carService.findUnique.mockResolvedValue(mockItem);
      // view-count uses setNX — false means key already exists (already viewed)
      mockRedis.setNX.mockResolvedValueOnce(false);

      await service.findOne('svc-1', '192.168.1.1');

      expect(mockPrisma.carService.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent ID', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.carService.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════
  // MY LISTINGS (paginated)
  // ══════════════════════════════════════
  describe('myListings', () => {
    it('should return paginated user listings', async () => {
      mockPrisma.carService.findMany.mockResolvedValue([mockItem]);
      mockPrisma.carService.count.mockResolvedValue(1);

      const result = await service.myListings('user-1', 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
      expect(mockPrisma.carService.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' }, skip: 0, take: 20 }),
      );
    });
  });

  // ══════════════════════════════════════
  // UPDATE (safe field mapping)
  // ══════════════════════════════════════
  describe('update', () => {
    it('should update and sync to Meilisearch', async () => {
      mockPrisma.carService.findUnique.mockResolvedValue(mockItem);
      mockPrisma.carService.update.mockResolvedValue({ ...mockItem, title: 'خدمة جديدة' });

      const result = await service.update('svc-1', 'user-1', { title: 'خدمة جديدة' });

      expect(result.title).toBe('خدمة جديدة');
      expect(mockSearch.indexDocument).toHaveBeenCalledTimes(1);
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.carService.findUnique.mockResolvedValue(mockItem);

      await expect(
        service.update('svc-1', 'other-user', { title: 'hack' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should convert decimal fields correctly', async () => {
      mockPrisma.carService.findUnique.mockResolvedValue(mockItem);
      mockPrisma.carService.update.mockResolvedValue(mockItem);

      await service.update('svc-1', 'user-1', { priceFrom: 10 });

      const updateCall = mockPrisma.carService.update.mock.calls[0][0];
      const { Decimal } = require('@prisma/client/runtime/library');
      expect(updateCall.data.priceFrom).toBeInstanceOf(Decimal);
    });
  });

  // ══════════════════════════════════════
  // REMOVE
  // ══════════════════════════════════════
  describe('remove', () => {
    it('should delete and cleanup orphans + Meilisearch', async () => {
      mockPrisma.carService.findUnique.mockResolvedValue(mockItem);
      mockPrisma.carService.delete.mockResolvedValue(mockItem);

      const result = await service.remove('svc-1', 'user-1');

      expect(result.message).toBe('تم حذف الإعلان بنجاح');
      expect(mockPrisma.cleanupPolymorphicOrphans).toHaveBeenCalledWith('CAR_SERVICE', 'svc-1');
      expect(mockSearch.removeDocument).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.carService.findUnique.mockResolvedValue(mockItem);

      await expect(service.remove('svc-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });
  });

  // ══════════════════════════════════════
  // TOGGLE STATUS
  // ══════════════════════════════════════
  describe('toggleStatus', () => {
    it('should toggle ACTIVE to INACTIVE', async () => {
      mockPrisma.carService.findUnique.mockResolvedValue(mockItem);
      mockPrisma.carService.update.mockResolvedValue({ ...mockItem, status: 'INACTIVE' });

      const result = await service.toggleStatus('svc-1', 'user-1');

      expect(result.status).toBe('INACTIVE');
      expect(mockPrisma.carService.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'INACTIVE' } }),
      );
    });

    it('should toggle INACTIVE to ACTIVE', async () => {
      const inactiveItem = { ...mockItem, status: 'INACTIVE' };
      mockPrisma.carService.findUnique.mockResolvedValue(inactiveItem);
      mockPrisma.carService.update.mockResolvedValue({ ...inactiveItem, status: 'ACTIVE' });

      const result = await service.toggleStatus('svc-1', 'user-1');

      expect(result.status).toBe('ACTIVE');
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.carService.findUnique.mockResolvedValue(mockItem);

      await expect(service.toggleStatus('svc-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });
  });

  // ══════════════════════════════════════
  // EVENT EMISSION
  // ══════════════════════════════════════
  describe('event emission', () => {
    it('should emit listing.created on create', async () => {
      mockPrisma.carService.create.mockResolvedValue(mockItem);
      await service.create({ title: 'خدمة', description: 'وصف بالتفصيل', serviceType: 'MAINTENANCE', providerType: 'WORKSHOP', providerName: 'ورشة', governorate: 'مسقط' } as any, 'user-1');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('listing.created', expect.objectContaining({ entityType: 'CAR_SERVICE', userId: 'user-1' }));
    });

    it('should emit listing.updated on update', async () => {
      mockPrisma.carService.findUnique.mockResolvedValue(mockItem);
      mockPrisma.carService.update.mockResolvedValue(mockItem);
      await service.update('svc-1', 'user-1', { title: 'جديد' });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('listing.updated', expect.objectContaining({ listingId: 'svc-1' }));
    });

    it('should emit listing.deleted on remove', async () => {
      mockPrisma.carService.findUnique.mockResolvedValue(mockItem);
      mockPrisma.carService.delete.mockResolvedValue(mockItem);
      await service.remove('svc-1', 'user-1');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('listing.deleted', expect.objectContaining({ listingId: 'svc-1' }));
    });

    it('should emit listing.status_changed on toggleStatus', async () => {
      mockPrisma.carService.findUnique.mockResolvedValue(mockItem);
      mockPrisma.carService.update.mockResolvedValue({ ...mockItem, status: 'INACTIVE' });
      await service.toggleStatus('svc-1', 'user-1');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('listing.status_changed', expect.objectContaining({ status: 'INACTIVE' }));
    });
  });
});
