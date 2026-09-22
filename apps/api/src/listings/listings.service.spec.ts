import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ListingStatus } from '@prisma/client';
import { ListingsService } from './listings.service';
import { GeoService } from '../locations/geo.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SearchService } from '../search/search.service';
import { ListingsRepository } from './listings.repository';

const mockListing = {
  id: 'listing-1',
  title: 'تويوتا كامري 2024',
  slug: 'toyota-camry-2024-abc',
  sellerId: 'seller-1',
  make: 'Toyota',
  model: 'Camry',
  year: 2024,
  price: { toNumber: () => 12000 },
  status: 'ACTIVE',
  currency: 'OMR',
  images: [],
};

const mockPrisma = {
  listing: {
    findUnique: jest.fn(),
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([mockListing]),
    count: jest.fn().mockResolvedValue(1),
    update: jest.fn(),
    delete: jest.fn(),
  },
  brand: { findUnique: jest.fn().mockResolvedValue({ id: 'brand-1', name: 'Toyota' }) },
  carModel: { findUnique: jest.fn().mockResolvedValue({ id: 'model-1', brandId: 'brand-1', name: 'Camry' }) },
  carTrim: { findUnique: jest.fn().mockResolvedValue({ id: 'trim-1', modelId: 'model-1', name: 'SE' }) },
  cleanupPolymorphicOrphans: jest.fn().mockResolvedValue(undefined),
  $transaction: jest.fn().mockImplementation(async (args) => {
    if (typeof args === 'function') {
      return await args(mockPrisma); // Return same mock structure for `tx` callback
    }
    return Promise.all(args);
  }),
  wilaya: {
    findUnique: jest.fn(),
  },
};

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  delPattern: jest.fn().mockResolvedValue(undefined),
  setNX: jest.fn().mockResolvedValue(true),
};

const mockSearchService = {
  indexDocument: jest.fn().mockResolvedValue(undefined),
  removeDocument: jest.fn().mockResolvedValue(undefined),
};

const mockRepo = {
  create: jest.fn().mockResolvedValue({
    ...mockListing,
    price: { toNumber: () => 12000 },
  }),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findMany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn().mockResolvedValue(undefined),
  incrementViewCount: jest.fn(),
};

const mockGeoService = {
  validateLocationPair: jest.fn(),
};

