import {
  Injectable,
  Logger,
  Optional,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import { maskEmailSafe } from '../common/utils/mask-email';

export interface AppleJwkKey {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

export interface AppleJwksResponse {
  keys: AppleJwkKey[];
}

export interface AppleTokenPayload {
  sub: string;
  email?: string;
  emailVerified: boolean;
  isPrivateEmail: boolean;
  nonce?: string;
  rawPayload: Record<string, any>;
}

export interface AppleVerifierOptions {
  clientId?: string;
  jwksUrl?: string;
  cacheTtlMs?: number;
  keysFetcher?: () => Promise<AppleJwkKey[]>;
}

const DEFAULT_APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';
const DEFAULT_APPLE_CLIENT_ID = 'com.souqone.app';
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const APPLE_ISSUER = 'https://appleid.apple.com';
const PRIVATE_RELAY_DOMAIN = '@privaterelay.appleid.com';

function safeCompareBuffers(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

@Injectable()
export class AppleTokenVerifierService {
  private readonly logger = new Logger(AppleTokenVerifierService.name);

  // In-memory JWKS cache: kid -> public key (PEM)
  private jwksCache = new Map<string, string>();
  private lastFetchTime = 0;
  private readonly jwksUrl: string;
  private readonly defaultClientId: string;
  private readonly cacheTtlMs: number;
  private customKeysFetcher?: () => Promise<AppleJwkKey[]>;

  constructor(@Optional() options?: AppleVerifierOptions) {
    this.jwksUrl = options?.jwksUrl || DEFAULT_APPLE_JWKS_URL;
    this.defaultClientId = options?.clientId || process.env.APPLE_CLIENT_ID || DEFAULT_APPLE_CLIENT_ID;
    this.cacheTtlMs = options?.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.customKeysFetcher = options?.keysFetcher;
  }

  /**
   * For unit tests or offline environments: inject custom JWKS fetcher.
   */
  public setCustomKeysFetcher(fetcher?: () => Promise<AppleJwkKey[]>): void {
    this.customKeysFetcher = fetcher;
    this.clearCache();
  }

  /**
   * Clear cached JWKS keys.
   */
  public clearCache(): void {
    this.jwksCache.clear();
    this.lastFetchTime = 0;
  }

  /**
   * Resolves effective Apple client ID (Audience) from environment or default.
   */
  public getClientId(): string {
    return (process.env.APPLE_CLIENT_ID || this.defaultClientId || '').trim();
  }

  /**
   * Checks if Apple Sign-In service is enabled.
   */
  public isEnabled(): boolean {
    if (process.env.APPLE_AUTH_ENABLED === 'false') {
      return false;
    }
    return Boolean(this.getClientId());
  }

  /**
   * Verifies an Apple Identity Token (JWT) and returns validated user claims.
   *
   * @param idToken The identity token string returned by Apple.
   * @param rawNonce Optional raw nonce provided by mobile app.
   * @returns AppleTokenPayload Validated user claims.
   */
  async verifyIdToken(idToken: string, rawNonce?: string): Promise<AppleTokenPayload> {
    // 1. Guard check: verify service configuration at runtime
    if (!this.isEnabled()) {
      this.logger.warn('Sign in with Apple requested but service is disabled or client ID missing');
      throw new ServiceUnavailableException('خدمة تسجيل الدخول بواسطة Apple غير مفعلة حالياً');
    }

    if (!idToken || typeof idToken !== 'string' || idToken.trim() === '') {
      throw new UnauthorizedException('رمز Apple غير صالح');
    }

    const trimmedToken = idToken.trim();

    // 2. Decode header without verification to inspect kid and alg
    const decodedComplete = jwt.decode(trimmedToken, { complete: true });
    if (!decodedComplete || typeof decodedComplete !== 'object') {
      throw new UnauthorizedException('رمز Apple غير صالح');
    }

    const header = decodedComplete.header;
    if (!header || header.alg !== 'RS256' || !header.kid) {
      this.logger.warn(`Rejected Apple token with invalid header: alg=${header?.alg}, hasKid=${Boolean(header?.kid)}`);
      throw new UnauthorizedException('رمز Apple غير صالح');
    }

    const kid = header.kid;

    // 3. Resolve public key for kid (with 24h caching + 1 on-demand refresh on cache miss)
    let publicKeyPem = await this.getPublicKeyForKid(kid);
    if (!publicKeyPem) {
      // Kid not found in current cache: trigger on-demand fresh fetch to handle Apple key rotation
      this.logger.log(`Kid ${kid} not in cache, fetching fresh JWKS from Apple`);
      await this.refreshJwksCache();
      publicKeyPem = this.jwksCache.get(kid);
    }

    if (!publicKeyPem) {
      this.logger.warn(`Public key for kid ${kid} could not be resolved from Apple JWKS`);
      throw new UnauthorizedException('رمز Apple غير صالح — مفتاح التوقيع غير معروف');
    }

    // 4. Verify signature and claims (iss, aud, exp) using jsonwebtoken
    const expectedAudience = this.getClientId();
    let rawPayload: any;
    try {
      rawPayload = jwt.verify(trimmedToken, publicKeyPem, {
        algorithms: ['RS256'],
        issuer: APPLE_ISSUER,
        audience: expectedAudience,
      });
    } catch (err: any) {
      if (err instanceof jwt.TokenExpiredError) {
        this.logger.warn(`Apple identity token expired at ${err.expiredAt}`);
        throw new UnauthorizedException('رمز Apple غير صالح أو منتهي الصلاحية');
      }
      this.logger.warn(`Apple token verification failed: ${err?.message || err}`);
      throw new UnauthorizedException('رمز Apple غير صالح');
    }

    // 5. Validate essential payload claims
    if (!rawPayload || typeof rawPayload !== 'object' || !rawPayload.sub || typeof rawPayload.sub !== 'string') {
      throw new UnauthorizedException('رمز Apple غير صالح — معرف المستخدم مفقود');
    }

    const sub = rawPayload.sub.trim();
    if (sub === '') {
      throw new UnauthorizedException('رمز Apple غير صالح — معرف المستخدم مفقود');
    }

    // 6. Nonce verification
    // Mobile generates raw nonce, sends SHA-256(rawNonce) to Apple, and passes rawNonce to backend.
    // The backend hashes rawNonce with SHA-256 (hex) and compares against rawPayload.nonce
    // using constant-time comparison (crypto.timingSafeEqual).
    if (rawNonce) {
      const claimNonce = typeof rawPayload.nonce === 'string' ? rawPayload.nonce : '';
      if (!claimNonce) {
        this.logger.warn('Nonce verification failed: rawNonce provided but token claim missing nonce');
        throw new UnauthorizedException('رمز التحقق (nonce) غير متطابق — محاولة غير آمنة');
      }

      const expectedHashedNonce = crypto.createHash('sha256').update(rawNonce).digest('hex');
      const isHashMatch = safeCompareBuffers(expectedHashedNonce, claimNonce);
      const isDirectMatch = safeCompareBuffers(rawNonce, claimNonce);

      if (!isHashMatch && !isDirectMatch) {
        this.logger.warn('Nonce verification failed: neither SHA-256 nor direct match satisfied');
        throw new UnauthorizedException('رمز التحقق (nonce) غير متطابق — محاولة غير آمنة');
      }
    }

    // 7. Extract and normalize email & verification status
    // Note: In Apple JWTs, email_verified can arrive as boolean true OR string "true".
    const email = typeof rawPayload.email === 'string' ? rawPayload.email.trim().toLowerCase() : undefined;
    const isEmailVerified =
      rawPayload.email_verified === true ||
      rawPayload.email_verified === 'true' ||
      rawPayload.email_verified === 1;

    if (email && !isEmailVerified) {
      this.logger.warn(`Apple account email is unverified: ${maskEmailSafe(email)}`);
      throw new UnauthorizedException('البريد الإلكتروني لحساب Apple غير موثق');
    }

    // 8. Determine private relay status
    const isPrivateEmail = Boolean(
      rawPayload.is_private_email === true ||
      rawPayload.is_private_email === 'true' ||
      (email && email.endsWith(PRIVATE_RELAY_DOMAIN)),
    );

    if (email) {
      this.logger.debug(
        `Successfully verified Apple token for sub=${sub}, email=${maskEmailSafe(email)}, isPrivate=${isPrivateEmail}`,
      );
    } else {
      this.logger.debug(`Successfully verified Apple token for sub=${sub} (no email in token)`);
    }

    return {
      sub,
      email,
      emailVerified: isEmailVerified,
      isPrivateEmail,
      nonce: rawPayload.nonce,
      rawPayload,
    };
  }

  /**
   * Retrieves public key PEM from cache if cache is still valid.
   */
  private async getPublicKeyForKid(kid: string): Promise<string | undefined> {
    const now = Date.now();
    if (this.jwksCache.size > 0 && now - this.lastFetchTime < this.cacheTtlMs) {
      return this.jwksCache.get(kid);
    }

    await this.refreshJwksCache();
    return this.jwksCache.get(kid);
  }

  /**
   * Fetches latest JWKS keys from Apple and populates in-memory PEM cache.
   */
  private async refreshJwksCache(): Promise<void> {
    let keys: AppleJwkKey[] = [];
    try {
      if (this.customKeysFetcher) {
        keys = await this.customKeysFetcher();
      } else {
        const response = await axios.get<AppleJwksResponse>(this.jwksUrl, {
          timeout: 7000,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'SouqOne-Backend-AppleVerifier/1.0',
          },
        });
        keys = response.data?.keys || [];
      }
    } catch (err: any) {
      this.logger.error(`Failed to fetch JWKS from Apple: ${err?.message || err}`);
      // If we have stale cache keys, preserve them rather than failing completely
      if (this.jwksCache.size > 0) {
        this.logger.warn('Using existing stale JWKS cache due to Apple network fetch failure');
        return;
      }
      throw new UnauthorizedException('فشل الاتصال بخوادم Apple للتحقق من الهوية');
    }

    if (!Array.isArray(keys) || keys.length === 0) {
      this.logger.error('Received empty or invalid keys array from Apple JWKS');
      if (this.jwksCache.size === 0) {
        throw new UnauthorizedException('فشل الاتصال بخوادم Apple للتحقق من الهوية');
      }
      return;
    }

    const newCache = new Map<string, string>();
    for (const key of keys) {
      if (key?.kid && key.kty === 'RSA') {
        try {
          const keyObject = crypto.createPublicKey({ key: key as any, format: 'jwk' });
          const pem = keyObject.export({ type: 'spki', format: 'pem' }) as string;
          newCache.set(key.kid, pem);
        } catch (e: any) {
          this.logger.warn(`Failed to convert JWK key to PEM (kid=${key.kid}): ${e?.message || e}`);
        }
      }
    }

    if (newCache.size > 0) {
      this.jwksCache = newCache;
      this.lastFetchTime = Date.now();
      this.logger.log(`Successfully cached ${newCache.size} Apple JWKS public keys`);
    }
  }
}
