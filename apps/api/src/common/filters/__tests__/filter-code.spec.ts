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
});
