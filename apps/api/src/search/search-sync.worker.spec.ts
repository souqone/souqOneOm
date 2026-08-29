import { Test, TestingModule } from '@nestjs/testing';
import { SearchSyncWorker } from './search-sync.worker';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService, INDEXES } from './search.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

const mockPrisma = {
  listing: { findUnique: jest.fn() },
  busListing: { findUnique: jest.fn() },
  equipmentListing: { findUnique: jest.fn() },
  operatorListing: { findUnique: jest.fn() },
  sparePart: { findUnique: jest.fn() },
  carService: { findUnique: jest.fn() },
  driverJob: { findUnique: jest.fn() },
};

const mockSearchService = {
  indexDocument: jest.fn().mockResolvedValue(undefined),
  removeDocument: jest.fn().mockResolvedValue(undefined),
};

describe('SearchSyncWorker', () => {
  let worker: SearchSyncWorker;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchSyncWorker,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SearchService, useValue: mockSearchService },
      ],
    }).compile();

    worker = module.get<SearchSyncWorker>(SearchSyncWorker);
    jest.clearAllMocks();
    
    // Silence logger during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });

  const createJob = (entityType: string, entityId: string, action: string): Job => {
    return {
      id: 1,
      data: { entityType, entityId, action },
    } as any;
  };

  describe('LISTING', () => {
    it('should index document on UPSERT action', async () => {
      mockPrisma.listing.findUnique.mockResolvedValueOnce({
        id: '123',
        price: 1000,
        images: [{ url: 'image.png' }],
      });
      await worker.handleSync(createJob(ENTITY_TYPES.LISTING, '123', 'UPSERT'));
      expect(mockSearchService.indexDocument).toHaveBeenCalledWith(
        INDEXES.LISTINGS,
        expect.objectContaining({ id: '123', price: 1000, imageUrl: 'image.png' })
      );
    });

    it('should remove document on DELETE action', async () => {
      await worker.handleSync(createJob(ENTITY_TYPES.LISTING, '123', 'DELETE'));
      expect(mockSearchService.removeDocument).toHaveBeenCalledWith(INDEXES.LISTINGS, '123');
    });

    it('should remove from index if entity not found in DB', async () => {
      mockPrisma.listing.findUnique.mockResolvedValueOnce(null);
      await worker.handleSync(createJob(ENTITY_TYPES.LISTING, '123', 'UPSERT'));
      expect(mockSearchService.removeDocument).toHaveBeenCalledWith(INDEXES.LISTINGS, '123');
      expect(mockSearchService.indexDocument).not.toHaveBeenCalled();
    });
  });

  describe('BUS_LISTING', () => {
    it('should index document on UPSERT action', async () => {
      mockPrisma.busListing.findUnique.mockResolvedValueOnce({
        id: '123',
        price: 1000,
        images: [{ url: 'image.png' }],
      });
      await worker.handleSync(createJob(ENTITY_TYPES.BUS_LISTING, '123', 'UPSERT'));
      expect(mockSearchService.indexDocument).toHaveBeenCalledWith(
        INDEXES.BUSES,
        expect.objectContaining({ id: '123', price: 1000, imageUrl: 'image.png' })
      );
    });

    it('should remove document on DELETE action', async () => {
      await worker.handleSync(createJob(ENTITY_TYPES.BUS_LISTING, '123', 'DELETE'));
      expect(mockSearchService.removeDocument).toHaveBeenCalledWith(INDEXES.BUSES, '123');
    });

    it('should remove from index if entity not found in DB', async () => {
      mockPrisma.busListing.findUnique.mockResolvedValueOnce(null);
      await worker.handleSync(createJob(ENTITY_TYPES.BUS_LISTING, '123', 'UPSERT'));
      expect(mockSearchService.removeDocument).toHaveBeenCalledWith(INDEXES.BUSES, '123');
    });
  });

  describe('EQUIPMENT_LISTING', () => {
    it('should index document on UPSERT action', async () => {
      mockPrisma.equipmentListing.findUnique.mockResolvedValueOnce({
        id: '123',
        price: 1000,
        images: [{ url: 'image.png' }],
      });
      await worker.handleSync(createJob(ENTITY_TYPES.EQUIPMENT_LISTING, '123', 'UPSERT'));
      expect(mockSearchService.indexDocument).toHaveBeenCalledWith(
        INDEXES.EQUIPMENT,
        expect.objectContaining({ id: '123', price: 1000, imageUrl: 'image.png' })
      );
    });

    it('should remove document on DELETE action', async () => {
      await worker.handleSync(createJob(ENTITY_TYPES.EQUIPMENT_LISTING, '123', 'DELETE'));
      expect(mockSearchService.removeDocument).toHaveBeenCalledWith(INDEXES.EQUIPMENT, '123');
    });

    it('should remove from index if entity not found in DB', async () => {
      mockPrisma.equipmentListing.findUnique.mockResolvedValueOnce(null);
      await worker.handleSync(createJob(ENTITY_TYPES.EQUIPMENT_LISTING, '123', 'UPSERT'));
      expect(mockSearchService.removeDocument).toHaveBeenCalledWith(INDEXES.EQUIPMENT, '123');
    });
  });

  describe('OPERATOR_LISTING', () => {
    it('should index document on UPSERT action', async () => {
      mockPrisma.operatorListing.findUnique.mockResolvedValueOnce({
        id: '123',
        dailyRate: 1000,
      });
      await worker.handleSync(createJob(ENTITY_TYPES.OPERATOR_LISTING, '123', 'UPSERT'));
      expect(mockSearchService.indexDocument).toHaveBeenCalledWith(
        INDEXES.OPERATORS,
        expect.objectContaining({ id: '123', dailyRate: 1000 })
      );
    });

    it('should remove document on DELETE action', async () => {
      await worker.handleSync(createJob(ENTITY_TYPES.OPERATOR_LISTING, '123', 'DELETE'));
      expect(mockSearchService.removeDocument).toHaveBeenCalledWith(INDEXES.OPERATORS, '123');
    });

    it('should remove from index if entity not found in DB', async () => {
      mockPrisma.operatorListing.findUnique.mockResolvedValueOnce(null);
      await worker.handleSync(createJob(ENTITY_TYPES.OPERATOR_LISTING, '123', 'UPSERT'));
      expect(mockSearchService.removeDocument).toHaveBeenCalledWith(INDEXES.OPERATORS, '123');
    });
  });

  describe('SPARE_PART', () => {
    it('should index document on UPSERT action', async () => {
      mockPrisma.sparePart.findUnique.mockResolvedValueOnce({
        id: '123',
        price: 1000,
        images: [{ url: 'image.png' }],
      });
      await worker.handleSync(createJob(ENTITY_TYPES.SPARE_PART, '123', 'UPSERT'));
      expect(mockSearchService.indexDocument).toHaveBeenCalledWith(
        INDEXES.PARTS,
        expect.objectContaining({ id: '123', price: 1000, imageUrl: 'image.png' })
      );
    });

    it('should remove document on DELETE action', async () => {
      await worker.handleSync(createJob(ENTITY_TYPES.SPARE_PART, '123', 'DELETE'));
      expect(mockSearchService.removeDocument).toHaveBeenCalledWith(INDEXES.PARTS, '123');
    });

    it('should remove from index if entity not found in DB', async () => {
      mockPrisma.sparePart.findUnique.mockResolvedValueOnce(null);
      await worker.handleSync(createJob(ENTITY_TYPES.SPARE_PART, '123', 'UPSERT'));
      expect(mockSearchService.removeDocument).toHaveBeenCalledWith(INDEXES.PARTS, '123');
    });
  });

  describe('CAR_SERVICE', () => {
    it('should index document on UPSERT action', async () => {
      mockPrisma.carService.findUnique.mockResolvedValueOnce({
        id: '123',
        priceFrom: 1000,
        images: [{ url: 'image.png' }],
      });
      await worker.handleSync(createJob(ENTITY_TYPES.CAR_SERVICE, '123', 'UPSERT'));
      expect(mockSearchService.indexDocument).toHaveBeenCalledWith(
        INDEXES.SERVICES,
        expect.objectContaining({ id: '123', priceFrom: 1000, imageUrl: 'image.png' })
      );
    });

    it('should remove document on DELETE action', async () => {
      await worker.handleSync(createJob(ENTITY_TYPES.CAR_SERVICE, '123', 'DELETE'));
      expect(mockSearchService.removeDocument).toHaveBeenCalledWith(INDEXES.SERVICES, '123');
    });

    it('should remove from index if entity not found in DB', async () => {
      mockPrisma.carService.findUnique.mockResolvedValueOnce(null);
      await worker.handleSync(createJob(ENTITY_TYPES.CAR_SERVICE, '123', 'UPSERT'));
      expect(mockSearchService.removeDocument).toHaveBeenCalledWith(INDEXES.SERVICES, '123');
    });
  });

  describe('JOB', () => {
    it('should index document on UPSERT action', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValueOnce({
        id: '123',
        salary: 1000,
      });
      await worker.handleSync(createJob(ENTITY_TYPES.JOB, '123', 'UPSERT'));
      expect(mockSearchService.indexDocument).toHaveBeenCalledWith(
        INDEXES.JOBS,
        expect.objectContaining({ id: '123', salary: 1000 })
      );
    });

    it('should remove document on DELETE action', async () => {
      await worker.handleSync(createJob(ENTITY_TYPES.JOB, '123', 'DELETE'));
      expect(mockSearchService.removeDocument).toHaveBeenCalledWith(INDEXES.JOBS, '123');
    });

    it('should remove from index if entity not found in DB', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValueOnce(null);
      await worker.handleSync(createJob(ENTITY_TYPES.JOB, '123', 'UPSERT'));
      expect(mockSearchService.removeDocument).toHaveBeenCalledWith(INDEXES.JOBS, '123');
    });
  });

  describe('unknown entityType', () => {
    it('should log warning and NOT call indexDocument or removeDocument', async () => {
      await worker.handleSync(createJob('UNKNOWN_TYPE', '123', 'UPSERT'));
      expect(mockSearchService.indexDocument).not.toHaveBeenCalled();
      expect(mockSearchService.removeDocument).not.toHaveBeenCalled();
      expect(Logger.prototype.warn).toHaveBeenCalled();
    });

    it('should NOT throw an error', async () => {
      await expect(worker.handleSync(createJob('UNKNOWN_TYPE', '123', 'DELETE'))).resolves.not.toThrow();
    });
  });
});
