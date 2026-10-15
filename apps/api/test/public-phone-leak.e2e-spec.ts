import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  getApp,
  getPrisma,
  registerUser,
} from './setup';

beforeAll(async () => {
  await createTestApp();
});

afterAll(async () => {
  await closeTestApp();
});

function assertNoContactPhoneLeaks(data: unknown, path = '$'): void {
  if (data === null || data === undefined) return;

  if (Array.isArray(data)) {
    data.forEach((item, index) => assertNoContactPhoneLeaks(item, `${path}[${index}]`));
    return;
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    expect({ path, phone: obj.phone }).toEqual({ path, phone: undefined });
    expect({ path, contactPhone: obj.contactPhone }).toEqual({ path, contactPhone: undefined });
    expect({ path, whatsapp: obj.whatsapp }).toEqual({ path, whatsapp: undefined });
    expect({ path, phoneE164: obj.phoneE164 }).toEqual({ path, phoneE164: undefined });
    expect({ path, passwordHash: obj.passwordHash }).toEqual({ path, passwordHash: undefined });

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        assertNoContactPhoneLeaks(value, `${path}.${key}`);
      }
    }
  }
}

describe('Public Phone Leak Prevention & Authorized Disclosure (E2E Contract)', () => {
  describe('Public Browsing Endpoints (Must NEVER leak phone or contact numbers)', () => {
    const publicEndpoints = [
      '/api/equipment',
      '/api/parts',
      '/api/services',
      '/api/jobs',
      '/api/jobs/drivers',
      '/api/transport/carriers',
      '/api/buses',
      '/api/cars/brands',
    ];

    for (const endpoint of publicEndpoints) {
      it(`GET ${endpoint} response must not contain phone, contactPhone, whatsapp, or phoneE164 at any depth`, async () => {
        const res = await request(getApp().getHttpServer())
          .get(endpoint)
          .expect((r) => {
            // Allow 200 or other valid status if empty
            expect([200, 304]).toContain(r.status);
          });

        assertNoContactPhoneLeaks(res.body);
      });
    }
  });

  describe('Authorized Endpoints (Must disclose user.phone exclusively to authorized callers)', () => {
    it('GET /api/users/me returns authenticated user phone', async () => {
      const { accessToken, user } = await registerUser();

      // Seed a phone for the user
      await getPrisma().user.update({
        where: { id: user.id },
        data: { phone: '+96891234567' },
      });

      const res = await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.phone).toBe('+96891234567');
      expect(res.body.contactPhone).toBeUndefined();
      expect(res.body.whatsapp).toBeUndefined();
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('GET /api/users/:id (Public profile) strips phone', async () => {
      const { user } = await registerUser();

      await getPrisma().user.update({
        where: { id: user.id },
        data: { phone: '+96891234567' },
      });

      const res = await request(getApp().getHttpServer())
        .get(`/api/users/${user.id}`)
        .expect(200);

      expect(res.body.phone).toBeUndefined();
      expect(res.body.contactPhone).toBeUndefined();
      expect(res.body.whatsapp).toBeUndefined();
    });
  });
});
