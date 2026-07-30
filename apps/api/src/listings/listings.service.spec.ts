import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ListingsService } from './listings.service';
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
    findMany: jest.fn().mockResolvedValue([mockListing]),
    count: jest.fn().mockResolvedValue(1),
    update: jest.fn(),
    delete: jest.fn(),
  },
  cleanupPolymorphicOrphans: jest.fn().mockResolvedValue(undefined),
  $transaction: jest.fn().mockImplementation((args) => Promise.all(args)),
};

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  delPattern: jest.fn().mockResolvedValue(undefined),
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
          make: 'Toyota',
          model: 'Camry',
          year: 2024,
          price: 12000,
        } as any,
        'seller-1',
      );

      expect(result).toBeDefined();
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
      expect(mockRedis.delPattern).toHaveBeenCalledWith('listings:*');
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
});
