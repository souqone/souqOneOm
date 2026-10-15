import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';

describe('RolesGuard (Unit Tests)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: any): ExecutionContext => {
    const mockRequest = { user };
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;
  };

  it('allows access when no roles are required (@Roles omitted), even if request.user is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext(undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when required roles list is empty, even if user has no role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

    const context = createMockContext({ sub: 'user-1' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access when roles are required but request.user is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    const context = createMockContext(undefined);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies access when roles are required but user.role is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    const context = createMockContext({ sub: 'user-1' });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies access when user role does not match required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    const context = createMockContext({ sub: 'user-1', role: 'USER' });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('allows access when user role matches required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    const context = createMockContext({ sub: 'admin-1', role: 'ADMIN' });
    expect(guard.canActivate(context)).toBe(true);
  });
});
