import {
  BadRequestException,
  HttpStatus,
  ValidationError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { CreatePartDto } from '../../parts/dto/create-part.dto';
import { UpdatePartDto } from '../../parts/dto/update-part.dto';
import { CreateServiceDto } from '../../services/dto/create-service.dto';
import { UpdateServiceDto } from '../../services/dto/update-service.dto';
import { CreateEquipmentListingDto } from '../../equipment/dto/create-equipment-listing.dto';
import { UpdateEquipmentListingDto } from '../../equipment/dto/update-equipment-listing.dto';
import { CreateBusListingDto } from '../../buses/dto/create-bus-listing.dto';
import { UpdateBusListingDto } from '../../buses/dto/update-bus-listing.dto';
import { CreateOperatorListingDto } from '../../operators/dto/create-operator-listing.dto';
import { UpdateOperatorListingDto } from '../../operators/dto/update-operator-listing.dto';
import { CreateListingDto } from '../../listings/dto/create-listing.dto';
import { UpdateListingDto } from '../../listings/dto/update-listing.dto';
import { ChangePasswordDto } from '../../users/dto/change-password.dto';
import { UpdateProfileDto } from '../../users/dto/update-profile.dto';

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

export type DtoConstructor = abstract new (...args: never[]) => object;

export interface DtoAllowlistEntry {
  dto: DtoConstructor;
  allowedFields: ReadonlySet<string>;
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

// Services DTO allowlist (excludes deprecated contactPhone, whatsapp)
export const SERVICES_ALLOWED_FIELDS: ReadonlySet<string> = new Set<string>([
  'title',
  'description',
  'serviceType',
  'providerType',
  'providerName',
  'specializations',
  'priceFrom',
  'priceTo',
  'currency',
  'isHomeService',
  'workingHoursOpen',
  'workingHoursClose',
  'workingDays',
  'governorateId',
  'wilayaId',
  'address',
  'latitude',
  'longitude',
  'whatsappEnabled',
  'website',
  'images',
  'version',
]);

// Equipment DTO allowlist (excludes deprecated contactPhone, whatsapp)
export const EQUIPMENT_ALLOWED_FIELDS: ReadonlySet<string> = new Set<string>([
  'title',
  'description',
  'equipmentType',
  'listingType',
  'make',
  'model',
  'year',
  'condition',
  'capacity',
  'power',
  'weight',
  'hoursUsed',
  'features',
  'price',
  'dailyPrice',
  'monthlyPrice',
  'currency',
  'isPriceNegotiable',
  'withOperator',
  'deliveryAvailable',
  'budgetMin',
  'budgetMax',
  'rentalDuration',
  'startDate',
  'endDate',
  'quantity',
  'siteDetails',
  'governorateId',
  'wilayaId',
  'latitude',
  'longitude',
  'whatsappEnabled',
  'images',
  'status',
  'version',
]);

// Buses DTO allowlist (excludes deprecated contactPhone, whatsapp)
export const BUSES_ALLOWED_FIELDS: ReadonlySet<string> = new Set<string>([
  'title',
  'description',
  'busListingType',
  'busType',
  'make',
  'model',
  'manufacturerId',
  'modelId',
  'year',
  'capacity',
  'mileage',
  'fuelType',
  'transmission',
  'condition',
  'features',
  'plateNumber',
  'price',
  'currency',
  'isPriceNegotiable',
  'contractType',
  'contractClient',
  'contractMonthly',
  'contractDuration',
  'contractExpiry',
  'dailyPrice',
  'monthlyPrice',
  'withDriver',
  'governorateId',
  'wilayaId',
  'latitude',
  'longitude',
  'whatsappEnabled',
  'status',
  'version',
]);

// Operators DTO allowlist (excludes deprecated contactPhone, whatsapp)
export const OPERATORS_ALLOWED_FIELDS: ReadonlySet<string> = new Set<string>([
  'title',
  'description',
  'operatorType',
  'specializations',
  'experienceYears',
  'equipmentTypes',
  'certifications',
  'dailyRate',
  'hourlyRate',
  'currency',
  'isPriceNegotiable',
  'governorateId',
  'wilayaId',
  'latitude',
  'longitude',
  'profileImageUrl',
  'whatsappEnabled',
]);

// Cars / General Listings DTO allowlist (excludes deprecated contactPhone, whatsapp)
export const LISTINGS_ALLOWED_FIELDS: ReadonlySet<string> = new Set<string>([
  'title',
  'description',
  'year',
  'price',
  'mileage',
  'fuelType',
  'transmission',
  'bodyType',
  'exteriorColor',
  'interior',
  'engineSize',
  'horsepower',
  'doors',
  'seats',
  'driveType',
  'features',
  'currency',
  'isPriceNegotiable',
  'condition',
  'listingType',
  'dailyPrice',
  'monthlyPrice',
  'withDriver',
  'depositAmount',
  'minRentalDays',
  'kmLimitPerDay',
  'cancellationPolicy',
  'deliveryAvailable',
  'insuranceIncluded',
  'whatsappEnabled',
  'governorateId',
  'wilayaId',
  'latitude',
  'longitude',
  'brandId',
  'carModelId',
  'carTrimId',
  'images',
  'version',
]);

export const CHANGE_PASSWORD_ALLOWED_FIELDS: ReadonlySet<string> = new Set<string>([
  'currentPassword',
  'newPassword',
]);

// User Profile DTO allowlist (excludes role, email, passwordHash, isVerified, isBanned, isSuspended)
export const USERS_PROFILE_ALLOWED_FIELDS: ReadonlySet<string> = new Set<string>([
  'displayName',
  'bio',
  'phone',
  'currentPassword',
  'country',
  'governorateId',
  'wilayaId',
  'latitude',
  'longitude',
  'avatarUrl',
]);

export const ALL_STRUCTURED_VALIDATION_DTOS: ReadonlyArray<DtoAllowlistEntry> = [
  { dto: CreatePartDto, allowedFields: PARTS_ALLOWED_FIELDS },
  { dto: UpdatePartDto, allowedFields: PARTS_ALLOWED_FIELDS },
  { dto: CreateServiceDto, allowedFields: SERVICES_ALLOWED_FIELDS },
  { dto: UpdateServiceDto, allowedFields: SERVICES_ALLOWED_FIELDS },
  { dto: CreateEquipmentListingDto, allowedFields: EQUIPMENT_ALLOWED_FIELDS },
  { dto: UpdateEquipmentListingDto, allowedFields: EQUIPMENT_ALLOWED_FIELDS },
  { dto: CreateBusListingDto, allowedFields: BUSES_ALLOWED_FIELDS },
  { dto: UpdateBusListingDto, allowedFields: BUSES_ALLOWED_FIELDS },
  { dto: CreateOperatorListingDto, allowedFields: OPERATORS_ALLOWED_FIELDS },
  { dto: UpdateOperatorListingDto, allowedFields: OPERATORS_ALLOWED_FIELDS },
  { dto: CreateListingDto, allowedFields: LISTINGS_ALLOWED_FIELDS },
  { dto: UpdateListingDto, allowedFields: LISTINGS_ALLOWED_FIELDS },
  { dto: ChangePasswordDto, allowedFields: CHANGE_PASSWORD_ALLOWED_FIELDS },
  { dto: UpdateProfileDto, allowedFields: USERS_PROFILE_ALLOWED_FIELDS },
];

const DEFAULT_DTO_ALLOWLIST_MAP: ReadonlyMap<DtoConstructor, ReadonlySet<string>> = new Map(
  ALL_STRUCTURED_VALIDATION_DTOS.map((entry) => [entry.dto, entry.allowedFields]),
);

export const ALL_ALLOWED_FIELD_ERROR_FIELDS: ReadonlySet<string> = new Set<string>([
  ...PARTS_ALLOWED_FIELDS,
  ...SERVICES_ALLOWED_FIELDS,
  ...EQUIPMENT_ALLOWED_FIELDS,
  ...BUSES_ALLOWED_FIELDS,
  ...OPERATORS_ALLOWED_FIELDS,
  ...LISTINGS_ALLOWED_FIELDS,
  ...CHANGE_PASSWORD_ALLOWED_FIELDS,
  ...USERS_PROFILE_ALLOWED_FIELDS,
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
  'isLatitude',
  'isLongitude',
  'isValidPhone',
]);
const CHOICE_CONSTRAINT_KEYS = new Set(['isEnum', 'isIn']);
const TOO_SHORT_CONSTRAINT_KEYS = new Set(['minLength', 'arrayMinSize']);
const TOO_LONG_CONSTRAINT_KEYS = new Set(['maxLength', 'arrayMaxSize', 'maxBytes']);
const RANGE_CONSTRAINT_KEYS = new Set([
  'min',
  'max',
  'isPositive',
  'isNegative',
  'isGreaterThanOrEqualTo',
]);

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
  if (constraintKeys.some((key) => TOO_SHORT_CONSTRAINT_KEYS.has(key))) {
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

function collectAllowedFieldErrors(
  node: ValidationError,
  allowedFields: ReadonlySet<string>,
  result: FieldError[],
  seen: Set<string>,
  ancestorAllowedField?: string,
): void {
  const pushUnique = (field: string, code: FieldErrorCode) => {
    if (!allowedFields.has(field) || !ALLOWED_FIELD_ERROR_CODES.has(code)) {
      return;
    }
    const dedupKey = `${field}:${code}`;
    if (seen.has(dedupKey)) {
      return;
    }
    seen.add(dedupKey);
    result.push({ field, code });
  };

  const prop = typeof node.property === 'string' ? node.property : '';
  const isSelfAllowed = allowedFields.has(prop);
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
        collectAllowedFieldErrors(child, allowedFields, result, seen, nextAncestor);
      }
    }
  }
}

