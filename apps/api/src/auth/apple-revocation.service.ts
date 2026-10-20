import {
  Injectable,
  Logger,
  Optional,
  UnauthorizedException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import axios, { AxiosInstance } from 'axios';

export interface AppleRevocationOptions {
  clientId?: string;
  teamId?: string;
  keyId?: string;
  privateKeyPem?: string;
  tokenUrl?: string;
  revokeUrl?: string;
  httpClient?: AxiosInstance;
}

const DEFAULT_APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const DEFAULT_APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';

@Injectable()
export class AppleRevocationService {
  private readonly logger = new Logger(AppleRevocationService.name);

  private readonly configuredClientId?: string;
  private readonly configuredTeamId?: string;
  private readonly configuredKeyId?: string;
  private readonly configuredPrivateKeyPem?: string;
  private readonly tokenUrl: string;
  private readonly revokeUrl: string;
  private readonly httpClient: AxiosInstance;

  constructor(@Optional() options?: AppleRevocationOptions) {
    this.configuredClientId = options?.clientId;
    this.configuredTeamId = options?.teamId;
    this.configuredKeyId = options?.keyId;
    this.configuredPrivateKeyPem = options?.privateKeyPem;
    this.tokenUrl = options?.tokenUrl || DEFAULT_APPLE_TOKEN_URL;
    this.revokeUrl = options?.revokeUrl || DEFAULT_APPLE_REVOKE_URL;
    this.httpClient = options?.httpClient || axios;
  }

  public getClientId(): string {
    return (this.configuredClientId ?? process.env.APPLE_CLIENT_ID ?? '').trim();
  }

  public getTeamId(): string {
    return (this.configuredTeamId ?? process.env.APPLE_TEAM_ID ?? '').trim();
  }

  public getKeyId(): string {
    return (this.configuredKeyId ?? process.env.APPLE_KEY_ID ?? '').trim();
  }

  public getPrivateKeyPem(): string {
    const raw = this.configuredPrivateKeyPem ?? process.env.APPLE_PRIVATE_KEY ?? '';
    const trimmed = raw.trim();
    if (trimmed.includes('\\n')) {
      return trimmed.replace(/\\n/g, '\n');
    }
    return trimmed;
  }

  public isRevocationConfigured(): boolean {
    if (process.env.APPLE_AUTH_ENABLED === 'false') {
      return false;
    }
    return Boolean(
      this.getClientId() &&
      this.getTeamId() &&
      this.getKeyId() &&
      this.getPrivateKeyPem()
    );
  }

  public isConfigured(): boolean {
    return this.isRevocationConfigured();
  }

  /**
   * Generates a short-lived (5-minute) client_secret JWT signed with ES256.
   */
  public generateClientSecret(): string {
    const privateKey = this.getPrivateKeyPem();
    const now = Math.floor(Date.now() / 1000);

    return jwt.sign(
      {
        iss: this.getTeamId(),
        iat: now,
        exp: now + 300,
        aud: 'https://appleid.apple.com',
        sub: this.getClientId(),
      },
      privateKey,
      {
        algorithm: 'ES256',
        keyid: this.getKeyId(),
      },
    );
  }

  /**
   * Exchanges authorization code for tokens and validates sub in id_token.
   */
  public async exchangeCodeForTokens(
    authorizationCode: string,
    expectedAppleSub: string,
  ): Promise<{ refreshToken: string; idToken?: string }> {
    const clientSecret = this.generateClientSecret();
    const params = new URLSearchParams();
    params.append('client_id', this.getClientId());
    params.append('client_secret', clientSecret);
    params.append('code', authorizationCode.trim());
    params.append('grant_type', 'authorization_code');

    let response: any;
    try {
      response = await this.httpClient.post(this.tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        timeout: 5000,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const appleError = err?.response?.data?.error;

      // Sanitized logging: never log err.config.data or tokens
      this.logger.error(
        `Apple token exchange failed: status=${status}, error=${appleError || err?.message || 'unknown'}`,
      );

      if (status === 400 && appleError === 'invalid_grant') {
        throw new BadRequestException({
          statusCode: 400,
          code: 'APPLE_CODE_INVALID',
          message: 'رمز تفويض Apple منتهي الصلاحية أو غير صالح، يرجى إعادة المحاولة من التطبيق',
        });
      }

      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'APPLE_SERVICE_ERROR',
        message: 'تعذّر تأكيد الإلغاء مع Apple، يرجى المحاولة بعد قليل',
      });
    }

    const { refresh_token, id_token } = response.data || {};
    if (!refresh_token || typeof refresh_token !== 'string') {
      this.logger.error('Apple token exchange response missing refresh_token');
      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'APPLE_SERVICE_ERROR',
        message: 'تعذّر تأكيد الإلغاء مع Apple، يرجى المحاولة بعد قليل',
      });
    }

    // Verify sub in returned id_token if provided
    if (id_token && typeof id_token === 'string') {
      const decoded = jwt.decode(id_token) as Record<string, any> | null;
      const tokenSub = decoded?.sub;

      if (!tokenSub || tokenSub !== expectedAppleSub) {
        this.logger.warn('Apple token exchange id_token sub does not match user appleSub');
        // Precautionary revocation of the received refresh_token
        await this.revokeToken(refresh_token).catch(() => {});
        throw new UnauthorizedException({
          statusCode: 401,
          code: 'APPLE_SUB_MISMATCH',
          message: 'حساب Apple المستخدم لا يطابق الحساب المسجل في سوق ون',
        });
      }
    }

    return { refreshToken: refresh_token, idToken: id_token };
  }

  /**
   * Revokes the refresh token at Apple revocation endpoint.
   */
  public async revokeToken(refreshToken: string): Promise<void> {
    const clientSecret = this.generateClientSecret();
    const params = new URLSearchParams();
    params.append('client_id', this.getClientId());
    params.append('client_secret', clientSecret);
    params.append('token', refreshToken.trim());
    params.append('token_type_hint', 'refresh_token');

    try {
      await this.httpClient.post(this.revokeUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        timeout: 5000,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const appleError = err?.response?.data?.error;

      // Sanitized logging: never log err.config.data or tokens
      this.logger.error(
        `Apple token revocation failed: status=${status}, error=${appleError || err?.message || 'unknown'}`,
      );

      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'APPLE_SERVICE_ERROR',
        message: 'تعذّر تأكيد الإلغاء مع Apple، يرجى المحاولة بعد قليل',
      });
    }
  }

  /**
   * Orchestrates the complete exchange and revocation sequence.
   */
  public async exchangeAndRevoke(
    authorizationCode: string,
    expectedAppleSub: string,
  ): Promise<void> {
    if (!this.isRevocationConfigured()) {
      this.logger.warn('Apple revocation requested but environment variables are missing');
      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'APPLE_REVOCATION_UNAVAILABLE',
        message: 'خدمة إلغاء الحساب عبر Apple غير متوفرة حالياً، يرجى المحاولة لاحقاً أو التواصل مع الدعم',
      });
    }

    const { refreshToken } = await this.exchangeCodeForTokens(authorizationCode, expectedAppleSub);
    await this.revokeToken(refreshToken);
  }
}
