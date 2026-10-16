import { GlobalExceptionFilter } from '../http-exception.filter';
import { ArgumentsHost, ConflictException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';

describe('GlobalExceptionFilter - Error Code Support', () => {
  let filter: GlobalExceptionFilter;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockHttpArgumentsHost: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    mockHttpArgumentsHost = jest.fn().mockReturnValue({ getResponse: mockGetResponse });

    mockArgumentsHost = {
      switchToHttp: mockHttpArgumentsHost,
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('includes code when exception response object has valid code format', () => {
    const exception = new ConflictException({
      statusCode: 409,
      code: 'ACCOUNT_LINK_REQUIRED',
      message: 'هذا البريد مسجل بالفعل. يرجى تسجيل الدخول بكلمة المرور لربط حساب Google.',
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      message: 'هذا البريد مسجل بالفعل. يرجى تسجيل الدخول بكلمة المرور لربط حساب Google.',
      timestamp: expect.any(String),
      code: 'ACCOUNT_LINK_REQUIRED',
    });
  });

  it('does NOT include code when exception does not provide code', () => {
    const exception = new NotFoundException('العنصر غير موجود');

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const body = mockJson.mock.calls[0][0];
    expect(body).toEqual({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'العنصر غير موجود',
      timestamp: expect.any(String),
    });
    expect(body.code).toBeUndefined();
  });

  it('does NOT include code when code format is invalid (lowercase, spaces, or wrong length)', () => {
    const invalidCodes = [
      'account_link_required', // lowercase
      'AB', // too short (<3)
      'A'.repeat(65), // too long (>64)
      'ACCOUNT LINK', // contains space
      '123_INVALID', // starts with digit
    ];

    for (const invalidCode of invalidCodes) {
      mockJson.mockClear();
      const exception = new HttpException(
        { statusCode: 400, code: invalidCode, message: 'خطأ تجريبي' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      const body = mockJson.mock.calls[0][0];
      expect(body.code).toBeUndefined();
    }
  });

  it('does NOT include code for non-HttpException unhandled errors', () => {
    const error = new Error('Database connection failed');
    jest.spyOn((filter as any).logger, 'error').mockImplementation(() => {});

    filter.catch(error, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = mockJson.mock.calls[0][0];
    expect(body.statusCode).toBe(500);
    expect(body.code).toBeUndefined();
  });

  describe('suspendedUntil Whitelist Support', () => {
    it('includes valid ISO suspendedUntil when code is ACCOUNT_SUSPENDED', () => {
      const isoDate = '2026-11-01T12:00:00.000Z';
      const exception = new HttpException(
        {
          statusCode: 403,
          code: 'ACCOUNT_SUSPENDED',
          message: 'تم تعليق الحساب مؤقتاً',
          suspendedUntil: isoDate,
        },
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      const body = mockJson.mock.calls[0][0];
      expect(body).toEqual({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'تم تعليق الحساب مؤقتاً',
        timestamp: expect.any(String),
        code: 'ACCOUNT_SUSPENDED',
        suspendedUntil: isoDate,
      });
    });

    it('includes null suspendedUntil when code is ACCOUNT_SUSPENDED and suspendedUntil is null', () => {
      const exception = new HttpException(
        {
          statusCode: 403,
          code: 'ACCOUNT_SUSPENDED',
          message: 'تم تعليق الحساب مؤقتاً',
          suspendedUntil: null,
        },
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      const body = mockJson.mock.calls[0][0];
      expect(body).toEqual({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'تم تعليق الحساب مؤقتاً',
        timestamp: expect.any(String),
        code: 'ACCOUNT_SUSPENDED',
        suspendedUntil: null,
      });
    });

    it('does NOT include suspendedUntil when value is an invalid date string', () => {
      const exception = new HttpException(
        {
          statusCode: 403,
          code: 'ACCOUNT_SUSPENDED',
          message: 'تم تعليق الحساب مؤقتاً',
          suspendedUntil: 'not-a-valid-date',
        },
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockArgumentsHost);

      const body = mockJson.mock.calls[0][0];
      expect(body.code).toBe('ACCOUNT_SUSPENDED');
      expect(body.suspendedUntil).toBeUndefined();
    });

    it('does NOT include suspendedUntil when ACCOUNT_SUSPENDED exception response lacks the field', () => {
      const exception = new HttpException(
        {
          statusCode: 403,
          code: 'ACCOUNT_SUSPENDED',
          message: 'تم تعليق الحساب مؤقتاً',
        },
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockArgumentsHost);

      const body = mockJson.mock.calls[0][0];
      expect(body.code).toBe('ACCOUNT_SUSPENDED');
      expect(body.suspendedUntil).toBeUndefined();
    });

    it('does NOT leak suspendedUntil for other codes (e.g. ACCOUNT_BANNED or ACCOUNT_LINK_REQUIRED)', () => {
      const exception = new HttpException(
        {
          statusCode: 403,
          code: 'ACCOUNT_BANNED',
          message: 'تم حظر الحساب نهائياً',
          suspendedUntil: '2026-11-01T12:00:00.000Z',
        },
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockArgumentsHost);

      const body = mockJson.mock.calls[0][0];
      expect(body.code).toBe('ACCOUNT_BANNED');
      expect(body.suspendedUntil).toBeUndefined();
    });
  });
});