export function extractPartsFieldErrors(errors: ValidationError[]): FieldError[] {
  const result: FieldError[] = [];
  const seen = new Set<string>();
  for (const error of errors) {
    collectAllowedFieldErrors(error, PARTS_ALLOWED_FIELDS, result, seen);
  }
  return result;
}

function toDtoAllowlistMap(
  dtoAllowlist: ReadonlyMap<DtoConstructor, ReadonlySet<string>> | ReadonlyArray<DtoConstructor | DtoAllowlistEntry>,
): Map<DtoConstructor, ReadonlySet<string>> {
  if (dtoAllowlist instanceof Map) {
    return new Map(dtoAllowlist as ReadonlyMap<DtoConstructor, ReadonlySet<string>>);
  }
  const map = new Map<DtoConstructor, ReadonlySet<string>>();
  for (const item of dtoAllowlist as ReadonlyArray<DtoConstructor | DtoAllowlistEntry>) {
    if (typeof item === 'function') {
      map.set(item, DEFAULT_DTO_ALLOWLIST_MAP.get(item) ?? PARTS_ALLOWED_FIELDS);
    } else if (item && typeof item === 'object' && item.dto) {
      map.set(item.dto, item.allowedFields);
    }
  }
  return map;
}

function findAllowedFieldsForError(
  error: ValidationError,
  allowlistMap: ReadonlyMap<DtoConstructor, ReadonlySet<string>>,
): ReadonlySet<string> | undefined {
  const target = error.target as { constructor?: unknown } | undefined;
  if (!target) {
    return undefined;
  }
  const exact = allowlistMap.get(target.constructor as DtoConstructor);
  if (exact) {
    return exact;
  }
  for (const [dtoCtor, allowedFields] of allowlistMap.entries()) {
    if (target instanceof dtoCtor) {
      return allowedFields;
    }
  }
  return undefined;
}

