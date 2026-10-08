import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { setupSwagger } from '../swagger.config';

describe('Swagger Documentation Security (Production Disable)', () => {
  const originalEnv = process.env.NODE_ENV;
  let mockApp: Partial<INestApplication>;

  beforeEach(() => {
    jest.resetModules();
    mockApp = {};
    jest.spyOn(SwaggerModule, 'createDocument').mockReturnValue({} as any);
    jest.spyOn(SwaggerModule, 'setup').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should NOT mount Swagger when NODE_ENV is production (disabled)', () => {
    process.env.NODE_ENV = 'production';

    const mounted = setupSwagger(mockApp as INestApplication);

    expect(mounted).toBe(false);
    expect(SwaggerModule.setup).not.toHaveBeenCalled();
    expect(SwaggerModule.createDocument).not.toHaveBeenCalled();
  });

  it('should mount Swagger when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';

    const mounted = setupSwagger(mockApp as INestApplication);

    expect(mounted).toBe(true);
    expect(SwaggerModule.createDocument).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith('api/docs', mockApp, expect.anything());
    expect(SwaggerModule.setup).toHaveBeenCalledWith('docs', mockApp, expect.anything());
  });
});
