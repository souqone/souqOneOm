import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  getApp,
  getPrisma,
  registerUser,
  registerAdmin,
  registerModerator,
} from './setup';
import { AdminUsersService } from '../src/admin-users/admin-users.service';

beforeAll(async () => {
  await createTestApp();
});

afterAll(async () => {
  await closeTestApp();
});

describe('Admin Users API (e2e)', () => {
  it('should reject unauthenticated requests with 401', async () => {
    await request(getApp().getHttpServer())
      .get('/api/admin/users')
      .expect(401);

    await request(getApp().getHttpServer())
      .get('/api/admin/users/audit-logs')
      .expect(401);
  });

  it('should reject standard USER role from accessing admin users endpoints', async () => {
    const user = await registerUser();

    await request(getApp().getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(403);

    await request(getApp().getHttpServer())
      .get('/api/admin/users/audit-logs')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(403);
  });

  it('should allow ADMIN to list users with masked PII', async () => {
    const admin = await registerAdmin();
    const target = await registerUser({
      email: 'target_pii@example.test',
      username: 'targetpii',
    });

    const res = await request(getApp().getHttpServer())
      .get('/api/admin/users')
      .query({ q: 'targetpii' })
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(res.body.users).toBeDefined();
    expect(res.body.users.length).toBeGreaterThanOrEqual(1);

    const found = res.body.users.find((u: any) => u.id === target.user.id);
    expect(found).toBeDefined();
    expect(found.email).toMatch(/^t\*{3}@example\.test$/);
    expect(found.phone).toMatch(/^\+968\*{3}67$/);
    expect(found.passwordHash).toBeUndefined();
  });

  it('should reject ADMIN self-action with 403 ADMIN_SELF_ACTION', async () => {
    const admin = await registerAdmin();

    const res = await request(getApp().getHttpServer())
      .post(`/api/admin/users/${admin.user.id}/suspend`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Self suspension attempt' })
      .expect(403);

    expect(res.body.code).toBe('ADMIN_SELF_ACTION');
  });

  it('should suspend user and enforce login rejection with ACCOUNT_SUSPENDED', async () => {
    const admin = await registerAdmin();
    const targetPassword = 'TargetUserPass123!';
    const target = await registerUser({
      email: 'to_suspend@example.test',
      password: targetPassword,
    });

    // Suspend user
    const suspendRes = await request(getApp().getHttpServer())
      .post(`/api/admin/users/${target.user.id}/suspend`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Suspended for test policy violation' })
      .expect(200);

    expect(suspendRes.body.status).toBe('SUSPENDED');
    expect(suspendRes.body.suspendedUntil).toBeDefined();

    // Verify login rejection with 403 ACCOUNT_SUSPENDED
    const loginRes = await request(getApp().getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'to_suspend@example.test',
        password: targetPassword,
      })
      .expect(403);

    expect(loginRes.body.code).toBe('ACCOUNT_SUSPENDED');
    expect(loginRes.body.suspendedUntil).toBeDefined();
  });

  it('should unsuspend user and restore login access', async () => {
    const admin = await registerAdmin();
    const targetPassword = 'TargetUserPass123!';
    const target = await registerUser({
      email: 'to_unsuspend@example.test',
      password: targetPassword,
    });

    // Suspend first
    await request(getApp().getHttpServer())
      .post(`/api/admin/users/${target.user.id}/suspend`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Temporary suspension' })
      .expect(200);

    // Unsuspend
    const unsuspendRes = await request(getApp().getHttpServer())
      .post(`/api/admin/users/${target.user.id}/unsuspend`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Appeal accepted by admin' })
      .expect(200);

    expect(unsuspendRes.body.status).toBe('ACTIVE');
    expect(unsuspendRes.body.suspendedUntil).toBeNull();

    // Verify login now succeeds
    const loginRes = await request(getApp().getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'to_unsuspend@example.test',
        password: targetPassword,
      })
      .expect(201);

    expect(loginRes.body.accessToken).toBeDefined();
  });

  it('should ban user and reject MODERATOR from performing ban', async () => {
    const admin = await registerAdmin();
    const moderator = await registerModerator();
    const targetPassword = 'TargetUserPass123!';
    const target = await registerUser({
      email: 'to_ban@example.test',
      password: targetPassword,
    });

    // Moderator cannot ban -> 403 Forbidden
    await request(getApp().getHttpServer())
      .post(`/api/admin/users/${target.user.id}/ban`)
      .set('Authorization', `Bearer ${moderator.accessToken}`)
      .send({ reason: 'Mod trying to ban' })
      .expect(403);

    // Admin bans user -> 200
    const banRes = await request(getApp().getHttpServer())
      .post(`/api/admin/users/${target.user.id}/ban`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Severe policy violation permanent ban' })
      .expect(200);

    expect(banRes.body.status).toBe('BANNED');

    // Login fails with 403 ACCOUNT_BANNED
    const loginRes = await request(getApp().getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'to_ban@example.test',
        password: targetPassword,
      })
      .expect(403);

    expect(loginRes.body.code).toBe('ACCOUNT_BANNED');
  });

  it('should unban user and restore login access', async () => {
    const admin = await registerAdmin();
    const targetPassword = 'TargetUserPass123!';
    const target = await registerUser({
      email: 'to_unban@example.test',
      password: targetPassword,
    });

    // Ban first
    await request(getApp().getHttpServer())
      .post(`/api/admin/users/${target.user.id}/ban`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Banned first' })
      .expect(200);

    // Unban
    const unbanRes = await request(getApp().getHttpServer())
      .post(`/api/admin/users/${target.user.id}/unban`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Unbanned after dispute resolution' })
      .expect(200);

    expect(unbanRes.body.status).toBe('ACTIVE');

    // Login succeeds
    await request(getApp().getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'to_unban@example.test',
        password: targetPassword,
      })
      .expect(201);
  });

  it('should require admin password for role change and protect against last admin demotion', async () => {
    const admin = await registerAdmin({ password: 'AdminPassword123!' });
    const target = await registerUser({ email: 'target_role@example.test' });

    // Wrong password -> 403 REAUTH_FAILED
    const wrongPassRes = await request(getApp().getHttpServer())
      .patch(`/api/admin/users/${target.user.id}/role`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        role: 'MODERATOR',
        reason: 'Promotion with wrong password',
        adminPassword: 'WrongPassword!',
      })
      .expect(403);

    expect(wrongPassRes.body.code).toBe('REAUTH_FAILED');

    // Correct password -> 200
    const changeRes = await request(getApp().getHttpServer())
      .patch(`/api/admin/users/${target.user.id}/role`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        role: 'MODERATOR',
        reason: 'Promotion to moderator approved',
        adminPassword: 'AdminPassword123!',
      })
      .expect(200);

    expect(changeRes.body.role).toBe('MODERATOR');

    // Ensure last admin cannot be demoted (even with correct password, but self-action guard prevents it first)
    const selfDemoteRes = await request(getApp().getHttpServer())
      .patch(`/api/admin/users/${admin.user.id}/role`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        role: 'USER',
        reason: 'Demote myself',
        adminPassword: 'AdminPassword123!',
      })
      .expect(403);

    expect(selfDemoteRes.body.code).toBe('ADMIN_SELF_ACTION');
  });

  it('should successfully demote admin when multiple active admins exist, but reject demoting the last active admin with 409 LAST_ADMIN', async () => {
    const adminA = await registerAdmin({ email: 'admin_a_demote@example.test', password: 'AdminAPassword123!' });
    const adminB = await registerAdmin({ email: 'admin_b_demote@example.test', password: 'AdminBPassword123!' });

    const prisma = getPrisma();
    // Ensure adminA and adminB are the only active admins in the database
    await prisma.user.updateMany({
      where: {
        role: 'ADMIN',
        id: { notIn: [adminA.user.id, adminB.user.id] },
      },
      data: { role: 'MODERATOR' },
    });

    // 1. Admin A demotes Admin B to MODERATOR -> SUT executes pg_advisory_xact_lock with ::text cast and succeeds (200)
    const demoteBRes = await request(getApp().getHttpServer())
      .patch(`/api/admin/users/${adminB.user.id}/role`)
      .set('Authorization', `Bearer ${adminA.accessToken}`)
      .send({
        role: 'MODERATOR',
        reason: 'Demoting Admin B to MODERATOR as requested',
        adminPassword: 'AdminAPassword123!',
      })
      .expect(200);

    expect(demoteBRes.body.role).toBe('MODERATOR');

    // Verify Admin B is now MODERATOR in database
    const userBAfter = await prisma.user.findUnique({ where: { id: adminB.user.id } });
    expect(userBAfter?.role).toBe('MODERATOR');

    // 2. Now Admin A is the sole remaining active admin in the system.
    // An attempt to demote Admin A must trigger checkLastAdminProtection and fail with 409 LAST_ADMIN
    const adminUsersService = getApp().get(AdminUsersService);
    let lastAdminError: any;
    try {
      await adminUsersService.changeUserRole(
        { sub: adminB.user.id, role: 'ADMIN', tokenVersion: 0 } as any,
        adminA.user.id,
        {
          role: 'MODERATOR' as any,
          reason: 'Attempting to demote the sole remaining active admin',
          adminPassword: 'AdminBPassword123!',
        },
      );
    } catch (err) {
      lastAdminError = err;
    }

    expect(lastAdminError).toBeDefined();
    expect(lastAdminError.getStatus()).toBe(409);
    expect(lastAdminError.getResponse().code).toBe('LAST_ADMIN');

    // Confirm that exactly one ACTIVE admin remains in the system
    const activeAdminsCount = await prisma.user.count({
      where: {
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    expect(activeAdminsCount).toBe(1);
  });

  it('should query audit logs for ADMIN and reject MODERATOR', async () => {
    const admin = await registerAdmin();
    const moderator = await registerModerator();

    // Moderator cannot view audit logs -> 403
    await request(getApp().getHttpServer())
      .get('/api/admin/users/audit-logs')
      .set('Authorization', `Bearer ${moderator.accessToken}`)
      .expect(403);

    // Admin can view audit logs -> 200
    const res = await request(getApp().getHttpServer())
      .get('/api/admin/users/audit-logs')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(res.body.logs).toBeDefined();
    expect(Array.isArray(res.body.logs)).toBe(true);
  });

  it('should reject role change on BANNED user with 409 INVALID_TRANSITION', async () => {
    const admin = await registerAdmin({ password: 'AdminPassword123!' });
    const target = await registerUser({ email: 'target_banned_role@example.test' });

    // Ban user first
    await request(getApp().getHttpServer())
      .post(`/api/admin/users/${target.user.id}/ban`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Banned before role change attempt' })
      .expect(200);

    // Attempt role change on banned user -> 409 INVALID_TRANSITION
    const res = await request(getApp().getHttpServer())
      .patch(`/api/admin/users/${target.user.id}/role`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        role: 'MODERATOR',
        reason: 'Illegal promotion of banned user',
        adminPassword: 'AdminPassword123!',
      })
      .expect(409);

    expect(res.body.code).toBe('INVALID_TRANSITION');
  });
});

