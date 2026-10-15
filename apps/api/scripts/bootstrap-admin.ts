import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
import { normalizeEmail, isValidNormalizedEmail } from '../src/auth/auth.validators';
import { maskEmail } from '../src/admin-users/utils/pii-masker.util';
import { LAST_ADMIN_ADVISORY_LOCK_ID } from '../src/common/constants/admin-lock.constant';
import { ROLE_CHANGE } from '../src/admin-audit/admin-audit-actions.constant';
import { sanitizeAuditState } from '../src/admin-audit/admin-audit.service';

export interface BootstrapAdminOptions {
  email?: string;
  apply?: boolean;
  prisma?: PrismaClient;
}

export interface BootstrapAdminResult {
  success: boolean;
  dryRun: boolean;
  userId?: string;
  emailMasked?: string;
  previousRole?: string;
  newRole?: string;
  tokenVersion?: number;
  revokedTokensCount?: number;
  auditLogId?: string;
  message?: string;
  error?: string;
  exitCode: number;
}

export async function runBootstrapAdmin(
  options: BootstrapAdminOptions,
  logger: { log: (...args: any[]) => void; error: (...args: any[]) => void; warn: (...args: any[]) => void } = console,
): Promise<BootstrapAdminResult> {
  const shouldDisconnect = !options.prisma;
  const prisma = options.prisma || new PrismaClient();

  try {
    const rawEmail = options.email || process.env.BOOTSTRAP_ADMIN_EMAIL;
    if (!rawEmail || typeof rawEmail !== 'string') {
      logger.error(
        'Error: No email provided. Specify email as CLI argument or set BOOTSTRAP_ADMIN_EMAIL environment variable.',
      );
      return { success: false, dryRun: false, exitCode: 1, error: 'NO_EMAIL' };
    }

    const normalizedEmail = normalizeEmail(rawEmail);
    if (!normalizedEmail || !isValidNormalizedEmail(normalizedEmail)) {
      logger.error('Error: Provided email address is invalid.');
      return { success: false, dryRun: false, exitCode: 1, error: 'INVALID_EMAIL' };
    }

    const emailMasked = maskEmail(normalizedEmail) || '***@***';

    // 1. Fetch target user
    const target = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        tokenVersion: true,
      },
    });

    if (!target) {
      logger.error(`Error: User with email "${emailMasked}" was not found.`);
      return { success: false, dryRun: false, exitCode: 1, error: 'USER_NOT_FOUND', emailMasked };
    }

    // 2. Validate account status is ACTIVE
    if (target.status !== AccountStatus.ACTIVE) {
      logger.error(`Error: User "${emailMasked}" is not ACTIVE (current status: ${target.status}).`);
      return { success: false, dryRun: false, exitCode: 1, error: 'USER_NOT_ACTIVE', emailMasked };
    }

    // 3. Validate email is verified
    if (!target.emailVerifiedAt) {
      logger.error(`Error: User "${emailMasked}" does not have a verified email address.`);
      return { success: false, dryRun: false, exitCode: 1, error: 'EMAIL_NOT_VERIFIED', emailMasked };
    }

    // 4. Validate no ACTIVE ADMIN currently exists
    const existingActiveAdmin = await prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
        status: AccountStatus.ACTIVE,
      },
      select: { id: true, email: true },
    });

    if (existingActiveAdmin) {
      const adminMasked = maskEmail(existingActiveAdmin.email) || '***@***';
      logger.error(
        `Error: An ACTIVE administrator already exists in the system (${adminMasked}). ` +
          `Bootstrap script cannot be run when active admins exist. ` +
          `Use the admin management API (PATCH /api/admin/users/:id/role) instead.`,
      );
      return { success: false, dryRun: false, exitCode: 1, error: 'ACTIVE_ADMIN_EXISTS', emailMasked };
    }

    const isApply = Boolean(options.apply);

    // 5. Dry-run mode
    if (!isApply) {
      logger.log(`\n======================================================`);
      logger.log(`[DRY-RUN] Bootstrap Admin Preview (No changes made)`);
      logger.log(`======================================================`);
      logger.log(`- Target User ID:    ${target.id}`);
      logger.log(`- Target Email:      ${emailMasked}`);
      logger.log(`- Current Role:      ${target.role} -> Proposed Role: ADMIN`);
      logger.log(`- Account Status:    ${target.status}`);
      logger.log(`- Email Verified At: ${target.emailVerifiedAt.toISOString()}`);
      logger.log(`- Current tokenVer:  ${target.tokenVersion} -> Proposed: ${target.tokenVersion + 1}`);
      logger.log(`- Active Admins:     0 active admins found`);
      logger.log(`------------------------------------------------------`);
      logger.log(`Status: VALIDATION_PASSED`);
      logger.log(`To apply this promotion, re-run the command with the --apply flag.`);
      logger.log(`======================================================\n`);

      return {
        success: true,
        dryRun: true,
        exitCode: 0,
        userId: target.id,
        emailMasked,
        previousRole: target.role,
        newRole: UserRole.ADMIN,
        tokenVersion: target.tokenVersion,
        message: 'Validation passed in dry-run mode',
      };
    }

    // 6. Apply mode (inside atomic transaction with locks and re-validation)
    const txResult = await prisma.$transaction(async (tx) => {
      // Step A: Target Row Lock FOR UPDATE (must be first)
      const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM users WHERE id = ${target.id} FOR UPDATE`;
      if (!locked || locked.length === 0) {
        throw new Error(`USER_NOT_FOUND: User "${emailMasked}" was not found during row locking.`);
      }

      // Step B: Advisory lock for admin concurrency control (must be second)
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(${LAST_ADMIN_ADVISORY_LOCK_ID})::text`;

      // Step C: Re-read target user inside the locked transaction and re-validate
      const lockedTarget = await tx.user.findUnique({
        where: { id: target.id },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          status: true,
          emailVerifiedAt: true,
          tokenVersion: true,
        },
      });

      if (!lockedTarget) {
        throw new Error(`USER_NOT_FOUND: User "${emailMasked}" was not found inside transaction.`);
      }

      if (lockedTarget.status !== AccountStatus.ACTIVE) {
        throw new Error(`USER_NOT_ACTIVE: User "${emailMasked}" status changed to ${lockedTarget.status}.`);
      }

      if (!lockedTarget.emailVerifiedAt) {
        throw new Error(`EMAIL_NOT_VERIFIED: User "${emailMasked}" email is no longer verified.`);
      }

      // Step D: Re-verify inside locked transaction that no active admin exists
      const concurrentActiveAdminCount = await tx.user.count({
        where: {
          id: { not: target.id },
          role: UserRole.ADMIN,
          status: AccountStatus.ACTIVE,
        },
      });

      if (concurrentActiveAdminCount > 0) {
        throw new Error('ACTIVE_ADMIN_EXISTS: An ACTIVE administrator already exists in the system. Aborting promotion.');
      }

      // Step E: Update user role to ADMIN and increment tokenVersion
      const updated = await tx.user.update({
        where: { id: target.id },
        data: {
          role: UserRole.ADMIN,
          tokenVersion: { increment: 1 },
        },
        select: {
          id: true,
          role: true,
          status: true,
          tokenVersion: true,
        },
      });

      // Step F: Revoke all refresh tokens
      const revoked = await tx.refreshToken.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      // Step G: Record audit log (reason >= 10 chars, includes "bootstrap")
      // Since adminId is non-nullable, target user acts as self-bootstrap actor
      const auditReason = 'System bootstrap: initial active administrator account promotion';
      const auditLog = await tx.adminAuditLog.create({
        data: {
          adminId: target.id,
          action: ROLE_CHANGE,
          targetType: 'User',
          targetId: target.id,
          beforeState: sanitizeAuditState({
            role: lockedTarget.role,
            tokenVersion: lockedTarget.tokenVersion,
          }),
          afterState: sanitizeAuditState({
            role: updated.role,
            tokenVersion: updated.tokenVersion,
          }),
          reason: auditReason,
        },
      });

      return {
        updated,
        revokedCount: revoked.count,
        auditLogId: auditLog.id,
      };
    });

    logger.log(`\n======================================================`);
    logger.log(`✔ SUCCESS: User successfully promoted to ADMIN!`);
    logger.log(`======================================================`);
    logger.log(`- Target User ID:        ${txResult.updated.id}`);
    logger.log(`- Target Email:          ${emailMasked}`);
    logger.log(`- New Role:              ${txResult.updated.role}`);
    logger.log(`- New tokenVersion:      ${txResult.updated.tokenVersion}`);
    logger.log(`- Revoked RefreshTokens: ${txResult.revokedCount}`);
    logger.log(`- Audit Log ID:          ${txResult.auditLogId}`);
    logger.log(`------------------------------------------------------`);
    logger.log(`IMPORTANT INSTRUCTIONS FOR THE NEW ADMINISTRATOR:`);
    logger.log(`The newly promoted administrator must LOG OUT completely and LOG IN`);
    logger.log(`again to issue a new access token reflecting the ADMIN role.`);
    logger.log(`All existing refresh tokens and session tokens have been invalidated.`);
    logger.log(`======================================================\n`);

    return {
      success: true,
      dryRun: false,
      exitCode: 0,
      userId: txResult.updated.id,
      emailMasked,
      previousRole: target.role,
      newRole: txResult.updated.role,
      tokenVersion: txResult.updated.tokenVersion,
      revokedTokensCount: txResult.revokedCount,
      auditLogId: txResult.auditLogId,
      message: 'User promoted to ADMIN successfully',
    };
  } catch (err: any) {
    logger.error(`Error during bootstrap-admin execution: ${err?.message || err}`);
    const codeMatch = typeof err?.message === 'string' ? err.message.match(/^(USER_NOT_FOUND|USER_NOT_ACTIVE|EMAIL_NOT_VERIFIED|ACTIVE_ADMIN_EXISTS)/) : null;
    const errorCode = codeMatch ? codeMatch[1] : (err?.message || 'INTERNAL_ERROR');
    return {
      success: false,
      dryRun: false,
      exitCode: 1,
      error: errorCode,
    };
  } finally {
    if (shouldDisconnect) {
      await prisma.$disconnect();
    }
  }
}

function parseCliArgs(): BootstrapAdminOptions {
  const args = process.argv.slice(2);
  let email: string | undefined = undefined;
  let apply = false;

  for (const arg of args) {
    if (arg === '--apply') {
      apply = true;
    } else if (arg.startsWith('--email=')) {
      email = arg.slice('--email='.length);
    } else if (!arg.startsWith('--')) {
      email = arg;
    }
  }

  return { email, apply };
}

if (
  require.main === module ||
  (typeof process !== 'undefined' && process.argv[1]?.includes('bootstrap-admin'))
) {
  const options = parseCliArgs();
  runBootstrapAdmin(options)
    .then((result) => {
      process.exit(result.exitCode);
    })
    .catch((err) => {
      console.error('Fatal bootstrap-admin error:', err);
      process.exit(1);
    });
}
