import 'reflect-metadata';
import { validate } from 'class-validator';
import { IsValidPhone } from './phone.validator';

class TestPhoneDto {
  @IsValidPhone()
  phone?: string | null;

  constructor(phone?: string | null) {
    this.phone = phone;
  }
}

describe('IsValidPhone validator', () => {
  it('should pass for undefined, null, or empty string', async () => {
    const dtoUndefined = new TestPhoneDto(undefined);
    const dtoNull = new TestPhoneDto(null);
    const dtoEmpty = new TestPhoneDto('');

    expect(await validate(dtoUndefined)).toHaveLength(0);
    expect(await validate(dtoNull)).toHaveLength(0);
    expect(await validate(dtoEmpty)).toHaveLength(0);
  });

  it('should pass for valid Omani phone numbers', async () => {
    const dto1 = new TestPhoneDto('+96891234567');
    const dto2 = new TestPhoneDto('91234567');
    const dto3 = new TestPhoneDto('71234567');

    expect(await validate(dto1)).toHaveLength(0);
    expect(await validate(dto2)).toHaveLength(0);
    expect(await validate(dto3)).toHaveLength(0);
  });

  it('should pass for valid Egyptian phone numbers', async () => {
    const dto1 = new TestPhoneDto('01012345678');
    const dto2 = new TestPhoneDto('+201012345678');
    const dto3 = new TestPhoneDto('01112345678');

    expect(await validate(dto1)).toHaveLength(0);
    expect(await validate(dto2)).toHaveLength(0);
    expect(await validate(dto3)).toHaveLength(0);
  });

  it('should pass for other valid international numbers supported by lenient normalization', async () => {
    const dto = new TestPhoneDto('+971501234567');
    expect(await validate(dto)).toHaveLength(0);
  });

  it('should fail for invalid phone strings and return default error message', async () => {
    const dtoArray = [
      new TestPhoneDto('abc'),
      new TestPhoneDto('not-a-phone'),
      new TestPhoneDto('12345'),
      new TestPhoneDto('+++'),
    ];

    for (const dto of dtoArray) {
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('phone');
      expect(errors[0].constraints?.isValidPhone).toBe('رقم الهاتف غير صالح');
    }
  });

  it('should fail for non-string values', async () => {
    const dto = new TestPhoneDto(12345678 as any);
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isValidPhone).toBe('رقم الهاتف غير صالح');
  });
});
