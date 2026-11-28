import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser, getPrisma } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

describe('Notifications API (e2e)', () => {
  describe('GET /api/notifications', () => {
    it('should list user notifications', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .get('/api/notifications')
        .expect(401);
    });

    it('should support pagination', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .get('/api/notifications?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.count).toBeDefined();
      expect(typeof res.body.count).toBe('number');
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .get('/api/notifications/unread-count')
        .expect(401);
    });

    it('should return 0 for new user', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.count).toBe(0);
    });

    it('supports excludeChat=true to exclude MESSAGE notifications while keeping default for omitted/false/other (D-B25)', async () => {
      const { accessToken, user } = await registerUser();
      const prisma = getPrisma();
      const expired = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);

      await prisma.notification.createMany({
        data: [
          { userId: user.id, type: 'MESSAGE', title: 'Chat 1', body: 'B1', isRead: false },
          { userId: user.id, type: 'SYSTEM', title: 'Sys 1', body: 'B2', isRead: false },
          { userId: user.id, type: 'SYSTEM', title: 'Old Sys', body: 'B3', isRead: false, createdAt: expired },
        ],
      });

      const defaultRes = await request(getApp().getHttpServer())
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(defaultRes.body).toEqual({ count: 2 });

      const excludeRes = await request(getApp().getHttpServer())
        .get('/api/notifications/unread-count?excludeChat=true')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(excludeRes.body).toEqual({ count: 1 });

      for (const nonTrue of ['false', '1', 'garbage']) {
        const res = await request(getApp().getHttpServer())
          .get(`/api/notifications/unread-count?excludeChat=${encodeURIComponent(nonTrue)}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
        expect(res.body).toEqual({ count: 2 });
      }
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const { accessToken, user } = await registerUser();

      // Create a notification directly in the DB for testing
      const prisma = getPrisma();
      const notif = await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'MESSAGE',
          title: 'Test notification',
          body: 'Test body',
          isRead: false,
        },
      });

      await request(getApp().getHttpServer())
        .patch(`/api/notifications/${notif.id}/read`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify it's marked as read
      const updated = await prisma.notification.findUnique({ where: { id: notif.id } });
      expect(updated?.isRead).toBe(true);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .patch('/api/notifications/some-id/read')
        .expect(401);
    });

    it('should handle non-existent notification', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .patch('/api/notifications/00000000-0000-0000-0000-000000000000/read')
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 404]).toContain(res.status);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const { accessToken, user } = await registerUser();
      const prisma = getPrisma();

      // Create multiple notifications
      await prisma.notification.createMany({
        data: [
          { userId: user.id, type: 'MESSAGE', title: 'N1', body: 'B1', isRead: false },
          { userId: user.id, type: 'MESSAGE', title: 'N2', body: 'B2', isRead: false },
        ],
      });

      await request(getApp().getHttpServer())
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify all are read
      const count = await prisma.notification.count({
        where: { userId: user.id, isRead: false },
      });
      expect(count).toBe(0);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .patch('/api/notifications/read-all')
        .expect(401);
    });

    it('should succeed even with no notifications', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });
});
