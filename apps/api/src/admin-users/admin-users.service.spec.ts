import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccountStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AdminUsersService } from './admin-users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokenService } from '../auth/auth-token.service';
import { AccessTokenGate } from '../auth/access-token-gate.service';
import { ChatGateway } from '../chat/chat.gateway';
import { AdminAuditService } from '../admin-audit/admin-audit.service';
import {
  USER_SUSPEND,
  USER_UNSUSPEND,
  USER_BAN,
  USER_UNBAN,
  ROLE_CHANGE,
} from '../admin-audit/admin-audit-actions.constant';
import { USER_STATUS_CHANGED } from '../common/events/user-status.events';
import type { JwtPayload } from '../auth/auth.types';
import { BanBlacklistService } from '../ban-blacklist/ban-blacklist.service';

describe('AdminUsersService', () => {
  let service: AdminUsersService;

  const mockBanBlacklistService: any = {
    addForUser: jest.fn().mockResolvedValue(1),
    removeForUser: jest.fn().mockResolvedValue(1),
    isPhoneBlocked: jest.fn().mockResolvedValue(false),
    isGoogleBlocked: jest.fn().mockResolvedValue(false),
  };

  const mockPrisma: any = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      count: jest.fn(),
    },
    adminAuditLog: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'mock-user-id', pg_advisory_xact_lock: null }]),
    $transaction: jest.fn().mockImplementation(async (cb: any) => {
      if (typeof cb === 'function') {
        return cb(mockPrisma);
      }
      return Promise.all(cb);
    }),
  };

  const mockTokenService: any = {
    revokeAllRefreshTokens: jest.fn().mockResolvedValue(undefined),
  };

  const mockAccessTokenGate: any = {
    invalidate: jest.fn().mockResolvedValue(undefined),
  };

  const mockChatGateway: any = {
    disconnectUser: jest.fn().mockResolvedValue(undefined),
  };

  const mockAdminAuditService: any = {
    record: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
  };

  const mockEventEmitter: any = {
    emit: jest.fn(),
  };

  const adminJwt: JwtPayload = {
    sub: 'admin-uuid-1',
    role: UserRole.ADMIN,
    email: 'admin@example.test',
  };

  const moderatorJwt: JwtPayload = {
    sub: 'mod-uuid-2',
    role: UserRole.MODERATOR,
    email: 'mod@example.test',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$queryRaw.mockResolvedValue([{ id: 'mock-user-id', pg_advisory_xact_lock: null }]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthTokenService, useValue: mockTokenService },
        { provide: AccessTokenGate, useValue: mockAccessTokenGate },
        { provide: ChatGateway, useValue: mockChatGateway },
        { provide: AdminAuditService, useValue: mockAdminAuditService },
        { provide: BanBlacklistService, useValue: mockBanBlacklistService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
  });

  /* ══════════════════════════════════════════════════════════════
     1. READ ENDPOINTS TESTS
     ══════════════════════════════════════════════════════════════ */

  describe('listUsers', () => {
    it('returns users list with masked email and phone, and nextCursor', async () => {
      const mockUsers = [
        {
          id: 'u-1',
          username: 'first_user',
          displayName: 'First User',
          avatarUrl: null,
          email: 'first@example.test',
          phone: '+96891234567',
          status: AccountStatus.ACTIVE,
          role: UserRole.USER,
          isVerified: true,
          createdAt: new Date('2026-10-01T10:00:00Z'),
        },
        {
          id: 'u-2',
          username: 'second_user',
          displayName: 'Second User',
          avatarUrl: null,
          email: 'second@example.test',
          phone: '96871234589',
          status: AccountStatus.SUSPENDED,
          role: UserRole.USER,
          isVerified: false,
          createdAt: new Date('2026-10-01T09:00:00Z'),
        },
        {
          id: 'u-3',
          username: 'third_user',
          displayName: 'Third User',
          avatarUrl: null,
          email: 'third@example.test',
          phone: '91234567',
          status: AccountStatus.BANNED,
          role: UserRole.USER,
          isVerified: true,
          createdAt: new Date('2026-10-01T08:00:00Z'),
        },
      ];

      // Limit 2 requested, mock returns 3 to trigger nextCursor
      mockPrisma.user.findMany.mockResolvedValue([...mockUsers]);

      const result = await service.listUsers({ limit: 2 });

      expect(result.users).toHaveLength(2);
      expect(result.nextCursor).toBe('u-3');
      expect(result.users[0].email).toBe('f***@example.test');
      expect(result.users[0].phone).toBe('+968***67');
      expect(result.users[1].email).toBe('s***@example.test');
      expect(result.users[1].phone).toBe('+968***89');
    });

    it('searches full email with equals insensitive when q contains @ and domain', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.listUsers({ q: 'exact@example.test' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: { equals: 'exact@example.test', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('searches full phone with equals when q is all digits', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.listUsers({ q: '96891234567' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { phone: { equals: '96891234567' } },
              { phoneE164: { equals: '96891234567' } },
            ],
          }),
        }),
      );
    });

    it('searches username and displayName with contains when q is regular text', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.listUsers({ q: 'mahmoud' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { username: { contains: 'mahmoud', mode: 'insensitive' } },
              { displayName: { contains: 'mahmoud', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  describe('getUserDetail', () => {
    it('returns user details with masked contact info, active sessions count, and recent audit logs', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-target-1',
        username: 'target_user',
        displayName: 'Target User',
        avatarUrl: null,
        email: 'target@example.test',
        phone: '+96891234567',
        status: AccountStatus.ACTIVE,
        role: UserRole.USER,
        isVerified: true,
        suspendedUntil: null,
        statusReason: null,
        statusChangedAt: null,
        statusChangedById: null,
        createdAt: new Date('2026-09-01T00:00:00Z'),
      });

      mockPrisma.refreshToken.count.mockResolvedValue(2);
      mockPrisma.adminAuditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          adminId: 'admin-1',
          action: USER_SUSPEND,
          targetType: 'User',
          targetId: 'u-target-1',
          beforeState: { status: 'ACTIVE' },
          afterState: { status: 'SUSPENDED' },
          reason: 'Initial test suspension',
          ipAddress: '127.0.0.1',
          userAgent: 'Agent',
          createdAt: new Date(),
        },
      ]);

      const result = await service.getUserDetail('u-target-1');

      expect(result.id).toBe('u-target-1');
      expect(result.email).toBe('t***@example.test');
      expect(result.phone).toBe('+968***67');
      expect(result.activeSessionsCount).toBe(2);
      expect(result.recentAuditLogs).toHaveLength(1);
    });

    it('throws 404 NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserDetail('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listAuditLogs', () => {
    it('queries audit logs with filters and returns cursor pagination', async () => {
      mockPrisma.adminAuditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          adminId: 'admin-1',
          action: USER_BAN,
          targetType: 'User',
          targetId: 'u-1',
          reason: 'Severe violation of terms and policies',
          createdAt: new Date(),
          admin: { id: 'admin-1', username: 'admin', displayName: 'Administrator' },
        },
      ]);

      const result = await service.listAuditLogs({
        action: USER_BAN,
        from: '2026-10-01T00:00:00Z',
        to: '2026-10-15T23:59:59Z',
      });

      expect(result.logs).toHaveLength(1);
      expect(mockPrisma.adminAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            targetType: 'User',
            action: USER_BAN,
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  /* ══════════════════════════════════════════════════════════════
     2. MUTATIONS & BUSINESS RULES
     ══════════════════════════════════════════════════════════════ */

  describe('Self-Action Protection (ADMIN_SELF_ACTION)', () => {
    it('rejects suspend when admin acts on self', async () => {
      await expect(
        service.suspendUser(adminJwt, adminJwt.sub, { reason: 'Accidental self suspend attempt' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects ban when admin acts on self', async () => {
      await expect(
        service.banUser(adminJwt, adminJwt.sub, { reason: 'Accidental self ban attempt' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects changeUserRole when admin acts on self', async () => {
      await expect(
        service.changeUserRole(adminJwt, adminJwt.sub, {
          role: UserRole.MODERATOR,
          reason: 'Accidental self demote',
          adminPassword: 'Password123!',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Moderator Role Restrictions (INSUFFICIENT_ROLE)', () => {
    it('moderator CAN suspend normal USER', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'normal-user',
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        tokenVersion: 0,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'normal-user',
        status: AccountStatus.SUSPENDED,
        role: UserRole.USER,
        suspendedUntil: new Date(),
        statusChangedAt: new Date(),
        tokenVersion: 1,
      });

      const res = await service.suspendUser(moderatorJwt, 'normal-user', {
        reason: 'Violated forum posting guidelines',
      });

      expect(res.status).toBe(AccountStatus.SUSPENDED);
    });

    it('moderator CANNOT suspend an ADMIN (throws 403 INSUFFICIENT_ROLE)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-target',
        role: UserRole.ADMIN,
        status: AccountStatus.ACTIVE,
      });

      await expect(
        service.suspendUser(moderatorJwt, 'admin-target', { reason: 'Attempt to suspend admin' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('moderator CANNOT suspend another MODERATOR (throws 403 INSUFFICIENT_ROLE)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'mod-peer',
        role: UserRole.MODERATOR,
        status: AccountStatus.ACTIVE,
      });

      await expect(
        service.suspendUser(moderatorJwt, 'mod-peer', { reason: 'Attempt to suspend peer moderator' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Last Admin Protection (LAST_ADMIN)', () => {
    it('throws 409 LAST_ADMIN when suspending the only active admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'target-admin',
        role: UserRole.ADMIN,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        tokenVersion: 0,
      });
      // Count of other active admins returns 0
      mockPrisma.user.count.mockResolvedValue(0);

      await expect(
        service.suspendUser(adminJwt, 'target-admin', {
          reason: 'Attempt to suspend the sole admin',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('throws 409 LAST_ADMIN when banning the only active admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'target-admin',
        role: UserRole.ADMIN,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        tokenVersion: 0,
      });
      mockPrisma.user.count.mockResolvedValue(0);

      await expect(
        service.banUser(adminJwt, 'target-admin', {
          reason: 'Attempt to ban the sole admin',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('allows suspending an ADMIN when another active admin exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'target-admin',
        role: UserRole.ADMIN,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        tokenVersion: 0,
      });
      // Count of other active admins returns 2
      mockPrisma.user.count.mockResolvedValue(2);
      mockPrisma.user.update.mockResolvedValue({
        id: 'target-admin',
        status: AccountStatus.SUSPENDED,
        role: UserRole.ADMIN,
        suspendedUntil: new Date(),
        statusChangedAt: new Date(),
        tokenVersion: 1,
      });

      const res = await service.suspendUser(adminJwt, 'target-admin', {
        reason: 'Legitimate suspension with another admin surviving',
      });

      expect(res.status).toBe(AccountStatus.SUSPENDED);
    });
  });

  describe('suspendUser', () => {
    it('successfully suspends ACTIVE user with default 14-day duration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        tokenVersion: 3,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-1',
        status: AccountStatus.SUSPENDED,
        role: UserRole.USER,
        suspendedUntil: new Date(Date.now() + 14 * 86400 * 1000),
        statusChangedAt: new Date(),
        tokenVersion: 4,
      });

      const res = await service.suspendUser(
        adminJwt,
        'u-1',
        { reason: 'Violating platform advertising rules' },
        '10.0.0.1',
        'Mozilla/5.0',
      );

      expect(res.status).toBe(AccountStatus.SUSPENDED);
      expect(mockTokenService.revokeAllRefreshTokens).toHaveBeenCalledWith('u-1', mockPrisma);
      expect(mockAdminAuditService.record).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({
          action: USER_SUSPEND,
          adminId: adminJwt.sub,
          targetId: 'u-1',
          beforeState: expect.objectContaining({ status: AccountStatus.ACTIVE, tokenVersion: 3 }),
          afterState: expect.objectContaining({ status: AccountStatus.SUSPENDED, tokenVersion: 4 }),
        }),
      );
      expect(mockAccessTokenGate.invalidate).toHaveBeenCalledWith('u-1');
      expect(mockChatGateway.disconnectUser).toHaveBeenCalledWith('u-1', 'ACCOUNT_SUSPENDED');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        USER_STATUS_CHANGED,
        expect.objectContaining({
          userId: 'u-1',
          previousStatus: AccountStatus.ACTIVE,
          status: AccountStatus.SUSPENDED,
        }),
      );
    });

    it('rejects until date that is not in the future (400 BadRequestException)', async () => {
      const pastDate = new Date(Date.now() - 10000).toISOString();
      await expect(
        service.suspendUser(adminJwt, 'u-1', {
          reason: 'Violating platform advertising rules',
          until: pastDate,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects until date exceeding 90 days (400 BadRequestException)', async () => {
      const tooFarDate = new Date(Date.now() + 95 * 24 * 60 * 60 * 1000).toISOString();
      await expect(
        service.suspendUser(adminJwt, 'u-1', {
          reason: 'Violating platform advertising rules',
          until: tooFarDate,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns no-op when user is already SUSPENDED with the same until timestamp', async () => {
      const sameUntil = new Date(Date.now() + 500000);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        role: UserRole.USER,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: sameUntil,
        statusChangedAt: new Date(),
        tokenVersion: 2,
      });

      const res = await service.suspendUser(adminJwt, 'u-1', {
        reason: 'Redundant suspension request',
        until: sameUntil.toISOString(),
      });

      expect(res.status).toBe(AccountStatus.SUSPENDED);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockAdminAuditService.record).not.toHaveBeenCalled();
      expect(mockChatGateway.disconnectUser).not.toHaveBeenCalled();
    });

    it('rejects transition from BANNED or DELETED (409 ConflictException)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'banned-user',
        role: UserRole.USER,
        status: AccountStatus.BANNED,
      });

      await expect(
        service.suspendUser(adminJwt, 'banned-user', { reason: 'Attempting to suspend banned user' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('unsuspendUser', () => {
    it('successfully unsuspends SUSPENDED user and clears suspendedUntil without bumping tokenVersion', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-suspended',
        role: UserRole.USER,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: new Date(),
        statusChangedAt: new Date(),
        tokenVersion: 5,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-suspended',
        status: AccountStatus.ACTIVE,
        role: UserRole.USER,
        suspendedUntil: null,
        statusChangedAt: new Date(),
        tokenVersion: 5,
      });

      const res = await service.unsuspendUser(adminJwt, 'u-suspended', {
        reason: 'User submitted proof of identity and resolved issue',
      });

      expect(res.status).toBe(AccountStatus.ACTIVE);
      expect(res.suspendedUntil).toBeNull();
      // tokenVersion should NOT be bumped and tokens NOT revoked on unsuspend
      expect(mockTokenService.revokeAllRefreshTokens).not.toHaveBeenCalled();
      expect(mockAdminAuditService.record).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({ action: USER_UNSUSPEND, targetId: 'u-suspended' }),
      );
      expect(mockAccessTokenGate.invalidate).toHaveBeenCalledWith('u-suspended');
    });

    it('returns no-op when user is already ACTIVE', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-active',
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        statusChangedAt: new Date(),
      });

      const res = await service.unsuspendUser(adminJwt, 'u-active', {
        reason: 'Redundant unsuspend on active user',
      });

      expect(res.status).toBe(AccountStatus.ACTIVE);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockAdminAuditService.record).not.toHaveBeenCalled();
    });

    it('rejects unsuspend on BANNED or DELETED account (409 ConflictException)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-ban',
        role: UserRole.USER,
        status: AccountStatus.BANNED,
      });

      await expect(
        service.unsuspendUser(adminJwt, 'u-ban', { reason: 'Illegal unsuspend on banned' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('banUser', () => {
    it('bans user from ACTIVE status, bumps tokenVersion, revokes tokens, disconnects sockets', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-to-ban',
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        tokenVersion: 1,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-to-ban',
        status: AccountStatus.BANNED,
        role: UserRole.USER,
        suspendedUntil: null,
        statusChangedAt: new Date(),
        tokenVersion: 2,
      });

      const res = await service.banUser(adminJwt, 'u-to-ban', {
        reason: 'Fraudulent transactions detected across multiple cards',
      });

      expect(res.status).toBe(AccountStatus.BANNED);
      expect(mockTokenService.revokeAllRefreshTokens).toHaveBeenCalledWith('u-to-ban', mockPrisma);
      expect(mockBanBlacklistService.addForUser).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({ id: 'u-to-ban' }),
        'Fraudulent transactions detected across multiple cards',
      );
      expect(mockChatGateway.disconnectUser).toHaveBeenCalledWith('u-to-ban', 'ACCOUNT_BANNED');
      expect(mockAdminAuditService.record).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({ action: USER_BAN, targetId: 'u-to-ban' }),
      );
    });

    it('returns no-op when user is already BANNED', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-already-banned',
        role: UserRole.USER,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
        statusChangedAt: new Date(),
      });

      const res = await service.banUser(adminJwt, 'u-already-banned', {
        reason: 'Redundant ban attempt',
      });

      expect(res.status).toBe(AccountStatus.BANNED);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockAdminAuditService.record).not.toHaveBeenCalled();
    });

    it('rejects ban on DELETED account (409 ConflictException)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-deleted',
        role: UserRole.USER,
        status: AccountStatus.DELETED,
      });

      await expect(
        service.banUser(adminJwt, 'u-deleted', { reason: 'Attempt to ban deleted user' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('unbanUser', () => {
    it('unbans BANNED user to ACTIVE status without bumping tokenVersion', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-banned',
        role: UserRole.USER,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
        statusChangedAt: new Date(),
        tokenVersion: 2,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-banned',
        status: AccountStatus.ACTIVE,
        role: UserRole.USER,
        suspendedUntil: null,
        statusChangedAt: new Date(),
        tokenVersion: 2,
      });

      const res = await service.unbanUser(adminJwt, 'u-banned', {
        reason: 'Pardoned upon evidence clearance by legal',
      });

      expect(res.status).toBe(AccountStatus.ACTIVE);
      expect(mockTokenService.revokeAllRefreshTokens).not.toHaveBeenCalled();
      expect(mockBanBlacklistService.removeForUser).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({ id: 'u-banned' }),
      );
      expect(mockAdminAuditService.record).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({ action: USER_UNBAN, targetId: 'u-banned' }),
      );
    });

    it('returns no-op when user is already ACTIVE', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-active-target',
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        statusChangedAt: new Date(),
      });

      const res = await service.unbanUser(adminJwt, 'u-active-target', {
        reason: 'Redundant unban on active user',
      });

      expect(res.status).toBe(AccountStatus.ACTIVE);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects unban on SUSPENDED account (409 ConflictException)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-susp',
        role: UserRole.USER,
        status: AccountStatus.SUSPENDED,
      });

      await expect(
        service.unbanUser(adminJwt, 'u-susp', { reason: 'Illegal unban on suspended' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('changeUserRole & Re-Authentication', () => {
    it('changes role with valid password, bumps tokenVersion, revokes tokens, disconnects sockets without code', async () => {
      const hash = await bcrypt.hash('CorrectPass123!', 10);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: adminJwt.sub, passwordHash: hash }) // admin check
        .mockResolvedValueOnce({
          id: 'u-target',
          role: UserRole.USER,
          status: AccountStatus.ACTIVE,
          suspendedUntil: null,
          tokenVersion: 2,
        }); // target user in tx

      mockPrisma.user.update.mockResolvedValue({
        id: 'u-target',
        role: UserRole.MODERATOR,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        statusChangedAt: new Date(),
        tokenVersion: 3,
      });

      const res = await service.changeUserRole(adminJwt, 'u-target', {
        role: UserRole.MODERATOR,
        reason: 'Promoted to support lead',
        adminPassword: 'CorrectPass123!',
      });

      expect(res.role).toBe(UserRole.MODERATOR);
      expect(mockTokenService.revokeAllRefreshTokens).toHaveBeenCalledWith('u-target', mockPrisma);
      // Disconnects sockets WITHOUT code
      expect(mockChatGateway.disconnectUser).toHaveBeenCalledWith('u-target');
      expect(mockAdminAuditService.record).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({
          action: ROLE_CHANGE,
          targetId: 'u-target',
          beforeState: expect.objectContaining({ role: UserRole.USER }),
          afterState: expect.objectContaining({ role: UserRole.MODERATOR }),
        }),
      );
    });

    it('rejects role change when admin password is wrong (403 REAUTH_FAILED)', async () => {
      const hash = await bcrypt.hash('RealAdminPassword!', 10);
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: adminJwt.sub, passwordHash: hash });

      await expect(
        service.changeUserRole(adminJwt, 'u-target', {
          role: UserRole.MODERATOR,
          reason: 'Promotion attempt with bad password',
          adminPassword: 'WrongPassword!',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects role change when admin has no passwordHash (Google only account: 403 REAUTH_UNAVAILABLE)', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: adminJwt.sub, passwordHash: null });

      await expect(
        service.changeUserRole(adminJwt, 'u-target', {
          role: UserRole.MODERATOR,
          reason: 'Promotion attempt without password',
          adminPassword: 'AnyPassword',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns no-op when target already has the requested role', async () => {
      const hash = await bcrypt.hash('CorrectPass123!', 10);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: adminJwt.sub, passwordHash: hash })
        .mockResolvedValueOnce({
          id: 'u-target',
          role: UserRole.MODERATOR,
          status: AccountStatus.ACTIVE,
          suspendedUntil: null,
          statusChangedAt: new Date(),
        });

      const res = await service.changeUserRole(adminJwt, 'u-target', {
        role: UserRole.MODERATOR,
        reason: 'Redundant role change',
        adminPassword: 'CorrectPass123!',
      });

      expect(res.role).toBe(UserRole.MODERATOR);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockAdminAuditService.record).not.toHaveBeenCalled();
    });

    it('enforces last admin protection when demoting an ADMIN to USER', async () => {
      const hash = await bcrypt.hash('CorrectPass123!', 10);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: adminJwt.sub, passwordHash: hash })
        .mockResolvedValueOnce({
          id: 'sole-admin-target',
          role: UserRole.ADMIN,
          status: AccountStatus.ACTIVE,
          suspendedUntil: null,
          tokenVersion: 1,
        });

      mockPrisma.user.count.mockResolvedValue(0); // 0 other active admins

      await expect(
        service.changeUserRole(adminJwt, 'sole-admin-target', {
          role: UserRole.USER,
          reason: 'Attempting to demote sole admin',
          adminPassword: 'CorrectPass123!',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('does not pass statusReason, statusChangedAt, or statusChangedById in user.update during role change', async () => {
      const hash = await bcrypt.hash('CorrectPass123!', 10);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: adminJwt.sub, passwordHash: hash })
        .mockResolvedValueOnce({
          id: 'u-target',
          role: UserRole.USER,
          status: AccountStatus.ACTIVE,
          suspendedUntil: null,
          tokenVersion: 2,
        });

      mockPrisma.user.update.mockResolvedValue({
        id: 'u-target',
        role: UserRole.MODERATOR,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        statusChangedAt: new Date(),
        tokenVersion: 3,
      });

      await service.changeUserRole(adminJwt, 'u-target', {
        role: UserRole.MODERATOR,
        reason: 'Promoted to support lead',
        adminPassword: 'CorrectPass123!',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-target' },
        data: {
          role: UserRole.MODERATOR,
          tokenVersion: { increment: 1 },
        },
        select: expect.any(Object),
      });

      const updateData = mockPrisma.user.update.mock.calls[0][0].data;
      expect(updateData.statusReason).toBeUndefined();
      expect(updateData.statusChangedAt).toBeUndefined();
      expect(updateData.statusChangedById).toBeUndefined();
    });

    it('rejects role change on BANNED account with 409 INVALID_TRANSITION without DB write', async () => {
      const hash = await bcrypt.hash('CorrectPass123!', 10);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: adminJwt.sub, passwordHash: hash })
        .mockResolvedValueOnce({
          id: 'u-banned',
          role: UserRole.USER,
          status: AccountStatus.BANNED,
          suspendedUntil: null,
          tokenVersion: 2,
        });

      const promise = service.changeUserRole(adminJwt, 'u-banned', {
        role: UserRole.MODERATOR,
        reason: 'Attempt to promote banned user',
        adminPassword: 'CorrectPass123!',
      });

      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toMatchObject({
        response: {
          code: 'INVALID_TRANSITION',
        },
      });

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockAdminAuditService.record).not.toHaveBeenCalled();
    });

    it('rejects role change on DELETED account with 409 INVALID_TRANSITION without DB write', async () => {
      const hash = await bcrypt.hash('CorrectPass123!', 10);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: adminJwt.sub, passwordHash: hash })
        .mockResolvedValueOnce({
          id: 'u-deleted',
          role: UserRole.USER,
          status: AccountStatus.DELETED,
          suspendedUntil: null,
          tokenVersion: 2,
        });

      const promise = service.changeUserRole(adminJwt, 'u-deleted', {
        role: UserRole.MODERATOR,
        reason: 'Attempt to promote deleted user',
        adminPassword: 'CorrectPass123!',
      });

      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toMatchObject({
        response: {
          code: 'INVALID_TRANSITION',
        },
      });

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockAdminAuditService.record).not.toHaveBeenCalled();
    });

    it('allows role change on SUSPENDED account and retains suspended status', async () => {
      const hash = await bcrypt.hash('CorrectPass123!', 10);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: adminJwt.sub, passwordHash: hash })
        .mockResolvedValueOnce({
          id: 'u-suspended',
          role: UserRole.USER,
          status: AccountStatus.SUSPENDED,
          suspendedUntil: new Date(),
          tokenVersion: 2,
        });

      mockPrisma.user.update.mockResolvedValue({
        id: 'u-suspended',
        role: UserRole.MODERATOR,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: new Date(),
        statusChangedAt: new Date(),
        tokenVersion: 3,
      });

      const res = await service.changeUserRole(adminJwt, 'u-suspended', {
        role: UserRole.MODERATOR,
        reason: 'Promotion during suspension',
        adminPassword: 'CorrectPass123!',
      });

      expect(res.role).toBe(UserRole.MODERATOR);
      expect(res.status).toBe(AccountStatus.SUSPENDED);
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('skips USER_STATUS_CHANGED event emission on role_change while suspend and ban emit it', async () => {
      // 1. Role change does NOT emit USER_STATUS_CHANGED
      const hash = await bcrypt.hash('CorrectPass123!', 10);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: adminJwt.sub, passwordHash: hash })
        .mockResolvedValueOnce({
          id: 'u-target',
          role: UserRole.USER,
          status: AccountStatus.ACTIVE,
          suspendedUntil: null,
          tokenVersion: 1,
        });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-target',
        role: UserRole.MODERATOR,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        statusChangedAt: new Date(),
        tokenVersion: 2,
      });

      await service.changeUserRole(adminJwt, 'u-target', {
        role: UserRole.MODERATOR,
        reason: 'Role change without status change',
        adminPassword: 'CorrectPass123!',
      });

      expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(
        USER_STATUS_CHANGED,
        expect.anything(),
      );

      // 2. Suspend DOES emit USER_STATUS_CHANGED
      jest.clearAllMocks();
      mockPrisma.$queryRaw.mockResolvedValue([{ id: 'u-target', pg_advisory_xact_lock: null }]);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-target',
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        tokenVersion: 2,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-target',
        role: UserRole.USER,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: new Date(),
        statusChangedAt: new Date(),
        tokenVersion: 3,
      });

      await service.suspendUser(adminJwt, 'u-target', { reason: 'Policy suspension' });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        USER_STATUS_CHANGED,
        expect.objectContaining({ userId: 'u-target', status: AccountStatus.SUSPENDED }),
      );

      // 3. Ban DOES emit USER_STATUS_CHANGED
      jest.clearAllMocks();
      mockPrisma.$queryRaw.mockResolvedValue([{ id: 'u-target', pg_advisory_xact_lock: null }]);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-target',
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        tokenVersion: 3,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-target',
        role: UserRole.USER,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
        statusChangedAt: new Date(),
        tokenVersion: 4,
      });

      await service.banUser(adminJwt, 'u-target', { reason: 'Permanent ban' });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        USER_STATUS_CHANGED,
        expect.objectContaining({ userId: 'u-target', status: AccountStatus.BANNED }),
      );
    });
  });

  describe('Row-Level Locking (SELECT ... FOR UPDATE)', () => {
    it('suspendUser executes row lock before reading or updating target', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-target-1',
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        tokenVersion: 1,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-target-1',
        status: AccountStatus.SUSPENDED,
        role: UserRole.USER,
        suspendedUntil: new Date(),
        statusChangedAt: new Date(),
        tokenVersion: 2,
      });

      await service.suspendUser(adminJwt, 'u-target-1', { reason: 'Test lock ordering' });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      const rawCall = mockPrisma.$queryRaw.mock.calls[0];
      const sqlStrings = rawCall[0];
      expect(sqlStrings.join(' ')).toContain('SELECT id FROM users WHERE id =');
      expect(sqlStrings.join(' ')).toContain('FOR UPDATE');
      expect(rawCall[1]).toBe('u-target-1');

      // Assert lock was invoked before read (findUnique) and before write (update)
      const lockOrder = mockPrisma.$queryRaw.mock.invocationCallOrder[0];
      const findUniqueOrder = mockPrisma.user.findUnique.mock.invocationCallOrder[0];
      const updateOrder = mockPrisma.user.update.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(findUniqueOrder);
      expect(lockOrder).toBeLessThan(updateOrder);
    });

    it('suspendUser throws 404 when target row is not found during FOR UPDATE', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // Row lock finds nothing

      await expect(
        service.suspendUser(adminJwt, 'u-nonexistent', { reason: 'Not found test' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('unsuspendUser executes row lock before reading or updating target', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-target-2',
        role: UserRole.USER,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: new Date(),
        tokenVersion: 1,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-target-2',
        status: AccountStatus.ACTIVE,
        role: UserRole.USER,
        suspendedUntil: null,
        statusChangedAt: new Date(),
        tokenVersion: 1,
      });

      await service.unsuspendUser(adminJwt, 'u-target-2', { reason: 'Unsuspend test lock' });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      const rawCall = mockPrisma.$queryRaw.mock.calls[0];
      expect(rawCall[0].join(' ')).toContain('FOR UPDATE');
      expect(rawCall[1]).toBe('u-target-2');

      const lockOrder = mockPrisma.$queryRaw.mock.invocationCallOrder[0];
      const findUniqueOrder = mockPrisma.user.findUnique.mock.invocationCallOrder[0];
      const updateOrder = mockPrisma.user.update.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(findUniqueOrder);
      expect(lockOrder).toBeLessThan(updateOrder);
    });

    it('unsuspendUser throws 404 when target row is not found during FOR UPDATE', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(
        service.unsuspendUser(adminJwt, 'u-nonexistent', { reason: 'Not found test' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('banUser executes row lock before reading or updating target', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-target-3',
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        tokenVersion: 1,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-target-3',
        status: AccountStatus.BANNED,
        role: UserRole.USER,
        suspendedUntil: null,
        statusChangedAt: new Date(),
        tokenVersion: 2,
      });

      await service.banUser(adminJwt, 'u-target-3', { reason: 'Ban test lock' });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      const rawCall = mockPrisma.$queryRaw.mock.calls[0];
      expect(rawCall[0].join(' ')).toContain('FOR UPDATE');
      expect(rawCall[1]).toBe('u-target-3');

      const lockOrder = mockPrisma.$queryRaw.mock.invocationCallOrder[0];
      const findUniqueOrder = mockPrisma.user.findUnique.mock.invocationCallOrder[0];
      const updateOrder = mockPrisma.user.update.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(findUniqueOrder);
      expect(lockOrder).toBeLessThan(updateOrder);
    });

    it('banUser throws 404 when target row is not found during FOR UPDATE', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(
        service.banUser(adminJwt, 'u-nonexistent', { reason: 'Not found test' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('unbanUser executes row lock before reading or updating target', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-target-4',
        role: UserRole.USER,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
        tokenVersion: 1,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-target-4',
        status: AccountStatus.ACTIVE,
        role: UserRole.USER,
        suspendedUntil: null,
        statusChangedAt: new Date(),
        tokenVersion: 1,
      });

      await service.unbanUser(adminJwt, 'u-target-4', { reason: 'Unban test lock' });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      const rawCall = mockPrisma.$queryRaw.mock.calls[0];
      expect(rawCall[0].join(' ')).toContain('FOR UPDATE');
      expect(rawCall[1]).toBe('u-target-4');

      const lockOrder = mockPrisma.$queryRaw.mock.invocationCallOrder[0];
      const findUniqueOrder = mockPrisma.user.findUnique.mock.invocationCallOrder[0];
      const updateOrder = mockPrisma.user.update.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(findUniqueOrder);
      expect(lockOrder).toBeLessThan(updateOrder);
    });

    it('unbanUser throws 404 when target row is not found during FOR UPDATE', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(
        service.unbanUser(adminJwt, 'u-nonexistent', { reason: 'Not found test' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('changeUserRole executes row lock before reading target in transaction and before updating', async () => {
      const hash = await bcrypt.hash('CorrectPass123!', 10);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: adminJwt.sub, passwordHash: hash }) // admin check
        .mockResolvedValueOnce({
          id: 'u-target-5',
          role: UserRole.USER,
          status: AccountStatus.ACTIVE,
          suspendedUntil: null,
          tokenVersion: 1,
        }); // target user in tx

      mockPrisma.user.update.mockResolvedValue({
        id: 'u-target-5',
        role: UserRole.MODERATOR,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        statusChangedAt: new Date(),
        tokenVersion: 2,
      });

      await service.changeUserRole(adminJwt, 'u-target-5', {
        role: UserRole.MODERATOR,
        reason: 'Change role test lock',
        adminPassword: 'CorrectPass123!',
      });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      const rawCall = mockPrisma.$queryRaw.mock.calls[0];
      expect(rawCall[0].join(' ')).toContain('FOR UPDATE');
      expect(rawCall[1]).toBe('u-target-5');

      const lockOrder = mockPrisma.$queryRaw.mock.invocationCallOrder[0];
      // Target findUnique is the 2nd findUnique call
      const targetFindUniqueOrder = mockPrisma.user.findUnique.mock.invocationCallOrder[1];
      const updateOrder = mockPrisma.user.update.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(targetFindUniqueOrder);
      expect(lockOrder).toBeLessThan(updateOrder);
    });

    it('changeUserRole throws 404 when target row is not found during FOR UPDATE', async () => {
      const hash = await bcrypt.hash('CorrectPass123!', 10);
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: adminJwt.sub, passwordHash: hash });
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(
        service.changeUserRole(adminJwt, 'u-nonexistent', {
          role: UserRole.MODERATOR,
          reason: 'Not found test',
          adminPassword: 'CorrectPass123!',
        }),
      ).rejects.toThrow(NotFoundException);

      // Only the admin check findUnique was called
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('changeUserRole maintains lock order: target row lock first, then advisory lock on admin demotion', async () => {
      const hash = await bcrypt.hash('CorrectPass123!', 10);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: adminJwt.sub, passwordHash: hash })
        .mockResolvedValueOnce({
          id: 'admin-target-to-demote',
          role: UserRole.ADMIN,
          status: AccountStatus.ACTIVE,
          suspendedUntil: null,
          tokenVersion: 1,
        });

      mockPrisma.user.count.mockResolvedValue(1); // 1 other active admin exists
      mockPrisma.user.update.mockResolvedValue({
        id: 'admin-target-to-demote',
        role: UserRole.MODERATOR,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        statusChangedAt: new Date(),
        tokenVersion: 2,
      });

      await service.changeUserRole(adminJwt, 'admin-target-to-demote', {
        role: UserRole.MODERATOR,
        reason: 'Demoting secondary admin',
        adminPassword: 'CorrectPass123!',
      });

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
      // Call 1: row lock on target
      const call1 = mockPrisma.$queryRaw.mock.calls[0];
      expect(call1[0].join(' ')).toContain('FOR UPDATE');
      expect(call1[1]).toBe('admin-target-to-demote');

      // Call 2: advisory lock for last admin check
      const call2 = mockPrisma.$queryRaw.mock.calls[1];
      expect(call2[0].join(' ')).toContain('pg_advisory_xact_lock');

      const rowLockOrder = mockPrisma.$queryRaw.mock.invocationCallOrder[0];
      const advisoryLockOrder = mockPrisma.$queryRaw.mock.invocationCallOrder[1];
      expect(rowLockOrder).toBeLessThan(advisoryLockOrder);
    });
  });

  describe('Post-Commit Resilience', () => {
    it('does not fail request when post-commit socket disconnect throws', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        tokenVersion: 1,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-1',
        status: AccountStatus.SUSPENDED,
        role: UserRole.USER,
        suspendedUntil: new Date(),
        statusChangedAt: new Date(),
        tokenVersion: 2,
      });

      mockChatGateway.disconnectUser.mockRejectedValue(new Error('Redis connection down'));

      const res = await service.suspendUser(adminJwt, 'u-1', {
        reason: 'Valid suspend request with failing chat gateway',
      });

      expect(res.status).toBe(AccountStatus.SUSPENDED);
    });
  });
});
