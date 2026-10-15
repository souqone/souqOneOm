import {
  USER_SELECT_PUBLIC,
  USER_SELECT_DETAIL,
  USER_SELECT_LISTING_PUBLIC,
  USER_SELECT_PROFILE_PUBLIC,
  USER_SELECT_PROFILE_PRIVATE,
} from './user-select.constant';

describe('user-select.constant', () => {
  it('USER_SELECT_LISTING_PUBLIC should contain exactly the 7 expected fields and no phone', () => {
    expect(USER_SELECT_LISTING_PUBLIC).toEqual({
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isVerified: true,
      governorate: true,
      createdAt: true,
    });

    expect(Object.keys(USER_SELECT_LISTING_PUBLIC).sort()).toEqual([
      'avatarUrl',
      'createdAt',
      'displayName',
      'governorate',
      'id',
      'isVerified',
      'username',
    ]);

    expect((USER_SELECT_LISTING_PUBLIC as any).phone).toBeUndefined();
    expect('phone' in USER_SELECT_LISTING_PUBLIC).toBe(false);
  });

  it('existing exports USER_SELECT_PUBLIC and USER_SELECT_DETAIL should remain unchanged', () => {
    expect(USER_SELECT_PUBLIC).toEqual({
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isVerified: true,
      governorate: true,
    });

    expect(USER_SELECT_DETAIL).toEqual({
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isVerified: true,
      governorate: true,
      phone: true,
      createdAt: true,
    });
  });

  it('USER_SELECT_PROFILE_PUBLIC should include public fields (bio, locations) and no phone/email', () => {
    expect(USER_SELECT_PROFILE_PUBLIC).toEqual({
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      country: true,
      governorateId: true,
      wilayaId: true,
      governorateRef: true,
      wilayaRef: true,
      isVerified: true,
      role: true,
      createdAt: true,
    });
    expect('phone' in USER_SELECT_PROFILE_PUBLIC).toBe(false);
    expect('email' in USER_SELECT_PROFILE_PUBLIC).toBe(false);
    expect('passwordHash' in USER_SELECT_PROFILE_PUBLIC).toBe(false);
  });

  it('USER_SELECT_PROFILE_PRIVATE should include phone, email, and updatedAt', () => {
    expect(USER_SELECT_PROFILE_PRIVATE).toEqual({
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      country: true,
      governorateId: true,
      wilayaId: true,
      governorateRef: true,
      wilayaRef: true,
      isVerified: true,
      role: true,
      createdAt: true,
      email: true,
      phone: true,
      updatedAt: true,
    });
    expect('passwordHash' in USER_SELECT_PROFILE_PRIVATE).toBe(false);
    expect('tokenVersion' in USER_SELECT_PROFILE_PRIVATE).toBe(false);
  });
});
