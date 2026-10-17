import { Test, TestingModule } from '@nestjs/testing';
import { BanBlacklistKind, AuthProvider } from '@prisma/client';
import {
  BanBlacklistService,
  computeBanBlacklistHash,
} from './ban-blacklist.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BanBlacklistService', () => {
  let service: BanBlacklistService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      banBlacklistEntry: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BanBlacklistService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<BanBlacklistService>(BanBlacklistService);
  });

  describe('computeBanBlacklistHash and domain separation', () => {
    it('produces a hex hash that does NOT match the raw phone or raw googleId', () => {
      const rawPhone = '+96891234567';
      const rawGoogleId = 'google-sub-123456';

      const phoneHash = service.hashPhone(rawPhone);
      const googleHash = service.hashGoogle(rawGoogleId);

      expect(phoneHash).not.toBe(rawPhone);
      expect(googleHash).not.toBe(rawGoogleId);
      expect(phoneHash).toMatch(/^[a-f0-9]{64}$/);
      expect(googleHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('changing pepper completely changes the generated hash', () => {
      const rawPhone = '+96891234567';
      const pepper1 = 'test-pepper-1-minimum-32-chars-length!!';
      const pepper2 = 'test-pepper-2-minimum-32-chars-length!!';

      const hash1 = service.hashPhone(rawPhone, pepper1);
      const hash2 = service.hashPhone(rawPhone, pepper2);

      expect(hash1).not.toBe(hash2);
    });

    it('enforces domain separation: same input gives different hashes for PHONE and GOOGLE', () => {
      const raw = '123456789';
      const pepper = 'test-pepper-domain-sep-32-chars-length!';

      const phoneHash = computeBanBlacklistHash('PHONE', raw, pepper);
      const googleHash = computeBanBlacklistHash('GOOGLE', raw, pepper);

      expect(phoneHash).not.toBe(googleHash);
    });
  });

  describe('addForUser', () => {
    it('throws an error if user.id is missing or empty', async () => {
      const mockTx = {} as any;
      await expect(service.addForUser(mockTx, null as any, 'reason')).rejects.toThrow(
        'user.id is required for addForUser',
      );
      await expect(service.addForUser(mockTx, {} as any, 'reason')).rejects.toThrow(
        'user.id is required for addForUser',
      );
      await expect(service.addForUser(mockTx, { id: '   ' } as any, 'reason')).rejects.toThrow(
        'user.id is required for addForUser',
      );
    });

    it('creates blacklist entries for both phone and google identities idempotently', async () => {
      const mockTx = {
        authIdentity: {
          findMany: jest.fn().mockResolvedValue([
            {
              providerUserId: 'google-sub-from-auth-ident',
            },
          ]),
        },
        banBlacklistEntry: {
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      } as any;

      const user = {
        id: 'u-123',
        phoneE164: '+96891234567',
        googleId: 'google-sub-direct',
      };

      const count = await service.addForUser(mockTx, user, 'Repeated abuse');

      expect(count).toBe(2);
      expect(mockTx.banBlacklistEntry.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            kind: BanBlacklistKind.PHONE,
            userId: 'u-123',
            reason: 'Repeated abuse',
          }),
          expect.objectContaining({
            kind: BanBlacklistKind.GOOGLE,
            userId: 'u-123',
            reason: 'Repeated abuse',
          }),
        ]),
        skipDuplicates: true,
      });
      expect(mockTx.authIdentity.findMany).toHaveBeenCalledWith({
        where: { userId: 'u-123', provider: AuthProvider.GOOGLE },
        select: { providerUserId: true },
      });
    });

    it('creates blacklist entries for both user.googleId and distinct auth identity with provider GOOGLE proving both hashes are written', async () => {
      const rawGoogleId = 'google-sub-primary-111';
      const secondaryGoogleSub = 'google-sub-linked-secondary-222';

      const mockTx = {
        authIdentity: {
          findMany: jest.fn().mockResolvedValue([
            { providerUserId: secondaryGoogleSub },
          ]),
        },
        banBlacklistEntry: {
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      } as any;

      const user = {
        id: 'u-multi-google',
        phoneE164: null,
        googleId: rawGoogleId,
      };

      const count = await service.addForUser(mockTx, user, 'Multiple google ids ban');

      expect(count).toBe(2);
      expect(mockTx.authIdentity.findMany).toHaveBeenCalledWith({
        where: { userId: 'u-multi-google', provider: AuthProvider.GOOGLE },
        select: { providerUserId: true },
      });

      const hashPrimary = service.hashGoogle(rawGoogleId);
      const hashSecondary = service.hashGoogle(secondaryGoogleSub);
      expect(hashPrimary).not.toBe(hashSecondary);

      expect(mockTx.banBlacklistEntry.createMany).toHaveBeenCalledWith({
        data: [
          {
            kind: BanBlacklistKind.GOOGLE,
            hash: hashPrimary,
            userId: 'u-multi-google',
            reason: 'Multiple google ids ban',
          },
          {
            kind: BanBlacklistKind.GOOGLE,
            hash: hashSecondary,
            userId: 'u-multi-google',
            reason: 'Multiple google ids ban',
          },
        ],
        skipDuplicates: true,
      });
    });

    it('returns 0 when user has neither phoneE164 nor googleId nor auth identities', async () => {
      const mockTx = {
        authIdentity: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        banBlacklistEntry: {
          createMany: jest.fn(),
        },
      } as any;

      const user = {
        id: 'u-empty',
        phoneE164: null,
        googleId: null,
      };

      const count = await service.addForUser(mockTx, user, 'No identity ban');

      expect(count).toBe(0);
      expect(mockTx.banBlacklistEntry.createMany).not.toHaveBeenCalled();
    });
  });

  describe('removeForUser', () => {
    it('throws an error if user.id is missing or empty to prevent unconstrained deletion', async () => {
      const mockTx = {} as any;
      await expect(service.removeForUser(mockTx, null as any)).rejects.toThrow(
        'user.id is required for removeForUser',
      );
      await expect(service.removeForUser(mockTx, {} as any)).rejects.toThrow(
        'user.id is required for removeForUser',
      );
      await expect(service.removeForUser(mockTx, { id: '' } as any)).rejects.toThrow(
        'user.id is required for removeForUser',
      );
    });

    it('removes entries where userId matches, and leaves userId: null intact', async () => {
      const mockTx = {
        banBlacklistEntry: {
          deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      } as any;

      const user = {
        id: 'u-unban',
        phoneE164: '+96891234567',
      };

      const count = await service.removeForUser(mockTx, user);

      expect(count).toBe(2);
      expect(mockTx.banBlacklistEntry.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u-unban' },
      });
    });
  });

  describe('isBlocked, isPhoneBlocked, isGoogleBlocked', () => {
    it('returns true when phone is blacklisted', async () => {
      mockPrisma.banBlacklistEntry.findUnique.mockResolvedValueOnce({
        id: 'b-1',
      });

      const blocked = await service.isPhoneBlocked('+96891234567');
      expect(blocked).toBe(true);
      expect(mockPrisma.banBlacklistEntry.findUnique).toHaveBeenCalledWith({
        where: {
          kind_hash: {
            kind: BanBlacklistKind.PHONE,
            hash: expect.any(String),
          },
        },
        select: { id: true },
      });
    });

    it('returns false when phone is not blacklisted', async () => {
      mockPrisma.banBlacklistEntry.findUnique.mockResolvedValueOnce(null);

      const blocked = await service.isPhoneBlocked('+96891234567');
      expect(blocked).toBe(false);
    });

    it('returns true when googleId is blacklisted', async () => {
      mockPrisma.banBlacklistEntry.findUnique.mockResolvedValueOnce({
        id: 'b-2',
      });

      const blocked = await service.isGoogleBlocked('google-sub-banned');
      expect(blocked).toBe(true);
      expect(mockPrisma.banBlacklistEntry.findUnique).toHaveBeenCalledWith({
        where: {
          kind_hash: {
            kind: BanBlacklistKind.GOOGLE,
            hash: expect.any(String),
          },
        },
        select: { id: true },
      });
    });

    it('isBlocked checks both phone and googleId correctly', async () => {
      jest.spyOn(service, 'isPhoneBlocked').mockResolvedValueOnce(false);
      jest.spyOn(service, 'isGoogleBlocked').mockResolvedValueOnce(true);

      const res = await service.isBlocked({
        phoneE164: '+96891234567',
        googleId: 'google-sub-999',
      });

      expect(res).toBe(true);
    });
  });
});
