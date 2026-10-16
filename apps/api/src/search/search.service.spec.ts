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

  describe('fallbackSearch', () => {
    let fallbackService: SearchService;

    beforeEach(async () => {
      // Create service without Meilisearch (meili = null)
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SearchService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: MEILI_CLIENT, useValue: null },
        ],
      }).compile();

      fallbackService = module.get<SearchService>(SearchService);
    });

    it('should include hiddenByOwnerStatus: false in where clause for all 7 indexes', async () => {
      const indexDelegates = [
        { index: 'listings', delegate: mockPrisma.listing },
        { index: 'parts', delegate: mockPrisma.sparePart },
        { index: 'services', delegate: mockPrisma.carService },
        { index: 'jobs', delegate: mockPrisma.driverJob },
        { index: 'buses', delegate: mockPrisma.busListing },
        { index: 'equipment', delegate: mockPrisma.equipmentListing },
        { index: 'operators', delegate: mockPrisma.operatorListing },
      ];

      for (const { index, delegate } of indexDelegates) {
        delegate.findMany.mockResolvedValue([]);
        delegate.count = jest.fn().mockResolvedValue(0);

        await (fallbackService as any).fallbackSearch(index, 'test', { q: 'test' }, 1, 10);

        expect(delegate.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'ACTIVE',
              hiddenByOwnerStatus: false,
            }),
          }),
        );

        expect(delegate.count).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'ACTIVE',
              hiddenByOwnerStatus: false,
            }),
          }),
        );
      }
    });
  });

  describe('fallbackAutocomplete', () => {
    let fallbackService: SearchService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SearchService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: MEILI_CLIENT, useValue: null },
        ],
      }).compile();

      fallbackService = module.get<SearchService>(SearchService);
    });

    it('should include hiddenByOwnerStatus: false in where clause for listing, sparePart, and carService', async () => {
      mockPrisma.listing.findMany.mockResolvedValue([]);
      mockPrisma.sparePart.findMany.mockResolvedValue([]);
      mockPrisma.carService.findMany.mockResolvedValue([]);

      await fallbackService.autocomplete('toyota', 8);

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          }),
        }),
      );

      expect(mockPrisma.sparePart.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          }),
        }),
      );

      expect(mockPrisma.carService.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          }),
        }),
      );
    });
  });
});

