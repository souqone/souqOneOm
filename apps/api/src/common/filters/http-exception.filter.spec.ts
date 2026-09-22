import { GlobalExceptionFilter } from './http-exception.filter';
import { ArgumentsHost, BadRequestException, ForbiddenException, HttpStatus, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('GlobalExceptionFilter', () => {
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

  it('normalizes UnauthorizedException to 401 and single Arabic string message', () => {
    filter.catch(new UnauthorizedException(), mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'يجب تسجيل الدخول',
      timestamp: expect.any(String),
    });
  });

  it('normalizes ForbiddenException to 403 and single Arabic string message', () => {
    filter.catch(new ForbiddenException(), mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.FORBIDDEN,
      message: 'غير مسموح لك بهذا الإجراء',
      timestamp: expect.any(String),
    });
  });

  it('preserves deliberate Arabic message in NotFoundException', () => {
    filter.catch(new NotFoundException('الإعلان غير موجود'), mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'الإعلان غير موجود',
      timestamp: expect.any(String),
    });
  });

  it('replaces default English NotFoundException with generic Arabic message', () => {
    filter.catch(new NotFoundException(), mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'العنصر المطلوب غير موجود',
      timestamp: expect.any(String),
    });
  });

  it('normalizes validation errors with Arabic message to single Arabic string', () => {
    const validationException = new BadRequestException({
      message: ['الحد يجب ألا يزيد عن 12', 'الحد يجب أن يكون 1 على الأقل'],
      error: 'Bad Request',
      statusCode: 400,
    });

    filter.catch(validationException, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'الحد يجب ألا يزيد عن 12',
      timestamp: expect.any(String),
    });
  });

  it('normalizes default English validation error array to generic Arabic string', () => {
    const validationException = new BadRequestException({
      message: ['limit must not be greater than 12'],
      error: 'Bad Request',
      statusCode: 400,
    });

    filter.catch(validationException, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'البيانات المدخلة غير صحيحة',
      timestamp: expect.any(String),
    });
  });

  it('maps Prisma P2025 (RecordNotFound) to 404 with Arabic message', () => {
    const exception = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: 'x',
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'العنصر المطلوب غير موجود',
      timestamp: expect.any(String),
    });
  });

  it('maps Prisma P2002 (UniqueConstraint) to 409 with Arabic message', () => {
    const exception = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'x',
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      message: 'يوجد سجل مشابه بالفعل',
      timestamp: expect.any(String),
    });
  });

  it('defaults unhandled exceptions to 500 without leaking technical details', () => {
    const exception = new Error('Sensitive DB connection string: postgres://user:pass@secret:5432');
    const loggerSpy = jest.spyOn((filter as any).logger, 'error').mockImplementation(() => {});

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'حدث خطأ غير متوقع، حاول مرة أخرى لاحقاً',
      timestamp: expect.any(String),
    });
    // Ensure raw technical error is NOT in response json
    const jsonArg = mockJson.mock.calls[0][0];
    expect(jsonArg).not.toHaveProperty('error');
    expect(jsonArg.message).not.toContain('Sensitive DB');
    expect(loggerSpy).toHaveBeenCalled();
  });

  it('guarantees response shape has strictly statusCode, message, and timestamp', () => {
    filter.catch(new UnauthorizedException(), mockArgumentsHost);

    const responseBody = mockJson.mock.calls[0][0];
    expect(Object.keys(responseBody).sort()).toEqual(['message', 'statusCode', 'timestamp']);
    expect(typeof responseBody.message).toBe('string');
    expect(typeof responseBody.statusCode).toBe('number');
  });
});
