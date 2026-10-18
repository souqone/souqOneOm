import { Test, TestingModule } from '@nestjs/testing';
import { PartsService } from './parts.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../locations/geo.service';
import { SearchService } from '../search/search.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';
import { ActiveListingsLimitService } from '../common/services/active-listings-limit.service';

describe('PartsService', () => {
  let service: PartsService;
  
  const mockGeoService = {
    validateLocationPair: jest.fn(),
  };

  const mockPrisma = {
    sparePart: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    }
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    mockPrisma.sparePart.create.mockResolvedValue({ id: '1', price: { toNumber: () => 10 } });
    mockPrisma.sparePart.findUnique.mockResolvedValue({ id: '1', sellerId: 'seller-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GeoService, useValue: mockGeoService },
        { provide: SearchService, useValue: { indexDocument: jest.fn(), removeDocument: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: SellerContactGate, useValue: { assertCanPublish: jest.fn().mockResolvedValue(undefined) } },
        { provide: ActiveListingsLimitService, useValue: { assertWithinLimit: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<PartsService>(PartsService);
  });

  describe('cross-validation for locations', () => {
    it('should fail on create if wilaya mismatch', async () => {
      mockGeoService.validateLocationPair.mockRejectedValueOnce(new Error('Mismatch'));
      const dto = { title: 'Part', price: 100, governorateId: 1, wilayaId: 10 } as any;
      await expect(service.create(dto, 'seller-1')).rejects.toThrow('Mismatch');
    });

    it('should fail on update if wilaya mismatch', async () => {
      mockGeoService.validateLocationPair.mockRejectedValueOnce(new Error('Mismatch'));
      const dto = { governorateId: 1, wilayaId: 10 } as any;
      await expect(service.update('1', 'seller-1', dto)).rejects.toThrow('Mismatch');
    });
  });
});
