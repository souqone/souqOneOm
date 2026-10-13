import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { normalizePhone } from '../utils/normalize-phone';

/**
 * Validates that an optional phone number string, if provided and non-empty,
 * conforms to the valid E.164-compatible phone format supported by `normalizePhone`.
 */
export function IsValidPhone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'رقم الهاتف غير صالح',
        ...validationOptions,
      },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (value === undefined || value === null || value === '') return true;
          if (typeof value !== 'string') return false;
          return normalizePhone(value) !== null;
        },
      },
    });
  };
}
