import {
  getDeletionReauthMethod,
  getAvailableDeletionReauthMethods,
} from '../deletion-reauth-method.util';

describe('deletion-reauth-method.util (PR 2B Unit Tests)', () => {
  describe('getDeletionReauthMethod (Primary method)', () => {
    it("returns 'password' when user has passwordHash and no other methods", () => {
      const method = getDeletionReauthMethod({
        passwordHash: '$2a$10$hashedpasswordhere',
        googleId: null,
        appleSub: null,
      });
      expect(method).toBe('password');
    });

    it("returns 'google' when user has googleId and no passwordHash", () => {
      const method = getDeletionReauthMethod({
        passwordHash: null,
        googleId: 'google-oauth2|1234567890',
        appleSub: null,
      });
      expect(method).toBe('google');
    });

    it("returns 'apple' when user has appleSub and neither password nor google", () => {
      const method = getDeletionReauthMethod({
        passwordHash: null,
        googleId: null,
        appleSub: '001234.sub.5678',
      });
      expect(method).toBe('apple');
    });

    it("returns 'confirmation' when user has neither passwordHash, googleId, nor appleSub", () => {
      const method = getDeletionReauthMethod({
        passwordHash: null,
        googleId: null,
        appleSub: null,
      });
      expect(method).toBe('confirmation');
    });

    it("returns 'password' when user has BOTH passwordHash and appleSub (password takes precedence)", () => {
      const method = getDeletionReauthMethod({
        passwordHash: '$2a$10$hashedpasswordhere',
        appleSub: '001234.sub.5678',
      });
      expect(method).toBe('password');
    });

    it("returns 'google' when user has BOTH googleId and appleSub without password (google takes precedence over apple)", () => {
      const method = getDeletionReauthMethod({
        passwordHash: null,
        googleId: 'google-oauth2|1234567890',
        appleSub: '001234.sub.5678',
      });
      expect(method).toBe('google');
    });

    it("returns 'confirmation' when candidate is undefined or null or fields are empty", () => {
      expect(getDeletionReauthMethod(undefined)).toBe('confirmation');
      expect(getDeletionReauthMethod(null)).toBe('confirmation');
      expect(getDeletionReauthMethod({})).toBe('confirmation');
      expect(
        getDeletionReauthMethod({ passwordHash: '', googleId: '', appleSub: '' }),
      ).toBe('confirmation');
    });
  });

  describe('getAvailableDeletionReauthMethods (All available methods)', () => {
    it("returns ['password'] for password-only account", () => {
      expect(
        getAvailableDeletionReauthMethods({
          passwordHash: 'hash',
        }),
      ).toEqual(['password']);
    });

    it("returns ['google'] for google-only account", () => {
      expect(
        getAvailableDeletionReauthMethods({
          googleId: 'gid',
        }),
      ).toEqual(['google']);
    });

    it("returns ['apple'] for apple-only account", () => {
      expect(
        getAvailableDeletionReauthMethods({
          appleSub: 'asub',
        }),
      ).toEqual(['apple']);
    });

    it("returns ['password', 'apple'] for account with password and apple", () => {
      expect(
        getAvailableDeletionReauthMethods({
          passwordHash: 'hash',
          appleSub: 'asub',
        }),
      ).toEqual(['password', 'apple']);
    });

    it("returns ['google', 'apple'] for account with google and apple", () => {
      expect(
        getAvailableDeletionReauthMethods({
          googleId: 'gid',
          appleSub: 'asub',
        }),
      ).toEqual(['google', 'apple']);
    });

    it("returns ['password', 'google', 'apple'] for multi-provider account with all 3", () => {
      expect(
        getAvailableDeletionReauthMethods({
          passwordHash: 'hash',
          googleId: 'gid',
          appleSub: 'asub',
        }),
      ).toEqual(['password', 'google', 'apple']);
    });

    it("returns ['confirmation'] when no credentials exist", () => {
      expect(getAvailableDeletionReauthMethods(null)).toEqual(['confirmation']);
      expect(getAvailableDeletionReauthMethods({})).toEqual(['confirmation']);
    });
  });
});
