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

  const TEST_CLIENT_ID = 'com.souqone.app';
  const DEFAULT_RAW_NONCE = 'standard-client-nonce-xyz-987';
  const DEFAULT_HASHED_NONCE = crypto.createHash('sha256').update(DEFAULT_RAW_NONCE).digest('hex');

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
      clientId: TEST_CLIENT_ID,
      unknownKidCooldownMs: 100, // Short cooldown for fast tests
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
      aud: TEST_CLIENT_ID,
      sub: 'apple.user.123456789',
      email: 'test@example.com',
      email_verified: true,
      nonce: DEFAULT_HASHED_NONCE,
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

      const result = await service.verifyIdToken(token, DEFAULT_RAW_NONCE);

      expect(result.sub).toBe('000123.abcxyz.456');
      expect(result.email).toBe('user@souqone.app');
      expect(result.emailVerified).toBe(true);
      expect(result.isPrivateEmail).toBe(false);
      expect(result.rawPayload.iss).toBe('https://appleid.apple.com');
      expect(result.rawPayload.aud).toBe(TEST_CLIENT_ID);
      expect(result.nonce).toBe(DEFAULT_HASHED_NONCE);
    });

    it('يقبل توكن بدون إيميل (في حال لم يشاركه المستخدم أو لم ترسله Apple)', async () => {
      const token = createTestToken({
        sub: '000999.noemail.789',
        email: undefined,
        email_verified: undefined,
      });

      const result = await service.verifyIdToken(token, DEFAULT_RAW_NONCE);

      expect(result.sub).toBe('000999.noemail.789');
      expect(result.email).toBeUndefined();
      expect(result.emailVerified).toBe(false);
      expect(result.isPrivateEmail).toBe(false);
    });
  });

  describe('2. التحقق من التوقيع والمفاتيح (Signature Verification)', () => {
    it('يرفض التوكن إذا كان التوقيع خاطئاً (موقع بمفتاح خاص مختلف)', async () => {
      const invalidToken = createTestToken(
        { sub: '000123.hacker.456' },
        keyPair2.privateKey,
        { kid: 'test-key-1' },
      );

      await expect(service.verifyIdToken(invalidToken, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح'),
      );
    });

    it('يرفض التوكن إذا كانت خوارزمية التوقيع ليست RS256', async () => {
      const forgedToken = jwt.sign(
        {
          iss: 'https://appleid.apple.com',
          aud: TEST_CLIENT_ID,
          sub: 'user.1',
          nonce: DEFAULT_HASHED_NONCE,
        },
        'secret',
        { algorithm: 'HS256', header: { alg: 'HS256', kid: 'test-key-1' } as any },
      );

      await expect(service.verifyIdToken(forgedToken, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح'),
      );
    });
  });

  describe('3. التحقق من جهة الإصدار (iss) والجمهور (aud)', () => {
    it('يرفض التوكن إذا كان iss غير مطابق لـ https://appleid.apple.com', async () => {
      const tokenWithWrongIss = createTestToken({
        iss: 'https://evil.com',
      });

      await expect(service.verifyIdToken(tokenWithWrongIss, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح'),
      );
    });

    it('يرفض التوكن إذا كان aud غير مطابق لـ APPLE_CLIENT_ID', async () => {
      const tokenWithWrongAud = createTestToken({
        aud: 'com.othercompany.app',
      });

      await expect(service.verifyIdToken(tokenWithWrongAud, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح'),
      );
    });
  });

  describe('4. انتهاء الصلاحية (Expiration)', () => {
    it('يرفض التوكن المنتهي الصلاحية مع رسالة واضحة', async () => {
      const expiredToken = createTestToken({
        exp: Math.floor(Date.now() / 1000) - 30, // 30 seconds in past
      });

      await expect(service.verifyIdToken(expiredToken, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح أو منتهي الصلاحية'),
      );
    });
  });

  describe('5. التحقق الصارم من الـ Nonce بمقارنة ثابتة الزمن', () => {
    it('ينجح عندما يطابق SHA-256 للـ rawNonce قيمة claim nonce', async () => {
      const rawNonce = 'client-random-nonce-abc-12345';
      const expectedHashedNonce = crypto.createHash('sha256').update(rawNonce).digest('hex');

      const token = createTestToken({
        nonce: expectedHashedNonce,
      });

      const result = await service.verifyIdToken(token, rawNonce);
      expect(result.nonce).toBe(expectedHashedNonce);
    });

    it('يرفض التوكن إذا كان rawNonce ناقصاً مع توكن يحتوي على claim nonce', async () => {
      const token = createTestToken({
        nonce: DEFAULT_HASHED_NONCE,
      });

      await expect(service.verifyIdToken(token, undefined)).rejects.toThrow(
        new UnauthorizedException('رمز التحقق (nonce) مفقود — يلزم توفير رمز تحقق صالح'),
      );
    });

    it('يرفض التوكن إذا أرسل العميل rawNonce ولكن التوكن يخلو من claim nonce', async () => {
      const rawNonce = 'my-client-raw-nonce';
      const token = createTestToken({
        nonce: undefined,
      });

      await expect(service.verifyIdToken(token, rawNonce)).rejects.toThrow(
        new UnauthorizedException('رمز التحقق (nonce) مفقود — يلزم توفير رمز تحقق صالح'),
      );
    });

    it('يرفض التوكن إذا كان كلا الـ rawNonce و claim nonce مفقودين', async () => {
      const token = createTestToken({
        nonce: undefined,
      });

      await expect(service.verifyIdToken(token, undefined)).rejects.toThrow(
        new UnauthorizedException('رمز التحقق (nonce) مفقود — يلزم توفير رمز تحقق صالح'),
      );
    });

    it('يرفض التوكن إذا كان الـ nonce غير متطابق في الهاش', async () => {
      const rawNonce = 'my-original-nonce';
      const token = createTestToken({
        nonce: 'different-nonce-hash-string-that-does-not-match',
      });

      await expect(service.verifyIdToken(token, rawNonce)).rejects.toThrow(
        new UnauthorizedException('رمز التحقق (nonce) غير متطابق — محاولة غير آمنة'),
      );
    });
  });

  describe('6. مرونة email_verified ودعم Private Relay', () => {
    it('يقبل email_verified كقيمة boolean true', async () => {
      const token = createTestToken({ email: 'user@test.com', email_verified: true });
      const result = await service.verifyIdToken(token, DEFAULT_RAW_NONCE);
      expect(result.emailVerified).toBe(true);
    });

    it('يقبل email_verified كقيمة نصية "true"', async () => {
      const token = createTestToken({ email: 'user@test.com', email_verified: 'true' });
      const result = await service.verifyIdToken(token, DEFAULT_RAW_NONCE);
      expect(result.emailVerified).toBe(true);
    });

    it('يرفض البريد إذا كان email_verified يحمل false', async () => {
      const token = createTestToken({ email: 'user@test.com', email_verified: false });
      await expect(service.verifyIdToken(token, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('البريد الإلكتروني لحساب Apple غير موثق'),
      );
    });

    it('يحدد isPrivateEmail=true إذا كان الإيميل ينتهي بـ @privaterelay.appleid.com', async () => {
      const token = createTestToken({
        email: 'dpd74kx9s8@privaterelay.appleid.com',
        email_verified: true,
      });
      const result = await service.verifyIdToken(token, DEFAULT_RAW_NONCE);
      expect(result.isPrivateEmail).toBe(true);
    });

    it('يحدد isPrivateEmail=true إذا كان الحقل is_private_email موجوداً كـ true', async () => {
      const token = createTestToken({
        email: 'relay@privaterelay.appleid.com',
        is_private_email: 'true',
        email_verified: true,
      });
      const result = await service.verifyIdToken(token, DEFAULT_RAW_NONCE);
      expect(result.isPrivateEmail).toBe(true);
    });
  });

  describe('7. إدارة الـ Cache وتهدئة الـ JWKS والطلبات المتزامنة (Concurrency & Cooldown)', () => {
    it('يستخدم الكاش للمفاتيح المعروفة ولا يعيد استدعاء fetcher', async () => {
      let fetchCount = 0;
      service.setCustomKeysFetcher(async () => {
        fetchCount++;
        return [jwk1];
      });

      const token1 = createTestToken({ sub: 'user.1' });
      const token2 = createTestToken({ sub: 'user.2' });

      await service.verifyIdToken(token1, DEFAULT_RAW_NONCE);
      await service.verifyIdToken(token2, DEFAULT_RAW_NONCE);

      expect(fetchCount).toBe(1);
    });

    it('طلبات متزامنة متعددة تُدمج في جلب شبكي واحد فقط (in-flight dedupe)', async () => {
      let fetchCount = 0;
      service.setCustomKeysFetcher(async () => {
        fetchCount++;
        // Simulate async delay
        await new Promise((r) => setTimeout(r, 20));
        return [jwk1];
      });

      const tokens = Array.from({ length: 5 }, (_, i) =>
        createTestToken({ sub: `concurrent.user.${i}` }),
      );

      const results = await Promise.all(
        tokens.map((tok) => service.verifyIdToken(tok, DEFAULT_RAW_NONCE)),
      );

      expect(results).toHaveLength(5);
      expect(fetchCount).toBe(1);
    });

    it('استدعاء kid مجهول متكرر داخل نافذة التهدئة يقوم بجلب واحد فقط ويرفض الباقي دون ضرب الشبكة', async () => {
      let fetchCount = 0;
      service = new AppleTokenVerifierService({
        clientId: TEST_CLIENT_ID,
        unknownKidCooldownMs: 500, // 500ms cooldown
        keysFetcher: async () => {
          fetchCount++;
          return [jwk1]; // jwk1 only
        },
      });

      const tokenWithUnknownKid = createTestToken(
        { sub: 'user.unknown' },
        keyPair1.privateKey,
        { kid: 'completely-unknown-kid-1' },
      );

      // Call 1: triggers refresh, kid not found -> throws
      await expect(service.verifyIdToken(tokenWithUnknownKid, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح — مفتاح التوقيع غير معروف'),
      );
      expect(fetchCount).toBe(1);

      // Call 2 (immediately inside cooldown window): should NOT call fetcher again
      await expect(service.verifyIdToken(tokenWithUnknownKid, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح — مفتاح التوقيع غير معروف'),
      );
      expect(fetchCount).toBe(1);

      // Call 3 with a different unknown kid (still inside cooldown): should NOT call fetcher
      const tokenWithAnotherUnknownKid = createTestToken(
        { sub: 'user.unknown2' },
        keyPair1.privateKey,
        { kid: 'completely-unknown-kid-2' },
      );
      await expect(service.verifyIdToken(tokenWithAnotherUnknownKid, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح — مفتاح التوقيع غير معروف'),
      );
      expect(fetchCount).toBe(1);
    });

    it('استدعاء kid مجهول بعد انتهاء فترة التهدئة يعيد محاولة الجلب', async () => {
      let fetchCount = 0;
      service = new AppleTokenVerifierService({
        clientId: TEST_CLIENT_ID,
        unknownKidCooldownMs: 40, // 40ms cooldown
        keysFetcher: async () => {
          fetchCount++;
          return [jwk1];
        },
      });

      const tokenWithUnknownKid = createTestToken(
        { sub: 'user.unknown' },
        keyPair1.privateKey,
        { kid: 'unknown-kid' },
      );

      // Initial fetch + unknown kid rejection
      await expect(service.verifyIdToken(tokenWithUnknownKid, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح — مفتاح التوقيع غير معروف'),
      );
      expect(fetchCount).toBe(1);

      // Wait for cooldown to expire
      await new Promise((r) => setTimeout(r, 60));

      // Second call after cooldown expires triggers a new refresh
      await expect(service.verifyIdToken(tokenWithUnknownKid, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح — مفتاح التوقيع غير معروف'),
      );
      expect(fetchCount).toBe(2);
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
      await service.verifyIdToken(token1, DEFAULT_RAW_NONCE);
      expect(fetchCount).toBe(1);

      // 2. Token signed with test-key-2 triggers on-demand refresh
      const token2 = createTestToken({ sub: 'user.2' }, keyPair2.privateKey, { kid: 'test-key-2' });
      const result2 = await service.verifyIdToken(token2, DEFAULT_RAW_NONCE);

      expect(fetchCount).toBe(2);
      expect(result2.sub).toBe('user.2');
    });

    it('يحافظ على الكاش القديم عند فشل الشبكة في محاولة التحديث اللاحقة', async () => {
      let shouldFail = false;
      service.setCustomKeysFetcher(async () => {
        if (shouldFail) {
          throw new Error('Apple network failure');
        }
        return [jwk1];
      });

      // Populate initial cache
      const token1 = createTestToken({ sub: 'user.1' });
      await service.verifyIdToken(token1, DEFAULT_RAW_NONCE);

      // Now set fetcher to fail
      shouldFail = true;

      // An unknown kid comes in after cooldown: refresh fails, but existing valid token with jwk1 still works
      await new Promise((r) => setTimeout(r, 120));
      const unknownToken = createTestToken({ sub: 'user.unknown' }, keyPair2.privateKey, {
        kid: 'nonexistent-kid',
      });
      await expect(service.verifyIdToken(unknownToken, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح — مفتاح التوقيع غير معروف'),
      );

      // Existing cached key still works!
      const result = await service.verifyIdToken(token1, DEFAULT_RAW_NONCE);
      expect(result.sub).toBe('user.1');
    });

    it('يرمي استثناء عند فشل جلب المفاتيح من الشبكة والكاش فارغ', async () => {
      service.setCustomKeysFetcher(async () => {
        throw new Error('Network timeout');
      });

      const token = createTestToken();
      await expect(service.verifyIdToken(token, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('فشل الاتصال بخوادم Apple للتحقق من الهوية'),
      );
    });
  });

  describe('8. حالة تعطيل الخدمة والإعدادات الصريحة (Explicit Configuration & Disabled State)', () => {
    it('يرمي ServiceUnavailableException ويكون isEnabled()=false إذا كان APPLE_CLIENT_ID فارغاً', async () => {
      // Service instantiated with no client ID and empty env
      const unconfiguredService = new AppleTokenVerifierService({
        clientId: '',
        keysFetcher: async () => [jwk1],
      });

      expect(unconfiguredService.isEnabled()).toBe(false);
      expect(unconfiguredService.getClientId()).toBe('');

      const token = createTestToken();
      await expect(unconfiguredService.verifyIdToken(token, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new ServiceUnavailableException('خدمة تسجيل الدخول بواسطة Apple غير مفعلة حالياً'),
      );
    });

    it('يرمي ServiceUnavailableException عند الاستدعاء إذا تم تعطيل الميزة عبر APPLE_AUTH_ENABLED=false', async () => {
      process.env.APPLE_AUTH_ENABLED = 'false';

      expect(service.isEnabled()).toBe(false);

      const token = createTestToken();
      await expect(service.verifyIdToken(token, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new ServiceUnavailableException('خدمة تسجيل الدخول بواسطة Apple غير مفعلة حالياً'),
      );
    });

    it('يرمي استثناء عند تمرير توكن فارغ أو غير نصي', async () => {
      await expect(service.verifyIdToken('', DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح'),
      );
      await expect(service.verifyIdToken(null as any, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح'),
      );
    });

    it('يرفض التوكن إذا كان حقل sub فارغاً', async () => {
      const tokenWithoutSub = createTestToken({ sub: '' });
      await expect(service.verifyIdToken(tokenWithoutSub, DEFAULT_RAW_NONCE)).rejects.toThrow(
        new UnauthorizedException('رمز Apple غير صالح — معرف المستخدم مفقود'),
      );
    });
  });
});
