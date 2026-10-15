import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditEntry } from './admin-audit.types';

/**
 * List of sensitive keys stripped recursively from beforeState and afterState
 * snapshots before storing in admin_audit_logs to prevent credential or PII leaks.
 *
 * Keys stripped:
 * - password, passwordHash
 * - token, refreshToken, otp, secret
 * - email, phone, phoneE164
 */
export const SENSITIVE_AUDIT_KEYS: ReadonlySet<string> = new Set([
  'password',
  'passwordhash',
  'token',
  'refreshtoken',
  'otp',
  'secret',
  'email',
  'phone',
  'phonee164',
]);

/**
 * Recursively sanitizes any value (object/array/primitive), stripping sensitive keys.
 */
export function sanitizeAuditState<T = any>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditState(item)) as unknown as T;
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_AUDIT_KEYS.has(key.toLowerCase())) {
        continue;
      }
      sanitized[key] = sanitizeAuditState(val);
    }
    return sanitized as T;
  }

  return value;
}

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  /**
   * Records an admin action in admin_audit_logs table.
   * Accepts either Prisma.TransactionClient or PrismaService to support atomic transactions.
   */
  async record(
    client: Prisma.TransactionClient | PrismaService,
    entry: AdminAuditEntry,
  ) {
    if (
      !entry.reason ||
      typeof entry.reason !== 'string' ||
      entry.reason.trim().length < 10
    ) {
      throw new BadRequestException('سبب الإجراء إلزامي ويجب ألا يقل عن 10 أحرف');
    }

    const trimmedReason = entry.reason.trim();
    const sanitizedBefore = entry.beforeState !== undefined
      ? sanitizeAuditState(entry.beforeState)
      : undefined;
    const sanitizedAfter = entry.afterState !== undefined
      ? sanitizeAuditState(entry.afterState)
      : undefined;

    this.logger.log(
      `Recording admin audit log: admin=${entry.adminId} action=${entry.action} target=${entry.targetType}:${entry.targetId}`,
    );

    return await client.adminAuditLog.create({
      data: {
        adminId: entry.adminId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        beforeState:
          sanitizedBefore !== undefined && sanitizedBefore !== null
            ? (sanitizedBefore as Prisma.InputJsonValue)
            : Prisma.DbNull,
        afterState:
          sanitizedAfter !== undefined && sanitizedAfter !== null
            ? (sanitizedAfter as Prisma.InputJsonValue)
            : Prisma.DbNull,
        reason: trimmedReason,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        requestId: entry.requestId ?? null,
      },
    });
  }
}
