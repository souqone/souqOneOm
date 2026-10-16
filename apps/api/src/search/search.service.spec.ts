import { Test, TestingModule } from '@nestjs/testing';
import { SearchService, INDEXES } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { MEILI_CLIENT } from './meili.provider';

describe('SearchService - reindexAll', () => {
  let service: SearchService;
  let mockPrisma: any;
  let mockMeili: any;

  beforeEach(async () => {
    mockMeili = {
      index: jest.fn().mockReturnValue({
        addDocuments: jest.fn().mockResolvedValue(undefined),
      }),
    };

    mockPrisma = {
      listing: { findMany: jest.fn().mockResolvedValue([]) },
      sparePart: { findMany: jest.fn().mockResolvedValue([]) },
      carService: { findMany: jest.fn().mockResolvedValue([]) },
      driverJob: { findMany: jest.fn().mockResolvedValue([]) },
      busListing: { findMany: jest.fn().mockResolvedValue([]) },
      equipmentListing: { findMany: jest.fn().mockResolvedValue([]) },
      operatorListing: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MEILI_CLIENT, useValue: mockMeili },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should query all 7 verticals with hiddenByOwnerStatus: false and status: ACTIVE', async () => {
    await service.reindexAll();

    expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE', hiddenByOwnerStatus: false },
      }),
    );

    expect(mockPrisma.sparePart.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE', hiddenByOwnerStatus: false },
      }),
    );

    expect(mockPrisma.carService.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE', hiddenByOwnerStatus: false },
      }),
    );

    expect(mockPrisma.driverJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE', hiddenByOwnerStatus: false },
      }),
    );

    expect(mockPrisma.busListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE', deletedAt: null, hiddenByOwnerStatus: false },
      }),
    );

    expect(mockPrisma.equipmentListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE', hiddenByOwnerStatus: false },
      }),
    );

    expect(mockPrisma.operatorListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE', hiddenByOwnerStatus: false },
      }),
    );
  });
});
