import {
  BadRequestException,
  HttpStatus,
  ValidationError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';

export type FieldErrorCode =
  | 'REQUIRED'
  | 'INVALID_FORMAT'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'OUT_OF_RANGE'
  | 'INVALID_CHOICE';

export interface FieldError {
  field: string;
  code: FieldErrorCode;
}

export const ALLOWED_FIELD_ERROR_CODES: ReadonlySet<FieldErrorCode> = new Set<FieldErrorCode>([
  'REQUIRED',
  'INVALID_FORMAT',
  'TOO_SHORT',
  'TOO_LONG',
  'OUT_OF_RANGE',
  'INVALID_CHOICE',
]);

// Strict allowlist for Parts DTO validation errors (explicitly excludes listingType, contactPhone, whatsapp)
export const PARTS_ALLOWED_FIELDS: ReadonlySet<string> = new Set<string>([
  'title',
  'description',
  'partCategory',
  'condition',
  'partNumber',
  'compatibleMakes',
  'compatibleModels',
  'yearFrom',
  'yearTo',
  'isOriginal',
  'price',
  'currency',
  'isPriceNegotiable',
  'governorateId',
  'wilayaId',
  'latitude',
  'longitude',
  'whatsappEnabled',
  'images',
  'hasWarranty',
  'warrantyDuration',
  'quantity',
  'compatibleVehicleTypes',
  'version',
]);

const REQUIRED_CONSTRAINT_KEYS = new Set(['isNotEmpty', 'isDefined', 'arrayNotEmpty']);
const FORMAT_CONSTRAINT_KEYS = new Set([
  'isString',
  'isNumber',
  'isInt',
  'isBoolean',
  'isArray',
  'matches',
  'isEmail',
  'isUrl',
  'isUuid',
  'isDateString',
  'isNumberString',
  'isBooleanString',
]);
const CHOICE_CONSTRAINT_KEYS = new Set(['isEnum', 'isIn']);
const TOO_SHORT_CONSTRAINT_KEYS = new Set(['minLength', 'arrayMinSize']);
const TOO_LONG_CONSTRAINT_KEYS = new Set(['maxLength', 'arrayMaxSize']);
const RANGE_CONSTRAINT_KEYS = new Set(['min', 'max', 'isPositive', 'isNegative']);

export function resolveFieldErrorCode(error: ValidationError): FieldErrorCode | null {
  const constraintKeys = Object.keys(error.constraints ?? {}).filter(
    (key) => key !== 'whitelistValidation',
  );
  if (constraintKeys.length === 0) {
    return null;
  }

  const hasMissingValue =
    Object.prototype.hasOwnProperty.call(error, 'value') &&
    (error.value === undefined || error.value === null);

  if (hasMissingValue || constraintKeys.some((key) => REQUIRED_CONSTRAINT_KEYS.has(key))) {
    return 'REQUIRED';
  }
  if (constraintKeys.some((key) => FORMAT_CONSTRAINT_KEYS.has(key))) {
    return 'INVALID_FORMAT';
  }
  if (constraintKeys.some((key) => CHOICE_CONSTRAINT_KEYS.has(key))) {
    return 'INVALID_CHOICE';
  }
  if (constraintKeys.some((key) => TOO_SHORT_CONSTRAINTS_HAS(key))) {
    return 'TOO_SHORT';
  }
  if (constraintKeys.some((key) => TOO_LONG_CONSTRAINT_KEYS.has(key))) {
    return 'TOO_LONG';
  }
  if (constraintKeys.some((key) => RANGE_CONSTRAINT_KEYS.has(key))) {
    return 'OUT_OF_RANGE';
  }

  return 'INVALID_FORMAT';
}

function TOO_SHORT_CONSTRAINTS_HAS(key: string): boolean {
  return TOO_SHORT_CONSTRAINT_KEYS.has(key);
}

export function extractPartsFieldErrors(errors: ValidationError[]): FieldError[] {
  const result: FieldError[] = [];
  const seen = new Set<string>();

  const pushUnique = (field: string, code: FieldErrorCode) => {
    if (!PARTS_ALLOWED_FIELDS.has(field) || !ALLOWED_FIELD_ERROR_CODES.has(code)) {
      return;
    }
    const dedupKey = `${field}:${code}`;
    if (seen.has(dedupKey)) {
      return;
    }
    seen.add(dedupKey);
    result.push({ field, code });
  };

  const walk = (node: ValidationError, ancestorAllowedField?: string) => {
    const prop = typeof node.property === 'string' ? node.property : '';
    const isSelfAllowed = PARTS_ALLOWED_FIELDS.has(prop);
    const isNumericIndex = /^\d+$/.test(prop);
    const activeField = isSelfAllowed
      ? prop
      : isNumericIndex && ancestorAllowedField
        ? ancestorAllowedField
        : undefined;

    if (node.constraints && activeField) {
      const code = resolveFieldErrorCode(node);
      if (code) {
        pushUnique(activeField, code);
      }
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      if (isSelfAllowed || !prop || (isNumericIndex && ancestorAllowedField)) {
        const nextAncestor = isSelfAllowed ? prop : ancestorAllowedField;
        for (const child of node.children) {
          walk(child, nextAncestor);
        }
      }
    }
  };

  for (const error of errors) {
    walk(error);
  }

  return result;
}

export function sanitizePartsFieldErrors(raw: unknown): FieldError[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) {
    return undefined;
  }

  const sanitized: FieldError[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const record = item as Record<string, unknown>;
    if (
      typeof record.field === 'string' &&
      PARTS_ALLOWED_FIELDS.has(record.field) &&
      typeof record.code === 'string' &&
      ALLOWED_FIELD_ERROR_CODES.has(record.code as FieldErrorCode)
    ) {
      const dedupKey = `${record.field}:${record.code}`;
      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        sanitized.push({
          field: record.field,
          code: record.code as FieldErrorCode,
        });
      }
    }
  }

  return sanitized.length > 0 ? sanitized : undefined;
}

