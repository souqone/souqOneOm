import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GeoService } from '../locations/geo.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BusesService } from '../buses/buses.service';
import { EquipmentListingsService } from '../equipment/equipment-listings.service';
import { OperatorsService } from '../operators/operators.service';
import { PartsService } from '../parts/parts.service';
import { ServicesService } from '../services/services.service';
import { JobsService } from '../jobs/jobs.service';
import { AdminJobsService } from '../jobs/admin-jobs.service';
import { JobExpiryService } from '../jobs/job-expiry.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';

describe('Outbox Integration', () => {
  let mockPrisma: any;
  let mockRedis: any;
  let mockEventEmitter: any;
  let mockGeo: any;
  let mockNotif: any;

  let busesService: BusesService;
  let equipmentService: EquipmentListingsService;
  let operatorsService: OperatorsService;
  let partsService: PartsService;
  let servicesService: ServicesService;
  let jobsService: JobsService;
  let adminJobsService: AdminJobsService;
  let jobExpiryService: JobExpiryService;

  beforeEach(async () => {
    mockPrisma = {
      $transaction: jest.fn().mockImplementation(async (cb) => {
        if (typeof cb === 'function') return cb(mockPrisma);
        if (Array.isArray(cb)) return Promise.all(cb);
      }),
      busListing: { create: jest.fn().mockResolvedValue({ id: '1' }), update: jest.fn().mockResolvedValue({ id: '1' }), delete: jest.fn().mockResolvedValue({ id: '1' }), findUnique: jest.fn().mockResolvedValue({ id: '1', userId: 'owner', sellerId: 'owner' }) },
      equipmentListing: { create: jest.fn().mockResolvedValue({ id: '1' }), update: jest.fn().mockResolvedValue({ id: '1' }), delete: jest.fn().mockResolvedValue({ id: '1' }), findUnique: jest.fn().mockResolvedValue({ id: '1', userId: 'owner', sellerId: 'owner' }) },
      operatorListing: { create: jest.fn().mockResolvedValue({ id: '1' }), update: jest.fn().mockResolvedValue({ id: '1' }), delete: jest.fn().mockResolvedValue({ id: '1' }), findUnique: jest.fn().mockResolvedValue({ id: '1', userId: 'owner', sellerId: 'owner' }) },
      sparePart: { create: jest.fn().mockResolvedValue({ id: '1' }), update: jest.fn().mockResolvedValue({ id: '1' }), delete: jest.fn().mockResolvedValue({ id: '1' }), findUnique: jest.fn().mockResolvedValue({ id: '1', userId: 'owner', sellerId: 'owner' }) },
      carService: { create: jest.fn().mockResolvedValue({ id: '1' }), update: jest.fn().mockResolvedValue({ id: '1' }), delete: jest.fn().mockResolvedValue({ id: '1' }), findUnique: jest.fn().mockResolvedValue({ id: '1', userId: 'owner', sellerId: 'owner' }) },
      driverJob: { create: jest.fn().mockResolvedValue({ id: '1' }), update: jest.fn().mockResolvedValue({ id: '1' }), delete: jest.fn().mockResolvedValue({ id: '1' }), findUnique: jest.fn().mockResolvedValue({ id: '1', userId: 'owner', sellerId: 'owner' }), updateMany: jest.fn().mockResolvedValue({ count: 1 }), findMany: jest.fn().mockResolvedValue([{ id: 'expired-1', userId: 'owner', sellerId: 'owner' }]) },
      jobApplication: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn() },
      outboxEvent: { create: jest.fn().mockResolvedValue({}) },
      cleanupPolymorphicOrphans: jest.fn().mockResolvedValue(true),
    };

    mockRedis = {
      delPattern: jest.fn(),
      del: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setNX: jest.fn().mockResolvedValue(1),
    };

    mockEventEmitter = { emit: jest.fn() };
    mockGeo = { validateLocationPair: jest.fn().mockResolvedValue(true), getCoordinates: jest.fn().mockResolvedValue({ lat: 0, lon: 0 }) };
    mockNotif = { create: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusesService,
        EquipmentListingsService,
        OperatorsService,
        PartsService,
        ServicesService,
        JobsService,
        AdminJobsService,
        JobExpiryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: GeoService, useValue: mockGeo },
        { provide: NotificationsService, useValue: mockNotif },
      ],
    }).compile();

    busesService = module.get<BusesService>(BusesService);
    equipmentService = module.get<EquipmentListingsService>(EquipmentListingsService);
    operatorsService = module.get<OperatorsService>(OperatorsService);
    partsService = module.get<PartsService>(PartsService);
    servicesService = module.get<ServicesService>(ServicesService);
    jobsService = module.get<JobsService>(JobsService);
    adminJobsService = module.get<AdminJobsService>(AdminJobsService);
    jobExpiryService = module.get<JobExpiryService>(JobExpiryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Buses', () => {
    it('should create OutboxEvent with BUS_LISTING + UPSERT on bus create', async () => {
      await busesService.create({ title: 'test' } as any, 'owner');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.BUS_LISTING, entityId: '1', action: 'UPSERT' } }));
    });
    it('should create OutboxEvent with BUS_LISTING + UPSERT on bus update', async () => {
      await busesService.update('1', 'owner', {});
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.BUS_LISTING, entityId: '1', action: 'UPSERT' } }));
    });
    it('should create OutboxEvent with BUS_LISTING + DELETE on bus delete', async () => {
      await busesService.remove('1', 'owner');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.BUS_LISTING, entityId: '1', action: 'DELETE' } }));
    });
  });

  describe('Equipment', () => {
    it('should create OutboxEvent with EQUIPMENT_LISTING + UPSERT on create', async () => {
      await equipmentService.create({ title: 'test' } as any, 'owner');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.EQUIPMENT_LISTING, entityId: '1', action: 'UPSERT' } }));
    });
    it('should create OutboxEvent with EQUIPMENT_LISTING + UPSERT on update', async () => {
      await equipmentService.update('1', 'owner', {});
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.EQUIPMENT_LISTING, entityId: '1', action: 'UPSERT' } }));
    });
    it('should create OutboxEvent with EQUIPMENT_LISTING + DELETE on delete', async () => {
      await equipmentService.remove('1', 'owner');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.EQUIPMENT_LISTING, entityId: '1', action: 'DELETE' } }));
    });
  });

  describe('Operators', () => {
    it('should create OutboxEvent with OPERATOR_LISTING + UPSERT on create', async () => {
      await operatorsService.create({ title: 'test' } as any, 'owner');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.OPERATOR_LISTING, entityId: '1', action: 'UPSERT' } }));
    });
    it('should create OutboxEvent with OPERATOR_LISTING + UPSERT on update', async () => {
      await operatorsService.update('1', 'owner', {});
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.OPERATOR_LISTING, entityId: '1', action: 'UPSERT' } }));
    });
    it('should create OutboxEvent with OPERATOR_LISTING + DELETE on delete', async () => {
      await operatorsService.remove('1', 'owner');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.OPERATOR_LISTING, entityId: '1', action: 'DELETE' } }));
    });
  });

  describe('Parts', () => {
    it('should create OutboxEvent with SPARE_PART + UPSERT on create', async () => {
      await partsService.create({ title: 'test', price: 10 } as any, 'owner');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.SPARE_PART, entityId: '1', action: 'UPSERT' } }));
    });
    it('should create OutboxEvent with SPARE_PART + UPSERT on update', async () => {
      await partsService.update('1', 'owner', {});
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.SPARE_PART, entityId: '1', action: 'UPSERT' } }));
    });
    it('should create OutboxEvent with SPARE_PART + DELETE on delete', async () => {
      await partsService.remove('1', 'owner');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.SPARE_PART, entityId: '1', action: 'DELETE' } }));
    });
  });

  describe('Services', () => {
    it('should create OutboxEvent with CAR_SERVICE + UPSERT on create', async () => {
      await servicesService.create({ title: 'test' } as any, 'owner');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.CAR_SERVICE, entityId: '1', action: 'UPSERT' } }));
    });
    it('should create OutboxEvent with CAR_SERVICE + UPSERT on update', async () => {
      await servicesService.update('1', 'owner', {});
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.CAR_SERVICE, entityId: '1', action: 'UPSERT' } }));
    });
    it('should create OutboxEvent with CAR_SERVICE + DELETE on delete', async () => {
      await servicesService.remove('1', 'owner');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.CAR_SERVICE, entityId: '1', action: 'DELETE' } }));
    });
    it('should create OutboxEvent with CAR_SERVICE + UPSERT on toggleStatus', async () => {
      await servicesService.toggleStatus('1', 'owner');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.CAR_SERVICE, entityId: '1', action: 'UPSERT' } }));
    });
  });

  describe('Jobs', () => {
    it('should create OutboxEvent with JOB + UPSERT on create', async () => {
      await jobsService.create('user1', { title: 'test' } as any);
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.JOB, entityId: '1', action: 'UPSERT' } }));
    });
    it('should create OutboxEvent with JOB + UPSERT on update', async () => {
      await jobsService.update('1', 'owner', {});
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.JOB, entityId: '1', action: 'UPSERT' } }));
    });
    it('should create OutboxEvent with JOB + DELETE on delete', async () => {
      await jobsService.remove('1', 'owner');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.JOB, entityId: '1', action: 'DELETE' } }));
    });
    it('should create OutboxEvent with JOB + UPSERT on admin update', async () => {
      await adminJobsService.updateJob('1', { status: 'ACTIVE' });
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.JOB, entityId: '1', action: 'UPSERT' } }));
    });
    it('should create OutboxEvent with JOB + DELETE on admin delete', async () => {
      await adminJobsService.deleteJob('1');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.JOB, entityId: '1', action: 'DELETE' } }));
    });
    it('should create OutboxEvent with JOB + UPSERT on expiry cron', async () => {
      await jobExpiryService.expireOldJobs();
      // The service uses Promise.all of an array of creations because of $transaction(array) in the fix.
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: { entityType: ENTITY_TYPES.JOB, entityId: 'expired-1', action: 'UPSERT' } }));
    });
  });
});
