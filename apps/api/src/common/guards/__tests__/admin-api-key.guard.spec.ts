import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminApiKeyGuard } from '../admin-api-key.guard';

describe('AdminApiKeyGuard (Timing Safe & Config Enforcement)', () => {
  let guard: AdminApiKeyGuard;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    guard = new AdminApiKeyGuard();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function createMockContext(headers: Record<string, string | undefined>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should throw ForbiddenException if ADMIN_API_KEY is not configured', () => {
    delete process.env.ADMIN_API_KEY;
    const context = createMockContext({ 'x-admin-key': 'some-key' });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Admin access not configured'),
    );
  });

  it('should throw ForbiddenException if x-admin-key header is missing', () => {
    process.env.ADMIN_API_KEY = 'super-secret-admin-key-12345';
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Invalid admin key'),
    );
  });

  it('should throw ForbiddenException safely if key length does not match (without timingSafeEqual throwing)', () => {
    process.env.ADMIN_API_KEY = 'super-secret-admin-key-12345';
    const context = createMockContext({ 'x-admin-key': 'short-key' });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Invalid admin key'),
    );
  });

  it('should throw ForbiddenException if key has same length but wrong characters', () => {
    process.env.ADMIN_API_KEY = 'super-secret-admin-key-12345';
    const wrongKeySameLength = 'x'.repeat('super-secret-admin-key-12345'.length);
    const context = createMockContext({ 'x-admin-key': wrongKeySameLength });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Invalid admin key'),
    );
  });

  it('should return true when x-admin-key exactly matches ADMIN_API_KEY', () => {
    process.env.ADMIN_API_KEY = 'super-secret-admin-key-12345';
    const context = createMockContext({ 'x-admin-key': 'super-secret-admin-key-12345' });

    expect(guard.canActivate(context)).toBe(true);
  });
});
