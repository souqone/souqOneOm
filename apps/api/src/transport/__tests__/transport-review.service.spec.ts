import { Test, TestingModule } from '@nestjs/testing';
import { TransportReviewService } from '../transport-review.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

const mockPrisma = {
  transportBooking: {
    findUnique: jest.fn(),
  },
  review: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  carrierProfile: {
    update: jest.fn(),
  },
};

const mockNotifications = {
  create: jest.fn().mockResolvedValue({}),
};

describe('TransportReviewService', () => {
  let service: TransportReviewService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportReviewService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<TransportReviewService>(TransportReviewService);
  });

  it('should NOT query raw User credentials when finding booking for review', async () => {
    mockPrisma.transportBooking.findUnique.mockResolvedValue({
      id: 'book-1',
      status: 'COMPLETED',
      request: { userId: 'user-client' },
      quote: {
        carrierId: 'carrier-1',
        carrier: {
          id: 'carrier-1',
          userId: 'user-carrier',
          user: { id: 'user-carrier', displayName: 'Carrier Driver' },
        },
      },
    });
    mockPrisma.review.findUnique.mockResolvedValue(null);
    mockPrisma.review.create.mockResolvedValue({ id: 'rev-1', rating: 5 });
    mockPrisma.review.findMany.mockResolvedValue([{ rating: 5 }]);
    mockPrisma.carrierProfile.update.mockResolvedValue({});

    await service.createReview('book-1', 'user-client', 5, 'Great trip');

    expect(mockPrisma.transportBooking.findUnique).toHaveBeenCalled();
    const callArgs = mockPrisma.transportBooking.findUnique.mock.calls[0][0];

    // Verify quote.carrier does NOT do { user: true }
    const carrierInclude = callArgs.include?.quote?.include?.carrier;
    expect(carrierInclude?.include?.user).not.toBe(true);

    const userSelect = carrierInclude?.select?.user?.select || carrierInclude?.include?.user?.select;
    expect(userSelect).toBeDefined();
    expect(userSelect.passwordHash).toBeUndefined();
    expect(userSelect.tokenVersion).toBeUndefined();
    expect(userSelect.phone).toBeUndefined();
  });

  describe('getBookingReview', () => {
    it('should throw NotFoundException (404) if booking does not exist', async () => {
      mockPrisma.transportBooking.findUnique.mockResolvedValue(null);

      await expect(service.getBookingReview('non-existent-booking', 'user-123')).rejects.toThrow(
        'الحجز غير موجود',
      );
    });

    it('should throw NotFoundException (404) if user is not a party (not customer and not carrier)', async () => {
      mockPrisma.transportBooking.findUnique.mockResolvedValue({
        id: 'book-1',
        request: { userId: 'customer-1' },
        quote: {
          carrier: { userId: 'carrier-1' },
        },
      });

      await expect(service.getBookingReview('book-1', 'intruder-user')).rejects.toThrow(
        'الحجز غير موجود',
      );
    });

    it('should throw NotFoundException (404) for booking without carrier when user is not customer (حجز بدون ناقل)', async () => {
      mockPrisma.transportBooking.findUnique.mockResolvedValue({
        id: 'book-no-carrier',
        request: { userId: 'customer-1' },
        quote: null, // No quote or no carrier assigned yet
      });

      await expect(service.getBookingReview('book-no-carrier', 'some-other-user')).rejects.toThrow(
        'الحجز غير موجود',
      );
    });

    it('should return review when user is customer (صاحب الحجز)', async () => {
      mockPrisma.transportBooking.findUnique.mockResolvedValue({
        id: 'book-1',
        request: { userId: 'customer-1' },
        quote: { carrier: { userId: 'carrier-1' } },
      });
      const expectedReview = { id: 'rev-1', rating: 5, comment: 'ممتاز', entityId: 'book-1' };
      mockPrisma.review.findFirst.mockResolvedValue(expectedReview);

      const result = await service.getBookingReview('book-1', 'customer-1');
      expect(result).toEqual(expectedReview);
      expect(mockPrisma.review.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityId: 'book-1' }),
        }),
      );
    });

    it('should return review when user is carrier (الناقل)', async () => {
      mockPrisma.transportBooking.findUnique.mockResolvedValue({
        id: 'book-1',
        request: { userId: 'customer-1' },
        quote: { carrier: { userId: 'carrier-1' } },
      });
      const expectedReview = { id: 'rev-1', rating: 4, comment: 'جيد', entityId: 'book-1' };
      mockPrisma.review.findFirst.mockResolvedValue(expectedReview);

      const result = await service.getBookingReview('book-1', 'carrier-1');
      expect(result).toEqual(expectedReview);
    });
  });
});
