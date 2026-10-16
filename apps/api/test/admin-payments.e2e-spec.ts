import request from 'supertest';
import { getQueueToken } from '@nestjs/bull';
import {
  createTestApp,
  closeTestApp,
  getApp,
  getPrisma,
  registerUser,
  registerAdmin,
  registerModerator,
} from './setup';
import { PAYMENT_DLQ } from '../src/payments/payment-webhook.processor';

describe('Admin Payments API (e2e) - RBAC & Guard Retirement', () => {
  let adminToken: string;
  let modToken: string;
  let userToken: string;
  let testPaymentId: string;
  let dlq: any;

  beforeAll(async () => {
    await createTestApp();
    const prisma = getPrisma();

    // Mock Bull DLQ queue methods so metrics and dlq endpoints return 200 without requiring live Redis
    try {
      dlq = getApp().get(getQueueToken(PAYMENT_DLQ));
      if (dlq) {
        jest.spyOn(dlq, 'getWaitingCount').mockResolvedValue(0);
        jest.spyOn(dlq, 'getFailedCount').mockResolvedValue(0);
        jest.spyOn(dlq, 'getWaiting').mockResolvedValue([]);
        jest.spyOn(dlq, 'getFailed').mockResolvedValue([]);
      }
    } catch {
      // In case queue provider is not found or already mocked
    }

    // Register test accounts using strictly safe example.test domain
    const admin = await registerAdmin({
      email: 'admin-payments@example.test',
      username: 'adminpay',
    });
    adminToken = admin.accessToken;

    const mod = await registerModerator({
      email: 'mod-payments@example.test',
      username: 'modpay',
    });
    modToken = mod.accessToken;

    const user = await registerUser({
      email: 'user-payments@example.test',
      username: 'userpay',
    });
    userToken = user.accessToken;

    // Seed test payment with events with explicit timestamps to guarantee deterministic ordering
    const now = Date.now();
    const createdEventTime = new Date(now - 2000);
    const paidEventTime = new Date(now);

    const payment = await prisma.payment.create({
      data: {
        userId: user.user.id,
        amount: 5000,
        currency: 'OMR',
        type: 'FEATURED',
        status: 'PAID',
        paidAt: paidEventTime,
        events: {
          create: [
            { event: 'CREATED', data: { initiatedBy: user.user.id }, createdAt: createdEventTime },
            { event: 'PAID', data: { method: 'TEST_CARD' }, createdAt: paidEventTime },
          ],
        },
      },
    });
    testPaymentId = payment.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  const routes = [
    { name: 'findAll', getPath: () => '/api/admin/payments' },
    { name: 'getStats', getPath: () => '/api/admin/payments/stats' },
    { name: 'getMetrics', getPath: () => '/api/admin/payments/metrics' },
    { name: 'getDlqJobs', getPath: () => '/api/admin/payments/dlq' },
    { name: 'getPaymentEvents', getPath: () => `/api/admin/payments/${testPaymentId}/events` },
  ];

  describe('1. Unauthenticated Requests (401 Unauthorized)', () => {
    it.each(routes)('rejects $name without token with 401', async ({ getPath }) => {
      const res = await request(getApp().getHttpServer()).get(getPath());
      expect(res.status).toBe(401);
    });
  });

  describe('2. Legacy x-admin-key Retirement (401 Unauthorized)', () => {
    it.each(routes)(
      'rejects $name with legacy x-admin-key header and no JWT with 401',
      async ({ getPath }) => {
        const res = await request(getApp().getHttpServer())
          .get(getPath())
          .set('x-admin-key', 'legacy-key-attempt');

        expect(res.status).toBe(401);
      },
    );
  });

  describe('3. Forbidden Roles (403 Forbidden)', () => {
    it.each(routes)('rejects regular USER on $name with 403', async ({ getPath }) => {
      const res = await request(getApp().getHttpServer())
        .get(getPath())
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it.each(routes)('rejects MODERATOR on $name with 403', async ({ getPath }) => {
      const res = await request(getApp().getHttpServer())
        .get(getPath())
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('4. Authorized ADMIN Access (200 OK)', () => {
    it('GET /api/admin/payments returns 200 with paginated payment items', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/admin/payments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/admin/payments/stats returns 200 with revenue and status breakdown', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/admin/payments/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalRevenueBaisa');
      expect(res.body).toHaveProperty('totalRevenueOMR');
      expect(res.body).toHaveProperty('byStatus');
    });

    it('GET /api/admin/payments/metrics returns 200 with successRate and dlq counts', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/admin/payments/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('successRate');
      expect(res.body).toHaveProperty('totalPayments');
      expect(res.body).toHaveProperty('dlq');
      expect(res.body.dlq).toEqual({ waiting: 0, failed: 0 });
    });

    it('GET /api/admin/payments/dlq returns 200 with waiting and failed jobs list', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/admin/payments/dlq')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('waiting');
      expect(res.body).toHaveProperty('failed');
      expect(res.body).toHaveProperty('counts');
      expect(res.body.counts).toEqual({ waiting: 0, failed: 0 });
    });

    it('GET /api/admin/payments/:paymentId/events returns 200 with historical events', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/admin/payments/${testPaymentId}/events`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.paymentId).toBe(testPaymentId);
      expect(Array.isArray(res.body.events)).toBe(true);
      expect(res.body.events.length).toBe(2);
      expect(res.body.events[0].event).toBe('CREATED');
      expect(res.body.events[1].event).toBe('PAID');
    });
  });
});
