import { HttpException, HttpStatus, Logger, ForbiddenException } from '@nestjs/common';
import {
  ActiveListingsLimitService,
  DEFAULT_MAX_DAILY_PUBLISHES,
  DEFAULT_MAX_MONTHLY_PUBLISHES,
  PUBLISH_RATE_LIMIT_DAILY_CODE,
  PUBLISH_RATE_LIMIT_MONTHLY_CODE,
  TIMEZONE,
  getCairoWindows,
  hashToBigInt,
} from '../active-listings-limit.service';

describe('ActiveListingsLimitService (D-223)', () => {
  let service: ActiveListingsLimitService;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.MAX_PUBLISHES_PER_DAY;
    delete process.env.MAX_PUBLISHES_PER_MONTH;
    delete process.env.MAX_ACTIVE_LISTINGS_PER_USER;
    service = new ActiveListingsLimitService();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getCairoWindows', () => {
    it('computes valid startOfDay and startOfMonth in Africa/Cairo timezone', () => {
      const fixedDate = new Date('2026-11-05T14:30:00Z');
      const windows = getCairoWindows(fixedDate);

      // Verify that startOfDay in Cairo time corresponds to 00:00:00
      const dayParts = new Intl.DateTimeFormat('en-US', {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(windows.startOfDay);
      const dayHour = dayParts.find((p) => p.type === 'hour')?.value;
      const dayMinute = dayParts.find((p) => p.type === 'minute')?.value;
      expect(`${dayHour}:${dayMinute}`).toBe('00:00');

      // Verify that startOfMonth is on the 1st of the month at 00:00
      const monthParts = new Intl.DateTimeFormat('en-US', {
        timeZone: TIMEZONE,
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(windows.startOfMonth);
      const monthDay = monthParts.find((p) => p.type === 'day')?.value;
      const monthHour = monthParts.find((p) => p.type === 'hour')?.value;
      const monthMinute = monthParts.find((p) => p.type === 'minute')?.value;
      expect(monthDay).toBe('1');
      expect(`${monthHour}:${monthMinute}`).toBe('00:00');

      // Verify resetsAt is strictly greater than start
      expect(windows.resetDay.getTime()).toBeGreaterThan(windows.startOfDay.getTime());
      expect(windows.resetMonth.getTime()).toBeGreaterThan(windows.startOfMonth.getTime());
    });
  });

  describe('getMaxDailyPublishes & getMaxMonthlyPublishes', () => {
    it('returns default limits (20 daily, 300 monthly) when env vars are unset', () => {
      expect(service.getMaxDailyPublishes()).toBe(DEFAULT_MAX_DAILY_PUBLISHES);
      expect(service.getMaxDailyPublishes()).toBe(20);
      expect(service.getMaxMonthlyPublishes()).toBe(DEFAULT_MAX_MONTHLY_PUBLISHES);
      expect(service.getMaxMonthlyPublishes()).toBe(300);
    });

    it('returns default limits when env vars are whitespace or empty string', () => {
      process.env.MAX_PUBLISHES_PER_DAY = '   ';
      process.env.MAX_PUBLISHES_PER_MONTH = '';
      expect(service.getMaxDailyPublishes()).toBe(20);
      expect(service.getMaxMonthlyPublishes()).toBe(300);
    });

    it('warns and returns default limits when env vars are non-numeric or <= 0', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
      process.env.MAX_PUBLISHES_PER_DAY = 'invalid';
      process.env.MAX_PUBLISHES_PER_MONTH = '-5';
      expect(service.getMaxDailyPublishes()).toBe(20);
      expect(service.getMaxMonthlyPublishes()).toBe(300);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('parses valid positive integer overrides correctly', () => {
      process.env.MAX_PUBLISHES_PER_DAY = '50';
      process.env.MAX_PUBLISHES_PER_MONTH = '500';
      expect(service.getMaxDailyPublishes()).toBe(50);
      expect(service.getMaxMonthlyPublishes()).toBe(500);
    });
  });

  describe('hashToBigInt', () => {
    it('produces positive bigint that fits into signed 64-bit integer for pg advisory lock', () => {
      const sampleHex = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
      const bigIntVal = hashToBigInt(sampleHex);
      expect(typeof bigIntVal).toBe('bigint');
      expect(bigIntVal > 0n).toBe(true);
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

      await expect(service.assertWithinLimit('admin-1', tx, 'cars')).resolves.toBeUndefined();
      expect(tx.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        select: { role: true, deletionScheduledAt: true },
      });
      expect(tx.$executeRaw).not.toHaveBeenCalled();
      expect(tx.listing.count).not.toHaveBeenCalled();
    });

    it('exempts MODERATOR role without acquiring lock even if deletionScheduledAt is set', async () => {
      const tx: any = {
        user: { findUnique: jest.fn().mockResolvedValue({ role: 'MODERATOR', deletionScheduledAt: new Date() }) },
        $executeRaw: jest.fn(),
        busListing: { count: jest.fn() },
      };

      await expect(service.assertWithinLimit('mod-1', tx, 'buses')).resolves.toBeUndefined();
      expect(tx.$executeRaw).not.toHaveBeenCalled();
      expect(tx.busListing.count).not.toHaveBeenCalled();
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

      await expect(service.assertWithinLimit('user-scheduled', tx, 'cars')).rejects.toThrow(
        ForbiddenException,
      );
      expect(tx.$executeRaw).not.toHaveBeenCalled();
      expect(tx.listing.count).not.toHaveBeenCalled();
    });

    it('acquires transactional lock publish_rate_limit:<userId> before querying counts', async () => {
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
      };

      await service.assertWithinLimit('user-1', tx, 'cars');

      expect(callOrder[0]).toBe('findUser');
      expect(callOrder[1]).toBe('acquireLock');
      expect(callOrder[2]).toBe('countListing');
      expect(tx.$executeRaw).toHaveBeenCalled();
    });

    it('allows publishing when daily and monthly counts are below limits (e.g. 19 daily, 299 monthly)', async () => {
      const tx: any = {
        user: { findUnique: jest.fn().mockResolvedValue({ role: 'USER' }) },
        $executeRaw: jest.fn().mockResolvedValue(1),
        listing: {
          count: jest
            .fn()
            .mockResolvedValueOnce(19) // dailyCount
            .mockResolvedValueOnce(299), // monthlyCount
        },
      };

      await expect(service.assertWithinLimit('user-1', tx, 'cars')).resolves.toBeUndefined();
    });

    it('throws 429 TooManyRequests with PUBLISH_RATE_LIMIT_DAILY_REACHED when daily limit (20) reached', async () => {
      const tx: any = {
        user: { findUnique: jest.fn().mockResolvedValue({ role: 'USER' }) },
        $executeRaw: jest.fn().mockResolvedValue(1),
        listing: {
          count: jest.fn().mockResolvedValueOnce(20), // daily count = 20
        },
      };

      let error: any;
      try {
        await service.assertWithinLimit('user-1', tx, 'cars');
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      const res = error.getResponse();
      expect(res.code).toBe(PUBLISH_RATE_LIMIT_DAILY_CODE);
      expect(res.window).toBe('DAILY');
      expect(res.vertical).toBe('cars');
      expect(res.limit).toBe(20);
      expect(res.message).toContain('لقد بلغت الحد الأقصى للنشر اليومي');
      expect(res.resetsAt).toBeDefined();
    });

    it('throws 429 TooManyRequests with PUBLISH_RATE_LIMIT_MONTHLY_REACHED when monthly limit (300) reached', async () => {
      const tx: any = {
        user: { findUnique: jest.fn().mockResolvedValue({ role: 'USER' }) },
        $executeRaw: jest.fn().mockResolvedValue(1),
        sparePart: {
          count: jest
            .fn()
            .mockResolvedValueOnce(10) // daily count = 10 (ok)
            .mockResolvedValueOnce(300), // monthly count = 300 (exceeded)
        },
      };

      let error: any;
      try {
        await service.assertWithinLimit('user-1', tx, 'parts');
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      const res = error.getResponse();
      expect(res.code).toBe(PUBLISH_RATE_LIMIT_MONTHLY_CODE);
      expect(res.window).toBe('MONTHLY');
      expect(res.vertical).toBe('parts');
      expect(res.limit).toBe(300);
      expect(res.message).toContain('لقد بلغت الحد الأقصى للنشر الشهري');
      expect(res.resetsAt).toBeDefined();
    });

    it('enforces limits strictly PER SECTION (vertical isolation)', async () => {
      // User reached 20 in cars, but has 0 in buses
      const tx: any = {
        user: { findUnique: jest.fn().mockResolvedValue({ role: 'USER' }) },
        $executeRaw: jest.fn().mockResolvedValue(1),
        busListing: {
          count: jest.fn().mockResolvedValue(0),
        },
      };

      // Calling for 'buses' succeeds even though 'cars' might have been capped
      await expect(service.assertWithinLimit('user-1', tx, 'buses')).resolves.toBeUndefined();
      expect(tx.busListing.count).toHaveBeenCalled();
    });
  });
});
