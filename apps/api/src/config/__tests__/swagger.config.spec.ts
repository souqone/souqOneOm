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

  const originalSwaggerEnabled = process.env.SWAGGER_ENABLED;

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.SWAGGER_ENABLED = originalSwaggerEnabled;
  });

  it('should NOT mount Swagger by default when SWAGGER_ENABLED is not set', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SWAGGER_ENABLED;

    const mounted = setupSwagger(mockApp as INestApplication);

    expect(mounted).toBe(false);
    expect(SwaggerModule.setup).not.toHaveBeenCalled();
    expect(SwaggerModule.createDocument).not.toHaveBeenCalled();
  });

  it('should NOT mount Swagger when NODE_ENV is production even if SWAGGER_ENABLED=true', () => {
    process.env.NODE_ENV = 'production';
    process.env.SWAGGER_ENABLED = 'true';

    const mounted = setupSwagger(mockApp as INestApplication);

    expect(mounted).toBe(false);
    expect(SwaggerModule.setup).not.toHaveBeenCalled();
    expect(SwaggerModule.createDocument).not.toHaveBeenCalled();
  });

  it('should mount Swagger when SWAGGER_ENABLED=true and NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    process.env.SWAGGER_ENABLED = 'true';

    const mounted = setupSwagger(mockApp as INestApplication);

    expect(mounted).toBe(true);
    expect(SwaggerModule.createDocument).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith('api/docs', mockApp, expect.anything());
    expect(SwaggerModule.setup).toHaveBeenCalledWith('docs', mockApp, expect.anything());
  });
});

