import { maskEmail, maskPhone } from './pii-masker.util';

describe('pii-masker.util', () => {
  describe('maskEmail', () => {
    it('masks standard email to first char + *** + domain', () => {
      expect(maskEmail('mahmoud@example.test')).toBe('m***@example.test');
      expect(maskEmail('admin@souqone.om')).toBe('a***@souqone.om');
      expect(maskEmail('user123@gmail.com')).toBe('u***@gmail.com');
    });

    it('handles single character local part', () => {
      expect(maskEmail('a@domain.com')).toBe('a***@domain.com');
    });

    it('returns null for null, undefined, empty, or invalid email formats', () => {
      expect(maskEmail(null)).toBeNull();
      expect(maskEmail(undefined)).toBeNull();
      expect(maskEmail('')).toBeNull();
      expect(maskEmail('notanemail')).toBeNull();
      expect(maskEmail('@domain.com')).toBeNull();
      expect(maskEmail('user@')).toBeNull();
    });
  });

  describe('maskPhone', () => {
    it('masks international numbers (+96891234567 -> +968***67)', () => {
      expect(maskPhone('+96891234567')).toBe('+968***67');
      expect(maskPhone('+96871234589')).toBe('+968***89');
    });

    it('masks international numbers without plus (96891234567 -> +968***67)', () => {
      expect(maskPhone('96891234567')).toBe('+968***67');
    });

    it('masks local Oman numbers (91234567 -> +968***67)', () => {
      expect(maskPhone('91234567')).toBe('+968***67');
      expect(maskPhone('24123456')).toBe('+968***56');
    });

    it('returns null for empty, null, or too short strings', () => {
      expect(maskPhone(null)).toBeNull();
      expect(maskPhone(undefined)).toBeNull();
      expect(maskPhone('')).toBeNull();
      expect(maskPhone('123')).toBeNull();
    });
  });
});
