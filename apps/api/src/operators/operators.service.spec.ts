import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OperatorDeletionStatus, NotificationType } from '@prisma/client';
import { OperatorsService } from './operators.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../locations/geo.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';

describe('OperatorsService', () => {
  let service: OperatorsService;
  let prisma: any;
  let geoService: any;
  let notificationsService: any;

  beforeEach(async () => {
    prisma = {
      operatorListing: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn(),
      },
      operatorDeletionRequest: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      outboxEvent: {
        create: jest.fn(),
      },
      cleanupPolymorphicOrphans: jest.fn().mockResolvedValue(undefined),
      $transaction: jest.fn((callbackOrArray) => {
        if (typeof callbackOrArray === 'function') {
          return callbackOrArray(prisma);
        }
        return Promise.all(callbackOrArray);
      }),
    };

    geoService = {
      validateLocationPair: jest.fn().mockResolvedValue(true),
      syncLocation: jest.fn().mockResolvedValue(undefined),
      clearLocation: jest.fn().mockResolvedValue(undefined),
    };

    notificationsService = {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatorsService,
        { provide: PrismaService, useValue: prisma },
        { provide: GeoService, useValue: geoService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<OperatorsService>(OperatorsService);
  });

  describe('create', () => {
    it('should throw ConflictException if user already has an operator profile', async () => {
      prisma.operatorListing.findFirst.mockResolvedValue({ id: 'op-1', userId: 'user-1' });

      await expect(
        service.create({ title: 'Title', description: 'Desc', operatorType: 'DRIVER' } as any, 'user-1'),
      ).rejects.toThrow(ConflictException);
      expect(prisma.operatorListing.findFirst).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });

    it('should create operator profile if user has none', async () => {
      prisma.operatorListing.findFirst.mockResolvedValue(null);
      prisma.operatorListing.create.mockResolvedValue({
        id: 'op-new',
        title: 'Title',
        profileImageUrl: 'https://example.com/pic.jpg',
      });

      const res = await service.create(
        {
          title: 'Title',
          description: 'Desc',
          operatorType: 'DRIVER',
          governorateId: 1,
          wilayaId: 101,
          profileImageUrl: 'https://example.com/pic.jpg',
        } as any,
        'user-1',
      );

      expect(res.id).toBe('op-new');
      expect(prisma.outboxEvent.create).toHaveBeenCalledWith({
        data: {
          entityType: ENTITY_TYPES.OPERATOR_LISTING,
          entityId: 'op-new',
          action: 'UPSERT',
        },
      });
    });

    it('should throw ConflictException if previous deletion was approved less than 72h ago', async () => {
      prisma.operatorListing.findFirst.mockResolvedValue(null);
      prisma.operatorDeletionRequest.findFirst.mockResolvedValue({
        id: 'req-old',
        userId: 'user-1',
        status: OperatorDeletionStatus.APPROVED,
        reviewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      });

      await expect(
        service.create(
          {
            title: 'Title',
            description: 'Desc',
            operatorType: 'DRIVER',
            governorateId: 1,
            wilayaId: 101,
          } as any,
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);

      expect(prisma.operatorDeletionRequest.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: OperatorDeletionStatus.APPROVED },
        orderBy: { reviewedAt: 'desc' },
      });
    });

    it('should succeed creating operator profile if previous deletion was approved more than 72h ago', async () => {
      prisma.operatorListing.findFirst.mockResolvedValue(null);
      prisma.operatorDeletionRequest.findFirst.mockResolvedValue({
        id: 'req-old',
        userId: 'user-1',
        status: OperatorDeletionStatus.APPROVED,
        reviewedAt: new Date(Date.now() - 75 * 60 * 60 * 1000), // 75 hours ago
      });
      prisma.operatorListing.create.mockResolvedValue({
        id: 'op-new-2',
        title: 'Title 2',
      });

      const res = await service.create(
        {
          title: 'Title 2',
          description: 'Desc',
          operatorType: 'DRIVER',
          governorateId: 1,
          wilayaId: 101,
        } as any,
        'user-1',
      );

      expect(res.id).toBe('op-new-2');
      expect(prisma.operatorListing.create).toHaveBeenCalled();
    });
  });

  describe('requestDeletion', () => {
    it('should throw NotFoundException if operator listing does not exist', async () => {
      prisma.operatorListing.findUnique.mockResolvedValue(null);

      await expect(service.requestDeletion('op-x', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if operator listing belongs to another user', async () => {
      prisma.operatorListing.findUnique.mockResolvedValue({ id: 'op-1', userId: 'other-user' });

      await expect(service.requestDeletion('op-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if a PENDING deletion request already exists', async () => {
      prisma.operatorListing.findUnique.mockResolvedValue({ id: 'op-1', userId: 'user-1' });
      prisma.operatorDeletionRequest.findFirst.mockResolvedValue({ id: 'req-1', status: OperatorDeletionStatus.PENDING });

      await expect(service.requestDeletion('op-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should create a PENDING deletion request successfully', async () => {
      prisma.operatorListing.findUnique.mockResolvedValue({ id: 'op-1', userId: 'user-1' });
      prisma.operatorDeletionRequest.findFirst.mockResolvedValue(null);
      prisma.operatorDeletionRequest.create.mockResolvedValue({
        id: 'req-new',
        operatorListingId: 'op-1',
        userId: 'user-1',
        status: OperatorDeletionStatus.PENDING,
      });

      const res = await service.requestDeletion('op-1', 'user-1', 'لم أعد أعمل في هذا المجال');
      expect(res.request.id).toBe('req-new');
      expect(prisma.operatorDeletionRequest.create).toHaveBeenCalledWith({
        data: {
          operatorListingId: 'op-1',
          userId: 'user-1',
          reason: 'لم أعد أعمل في هذا المجال',
          status: OperatorDeletionStatus.PENDING,
        },
      });
    });
  });

  describe('cancelDeletionRequest', () => {
    it('should throw NotFoundException if request not found', async () => {
      prisma.operatorDeletionRequest.findUnique.mockResolvedValue(null);

      await expect(service.cancelDeletionRequest('req-x', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if request does not belong to user', async () => {
      prisma.operatorDeletionRequest.findUnique.mockResolvedValue({ id: 'req-1', userId: 'other' });

      await expect(service.cancelDeletionRequest('req-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if request status is not PENDING', async () => {
      prisma.operatorDeletionRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        userId: 'user-1',
        status: OperatorDeletionStatus.APPROVED,
      });

      await expect(service.cancelDeletionRequest('req-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if more than 24 hours have passed', async () => {
      const past25Hours = new Date(Date.now() - 25 * 60 * 60 * 1000);
      prisma.operatorDeletionRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        userId: 'user-1',
        status: OperatorDeletionStatus.PENDING,
        createdAt: past25Hours,
      });

      await expect(service.cancelDeletionRequest('req-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should cancel request if within 24 hours', async () => {
      const recent = new Date(Date.now() - 2 * 60 * 60 * 1000);
      prisma.operatorDeletionRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        userId: 'user-1',
        status: OperatorDeletionStatus.PENDING,
        createdAt: recent,
      });
      prisma.operatorDeletionRequest.update.mockResolvedValue({
        id: 'req-1',
        status: OperatorDeletionStatus.CANCELLED,
      });

      const res = await service.cancelDeletionRequest('req-1', 'user-1');
      expect(res.status).toBe(OperatorDeletionStatus.CANCELLED);
    });
  });

  describe('adminReviewDeletion', () => {
    it('should throw NotFoundException if request not found', async () => {
      prisma.operatorDeletionRequest.findUnique.mockResolvedValue(null);

      await expect(service.adminReviewDeletion('req-x', 'admin-1', 'APPROVED')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if request status is not PENDING', async () => {
      prisma.operatorDeletionRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: OperatorDeletionStatus.REJECTED,
      });

      await expect(service.adminReviewDeletion('req-1', 'admin-1', 'APPROVED')).rejects.toThrow(BadRequestException);
    });

    it('should approve deletion: delete listing, outbox DELETE event, cleanup orphans, send notification', async () => {
      prisma.operatorDeletionRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        operatorListingId: 'op-1',
        userId: 'user-1',
        status: OperatorDeletionStatus.PENDING,
      });

      const res = await service.adminReviewDeletion('req-1', 'admin-1', 'APPROVED');
      expect(res.status).toBe(OperatorDeletionStatus.APPROVED);

      expect(prisma.operatorListing.delete).toHaveBeenCalledWith({ where: { id: 'op-1' } });
      expect(prisma.outboxEvent.create).toHaveBeenCalledWith({
        data: {
          entityType: ENTITY_TYPES.OPERATOR_LISTING,
          entityId: 'op-1',
          action: 'DELETE',
        },
      });
      expect(prisma.cleanupPolymorphicOrphans).toHaveBeenCalledWith('OPERATOR_LISTING', 'op-1');
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.OPERATOR_DELETION_APPROVED,
          userId: 'user-1',
        }),
      );
    });

    it('should approve deletion: record remains APPROVED with operatorListingId null (verifying no cascade deletion)', async () => {
      let storedRequest: any = {
        id: 'req-1',
        operatorListingId: 'op-1',
        userId: 'user-1',
        status: OperatorDeletionStatus.PENDING,
      };

      prisma.operatorDeletionRequest.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'req-1') return Promise.resolve(storedRequest);
        return Promise.resolve(null);
      });

      prisma.operatorDeletionRequest.update.mockImplementation(({ where, data }: any) => {
        if (where.id === 'req-1') {
          storedRequest = { ...storedRequest, ...data };
          return Promise.resolve(storedRequest);
        }
      });

      prisma.operatorListing.delete.mockImplementation(({ where }: any) => {
        if (where.id === 'op-1') {
          // Simulate database foreign key ON DELETE SET NULL
          if (storedRequest.operatorListingId === 'op-1') {
            storedRequest.operatorListingId = null;
          }
          return Promise.resolve({ id: 'op-1' });
        }
      });

      const res = await service.adminReviewDeletion('req-1', 'admin-1', 'APPROVED');
      expect(res.status).toBe(OperatorDeletionStatus.APPROVED);

      // Verify the request STILL EXISTS and is not cascaded away
      const requestAfter = await prisma.operatorDeletionRequest.findUnique({ where: { id: 'req-1' } });
      expect(requestAfter).not.toBeNull();
      expect(requestAfter.status).toBe(OperatorDeletionStatus.APPROVED);
      expect(requestAfter.operatorListingId).toBeNull();
    });

    it('should reject deletion: update status to REJECTED, record reason, send notification', async () => {
      prisma.operatorDeletionRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        operatorListingId: 'op-1',
        userId: 'user-1',
        status: OperatorDeletionStatus.PENDING,
      });
      prisma.operatorDeletionRequest.update.mockResolvedValue({
        id: 'req-1',
        status: OperatorDeletionStatus.REJECTED,
        rejectionReason: 'الملف نشط ويحتوي على حجوزات',
      });

      const res = await service.adminReviewDeletion('req-1', 'admin-1', 'REJECTED', 'الملف نشط ويحتوي على حجوزات');
      expect(res.status).toBe(OperatorDeletionStatus.REJECTED);
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.OPERATOR_DELETION_REJECTED,
          userId: 'user-1',
          body: expect.stringContaining('الملف نشط ويحتوي على حجوزات'),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if operator listing does not exist', async () => {
      prisma.operatorListing.findUnique.mockResolvedValue(null);
      await expect(service.findOne('op-x')).rejects.toThrow(NotFoundException);
    });

    it('should return pendingDeletionRequest populated if requested by the owner and a PENDING request exists', async () => {
      prisma.operatorListing.findUnique.mockResolvedValue({ id: 'op-1', userId: 'owner-id' });
      prisma.operatorDeletionRequest.findFirst.mockResolvedValue({
        id: 'req-1',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        status: OperatorDeletionStatus.PENDING,
      });

      const res = await service.findOne('op-1', 'owner-id');
      expect(res.pendingDeletionRequest).toBeDefined();
      expect(res.pendingDeletionRequest.id).toBe('req-1');
      expect(res.pendingDeletionRequest.status).toBe(OperatorDeletionStatus.PENDING);
    });

    it('should return pendingDeletionRequest as null if requested by the owner but no PENDING request exists', async () => {
      prisma.operatorListing.findUnique.mockResolvedValue({ id: 'op-1', userId: 'owner-id' });
      prisma.operatorDeletionRequest.findFirst.mockResolvedValue(null);

      const res = await service.findOne('op-1', 'owner-id');
      expect(res.pendingDeletionRequest).toBeNull();
    });

    it('should NOT include pendingDeletionRequest at all if requested by someone else (public view)', async () => {
      prisma.operatorListing.findUnique.mockResolvedValue({ id: 'op-1', userId: 'owner-id' });
      // Call with no userId or a different userId
      const res = await service.findOne('op-1', 'other-user');
      expect(res.pendingDeletionRequest).toBeUndefined();

      const res2 = await service.findOne('op-1');
      expect(res2.pendingDeletionRequest).toBeUndefined();

      expect(prisma.operatorDeletionRequest.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('my', () => {
    it('should fetch pending deletion requests for the listings', async () => {
      prisma.operatorListing.findMany.mockResolvedValue([
        { id: 'op-1', userId: 'owner-id' },
        { id: 'op-2', userId: 'owner-id' }
      ]);
      prisma.operatorDeletionRequest.findFirst
        .mockResolvedValueOnce({
          id: 'req-1',
          createdAt: new Date(),
          status: OperatorDeletionStatus.PENDING,
        })
        .mockResolvedValueOnce(null);

      const res = await service.my('owner-id');
      expect(res.length).toBe(2);
      
      expect(res[0].pendingDeletionRequest).toBeDefined();
      expect(res[0].pendingDeletionRequest.id).toBe('req-1');
      
      expect(res[1].pendingDeletionRequest).toBeNull();
      
      expect(prisma.operatorDeletionRequest.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe('findAll filters and sorting', () => {
    it('should pass rate and experience filters and sortBy with sortOrder into Prisma query', async () => {
      prisma.operatorListing.findMany.mockResolvedValue([]);
      prisma.operatorListing.count.mockResolvedValue(0);

      await service.findAll({
        minDailyRate: 50,
        maxDailyRate: 200,
        minHourlyRate: 10,
        maxHourlyRate: 50,
        minExperienceYears: 3,
        maxExperienceYears: 10,
        sortBy: 'dailyRate',
        sortOrder: 'asc',
      });

      expect(prisma.operatorListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            dailyRate: expect.any(Object),
            hourlyRate: expect.any(Object),
            experienceYears: { gte: 3, lte: 10 },
          }),
          orderBy: { dailyRate: 'asc' },
        }),
      );
    });

    it('should sort by dailyRate asc when sortBy=dailyRate and sortOrder=asc', async () => {
      prisma.operatorListing.findMany.mockResolvedValue([]);
      prisma.operatorListing.count.mockResolvedValue(0);

      await service.findAll({ sortBy: 'dailyRate', sortOrder: 'asc' });

      expect(prisma.operatorListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { dailyRate: 'asc' },
        }),
      );
    });

    it('should sort by viewCount desc when sortBy=viewCount and sortOrder=desc', async () => {
      prisma.operatorListing.findMany.mockResolvedValue([]);
      prisma.operatorListing.count.mockResolvedValue(0);

      await service.findAll({ sortBy: 'viewCount', sortOrder: 'desc' });

      expect(prisma.operatorListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { viewCount: 'desc' },
        }),
      );
    });

    it('should default to { createdAt: "desc" } when no sortBy is provided at all', async () => {
      prisma.operatorListing.findMany.mockResolvedValue([]);
      prisma.operatorListing.count.mockResolvedValue(0);

      await service.findAll({});

      expect(prisma.operatorListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });
});
