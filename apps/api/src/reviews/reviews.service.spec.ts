import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: any;
  let notifications: any;

  const mockPrisma = {
    conversation: {
      findFirst: jest.fn(),
    },
    jobApplication: {
      findFirst: jest.fn(),
    },
    operatorListing: {
      findUnique: jest.fn(),
    },
    review: {
      create: jest.fn(),
      aggregate: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    driverProfile: {
      update: jest.fn(),
    },
    employerProfile: {
      update: jest.fn(),
    },
    carrierProfile: {
      update: jest.fn(),
    },
  };

  const mockNotifications = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    prisma = module.get<PrismaService>(PrismaService);
    notifications = module.get<NotificationsService>(NotificationsService);
  });

  describe('Self Review Validation', () => {
    it('should throw BadRequestException when user attempts to review themselves (OPERATOR_LISTING)', async () => {
      mockPrisma.operatorListing.findUnique.mockResolvedValue({ userId: 'user-1' });
      await expect(
        service.create(
          {
            rating: 5,
            comment: 'رائع جداً',
            entityType: ENTITY_TYPES.OPERATOR_LISTING,
            entityId: 'operator-1',
            revieweeId: 'user-1',
          },
          'user-1',
        ),
      ).rejects.toThrow(new BadRequestException('لا يمكنك تقييم نفسك'));
    });

    it('should throw BadRequestException when user attempts to review themselves on other entity types', async () => {
      await expect(
        service.create(
          {
            rating: 5,
            comment: 'رائع جداً',
            entityType: ENTITY_TYPES.LISTING,
            entityId: 'listing-1',
            revieweeId: 'user-1',
          },
          'user-1',
        ),
      ).rejects.toThrow(new BadRequestException('لا يمكنك تقييم نفسك'));
    });
  });

  describe('validateOperatorReview()', () => {
    const validDto = {
      rating: 5,
      comment: 'مشغل ممتاز ومحترف',
      entityType: ENTITY_TYPES.OPERATOR_LISTING,
      entityId: 'operator-101',
      revieweeId: 'operator-owner-id',
    };
    const reviewerId = 'reviewer-user-id';

    beforeEach(() => {
      mockPrisma.operatorListing.findUnique.mockResolvedValue({ userId: 'operator-owner-id' });
    });

    it('should throw BadRequestException when NO conversation exists between reviewer and operator', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValue(null);

      await expect(service.create(validDto, reviewerId)).rejects.toThrow(
        new BadRequestException('يمكنك فقط تقييم المشغل بعد التواصل معه عبر الرسائل أولاً'),
      );

      expect(mockPrisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          entityType: ENTITY_TYPES.OPERATOR_LISTING,
          entityId: 'operator-101',
          participants: { some: { userId: reviewerId } },
          messages: { some: { senderId: reviewerId } },
        },
      });
      expect(mockPrisma.review.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when conversation exists but reviewer sent ZERO messages', async () => {
      // Prisma findFirst returns null because messages: { some: { senderId: reviewerId } } is not satisfied
      mockPrisma.conversation.findFirst.mockResolvedValue(null);

      await expect(service.create(validDto, reviewerId)).rejects.toThrow(
        new BadRequestException('يمكنك فقط تقييم المشغل بعد التواصل معه عبر الرسائل أولاً'),
      );

      expect(mockPrisma.review.create).not.toHaveBeenCalled();
    });

    it('should create review successfully when conversation exists AND reviewer sent a message', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValue({
        id: 'conv-123',
        entityType: ENTITY_TYPES.OPERATOR_LISTING,
        entityId: 'operator-101',
      });

      const fakeCreatedReview = {
        id: 'review-1',
        rating: 5,
        comment: 'مشغل ممتاز ومحترف',
        entityType: ENTITY_TYPES.OPERATOR_LISTING,
        entityId: 'operator-101',
        reviewerId,
        revieweeId: 'operator-owner-id',
        reviewer: { id: reviewerId, username: 'testuser' },
      };
      mockPrisma.review.create.mockResolvedValue(fakeCreatedReview);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 5 },
        _count: 1,
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockNotifications.create.mockResolvedValue({});

      const result = await service.create(validDto, reviewerId);

      expect(result).toEqual(fakeCreatedReview);
      expect(mockPrisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          entityType: ENTITY_TYPES.OPERATOR_LISTING,
          entityId: 'operator-101',
          participants: { some: { userId: reviewerId } },
          messages: { some: { senderId: reviewerId } },
        },
      });
      expect(mockPrisma.review.create).toHaveBeenCalledWith({
        data: {
          rating: 5,
          comment: 'مشغل ممتاز ومحترف',
          entityType: ENTITY_TYPES.OPERATOR_LISTING,
          entityId: 'operator-101',
          reviewerId,
          revieweeId: 'operator-owner-id',
        },
        include: {
          reviewer: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'operator-owner-id' },
        data: { averageRating: 5, reviewCount: 1 },
      });
      expect(mockNotifications.create).toHaveBeenCalled();
    });
  });

  describe('Server-Derived Review Target for OPERATOR_LISTING (D-220)', () => {
    const reviewerId = 'reviewer-user-id';
    const realOwnerId = 'real-operator-owner';

    beforeEach(() => {
      mockPrisma.operatorListing.findUnique.mockResolvedValue({ userId: realOwnerId });
      mockPrisma.conversation.findFirst.mockResolvedValue({ id: 'conv-1' });
      mockPrisma.review.create.mockResolvedValue({ id: 'rev-1', revieweeId: realOwnerId });
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 5 }, _count: 1 });
      mockPrisma.user.update.mockResolvedValue({});
      mockNotifications.create.mockResolvedValue({});
    });

    it('(a) should derive revieweeId from operator listing and IGNORE tampered client revieweeId', async () => {
      await service.create(
        {
          rating: 5,
          comment: 'مشغل ممتاز',
          entityType: ENTITY_TYPES.OPERATOR_LISTING,
          entityId: 'operator-101',
          revieweeId: 'attacker-tampered-id',
        },
        reviewerId,
      );

      // (1) Listing was fetched by entityId
      expect(mockPrisma.operatorListing.findUnique).toHaveBeenCalledWith({
        where: { id: 'operator-101' },
        select: { userId: true },
      });

      // (2) Review was created with the REAL owner
      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            revieweeId: realOwnerId,
          }),
        }),
      );

      // (3) User aggregate rating was recalculated for the REAL owner
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: realOwnerId },
        data: { averageRating: 5, reviewCount: 1 },
      });

      // (4) Notification was sent to the REAL owner
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: realOwnerId,
        }),
      );
    });

    it('(b) old client sending the correct revieweeId still works', async () => {
      await service.create(
        {
          rating: 5,
          comment: 'مشغل ممتاز',
          entityType: ENTITY_TYPES.OPERATOR_LISTING,
          entityId: 'operator-101',
          revieweeId: realOwnerId,
        },
        reviewerId,
      );

      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ revieweeId: realOwnerId }),
        }),
      );
    });

    it('(c) client omitting revieweeId entirely works for OPERATOR_LISTING', async () => {
      await service.create(
        {
          rating: 5,
          comment: 'مشغل ممتاز',
          entityType: ENTITY_TYPES.OPERATOR_LISTING,
          entityId: 'operator-101',
        },
        reviewerId,
      );

      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ revieweeId: realOwnerId }),
        }),
      );
    });

    it('(d) self-review: reviewer == operatorListing.userId throws 400', async () => {
      await expect(
        service.create(
          {
            rating: 5,
            comment: 'مشغل ممتاز',
            entityType: ENTITY_TYPES.OPERATOR_LISTING,
            entityId: 'operator-101',
            revieweeId: 'someone-else', // even if client tries to bypass
          },
          realOwnerId, // reviewer is the actual owner
        ),
      ).rejects.toThrow(new BadRequestException('لا يمكنك تقييم نفسك'));
    });

    it('(e) missing listing throws 404 NotFoundException', async () => {
      mockPrisma.operatorListing.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            rating: 5,
            comment: 'مشغل ممتاز',
            entityType: ENTITY_TYPES.OPERATOR_LISTING,
            entityId: 'non-existent-operator',
          },
          reviewerId,
        ),
      ).rejects.toThrow(new NotFoundException('إعلان المشغل غير موجود'));
    });

    it('(f) other entity types: omitting revieweeId throws BadRequestException', async () => {
      await expect(
        service.create(
          {
            rating: 5,
            comment: 'إعلان ممتاز',
            entityType: ENTITY_TYPES.LISTING,
            entityId: 'listing-101',
          },
          reviewerId,
        ),
      ).rejects.toThrow(new BadRequestException('معرف المستخدم المقيم مطلوب'));
    });
  });

  describe('validateJobReview() regression', () => {
    it('should reject DRIVER_PROFILE review if no ACCEPTED application exists', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          {
            rating: 4,
            entityType: ENTITY_TYPES.DRIVER_PROFILE,
            entityId: 'driver-prof-1',
            revieweeId: 'driver-user-id',
          },
          'employer-user-id',
        ),
      ).rejects.toThrow(new BadRequestException('لا يمكنك تقييم إلا بعد قبول طلب التوظيف'));
    });

    it('should accept DRIVER_PROFILE review if ACCEPTED application exists', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue({ id: 'app-1', status: 'ACCEPTED' });
      mockPrisma.review.create.mockResolvedValue({ id: 'rev-driver' });
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4 }, _count: 1 });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.driverProfile.update.mockResolvedValue({});
      mockNotifications.create.mockResolvedValue({});

      const result = await service.create(
        {
          rating: 4,
          entityType: ENTITY_TYPES.DRIVER_PROFILE,
          entityId: 'driver-prof-1',
          revieweeId: 'driver-user-id',
        },
        'employer-user-id',
      );

      expect(result).toEqual({ id: 'rev-driver' });
      expect(mockPrisma.driverProfile.update).toHaveBeenCalled();
    });
  });

  describe('CARRIER_PROFILE review validation', () => {
    it('should reject direct CARRIER_PROFILE review with instruction to use booking review endpoint', async () => {
      await expect(
        service.create(
          {
            rating: 5,
            entityType: ENTITY_TYPES.CARRIER_PROFILE,
            entityId: 'carrier-prof-1',
            revieweeId: 'carrier-user-id',
          },
          'shipper-user-id',
        ),
      ).rejects.toThrow(
        new BadRequestException('يجب تقييم الناقل من خلال صفحة الحجز (POST /transport/bookings/:id/review)'),
      );
    });
  });
});
