import { Test, TestingModule } from '@nestjs/testing';
import { UserStatusVisibilityListener } from './user-status-visibility.listener';
import { OwnerContentVisibilityService } from '../services/owner-content-visibility.service';
import { UserStatusChangedPayload } from '../events/user-status.events';

describe('UserStatusVisibilityListener', () => {
  let listener: UserStatusVisibilityListener;
  let mockVisibilityService: {
    hideAllForUser: jest.Mock;
    restoreAllForUser: jest.Mock;
  };

  beforeEach(async () => {
    mockVisibilityService = {
      hideAllForUser: jest.fn().mockResolvedValue({ totalAffected: 3 }),
      restoreAllForUser: jest.fn().mockResolvedValue({ totalAffected: 3 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserStatusVisibilityListener,
        {
          provide: OwnerContentVisibilityService,
          useValue: mockVisibilityService,
        },
      ],
    }).compile();

    listener = module.get<UserStatusVisibilityListener>(UserStatusVisibilityListener);
  });

  it('should ignore event when previousStatus === status', async () => {
    const payload: UserStatusChangedPayload = {
      userId: 'u-1',
      previousStatus: 'ACTIVE',
      status: 'ACTIVE',
      suspendedUntil: null,
      at: new Date(),
    };

    await listener.handleUserStatusChanged(payload);

    expect(mockVisibilityService.restoreAllForUser).not.toHaveBeenCalled();
    expect(mockVisibilityService.hideAllForUser).not.toHaveBeenCalled();
  });

  it('should call restoreAllForUser when status === ACTIVE', async () => {
    const payload: UserStatusChangedPayload = {
      userId: 'u-1',
      previousStatus: 'SUSPENDED',
      status: 'ACTIVE',
      suspendedUntil: null,
      at: new Date(),
    };

    await listener.handleUserStatusChanged(payload);

    expect(mockVisibilityService.restoreAllForUser).toHaveBeenCalledWith('u-1');
    expect(mockVisibilityService.hideAllForUser).not.toHaveBeenCalled();
  });

  it('should call hideAllForUser when status === BANNED', async () => {
    const payload: UserStatusChangedPayload = {
      userId: 'u-1',
      previousStatus: 'ACTIVE',
      status: 'BANNED',
      suspendedUntil: null,
      at: new Date(),
    };

    await listener.handleUserStatusChanged(payload);

    expect(mockVisibilityService.hideAllForUser).toHaveBeenCalledWith('u-1');
    expect(mockVisibilityService.restoreAllForUser).not.toHaveBeenCalled();
  });

  it('should call hideAllForUser when status === SUSPENDED', async () => {
    const payload: UserStatusChangedPayload = {
      userId: 'u-1',
      previousStatus: 'ACTIVE',
      status: 'SUSPENDED',
      suspendedUntil: new Date(),
      at: new Date(),
    };

    await listener.handleUserStatusChanged(payload);

    expect(mockVisibilityService.hideAllForUser).toHaveBeenCalledWith('u-1');
    expect(mockVisibilityService.restoreAllForUser).not.toHaveBeenCalled();
  });

  it('should call hideAllForUser when status === DELETED', async () => {
    const payload: UserStatusChangedPayload = {
      userId: 'u-1',
      previousStatus: 'ACTIVE',
      status: 'DELETED',
      suspendedUntil: null,
      at: new Date(),
    };

    await listener.handleUserStatusChanged(payload);

    expect(mockVisibilityService.hideAllForUser).toHaveBeenCalledWith('u-1');
    expect(mockVisibilityService.restoreAllForUser).not.toHaveBeenCalled();
  });

  it('should catch any error and not throw to caller', async () => {
    mockVisibilityService.hideAllForUser.mockRejectedValue(new Error('DB unreachable'));

    const payload: UserStatusChangedPayload = {
      userId: 'u-1',
      previousStatus: 'ACTIVE',
      status: 'BANNED',
      suspendedUntil: null,
      at: new Date(),
    };

    await expect(listener.handleUserStatusChanged(payload)).resolves.not.toThrow();
  });
});
