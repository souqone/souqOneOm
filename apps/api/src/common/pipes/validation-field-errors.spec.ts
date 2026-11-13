import 'reflect-metadata';
import {
  BadRequestException,
  ConflictException,
  ExecutionContext,
  HttpStatus,
  INestApplication,
  ValidationError,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { GlobalExceptionFilter } from '../filters/http-exception.filter';
import {
  createAppValidationPipe,
  extractPartsFieldErrors,
  sanitizePartsFieldErrors,
} from './validation-field-errors';
import { CreatePartDto } from '../../parts/dto/create-part.dto';
import { UpdatePartDto } from '../../parts/dto/update-part.dto';
import { QueryPartsDto } from '../../parts/dto/query-parts.dto';
import { PartsController } from '../../parts/parts.controller';
import { PartsService } from '../../parts/parts.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { VerifyEmailDto } from '../../auth/dto/verify-email.dto';

function runThroughFilter(exception: unknown): { status: number; body: Record<string, unknown> } {
  const filter = new GlobalExceptionFilter();
  let capturedStatus = 0;
  let capturedBody: Record<string, unknown> = {};

  const mockResponse = {
    status: (code: number) => {
      capturedStatus = code;
      return {
        json: (payload: Record<string, unknown>) => {
          capturedBody = payload;
        },
      };
    },
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => mockResponse,
    }),
  } as any;

  filter.catch(exception, host);
  return { status: capturedStatus, body: capturedBody };
}

