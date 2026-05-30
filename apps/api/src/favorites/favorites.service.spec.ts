import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const mockPrisma = {
  listing: { findUnique: jest.fn() },
  driverJob: { findUnique: jest.fn() },
  sparePart: { findUnique: jest.fn() },
  carService: { findUnique: jest.fn() },
  favorite: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  notification: { create: jest.fn() },
  $transaction: jest.fn(),
};

const mockNotifications = {
  create: jest.fn().mockResolvedValue({}),
};

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  describe('toggle', () => {
    it('should add to favorites if not already favorited', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', title: 'Car' });
      mockPrisma.favorite.findUnique.mockResolvedValue(null);
      mockPrisma.favorite.create.mockResolvedValue({});

      const result = await service.toggle('LISTING', 'listing-1', 'user-1');
      expect(result.favorited).toBe(true);
      expect(mockPrisma.favorite.create).toHaveBeenCalledTimes(1);
    });

    it('should remove from favorites if already favorited', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', title: 'Car' });
      mockPrisma.favorite.findUnique.mockResolvedValue({ id: 'fav-1' });
      mockPrisma.favorite.delete.mockResolvedValue({});

      const result = await service.toggle('LISTING', 'listing-1', 'user-1');
      expect(result.favorited).toBe(false);
      expect(mockPrisma.favorite.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw if entity not found', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);

      await expect(service.toggle('LISTING', 'nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkFavorite', () => {
    it('should return true if favorited', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue({ id: 'fav-1' });

      const result = await service.checkFavorite('LISTING', 'listing-1', 'user-1');
      expect(result.favorited).toBe(true);
    });

    it('should return false if not favorited', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue(null);

      const result = await service.checkFavorite('LISTING', 'listing-1', 'user-1');
      expect(result.favorited).toBe(false);
    });
  });

  describe('getUserFavorites', () => {
    it('should return paginated favorites', async () => {
      const mockItems = [{
        id: 'fav-1',
        entityType: 'LISTING',
        entityId: 'listing-1',
        createdAt: new Date(),
        listing: { id: 'listing-1', title: 'Car', images: [{ url: 'img.jpg' }], seller: { id: 's1', username: 'test', displayName: 'Test', avatarUrl: null } },
      }];
      mockPrisma.$transaction.mockResolvedValue([mockItems, 1]);

      const result = await service.getUserFavorites('user-1', undefined, 1, 10);
      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
