import { NotFoundException } from '@nestjs/common';
import { UploadImageManagerService } from '../uploads/upload-image-manager.service';
import { PaymentActivationService } from '../payments/payment-activation.service';
import { FavoritesService } from '../favorites/favorites.service';

describe('Buses Soft-Delete Gaps Enforcement (Task D-046)', () => {
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      busListing: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      favorite: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };
  });

  describe('UploadImageManagerService.addImageToBus', () => {
    it('throws 404 when bus listing is soft-deleted (findFirst returns null for deletedAt: null)', async () => {
      const service = new UploadImageManagerService(prismaMock as any);
      prismaMock.busListing.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.addImageToBus('bus-1', 'user-1', 'https://cdn.example.com/bus.jpg', false),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.busListing.findFirst).toHaveBeenCalledWith({
        where: { id: 'bus-1', deletedAt: null },
      });
    });
  });

  describe('PaymentActivationService.activateFeatured', () => {
    it('applies updateMany with deletedAt: null to avoid activating soft-deleted buses', async () => {
      const service = new PaymentActivationService(
        prismaMock as any,
        { create: jest.fn() } as any,
      );
      prismaMock.busListing.updateMany.mockResolvedValueOnce({ count: 0 });

      await service.activateFeatured('BUS_LISTING', 'bus-1');

      expect(prismaMock.busListing.updateMany).toHaveBeenCalledWith({
        where: { id: 'bus-1', deletedAt: null },
        data: expect.objectContaining({ isPremium: true }),
      });
    });
  });

  describe('FavoritesService', () => {
    it('skips soft-deleted bus listings during toggle/resolution (throws 404 for missing/deleted entity)', async () => {
      const service = new FavoritesService(
        prismaMock as any,
        { create: jest.fn() } as any,
      );
      prismaMock.busListing.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.toggle('BUS_LISTING', 'bus-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.busListing.findFirst).toHaveBeenCalledWith({
        where: { id: 'bus-1', deletedAt: null },
        select: { title: true },
      });
    });
  });
});
