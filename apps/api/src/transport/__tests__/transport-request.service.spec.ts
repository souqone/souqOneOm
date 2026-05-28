import { Test, TestingModule } from '@nestjs/testing';
import { TransportRequestService } from '../transport-request.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

const mockPrisma = {
  transportRequest: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  transportQuote: {
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  carrierProfile: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  delPattern: jest.fn(),
  setNX: jest.fn(),
};

const mockNotifications = {
  create: jest.fn(),
};

describe('TransportRequestService', () => {
  let service: TransportRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportRequestService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<TransportRequestService>(TransportRequestService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a transport request', async () => {
      const dto = {
        serviceType: 'GOODS',
        fromGovernorate: 'مسقط',
        fromAddress: 'شارع السلطان',
        toGovernorate: 'صلالة',
        toAddress: 'الحي التجاري',
        cargoDescription: 'بضائع متنوعة عامة',
      };
      mockPrisma.transportRequest.create.mockResolvedValue({ id: 'r1', ...dto });
      mockPrisma.carrierProfile.findMany.mockResolvedValue([]);

      const result = await service.create('user1', dto as any);
      expect(result.id).toBe('r1');
      expect(mockPrisma.transportRequest.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return cached result if available', async () => {
      const cached = { items: [{ id: 'r1' }], meta: { total: 1, page: 1, limit: 12, totalPages: 1 } };
      mockRedis.get.mockResolvedValue(cached);

      const result = await service.findAll({});
      expect(result).toEqual(cached);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should query DB on cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      const items = [{ id: 'r1' }];
      mockPrisma.$transaction.mockResolvedValue([items, 1]);

      const result = await service.findAll({});
      expect(result.items).toEqual(items);
      expect(mockRedis.set).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.transportRequest.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue({ id: 'r1', userId: 'other', status: 'OPEN' });
      await expect(service.cancel('r1', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if status not cancellable', async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue({ id: 'r1', userId: 'user1', status: 'COMPLETED' });
      await expect(service.cancel('r1', 'user1')).rejects.toThrow(BadRequestException);
    });

    it('should cancel an OPEN request', async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue({ id: 'r1', userId: 'user1', status: 'OPEN' });
      mockPrisma.transportRequest.update.mockResolvedValue({ id: 'r1', status: 'CANCELLED' });

      const result = await service.cancel('r1', 'user1');
      expect(result.status).toBe('CANCELLED');
    });
  });
});
