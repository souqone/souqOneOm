import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import {
  AppleTokenVerifierService,
  AppleJwkKey,
} from '../apple-token-verifier.service';

describe('AppleTokenVerifierService (Unit Tests)', () => {
  let keyPair1: { publicKey: crypto.KeyObject; privateKey: crypto.KeyObject };
  let keyPair2: { publicKey: crypto.KeyObject; privateKey: crypto.KeyObject };
  let jwk1: AppleJwkKey;
  let jwk2: AppleJwkKey;
  let service: AppleTokenVerifierService;

  beforeAll(() => {
    // Generate isolated RSA key pairs for testing (no network)
    keyPair1 = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    keyPair2 = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

    const rawJwk1 = keyPair1.publicKey.export({ format: 'jwk' });
    jwk1 = {
      kty: 'RSA',
      kid: 'test-key-1',
      use: 'sig',
      alg: 'RS256',
      n: rawJwk1.n!,
      e: rawJwk1.e!,
    };

    const rawJwk2 = keyPair2.publicKey.export({ format: 'jwk' });
    jwk2 = {
      kty: 'RSA',
      kid: 'test-key-2',
      use: 'sig',
      alg: 'RS256',
      n: rawJwk2.n!,
      e: rawJwk2.e!,
    };
  });

  beforeEach(() => {
    delete process.env.APPLE_AUTH_ENABLED;
    delete process.env.APPLE_CLIENT_ID;

    service = new AppleTokenVerifierService({
      clientId: 'com.souqone.app',
      keysFetcher: async () => [jwk1],
    });
  });

  afterEach(() => {
    delete process.env.APPLE_AUTH_ENABLED;
    delete process.env.APPLE_CLIENT_ID;
  });

  function createTestToken(
    payloadOverrides: Record<string, any> = {},
    signingKey: crypto.KeyObject = keyPair1.privateKey,
    headerOverrides: Record<string, any> = {},
  ): string {
    const defaultPayload = {
      iss: 'https://appleid.apple.com',
      aud: 'com.souqone.app',
      sub: 'apple.user.123456789',
      email: 'test@example.com',
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 600,
      iat: Math.floor(Date.now() / 1000),
    };

    const finalPayload = { ...defaultPayload, ...payloadOverrides };

    return jwt.sign(finalPayload, signingKey as any, {
      algorithm: 'RS256',
      keyid: headerOverrides.kid ?? 'test-key-1',
      header: {
        alg: 'RS256',
        kid: headerOverrides.kid ?? 'test-key-1',
        ...headerOverrides,
      },
    });
  }

  describe('1. توكن صحيح وفك التشفير', () => {
    it('يتأكد من صحة التوكن ويعيد الحقول المستخرجة بنجاح', async () => {
      const token = createTestToken({
        sub: '000123.abcxyz.456',
        email: 'user@souqone.app',
        email_verified: true,
      });

      const result = await service.verifyIdToken(token);

      expect(result.sub).toBe('000123.abcxyz.456');
      expect(result.email).toBe('user@souqone.app');
      expect(result.emailVerified).toBe(true);
      expect(result.isPrivateEmail).toBe(false);
      expect(result.rawPayload.iss).toBe('https://appleid.apple.com');
      expect(result.rawPayload.aud).toBe('com.souqone.app');
    });

    it('يقبل توكن بدون إيميل (في حال لم يشاركه المستخدم أو لم ترسله Apple)', async () => {
      const token = createTestToken({
        sub: '000999.noemail.789',
        email: undefined,
        email_verified: undefined,
      });

      const result = await service.verifyIdToken(token);

      expect(result.sub).toBe('000999.noemail.789');
      expect(result.email).toBeUndefined();
      expect(result.emailVerified).toBe(false);
      expect(result.isPrivateEmail).toBe(false);
    });
  });

  describe('2. التحقق من التوقيع والمفاتيح (Signature Verification)', () => {
    it('يرفض التوكن إذا كان التوقيع خاطئاً (موقع بمفتاح خاص مختلف)', async () => {
      // Token signed with keyPair2 but header claims kid="test-key-1" (which maps to keyPair1 public key)
      const invalidToken = createTestToken(
        { sub: '000123.hacker.456' },
        keyPair2.privateKey,
        { kid: 'test-key-1' },
      );

      await expect(service.verifyIdToken(invalidToken)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح'),
      );
    });

    it('يرفض التوكن إذا كانت خوارزمية التوقيع ليست RS256', async () => {
      // Manually forge a token with alg: HS256
      const forgedToken = jwt.sign(
        { iss: 'https://appleid.apple.com', aud: 'com.souqone.app', sub: 'user.1' },
        'secret',
        { algorithm: 'HS256', header: { alg: 'HS256', kid: 'test-key-1' } as any },
      );

      await expect(service.verifyIdToken(forgedToken)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح'),
      );
    });
  });

  describe('3. التحقق من جهة الإصدار (iss) والجمهور (aud)', () => {
    it('يرفض التوكن إذا كان iss غير مطابق لـ https://appleid.apple.com', async () => {
      const tokenWithWrongIss = createTestToken({
        iss: 'https://evil.com',
      });

      await expect(service.verifyIdToken(tokenWithWrongIss)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح'),
      );
    });

    it('يرفض التوكن إذا كان aud غير مطابق لـ APPLE_CLIENT_ID', async () => {
      const tokenWithWrongAud = createTestToken({
        aud: 'com.othercompany.app',
      });

      await expect(service.verifyIdToken(tokenWithWrongAud)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح'),
      );
    });
  });

  describe('4. انتهاء الصلاحية (Expiration)', () => {
    it('يرفض التوكن المنتهي الصلاحية مع رسالة واضحة', async () => {
      const expiredToken = createTestToken({
        exp: Math.floor(Date.now() / 1000) - 30, // 30 seconds in past
      });

      await expect(service.verifyIdToken(expiredToken)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح أو منتهي الصلاحية'),
      );
    });
  });

  describe('5. التحقق من الـ Nonce بمقارنة ثابتة الزمن', () => {
    it('ينجح عندما يطابق SHA-256 للـ rawNonce قيمة claim nonce', async () => {
      const rawNonce = 'client-random-nonce-abc-12345';
      const expectedHashedNonce = crypto.createHash('sha256').update(rawNonce).digest('hex');

      const token = createTestToken({
        nonce: expectedHashedNonce,
      });

      const result = await service.verifyIdToken(token, rawNonce);
      expect(result.nonce).toBe(expectedHashedNonce);
    });

    it('ينجح عندما يطابق rawNonce مباشرة قيمة claim nonce', async () => {
      const rawNonce = 'direct-matching-nonce-xyz';

      const token = createTestToken({
        nonce: rawNonce,
      });

      const result = await service.verifyIdToken(token, rawNonce);
      expect(result.nonce).toBe(rawNonce);
    });

    it('يرفض التوكن إذا كان الـ nonce غير متطابق', async () => {
      const rawNonce = 'my-original-nonce';
      const token = createTestToken({
        nonce: 'different-nonce-hash',
      });

      await expect(service.verifyIdToken(token, rawNonce)).rejects.toThrow(
        new UnauthorizedException('رمز التحقق (nonce) غير متطابق — محاولة غير آمنة'),
      );
    });

    it('يرفض التوكن إذا أرسل الموبايل rawNonce ولكن التوكن يخلو من حقل nonce', async () => {
      const rawNonce = 'my-original-nonce';
      const token = createTestToken({
        nonce: undefined,
      });

      await expect(service.verifyIdToken(token, rawNonce)).rejects.toThrow(
        new UnauthorizedException('رمز التحقق (nonce) غير متطابق — محاولة غير آمنة'),
      );
    });
  });

  describe('6. مرونة email_verified ودعم Private Relay', () => {
    it('يقبل email_verified كقيمة boolean true', async () => {
      const token = createTestToken({ email: 'user@test.com', email_verified: true });
      const result = await service.verifyIdToken(token);
      expect(result.emailVerified).toBe(true);
    });

    it('يقبل email_verified كقيمة نصية "true"', async () => {
      const token = createTestToken({ email: 'user@test.com', email_verified: 'true' });
      const result = await service.verifyIdToken(token);
      expect(result.emailVerified).toBe(true);
    });

    it('يرفض البريد إذا كان email_verified يحمل false', async () => {
      const token = createTestToken({ email: 'user@test.com', email_verified: false });
      await expect(service.verifyIdToken(token)).rejects.toThrow(
        new UnauthorizedException('البريد الإلكتروني لحساب Apple غير موثق'),
      );
    });

    it('يحدد isPrivateEmail=true إذا كان الإيميل ينتهي بـ @privaterelay.appleid.com', async () => {
      const token = createTestToken({
        email: 'dpd74kx9s8@privaterelay.appleid.com',
        email_verified: true,
      });
      const result = await service.verifyIdToken(token);
      expect(result.isPrivateEmail).toBe(true);
    });

    it('يحدد isPrivateEmail=true إذا كان الحقل is_private_email موجوداً كـ true', async () => {
      const token = createTestToken({
        email: 'relay@privaterelay.appleid.com',
        is_private_email: 'true',
        email_verified: true,
      });
      const result = await service.verifyIdToken(token);
      expect(result.isPrivateEmail).toBe(true);
    });
  });

  describe('7. إدارة الـ Cache وتحديث الـ JWKS عند key rotation', () => {
    it('يستخدم الكاش للمفاتيح المعروفة ولا يعيد استدعاء fetcher', async () => {
      let fetchCount = 0;
      service.setCustomKeysFetcher(async () => {
        fetchCount++;
        return [jwk1];
      });

      const token1 = createTestToken({ sub: 'user.1' });
      const token2 = createTestToken({ sub: 'user.2' });

      await service.verifyIdToken(token1);
      await service.verifyIdToken(token2);

      // Should only fetch once because jwk1 is cached for 24h
      expect(fetchCount).toBe(1);
    });

    it('يجلب المفاتيح مرة ثانية عند وصول kid غير موجود في الكاش وينجح إن وُجد بالمفتاح الجديد', async () => {
      let fetchCount = 0;
      service.setCustomKeysFetcher(async () => {
        fetchCount++;
        if (fetchCount === 1) {
          return [jwk1]; // Initial fetch only has jwk1
        }
        return [jwk1, jwk2]; // Fresh fetch on cache miss has jwk2
      });

      // 1. Initial verification caches jwk1
      const token1 = createTestToken({ sub: 'user.1' }, keyPair1.privateKey, { kid: 'test-key-1' });
      await service.verifyIdToken(token1);
      expect(fetchCount).toBe(1);

      // 2. Token signed with test-key-2 triggers on-demand refresh
      const token2 = createTestToken({ sub: 'user.2' }, keyPair2.privateKey, { kid: 'test-key-2' });
      const result2 = await service.verifyIdToken(token2);

      expect(fetchCount).toBe(2);
      expect(result2.sub).toBe('user.2');
    });

    it('يرفض التوكن إذا كان kid غير موجود حتى بعد إعادة الجلب من Apple', async () => {
      service.setCustomKeysFetcher(async () => [jwk1]);

      const tokenWithUnknownKid = createTestToken(
        { sub: 'user.unknown' },
        keyPair1.privateKey,
        { kid: 'completely-unknown-kid' },
      );

      await expect(service.verifyIdToken(tokenWithUnknownKid)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح — مفتاح التوقيع غير معروف'),
      );
    });

    it('يرمي استثناء عند فشل جلب المفاتيح من الشبكة والكاش فارغ', async () => {
      service.setCustomKeysFetcher(async () => {
        throw new Error('Network timeout');
      });

      const token = createTestToken();
      await expect(service.verifyIdToken(token)).rejects.toThrow(
        new UnauthorizedException('فشل الاتصال بخوادم Apple للتحقق من الهوية'),
      );
    });
  });

  describe('8. حالة تعطيل الخدمة والإعدادات (Graceful Disabled State)', () => {
    it('يرمي ServiceUnavailableException عند الاستدعاء إذا تم تعطيل الميزة عبر APPLE_AUTH_ENABLED=false', async () => {
      process.env.APPLE_AUTH_ENABLED = 'false';

      const token = createTestToken();
      await expect(service.verifyIdToken(token)).rejects.toThrow(
        new ServiceUnavailableException('خدمة تسجيل الدخول بواسطة Apple غير مفعلة حالياً'),
      );
    });

    it('يرمي استثناء عند تمرير توكن فارغ أو غير نصي', async () => {
      await expect(service.verifyIdToken('')).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح'),
      );
      await expect(service.verifyIdToken(null as any)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح'),
      );
    });

    it('يرفض التوكن إذا كان حقل sub فارغاً', async () => {
      const tokenWithoutSub = createTestToken({ sub: '' });
      await expect(service.verifyIdToken(tokenWithoutSub)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح — معرف المستخدم مفقود'),
      );
    });
  });
});
