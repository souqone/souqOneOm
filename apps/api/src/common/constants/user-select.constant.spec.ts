import {
  USER_SELECT_PUBLIC,
  USER_SELECT_DETAIL,
  USER_SELECT_LISTING_PUBLIC,
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
});
