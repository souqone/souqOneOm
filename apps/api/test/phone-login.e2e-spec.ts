import request from 'supertest';
import { createTestApp, closeTestApp, getApp } from './setup';
import {
  WHATSAPP_OTP_SENDER,
  MockWhatsappOtpSender,
} from '../src/whatsapp';

describe('Phone Login & Signup v2 E2E API (/api/auth/otp)', () => {
  let sender: MockWhatsappOtpSender;
  let lastCapturedCode = '';

  beforeAll(async () => {
    await createTestApp();
    sender = getApp().get(WHATSAPP_OTP_SENDER);
    const origSend = sender.send.bind(sender);
    jest.spyOn(sender, 'send').mockImplementation(async (opts) => {
      lastCapturedCode = opts.code;
      return origSend(opts);
    });
  });

  afterAll(async () => {
    await closeTestApp();
  });

  afterEach(() => {
    lastCapturedCode = '';
  });

  describe('Validation & Edge cases', () => {
    it('POST /api/auth/otp/request rejects invalid or unsupported country phone with 400', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/auth/otp/request')
        .send({ phone: '+12025550199' })
        .expect(400);

      expect(res.body.code).toBe('PHONE_COUNTRY_NOT_ALLOWED');
    });

    it('POST /api/auth/otp/verify rejects invalid OTP with 400 INVALID_OTP', async () => {
      const phone = '94441111';
      // First request OTP
      await request(getApp().getHttpServer())
        .post('/api/auth/otp/request')
        .send({ phone })
        .expect(200);

      const res = await request(getApp().getHttpServer())
        .post('/api/auth/otp/verify')
        .send({ phone, code: '000000' })
        .expect(400);

      expect(res.body.code).toBe('INVALID_OTP');
    });
  });

  describe('Full Flow: Signup v2 and Existing User Login', () => {
    const testPhone = '94442222';
    let createdUserId = '';

    it('Path 1 (Signup v2): brand new phone creates verified account and returns session tokens', async () => {
      // 1. Request OTP
      const reqRes = await request(getApp().getHttpServer())
        .post('/api/auth/otp/request')
        .send({ phone: testPhone })
        .expect(200);

      expect(reqRes.body).toEqual({ sent: true });
      expect(lastCapturedCode).toMatch(/^\d{6}$/);

      // 2. Verify OTP
      const verifyRes = await request(getApp().getHttpServer())
        .post('/api/auth/otp/verify')
        .send({ phone: testPhone, code: lastCapturedCode })
        .expect(200);

      expect(verifyRes.body.accessToken).toBeDefined();
      expect(verifyRes.body.refreshToken).toBeDefined();
      expect(verifyRes.body.user).toBeDefined();

      const user = verifyRes.body.user;
      createdUserId = user.id;
      expect(user.phone).toBe('+96894442222');
      expect(user.isVerified).toBe(true);
      expect(user.displayName).toBe('مستخدم 2222');
      expect(user.username).toMatch(/^user_[a-f0-9]{8}$/);
    });

    it('Path 2 (Phone Login): existing phone logs into the same account', async () => {
      const loginPhone = '94443333';

      // 1. Signup user
      await request(getApp().getHttpServer())
        .post('/api/auth/otp/request')
        .send({ phone: loginPhone })
        .expect(200);

      const signupRes = await request(getApp().getHttpServer())
        .post('/api/auth/otp/verify')
        .send({ phone: loginPhone, code: lastCapturedCode })
        .expect(200);

      const userId = signupRes.body.user.id;

      // 2. Verified user can access protected endpoint /api/users/me
      const meRes = await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${signupRes.body.accessToken}`)
        .expect(200);

      expect(meRes.body.id).toBe(userId);
      expect(meRes.body.phone).toBe('+96894443333');
    });
  });
});
