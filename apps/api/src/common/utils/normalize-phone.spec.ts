import { normalizePhone, normalizePhoneStrict } from './normalize-phone';

describe('normalizePhone', () => {
  describe('E.164 and international format', () => {
    it('preserves already valid E.164 phone number', () => {
      expect(normalizePhone('+96891234567')).toBe('+96891234567');
      expect(normalizePhone('+971501234567')).toBe('+971501234567');
    });

    it('converts 00-prefixed international numbers to +', () => {
      expect(normalizePhone('0096891234567')).toBe('+96891234567');
      expect(normalizePhone('00971501234567')).toBe('+971501234567');
    });
  });

  describe('Local 8-digit Omani numbers', () => {
    it('prepends +968 to bare 8-digit local number', () => {
      expect(normalizePhone('91234567')).toBe('+96891234567');
      expect(normalizePhone('71234567')).toBe('+96871234567');
    });
  });

  describe('Formatting with spaces, dashes, parentheses', () => {
    it('strips spaces and dashes from valid numbers', () => {
      expect(normalizePhone('+968 9123-4567')).toBe('+96891234567');
      expect(normalizePhone('00968-9123-4567')).toBe('+96891234567');
      expect(normalizePhone('9123 4567')).toBe('+96891234567');
      expect(normalizePhone(' (9123) - 4567 ')).toBe('+96891234567');
    });
  });

  describe('Invalid, too-short, or garbage inputs', () => {
    it('returns null for empty, null, or undefined', () => {
      expect(normalizePhone(null)).toBeNull();
      expect(normalizePhone(undefined)).toBeNull();
      expect(normalizePhone('')).toBeNull();
      expect(normalizePhone('   ')).toBeNull();
    });

    it('returns null for garbage or non-numeric strings', () => {
      expect(normalizePhone('not-a-phone')).toBeNull();
      expect(normalizePhone('abcdefgh')).toBeNull();
      expect(normalizePhone('+++')).toBeNull();
    });

    it('returns null for numbers that are too short', () => {
      expect(normalizePhone('12345')).toBeNull();
      expect(normalizePhone('+1234')).toBeNull();
      expect(normalizePhone('1234567')).toBeNull(); // 7 digits
    });

    it('returns null for numbers that exceed 15 digits', () => {
      expect(normalizePhone('+1234567890123456')).toBeNull(); // 16 digits
    });
  });
});

