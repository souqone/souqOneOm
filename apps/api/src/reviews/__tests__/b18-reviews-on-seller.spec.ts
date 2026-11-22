import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Prisma, ReviewEntityType } from '@prisma/client';
import { ReviewsService, CONTACT_ELIGIBLE_REVIEW_ENTITY_TYPES } from '../reviews.service';
import { CreateReviewDto, REVIEW_ENTITY_TYPES } from '../dto/create-review.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ENTITY_TYPES } from '../../common/constants/entity-types.constants';
import { USER_SELECT_PROFILE_PUBLIC } from '../../common/constants/user-select.constant';

describe('D-B18: Reviews on Seller (entityType = USER)', () => {
  let service: ReviewsService;
  let prismaMock: any;
  let notificationsMock: any;
  let pipe: ValidationPipe;

  const sellerId = 'seller-user-1';
  const buyerId = 'buyer-user-2';

  beforeEach(async () => {
    pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: sellerId,
          averageRating: 4.5,
          reviewCount: 2,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      conversation: {
        findFirst: jest.fn().mockResolvedValue({ id: 'conv-any-listing' }),
      },
      review: {
        create: jest.fn().mockImplementation(async ({ data }: any) => ({
          id: 'rev-user-1',
          ...data,
          reviewer: { id: buyerId, username: 'buyer', displayName: 'Buyer', avatarUrl: null, isVerified: true },
        })),
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 4.5 }, _count: 2 }),
        groupBy: jest.fn().mockResolvedValue([
          { rating: 5, _count: 1 },
          { rating: 4, _count: 1 },
        ]),
      },
    };

    notificationsMock = { create: jest.fn().mockResolvedValue({}) };

    const mod = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: notificationsMock },
      ],
    }).compile();

    service = mod.get(ReviewsService);
  });

  describe('1. Single source of truth (Enum, ENTITY_TYPES, DTO, Public Profile)', () => {
    it('includes USER in ENTITY_TYPES, ReviewEntityType, REVIEW_ENTITY_TYPES, and CONTACT_ELIGIBLE_REVIEW_ENTITY_TYPES', () => {
      expect(ENTITY_TYPES.USER).toBe('USER');
      expect(ReviewEntityType.USER).toBe('USER');
      expect(REVIEW_ENTITY_TYPES).toContain(ENTITY_TYPES.USER);
      expect(CONTACT_ELIGIBLE_REVIEW_ENTITY_TYPES.has(ENTITY_TYPES.USER)).toBe(true);
    });

    it('CreateReviewDto accepts entityType USER under forbidNonWhitelisted: true', async () => {
      const dto = await pipe.transform(
        { rating: 5, comment: 'بائع ممتاز', entityType: ENTITY_TYPES.USER, entityId: sellerId },
        { type: 'body', metatype: CreateReviewDto },
      );
      expect(dto.entityType).toBe(ENTITY_TYPES.USER);
      expect(dto.entityId).toBe(sellerId);
    });

    it('USER_SELECT_PROFILE_PUBLIC exposes averageRating and reviewCount for GET /users/:id', () => {
      expect(USER_SELECT_PROFILE_PUBLIC.averageRating).toBe(true);
      expect(USER_SELECT_PROFILE_PUBLIC.reviewCount).toBe(true);
    });
  });

  describe('2. USER review creation, security, and eligibility', () => {
    it('happy path: creates USER review, recalculates User.averageRating/reviewCount, notifies seller, and getSummary reflects it', async () => {
      const created = await service.create(
        {
          rating: 5,
          comment: 'تعامل ممتاز وسريع',
          entityType: ENTITY_TYPES.USER,
          entityId: sellerId,
        },
        buyerId,
      );

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: sellerId },
        select: { id: true },
      });
      expect(prismaMock.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          AND: [
            { participants: { some: { userId: buyerId } } },
            { participants: { some: { userId: sellerId } } },
          ],
          messages: { some: { senderId: buyerId } },
        },
      });
      expect(created.entityType).toBe(ENTITY_TYPES.USER);
      expect(created.entityId).toBe(sellerId);
      expect(created.revieweeId).toBe(sellerId);
      expect(created.reviewerId).toBe(buyerId);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: sellerId },
        data: { averageRating: 4.5, reviewCount: 2 },
      });
      expect(notificationsMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'REVIEW_RECEIVED',
          userId: sellerId,
          data: { reviewId: 'rev-user-1', entityType: ENTITY_TYPES.USER, entityId: sellerId },
        }),
      );

      const summary = await service.getSummary(sellerId);
      expect(summary).toEqual({
        averageRating: 4.5,
        reviewCount: 2,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
      });
    });

    it('ignores client-supplied revieweeId and derives revieweeId strictly from entityId on server', async () => {
      const created = await service.create(
        {
          rating: 4,
          comment: 'جيد',
          entityType: ENTITY_TYPES.USER,
          entityId: sellerId,
          revieweeId: 'spoofed-victim-id',
        },
        buyerId,
      );

      expect(created.revieweeId).toBe(sellerId);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: sellerId },
        data: { averageRating: 4.5, reviewCount: 2 },
      });
      expect(notificationsMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: sellerId }),
      );
    });

    it('rejects self-review when buyer attempts to rate themselves (even with spoofed revieweeId)', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: sellerId });

      await expect(
        service.create(
          {
            rating: 5,
            entityType: ENTITY_TYPES.USER,
            entityId: sellerId,
            revieweeId: 'someone-else',
          },
          sellerId,
        ),
      ).rejects.toThrow(new BadRequestException('لا يمكنك تقييم نفسك'));

      expect(prismaMock.conversation.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.review.create).not.toHaveBeenCalled();
    });

    it('throws 404 NotFoundException when target seller user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create(
          {
            rating: 5,
            entityType: ENTITY_TYPES.USER,
            entityId: 'non-existent-user',
          },
          buyerId,
        ),
      ).rejects.toThrow(new NotFoundException('المستخدم غير موجود'));

      expect(prismaMock.review.create).not.toHaveBeenCalled();
    });

    it('throws 400 BadRequestException when buyer has no conversation with a sent message to the seller', async () => {
      prismaMock.conversation.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.create(
          {
            rating: 5,
            entityType: ENTITY_TYPES.USER,
            entityId: sellerId,
          },
          buyerId,
        ),
      ).rejects.toThrow(new BadRequestException('يمكنك فقط تقييم البائع بعد التواصل معه عبر الرسائل أولاً'));

      expect(prismaMock.review.create).not.toHaveBeenCalled();
    });

    it('enforces one review per buyer per seller: duplicate Prisma P2002 returns existing 400 message', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prismaMock.review.create.mockRejectedValueOnce(p2002);

      await expect(
        service.create(
          {
            rating: 5,
            entityType: ENTITY_TYPES.USER,
            entityId: sellerId,
          },
          buyerId,
        ),
      ).rejects.toThrow(new BadRequestException('لقد قمت بتقييم هذا العنصر مسبقاً'));
    });
  });
});
