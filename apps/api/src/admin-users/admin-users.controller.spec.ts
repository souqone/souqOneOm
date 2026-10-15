import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { THROTTLER_OPTIONS } from '@nestjs/throttler';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { UserRole, AccountStatus } from '@prisma/client';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;
  let service: jest.Mocked<AdminUsersService>;
  let reflector: Reflector;

  const mockAdminUsersService = {
    listUsers: jest.fn(),
    getUserDetail: jest.fn(),
    listAuditLogs: jest.fn(),
    suspendUser: jest.fn(),
    unsuspendUser: jest.fn(),
    banUser: jest.fn(),
    unbanUser: jest.fn(),
    changeUserRole: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    reflector = new Reflector();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        { provide: AdminUsersService, useValue: mockAdminUsersService },
      ],
    }).compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
    service = module.get(AdminUsersService);
  });

  /* ══════════════════════════════════════════════════════════════
     1. ROLES METADATA SPECIFICATION
     ══════════════════════════════════════════════════════════════ */

  describe('Route @Roles Metadata Enforcement', () => {
    it('GET /admin/users allows ADMIN and MODERATOR', () => {
      const roles = reflector.get(ROLES_KEY, controller.listUsers);
      expect(roles).toEqual(['ADMIN', 'MODERATOR']);
    });

    it('GET /admin/users/audit-logs allows ADMIN only', () => {
      const roles = reflector.get(ROLES_KEY, controller.listAuditLogs);
      expect(roles).toEqual(['ADMIN']);
    });

    it('GET /admin/users/:id allows ADMIN and MODERATOR', () => {
      const roles = reflector.get(ROLES_KEY, controller.getUserDetail);
      expect(roles).toEqual(['ADMIN', 'MODERATOR']);
    });

    it('POST /admin/users/:id/suspend allows ADMIN and MODERATOR', () => {
      const roles = reflector.get(ROLES_KEY, controller.suspendUser);
      expect(roles).toEqual(['ADMIN', 'MODERATOR']);
    });

    it('POST /admin/users/:id/unsuspend allows ADMIN and MODERATOR', () => {
      const roles = reflector.get(ROLES_KEY, controller.unsuspendUser);
      expect(roles).toEqual(['ADMIN', 'MODERATOR']);
    });

    it('POST /admin/users/:id/ban allows ADMIN only', () => {
      const roles = reflector.get(ROLES_KEY, controller.banUser);
      expect(roles).toEqual(['ADMIN']);
    });

    it('POST /admin/users/:id/unban allows ADMIN only', () => {
      const roles = reflector.get(ROLES_KEY, controller.unbanUser);
      expect(roles).toEqual(['ADMIN']);
    });

    it('PATCH /admin/users/:id/role allows ADMIN only', () => {
      const roles = reflector.get(ROLES_KEY, controller.changeUserRole);
      expect(roles).toEqual(['ADMIN']);
    });
  });

  /* ══════════════════════════════════════════════════════════════
     2. CONTROLLER DELEGATION & PARAMS PASSING
     ══════════════════════════════════════════════════════════════ */

  describe('Controller delegation to service', () => {
    const adminUser: any = { sub: 'admin-1', role: 'ADMIN', email: 'admin@example.test' };
    const fakeReq: any = { ip: '127.0.0.1', headers: { 'user-agent': 'JestClient' } };

    it('listUsers delegates query to service', async () => {
      const query = { limit: 10, q: 'test' };
      mockAdminUsersService.listUsers.mockResolvedValue({ users: [], nextCursor: null });

      const res = await controller.listUsers(query);
      expect(service.listUsers).toHaveBeenCalledWith(query);
      expect(res).toEqual({ users: [], nextCursor: null });
    });

    it('listAuditLogs delegates query to service', async () => {
      const query = { limit: 10, action: 'USER_BAN' };
      mockAdminUsersService.listAuditLogs.mockResolvedValue({ logs: [], nextCursor: null });

      const res = await controller.listAuditLogs(query);
      expect(service.listAuditLogs).toHaveBeenCalledWith(query);
      expect(res).toEqual({ logs: [], nextCursor: null });
    });

    it('getUserDetail passes id to service', async () => {
      mockAdminUsersService.getUserDetail.mockResolvedValue({ id: 'u-1' } as any);

      const res = await controller.getUserDetail('u-1');
      expect(service.getUserDetail).toHaveBeenCalledWith('u-1');
      expect(res).toEqual({ id: 'u-1' });
    });

    it('suspendUser passes admin, id, dto, ip, and user-agent', async () => {
      const dto = { reason: 'Violation of platform policies and terms' };
      mockAdminUsersService.suspendUser.mockResolvedValue({ id: 'u-1', status: AccountStatus.SUSPENDED } as any);

      const res = await controller.suspendUser(adminUser, 'u-1', dto, fakeReq);
      expect(service.suspendUser).toHaveBeenCalledWith(adminUser, 'u-1', dto, '127.0.0.1', 'JestClient');
      expect(res.status).toBe(AccountStatus.SUSPENDED);
    });

    it('unsuspendUser passes admin, id, dto, ip, and user-agent', async () => {
      const dto = { reason: 'Review cleared the user after investigation' };
      mockAdminUsersService.unsuspendUser.mockResolvedValue({ id: 'u-1', status: AccountStatus.ACTIVE } as any);

      const res = await controller.unsuspendUser(adminUser, 'u-1', dto, fakeReq);
      expect(service.unsuspendUser).toHaveBeenCalledWith(adminUser, 'u-1', dto, '127.0.0.1', 'JestClient');
      expect(res.status).toBe(AccountStatus.ACTIVE);
    });

    it('banUser passes admin, id, dto, ip, and user-agent', async () => {
      const dto = { reason: 'Severe recurring terms violation permanently banned' };
      mockAdminUsersService.banUser.mockResolvedValue({ id: 'u-1', status: AccountStatus.BANNED } as any);

      const res = await controller.banUser(adminUser, 'u-1', dto, fakeReq);
      expect(service.banUser).toHaveBeenCalledWith(adminUser, 'u-1', dto, '127.0.0.1', 'JestClient');
      expect(res.status).toBe(AccountStatus.BANNED);
    });

    it('unbanUser passes admin, id, dto, ip, and user-agent', async () => {
      const dto = { reason: 'Appeal accepted by administrator review' };
      mockAdminUsersService.unbanUser.mockResolvedValue({ id: 'u-1', status: AccountStatus.ACTIVE } as any);

      const res = await controller.unbanUser(adminUser, 'u-1', dto, fakeReq);
      expect(service.unbanUser).toHaveBeenCalledWith(adminUser, 'u-1', dto, '127.0.0.1', 'JestClient');
      expect(res.status).toBe(AccountStatus.ACTIVE);
    });

    it('changeUserRole passes admin, id, dto, ip, and user-agent', async () => {
      const dto = {
        role: UserRole.MODERATOR,
        reason: 'Promotion to content moderator team',
        adminPassword: 'SecretPassword123!',
      };
      mockAdminUsersService.changeUserRole.mockResolvedValue({ id: 'u-1', role: UserRole.MODERATOR } as any);

      const res = await controller.changeUserRole(adminUser, 'u-1', dto, fakeReq);
      expect(service.changeUserRole).toHaveBeenCalledWith(adminUser, 'u-1', dto, '127.0.0.1', 'JestClient');
      expect(res.role).toBe(UserRole.MODERATOR);
    });
  });
});
