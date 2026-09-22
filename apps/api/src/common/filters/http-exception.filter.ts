import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

const containsArabic = (text: string): boolean => /[\u0600-\u06FF]/.test(text);

const DEFAULT_ARABIC_MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'البيانات المدخلة غير صحيحة',
  [HttpStatus.UNAUTHORIZED]: 'يجب تسجيل الدخول',
  [HttpStatus.FORBIDDEN]: 'غير مسموح لك بهذا الإجراء',
  [HttpStatus.NOT_FOUND]: 'العنصر المطلوب غير موجود',
  [HttpStatus.CONFLICT]: 'يوجد سجل مشابه بالفعل',
  [HttpStatus.TOO_MANY_REQUESTS]: 'تم تجاوز الحد المسموح من الطلبات',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'حدث خطأ غير متوقع، حاول مرة أخرى لاحقاً',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = DEFAULT_ARABIC_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let extractedMessage: string | undefined;

      if (typeof exceptionResponse === 'string') {
        extractedMessage = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        if (typeof res.message === 'string') {
          extractedMessage = res.message;
        } else if (Array.isArray(res.message) && res.message.length > 0) {
          const firstMsg = String(res.message[0]);
          if (containsArabic(firstMsg)) {
            extractedMessage = firstMsg;
          }
        }
      }

      if (extractedMessage && containsArabic(extractedMessage)) {
        message = extractedMessage;
      } else {
        message = DEFAULT_ARABIC_MESSAGES[status] ?? 'طلب غير صالح';
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
        message = 'العنصر المطلوب غير موجود';
      } else if (code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'يوجد سجل مشابه بالفعل';
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = DEFAULT_ARABIC_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR];
      }
    } else {
      const errorStr = exception instanceof Error ? exception.stack || exception.message : String(exception);
      const sanitizedLog = errorStr
        .replace(/(\+?968\d{8}|\b\d{8}\b)/g, '[REDACTED_PHONE]')
        .replace(/(password|token|secret)\s*[:=]\s*["']?[^"'\s,]+/gi, '$1=[REDACTED]');
      this.logger.error(`Unhandled Exception: ${sanitizedLog}`);
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = DEFAULT_ARABIC_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR];
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

export { GlobalExceptionFilter as HttpExceptionFilter };
