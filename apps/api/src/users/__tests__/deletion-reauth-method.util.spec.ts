import { getDeletionReauthMethod } from '../deletion-reauth-method.util';

describe('getDeletionReauthMethod (PR 2C Unit Tests)', () => {
  it("returns 'password' when user has passwordHash and no googleId", () => {
    const method = getDeletionReauthMethod({
      passwordHash: '$2a$10$hashedpasswordhere',
      googleId: null,
    });
    expect(method).toBe('password');
  });

  it("returns 'google' when user has googleId and no passwordHash", () => {
    const method = getDeletionReauthMethod({
      passwordHash: null,
      googleId: 'google-oauth2|1234567890',
    });
    expect(method).toBe('google');
  });

  it("returns 'confirmation' when user has neither passwordHash nor googleId (phone-only user)", () => {
    const method = getDeletionReauthMethod({
      passwordHash: null,
      googleId: null,
    });
    expect(method).toBe('confirmation');
  });

  it("returns 'password' when user has BOTH passwordHash and googleId (password takes precedence)", () => {
    const method = getDeletionReauthMethod({
      passwordHash: '$2a$10$hashedpasswordhere',
      googleId: 'google-oauth2|1234567890',
    });
    expect(method).toBe('password');
  });

  it("returns 'confirmation' when candidate is undefined or null or fields are empty", () => {
    expect(getDeletionReauthMethod(undefined)).toBe('confirmation');
    expect(getDeletionReauthMethod(null)).toBe('confirmation');
    expect(getDeletionReauthMethod({})).toBe('confirmation');
    expect(getDeletionReauthMethod({ passwordHash: '', googleId: '' })).toBe('confirmation');
  });
});
