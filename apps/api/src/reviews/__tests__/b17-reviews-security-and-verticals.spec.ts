import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { ReviewsService, LISTING_REVIEW_ENTITY_TYPES } from '../reviews.service';
import { CreateReviewDto, REVIEW_ENTITY_TYPES } from '../dto/create-review.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ENTITY_TYPES } from '../../common/constants/entity-types.constants';

describe('D-B17 Requirement 4: Server-derived reviewee + contact eligibility across all 6 listing types', () => {
  let service: ReviewsService;
  let prismaMock: any;
  let notificationsMock: any;
  let pipe: ValidationPipe;

  const realOwnerId = 'real-listing-owner';
  const reviewerId = 'contacted-buyer';

  beforeEach(async () => {
    pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    prismaMock = {
      listing: { findUnique: jest.fn().mockResolvedValue({ sellerId: realOwnerId }) },
      busListing: { findUnique: jest.fn().mockResolvedValue({ userId: realOwnerId, deletedAt: null }) },
      equipmentListing: { findUnique: jest.fn().mockResolvedValue({ userId: realOwnerId, deletedAt: null }) },
      operatorListing: { findUnique: jest.fn().mockResolvedValue({ userId: realOwnerId }) },
      sparePart: { findUnique: jest.fn().mockResolvedValue({ sellerId: realOwnerId, deletedAt: null }) },
      carService: { findUnique: jest.fn().mockResolvedValue({ userId: realOwnerId, deletedAt: null }) },
      conversation: { findFirst: jest.fn().mockResolvedValue({ id: 'conv-1' }) },
      jobApplication: { findFirst: jest.fn() },
      review: {
        create: jest.fn().mockImplementation(async ({ data }: any) => ({ id: 'rev-new', ...data })),
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 5 }, _count: 1 }),
      },
      user: { update: jest.fn().mockResolvedValue({}) },
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

  describe('CreateReviewDto validation under forbidNonWhitelisted: true', () => {
    it('accepts SPARE_PART and CAR_SERVICE in entityType', async () => {
      for (const entityType of [ENTITY_TYPES.SPARE_PART, ENTITY_TYPES.CAR_SERVICE]) {
        const dto = await pipe.transform(
          { rating: 5, comment: 'ممتاز', entityType, entityId: 'item-1' },
          { type: 'body', metatype: CreateReviewDto },
        );
        expect(dto.entityType).toBe(entityType);
      }
    });

    it('accepts USER (seller-level) in CreateReviewDto (added in D-B18) and rejects unknown entityType', async () => {
      expect(REVIEW_ENTITY_TYPES).toContain(ENTITY_TYPES.USER);
      const dto = await pipe.transform(
        { rating: 5, entityType: ENTITY_TYPES.USER, entityId: 'user-1' },
        { type: 'body', metatype: CreateReviewDto },
      );
      expect(dto.entityType).toBe(ENTITY_TYPES.USER);

      await expect(
        pipe.transform(
          { rating: 5, entityType: 'INVALID_TYPE', entityId: 'user-1' },
          { type: 'body', metatype: CreateReviewDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('All 6 listing types: server-derived revieweeId + shared contact eligibility', () => {
    const listingCases: Array<{
      entityType: string;
      delegateName: string;
      ownerKey: 'sellerId' | 'userId';
      hasSoftDelete: boolean;
    }> = [
      { entityType: ENTITY_TYPES.LISTING, delegateName: 'listing', ownerKey: 'sellerId', hasSoftDelete: false },
      { entityType: ENTITY_TYPES.BUS_LISTING, delegateName: 'busListing', ownerKey: 'userId', hasSoftDelete: true },
      { entityType: ENTITY_TYPES.EQUIPMENT_LISTING, delegateName: 'equipmentListing', ownerKey: 'userId', hasSoftDelete: true },
      { entityType: ENTITY_TYPES.OPERATOR_LISTING, delegateName: 'operatorListing', ownerKey: 'userId', hasSoftDelete: false },
      { entityType: ENTITY_TYPES.SPARE_PART, delegateName: 'sparePart', ownerKey: 'sellerId', hasSoftDelete: true },
      { entityType: ENTITY_TYPES.CAR_SERVICE, delegateName: 'carService', ownerKey: 'userId', hasSoftDelete: true },
    ];

    it('LISTING_REVIEW_ENTITY_TYPES covers all 6 listing verticals', () => {
      expect(Array.from(LISTING_REVIEW_ENTITY_TYPES).sort()).toEqual(
        listingCases.map((c) => c.entityType).sort(),
      );
    });

    it.each(listingCases)(
      '$entityType: derives revieweeId from entity owner on server and ignores tampered client revieweeId',
      async ({ entityType, delegateName }) => {
        const res = await service.create(
          {
            rating: 5,
            comment: 'تعامل راقٍ',
            entityType,
            entityId: 'ent-1',
            revieweeId: 'spoofed-victim-user-id',
          },
          reviewerId,
        );

        expect(prismaMock[delegateName].findUnique).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: 'ent-1' } }),
        );
        expect(res.revieweeId).toBe(realOwnerId);
        expect(prismaMock.user.update).toHaveBeenCalledWith({
          where: { id: realOwnerId },
          data: { averageRating: 5, reviewCount: 1 },
        });
        expect(notificationsMock.create).toHaveBeenCalledWith(
          expect.objectContaining({ userId: realOwnerId }),
        );
      },
    );

    it.each(listingCases)(
      '$entityType: rejects review when reviewer has no conversation with a sent message about that listing',
      async ({ entityType }) => {
        prismaMock.conversation.findFirst.mockResolvedValueOnce(null);

        await expect(
          service.create(
            {
              rating: 4,
              entityType,
              entityId: 'ent-1',
            },
            reviewerId,
          ),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.conversation.findFirst).toHaveBeenCalledWith({
          where: {
            entityType,
            entityId: 'ent-1',
            participants: { some: { userId: reviewerId } },
            messages: { some: { senderId: reviewerId } },
          },
        });
        expect(prismaMock.review.create).not.toHaveBeenCalled();
      },
    );

    it.each(listingCases)(
      '$entityType: prevents owner from reviewing their own listing even if client spoofs revieweeId',
      async ({ entityType }) => {
        await expect(
          service.create(
            {
              rating: 5,
              entityType,
              entityId: 'ent-1',
              revieweeId: 'other-user-id',
            },
            realOwnerId,
          ),
        ).rejects.toThrow(new BadRequestException('لا يمكنك تقييم نفسك'));
        expect(prismaMock.review.create).not.toHaveBeenCalled();
      },
    );

    it.each(listingCases)(
      '$entityType: throws 404 NotFoundException when listing does not exist (or is soft-deleted)',
      async ({ entityType, delegateName, hasSoftDelete, ownerKey }) => {
        prismaMock[delegateName].findUnique.mockResolvedValueOnce(null);
        await expect(
          service.create({ rating: 5, entityType, entityId: 'missing-id' }, reviewerId),
        ).rejects.toThrow(NotFoundException);

        if (hasSoftDelete) {
          prismaMock[delegateName].findUnique.mockResolvedValueOnce({
            [ownerKey]: realOwnerId,
            deletedAt: new Date(),
          });
          await expect(
            service.create({ rating: 5, entityType, entityId: 'deleted-id' }, reviewerId),
          ).rejects.toThrow(NotFoundException);
        }
      },
    );
  });
});
