import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from '../locations.service';
import { PrismaService } from '../../prisma/prisma.service';

// ── Mock Data ──────────────────────────────────────────────────────────────

const mockGovernorates = [
  { id: 1, nameAr: 'مسقط', nameEn: 'Muscat', isActive: true },
  { id: 2, nameAr: 'ظفار', nameEn: 'Dhofar', isActive: true },
];

const mockWilayas = [
  { id: 10, nameAr: 'السيب', nameEn: 'Seeb', governorateId: 1, isActive: true },
  { id: 11, nameAr: 'بوشر', nameEn: 'Bausher', governorateId: 1, isActive: true },
];

// ── Prisma Mock ────────────────────────────────────────────────────────────

const mockPrisma = {
  governorate: {
    findMany: jest.fn(),
  },
  wilaya: {
    findMany: jest.fn(),
  },
};

// ── Test Suite ─────────────────────────────────────────────────────────────

describe('LocationsService', () => {
  let service: LocationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  // ══════════════════════════════════════════════
  // getGovernorates()
  // ══════════════════════════════════════════════

  describe('getGovernorates()', () => {
    it('should return active governorates only', async () => {
      mockPrisma.governorate.findMany.mockResolvedValue(mockGovernorates);

      const result = await service.getGovernorates();

      expect(mockPrisma.governorate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
      expect(result).toEqual(mockGovernorates);
    });

    it('should order results by id ascending', async () => {
      mockPrisma.governorate.findMany.mockResolvedValue(mockGovernorates);

      await service.getGovernorates();

      expect(mockPrisma.governorate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { id: 'asc' },
        }),
      );
    });

    it('should return empty array when no active governorates exist', async () => {
      mockPrisma.governorate.findMany.mockResolvedValue([]);

      const result = await service.getGovernorates();

      expect(result).toEqual([]);
    });

    it('should propagate DB errors to caller', async () => {
      const dbError = new Error('Connection refused');
      mockPrisma.governorate.findMany.mockRejectedValue(dbError);

      await expect(service.getGovernorates()).rejects.toThrow('Connection refused');
    });

    it('should return correct shape for each governorate', async () => {
      mockPrisma.governorate.findMany.mockResolvedValue(mockGovernorates);

      const result = await service.getGovernorates();

      expect(result[0]).toMatchObject({
        id: expect.any(Number),
        nameAr: expect.any(String),
        nameEn: expect.any(String),
        isActive: true,
      });
    });
  });

  // ══════════════════════════════════════════════
  // getWilayas(governorateId)
  // ══════════════════════════════════════════════

  describe('getWilayas(governorateId)', () => {
    it('should return wilayas for the given governorate only', async () => {
      mockPrisma.wilaya.findMany.mockResolvedValue(mockWilayas);

      const result = await service.getWilayas(1);

      expect(mockPrisma.wilaya.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { governorateId: 1, isActive: true },
        }),
      );
      expect(result).toEqual(mockWilayas);
    });

    it('should filter by isActive = true', async () => {
      mockPrisma.wilaya.findMany.mockResolvedValue(mockWilayas);

      await service.getWilayas(1);

      const callArgs = mockPrisma.wilaya.findMany.mock.calls[0][0];
      expect(callArgs.where).toEqual({ governorateId: 1, isActive: true });
    });

    it('should order results by id ascending', async () => {
      mockPrisma.wilaya.findMany.mockResolvedValue(mockWilayas);

      await service.getWilayas(1);

      expect(mockPrisma.wilaya.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { id: 'asc' },
        }),
      );
    });

    it('should return empty array for a governorate with no active wilayas', async () => {
      mockPrisma.wilaya.findMany.mockResolvedValue([]);

      const result = await service.getWilayas(999);

      expect(result).toEqual([]);
    });

    it('should pass the correct governorateId to DB query', async () => {
      mockPrisma.wilaya.findMany.mockResolvedValue([]);

      await service.getWilayas(7);

      const callArgs = mockPrisma.wilaya.findMany.mock.calls[0][0];
      expect(callArgs.where.governorateId).toBe(7);
    });

    it('should propagate DB errors to caller', async () => {
      const dbError = new Error('Timeout');
      mockPrisma.wilaya.findMany.mockRejectedValue(dbError);

      await expect(service.getWilayas(1)).rejects.toThrow('Timeout');
    });
  });
});
