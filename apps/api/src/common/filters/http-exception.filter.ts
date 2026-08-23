import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (!(exception instanceof HttpException)) { console.error('Unhandled Exception:', exception); }
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'خطأ داخلي في الخادم';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        message = (res.message as string | string[]) ?? message;
        error = (res.error as string) ?? error;
      }
    } else if (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      typeof (exception as any).code === 'string' &&
      (exception as any).code.startsWith('P')
    ) {
      const code = (exception as any).code;
      if (code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'السجل غير موجود';
        error = 'Not Found';
      } else if (code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'يوجد سجل مشابه بالفعل';
        error = 'Conflict';
      }
    }

    response.status(status).json({
      statusCode: status,
      error,
      message: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
    });
  }
}