describe('normalizePhoneStrict', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // By default, allow both 968 and 20 in tests
    process.env.PHONE_ALLOWED_COUNTRY_CODES = '968,20';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Oman (+968) rules', () => {
    it('accepts valid 8-digit numbers starting with 9 or 7', () => {
      expect(normalizePhoneStrict('91234567')).toEqual({ e164: '+96891234567', countryCode: '968' });
      expect(normalizePhoneStrict('71234567')).toEqual({ e164: '+96871234567', countryCode: '968' });
      expect(normalizePhoneStrict('+96891234567')).toEqual({ e164: '+96891234567', countryCode: '968' });
      expect(normalizePhoneStrict('+96871234567')).toEqual({ e164: '+96871234567', countryCode: '968' });
      expect(normalizePhoneStrict('0096891234567')).toEqual({ e164: '+96891234567', countryCode: '968' });
    });

    it('handles whitespace, hyphens, and parentheses in Omani numbers', () => {
      expect(normalizePhoneStrict('+968 9123-4567')).toEqual({ e164: '+96891234567', countryCode: '968' });
      expect(normalizePhoneStrict(' (9123) 4567 ')).toEqual({ e164: '+96891234567', countryCode: '968' });
    });

    it('rejects Omani numbers not starting with 7 or 9', () => {
      expect(normalizePhoneStrict('24123456')).toBeNull();
      expect(normalizePhoneStrict('+96824123456')).toBeNull();
      expect(normalizePhoneStrict('12345678')).toBeNull();
      expect(normalizePhoneStrict('+96812345678')).toBeNull();
    });

    it('rejects wrong length for Omani numbers', () => {
      expect(normalizePhoneStrict('9123456')).toBeNull(); // 7 digits
      expect(normalizePhoneStrict('912345678')).toBeNull(); // 9 digits
      expect(normalizePhoneStrict('+9689123456')).toBeNull();
      expect(normalizePhoneStrict('+968912345678')).toBeNull();
    });
  });

  describe('Egypt (+20) rules', () => {
    it('accepts local 11-digit numbers starting with 01 (010, 011, 012, 015)', () => {
      expect(normalizePhoneStrict('01012345678')).toEqual({ e164: '+201012345678', countryCode: '20' });
      expect(normalizePhoneStrict('01112345678')).toEqual({ e164: '+201112345678', countryCode: '20' });
      expect(normalizePhoneStrict('01212345678')).toEqual({ e164: '+201212345678', countryCode: '20' });
      expect(normalizePhoneStrict('01512345678')).toEqual({ e164: '+201512345678', countryCode: '20' });
    });

    it('accepts +20 followed by 10 digits starting with 1', () => {
      expect(normalizePhoneStrict('+201012345678')).toEqual({ e164: '+201012345678', countryCode: '20' });
      expect(normalizePhoneStrict('00201012345678')).toEqual({ e164: '+201012345678', countryCode: '20' });
    });

    it('strips local leading 0 when provided with +20 or 0020', () => {
      expect(normalizePhoneStrict('+2001012345678')).toEqual({ e164: '+201012345678', countryCode: '20' });
      expect(normalizePhoneStrict('002001012345678')).toEqual({ e164: '+201012345678', countryCode: '20' });
    });

    it('handles spaces and dashes in Egyptian numbers', () => {
      expect(normalizePhoneStrict('010 1234-5678')).toEqual({ e164: '+201012345678', countryCode: '20' });
      expect(normalizePhoneStrict('+20 10 1234 5678')).toEqual({ e164: '+201012345678', countryCode: '20' });
    });

    it('rejects Egyptian numbers with wrong length or wrong prefix', () => {
      expect(normalizePhoneStrict('0101234567')).toBeNull(); // 10 digits
      expect(normalizePhoneStrict('010123456789')).toBeNull(); // 12 digits
      expect(normalizePhoneStrict('02123456789')).toBeNull(); // 02 landline
      expect(normalizePhoneStrict('+20212345678')).toBeNull(); // landline
      expect(normalizePhoneStrict('1012345678')).toBeNull(); // bare 10 digits without country code or 01
    });
  });

  describe('Other countries and garbage inputs', () => {
    it('returns null for empty, null, or undefined', () => {
      expect(normalizePhoneStrict(null)).toBeNull();
      expect(normalizePhoneStrict(undefined)).toBeNull();
      expect(normalizePhoneStrict('')).toBeNull();
      expect(normalizePhoneStrict('   ')).toBeNull();
    });

    it('returns null for garbage strings', () => {
      expect(normalizePhoneStrict('not-a-phone')).toBeNull();
      expect(normalizePhoneStrict('abcdefgh')).toBeNull();
      expect(normalizePhoneStrict('+++')).toBeNull();
    });

    it('rejects unsupported country codes (e.g. UAE +971, US +1, UK +44)', () => {
      expect(normalizePhoneStrict('+971501234567')).toBeNull();
      expect(normalizePhoneStrict('00971501234567')).toBeNull();
      expect(normalizePhoneStrict('+14155552671')).toBeNull();
      expect(normalizePhoneStrict('+447911123456')).toBeNull();
    });
  });

  describe('Allowlist and Environment defaults', () => {
    it('rejects country not in opts.allowedCountryCodes', () => {
      expect(
        normalizePhoneStrict('+201012345678', { allowedCountryCodes: ['968'] }),
      ).toBeNull();
      expect(
        normalizePhoneStrict('+96891234567', { allowedCountryCodes: ['968'] }),
      ).toEqual({ e164: '+96891234567', countryCode: '968' });
    });

    it('defaults to 968 only in production when PHONE_ALLOWED_COUNTRY_CODES is unset', () => {
      delete process.env.PHONE_ALLOWED_COUNTRY_CODES;
      process.env.NODE_ENV = 'production';

      expect(normalizePhoneStrict('+96891234567')).toEqual({ e164: '+96891234567', countryCode: '968' });
      expect(normalizePhoneStrict('+201012345678')).toBeNull();
      expect(normalizePhoneStrict('01012345678')).toBeNull();
    });

    it('defaults to 968 and 20 in non-production when PHONE_ALLOWED_COUNTRY_CODES is unset', () => {
      delete process.env.PHONE_ALLOWED_COUNTRY_CODES;
      process.env.NODE_ENV = 'development';

      expect(normalizePhoneStrict('+96891234567')).toEqual({ e164: '+96891234567', countryCode: '968' });
      expect(normalizePhoneStrict('+201012345678')).toEqual({ e164: '+201012345678', countryCode: '20' });
    });

    it('honors PHONE_ALLOWED_COUNTRY_CODES environment variable', () => {
      process.env.PHONE_ALLOWED_COUNTRY_CODES = '968';
      process.env.NODE_ENV = 'development';

      expect(normalizePhoneStrict('+96891234567')).toEqual({ e164: '+96891234567', countryCode: '968' });
      expect(normalizePhoneStrict('+201012345678')).toBeNull();

      process.env.PHONE_ALLOWED_COUNTRY_CODES = '968, 20';
      expect(normalizePhoneStrict('+201012345678')).toEqual({ e164: '+201012345678', countryCode: '20' });
    });
  });
});