describe('ListingsService', () => {
  let service: ListingsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: SearchService, useValue: mockSearchService },
        { provide: GeoService, useValue: mockGeoService },
        { provide: ListingsRepository, useValue: mockRepo },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
  });

  describe('create', () => {
    it('should create a listing and return it', async () => {
      const result = await service.create(
        {
          title: 'تويوتا كامري 2024',
          description: 'سيارة ممتازة',
          brandId: 'brand-1',
          carModelId: 'model-1',
          year: 2024,
          price: 12000,
        } as any,
        'seller-1',
      );

      expect(result).toBeDefined();
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
      expect(mockRedis.delPattern).toHaveBeenCalledWith('listings:*');
    });

    it('should persist all six rental fields on RENTAL create, preserving 0 for depositAmount and kmLimitPerDay', async () => {
      const dto = {
        title: 'تويوتا كامري إيجار',
        description: 'سيارة للإيجار',
        brandId: 'brand-1',
        carModelId: 'model-1',
        year: 2024,
        price: 50,
        listingType: 'RENTAL',
        dailyPrice: 50,
        monthlyPrice: 1200,
        depositAmount: 0,
        minRentalDays: 2,
        kmLimitPerDay: 0,
        cancellationPolicy: 'مرنة حتى 24 ساعة',
        deliveryAvailable: true,
        insuranceIncluded: true,
        governorateId: 1,
        wilayaId: 1,
      } as any;

      await service.create(dto, 'seller-1');

      const createArg = mockRepo.create.mock.calls[mockRepo.create.mock.calls.length - 1][0];
      expect(createArg.listingType).toBe('RENTAL');
      expect(createArg.depositAmount?.toNumber()).toBe(0);
      expect(createArg.minRentalDays).toBe(2);
      expect(createArg.kmLimitPerDay).toBe(0);
      expect(createArg.cancellationPolicy).toBe('مرنة حتى 24 ساعة');
      expect(createArg.deliveryAvailable).toBe(true);
      expect(createArg.insuranceIncluded).toBe(true);
    });

    it('should not persist rental fields on SALE create even if provided in DTO', async () => {
      const dto = {
        title: 'تويوتا كامري للبيع',
        description: 'سيارة للبيع',
        brandId: 'brand-1',
        carModelId: 'model-1',
        year: 2024,
        price: 12000,
        listingType: 'SALE',
        dailyPrice: 50,
        depositAmount: 100,
        minRentalDays: 3,
        kmLimitPerDay: 200,
        cancellationPolicy: 'شروط معينة',
        deliveryAvailable: true,
        insuranceIncluded: true,
        governorateId: 1,
        wilayaId: 1,
      } as any;

      await service.create(dto, 'seller-1');

      const createArg = mockRepo.create.mock.calls[mockRepo.create.mock.calls.length - 1][0];
      expect(createArg.listingType).toBe('SALE');
      expect(createArg.dailyPrice).toBeUndefined();
      expect(createArg.depositAmount).toBeUndefined();
      expect(createArg.minRentalDays).toBeUndefined();
      expect(createArg.kmLimitPerDay).toBeUndefined();
      expect(createArg.cancellationPolicy).toBeUndefined();
      expect(createArg.deliveryAvailable).toBe(false);
      expect(createArg.insuranceIncluded).toBe(false);
    });

    it('should throw BadRequestException on RENTAL create without positive dailyPrice', async () => {
      const dto = {
        title: 'تويوتا كامري إيجار',
        brandId: 'brand-1',
        carModelId: 'model-1',
        year: 2024,
        price: 0,
        listingType: 'RENTAL',
        dailyPrice: 0,
      } as any;

      await expect(service.create(dto, 'seller-1')).rejects.toThrow('سعر الإيجار اليومي مطلوب لإعلانات الإيجار');
    });

    it('should persist whatsappEnabled: true when specified on create', async () => {
      const dto = {
        title: 'تويوتا كامري 2024',
        brandId: 'brand-1',
        carModelId: 'model-1',
        year: 2024,
        price: 12000,
        whatsappEnabled: true,
        governorateId: 1,
        wilayaId: 1,
      } as any;

      await service.create(dto, 'seller-1');

      const createArg = mockRepo.create.mock.calls[mockRepo.create.mock.calls.length - 1][0];
      expect(createArg.whatsappEnabled).toBe(true);
    });

    it('should default whatsappEnabled to false when omitted on create', async () => {
      const dto = {
        title: 'تويوتا كامري 2024',
        brandId: 'brand-1',
        carModelId: 'model-1',
        year: 2024,
        price: 12000,
        governorateId: 1,
        wilayaId: 1,
      } as any;

      await service.create(dto, 'seller-1');

      const createArg = mockRepo.create.mock.calls[mockRepo.create.mock.calls.length - 1][0];
      expect(createArg.whatsappEnabled).toBe(false);
    });
  });

  describe('cross-validation for locations', () => {
    it('should throw BadRequestException if wilaya does not belong to governorate', async () => {
      // RED: Mock geoService to throw if invalid
      mockGeoService.validateLocationPair.mockRejectedValueOnce(
        new Error('الولاية لا تتبع للمحافظة المحددة')
      );

      const dto = {
        title: 'سيارة',
        price: 12000,
        governorateId: 1, // Muscat
        wilayaId: 10, // Salalah (Mismatch!)
      } as any;

      await expect(service.create(dto, 'seller-1')).rejects.toThrow('الولاية لا تتبع للمحافظة المحددة');
    });
  });

  describe('findAll', () => {
    it('should return paginated listings', async () => {
      mockRepo.findMany.mockResolvedValueOnce([[mockListing], 1]);

      const result = await service.findAll({ page: 1, limit: 10 }) as { items: unknown[]; meta: { total: number; page: number } };

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should use cached data if available', async () => {
      const cached = { items: [mockListing], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
      mockRedis.get.mockResolvedValueOnce(cached);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(cached);
      expect(mockRepo.findMany).not.toHaveBeenCalled();
    });

    it.each([ListingStatus.DRAFT, ListingStatus.SUSPENDED, ListingStatus.ARCHIVED])(
      'should map hidden status %s to ACTIVE in where clause',
      async (hiddenStatus) => {
        mockRepo.findMany.mockResolvedValueOnce([[mockListing], 1]);

        await service.findAll({ status: hiddenStatus as any });

        expect(mockRepo.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ status: ListingStatus.ACTIVE }),
          expect.anything(),
          expect.anything(),
          expect.anything(),
        );
      },
    );

    it.each([ListingStatus.SOLD, ListingStatus.RENTED])(
      'should preserve allowed status %s in where clause',
      async (allowedStatus) => {
        mockRepo.findMany.mockResolvedValueOnce([[mockListing], 1]);

        await service.findAll({ status: allowedStatus });

        expect(mockRepo.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ status: allowedStatus }),
          expect.anything(),
          expect.anything(),
          expect.anything(),
        );
      },
    );
  });

  describe('findOne', () => {
    it('should return a listing by id', async () => {
      mockRepo.findById.mockResolvedValue(mockListing);

      const result = await service.findOne('listing-1') as { id: string };
      expect(result.id).toBe('listing-1');
    });

    it('should throw NotFoundException for missing listing', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    describe('visibility gate matrix (findOne)', () => {
      const allStatuses: ListingStatus[] = [
        ListingStatus.ACTIVE,
        ListingStatus.SOLD,
        ListingStatus.RENTED,
        ListingStatus.DRAFT,
        ListingStatus.ARCHIVED,
        ListingStatus.SUSPENDED,
      ];

      allStatuses.forEach((status) => {
        const isPublic = ['ACTIVE', 'SOLD', 'RENTED'].includes(status);

        it(`handles anonymous viewer for status=${status}`, async () => {
          mockRepo.findById.mockResolvedValue({ ...mockListing, status });
          if (isPublic) {
            const res = await service.findOne('listing-1', undefined);
            expect(res).toBeDefined();
          } else {
            await expect(service.findOne('listing-1', undefined)).rejects.toThrow(NotFoundException);
          }
        });

        it(`handles other viewer for status=${status}`, async () => {
          mockRepo.findById.mockResolvedValue({ ...mockListing, status });
          if (isPublic) {
            const res = await service.findOne('listing-1', 'other-viewer');
            expect(res).toBeDefined();
          } else {
            await expect(service.findOne('listing-1', 'other-viewer')).rejects.toThrow(NotFoundException);
          }
        });

        it(`handles owner viewer for status=${status}`, async () => {
          mockRepo.findById.mockResolvedValue({ ...mockListing, status });
          const res = await service.findOne('listing-1', 'seller-1');
          expect(res).toBeDefined();
        });
      });

      it('applies visibility gate on cache hit', async () => {
        mockRedis.get.mockResolvedValueOnce({ ...mockListing, status: ListingStatus.DRAFT });
        await expect(service.findOne('listing-1', 'other-viewer')).rejects.toThrow(NotFoundException);
        expect(mockRepo.findById).not.toHaveBeenCalled();
      });
    });

    describe('view counter (findOne)', () => {
      it('increments view count when cooldown allows', async () => {
        mockRepo.findById.mockResolvedValue(mockListing);
        mockRedis.setNX.mockResolvedValueOnce(true);

        await service.findOne('listing-1', 'viewer-2', '192.168.1.1');

        expect(mockRedis.setNX).toHaveBeenCalledWith('view:LISTING:listing-1:192.168.1.1', '1', 3600);
        expect(mockRepo.incrementViewCount).toHaveBeenCalledWith('listing-1');
      });

      it('does not increment view count when IP is on cooldown', async () => {
        mockRepo.findById.mockResolvedValue(mockListing);
        mockRedis.setNX.mockResolvedValueOnce(false);

        await service.findOne('listing-1', 'viewer-2', '192.168.1.1');

        expect(mockRedis.setNX).toHaveBeenCalledWith('view:LISTING:listing-1:192.168.1.1', '1', 3600);
        expect(mockRepo.incrementViewCount).not.toHaveBeenCalled();
      });

      it('skips view count increment when viewer is owner', async () => {
        mockRepo.findById.mockResolvedValue(mockListing);

        await service.findOne('listing-1', 'seller-1', '192.168.1.1');

        expect(mockRedis.setNX).not.toHaveBeenCalled();
        expect(mockRepo.incrementViewCount).not.toHaveBeenCalled();
      });
    });
  });

  describe('findBySlug', () => {
    describe('visibility gate matrix (findBySlug)', () => {
      const allStatuses: ListingStatus[] = [
        ListingStatus.ACTIVE,
        ListingStatus.SOLD,
        ListingStatus.RENTED,
        ListingStatus.DRAFT,
        ListingStatus.ARCHIVED,
        ListingStatus.SUSPENDED,
      ];

      allStatuses.forEach((status) => {
        const isPublic = ['ACTIVE', 'SOLD', 'RENTED'].includes(status);

        it(`handles anonymous viewer for status=${status}`, async () => {
          mockRepo.findBySlug.mockResolvedValue({ ...mockListing, status });
          if (isPublic) {
            const res = await service.findBySlug('toyota-camry-2024-abc', undefined);
            expect(res).toBeDefined();
          } else {
            await expect(service.findBySlug('toyota-camry-2024-abc', undefined)).rejects.toThrow(NotFoundException);
          }
        });

        it(`handles other viewer for status=${status}`, async () => {
          mockRepo.findBySlug.mockResolvedValue({ ...mockListing, status });
          if (isPublic) {
            const res = await service.findBySlug('toyota-camry-2024-abc', 'other-viewer');
            expect(res).toBeDefined();
          } else {
            await expect(service.findBySlug('toyota-camry-2024-abc', 'other-viewer')).rejects.toThrow(NotFoundException);
          }
        });

        it(`handles owner viewer for status=${status}`, async () => {
          mockRepo.findBySlug.mockResolvedValue({ ...mockListing, status });
          const res = await service.findBySlug('toyota-camry-2024-abc', 'seller-1');
          expect(res).toBeDefined();
        });
      });
    });

    describe('view counter (findBySlug)', () => {
      it('increments view count when cooldown allows', async () => {
        mockRepo.findBySlug.mockResolvedValue(mockListing);
        mockRedis.setNX.mockResolvedValueOnce(true);

        await service.findBySlug('toyota-camry-2024-abc', 'viewer-2', '192.168.1.1');

        expect(mockRedis.setNX).toHaveBeenCalledWith('view:LISTING:listing-1:192.168.1.1', '1', 3600);
        expect(mockRepo.incrementViewCount).toHaveBeenCalledWith('listing-1');
      });

      it('skips view count increment when viewer is owner', async () => {
        mockRepo.findBySlug.mockResolvedValue(mockListing);

        await service.findBySlug('toyota-camry-2024-abc', 'seller-1', '192.168.1.1');

        expect(mockRedis.setNX).not.toHaveBeenCalled();
        expect(mockRepo.incrementViewCount).not.toHaveBeenCalled();
      });
    });
  });

  describe('remove', () => {
    it('should delete the listing if user is the seller', async () => {
      mockRepo.findById.mockResolvedValue(mockListing);

      await service.remove('listing-1', 'seller-1');
      expect(mockRepo.delete).toHaveBeenCalledWith('listing-1');
      expect(mockRedis.delPattern).toHaveBeenCalledWith('listings:*');
      expect(mockRedis.del).toHaveBeenCalledWith('listing:listing-1');
    });

    it('should throw ForbiddenException if user is not the seller', async () => {
      mockRepo.findById.mockResolvedValue(mockListing);

      await expect(service.remove('listing-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update whatsappEnabled to true when passed in update DTO', async () => {
      mockRepo.findById.mockResolvedValueOnce(mockListing);
      mockRepo.update.mockResolvedValueOnce({ ...mockListing, whatsappEnabled: true });

      await service.update('listing-1', { version: 1, whatsappEnabled: true } as any, 'seller-1');

      expect(mockRepo.update).toHaveBeenCalledWith('listing-1', expect.objectContaining({ whatsappEnabled: true }), 1);
    });

    it('should update whatsappEnabled to false when passed in update DTO', async () => {
      mockRepo.findById.mockResolvedValueOnce({ ...mockListing, whatsappEnabled: true });
      mockRepo.update.mockResolvedValueOnce({ ...mockListing, whatsappEnabled: false });

      await service.update('listing-1', { version: 1, whatsappEnabled: false } as any, 'seller-1');

      expect(mockRepo.update).toHaveBeenCalledWith('listing-1', expect.objectContaining({ whatsappEnabled: false }), 1);
    });

    it('should not include whatsappEnabled in update data when omitted in update DTO', async () => {
      mockRepo.findById.mockResolvedValueOnce(mockListing);
      mockRepo.update.mockResolvedValueOnce(mockListing);

      await service.update('listing-1', { version: 1, title: 'عنوان جديد' } as any, 'seller-1');

      const updateData = mockRepo.update.mock.calls[mockRepo.update.mock.calls.length - 1][1];
      expect(updateData).not.toHaveProperty('whatsappEnabled');
    });
  });

  describe('findSimilar', () => {
    it('returns cached results if present in Redis', async () => {
      const cached = [{ id: 'cached-1' }];
      mockRedis.get.mockResolvedValueOnce(cached);

      const res = await service.findSimilar('listing-1', 8);

      expect(res).toBe(cached);
      expect(mockRepo.findById).not.toHaveBeenCalled();
    });

    it('throws NotFoundException if listing does not exist', async () => {
      mockRepo.findById.mockResolvedValueOnce(null);

      await expect(service.findSimilar('non-existent', 8)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for guest/non-owner if original listing is hidden', async () => {
      mockRepo.findById.mockResolvedValueOnce({ ...mockListing, status: 'DRAFT', sellerId: 'seller-1' });

      await expect(service.findSimilar('listing-1', 8, 'guest-viewer')).rejects.toThrow(NotFoundException);
    });

    it('allows owner to see similar listings even if original listing is hidden', async () => {
      mockRepo.findById.mockResolvedValueOnce({ ...mockListing, status: 'DRAFT', sellerId: 'seller-1' });
      mockRepo.findMany.mockResolvedValueOnce([[], 0]);
      mockRepo.findMany.mockResolvedValueOnce([[], 0]);

      const res = await service.findSimilar('listing-1', 8, 'seller-1');

      expect(res).toBeDefined();
    });

    it('queries exact match with ±3 years and ±30% price, excluding original listing', async () => {
      mockRepo.findById.mockResolvedValueOnce({
        ...mockListing,
        id: 'orig-1',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        price: 10000,
        listingType: 'SALE',
      });
      const candidate = {
        id: 'sim-1',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        price: 10500,
        status: 'ACTIVE',
        listingType: 'SALE',
        createdAt: new Date(),
      };
      mockRepo.findMany
        .mockResolvedValueOnce([[candidate], 1])
        .mockResolvedValueOnce([[], 0]);

      const res = await service.findSimilar('orig-1', 8);

      expect(mockRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          id: { not: 'orig-1' },
          status: 'ACTIVE',
          listingType: 'SALE',
          make: { equals: 'Toyota', mode: 'insensitive' },
          model: { equals: 'Camry', mode: 'insensitive' },
          year: { gte: 2019, lte: 2025 },
          price: expect.objectContaining({
            gte: expect.anything(),
            lte: expect.anything(),
          }),
        }),
        { createdAt: 'desc' },
        0,
        24,
      );
      expect(res).toEqual([candidate]);
      expect(mockRedis.set).toHaveBeenCalledWith('listings:similar:orig-1:8', [candidate], 300);
    });

    it('uses dailyPrice for RENTAL listings with ±30% boundary', async () => {
      mockRepo.findById.mockResolvedValueOnce({
        ...mockListing,
        id: 'orig-rent',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        dailyPrice: 50,
        price: 0,
        listingType: 'RENTAL',
      });
      mockRepo.findMany.mockResolvedValueOnce([[], 0]);
      mockRepo.findMany.mockResolvedValueOnce([[], 0]);

      await service.findSimilar('orig-rent', 8);

      const narrowWhere = mockRepo.findMany.mock.calls[0][0];
      expect(narrowWhere).toHaveProperty('dailyPrice');
      expect(narrowWhere).not.toHaveProperty('price');
    });

    it('skips price boundary for listings with zero/null price or WANTED listingType', async () => {
      mockRepo.findById.mockResolvedValueOnce({
        ...mockListing,
        id: 'orig-wanted',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        price: 0,
        dailyPrice: null,
        listingType: 'WANTED',
      });
      mockRepo.findMany.mockResolvedValueOnce([[], 0]);
      mockRepo.findMany.mockResolvedValueOnce([[], 0]);

      await service.findSimilar('orig-wanted', 8);

      const narrowWhere = mockRepo.findMany.mock.calls[0][0];
      expect(narrowWhere).not.toHaveProperty('price');
      expect(narrowWhere).not.toHaveProperty('dailyPrice');
    });

    it('broadens to same make when narrow results are fewer than limit', async () => {
      mockRepo.findById.mockResolvedValueOnce({
        ...mockListing,
        id: 'orig-1',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        price: 10000,
        listingType: 'SALE',
      });
      const narrowItem = {
        id: 'narrow-1',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        price: 10200,
        status: 'ACTIVE',
        listingType: 'SALE',
        createdAt: new Date(),
      };
      const broadItem = {
        id: 'broad-1',
        make: 'Toyota',
        model: 'Corolla',
        year: 2021,
        price: 8500,
        status: 'ACTIVE',
        listingType: 'SALE',
        createdAt: new Date(),
      };
      mockRepo.findMany.mockResolvedValueOnce([[narrowItem], 1]);
      mockRepo.findMany.mockResolvedValueOnce([[broadItem], 1]);

      const res = await service.findSimilar('orig-1', 4);

      expect(mockRepo.findMany).toHaveBeenCalledTimes(2);
      const broaderCall = mockRepo.findMany.mock.calls[1];
      expect(broaderCall[0]).toEqual({
        id: { notIn: ['orig-1', 'narrow-1'] },
        status: 'ACTIVE',
        listingType: 'SALE',
        make: { equals: 'Toyota', mode: 'insensitive' },
      });
      expect(broaderCall[1]).toEqual({ createdAt: 'desc' });
      expect(broaderCall[2]).toBe(0);
      expect(broaderCall[3]).toBe(3); // 4 - 1 = 3
      expect(res).toEqual([narrowItem, broadItem]);
    });

    it('sorts narrow candidates by closest price to reference price', async () => {
      mockRepo.findById.mockResolvedValueOnce({
        ...mockListing,
        id: 'orig-1',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        price: 10000,
        listingType: 'SALE',
      });
      const farItem = {
        id: 'far-1',
        price: 12500, // diff 2500
        createdAt: new Date('2026-01-02'),
      };
      const closeItem = {
        id: 'close-1',
        price: 10200, // diff 200
        createdAt: new Date('2026-01-01'),
      };
      mockRepo.findMany.mockResolvedValueOnce([[farItem, closeItem], 2]);

      const res = await service.findSimilar('orig-1', 2);

      expect(res[0].id).toBe('close-1');
      expect(res[1].id).toBe('far-1');
    });
  });
});

