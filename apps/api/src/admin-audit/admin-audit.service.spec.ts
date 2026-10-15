import { BadRequestException } from '@nestjs/common';
import { AdminAuditService, sanitizeAuditState } from './admin-audit.service';
import { USER_SUSPEND, USER_BAN } from './admin-audit-actions.constant';
import { AdminAuditEntry } from './admin-audit.types';
import { Prisma } from '@prisma/client';

describe('AdminAuditService', () => {
  let service: AdminAuditService;

  beforeEach(() => {
    service = new AdminAuditService();
  });

  describe('1. Reason Validation', () => {
    it('should throw BadRequestException if reason is missing', async () => {
      const mockClient = { adminAuditLog: { create: jest.fn() } } as any;
      const entry: AdminAuditEntry = {
        adminId: 'admin-1',
        action: USER_SUSPEND,
        targetType: 'User',
        targetId: 'user-1',
        reason: '',
      };

      await expect(service.record(mockClient, entry)).rejects.toThrow(BadRequestException);
      expect(mockClient.adminAuditLog.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if reason is shorter than 10 characters', async () => {
      const mockClient = { adminAuditLog: { create: jest.fn() } } as any;
      const entry: AdminAuditEntry = {
        adminId: 'admin-1',
        action: USER_SUSPEND,
        targetType: 'User',
        targetId: 'user-1',
        reason: 'short',
      };

      await expect(service.record(mockClient, entry)).rejects.toThrow(BadRequestException);
      expect(mockClient.adminAuditLog.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if reason is whitespace-padded but less than 10 non-whitespace chars', async () => {
      const mockClient = { adminAuditLog: { create: jest.fn() } } as any;
      const entry: AdminAuditEntry = {
        adminId: 'admin-1',
        action: USER_SUSPEND,
        targetType: 'User',
        targetId: 'user-1',
        reason: '   12345   ',
      };

      await expect(service.record(mockClient, entry)).rejects.toThrow(BadRequestException);
      expect(mockClient.adminAuditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('2. Sanitizer (Sensitive Keys Stripping)', () => {
    it('should remove sensitive keys from beforeState and afterState snapshots', () => {
      const rawState = {
        id: 'u1',
        username: 'ali',
        displayName: 'علي',
        email: 'ali@example.com',
        phone: '96891234567',
        phoneE164: '+96891234567',
        password: 'plain_password',
        passwordHash: '$2a$10$hashed_secret',
        token: 'eyJh...',
        refreshToken: 'refresh_tok...',
        otp: '123456',
        secret: 'api_secret_key',
        nested: {
          allowed: 'ok',
          password: 'nested_pass',
          email: 'nested@example.com',
          tokens: ['item1', { token: 't1', kept: true }],
        },
      };

      const sanitized = sanitizeAuditState(rawState);

      expect(sanitized).toEqual({
        id: 'u1',
        username: 'ali',
        displayName: 'علي',
        nested: {
          allowed: 'ok',
          tokens: ['item1', { kept: true }],
        },
      });

      // Verify each sensitive key was explicitly stripped
      expect('email' in sanitized).toBe(false);
      expect('phone' in sanitized).toBe(false);
      expect('phoneE164' in sanitized).toBe(false);
      expect('password' in sanitized).toBe(false);
      expect('passwordHash' in sanitized).toBe(false);
      expect('token' in sanitized).toBe(false);
      expect('refreshToken' in sanitized).toBe(false);
      expect('otp' in sanitized).toBe(false);
      expect('secret' in sanitized).toBe(false);
      expect('password' in sanitized.nested).toBe(false);
      expect('email' in sanitized.nested).toBe(false);
    });

    it('should handle null and undefined state values gracefully', () => {
      expect(sanitizeAuditState(null)).toBeNull();
      expect(sanitizeAuditState(undefined)).toBeUndefined();
    });
  });

  describe('3. Successful Audit Log Recording', () => {
    it('should successfully record an entry and sanitize state snapshots', async () => {
      const mockCreated = {
        id: 'audit-log-1',
        adminId: 'admin-uuid-1',
        action: USER_BAN,
        targetType: 'User',
        targetId: 'user-uuid-9',
        reason: 'مخالفة شروط الاستخدام ونشر إعلانات احتيالية متكررة',
        createdAt: new Date(),
      };

      const mockClient = {
        adminAuditLog: {
          create: jest.fn().mockResolvedValue(mockCreated),
        },
      } as unknown as Prisma.TransactionClient;

      const entry: AdminAuditEntry = {
        adminId: 'admin-uuid-1',
        action: USER_BAN,
        targetType: 'User',
        targetId: 'user-uuid-9',
        beforeState: {
          status: 'ACTIVE',
          passwordHash: 'secret_hash',
          email: 'bad@example.com',
          phone: '91234567',
        },
        afterState: {
          status: 'BANNED',
          statusReason: 'مخالفة شروط الاستخدام',
          token: 'active_token',
        },
        reason: 'مخالفة شروط الاستخدام ونشر إعلانات احتيالية متكررة',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Chrome',
        requestId: 'req-abc-123',
      };

      const result = await service.record(mockClient, entry);

      expect(result).toEqual(mockCreated);
      expect(mockClient.adminAuditLog.create).toHaveBeenCalledTimes(1);
      expect(mockClient.adminAuditLog.create).toHaveBeenCalledWith({
        data: {
          adminId: 'admin-uuid-1',
          action: USER_BAN,
          targetType: 'User',
          targetId: 'user-uuid-9',
          beforeState: { status: 'ACTIVE' },
          afterState: { status: 'BANNED', statusReason: 'مخالفة شروط الاستخدام' },
          reason: 'مخالفة شروط الاستخدام ونشر إعلانات احتيالية متكررة',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Chrome',
          requestId: 'req-abc-123',
        },
      });
    });

    it('should handle optional fields and store DbNull when states are omitted', async () => {
      const mockClient = {
        adminAuditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-log-2' }),
        },
      } as unknown as Prisma.TransactionClient;

      const entry: AdminAuditEntry = {
        adminId: 'admin-uuid-2',
        action: USER_SUSPEND,
        targetType: 'User',
        targetId: 'user-uuid-2',
        reason: 'إيقاف مؤقت للحساب لحين مراجعة الهوية من قبل الإدارة',
      };

      await service.record(mockClient, entry);

      expect(mockClient.adminAuditLog.create).toHaveBeenCalledWith({
        data: {
          adminId: 'admin-uuid-2',
          action: USER_SUSPEND,
          targetType: 'User',
          targetId: 'user-uuid-2',
          beforeState: Prisma.DbNull,
          afterState: Prisma.DbNull,
          reason: 'إيقاف مؤقت للحساب لحين مراجعة الهوية من قبل الإدارة',
          ipAddress: null,
          userAgent: null,
          requestId: null,
        },
      });
    });
  });
});