export function extractDtoFieldErrors(
  errors: ValidationError[],
  dtoAllowlist:
    | ReadonlyMap<DtoConstructor, ReadonlySet<string>>
    | ReadonlyArray<DtoAllowlistEntry> = ALL_STRUCTURED_VALIDATION_DTOS,
): FieldError[] {
  const allowlistMap = toDtoAllowlistMap(dtoAllowlist);
  const result: FieldError[] = [];
  const seen = new Set<string>();

  for (const error of errors) {
    const allowedFields = findAllowedFieldsForError(error, allowlistMap);
    if (!allowedFields) {
      continue;
    }
    collectAllowedFieldErrors(error, allowedFields, result, seen);
  }

  return result;
}

export function sanitizeAllowedFieldErrors(
  raw: unknown,
  allowedFields: ReadonlySet<string>,
): FieldError[] | undefined {
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
      allowedFields.has(record.field) &&
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

export function sanitizePartsFieldErrors(raw: unknown): FieldError[] | undefined {
  return sanitizeAllowedFieldErrors(raw, PARTS_ALLOWED_FIELDS);
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

export function createStructuredValidationExceptionFactory(
  dtoSpecs: ReadonlyArray<DtoConstructor | DtoAllowlistEntry> = ALL_STRUCTURED_VALIDATION_DTOS,
): (validationErrors?: ValidationError[]) => BadRequestException {
  const allowlistMap = toDtoAllowlistMap(dtoSpecs);

  return (validationErrors: ValidationError[] = []) => {
    const messages = flattenValidationMessages(validationErrors);
    const fieldErrors = extractDtoFieldErrors(validationErrors, allowlistMap);

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

export function createPartsValidationExceptionFactory(
  partsDtos: ReadonlyArray<DtoConstructor>,
): (validationErrors?: ValidationError[]) => BadRequestException {
  return createStructuredValidationExceptionFactory(partsDtos);
}

export function createAppValidationPipe(
  dtoSpecs: ReadonlyArray<DtoConstructor | DtoAllowlistEntry> = ALL_STRUCTURED_VALIDATION_DTOS,
  overrides?: ValidationPipeOptions,
): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    exceptionFactory: createStructuredValidationExceptionFactory(dtoSpecs),
    ...overrides,
  });
}
