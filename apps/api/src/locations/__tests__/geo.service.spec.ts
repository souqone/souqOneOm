import { Test, TestingModule } from '@nestjs/testing';
import { GeoService } from '../geo.service';
import { PrismaService } from '../../prisma/prisma.service';

// ── Prisma Mock ────────────────────────────────────────────────────────────

const mockPrisma = {
  $executeRawUnsafe: jest.fn(),
};

// ── Test Suite ─────────────────────────────────────────────────────────────

describe('GeoService', () => {
  let service: GeoService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$executeRawUnsafe.mockResolvedValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GeoService>(GeoService);
  });

  // ══════════════════════════════════════════════
  // Spec 2.1 — Coordinate Validation
  // ══════════════════════════════════════════════

  describe('syncLocation() — coordinate validation', () => {
    // ── Valid coordinates (must call $executeRawUnsafe) ──────────────────

    it.each([
      [23.5,  58.4,  'normal Oman coordinates'],
      [-90,   0,     'south pole — valid'],
      [90,    0,     'north pole — valid'],
      [0,     0,     'equator + prime meridian (the old !lat || !lng bug)'],
      [0,     -180,  'lng=-180 — valid boundary'],
      [0,     180,   'lng=180  — valid boundary'],
      [-90,   -180,  'corner: min lat + min lng'],
      [90,    180,   'corner: max lat + max lng'],
    ])('should accept lat=%s lng=%s (%s)', async (lat, lng, _description) => {
      const result = await service.syncLocation('users', 'record-1', lat, lng);

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    // ── Invalid coordinates (must NOT call $executeRawUnsafe) ────────────

    it.each([
      [91,        0,         'lat > 90'],
      [-91,       0,         'lat < -90'],
      [0,         181,       'lng > 180'],
      [0,         -181,      'lng < -180'],
      [NaN,       58.4,      'lat=NaN'],
      [23.5,      NaN,       'lng=NaN'],
      [Infinity,  58.4,      'lat=Infinity'],
      [23.5,      Infinity,  'lng=Infinity'],
      [null as any, 58.4,   'lat=null'],
      [23.5,      null as any, 'lng=null'],
    ])('should reject lat=%s lng=%s (%s)', async (lat, lng, _description) => {
      const result = await service.syncLocation('users', 'record-1', lat, lng);

      expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  // ══════════════════════════════════════════════
  // Spec 2.2 — Table Whitelist on syncLocation()
  // ══════════════════════════════════════════════

  describe('syncLocation() — tableName whitelist', () => {
    it.each([
      'users', 'listings', 'driver_jobs', 'driver_profiles',
      'employer_profiles', 'spare_parts', 'car_services',
      'bus_listings', 'equipment_listings', 'operator_listings',
      'carrier_profiles', 'transport_requests',
    ])('should accept valid table: %s', async (table) => {
      const result = await service.syncLocation(table, 'record-1', 23.5, 58.4);

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it.each([
      'users; DROP TABLE users--',
      'unknown_table',
      '../etc/passwd',
      '',
      'USERS',   // case-sensitive — exact match required
    ])('should reject invalid table: "%s"', async (table) => {
      const result = await service.syncLocation(table, 'record-1', 23.5, 58.4);

      expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  // ══════════════════════════════════════════════
  // Spec 2.3 — Column Whitelist on syncLocation()
  // ══════════════════════════════════════════════

  describe('syncLocation() — locationColumnName whitelist', () => {
    // NOTE: This fix was applied in the same refactor as clearLocation().
    // No standalone Red run was possible; this is a permanent regression test.

    it.each([
      'location', 'fromLocation', 'toLocation',
    ])('should accept valid column: %s', async (col) => {
      const result = await service.syncLocation(
        'users', 'record-1', 23.5, 58.4, 'id', col,
      );

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it.each([
      'location; DROP TABLE users--',
      '',
      'password',
      'LOCATION',   // case-sensitive
    ])('should reject invalid column: "%s"', async (col) => {
      const result = await service.syncLocation(
        'users', 'record-1', 23.5, 58.4, 'id', col,
      );

      expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  // ══════════════════════════════════════════════
  // Spec 2.3b — idColumnName Whitelist on syncLocation()
  // ══════════════════════════════════════════════

  describe('syncLocation() — idColumnName whitelist', () => {
    it('should accept valid id column: id', async () => {
      const result = await service.syncLocation(
        'users', 'record-1', 23.5, 58.4, 'id', 'location',
      );

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it.each([
      'id; DROP TABLE users--',
      '',
      'ID', // case-sensitive
      'userId', // Not in whitelist currently
    ])('should reject invalid id column: "%s"', async (col) => {
      const result = await service.syncLocation(
        'users', 'record-1', 23.5, 58.4, col, 'location',
      );

      expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  // ══════════════════════════════════════════════
  // Spec 2.2b / 2.3b — clearLocation() whitelist
  // (Regression test — Red was proved before refactor)
  // ══════════════════════════════════════════════

  describe('clearLocation() — whitelist regression tests', () => {
    it('should reject SQL injection in tableName', async () => {
      const result = await service.clearLocation(
        'users; DROP TABLE users--',
        'record-1',
      );

      expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should reject SQL injection in locationColumnName', async () => {
      const result = await service.clearLocation(
        'users',
        'record-1',
        'id',
        'location; DROP TABLE users--',
      );

      expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should succeed with valid table + column', async () => {
      const result = await service.clearLocation('users', 'record-1');

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('should support fromLocation and toLocation columns', async () => {
      await service.clearLocation('transport_requests', 'req-1', 'id', 'fromLocation');
      await service.clearLocation('transport_requests', 'req-1', 'id', 'toLocation');

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(2);
    });
  });

  // ══════════════════════════════════════════════
  // Spec 2.4 — recordId injection (Unit: assert on SQL string)
  // ══════════════════════════════════════════════

  describe('syncLocation() — recordId SQL injection (unit: string assertion)', () => {
    it('should NOT embed recordId verbatim, but parameterize it', async () => {
      const maliciousId = "' OR '1'='1";

      await service.syncLocation('users', maliciousId, 23.5, 58.4);

      const calledSql: string = mockPrisma.$executeRawUnsafe.mock.calls[0][0];
      const calledArgs = mockPrisma.$executeRawUnsafe.mock.calls[0].slice(1);
      
      // The SQL should contain $3 (parameter) instead of the raw id
      expect(calledSql).toContain('$3');
      expect(calledSql).not.toContain(maliciousId);
      
      // The malicious ID is passed safely as an argument
      expect(calledArgs).toEqual([58.4, 23.5, maliciousId]);
    });
  });

  // ══════════════════════════════════════════════
  // Spec 2.5 — Transport: two columns on same row
  // ══════════════════════════════════════════════

  describe('syncLocation() — transport_requests: fromLocation + toLocation', () => {
    it('should call $executeRawUnsafe twice with different column names', async () => {
      await service.syncLocation('transport_requests', 'req-1', 23.588, 58.382, 'id', 'fromLocation');
      await service.syncLocation('transport_requests', 'req-1', 24.000, 59.000, 'id', 'toLocation');

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(2);

      const firstCall: string  = mockPrisma.$executeRawUnsafe.mock.calls[0][0];
      const secondCall: string = mockPrisma.$executeRawUnsafe.mock.calls[1][0];

      expect(firstCall).toContain('fromLocation');
      expect(firstCall).not.toContain('toLocation');

      expect(secondCall).toContain('toLocation');
      expect(secondCall).not.toContain('fromLocation');
    });

    it('should not overwrite the other column (each UPDATE targets a different column)', async () => {
      await service.syncLocation('transport_requests', 'req-1', 23.588, 58.382, 'id', 'fromLocation');
      await service.syncLocation('transport_requests', 'req-1', 24.000, 59.000, 'id', 'toLocation');

      const fromSql: string = mockPrisma.$executeRawUnsafe.mock.calls[0][0];
      const toSql: string   = mockPrisma.$executeRawUnsafe.mock.calls[1][0];

      // Each SQL only sets its own column — neither touches the other column
      expect(fromSql).toContain('SET "fromLocation"');
      expect(toSql).toContain('SET "toLocation"');
    });
  });

  // ══════════════════════════════════════════════
  // Spec 2.6 — Concurrency
  // ══════════════════════════════════════════════

  describe('syncLocation() — concurrency', () => {
    it('should handle two concurrent calls on the same record without rejecting', async () => {
      // Race condition: both succeed at the DB mock level.
      // The real DB may have last-write-wins semantics (acceptable).
      // What we verify here: no unhandled rejection, both calls complete.
      const [result1, result2] = await Promise.all([
        service.syncLocation('listings', 'listing-1', 23.588, 58.382),
        service.syncLocation('listings', 'listing-1', 24.000, 59.000),
      ]);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(2);
    });
  });
});
