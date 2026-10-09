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
});
