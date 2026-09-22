import { normalizePhone } from './normalize-phone';

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
