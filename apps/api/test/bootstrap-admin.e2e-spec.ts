import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  getApp,
  getPrisma,
  registerUser,
} from './setup';
import { runBootstrapAdmin } from '../scripts/bootstrap-admin';

beforeAll(async () => {
  await createTestApp();
});

afterAll(async () => {
  await closeTestApp();
});

describe('Bootstrap Admin Script (e2e)', () => {
  it('previews promotion in dry-run mode without modifying user in PostgreSQL', async () => {
    const candidate = await registerUser({
      email: 'candidate_dryrun@example.test',
      username: 'cand_dryrun',
    });

    const prisma = getPrisma();
    const userBefore = await prisma.user.findUnique({
      where: { id: candidate.user.id },
    });
    expect(userBefore?.role).toBe('USER');
    expect(userBefore?.tokenVersion).toBe(0);

    const result = await runBootstrapAdmin({
      email: 'candidate_dryrun@example.test',
      apply: false,
      prisma,
    });

    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.exitCode).toBe(0);

    // Verify user was NOT modified in the database
    const userAfter = await prisma.user.findUnique({
      where: { id: candidate.user.id },
    });
    expect(userAfter?.role).toBe('USER');
    expect(userAfter?.tokenVersion).toBe(0);
  });

  it('promotes user to ADMIN upon --apply, increments tokenVersion, and invalidates old token', async () => {
    const password = 'TargetPassword123!';
    const candidate = await registerUser({
      email: 'candidate_apply@example.test',
      username: 'cand_apply',
      password,
    });

    const prisma = getPrisma();

    // 1. Run bootstrap with apply: true
    const result = await runBootstrapAdmin({
      email: 'candidate_apply@example.test',
      apply: true,
      prisma,
    });

    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(false);
    expect(result.exitCode).toBe(0);
    expect(result.newRole).toBe('ADMIN');

    // 2. Verify database records
    const updatedUser = await prisma.user.findUnique({
      where: { id: candidate.user.id },
    });
    expect(updatedUser?.role).toBe('ADMIN');
    expect(updatedUser?.tokenVersion).toBe(1); // Incremented from 0 to 1

    // 3. Verify audit log was recorded
    const auditLog = await prisma.adminAuditLog.findFirst({
      where: { targetId: candidate.user.id },
    });
    expect(auditLog).toBeDefined();
    expect(auditLog?.adminId).toBe(candidate.user.id);
    expect(auditLog?.action).toBe('BOOTSTRAP_ADMIN');
    expect(auditLog?.reason).toContain('bootstrap');

    // 4. Old access token has outdated tokenVersion (0) - AccessTokenGate rejects it
    await request(getApp().getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .expect(401);

    // 5. Fresh login obtains valid ADMIN token with new tokenVersion
    const loginRes = await request(getApp().getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'candidate_apply@example.test',
        password,
      })
      .expect(201);

    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.user.role).toBe('ADMIN');

    // 6. New token successfully accesses admin endpoints
    const adminRes = await request(getApp().getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);

    expect(adminRes.body.users).toBeDefined();

    // 7. Verify GET /admin/users/audit-logs accepts and filters by action=BOOTSTRAP_ADMIN
    const auditLogsRes = await request(getApp().getHttpServer())
      .get('/api/admin/users/audit-logs?action=BOOTSTRAP_ADMIN')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);

    expect(auditLogsRes.body.logs).toBeDefined();
    expect(
      auditLogsRes.body.logs.some(
        (l: any) => l.action === 'BOOTSTRAP_ADMIN' && l.targetId === candidate.user.id,
      ),
    ).toBe(true);
  });

  it('rejects subsequent bootstrap attempts once an ACTIVE ADMIN already exists', async () => {
    // There is already an active admin from previous test
    const anotherCandidate = await registerUser({
      email: 'second_candidate@example.test',
      username: 'second_cand',
    });

    const prisma = getPrisma();
    const result = await runBootstrapAdmin({
      email: 'second_candidate@example.test',
      apply: true,
      prisma,
    });

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.error).toBe('ACTIVE_ADMIN_EXISTS');

    // User was not promoted
    const user = await prisma.user.findUnique({
      where: { id: anotherCandidate.user.id },
    });
    expect(user?.role).toBe('USER');
  });

  it('handles concurrent executions on the same user gracefully with row/advisory locking', async () => {
    const prisma = getPrisma();

    // Reset any existing active admins so bootstrap is permitted
    await prisma.user.updateMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      data: { role: 'USER' },
    });

    const candidate = await registerUser({
      email: 'concurrent_target@example.test',
      username: 'concurrent_target',
    });

    // Run two bootstrap attempts concurrently targeting the exact same user
    const [res1, res2] = await Promise.all([
      runBootstrapAdmin({
        email: 'concurrent_target@example.test',
        apply: true,
        prisma,
      }),
      runBootstrapAdmin({
        email: 'concurrent_target@example.test',
        apply: true,
        prisma,
      }),
    ]);

    const successfulRuns = [res1, res2].filter((r) => r.success);
    const failedRuns = [res1, res2].filter((r) => !r.success);

    // Exactly one run succeeds, and exactly one run fails
    expect(successfulRuns).toHaveLength(1);
    expect(failedRuns).toHaveLength(1);

    // The failed run rejected either inside the transaction (ALREADY_ADMIN) or pre-transaction (ACTIVE_ADMIN_EXISTS)
    expect(['ALREADY_ADMIN', 'ACTIVE_ADMIN_EXISTS']).toContain(failedRuns[0].error);

    // Verify audit log has exactly 1 BOOTSTRAP_ADMIN record for this user
    const auditLogs = await prisma.adminAuditLog.findMany({
      where: {
        targetId: candidate.user.id,
        action: 'BOOTSTRAP_ADMIN',
      },
    });
    expect(auditLogs).toHaveLength(1);

    // Verify tokenVersion incremented exactly once (0 -> 1)
    const userAfter = await prisma.user.findUnique({
      where: { id: candidate.user.id },
    });
    expect(userAfter?.role).toBe('ADMIN');
    expect(userAfter?.tokenVersion).toBe(1);
  });
});
