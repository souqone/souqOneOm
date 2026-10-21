import { Test, TestingModule } from '@nestjs/testing';
import {
  SearchService,
  INDEXES,
  getOwnerRelationForDelegate,
  INDEX_TO_DELEGATE,
} from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { MEILI_CLIENT } from './meili.provider';

describe('SearchService - Owner Relation & Visibility Filters', () => {
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

  describe('getOwnerRelationForDelegate helper', () => {
    it('should correctly resolve relation for all 7 search entity delegates matching the registry', () => {
      const expectations = [
        { index: 'listings', delegate: INDEX_TO_DELEGATE['listings'], expected: 'seller' },
        { index: 'parts', delegate: INDEX_TO_DELEGATE['parts'], expected: 'seller' },
        { index: 'services', delegate: INDEX_TO_DELEGATE['services'], expected: 'user' },
        { index: 'jobs', delegate: INDEX_TO_DELEGATE['jobs'], expected: 'user' },
        { index: 'buses', delegate: INDEX_TO_DELEGATE['buses'], expected: 'user' },
        { index: 'equipment', delegate: INDEX_TO_DELEGATE['equipment'], expected: 'user' },
        { index: 'operators', delegate: INDEX_TO_DELEGATE['operators'], expected: 'user' },
      ];

      for (const { index, delegate, expected } of expectations) {
        expect(delegate).toBeDefined();
        const rel = getOwnerRelationForDelegate(delegate);
        expect(rel).toBe(expected);
      }
    });

    it('should throw clear error when delegate is not found in OWNER_VISIBILITY_REGISTRY', () => {
      expect(() => getOwnerRelationForDelegate('unknownDelegate' as any)).toThrow(
        'Owner relation not found in OWNER_VISIBILITY_REGISTRY for delegate "unknownDelegate"',
      );
    });
  });

  describe('reindexAll', () => {
    it('should query all 7 verticals with hiddenByOwnerStatus: false, status: ACTIVE, and ownerRelation: ACTIVE', async () => {
      await service.reindexAll();

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
            seller: { status: 'ACTIVE' },
          },
        }),
      );

      expect(mockPrisma.sparePart.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
            seller: { status: 'ACTIVE' },
          },
        }),
      );

      expect(mockPrisma.carService.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
            user: { status: 'ACTIVE' },
          },
        }),
      );

      expect(mockPrisma.driverJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
            user: { status: 'ACTIVE' },
          },
        }),
      );

      expect(mockPrisma.busListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'ACTIVE',
            deletedAt: null,
            hiddenByOwnerStatus: false,
            user: { status: 'ACTIVE' },
          },
        }),
      );

      expect(mockPrisma.equipmentListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'ACTIVE',
            deletedAt: null,
            hiddenByOwnerStatus: false,
            user: { status: 'ACTIVE' },
          },
        }),
      );

      expect(mockPrisma.operatorListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
            user: { status: 'ACTIVE' },
          },
        }),
      );
    });
  });

  describe('fallbackSearch', () => {
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

    it('should include ownerRelation: { status: "ACTIVE" } inside where.AND for all 7 indexes', async () => {
      const indexDelegates = [
        { index: 'listings', delegate: mockPrisma.listing, expectedRel: 'seller' },
        { index: 'parts', delegate: mockPrisma.sparePart, expectedRel: 'seller' },
        { index: 'services', delegate: mockPrisma.carService, expectedRel: 'user' },
        { index: 'jobs', delegate: mockPrisma.driverJob, expectedRel: 'user' },
        { index: 'buses', delegate: mockPrisma.busListing, expectedRel: 'user' },
        { index: 'equipment', delegate: mockPrisma.equipmentListing, expectedRel: 'user' },
        { index: 'operators', delegate: mockPrisma.operatorListing, expectedRel: 'user' },
      ];

      for (const { index, delegate, expectedRel } of indexDelegates) {
        delegate.findMany.mockResolvedValue([]);
        delegate.count = jest.fn().mockResolvedValue(0);

        await (fallbackService as any).fallbackSearch(index, '', { q: '' }, 1, 10);

        expect(delegate.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'ACTIVE',
              hiddenByOwnerStatus: false,
              AND: expect.arrayContaining([{ [expectedRel]: { status: 'ACTIVE' } }]),
            }),
          }),
        );
      }
    });

    it('should preserve existing search filters in where.AND alongside ownerRelation filter', async () => {
      mockPrisma.listing.findMany.mockResolvedValue([]);
      mockPrisma.listing.count = jest.fn().mockResolvedValue(0);

      await (fallbackService as any).fallbackSearch('listings', 'toyota camry', { q: 'toyota camry' }, 1, 10);

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
            AND: expect.arrayContaining([
              // Keyword filters for 'toyota' and 'camry'
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ title: { contains: 'toyota', mode: 'insensitive' } }),
                ]),
              }),
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ title: { contains: 'camry', mode: 'insensitive' } }),
                ]),
              }),
              // Owner active relation filter
              { seller: { status: 'ACTIVE' } },
            ]),
          }),
        }),
      );
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

    it('should include hiddenByOwnerStatus: false and ownerRelation: { status: ACTIVE } in where clause for listing, sparePart, and carService', async () => {
      mockPrisma.listing.findMany.mockResolvedValue([]);
      mockPrisma.sparePart.findMany.mockResolvedValue([]);
      mockPrisma.carService.findMany.mockResolvedValue([]);

      await fallbackService.autocomplete('toyota', 8);

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
            seller: { status: 'ACTIVE' },
          }),
        }),
      );

      expect(mockPrisma.sparePart.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
            seller: { status: 'ACTIVE' },
          }),
        }),
      );

      expect(mockPrisma.carService.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
            user: { status: 'ACTIVE' },
          }),
        }),
      );
    });
  });
});