function mapChildrenToMessages(error: ValidationError, parentPath?: string): string[] {
  if (!error.children || error.children.length === 0) {
    return Object.values(error.constraints ?? {});
  }

  const nextParentPath = parentPath ? `${parentPath}.${error.property}` : error.property;
  const messages: string[] = [];

  for (const child of error.children) {
    if (child.children && child.children.length > 0) {
      messages.push(...mapChildrenToMessages(child, nextParentPath));
    }
    if (child.constraints) {
      for (const msg of Object.values(child.constraints)) {
        messages.push(`${nextParentPath}.${msg}`);
      }
    }
  }

  return messages;
}

export function flattenValidationMessages(validationErrors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const error of validationErrors) {
    messages.push(...mapChildrenToMessages(error));
  }
  return messages;
}

export type DtoConstructor = abstract new (...args: never[]) => object;

function matchesAnyTargetDto(
  error: ValidationError,
  targetDtos: ReadonlyArray<DtoConstructor>,
): boolean {
  const target = error.target as { constructor?: unknown } | undefined;
  if (!target) {
    return false;
  }
  return targetDtos.some((dtoCtor) => target instanceof dtoCtor || target.constructor === dtoCtor);
}

export function createPartsValidationExceptionFactory(
  partsDtos: ReadonlyArray<DtoConstructor>,
): (validationErrors?: ValidationError[]) => BadRequestException {
  return (validationErrors: ValidationError[] = []) => {
    const messages = flattenValidationMessages(validationErrors);
    const partsErrors = validationErrors.filter((err) => matchesAnyTargetDto(err, partsDtos));

    if (partsErrors.length === 0) {
      return new BadRequestException(messages);
    }

    const fieldErrors = extractPartsFieldErrors(partsErrors);
    if (fieldErrors.length === 0) {
      return new BadRequestException(messages);
    }

    return new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      message: messages,
      error: 'Bad Request',
      fieldErrors,
    });
  };
}

export function createAppValidationPipe(
  partsDtos: ReadonlyArray<DtoConstructor>,
  overrides?: ValidationPipeOptions,
): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    exceptionFactory: createPartsValidationExceptionFactory(partsDtos),
    ...overrides,
  });
}
