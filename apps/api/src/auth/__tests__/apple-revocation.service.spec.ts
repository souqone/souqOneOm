import {
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { AppleRevocationService } from '../apple-revocation.service';

describe('AppleRevocationService', () => {
  let ecPrivateKeyPem: string;
  let ecPublicKeyPem: string;
  let mockHttpClient: any;
  let service: AppleRevocationService;

  const validClientId = 'com.souqone.app';
  const validTeamId = 'TEAM123456';
  const validKeyId = 'KEY1234567';

  beforeAll(() => {
    // Generate valid EC P-256 keypair for ES256 tests
    const keyPair = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    ecPrivateKeyPem = keyPair.privateKey;
    ecPublicKeyPem = keyPair.publicKey;
  });

  beforeEach(() => {
    mockHttpClient = {
      post: jest.fn(),
    };

    service = new AppleRevocationService({
      clientId: validClientId,
      teamId: validTeamId,
      keyId: validKeyId,
      privateKeyPem: ecPrivateKeyPem,
      httpClient: mockHttpClient,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isRevocationConfigured', () => {
    it('returns true when all required configuration is present', () => {
      expect(service.isRevocationConfigured()).toBe(true);
    });

    it('returns false if APPLE_AUTH_ENABLED is false', () => {
      process.env.APPLE_AUTH_ENABLED = 'false';
      expect(service.isRevocationConfigured()).toBe(false);
      delete process.env.APPLE_AUTH_ENABLED;
    });

    it('returns false if privateKeyPem is missing', () => {
      const s = new AppleRevocationService({
        clientId: validClientId,
        teamId: validTeamId,
        keyId: validKeyId,
        privateKeyPem: '',
      });
      expect(s.isRevocationConfigured()).toBe(false);
    });

    it('returns false if clientId is missing', () => {
      const s = new AppleRevocationService({
        clientId: '',
        teamId: validTeamId,
        keyId: validKeyId,
        privateKeyPem: ecPrivateKeyPem,
      });
      expect(s.isRevocationConfigured()).toBe(false);
    });
  });

  describe('generateClientSecret', () => {
    it('generates a valid ES256 JWT with correct claims, headers, and 5-minute expiry', () => {
      const clientSecret = service.generateClientSecret();
      expect(clientSecret).toBeDefined();

      const decodedComplete: any = jwt.verify(clientSecret, ecPublicKeyPem, {
        algorithms: ['ES256'],
        audience: 'https://appleid.apple.com',
        issuer: validTeamId,
      });

      expect(decodedComplete.sub).toBe(validClientId);
      expect(decodedComplete.iss).toBe(validTeamId);
      expect(decodedComplete.aud).toBe('https://appleid.apple.com');
      expect(decodedComplete.exp - decodedComplete.iat).toBe(300);

      const header = jwt.decode(clientSecret, { complete: true })?.header;
      expect(header?.alg).toBe('ES256');
      expect(header?.kid).toBe(validKeyId);
    });

    it('handles escaped newlines (\\n) in private key PEM', () => {
      const escapedKey = ecPrivateKeyPem.replace(/\n/g, '\\n');
      const s = new AppleRevocationService({
        clientId: validClientId,
        teamId: validTeamId,
        keyId: validKeyId,
        privateKeyPem: escapedKey,
        httpClient: mockHttpClient,
      });

      const clientSecret = s.generateClientSecret();
      expect(clientSecret).toBeDefined();
      const verified: any = jwt.verify(clientSecret, ecPublicKeyPem, { algorithms: ['ES256'] });
      expect(verified.sub).toBe(validClientId);
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('successfully exchanges authorization code and validates matching sub in id_token', async () => {
      const sub = 'user.apple.sub.123';
      const fakeIdToken = jwt.sign({ sub, email: 'user@apple.com' }, 'secret');

      mockHttpClient.post.mockResolvedValueOnce({
        data: {
          access_token: 'fake-access-token',
          refresh_token: 'fake-refresh-token',
          id_token: fakeIdToken,
          expires_in: 3600,
          token_type: 'Bearer',
        },
      });

      const result = await service.exchangeCodeForTokens('auth-code-123', sub);

      expect(result.refreshToken).toBe('fake-refresh-token');
      expect(result.idToken).toBe(fakeIdToken);
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);

      const postCall = mockHttpClient.post.mock.calls[0];
      expect(postCall[0]).toBe('https://appleid.apple.com/auth/token');
      expect(postCall[1]).toContain('grant_type=authorization_code');
      expect(postCall[1]).toContain('code=auth-code-123');
      expect(postCall[1]).toContain(`client_id=${validClientId}`);
    });

    it('rejects with 401 APPLE_SUB_MISMATCH and revokes refresh_token if id_token sub does not match expectedAppleSub', async () => {
      const expectedSub = 'user.apple.sub.123';
      const attackerSub = 'attacker.apple.sub.999';
      const attackerIdToken = jwt.sign({ sub: attackerSub }, 'secret');

      mockHttpClient.post
        .mockResolvedValueOnce({
          data: {
            refresh_token: 'refresh-token-attacker',
            id_token: attackerIdToken,
          },
        })
        .mockResolvedValueOnce({ data: {} }); // for precautionary revokeToken call

      await expect(
        service.exchangeCodeForTokens('attacker-code', expectedSub),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 401,
            code: 'APPLE_SUB_MISMATCH',
          }),
        }),
      );

      // Verify precautionary revocation was attempted
      expect(mockHttpClient.post).toHaveBeenCalledTimes(2);
      expect(mockHttpClient.post.mock.calls[1][0]).toBe('https://appleid.apple.com/auth/revoke');
      expect(mockHttpClient.post.mock.calls[1][1]).toContain('token=refresh-token-attacker');
    });

    it('throws 400 APPLE_CODE_INVALID when Apple returns 400 invalid_grant', async () => {
      const axiosError: any = new Error('Request failed with status code 400');
      axiosError.response = {
        status: 400,
        data: { error: 'invalid_grant' },
      };

      mockHttpClient.post.mockRejectedValueOnce(axiosError);

      await expect(
        service.exchangeCodeForTokens('expired-code', 'user.sub'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 400,
            code: 'APPLE_CODE_INVALID',
          }),
        }),
      );
    });

    it('throws 503 APPLE_SERVICE_ERROR when Apple network times out or returns 500', async () => {
      const axiosError: any = new Error('timeout of 5000ms exceeded');
      axiosError.code = 'ECONNABORTED';

      mockHttpClient.post.mockRejectedValueOnce(axiosError);

      await expect(
        service.exchangeCodeForTokens('some-code', 'user.sub'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 503,
            code: 'APPLE_SERVICE_ERROR',
          }),
        }),
      );
    });

    it('throws 503 APPLE_SERVICE_ERROR when response is missing refresh_token', async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        data: { access_token: 'fake-access' }, // missing refresh_token
      });

      await expect(
        service.exchangeCodeForTokens('some-code', 'user.sub'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 503,
            code: 'APPLE_SERVICE_ERROR',
          }),
        }),
      );
    });

    it('throws 503 APPLE_SERVICE_ERROR and performs best-effort revocation when id_token is missing', async () => {
      mockHttpClient.post
        .mockResolvedValueOnce({
          data: {
            refresh_token: 'refresh-token-valid-1',
            // id_token is missing
          },
        })
        .mockResolvedValueOnce({ data: {} }); // for revokeToken

      await expect(
        service.exchangeCodeForTokens('some-code', 'user.sub'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 503,
            code: 'APPLE_SERVICE_ERROR',
            message: 'تعذّر تأكيد الإلغاء مع Apple، يرجى المحاولة بعد قليل',
          }),
        }),
      );

      // Verify revokeToken was invoked with the received refresh_token
      expect(mockHttpClient.post).toHaveBeenCalledTimes(2);
      expect(mockHttpClient.post.mock.calls[1][0]).toBe('https://appleid.apple.com/auth/revoke');
      expect(mockHttpClient.post.mock.calls[1][1]).toContain('token=refresh-token-valid-1');
    });

    it('throws 503 APPLE_SERVICE_ERROR and performs best-effort revocation when id_token is unparseable or missing sub', async () => {
      mockHttpClient.post
        .mockResolvedValueOnce({
          data: {
            refresh_token: 'refresh-token-valid-2',
            id_token: 'unparseable.jwt.payload',
          },
        })
        .mockResolvedValueOnce({ data: {} }); // for revokeToken

      await expect(
        service.exchangeCodeForTokens('some-code', 'user.sub'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 503,
            code: 'APPLE_SERVICE_ERROR',
            message: 'تعذّر تأكيد الإلغاء مع Apple، يرجى المحاولة بعد قليل',
          }),
        }),
      );

      // Verify revokeToken was invoked with the received refresh_token
      expect(mockHttpClient.post).toHaveBeenCalledTimes(2);
      expect(mockHttpClient.post.mock.calls[1][0]).toBe('https://appleid.apple.com/auth/revoke');
      expect(mockHttpClient.post.mock.calls[1][1]).toContain('token=refresh-token-valid-2');
    });

    it('throws 503 APPLE_SERVICE_ERROR even if best-effort revocation fails when id_token is missing sub', async () => {
      const idTokenWithoutSub = jwt.sign({ aud: 'com.souqone.app' }, 'secret');
      mockHttpClient.post
        .mockResolvedValueOnce({
          data: {
            refresh_token: 'refresh-token-valid-3',
            id_token: idTokenWithoutSub,
          },
        })
        .mockRejectedValueOnce(new Error('Network error during revoke')); // revokeToken fails

      await expect(
        service.exchangeCodeForTokens('some-code', 'user.sub'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 503,
            code: 'APPLE_SERVICE_ERROR',
            message: 'تعذّر تأكيد الإلغاء مع Apple، يرجى المحاولة بعد قليل',
          }),
        }),
      );

      // Verify revokeToken was still attempted
      expect(mockHttpClient.post).toHaveBeenCalledTimes(2);
      expect(mockHttpClient.post.mock.calls[1][0]).toBe('https://appleid.apple.com/auth/revoke');
    });
  });

  describe('revokeToken', () => {
    it('successfully sends revocation request to Apple', async () => {
      mockHttpClient.post.mockResolvedValueOnce({ data: {} });

      await service.revokeToken('refresh-token-to-revoke');

      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      const postCall = mockHttpClient.post.mock.calls[0];
      expect(postCall[0]).toBe('https://appleid.apple.com/auth/revoke');
      expect(postCall[1]).toContain('token=refresh-token-to-revoke');
      expect(postCall[1]).toContain('token_type_hint=refresh_token');
    });

    it('throws 503 APPLE_SERVICE_ERROR if revocation request fails', async () => {
      const axiosError: any = new Error('Network error');
      axiosError.response = { status: 500, data: { error: 'server_error' } };
      mockHttpClient.post.mockRejectedValueOnce(axiosError);

      await expect(
        service.revokeToken('refresh-token-fail'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 503,
            code: 'APPLE_SERVICE_ERROR',
          }),
        }),
      );
    });
  });

  describe('exchangeAndRevoke', () => {
    it('throws 503 APPLE_REVOCATION_UNAVAILABLE if configuration is missing', async () => {
      const unconfigured = new AppleRevocationService({
        clientId: '',
        privateKeyPem: '',
        httpClient: mockHttpClient,
      });

      await expect(
        unconfigured.exchangeAndRevoke('code', 'sub'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 503,
            code: 'APPLE_REVOCATION_UNAVAILABLE',
          }),
        }),
      );
    });

    it('completes exchange and revocation in sequence', async () => {
      const sub = 'user.sub.123';
      const fakeIdToken = jwt.sign({ sub }, 'secret');

      mockHttpClient.post
        .mockResolvedValueOnce({
          data: {
            refresh_token: 'r-token-ok',
            id_token: fakeIdToken,
          },
        })
        .mockResolvedValueOnce({ data: {} });

      await service.exchangeAndRevoke('valid-code', sub);

      expect(mockHttpClient.post).toHaveBeenCalledTimes(2);
      expect(mockHttpClient.post.mock.calls[0][0]).toBe('https://appleid.apple.com/auth/token');
      expect(mockHttpClient.post.mock.calls[1][0]).toBe('https://appleid.apple.com/auth/revoke');
    });
  });

  describe('Zero Secrets Leakage in Logs across all failure paths', () => {
    let errorSpy: jest.SpyInstance;
    let warnSpy: jest.SpyInstance;

    const sensitiveSecretCode = 'SUPER_SECRET_AUTHORIZATION_CODE_12345';
    const sensitiveRefreshToken = 'SUPER_SECRET_REFRESH_TOKEN_67890';

    beforeEach(() => {
      errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });

    function assertNoSensitiveDataInLogs(clientSecret?: string) {
      const allLogs = [
        ...errorSpy.mock.calls.map((c) => String(c[0])),
        ...warnSpy.mock.calls.map((c) => String(c[0])),
      ].join(' ');

      expect(allLogs).not.toContain(sensitiveSecretCode);
      expect(allLogs).not.toContain(sensitiveRefreshToken);
      expect(allLogs).not.toContain(ecPrivateKeyPem);
      if (clientSecret) {
        expect(allLogs).not.toContain(clientSecret);
      }
    }

    it('does not leak secrets when token exchange fails with network error / axios request body', async () => {
      const clientSecret = service.generateClientSecret();
      const axiosError: any = new Error('Network crash');
      axiosError.config = {
        data: `client_secret=${clientSecret}&code=${sensitiveSecretCode}`,
      };
      axiosError.response = { status: 500, data: { error: 'internal_error' } };

      mockHttpClient.post.mockRejectedValueOnce(axiosError);

      await expect(
        service.exchangeCodeForTokens(sensitiveSecretCode, 'user.sub'),
      ).rejects.toThrow();

      assertNoSensitiveDataInLogs(clientSecret);
    });

    it('does not leak secrets when token exchange fails with invalid_grant', async () => {
      const clientSecret = service.generateClientSecret();
      const axiosError: any = new Error('invalid_grant error');
      axiosError.config = {
        data: `client_secret=${clientSecret}&code=${sensitiveSecretCode}`,
      };
      axiosError.response = { status: 400, data: { error: 'invalid_grant' } };

      mockHttpClient.post.mockRejectedValueOnce(axiosError);

      await expect(
        service.exchangeCodeForTokens(sensitiveSecretCode, 'user.sub'),
      ).rejects.toThrow();

      assertNoSensitiveDataInLogs(clientSecret);
    });

    it('does not leak secrets when token revocation fails with network error', async () => {
      const clientSecret = service.generateClientSecret();
      const axiosError: any = new Error('Revoke network crash');
      axiosError.config = {
        data: `client_secret=${clientSecret}&token=${sensitiveRefreshToken}`,
      };
      axiosError.response = { status: 500, data: { error: 'server_error' } };

      mockHttpClient.post.mockRejectedValueOnce(axiosError);

      await expect(
        service.revokeToken(sensitiveRefreshToken),
      ).rejects.toThrow();

      assertNoSensitiveDataInLogs(clientSecret);
    });

    it('does not leak secrets when sub mismatch occurs', async () => {
      const attackerIdToken = jwt.sign({ sub: 'wrong.sub' }, 'secret');
      mockHttpClient.post
        .mockResolvedValueOnce({
          data: {
            refresh_token: sensitiveRefreshToken,
            id_token: attackerIdToken,
          },
        })
        .mockResolvedValueOnce({ data: {} });

      await expect(
        service.exchangeCodeForTokens(sensitiveSecretCode, 'expected.sub'),
      ).rejects.toThrow();

      assertNoSensitiveDataInLogs();
    });

    it('does not leak secrets when unconfigured service is invoked', async () => {
      const unconfigured = new AppleRevocationService({
        clientId: '',
        privateKeyPem: ecPrivateKeyPem,
        httpClient: mockHttpClient,
      });

      await expect(
        unconfigured.exchangeAndRevoke(sensitiveSecretCode, 'user.sub'),
      ).rejects.toThrow();

      assertNoSensitiveDataInLogs();
    });
  });
});
