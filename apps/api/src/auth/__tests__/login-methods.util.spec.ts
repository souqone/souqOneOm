import {
  getLoginMethods,
  isPhoneLoginAvailable,
  LoginMethodsUser,
} from '../login-methods.util';

describe('LoginMethodsUtil', () => {
  describe('isPhoneLoginAvailable', () => {
    describe('Production environment (NODE_ENV=production)', () => {
      it('returns true when WHATSAPP_PROVIDER=meta and both phoneId and token are provided', () => {
        const env = {
          NODE_ENV: 'production',
          WHATSAPP_PROVIDER: 'meta',
          WHATSAPP_PHONE_NUMBER_ID: '1000123456789',
          WHATSAPP_ACCESS_TOKEN: 'EAAG_test_token_secret',
        };
        expect(isPhoneLoginAvailable(env)).toBe(true);
      });

      it('returns true with whitespace-padded values and case-insensitive provider', () => {
        const env = {
          NODE_ENV: 'production',
          WHATSAPP_PROVIDER: '  META  ',
          WHATSAPP_PHONE_NUMBER_ID: ' 1000123456789 ',
          WHATSAPP_ACCESS_TOKEN: ' EAAG_test_token_secret ',
        };
        expect(isPhoneLoginAvailable(env)).toBe(true);
      });

      it('returns false when WHATSAPP_PROVIDER is not meta', () => {
        const env = {
          NODE_ENV: 'production',
          WHATSAPP_PROVIDER: 'mock',
          WHATSAPP_PHONE_NUMBER_ID: '1000123456789',
          WHATSAPP_ACCESS_TOKEN: 'EAAG_test_token_secret',
        };
        expect(isPhoneLoginAvailable(env)).toBe(false);
      });

      it('returns false when WHATSAPP_PROVIDER is disabled', () => {
        const env = {
          NODE_ENV: 'production',
          WHATSAPP_PROVIDER: 'disabled',
          WHATSAPP_PHONE_NUMBER_ID: '1000123456789',
          WHATSAPP_ACCESS_TOKEN: 'EAAG_test_token_secret',
        };
        expect(isPhoneLoginAvailable(env)).toBe(false);
      });

      it('returns false when WHATSAPP_PROVIDER is empty or undefined', () => {
        expect(isPhoneLoginAvailable({ NODE_ENV: 'production' })).toBe(false);
        expect(isPhoneLoginAvailable({ NODE_ENV: 'production', WHATSAPP_PROVIDER: '' })).toBe(false);
      });

      it('returns false when WHATSAPP_PHONE_NUMBER_ID is missing or whitespace', () => {
        const env = {
          NODE_ENV: 'production',
          WHATSAPP_PROVIDER: 'meta',
          WHATSAPP_PHONE_NUMBER_ID: '   ',
          WHATSAPP_ACCESS_TOKEN: 'EAAG_test_token_secret',
        };
        expect(isPhoneLoginAvailable(env)).toBe(false);
      });

      it('returns false when WHATSAPP_ACCESS_TOKEN is missing or whitespace', () => {
        const env = {
          NODE_ENV: 'production',
          WHATSAPP_PROVIDER: 'meta',
          WHATSAPP_PHONE_NUMBER_ID: '1000123456789',
          WHATSAPP_ACCESS_TOKEN: '',
        };
        expect(isPhoneLoginAvailable(env)).toBe(false);
      });
    });

    describe('Non-production environments (development, test)', () => {
      it('returns true with default mock sender when WHATSAPP_PROVIDER is unset', () => {
        expect(isPhoneLoginAvailable({ NODE_ENV: 'development' })).toBe(true);
        expect(isPhoneLoginAvailable({ NODE_ENV: 'test' })).toBe(true);
      });

      it('returns true when WHATSAPP_PROVIDER=mock', () => {
        expect(isPhoneLoginAvailable({ NODE_ENV: 'development', WHATSAPP_PROVIDER: 'mock' })).toBe(true);
      });

      it('returns false when WHATSAPP_PROVIDER=disabled explicitly', () => {
        expect(isPhoneLoginAvailable({ NODE_ENV: 'development', WHATSAPP_PROVIDER: 'disabled' })).toBe(false);
        expect(isPhoneLoginAvailable({ NODE_ENV: 'test', WHATSAPP_PROVIDER: 'disabled' })).toBe(false);
      });

      it('returns true when WHATSAPP_PROVIDER=meta and credentials are configured', () => {
        const env = {
          NODE_ENV: 'development',
          WHATSAPP_PROVIDER: 'meta',
          WHATSAPP_PHONE_NUMBER_ID: '1000123456789',
          WHATSAPP_ACCESS_TOKEN: 'token_123',
        };
        expect(isPhoneLoginAvailable(env)).toBe(true);
      });

      it('returns false when WHATSAPP_PROVIDER=meta but credentials are empty', () => {
        const env = {
          NODE_ENV: 'development',
          WHATSAPP_PROVIDER: 'meta',
          WHATSAPP_PHONE_NUMBER_ID: '',
          WHATSAPP_ACCESS_TOKEN: '',
        };
        expect(isPhoneLoginAvailable(env)).toBe(false);
      });
    });
  });

  describe('getLoginMethods', () => {
    const prodEnabledEnv = {
      NODE_ENV: 'production',
      WHATSAPP_PROVIDER: 'meta',
      WHATSAPP_PHONE_NUMBER_ID: '1000123456789',
      WHATSAPP_ACCESS_TOKEN: 'EAAG_valid_token',
    };

    const prodDisabledEnv = {
      NODE_ENV: 'production',
      WHATSAPP_PROVIDER: 'disabled',
    };

    it('returns 0 methods and all false for null or undefined user', () => {
      expect(getLoginMethods(null, prodEnabledEnv)).toEqual({
        hasPassword: false,
        hasGoogle: false,
        hasApple: false,
        hasPhone: false,
        totalMethods: 0,
      });
      expect(getLoginMethods(undefined, prodEnabledEnv)).toEqual({
        hasPassword: false,
        hasGoogle: false,
        hasApple: false,
        hasPhone: false,
        totalMethods: 0,
      });
    });

    it('identifies password login method when passwordHash, email, and isVerified are true', () => {
      const user: LoginMethodsUser = {
        passwordHash: '$2b$10$hashedpasswordstring',
        email: 'user@example.com',
        isVerified: true,
        emailVerifiedAt: new Date(),
      };
      const result = getLoginMethods(user, prodEnabledEnv);
      expect(result).toEqual({
        hasPassword: true,
        hasGoogle: false,
        hasApple: false,
        hasPhone: false,
        totalMethods: 1,
      });
    });

    it('does NOT count password as a login method if emailVerifiedAt is set but isVerified is false', () => {
      const user: LoginMethodsUser = {
        passwordHash: '$2b$10$hashedpasswordstring',
        email: 'user@example.com',
        emailVerifiedAt: new Date(),
        isVerified: false,
      };
      const result = getLoginMethods(user, prodEnabledEnv);
      expect(result.hasPassword).toBe(false);
      expect(result.totalMethods).toBe(0);
    });

    it('does NOT count password as a login method if email is unverified', () => {
      const user: LoginMethodsUser = {
        passwordHash: '$2b$10$hashedpasswordstring',
        email: 'user@example.com',
        emailVerifiedAt: null,
        isVerified: false,
      };
      const result = getLoginMethods(user, prodEnabledEnv);
      expect(result.hasPassword).toBe(false);
      expect(result.totalMethods).toBe(0);
    });

    it('does NOT count password as a login method if email is missing', () => {
      const user: LoginMethodsUser = {
        passwordHash: '$2b$10$hashedpasswordstring',
        email: null,
        emailVerifiedAt: new Date(),
      };
      const result = getLoginMethods(user, prodEnabledEnv);
      expect(result.hasPassword).toBe(false);
      expect(result.totalMethods).toBe(0);
    });

    it('identifies Google login method when googleId is present', () => {
      const user: LoginMethodsUser = {
        googleId: '109876543210987654321',
      };
      const result = getLoginMethods(user, prodEnabledEnv);
      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: true,
        hasApple: false,
        hasPhone: false,
        totalMethods: 1,
      });
    });

    it('identifies Apple login method when appleSub is present', () => {
      const user: LoginMethodsUser = {
        appleSub: '000123.apple.sub.456',
      };
      const result = getLoginMethods(user, prodEnabledEnv);
      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: false,
        hasApple: true,
        hasPhone: false,
        totalMethods: 1,
      });
    });

    it('identifies Phone login method when phoneE164 and phoneVerifiedAt are present and phone login is active', () => {
      const user: LoginMethodsUser = {
        phoneE164: '+96891234567',
        phoneVerifiedAt: new Date(),
      };
      const result = getLoginMethods(user, prodEnabledEnv);
      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: false,
        hasApple: false,
        hasPhone: true,
        totalMethods: 1,
      });
    });

    it('does NOT count phone as login method if phone login is DISABLED in environment', () => {
      const user: LoginMethodsUser = {
        phoneE164: '+96891234567',
        phoneVerifiedAt: new Date(),
      };
      const result = getLoginMethods(user, prodDisabledEnv);
      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: false,
        hasApple: false,
        hasPhone: false,
        totalMethods: 0,
      });
    });

    it('does NOT count phone as login method if phone is unverified', () => {
      const user: LoginMethodsUser = {
        phoneE164: '+96891234567',
        phoneVerifiedAt: null,
      };
      const result = getLoginMethods(user, prodEnabledEnv);
      expect(result.hasPhone).toBe(false);
      expect(result.totalMethods).toBe(0);
    });

    it('counts multiple login methods accurately for multi-method account (including Apple)', () => {
      const user: LoginMethodsUser = {
        passwordHash: '$2b$10$hashedpasswordstring',
        email: 'user@example.com',
        isVerified: true,
        emailVerifiedAt: new Date(),
        googleId: 'google-sub-id',
        appleSub: 'apple-sub-id',
        phoneE164: '+96891234567',
        phoneVerifiedAt: new Date(),
      };
      const result = getLoginMethods(user, prodEnabledEnv);
      expect(result).toEqual({
        hasPassword: true,
        hasGoogle: true,
        hasApple: true,
        hasPhone: true,
        totalMethods: 4,
      });
    });
  });
});
