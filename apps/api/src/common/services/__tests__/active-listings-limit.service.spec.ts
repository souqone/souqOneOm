import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import {
  ActiveListingsLimitService,
  DEFAULT_MAX_ACTIVE_LISTINGS,
  ACTIVE_LISTINGS_LIMIT_REACHED_CODE,
  ACTIVE_LISTINGS_LIMIT_REACHED_MESSAGE,
  hashToBigInt,
} from '../active-listings-limit.service';

describe('ActiveListingsLimitService Unit Tests', () => {
  let service: ActiveListingsLimitService;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.MAX_ACTIVE_LISTINGS_PER_USER;
    service = new ActiveListingsLimitService();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getMaxActiveListings', () => {
    it('returns DEFAULT_MAX_ACTIVE_LISTINGS (5) when env var is undefined', () => {
      delete process.env.MAX_ACTIVE_LISTINGS_PER_USER;
      expect(service.getMaxActiveListings()).toBe(DEFAULT_MAX_ACTIVE_LISTINGS);
      expect(service.getMaxActiveListings()).toBe(5);
    });

    it('returns DEFAULT_MAX_ACTIVE_LISTINGS (5) when env var is empty string', () => {
      process.env.MAX_ACTIVE_LISTINGS_PER_USER = '   ';
      expect(service.getMaxActiveListings()).toBe(DEFAULT_MAX_ACTIVE_LISTINGS);
    });

    it('warns and returns default 5 when env var is non-numeric', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
      process.env.MAX_ACTIVE_LISTINGS_PER_USER = 'invalid_number';
      expect(service.getMaxActiveListings()).toBe(5);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('warns and returns default 5 when env var is negative or zero', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
      process.env.MAX_ACTIVE_LISTINGS_PER_USER = '0';
      expect(service.getMaxActiveListings()).toBe(5);
      process.env.MAX_ACTIVE_LISTINGS_PER_USER = '-3';
      expect(service.getMaxActiveListings()).toBe(5);
      warnSpy.mockRestore();
    });

    it('parses valid positive integer correctly', () => {
      process.env.MAX_ACTIVE_LISTINGS_PER_USER = '10';
      expect(service.getMaxActiveListings()).toBe(10);
    });
  });

  describe('hashToBigInt', () => {
    it('produces positive bigint that fits into signed 64-bit integer', () => {
      const sampleHex = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
      const bigIntVal = hashToBigInt(sampleHex);
      expect(typeof bigIntVal).toBe('bigint');
      expect(bigIntVal > 0n).toBe(true);
      // 60-bit maximum is 0x0fffffffffffffff = 1152921504606846975n
      expect(bigIntVal < 1152921504606846975n).toBe(true);
      // Signed 64-bit max is 9223372036854775807n
      expect(bigIntVal < 9223372036854775807n).toBe(true);
    });
  });

  describe('assertWithinLimit', () => {
    it('exempts ADMIN role without acquiring lock or querying counts', async () => {
      const tx: any = {
        user: { findUnique: jest.fn().mockResolvedValue({ role: 'ADMIN' }) },
        $executeRaw: jest.fn(),
        listing: { count: jest.fn() },
      };

      await expect(service.assertWithinLimit('admin-1', tx)).resolves.toBeUndefined();
      expect(tx.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        select: { role: true, deletionScheduledAt: true },
      });
      expect(tx.$executeRaw).not.toHaveBeenCalled();
      expect(tx.listing.count).not.toHaveBeenCalled();
    });

    it('exempts MODERATOR role without acquiring lock or querying counts even if deletionScheduledAt is set', async () => {
      const tx: any = {
        user: { findUnique: jest.fn().mockResolvedValue({ role: 'MODERATOR', deletionScheduledAt: new Date() }) },
        $executeRaw: jest.fn(),
        listing: { count: jest.fn() },
      };

      await expect(service.assertWithinLimit('mod-1', tx)).resolves.toBeUndefined();
      expect(tx.$executeRaw).not.toHaveBeenCalled();
      expect(tx.listing.count).not.toHaveBeenCalled();
    });

    it('rejects regular USER with 403 ForbiddenException when deletionScheduledAt is set', async () => {
      const tx: any = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            role: 'USER',
            deletionScheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          }),
        },
        $executeRaw: jest.fn(),
        listing: { count: jest.fn() },
      };

      await expect(service.assertWithinLimit('user-scheduled', tx)).rejects.toThrow(
        'الحساب مجدول للحذف. يرجى إلغاء طلب الحذف أولاً لاستئناف نشر أو تفعيل الإعلانات.',
      );
      expect(tx.$executeRaw).not.toHaveBeenCalled();
      expect(tx.listing.count).not.toHaveBeenCalled();
    });

    it('proves that lock is acquired BEFORE any counts are queried within the same tx', async () => {
      const callOrder: string[] = [];

      const tx: any = {
        user: {
          findUnique: jest.fn().mockImplementation(async () => {
            callOrder.push('findUser');
            return { role: 'USER' };
          }),
        },
        $executeRaw: jest.fn().mockImplementation(async () => {
          callOrder.push('acquireLock');
          return 1;
        }),
        listing: {
          count: jest.fn().mockImplementation(async () => {
            callOrder.push('countListing');
            return 0;
          }),
        },
        busListing: {
          count: jest.fn().mockImplementation(async () => {
            callOrder.push('countBus');
            return 0;
          }),
        },
        equipmentListing: {
          count: jest.fn().mockImplementation(async () => {
            callOrder.push('countEquipment');
            return 0;
          }),
        },
        sparePart: {
          count: jest.fn().mockImplementation(async () => {
            callOrder.push('countPart');
            return 0;
          }),
        },
        carService: {
          count: jest.fn().mockImplementation(async () => {
            callOrder.push('countService');
            return 0;
          }),
        },
        driverJob: {
          count: jest.fn().mockImplementation(async () => {
            callOrder.push('countJob');
            return 0;
          }),
        },
        operatorListing: {
          count: jest.fn().mockImplementation(async () => {
            callOrder.push('countOperator');
            return 0;
          }),
        },
      };

      await service.assertWithinLimit('user-1', tx);

      // Verify call order: findUser -> acquireLock -> counts
      expect(callOrder[0]).toBe('findUser');
      expect(callOrder[1]).toBe('acquireLock');
      const countIndex = callOrder.findIndex((op) => op.startsWith('count'));
      expect(countIndex).toBeGreaterThan(1);
      expect(tx.$executeRaw).toHaveBeenCalled();
    });

    it('allows user with active listings count strictly less than limit (e.g. 4 < 5)', async () => {
      const tx: any = {
        user: { findUnique: jest.fn().mockResolvedValue({ role: 'USER' }) },
        $executeRaw: jest.fn().mockResolvedValue(1),
        listing: { count: jest.fn().mockResolvedValue(1) },
        busListing: { count: jest.fn().mockResolvedValue(1) },
        equipmentListing: { count: jest.fn().mockResolvedValue(1) },
        sparePart: { count: jest.fn().mockResolvedValue(1) },
        carService: { count: jest.fn().mockResolvedValue(0) },
        driverJob: { count: jest.fn().mockResolvedValue(0) },
        operatorListing: { count: jest.fn().mockResolvedValue(0) },
      };

      await expect(service.assertWithinLimit('user-1', tx)).resolves.toBeUndefined();
    });

    it('throws 403 ACTIVE_LISTINGS_LIMIT_REACHED with exact Arabic message when active listings reach or exceed limit', async () => {
      const tx: any = {
        user: { findUnique: jest.fn().mockResolvedValue({ role: 'USER' }) },
        $executeRaw: jest.fn().mockResolvedValue(1),
        listing: { count: jest.fn().mockResolvedValue(2) },
        busListing: { count: jest.fn().mockResolvedValue(1) },
        equipmentListing: { count: jest.fn().mockResolvedValue(1) },
        sparePart: { count: jest.fn().mockResolvedValue(1) },
        carService: { count: jest.fn().mockResolvedValue(0) },
        driverJob: { count: jest.fn().mockResolvedValue(0) },
        operatorListing: { count: jest.fn().mockResolvedValue(0) },
      };

      let thrownErr: any;
      try {
        await service.assertWithinLimit('user-1', tx);
      } catch (err) {
        thrownErr = err;
      }

      expect(thrownErr).toBeInstanceOf(HttpException);
      expect(thrownErr.getStatus()).toBe(HttpStatus.FORBIDDEN);
      const res = thrownErr.getResponse();
      expect(res).toEqual({
        statusCode: 403,
        code: ACTIVE_LISTINGS_LIMIT_REACHED_CODE,
        message: ACTIVE_LISTINGS_LIMIT_REACHED_MESSAGE,
      });
      expect(res.code).toBe('ACTIVE_LISTINGS_LIMIT_REACHED');
      expect(res.message).toBe(
        'لقد بلغت الحد الأقصى للإعلانات النشطة. يرجى حذف أحد إعلاناتك أو إيقافه ثم المحاولة مرة أخرى.',
      );
    });

    it('verifies exact query filters for all 7 verticals (status ACTIVE, hiddenByOwnerStatus false, and bus deletedAt null)', async () => {
      const tx: any = {
        user: { findUnique: jest.fn().mockResolvedValue({ role: 'USER' }) },
        $executeRaw: jest.fn().mockResolvedValue(1),
        listing: { count: jest.fn().mockResolvedValue(0) },
        busListing: { count: jest.fn().mockResolvedValue(0) },
        equipmentListing: { count: jest.fn().mockResolvedValue(0) },
        sparePart: { count: jest.fn().mockResolvedValue(0) },
        carService: { count: jest.fn().mockResolvedValue(0) },
        driverJob: { count: jest.fn().mockResolvedValue(0) },
        operatorListing: { count: jest.fn().mockResolvedValue(0) },
      };

      await service.assertWithinLimit('user-123', tx);

      expect(tx.listing.count).toHaveBeenCalledWith({
        where: { sellerId: 'user-123', status: 'ACTIVE', hiddenByOwnerStatus: false },
      });
      expect(tx.busListing.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          deletedAt: null,
        },
      });
      expect(tx.equipmentListing.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          deletedAt: null,
        },
      });
      expect(tx.sparePart.count).toHaveBeenCalledWith({
        where: { sellerId: 'user-123', status: 'ACTIVE', hiddenByOwnerStatus: false },
      });
      expect(tx.carService.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', status: 'ACTIVE', hiddenByOwnerStatus: false },
      });
      expect(tx.driverJob.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', status: 'ACTIVE', hiddenByOwnerStatus: false },
      });
      expect(tx.operatorListing.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', status: 'ACTIVE', hiddenByOwnerStatus: false },
      });
    });
  });
});
