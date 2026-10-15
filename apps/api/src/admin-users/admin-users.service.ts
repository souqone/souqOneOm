import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, AccountStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
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
import { maskEmail, maskPhone } from './utils/pii-masker.util';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { QueryAdminAuditLogsDto } from './dto/query-admin-audit-logs.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { UnsuspendUserDto } from './dto/unsuspend-user.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { UnbanUserDto } from './dto/unban-user.dto';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';
import {
  AdminUserListResponse,
  AdminUserDetailResponse,
  AdminUserAuditLogResponse,
  AdminUserMutationResponse,
} from './admin-users.types';
import type { JwtPayload } from '../auth/auth.types';

const LAST_ADMIN_ADVISORY_LOCK_ID = 742910385;

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: AuthTokenService,
    private readonly accessTokenGate: AccessTokenGate,
    private readonly chatGateway: ChatGateway,
    private readonly adminAuditService: AdminAuditService,
    @Optional()
    private readonly eventEmitter?: EventEmitter2,
  ) {}

  /* ══════════════════════════════════════════════════════════════
     1. READ ENDPOINTS
     ══════════════════════════════════════════════════════════════ */

  async listUsers(query: QueryAdminUsersDto): Promise<AdminUserListResponse> {
    const limit = query.limit ?? 20;
    const where: Prisma.UserWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.role) {
      where.role = query.role;
    }

    if (query.q && query.q.trim().length > 0) {
      const q = query.q.trim();
      const isFullEmail = q.includes('@') && q.includes('.');
      const isDigitsOnly = /^\+?\d{6,}$/.test(q);

      if (isFullEmail) {
        where.email = { equals: q, mode: 'insensitive' };
      } else if (isDigitsOnly) {
        where.OR = [
          { phone: { equals: q } },
          { phoneE164: { equals: q } },
        ];
      } else {
        where.OR = [
          { username: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } },
        ];
      }
    }

    const queryArgs: Prisma.UserFindManyArgs = {
      where,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        email: true,
        phone: true,
        status: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    };

    if (query.cursor) {
      queryArgs.cursor = { id: query.cursor };
      queryArgs.skip = 1;
    }

    const rows = await this.prisma.user.findMany(queryArgs);
    let nextCursor: string | null = null;

    if (rows.length > limit) {
      const nextItem = rows.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    const users = rows.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      email: maskEmail(u.email),
      phone: maskPhone(u.phone),
      status: u.status,
      role: u.role,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
    }));

    return { users, nextCursor };
  }

  async getUserDetail(id: string): Promise<AdminUserDetailResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        email: true,
        phone: true,
        status: true,
        role: true,
        isVerified: true,
        suspendedUntil: true,
        statusReason: true,
        statusChangedAt: true,
        statusChangedById: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const now = new Date();
    const [activeSessionsCount, recentAuditLogs] = await Promise.all([
      this.prisma.refreshToken.count({
        where: {
          userId: id,
          revokedAt: null,
          expiresAt: { gt: now },
        },
      }),
      this.prisma.adminAuditLog.findMany({
        where: {
          targetType: 'User',
          targetId: id,
        },
        select: {
          id: true,
          adminId: true,
          action: true,
          targetType: true,
          targetId: true,
          beforeState: true,
          afterState: true,
          reason: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      email: maskEmail(user.email),
      phone: maskPhone(user.phone),
      status: user.status,
      role: user.role,
      isVerified: user.isVerified,
      suspendedUntil: user.suspendedUntil,
      statusReason: user.statusReason,
      statusChangedAt: user.statusChangedAt,
      statusChangedById: user.statusChangedById,
      createdAt: user.createdAt,
      activeSessionsCount,
      recentAuditLogs,
    };
  }

  async listAuditLogs(query: QueryAdminAuditLogsDto): Promise<AdminUserAuditLogResponse> {
    const limit = query.limit ?? 20;
    const where: Prisma.AdminAuditLogWhereInput = {
      targetType: 'User',
    };

    if (query.adminId) {
      where.adminId = query.adminId;
    }
    if (query.targetId) {
      where.targetId = query.targetId;
    }
    if (query.action) {
      where.action = query.action;
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) {
        where.createdAt.gte = new Date(query.from);
      }
      if (query.to) {
        where.createdAt.lte = new Date(query.to);
      }
    }

    const queryArgs: Prisma.AdminAuditLogFindManyArgs = {
      where,
      select: {
        id: true,
        adminId: true,
        action: true,
        targetType: true,
        targetId: true,
        beforeState: true,
        afterState: true,
        reason: true,
        ipAddress: true,
        userAgent: true,
        requestId: true,
        createdAt: true,
        admin: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    };

    if (query.cursor) {
      queryArgs.cursor = { id: query.cursor };
      queryArgs.skip = 1;
    }

    const rows = await this.prisma.adminAuditLog.findMany(queryArgs);
    let nextCursor: string | null = null;

    if (rows.length > limit) {
      const nextItem = rows.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return { logs: rows, nextCursor };
  }

  /* ══════════════════════════════════════════════════════════════
     2. MUTATION ENDPOINTS (SUSPEND, UNSUSPEND, BAN, UNBAN, ROLE)
     ══════════════════════════════════════════════════════════════ */

  async suspendUser(
    admin: JwtPayload,
    targetId: string,
    dto: SuspendUserDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AdminUserMutationResponse> {
    this.assertNotSelfAction(admin.sub, targetId);

    const now = new Date();
    let effectiveUntil: Date;

    if (dto.until) {
      effectiveUntil = new Date(dto.until);
      if (isNaN(effectiveUntil.getTime()) || effectiveUntil.getTime() <= now.getTime()) {
        throw new BadRequestException('تاريخ انتهاء الإيقاف يجب أن يكون في المستقبل');
      }
      const maxFutureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      if (effectiveUntil.getTime() > maxFutureDate.getTime()) {
        throw new BadRequestException('الحد الأقصى للإيقاف المؤقت هو 90 يوماً');
      }
    } else {
      effectiveUntil = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    }

    let isNoOp = false;
    let previousStatus: AccountStatus = AccountStatus.ACTIVE;

    const result = await this.prisma.$transaction(async (tx) => {
      // Row lock on target to prevent concurrent mutation race conditions
      const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM users WHERE id = ${targetId} FOR UPDATE`;
      if (!locked || locked.length === 0) {
        throw new NotFoundException('المستخدم غير موجود');
      }

      const target = await tx.user.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          status: true,
          role: true,
          suspendedUntil: true,
          statusChangedAt: true,
          tokenVersion: true,
        },
      });

      if (!target) {
        throw new NotFoundException('المستخدم غير موجود');
      }

      this.assertModeratorCanManage(admin.role, target.role);

      if (target.status === AccountStatus.BANNED || target.status === AccountStatus.DELETED) {
        throw new ConflictException({
          statusCode: 409,
          code: 'INVALID_TRANSITION',
          message: 'لا يمكن إيقاف حساب محظور أو محذوف',
        });
      }

      if (target.status === AccountStatus.SUSPENDED && target.suspendedUntil) {
        // If suspended until the same effective timestamp (within 2 seconds tolerance)
        const diffMs = Math.abs(target.suspendedUntil.getTime() - effectiveUntil.getTime());
        if (diffMs < 2000) {
          isNoOp = true;
          return {
            id: target.id,
            status: target.status,
            role: target.role,
            suspendedUntil: target.suspendedUntil,
            statusChangedAt: target.statusChangedAt,
          };
        }
      }

      // Last admin protection if suspending an ADMIN
      await this.checkLastAdminProtection(tx, targetId, target.role);

      previousStatus = target.status;
      const trimmedReason = dto.reason.trim();

      const updated = await tx.user.update({
        where: { id: targetId },
        data: {
          status: AccountStatus.SUSPENDED,
          suspendedUntil: effectiveUntil,
          statusReason: trimmedReason,
          statusChangedAt: now,
          statusChangedById: admin.sub,
          tokenVersion: { increment: 1 },
        },
        select: {
          id: true,
          status: true,
          role: true,
          suspendedUntil: true,
          statusChangedAt: true,
          tokenVersion: true,
        },
      });

      await this.tokenService.revokeAllRefreshTokens(targetId, tx);

      await this.adminAuditService.record(tx, {
        adminId: admin.sub,
        action: USER_SUSPEND,
        targetType: 'User',
        targetId,
        beforeState: {
          status: target.status,
          role: target.role,
          suspendedUntil: target.suspendedUntil,
          tokenVersion: target.tokenVersion,
        },
        afterState: {
          status: updated.status,
          role: updated.role,
          suspendedUntil: updated.suspendedUntil,
          tokenVersion: updated.tokenVersion,
        },
        reason: trimmedReason,
        ipAddress: ip,
        userAgent,
      });

      return {
        id: updated.id,
        status: updated.status,
        role: updated.role,
        suspendedUntil: updated.suspendedUntil,
        statusChangedAt: updated.statusChangedAt,
      };
    });

    if (!isNoOp) {
      await this.executePostCommit(
        targetId,
        'suspend',
        previousStatus,
        result.status,
        result.suspendedUntil,
      );
    }

    return result;
  }

  async unsuspendUser(
    admin: JwtPayload,
    targetId: string,
    dto: UnsuspendUserDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AdminUserMutationResponse> {
    this.assertNotSelfAction(admin.sub, targetId);

    const now = new Date();
    let isNoOp = false;
    let previousStatus: AccountStatus = AccountStatus.SUSPENDED;

    const result = await this.prisma.$transaction(async (tx) => {
      // Row lock on target to prevent concurrent mutation race conditions
      const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM users WHERE id = ${targetId} FOR UPDATE`;
      if (!locked || locked.length === 0) {
        throw new NotFoundException('المستخدم غير موجود');
      }

      const target = await tx.user.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          status: true,
          role: true,
          suspendedUntil: true,
          statusChangedAt: true,
          tokenVersion: true,
        },
      });

      if (!target) {
        throw new NotFoundException('المستخدم غير موجود');
      }

      this.assertModeratorCanManage(admin.role, target.role);

      if (target.status === AccountStatus.ACTIVE) {
        isNoOp = true;
        return {
          id: target.id,
          status: target.status,
          role: target.role,
          suspendedUntil: target.suspendedUntil,
          statusChangedAt: target.statusChangedAt,
        };
      }

      if (target.status !== AccountStatus.SUSPENDED) {
        throw new ConflictException({
          statusCode: 409,
          code: 'INVALID_TRANSITION',
          message: 'لا يمكن إلغاء إيقاف حساب في هذه الحالة',
        });
      }

      previousStatus = target.status;
      const trimmedReason = dto.reason.trim();

      const updated = await tx.user.update({
        where: { id: targetId },
        data: {
          status: AccountStatus.ACTIVE,
          suspendedUntil: null,
          statusReason: trimmedReason,
          statusChangedAt: now,
          statusChangedById: admin.sub,
        },
        select: {
          id: true,
          status: true,
          role: true,
          suspendedUntil: true,
          statusChangedAt: true,
          tokenVersion: true,
        },
      });

      await this.adminAuditService.record(tx, {
        adminId: admin.sub,
        action: USER_UNSUSPEND,
        targetType: 'User',
        targetId,
        beforeState: {
          status: target.status,
          role: target.role,
          suspendedUntil: target.suspendedUntil,
          tokenVersion: target.tokenVersion,
        },
        afterState: {
          status: updated.status,
          role: updated.role,
          suspendedUntil: updated.suspendedUntil,
          tokenVersion: updated.tokenVersion,
        },
        reason: trimmedReason,
        ipAddress: ip,
        userAgent,
      });

      return {
        id: updated.id,
        status: updated.status,
        role: updated.role,
        suspendedUntil: updated.suspendedUntil,
        statusChangedAt: updated.statusChangedAt,
      };
    });

    if (!isNoOp) {
      await this.executePostCommit(
        targetId,
        'unsuspend',
        previousStatus,
        result.status,
        result.suspendedUntil,
      );
    }

    return result;
  }

  async banUser(
    admin: JwtPayload,
    targetId: string,
    dto: BanUserDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AdminUserMutationResponse> {
    this.assertNotSelfAction(admin.sub, targetId);

    const now = new Date();
    let isNoOp = false;
    let previousStatus: AccountStatus = AccountStatus.ACTIVE;

    const result = await this.prisma.$transaction(async (tx) => {
      // Row lock on target to prevent concurrent mutation race conditions
      const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM users WHERE id = ${targetId} FOR UPDATE`;
      if (!locked || locked.length === 0) {
        throw new NotFoundException('المستخدم غير موجود');
      }

      const target = await tx.user.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          status: true,
          role: true,
          suspendedUntil: true,
          statusChangedAt: true,
          tokenVersion: true,
        },
      });

      if (!target) {
        throw new NotFoundException('المستخدم غير موجود');
      }

      if (target.status === AccountStatus.BANNED) {
        isNoOp = true;
        return {
          id: target.id,
          status: target.status,
          role: target.role,
          suspendedUntil: target.suspendedUntil,
          statusChangedAt: target.statusChangedAt,
        };
      }

      if (target.status === AccountStatus.DELETED) {
        throw new ConflictException({
          statusCode: 409,
          code: 'INVALID_TRANSITION',
          message: 'لا يمكن حظر حساب محذوف',
        });
      }

      // Last admin protection if banning an ADMIN
      await this.checkLastAdminProtection(tx, targetId, target.role);

      previousStatus = target.status;
      const trimmedReason = dto.reason.trim();

      const updated = await tx.user.update({
        where: { id: targetId },
        data: {
          status: AccountStatus.BANNED,
          suspendedUntil: null,
          statusReason: trimmedReason,
          statusChangedAt: now,
          statusChangedById: admin.sub,
          tokenVersion: { increment: 1 },
        },
        select: {
          id: true,
          status: true,
          role: true,
          suspendedUntil: true,
          statusChangedAt: true,
          tokenVersion: true,
        },
      });

      await this.tokenService.revokeAllRefreshTokens(targetId, tx);

      await this.adminAuditService.record(tx, {
        adminId: admin.sub,
        action: USER_BAN,
        targetType: 'User',
        targetId,
        beforeState: {
          status: target.status,
          role: target.role,
          suspendedUntil: target.suspendedUntil,
          tokenVersion: target.tokenVersion,
        },
        afterState: {
          status: updated.status,
          role: updated.role,
          suspendedUntil: updated.suspendedUntil,
          tokenVersion: updated.tokenVersion,
        },
        reason: trimmedReason,
        ipAddress: ip,
        userAgent,
      });

      return {
        id: updated.id,
        status: updated.status,
        role: updated.role,
        suspendedUntil: updated.suspendedUntil,
        statusChangedAt: updated.statusChangedAt,
      };
    });

    if (!isNoOp) {
      await this.executePostCommit(
        targetId,
        'ban',
        previousStatus,
        result.status,
        result.suspendedUntil,
      );
    }

    return result;
  }

  async unbanUser(
    admin: JwtPayload,
    targetId: string,
    dto: UnbanUserDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AdminUserMutationResponse> {
    this.assertNotSelfAction(admin.sub, targetId);

    const now = new Date();
    let isNoOp = false;
    let previousStatus: AccountStatus = AccountStatus.BANNED;

    const result = await this.prisma.$transaction(async (tx) => {
      // Row lock on target to prevent concurrent mutation race conditions
      const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM users WHERE id = ${targetId} FOR UPDATE`;
      if (!locked || locked.length === 0) {
        throw new NotFoundException('المستخدم غير موجود');
      }

      const target = await tx.user.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          status: true,
          role: true,
          suspendedUntil: true,
          statusChangedAt: true,
          tokenVersion: true,
        },
      });

      if (!target) {
        throw new NotFoundException('المستخدم غير موجود');
      }

      if (target.status === AccountStatus.ACTIVE) {
        isNoOp = true;
        return {
          id: target.id,
          status: target.status,
          role: target.role,
          suspendedUntil: target.suspendedUntil,
          statusChangedAt: target.statusChangedAt,
        };
      }

      if (target.status !== AccountStatus.BANNED) {
        throw new ConflictException({
          statusCode: 409,
          code: 'INVALID_TRANSITION',
          message: 'لا يمكن إلغاء حظر حساب غير محظور',
        });
      }

      previousStatus = target.status;
      const trimmedReason = dto.reason.trim();

      const updated = await tx.user.update({
        where: { id: targetId },
        data: {
          status: AccountStatus.ACTIVE,
          suspendedUntil: null,
          statusReason: trimmedReason,
          statusChangedAt: now,
          statusChangedById: admin.sub,
        },
        select: {
          id: true,
          status: true,
          role: true,
          suspendedUntil: true,
          statusChangedAt: true,
          tokenVersion: true,
        },
      });

      await this.adminAuditService.record(tx, {
        adminId: admin.sub,
        action: USER_UNBAN,
        targetType: 'User',
        targetId,
        beforeState: {
          status: target.status,
          role: target.role,
          suspendedUntil: target.suspendedUntil,
          tokenVersion: target.tokenVersion,
        },
        afterState: {
          status: updated.status,
          role: updated.role,
          suspendedUntil: updated.suspendedUntil,
          tokenVersion: updated.tokenVersion,
        },
        reason: trimmedReason,
        ipAddress: ip,
        userAgent,
      });

      return {
        id: updated.id,
        status: updated.status,
        role: updated.role,
        suspendedUntil: updated.suspendedUntil,
        statusChangedAt: updated.statusChangedAt,
      };
    });

    if (!isNoOp) {
      await this.executePostCommit(
        targetId,
        'unban',
        previousStatus,
        result.status,
        result.suspendedUntil,
      );
    }

    return result;
  }

  async changeUserRole(
    admin: JwtPayload,
    targetId: string,
    dto: ChangeUserRoleDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AdminUserMutationResponse> {
    this.assertNotSelfAction(admin.sub, targetId);

    // Re-authentication of operating admin
    const adminUser = await this.prisma.user.findUnique({
      where: { id: admin.sub },
      select: { id: true, passwordHash: true },
    });

    if (!adminUser || !adminUser.passwordHash) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'REAUTH_UNAVAILABLE',
        message: 'يجب تعيين كلمة مرور لحسابك لتنفيذ هذا الإجراء الحساس',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.adminPassword, adminUser.passwordHash);
    if (!isPasswordValid) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'REAUTH_FAILED',
        message: 'كلمة مرور الأدمن غير صحيحة',
      });
    }

    let isNoOp = false;
    let previousStatus: AccountStatus = AccountStatus.ACTIVE;

    const result = await this.prisma.$transaction(async (tx) => {
      // Row lock on target to prevent concurrent mutation race conditions
      const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM users WHERE id = ${targetId} FOR UPDATE`;
      if (!locked || locked.length === 0) {
        throw new NotFoundException('المستخدم غير موجود');
      }

      const target = await tx.user.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          status: true,
          role: true,
          suspendedUntil: true,
          statusChangedAt: true,
          tokenVersion: true,
        },
      });

      if (!target) {
        throw new NotFoundException('المستخدم غير موجود');
      }

      // Block role change on BANNED or DELETED accounts
      if (target.status === AccountStatus.BANNED || target.status === AccountStatus.DELETED) {
        throw new ConflictException({
          statusCode: 409,
          code: 'INVALID_TRANSITION',
          message: 'لا يمكن تغيير دور حساب محظور أو محذوف',
        });
      }

      if (target.role === dto.role) {
        isNoOp = true;
        return {
          id: target.id,
          status: target.status,
          role: target.role,
          suspendedUntil: target.suspendedUntil,
          statusChangedAt: target.statusChangedAt,
        };
      }

      // If demoting from ADMIN to another role, check last admin protection
      if (target.role === UserRole.ADMIN && dto.role !== UserRole.ADMIN) {
        await this.checkLastAdminProtection(tx, targetId, target.role);
      }

      previousStatus = target.status;
      const trimmedReason = dto.reason.trim();

      const updated = await tx.user.update({
        where: { id: targetId },
        data: {
          role: dto.role,
          tokenVersion: { increment: 1 },
        },
        select: {
          id: true,
          status: true,
          role: true,
          suspendedUntil: true,
          statusChangedAt: true,
          tokenVersion: true,
        },
      });

      await this.tokenService.revokeAllRefreshTokens(targetId, tx);

      await this.adminAuditService.record(tx, {
        adminId: admin.sub,
        action: ROLE_CHANGE,
        targetType: 'User',
        targetId,
        beforeState: {
          status: target.status,
          role: target.role,
          suspendedUntil: target.suspendedUntil,
          tokenVersion: target.tokenVersion,
        },
        afterState: {
          status: updated.status,
          role: updated.role,
          suspendedUntil: updated.suspendedUntil,
          tokenVersion: updated.tokenVersion,
        },
        reason: trimmedReason,
        ipAddress: ip,
        userAgent,
      });

      return {
        id: updated.id,
        status: updated.status,
        role: updated.role,
        suspendedUntil: updated.suspendedUntil,
        statusChangedAt: updated.statusChangedAt,
      };
    });

    if (!isNoOp) {
      await this.executePostCommit(
        targetId,
        'role_change',
        previousStatus,
        result.status,
        result.suspendedUntil,
      );
    }

    return result;
  }

  /* ══════════════════════════════════════════════════════════════
     3. INTERNAL HELPERS
     ══════════════════════════════════════════════════════════════ */

  private assertNotSelfAction(adminId: string, targetId: string): void {
    if (adminId === targetId) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ADMIN_SELF_ACTION',
        message: 'لا يمكن للأدمن تطبيق إجراءات إدارية على حسابه الشخصي',
      });
    }
  }

  private assertModeratorCanManage(
    adminRole?: string | UserRole,
    targetRole?: string | UserRole,
  ): void {
    if (adminRole === UserRole.MODERATOR && targetRole !== UserRole.USER) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'INSUFFICIENT_ROLE',
        message: 'المشرف يمكنه تعديل حسابات المستخدمين العاديين فقط',
      });
    }
  }

  private async checkLastAdminProtection(
    tx: Prisma.TransactionClient,
    targetId: string,
    targetRole: UserRole,
  ): Promise<void> {
    if (targetRole === UserRole.ADMIN) {
      // Postgres transactional advisory lock prevents race conditions
      // when multiple admins are concurrently modified.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(${LAST_ADMIN_ADVISORY_LOCK_ID})`;

      const otherActiveAdminsCount = await tx.user.count({
        where: {
          id: { not: targetId },
          role: UserRole.ADMIN,
          status: AccountStatus.ACTIVE,
        },
      });

      if (otherActiveAdminsCount === 0) {
        throw new ConflictException({
          statusCode: 409,
          code: 'LAST_ADMIN',
          message: 'لا يمكن تعطيل أو خفض رتبة آخر أدمن نشط في النظام',
        });
      }
    }
  }

  private async executePostCommit(
    userId: string,
    action: 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'role_change',
    previousStatus: AccountStatus,
    newStatus: AccountStatus,
    suspendedUntil: Date | null,
  ): Promise<void> {
    try {
      // Immediate AccessTokenGate cache invalidation
      await this.accessTokenGate.invalidate(userId);

      // Deferred invalidation after ~2s to mitigate race condition with read replicas/caches
      const timer = setTimeout(() => {
        this.accessTokenGate.invalidate(userId).catch((err) => {
          this.logger.error(
            `Deferred token gate invalidation failed for user ${userId}: ${err?.message || err}`,
          );
        });
      }, 2000);
      if (timer.unref) {
        timer.unref();
      }

      // Socket disconnect via ChatGateway
      if (action === 'suspend') {
        await this.chatGateway.disconnectUser(userId, 'ACCOUNT_SUSPENDED');
      } else if (action === 'ban') {
        await this.chatGateway.disconnectUser(userId, 'ACCOUNT_BANNED');
      } else if (action === 'role_change') {
        await this.chatGateway.disconnectUser(userId);
      }

      // Event emission (only for actions that change account status)
      if (this.eventEmitter && action !== 'role_change') {
        this.eventEmitter.emit(USER_STATUS_CHANGED, {
          userId,
          previousStatus,
          status: newStatus,
          suspendedUntil,
          at: new Date(),
        });
      }
    } catch (err: any) {
      this.logger.error(
        `Post-commit pipeline encountered an error for user ${userId}: ${err?.message || err}`,
      );
    }
  }
}
