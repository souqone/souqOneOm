import { UserRole, AccountStatus } from '@prisma/client';
import { runBootstrapAdmin } from '../../scripts/bootstrap-admin';
import { LAST_ADMIN_ADVISORY_LOCK_ID } from './admin-users.service';
import { ROLE_CHANGE } from '../admin-audit/admin-audit-actions.constant';

describe('bootstrap-admin script (Unit Tests)', () => {
  let mockPrisma: any;
  let mockLogger: {
    log: jest.Mock;
    error: jest.Mock;
    warn: jest.Mock;
  };

  const validTargetUser = {
    id: 'u-target-123',
    email: 'target_candidate@example.test',
    username: 'candidate',
    displayName: 'Target Candidate',
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
    emailVerifiedAt: new Date('2026-10-01T12:00:00Z'),
    tokenVersion: 4,
  };

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        updateMany: jest.fn(),
      },
      adminAuditLog: {
        create: jest.fn(),
      },
      $queryRaw: jest.fn(),
      $transaction: jest.fn().mockImplementation(async (cb: any) => {
        if (typeof cb === 'function') {
          return cb(mockPrisma);
        }
        return Promise.all(cb);
      }),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('1. Dry-run mode', () => {
    it('validates user eligibility and previews changes without executing writes', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...validTargetUser });
      mockPrisma.user.findFirst.mockResolvedValue(null); // No existing active admin

      const res = await runBootstrapAdmin(
        {
          email: 'target_candidate@example.test',
          apply: false,
          prisma: mockPrisma,
        },
        mockLogger,
      );

      expect(res.success).toBe(true);
      expect(res.dryRun).toBe(true);
      expect(res.exitCode).toBe(0);
      expect(res.userId).toBe(validTargetUser.id);
      expect(res.emailMasked).toBe('t***@example.test');
      expect(res.newRole).toBe(UserRole.ADMIN);

      // Verify ZERO writes occurred
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.refreshToken.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.adminAuditLog.create).not.toHaveBeenCalled();

      // Verify dry-run output
      const logs = mockLogger.log.mock.calls.map((c) => c[0]).join('\n');
      expect(logs).toContain('[DRY-RUN]');
      expect(logs).toContain('Proposed Role: ADMIN');
      expect(logs).toContain('--apply');
    });
  });

  describe('2. Apply mode', () => {
    it('promotes user to ADMIN, bumps tokenVersion, revokes refresh tokens, and records audit log', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...validTargetUser });
      mockPrisma.user.findFirst.mockResolvedValue(null); // No active admin before tx
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: validTargetUser.id }]) // Row lock
        .mockResolvedValueOnce([{ pg_advisory_xact_lock: null }]); // Advisory lock
      mockPrisma.user.count.mockResolvedValue(0); // 0 other active admins in tx
      mockPrisma.user.update.mockResolvedValue({
        id: validTargetUser.id,
        role: UserRole.ADMIN,
        status: AccountStatus.ACTIVE,
        tokenVersion: 5,
      });
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });
      mockPrisma.adminAuditLog.create.mockResolvedValue({ id: 'audit-log-boot-1' });

      const res = await runBootstrapAdmin(
        {
          email: '  TARGET_CANDIDATE@example.test  ',
          apply: true,
          prisma: mockPrisma,
        },
        mockLogger,
      );

      expect(res.success).toBe(true);
      expect(res.dryRun).toBe(false);
      expect(res.exitCode).toBe(0);
      expect(res.newRole).toBe(UserRole.ADMIN);
      expect(res.tokenVersion).toBe(5);
      expect(res.revokedTokensCount).toBe(3);
      expect(res.auditLogId).toBe('audit-log-boot-1');

      // Verify update payload
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: validTargetUser.id },
        data: {
          role: UserRole.ADMIN,
          tokenVersion: { increment: 1 },
        },
        select: expect.any(Object),
      });

      // Verify token revocation payload
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: validTargetUser.id, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });

      // Verify audit log creation
      expect(mockPrisma.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          adminId: validTargetUser.id, // Self-actor
          action: ROLE_CHANGE,
          targetType: 'User',
          targetId: validTargetUser.id,
          reason: expect.stringMatching(/bootstrap/i),
        }),
      });

      const auditData = mockPrisma.adminAuditLog.create.mock.calls[0][0].data;
      expect(auditData.reason.length).toBeGreaterThanOrEqual(10);
      expect(auditData.beforeState).toEqual(
        expect.objectContaining({ role: UserRole.USER, tokenVersion: 4 }),
      );
      expect(auditData.afterState).toEqual(
        expect.objectContaining({ role: UserRole.ADMIN, tokenVersion: 5 }),
      );

      // Verify instructions logged
      const logs = mockLogger.log.mock.calls.map((c) => c[0]).join('\n');
      expect(logs).toContain('LOG OUT completely and LOG IN');
    });
  });

  describe('3. Validation & Guard Rejections', () => {
    it('rejects when target user is not found (exitCode 1)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await runBootstrapAdmin(
        {
          email: 'unknown_account@example.test',
          prisma: mockPrisma,
        },
        mockLogger,
      );

      expect(res.success).toBe(false);
      expect(res.exitCode).toBe(1);
      expect(res.error).toBe('USER_NOT_FOUND');
      expect(res.emailMasked).toBe('u***@example.test');
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('was not found'),
      );
    });

    it('rejects when target user is SUSPENDED (exitCode 1)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...validTargetUser,
        status: AccountStatus.SUSPENDED,
      });

      const res = await runBootstrapAdmin(
        {
          email: 'target_candidate@example.test',
          prisma: mockPrisma,
        },
        mockLogger,
      );

      expect(res.success).toBe(false);
      expect(res.exitCode).toBe(1);
      expect(res.error).toBe('USER_NOT_ACTIVE');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('is not ACTIVE'),
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects when target user is BANNED (exitCode 1)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...validTargetUser,
        status: AccountStatus.BANNED,
      });

      const res = await runBootstrapAdmin(
        {
          email: 'target_candidate@example.test',
          prisma: mockPrisma,
        },
        mockLogger,
      );

      expect(res.success).toBe(false);
      expect(res.exitCode).toBe(1);
      expect(res.error).toBe('USER_NOT_ACTIVE');
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects when target user email is not verified (exitCode 1)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...validTargetUser,
        emailVerifiedAt: null,
      });

      const res = await runBootstrapAdmin(
        {
          email: 'target_candidate@example.test',
          prisma: mockPrisma,
        },
        mockLogger,
      );

      expect(res.success).toBe(false);
      expect(res.exitCode).toBe(1);
      expect(res.error).toBe('EMAIL_NOT_VERIFIED');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('verified email address'),
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects when an ACTIVE ADMIN already exists in the system (exitCode 1)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...validTargetUser });
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'u-existing-admin',
        email: 'admin_incumbent@example.test',
      });

      const res = await runBootstrapAdmin(
        {
          email: 'target_candidate@example.test',
          prisma: mockPrisma,
        },
        mockLogger,
      );

      expect(res.success).toBe(false);
      expect(res.exitCode).toBe(1);
      expect(res.error).toBe('ACTIVE_ADMIN_EXISTS');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('PATCH /api/admin/users/:id/role'),
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects invalid or empty email without hitting database', async () => {
      const res = await runBootstrapAdmin(
        {
          email: 'invalid-email-no-at',
          prisma: mockPrisma,
        },
        mockLogger,
      );

      expect(res.success).toBe(false);
      expect(res.exitCode).toBe(1);
      expect(res.error).toBe('INVALID_EMAIL');
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('rejects when no email is provided at all', async () => {
      const originalEnv = process.env.BOOTSTRAP_ADMIN_EMAIL;
      delete process.env.BOOTSTRAP_ADMIN_EMAIL;

      const res = await runBootstrapAdmin(
        {
          email: undefined,
          prisma: mockPrisma,
        },
        mockLogger,
      );

      expect(res.success).toBe(false);
      expect(res.exitCode).toBe(1);
      expect(res.error).toBe('NO_EMAIL');

      if (originalEnv) process.env.BOOTSTRAP_ADMIN_EMAIL = originalEnv;
    });
  });

  describe('4. Lock Hierarchy & Concurrency Protection', () => {
    it('executes row lock on target before advisory lock', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...validTargetUser });
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: validTargetUser.id }])
        .mockResolvedValueOnce([{ pg_advisory_xact_lock: null }]);
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.user.update.mockResolvedValue({
        id: validTargetUser.id,
        role: UserRole.ADMIN,
        status: AccountStatus.ACTIVE,
        tokenVersion: 5,
      });
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.adminAuditLog.create.mockResolvedValue({ id: 'audit-log-1' });

      await runBootstrapAdmin(
        {
          email: 'target_candidate@example.test',
          apply: true,
          prisma: mockPrisma,
        },
        mockLogger,
      );

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);

      // Call 1: Row lock
      const call1 = mockPrisma.$queryRaw.mock.calls[0];
      const sqlStrings1 = call1[0];
      expect(sqlStrings1.join(' ')).toContain('SELECT id FROM users WHERE id =');
      expect(sqlStrings1.join(' ')).toContain('FOR UPDATE');
      expect(call1[1]).toBe(validTargetUser.id);

      // Call 2: Advisory lock
      const call2 = mockPrisma.$queryRaw.mock.calls[1];
      const sqlStrings2 = call2[0];
      expect(sqlStrings2.join(' ')).toContain('pg_advisory_xact_lock');
      expect(call2[1]).toBe(LAST_ADMIN_ADVISORY_LOCK_ID);

      // Lock order verification
      const rowLockOrder = mockPrisma.$queryRaw.mock.invocationCallOrder[0];
      const advisoryLockOrder = mockPrisma.$queryRaw.mock.invocationCallOrder[1];
      expect(rowLockOrder).toBeLessThan(advisoryLockOrder);
    });

    it('aborts transaction if an active admin was created concurrently before advisory lock acquired', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...validTargetUser });
      mockPrisma.user.findFirst.mockResolvedValue(null); // Looked clear initially
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: validTargetUser.id }])
        .mockResolvedValueOnce([{ pg_advisory_xact_lock: null }]);
      // Concurrently another admin was created!
      mockPrisma.user.count.mockResolvedValue(1);

      const res = await runBootstrapAdmin(
        {
          email: 'target_candidate@example.test',
          apply: true,
          prisma: mockPrisma,
        },
        mockLogger,
      );

      expect(res.success).toBe(false);
      expect(res.exitCode).toBe(1);
      expect(res.error).toContain('ACTIVE administrator already exists');
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.adminAuditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('5. PII Masking Integrity', () => {
    it('masks emails in logs and never prints full email in plaintext', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await runBootstrapAdmin(
        {
          email: 'secret_user@example.test',
          prisma: mockPrisma,
        },
        mockLogger,
      );

      const errorLogs = mockLogger.error.mock.calls.map((c) => c[0]).join('\n');
      expect(errorLogs).toContain('s***@example.test');
      expect(errorLogs).not.toContain('secret_user@example.test');
    });
  });
});
