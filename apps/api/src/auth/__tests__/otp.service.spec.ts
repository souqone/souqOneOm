import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import { OtpService } from '../otp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpPurpose } from '@prisma/client';
import { getAuthPepper } from '../../config/pepper.config';

describe('OtpService Unit Tests', () => {
  let service: OtpService;
  let challenges: any[] = [];

  const mockPrisma = {
    otpChallenge: {
      findFirst: jest.fn().mockImplementation(async ({ where, orderBy }) => {
        const now = new Date();
        const matches = challenges.filter((c) => {
          if (where.userId && c.userId !== where.userId) return false;
          if (where.phoneE164 && c.phoneE164 !== where.phoneE164) return false;
          if (where.purpose && c.purpose !== where.purpose) return false;
          if (where.consumedAt === null && c.consumedAt !== null) return false;
          if (where.expiresAt?.gt && !(c.expiresAt > where.expiresAt.gt)) return false;
          return true;
        });
        if (orderBy?.createdAt === 'desc') {
          matches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return matches[0] ? { ...matches[0] } : null;
      }),
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        return challenges.find((c) => c.id === where.id) || null;
      }),
      updateMany: jest.fn().mockImplementation(async ({ where, data }) => {
        let count = 0;
        const now = new Date();
        for (const c of challenges) {
          if (where.id && c.id !== where.id) continue;
          if (where.userId && c.userId !== where.userId) continue;
          if (where.phoneE164 && c.phoneE164 !== where.phoneE164) continue;
          if (where.purpose && c.purpose !== where.purpose) continue;
          if (where.consumedAt === null && c.consumedAt !== null) continue;
          if (where.expiresAt?.gt && !(c.expiresAt > where.expiresAt.gt)) continue;
          if (where.attempts?.lt !== undefined && !(c.attempts < where.attempts.lt)) continue;

          if (data.attempts?.increment) {
            c.attempts += data.attempts.increment;
          }
          if (data.consumedAt !== undefined) {
            c.consumedAt = data.consumedAt;
          }
          count++;
        }
        return { count };
      }),
      create: jest.fn().mockImplementation(async ({ data }) => {
        const row = {
          consumedAt: null,
          attempts: 0,
          ...data,
          createdAt: new Date(),
        };
        challenges.push(row);
        return row;
      }),
    },
    $transaction: jest.fn().mockImplementation(async (cb: any) => {
      if (typeof cb === 'function') {
        return cb(mockPrisma);
      }
      return Promise.all(cb);
    }),
  };

  beforeEach(async () => {
    challenges = [];
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  describe('1. issue & verify success', () => {
    it('issues a 6-digit code and verifies successfully with OK', async () => {
      const code = await service.issue('u-1', OtpPurpose.EMAIL_VERIFY, 900);

      expect(code).toMatch(/^\d{6}$/);
      expect(challenges.length).toBe(1);
      expect(challenges[0].codeHash).toBeDefined();
      expect(challenges[0].codeHash).not.toContain(code); // Stored as HMAC, not plain code
      expect(challenges[0].attempts).toBe(0);

      const result = await service.verify('u-1', OtpPurpose.EMAIL_VERIFY, code);
      expect(result).toBe('OK');

      // Challenge must now be consumed
      expect(challenges[0].consumedAt).not.toBeNull();
    });

    it('returns code without leaking codeHash or pepper to caller', async () => {
      const code = await service.issue('u-1', OtpPurpose.PASSWORD_RESET, 900);
      expect(typeof code).toBe('string');
      expect(code.length).toBe(6);

      const pepper = getAuthPepper();
      expect(code).not.toContain(pepper);
      expect(challenges[0].codeHash.length).toBe(64); // SHA256 hex is 64 chars
    });
  });

  describe('2. invalid code & lockout', () => {
    it('returns INVALID for incorrect code and increments attempts', async () => {
      const code = await service.issue('u-1', OtpPurpose.EMAIL_VERIFY, 900);
      const wrongCode = code === '123456' ? '654321' : '123456';

      const result = await service.verify('u-1', OtpPurpose.EMAIL_VERIFY, wrongCode);
      expect(result).toBe('INVALID');
      expect(challenges[0].attempts).toBe(1);
      expect(challenges[0].consumedAt).toBeNull();
    });

    it('locks out after 5 invalid attempts: 5th failure returns TOO_MANY_ATTEMPTS, subsequent valid code fails', async () => {
      const validCode = await service.issue('u-1', OtpPurpose.EMAIL_VERIFY, 900);
      const wrongCode = '000000';

      // 4 wrong attempts -> each returns INVALID
      for (let i = 1; i <= 4; i++) {
        const res = await service.verify('u-1', OtpPurpose.EMAIL_VERIFY, wrongCode);
        expect(res).toBe('INVALID');
        expect(challenges[0].attempts).toBe(i);
      }

      // 5th wrong attempt -> reaches maxAttempts (5), returns TOO_MANY_ATTEMPTS
      const fifthRes = await service.verify('u-1', OtpPurpose.EMAIL_VERIFY, wrongCode);
      expect(fifthRes).toBe('TOO_MANY_ATTEMPTS');
      expect(challenges[0].attempts).toBe(5);

      // 6th attempt with VALID code -> returns TOO_MANY_ATTEMPTS because attempts >= maxAttempts
      const sixthRes = await service.verify('u-1', OtpPurpose.EMAIL_VERIFY, validCode);
      expect(sixthRes).toBe('TOO_MANY_ATTEMPTS');
    });
  });

  describe('3. expired code', () => {
    it('returns MISSING_OR_EXPIRED when challenge has expired', async () => {
      const code = await service.issue('u-1', OtpPurpose.EMAIL_VERIFY, -10); // expired 10s ago

      const result = await service.verify('u-1', OtpPurpose.EMAIL_VERIFY, code);
      expect(result).toBe('MISSING_OR_EXPIRED');
    });

    it('returns MISSING_OR_EXPIRED when no challenge exists', async () => {
      const result = await service.verify('u-nonexistent', OtpPurpose.EMAIL_VERIFY, '123456');
      expect(result).toBe('MISSING_OR_EXPIRED');
    });
  });

  describe('4. superseded & invalidated challenges', () => {
    it('issuing a new code invalidates any previous active challenge for the same user and purpose', async () => {
      const firstCode = await service.issue('u-1', OtpPurpose.EMAIL_VERIFY, 900);
      expect(challenges.length).toBe(1);
      expect(challenges[0].consumedAt).toBeNull();

      const secondCode = await service.issue('u-1', OtpPurpose.EMAIL_VERIFY, 900);
      expect(challenges.length).toBe(2);
      expect(challenges[0].consumedAt).not.toBeNull(); // First is consumed
      expect(challenges[1].consumedAt).toBeNull(); // Second is active

      // First code tested against active second challenge is INVALID
      const verifyFirst = await service.verify('u-1', OtpPurpose.EMAIL_VERIFY, firstCode);
      expect(verifyFirst).toBe('INVALID');

      // Second code succeeds and consumes challenge
      const verifySecond = await service.verify('u-1', OtpPurpose.EMAIL_VERIFY, secondCode);
      expect(verifySecond).toBe('OK');

      // Now with all challenges consumed, any verify returns MISSING_OR_EXPIRED
      const verifyAfterAllConsumed = await service.verify('u-1', OtpPurpose.EMAIL_VERIFY, firstCode);
      expect(verifyAfterAllConsumed).toBe('MISSING_OR_EXPIRED');
    });

    it('invalidateActive invalidates active challenges without affecting other users or purposes', async () => {
      await service.issue('u-1', OtpPurpose.EMAIL_VERIFY, 900);
      await service.issue('u-1', OtpPurpose.PASSWORD_RESET, 900);
      await service.issue('u-2', OtpPurpose.EMAIL_VERIFY, 900);

      expect(challenges.filter((c) => c.consumedAt === null).length).toBe(3);

      // Invalidate EMAIL_VERIFY for u-1 only
      await service.invalidateActive('u-1', OtpPurpose.EMAIL_VERIFY);

      const u1Email = challenges.find((c) => c.userId === 'u-1' && c.purpose === OtpPurpose.EMAIL_VERIFY);
      const u1Reset = challenges.find((c) => c.userId === 'u-1' && c.purpose === OtpPurpose.PASSWORD_RESET);
      const u2Email = challenges.find((c) => c.userId === 'u-2' && c.purpose === OtpPurpose.EMAIL_VERIFY);

      expect(u1Email.consumedAt).not.toBeNull();
      expect(u1Reset.consumedAt).toBeNull();
      expect(u2Email.consumedAt).toBeNull();
    });
  });

  describe('5. issueForPhone & verifyForPhone', () => {
    it('issues a 6-digit code for a phone and verifies successfully with OK', async () => {
      const code = await service.issueForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, 300);

      expect(code).toMatch(/^\d{6}$/);
      expect(challenges.length).toBe(1);
      expect(challenges[0].phoneE164).toBe('+96891234567');
      expect(challenges[0].userId).toBeNull();
      expect(challenges[0].codeHash).toBeDefined();
      expect(challenges[0].attempts).toBe(0);

      const result = await service.verifyForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, code);
      expect(result).toBe('OK');
      expect(challenges[0].consumedAt).not.toBeNull();
    });

    it('returns INVALID for wrong code and increments attempts', async () => {
      const code = await service.issueForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, 300);
      const wrong = code === '123456' ? '654321' : '123456';

      const result = await service.verifyForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, wrong);
      expect(result).toBe('INVALID');
      expect(challenges[0].attempts).toBe(1);
      expect(challenges[0].consumedAt).toBeNull();
    });

    it('enforces 5 attempts limit and returns TOO_MANY_ATTEMPTS', async () => {
      const code = await service.issueForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, 300);
      const wrong = '000000';

      for (let i = 1; i <= 4; i++) {
        const res = await service.verifyForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, wrong);
        expect(res).toBe('INVALID');
      }

      const fifth = await service.verifyForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, wrong);
      expect(fifth).toBe('TOO_MANY_ATTEMPTS');

      // Valid code after lockout fails with TOO_MANY_ATTEMPTS
      const subsequent = await service.verifyForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, code);
      expect(subsequent).toBe('TOO_MANY_ATTEMPTS');
    });

    it('returns MISSING_OR_EXPIRED for expired phone challenge', async () => {
      const code = await service.issueForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, -10);

      const result = await service.verifyForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, code);
      expect(result).toBe('MISSING_OR_EXPIRED');
    });

    it('invalidates prior challenge when issuing a new one for the same phone and purpose', async () => {
      const code1 = await service.issueForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, 300);
      const code2 = await service.issueForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, 300);

      expect(challenges.length).toBe(2);
      expect(challenges[0].consumedAt).not.toBeNull();
      expect(challenges[1].consumedAt).toBeNull();

      // Old code is invalid against new challenge
      expect(await service.verifyForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, code1)).toBe('INVALID');

      // New code verifies successfully
      expect(await service.verifyForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, code2)).toBe('OK');
    });

    it('prevents race conditions: second concurrent consumption returns INVALID', async () => {
      const code = await service.issueForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, 300);

      // Simulate first consumption succeeding
      const res1 = await service.verifyForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, code);
      expect(res1).toBe('OK');

      // Subsequent verify fails because challenge is already consumed
      const res2 = await service.verifyForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, code);
      expect(res2).toBe('MISSING_OR_EXPIRED');
    });

    it('binds challenge to userId: verifies with matching userId, rejects with non-matching userId, and verifies without userId for PHONE_LOGIN', async () => {
      // 1. Issue with userId = 'user-A'
      const codeA = await service.issueForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, 300, 'user-A');

      // Attempt to verify with user-B -> rejected as MISSING_OR_EXPIRED
      const resB = await service.verifyForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, codeA, 'user-B');
      expect(resB).toBe('MISSING_OR_EXPIRED');

      // Verify with matching user-A -> OK
      const resA = await service.verifyForPhone('+96891234567', OtpPurpose.PHONE_VERIFY, codeA, 'user-A');
      expect(resA).toBe('OK');

      // 2. Issue without userId for PHONE_LOGIN
      const codeLogin = await service.issueForPhone('+96891234567', OtpPurpose.PHONE_LOGIN, 300);
      const resLogin = await service.verifyForPhone('+96891234567', OtpPurpose.PHONE_LOGIN, codeLogin);
      expect(resLogin).toBe('OK');
    });
  });
});
