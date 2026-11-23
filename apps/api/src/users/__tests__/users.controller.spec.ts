import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { ExpoPushService } from '../../notifications/expo-push.service';
import type { JwtPayload } from '../../auth/auth.types';

describe('UsersController — Account Linking & Unlinking', () => {
  let controller: UsersController;
  let mockUsersService: any;
  let mockExpoPushService: any;

  const mockJwtUser: JwtPayload = {
    sub: 'user-controller-test-id',
    email: 'test@example.com',
    role: 'USER',
  } as any;

  const mockReq: any = {
    ip: '192.168.1.100',
    headers: {
      'user-agent': 'Mozilla/5.0 Jest Test Agent',
    },
  };

  beforeEach(async () => {
    mockUsersService = {
      getProfile: jest.fn().mockResolvedValue({
        id: 'user-controller-test-id',
        showPhoneOnProfile: false,
        showWhatsappOnProfile: false,
      }),
      updateProfile: jest.fn().mockResolvedValue({
        id: 'user-controller-test-id',
        showPhoneOnProfile: true,
        showWhatsappOnProfile: true,
      }),
      getPublicProfile: jest.fn().mockResolvedValue({
        id: 'public-user-id',
        username: 'seller1',
      }),
      linkGoogle: jest.fn().mockResolvedValue({ message: 'تم ربط حساب Google بنجاح' }),
      linkApple: jest.fn().mockResolvedValue({ message: 'تم ربط حساب Apple بنجاح' }),
      unlinkGoogle: jest.fn().mockResolvedValue({
        message: 'تم إلغاء ربط حساب Google بنجاح',
        accessToken: 'new-acc',
        refreshToken: 'new-ref',
      }),
      unlinkApple: jest.fn().mockResolvedValue({
        message: 'تم إلغاء ربط حساب Apple بنجاح',
        accessToken: 'new-acc',
        refreshToken: 'new-ref',
      }),
    };

    mockExpoPushService = {
      registerToken: jest.fn().mockResolvedValue(undefined),
      unregisterToken: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: ExpoPushService, useValue: mockExpoPushService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('delegates linkGoogle to usersService.linkGoogle with sub, dto, ip, and user-agent', async () => {
    const dto = { credential: 'google-token-xyz', currentPassword: 'pwd' };
    const res = await controller.linkGoogle(mockJwtUser, dto, mockReq);

    expect(res).toEqual({ message: 'تم ربط حساب Google بنجاح' });
    expect(mockUsersService.linkGoogle).toHaveBeenCalledWith(
      'user-controller-test-id',
      dto,
      '192.168.1.100',
      'Mozilla/5.0 Jest Test Agent',
    );
  });

  it('delegates linkApple to usersService.linkApple with sub, dto, ip, and user-agent', async () => {
    const dto = { identityToken: 'apple-token-xyz', nonce: 'nonce-123', currentPassword: 'pwd' };
    const res = await controller.linkApple(mockJwtUser, dto, mockReq);

    expect(res).toEqual({ message: 'تم ربط حساب Apple بنجاح' });
    expect(mockUsersService.linkApple).toHaveBeenCalledWith(
      'user-controller-test-id',
      dto,
      '192.168.1.100',
      'Mozilla/5.0 Jest Test Agent',
    );
  });

  it('delegates unlinkGoogle to usersService.unlinkGoogle with sub, dto, ip, and user-agent', async () => {
    const dto = { currentPassword: 'pwd' };
    const res = await controller.unlinkGoogle(mockJwtUser, dto, mockReq);

    expect(res).toEqual({
      message: 'تم إلغاء ربط حساب Google بنجاح',
      accessToken: 'new-acc',
      refreshToken: 'new-ref',
    });
    expect(mockUsersService.unlinkGoogle).toHaveBeenCalledWith(
      'user-controller-test-id',
      dto,
      '192.168.1.100',
      'Mozilla/5.0 Jest Test Agent',
    );
  });

  it('delegates unlinkApple to usersService.unlinkApple with sub, dto, ip, and user-agent', async () => {
    const dto = { currentPassword: 'pwd' };
    const res = await controller.unlinkApple(mockJwtUser, dto, mockReq);

    expect(res).toEqual({
      message: 'تم إلغاء ربط حساب Apple بنجاح',
      accessToken: 'new-acc',
      refreshToken: 'new-ref',
    });
    expect(mockUsersService.unlinkApple).toHaveBeenCalledWith(
      'user-controller-test-id',
      dto,
      '192.168.1.100',
      'Mozilla/5.0 Jest Test Agent',
    );
  });

  it('updateProfile passes authenticated user.sub (owner-only) and toggle DTO to usersService.updateProfile', async () => {
    const dto = { showPhoneOnProfile: true, showWhatsappOnProfile: true };
    const res = await controller.updateProfile(mockJwtUser, dto as any);

    expect(mockUsersService.updateProfile).toHaveBeenCalledWith('user-controller-test-id', dto);
    expect(res).toEqual({
      id: 'user-controller-test-id',
      showPhoneOnProfile: true,
      showWhatsappOnProfile: true,
    });
  });

  it('getPublicProfile is decorated with @ExposeProfileContact() so opted-in phone and whatsapp are not stripped by SanitizeInterceptor', () => {
    const metadata = Reflect.getMetadata(
      'exposeProfileContact',
      UsersController.prototype.getPublicProfile,
    );
    expect(metadata).toBe(true);
  });

  it('unregisterPushToken delegates to expoPushService.unregisterToken with optional token and returns success', async () => {
    const resAll = await controller.unregisterPushToken(mockJwtUser, undefined);
    expect(resAll).toEqual({ success: true });
    expect(mockExpoPushService.unregisterToken).toHaveBeenCalledWith('user-controller-test-id', undefined);

    const resOne = await controller.unregisterPushToken(mockJwtUser, {
      token: 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]',
    });
    expect(resOne).toEqual({ success: true });
    expect(mockExpoPushService.unregisterToken).toHaveBeenCalledWith(
      'user-controller-test-id',
      'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]',
    );
  });
});
