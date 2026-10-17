import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  getApp,
  registerUser,
} from './setup';
import {
  WHATSAPP_OTP_SENDER,
  MockWhatsappOtpSender,
} from '../src/whatsapp';

beforeAll(async () => {
  await createTestApp();
});

afterAll(async () => {
  await closeTestApp();
});

describe('Phone Verification E2E API (/api/users/me/phone)', () => {
  let sender: MockWhatsappOtpSender;
  let lastCapturedCode = '';

  beforeAll(() => {
    sender = getApp().get(WHATSAPP_OTP_SENDER);
    const origSend = sender.send.bind(sender);
    jest.spyOn(sender, 'send').mockImplementation(async (opts) => {
      lastCapturedCode = opts.code;
      return origSend(opts);
    });
  });

  afterEach(() => {
    lastCapturedCode = '';
  });

  describe('Authentication (401 Unauthorized)', () => {
    it('rejects POST /api/users/me/phone/request without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/users/me/phone/request')
        .expect(401);
    });

    it('rejects POST /api/users/me/phone/verify without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/users/me/phone/verify')
        .send({ code: '123456' })
        .expect(401);
    });
  });

  describe('DTO Validation (400 Bad Request)', () => {
    it('rejects verify with missing code', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/users/me/phone/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(res.body.message).toBeDefined();
    });

    it('rejects verify with non-6-digit code', async () => {
      const { accessToken } = await registerUser();

      // Letters
      await request(getApp().getHttpServer())
        .post('/api/users/me/phone/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: 'abcdef' })
        .expect(400);

      // 5 digits
      await request(getApp().getHttpServer())
        .post('/api/users/me/phone/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: '12345' })
        .expect(400);

      // 7 digits
      await request(getApp().getHttpServer())
        .post('/api/users/me/phone/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: '1234567' })
        .expect(400);
    });
  });

  describe('Full Verification Lifecycle', () => {
    const defaultPassword = 'TestPassword123!';

    it('completes the full flow: request -> verify -> profile check -> idempotent check', async () => {
      const { accessToken } = await registerUser({ password: defaultPassword });
      const phone1 = '+9689' + Math.floor(1000000 + Math.random() * 9000000);
      const phone2 = '+9689' + Math.floor(1000000 + Math.random() * 9000000);

      // 1. Initial state: user has phone, unverified
      await request(getApp().getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: phone1 })
        .expect(200);

      const profileBefore = await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileBefore.body.phoneVerified).toBe(false);
      expect(profileBefore.body.phoneE164).toBeUndefined();

      // 2. Request OTP
      const requestRes = await request(getApp().getHttpServer())
        .post('/api/users/me/phone/request')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(requestRes.body).toEqual({ sent: true });
      expect(lastCapturedCode).toMatch(/^\d{6}$/);

      // 3. Verify with wrong code fails
      await request(getApp().getHttpServer())
        .post('/api/users/me/phone/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: '000000' })
        .expect(400);

      // 4. Verify with correct code succeeds
      const verifyRes = await request(getApp().getHttpServer())
        .post('/api/users/me/phone/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: lastCapturedCode })
        .expect(200);

      expect(verifyRes.body).toEqual({ phoneVerified: true });

      // 5. Profile check shows phoneVerified: true without leaking phoneE164
      const profileAfter = await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileAfter.body.phoneVerified).toBe(true);
      expect(profileAfter.body.phoneE164).toBeUndefined();

      // 6. Idempotency: requesting OTP on already-verified phone returns { alreadyVerified: true }
      const alreadyReq = await request(getApp().getHttpServer())
        .post('/api/users/me/phone/request')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(alreadyReq.body).toEqual({ alreadyVerified: true });

      // 7. Changing phone requires step-up (currentPassword) and resets verification
      // Without currentPassword -> 403 STEP_UP_REQUIRED
      await request(getApp().getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: phone2 })
        .expect(403);

      // With wrong currentPassword -> 403 STEP_UP_REQUIRED
      await request(getApp().getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: phone2, currentPassword: 'WrongPassword' })
        .expect(403);

      // With correct currentPassword -> 200, verification cleared
      const patchRes = await request(getApp().getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: phone2, currentPassword: defaultPassword })
        .expect(200);

      expect(patchRes.body.phoneVerified).toBe(false);

      const profileReset = await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileReset.body.phoneVerified).toBe(false);
    });

    it('rejects another user from verifying an already claimed phone number (409 Conflict)', async () => {
      const user1 = await registerUser({ password: defaultPassword });
      const user2 = await registerUser({ password: defaultPassword });

      const sharedPhone = '+9689' + Math.floor(1000000 + Math.random() * 9000000);

      // User 1 sets and verifies sharedPhone
      await request(getApp().getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ phone: sharedPhone })
        .expect(200);

      await request(getApp().getHttpServer())
        .post('/api/users/me/phone/request')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .expect(200);

      await request(getApp().getHttpServer())
        .post('/api/users/me/phone/verify')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ code: lastCapturedCode })
        .expect(200);

      // User 2 sets profile phone to sharedPhone
      await request(getApp().getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ phone: sharedPhone })
        .expect(200);

      // User 2 requests verification on sharedPhone -> rejected 409 PHONE_ALREADY_VERIFIED
      const reqRes = await request(getApp().getHttpServer())
        .post('/api/users/me/phone/request')
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(409);

      expect(reqRes.body.code).toBe('PHONE_ALREADY_VERIFIED');
      expect(reqRes.body.message).toBe('رقم الهاتف هذا موثق بالفعل لحساب آخر');
    });
  });
});
