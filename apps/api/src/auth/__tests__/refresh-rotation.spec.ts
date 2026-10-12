import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import { AuthTokenService } from '../auth-token.service';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { GeoService } from '../../locations/geo.service';
import { REFRESH_GRACE_SECONDS } from '../auth.constants';

describe('RefreshToken Rotation & Family Tracking Suite', () => {
  let tokenService: AuthTokenService;
  let usersService: UsersService;
  let tokens: any[] = [];
  let users: any[] = [];

  const mockJwt = {
    signAsync: jest.fn().mockResolvedValue('new-jwt-access-token'),
  };

  const mockGeo = {
    validateLocationPair: jest.fn(),
    syncLocation: jest.fn(),
    clearLocation: jest.fn(),
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        return users.find((u) => u.id === where.id) || null;
      }),
    },
    refreshToken: {
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        const row = tokens.find((t) => t.token === where.token || t.id === where.id);
        return row ? { ...row } : null;
      }),
      findFirst: jest.fn().mockImplementation(async ({ where }) => {
        const row = tokens.find((t) => {
          if (where.id && t.id !== where.id) return false;
          if (where.userId && t.userId !== where.userId) return false;
          if (where.revokedAt === null && t.revokedAt !== null) return false;
          return true;
        });
        return row ? { ...row } : null;
      }),
      findMany: jest.fn().mockImplementation(async ({ where }) => {
        const now = new Date();
        return tokens
          .filter((t) => {
            if (where.userId && t.userId !== where.userId) return false;
            if (where.revokedAt === null && t.revokedAt !== null) return false;
            if (where.expiresAt?.gt && !(t.expiresAt > where.expiresAt.gt)) return false;
            return true;
          })
          .map((t) => ({ ...t }));
      }),
      create: jest.fn().mockImplementation(async ({ data }) => {
        const row = {
          id: crypto.randomUUID(),
          familyId: data.familyId || crypto.randomUUID(),
          revokedAt: null,
          rotatedAt: null,
          replacedById: null,
          createdAt: new Date(),
          ...data,
        };
        tokens.push(row);
        return { ...row };
      }),
      update: jest.fn().mockImplementation(async ({ where, data }) => {
        const row = tokens.find((t) => t.id === where.id);
        if (row) {
          Object.assign(row, data);
          return { ...row };
        }
        return null;
      }),
      updateMany: jest.fn().mockImplementation(async ({ where, data }) => {
        let count = 0;
        for (const t of tokens) {
          if (where.id && t.id !== where.id) continue;
          if (where.userId && t.userId !== where.userId) continue;
          if (where.familyId && t.familyId !== where.familyId) continue;
          if (where.revokedAt === null && t.revokedAt !== null) continue;

          Object.assign(t, data);
          count++;
        }
        return { count };
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
    tokens = [];
    users = [
      {
        id: 'u-1',
        email: 'user@example.com',
        username: 'user1',
        role: 'USER',
        isVerified: true,
      },
      {
        id: 'u-unverified',
        email: 'unv@example.com',
        username: 'unv',
        role: 'USER',
        isVerified: false,
      },
    ];
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthTokenService,
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: GeoService, useValue: mockGeo },
      ],
    }).compile();

    tokenService = module.get<AuthTokenService>(AuthTokenService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('1. Normal Rotation', () => {
    it('rotates active token, preserves familyId, marks rotatedAt/replacedById', async () => {
      const rawToken = await tokenService.generateRefreshToken('u-1');
      const originalRow = tokens[0];
      const originalFamilyId = originalRow.familyId;

      expect(originalFamilyId).toBeDefined();
      expect(originalRow.revokedAt).toBeNull();
      expect(originalRow.rotatedAt).toBeNull();

      const result = await tokenService.rotateRefreshToken(rawToken);

      expect(result).not.toBeNull();
      expect(result?.accessToken).toBe('new-jwt-access-token');
      expect(result?.refreshToken).toBeDefined();
      expect(result?.refreshToken).not.toBe(rawToken);

      // Old row must be revoked, rotatedAt set, and replacedById points to new token
      expect(originalRow.revokedAt).not.toBeNull();
      expect(originalRow.rotatedAt).not.toBeNull();
      expect(originalRow.replacedById).toBeDefined();

      // New row must share the same familyId
      const newRow = tokens.find((t) => t.id === originalRow.replacedById);
      expect(newRow).toBeDefined();
      expect(newRow.familyId).toBe(originalFamilyId);
      expect(newRow.revokedAt).toBeNull();
    });
  });

  describe('2. Reuse within 30s grace period', () => {
    it('allows reuse within 30s grace window (concurrency race), issuing new pair without revoking family', async () => {
      const rawToken = await tokenService.generateRefreshToken('u-1');
      const originalFamilyId = tokens[0].familyId;

      // First rotation succeeds
      const firstRotation = await tokenService.rotateRefreshToken(rawToken);
      expect(firstRotation).not.toBeNull();

      // Old row rotatedAt is set to now
      expect(tokens[0].rotatedAt).not.toBeNull();

      // Second rotation with the SAME raw token within 30s grace period (e.g. 5s later)
      const secondRotation = await tokenService.rotateRefreshToken(rawToken);

      expect(secondRotation).not.toBeNull();
      expect(secondRotation?.accessToken).toBe('new-jwt-access-token');
      expect(secondRotation?.refreshToken).toBeDefined();

      // Family was NOT revoked! Active tokens still exist in the family
      const activeInFamily = tokens.filter((t) => t.familyId === originalFamilyId && t.revokedAt === null);
      expect(activeInFamily.length).toBeGreaterThan(0);
    });
  });

  describe('3. Reuse after 30s grace period (Malicious Reuse)', () => {
    it('revokes the entire family and returns null when rotated token is reused after 30s', async () => {
      const rawToken = await tokenService.generateRefreshToken('u-1');
      const originalFamilyId = tokens[0].familyId;

      // Normal rotation
      await tokenService.rotateRefreshToken(rawToken);

      // Artificially age rotatedAt past the 30-second grace window (e.g. 45 seconds ago)
      tokens[0].rotatedAt = new Date(Date.now() - (REFRESH_GRACE_SECONDS + 15) * 1000);

      // Attacker tries to use the old rotated token
      const maliciousResult = await tokenService.rotateRefreshToken(rawToken);

      expect(maliciousResult).toBeNull();

      // ENTIRE FAMILY REVOKED
      const activeInFamily = tokens.filter((t) => t.familyId === originalFamilyId && t.revokedAt === null);
      expect(activeInFamily.length).toBe(0);
    });
  });

  describe('4. Token after logout (explicit revocation)', () => {
    it('fails without revoking family when token was explicitly revoked (rotatedAt is null)', async () => {
      const rawToken1 = await tokenService.generateRefreshToken('u-1');
      const familyId = tokens[0].familyId;
      const rawToken2 = await tokenService.generateRefreshToken('u-1', familyId);

      // Simulate explicit logout: revoke token 1 with rotatedAt remaining null
      await tokenService.revokeRefreshToken(rawToken1);
      expect(tokens[0].revokedAt).not.toBeNull();
      expect(tokens[0].rotatedAt).toBeNull();

      // Trying to refresh with the logged out token returns null
      const res = await tokenService.rotateRefreshToken(rawToken1);
      expect(res).toBeNull();

      // Token 2 in the same family was NOT affected
      const token2Row = tokens.find((t) => t.familyId === familyId && t.id !== tokens[0].id);
      expect(token2Row.revokedAt).toBeNull();
    });
  });

  describe('5. Unverified user token consumption protection', () => {
    it('unverified user fails rotation without consuming or revoking the token', async () => {
      const rawToken = await tokenService.generateRefreshToken('u-unverified');
      const tokenRow = tokens[0];

      expect(tokenRow.revokedAt).toBeNull();

      const res = await tokenService.rotateRefreshToken(rawToken);

      expect(res).toBeNull();
      // Token must NOT be consumed or revoked
      expect(tokenRow.revokedAt).toBeNull();
      expect(tokenRow.rotatedAt).toBeNull();
    });
  });

  describe('6. Concurrent rotation race condition', () => {
    it('handles two simultaneous calls where one succeeds and the other gets grace period behavior', async () => {
      const rawToken = await tokenService.generateRefreshToken('u-1');

      // Run two parallel calls
      const [res1, res2] = await Promise.all([
        tokenService.rotateRefreshToken(rawToken),
        tokenService.rotateRefreshToken(rawToken),
      ]);

      // Both callers get valid tokens (one rotated, one grace period)
      expect(res1).not.toBeNull();
      expect(res2).not.toBeNull();
    });
  });

  describe('7. UsersService.revokeSession', () => {
    it('revokes the entire family when a session is revoked', async () => {
      const rawToken1 = await tokenService.generateRefreshToken('u-1');
      const familyId = tokens[0].familyId;
      const rawToken2 = await tokenService.generateRefreshToken('u-1', familyId);

      expect(tokens.filter((t) => t.familyId === familyId && t.revokedAt === null).length).toBe(2);

      // Revoke session 1
      const res = await usersService.revokeSession('u-1', tokens[0].id);
      expect(res.message).toBe('تم إنهاء الجلسة بنجاح');

      // Both tokens in the family are revoked
      const activeInFamily = tokens.filter((t) => t.familyId === familyId && t.revokedAt === null);
      expect(activeInFamily.length).toBe(0);
    });

    it('getActiveSessions deduplicates by familyId', async () => {
      const familyId = crypto.randomUUID();
      await tokenService.generateRefreshToken('u-1', familyId);
      await tokenService.generateRefreshToken('u-1', familyId);

      const active = await usersService.getActiveSessions('u-1');
      // Even if 2 rows exist in the family, only 1 is listed
      expect(active.length).toBe(1);
    });
  });
});
