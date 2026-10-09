import { validateProductionEnv, isPlaceholderSecret } from '../env.validator';

describe('Environment Boot Validation (Production Safety)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should detect unrunnable placeholder secrets', () => {
    expect(isPlaceholderSecret('CHANGE_ME_NOT_A_REAL_SECRET')).toBe(true);
    expect(isPlaceholderSecret('change-me')).toBe(true);
    expect(isPlaceholderSecret('your-jwt-secret')).toBe(true);
    expect(isPlaceholderSecret('dev-secret')).toBe(true);
    expect(isPlaceholderSecret('')).toBe(true);
    expect(isPlaceholderSecret(undefined)).toBe(true);
    expect(isPlaceholderSecret('super-secure-production-jwt-secret-key-12345')).toBe(false);
  });

  it('should throw and reject boot in production if JWT_SECRET is a placeholder', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'CHANGE_ME_NOT_A_REAL_SECRET';

    expect(() => validateProductionEnv()).toThrow(
      /JWT_SECRET contains an unrunnable placeholder in production/i,
    );
  });

  it('should throw and reject boot in production if JWT_SECRET is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    expect(() => validateProductionEnv()).toThrow(
      /JWT_SECRET is required in production/i,
    );
  });

  it('should throw and reject boot in production if JWT_REFRESH_SECRET is a placeholder', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'valid-production-jwt-secret-key-32chars';
    process.env.JWT_REFRESH_SECRET = 'CHANGE_ME_NOT_A_REAL_SECRET';

    expect(() => validateProductionEnv()).toThrow(
      /JWT_REFRESH_SECRET contains an unrunnable placeholder in production/i,
    );
  });

  it('should throw and reject boot in production if JWT_SECRET is shorter than 32 characters', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'too-short-secret-under-32';

    expect(() => validateProductionEnv()).toThrow(
      /JWT_SECRET must be at least 32 characters long in production/i,
    );
  });

  it('should throw and reject boot in production if JWT_PREVIOUS_SECRET is a placeholder', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'valid-production-jwt-secret-key-32chars';
    process.env.JWT_PREVIOUS_SECRET = 'CHANGE_ME_NOT_A_REAL_SECRET';

    expect(() => validateProductionEnv()).toThrow(
      /JWT_PREVIOUS_SECRET contains an unrunnable placeholder in production/i,
    );
  });

  it('should throw and reject boot in production if JWT_PREVIOUS_SECRET is shorter than 32 characters', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'valid-production-jwt-secret-key-32chars';
    process.env.JWT_PREVIOUS_SECRET = 'short-prev-secret';

    expect(() => validateProductionEnv()).toThrow(
      /JWT_PREVIOUS_SECRET must be at least 32 characters long in production/i,
    );
  });

  it('should pass validation in production when secrets are valid and not placeholders', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'real-production-secret-with-high-entropy-64bytes';
    process.env.JWT_PREVIOUS_SECRET = 'previous-production-secret-high-entropy-32b';
    process.env.JWT_REFRESH_SECRET = 'real-production-refresh-secret-high-entropy';

    expect(() => validateProductionEnv()).not.toThrow();
  });

  it('should allow booting with placeholders in development mode', () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'CHANGE_ME_NOT_A_REAL_SECRET';
    process.env.JWT_REFRESH_SECRET = 'CHANGE_ME_NOT_A_REAL_SECRET';

    expect(() => validateProductionEnv()).not.toThrow();
  });
});

