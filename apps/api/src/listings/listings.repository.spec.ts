import { Test, TestingModule } from '@nestjs/testing';
import { ListingsRepository } from './listings.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('ListingsRepository', () => {
  let repository: ListingsRepository;

  const mockPrisma = {
    listing: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    outboxEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<ListingsRepository>(ListingsRepository);
  });

  const expectedImageOrderBy = [{ order: 'asc' }, { createdAt: 'asc' }];

  describe('findById', () => {
    it('should include images ordered by order then createdAt', async () => {
      mockPrisma.listing.findUnique.mockResolvedValueOnce({ id: 'listing-1' });

      await repository.findById('listing-1');

      expect(mockPrisma.listing.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'listing-1' },
          include: expect.objectContaining({
            images: { orderBy: expectedImageOrderBy },
          }),
        }),
      );
    });
  });

  describe('findBySlug', () => {
    it('should include images ordered by order then createdAt', async () => {
      mockPrisma.listing.findUnique.mockResolvedValueOnce({ id: 'listing-1', slug: 'car-slug' });

      await repository.findBySlug('car-slug');

      expect(mockPrisma.listing.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'car-slug' },
          include: expect.objectContaining({
            images: { orderBy: expectedImageOrderBy },
          }),
        }),
      );
    });
  });

  describe('findMany', () => {
    it('should include images ordered by order then createdAt in $transaction', async () => {
      mockPrisma.$transaction.mockResolvedValueOnce([[{ id: 'listing-1' }], 1]);

      await repository.findMany({}, { createdAt: 'desc' }, 0, 20);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            images: { orderBy: expectedImageOrderBy },
          }),
        }),
      );
    });
  });
});
