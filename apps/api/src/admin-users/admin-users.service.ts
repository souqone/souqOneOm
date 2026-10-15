import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { maskEmail, maskPhone } from './utils/pii-masker.util';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { QueryAdminAuditLogsDto } from './dto/query-admin-audit-logs.dto';
import {
  AdminUserListResponse,
  AdminUserDetailResponse,
  AdminUserAuditLogResponse,
} from './admin-users.types';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

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
}