describe('Parts Validation fieldErrors (F7)', () => {
  const pipe = createAppValidationPipe([CreatePartDto, UpdatePartDto]);

  async function transformAndCatch(payload: unknown, metatype: any): Promise<BadRequestException> {
    try {
      await pipe.transform(payload, { type: 'body', metatype });
      throw new Error('Expected ValidationPipe to reject invalid payload');
    } catch (err) {
      if (err instanceof BadRequestException) {
        return err;
      }
      throw err;
    }
  }

  describe('1. Error code mapping on real CreatePartDto & UpdatePartDto', () => {
    it('maps omitted required fields on CreatePartDto to REQUIRED without leaking values', async () => {
      const exc = await transformAndCatch({}, CreatePartDto);
      const { status, body } = runThroughFilter(exc);

      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.statusCode).toBe(400);
      expect(body.message).toBe('البيانات المدخلة غير صحيحة');
      expect(typeof body.timestamp).toBe('string');
      expect(body.fieldErrors).toEqual([
        { field: 'title', code: 'REQUIRED' },
        { field: 'description', code: 'REQUIRED' },
        { field: 'partCategory', code: 'REQUIRED' },
        { field: 'price', code: 'REQUIRED' },
        { field: 'governorateId', code: 'REQUIRED' },
        { field: 'wilayaId', code: 'REQUIRED' },
      ]);
    });

    it('maps TOO_SHORT, TOO_LONG, OUT_OF_RANGE, INVALID_CHOICE, and INVALID_FORMAT cleanly', async () => {
      const secretTitle = 'x'.repeat(201);
      const exc = await transformAndCatch(
        {
          title: secretTitle,
          description: 'tiny',
          partCategory: 'SECRET_BAD_CHOICE',
          condition: 'NOT_A_CONDITION',
          price: -50,
          yearFrom: 1850,
          governorateId: 0,
          wilayaId: 1.5,
          isOriginal: 'not-bool',
          compatibleMakes: 'Toyota',
          images: [12345],
          warrantyDuration: 'TEN_YEARS',
          quantity: 'HUGE',
          compatibleVehicleTypes: ['ROCKET'],
        },
        CreatePartDto,
      );

      const { status, body } = runThroughFilter(exc);
      expect(status).toBe(400);
      expect(body.message).toBe('البيانات المدخلة غير صحيحة');

      const fieldErrors = body.fieldErrors as Array<{ field: string; code: string }>;
      expect(fieldErrors).toEqual([
        { field: 'title', code: 'TOO_LONG' },
        { field: 'description', code: 'TOO_SHORT' },
        { field: 'partCategory', code: 'INVALID_CHOICE' },
        { field: 'condition', code: 'INVALID_CHOICE' },
        { field: 'compatibleMakes', code: 'INVALID_FORMAT' },
        { field: 'yearFrom', code: 'OUT_OF_RANGE' },
        { field: 'isOriginal', code: 'INVALID_FORMAT' },
        { field: 'price', code: 'OUT_OF_RANGE' },
        { field: 'governorateId', code: 'OUT_OF_RANGE' },
        { field: 'wilayaId', code: 'INVALID_FORMAT' },
        { field: 'images', code: 'INVALID_FORMAT' },
        { field: 'warrantyDuration', code: 'INVALID_CHOICE' },
        { field: 'quantity', code: 'INVALID_CHOICE' },
        { field: 'compatibleVehicleTypes', code: 'INVALID_CHOICE' },
      ]);

      // Ensure every entry has strictly ['code', 'field'] and leaks zero submitted values
      const rawJson = JSON.stringify(body);
      expect(rawJson).not.toContain('SECRET_BAD_CHOICE');
      expect(rawJson).not.toContain('NOT_A_CONDITION');
      expect(rawJson).not.toContain('TEN_YEARS');
      expect(rawJson).not.toContain('ROCKET');
      expect(rawJson).not.toContain('xxxxxxx');
      for (const entry of fieldErrors) {
        expect(Object.keys(entry).sort()).toEqual(['code', 'field']);
      }
    });

    it('maps wrong-type string fields (e.g. title: 123, price: "abc") to INVALID_FORMAT instead of TOO_SHORT/OUT_OF_RANGE', async () => {
      const exc = await transformAndCatch(
        {
          title: 12345,
          description: 999,
          partCategory: 'ENGINE',
          price: 'not-a-number',
          governorateId: 'bad-int',
          wilayaId: 1,
        },
        CreatePartDto,
      );

      const { body } = runThroughFilter(exc);
      expect(body.fieldErrors).toEqual([
        { field: 'title', code: 'INVALID_FORMAT' },
        { field: 'description', code: 'INVALID_FORMAT' },
        { field: 'price', code: 'INVALID_FORMAT' },
        { field: 'governorateId', code: 'INVALID_FORMAT' },
      ]);
    });

    it('maps UpdatePartDto title TOO_SHORT, version OUT_OF_RANGE/INVALID_FORMAT, and preserves Arabic version error message', async () => {
      const exc = await transformAndCatch(
        {
          title: 'ab',
          version: 'abc',
        },
        UpdatePartDto,
      );

      const { status, body } = runThroughFilter(exc);
      expect(status).toBe(400);
      expect(body.message).toBe('رقم النسخة يجب أن يكون رقماً صحيحاً');
      expect(body.fieldErrors).toEqual([
        { field: 'version', code: 'INVALID_FORMAT' },
        { field: 'title', code: 'TOO_SHORT' },
      ]);

      const excZeroVersion = await transformAndCatch({ version: 0 }, UpdatePartDto);
      const zeroFiltered = runThroughFilter(excZeroVersion);
      expect(zeroFiltered.body.fieldErrors).toEqual([{ field: 'version', code: 'OUT_OF_RANGE' }]);
    });
  });

  describe('2. Allowlist enforcement & forbidNonWhitelisted omission', () => {
    it('omits unknown forbidNonWhitelisted property completely when it is the only failure', async () => {
      const exc = await transformAndCatch(
        {
          secretAdminFlag: true,
          title: 'Valid Part Title',
          description: 'Valid long enough part description text',
          partCategory: 'ENGINE',
          price: 15,
          governorateId: 1,
          wilayaId: 1,
        },
        CreatePartDto,
      );

      const { status, body } = runThroughFilter(exc);
      expect(status).toBe(400);
      expect(body.message).toBe('البيانات المدخلة غير صحيحة');
      expect(body).not.toHaveProperty('fieldErrors');
      expect(JSON.stringify(body)).not.toContain('secretAdminFlag');
    });

    it('emits only allowlisted errors when combined with unknown forbidNonWhitelisted properties', async () => {
      const exc = await transformAndCatch(
        {
          unknownInjectedKey: 'SECRET_TOKEN_XYZ',
          title: 'ab',
        },
        UpdatePartDto,
      );

      const { body } = runThroughFilter(exc);
      expect(body.fieldErrors).toEqual([{ field: 'title', code: 'TOO_SHORT' }]);
      expect(JSON.stringify(body)).not.toContain('unknownInjectedKey');
      expect(JSON.stringify(body)).not.toContain('SECRET_TOKEN_XYZ');
    });

    it('excludes deprecated/unrelated fields (listingType, contactPhone, whatsapp) from fieldErrors', () => {
      const syntheticErrors: ValidationError[] = [
        { property: 'listingType', constraints: { isEnum: 'listingType invalid' } } as ValidationError,
        { property: 'contactPhone', constraints: { isString: 'contactPhone invalid' } } as ValidationError,
        { property: 'whatsapp', constraints: { isString: 'whatsapp invalid' } } as ValidationError,
        { property: 'price', constraints: { min: 'price must not be less than 0' } } as ValidationError,
      ];

      expect(extractPartsFieldErrors(syntheticErrors)).toEqual([
        { field: 'price', code: 'OUT_OF_RANGE' },
      ]);
    });
  });

  describe('3. Nested/repeated flattening & deterministic ordering', () => {
    it('flattens repeated/nested children under an allowlisted field and deduplicates deterministically', () => {
      const nestedErrors: ValidationError[] = [
        {
          property: 'images',
          children: [
            { property: '0', constraints: { isString: 'must be string' } } as ValidationError,
            { property: '1', constraints: { isString: 'must be string' } } as ValidationError,
          ],
        } as ValidationError,
        {
          property: '',
          children: [
            { property: 'title', constraints: { minLength: 'too short' } } as ValidationError,
            { property: 'title', constraints: { minLength: 'too short duplicate' } } as ValidationError,
          ],
        } as ValidationError,
        {
          property: 'unknownParent',
          children: [
            { property: 'title', constraints: { minLength: 'must ignore under unknown parent' } } as ValidationError,
          ],
        } as ValidationError,
      ];

      expect(extractPartsFieldErrors(nestedErrors)).toEqual([
        { field: 'images', code: 'INVALID_FORMAT' },
        { field: 'title', code: 'TOO_SHORT' },
      ]);
    });

    it('produces deterministic ordering across identical repeated runs', async () => {
      const run1 = runThroughFilter(await transformAndCatch({ price: -1, title: 'x' }, UpdatePartDto));
      const run2 = runThroughFilter(await transformAndCatch({ price: -1, title: 'x' }, UpdatePartDto));
      expect(run1.body.fieldErrors).toEqual(run2.body.fieldErrors);
    });
  });

  describe('4. Non-Parts DTOs, non-validation 400s, and filter sanitization', () => {
    it('does NOT emit fieldErrors for non-Parts DTOs (VerifyEmailDto, QueryPartsDto)', async () => {
      const verifyExc = await transformAndCatch({ code: 'abc' }, VerifyEmailDto);
      expect((verifyExc.getResponse() as any).fieldErrors).toBeUndefined();
      const verifyFiltered = runThroughFilter(verifyExc);
      expect(verifyFiltered.status).toBe(400);
      expect(verifyFiltered.body).not.toHaveProperty('fieldErrors');

      const queryExc = await transformAndCatch({ page: 'not-num' }, QueryPartsDto);
      expect((queryExc.getResponse() as any).fieldErrors).toBeUndefined();
      const queryFiltered = runThroughFilter(queryExc);
      expect(queryFiltered.status).toBe(400);
      expect(queryFiltered.body).not.toHaveProperty('fieldErrors');
    });

    it('preserves non-validation 400 and non-400 exceptions without fieldErrors', () => {
      const manual400 = runThroughFilter(new BadRequestException('خطأ في منطق العمل'));
      expect(manual400.status).toBe(400);
      expect(manual400.body).not.toHaveProperty('fieldErrors');
      expect(manual400.body.message).toBe('خطأ في منطق العمل');

      const conflict = runThroughFilter(
        new ConflictException({
          statusCode: 409,
          code: 'VERSION_CONFLICT',
          message: 'تم تعديل الإعلان من مكان آخر',
          fieldErrors: [{ field: 'version', code: 'INVALID_FORMAT' }],
        }),
      );
      expect(conflict.status).toBe(409);
      expect(conflict.body.code).toBe('VERSION_CONFLICT');
      expect(conflict.body).not.toHaveProperty('fieldErrors');
    });

    it('sanitizes untrusted fieldErrors in GlobalExceptionFilter and omits empty arrays', () => {
      expect(sanitizePartsFieldErrors([])).toBeUndefined();
      expect(sanitizePartsFieldErrors('invalid')).toBeUndefined();
      expect(
        sanitizePartsFieldErrors([
          { field: 'contactPhone', code: 'REQUIRED' },
          { field: 'price', code: 'UNKNOWN_CODE' },
          { field: 'price', code: 'OUT_OF_RANGE', value: -5, constraints: { min: 'bad' } },
          { field: 'price', code: 'OUT_OF_RANGE' },
        ]),
      ).toEqual([{ field: 'price', code: 'OUT_OF_RANGE' }]);
    });
  });

  describe('5. HTTP integration with PartsController + ValidationPipe + GlobalExceptionFilter', () => {
    let app: INestApplication;
    const mockPartsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      myParts: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [PartsController],
        providers: [{ provide: PartsService, useValue: mockPartsService }],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: (ctx: ExecutionContext) => {
            const req = ctx.switchToHttp().getRequest();
            req.user = { sub: 'user-1', role: 'USER' };
            return true;
          },
        })
        .compile();

      app = moduleRef.createNestApplication();
      app.useGlobalPipes(createAppValidationPipe([CreatePartDto, UpdatePartDto]));
      app.useGlobalFilters(new GlobalExceptionFilter());
      await app.init();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    afterAll(async () => {
      await app.close();
    });

    it('POST /parts returns structured fieldErrors alongside Arabic message on invalid CreatePartDto', async () => {
      const res = await request(app.getHttpServer())
        .post('/parts')
        .send({
          title: 'ab',
          description: 'short',
          partCategory: 'INVALID_ENUM_VAL',
          price: -10,
          governorateId: 1,
          wilayaId: 0,
        })
        .expect(400);

      expect(mockPartsService.create).not.toHaveBeenCalled();
      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBe('البيانات المدخلة غير صحيحة');
      expect(typeof res.body.timestamp).toBe('string');
      expect(res.body.fieldErrors).toEqual([
        { field: 'title', code: 'TOO_SHORT' },
        { field: 'description', code: 'TOO_SHORT' },
        { field: 'partCategory', code: 'INVALID_CHOICE' },
        { field: 'price', code: 'OUT_OF_RANGE' },
        { field: 'wilayaId', code: 'OUT_OF_RANGE' },
      ]);
      expect(JSON.stringify(res.body)).not.toContain('INVALID_ENUM_VAL');
    });

    it('PATCH /parts/:id returns structured fieldErrors + preserves Arabic version message', async () => {
      const res = await request(app.getHttpServer())
        .patch('/parts/part-123')
        .send({
          title: 'x',
          price: -5,
          version: 'bad-ver',
        })
        .expect(400);

      expect(mockPartsService.update).not.toHaveBeenCalled();
      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBe('رقم النسخة يجب أن يكون رقماً صحيحاً');
      expect(res.body.fieldErrors).toEqual([
        { field: 'version', code: 'INVALID_FORMAT' },
        { field: 'title', code: 'TOO_SHORT' },
        { field: 'price', code: 'OUT_OF_RANGE' },
      ]);
    });

    it('POST /parts with only unknown forbidNonWhitelisted key omits fieldErrors', async () => {
      const res = await request(app.getHttpServer())
        .post('/parts')
        .send({
          title: 'Valid Part Title',
          description: 'Valid description with more than ten chars',
          partCategory: 'ENGINE',
          price: 25,
          governorateId: 1,
          wilayaId: 1,
          maliciousExtra: 'SENSITIVE_PAYLOAD',
        })
        .expect(400);

      expect(mockPartsService.create).not.toHaveBeenCalled();
      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBe('البيانات المدخلة غير صحيحة');
      expect(res.body).not.toHaveProperty('fieldErrors');
      expect(JSON.stringify(res.body)).not.toContain('maliciousExtra');
      expect(JSON.stringify(res.body)).not.toContain('SENSITIVE_PAYLOAD');
    });
  });
});
