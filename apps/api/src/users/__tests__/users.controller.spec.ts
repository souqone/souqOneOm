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
});
