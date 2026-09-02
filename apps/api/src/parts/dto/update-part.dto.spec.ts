import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdatePartDto } from './update-part.dto';

describe('UpdatePartDto Validation', () => {
  it('should allow valid partial update (e.g. only price or title)', async () => {
    const dto = plainToInstance(UpdatePartDto, { price: 25 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject negative price', async () => {
    const dto = plainToInstance(UpdatePartDto, { price: -10 });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'price');
    expect(error).toBeDefined();
  });

  it('should reject title shorter than 3 chars', async () => {
    const dto = plainToInstance(UpdatePartDto, { title: 'ab' });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'title');
    expect(error).toBeDefined();
    expect(error?.constraints?.minLength).toBeDefined();
  });

  it('should reject invalid quantity enum value', async () => {
    const dto = plainToInstance(UpdatePartDto, { quantity: 'INVALID_ENUM' });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'quantity');
    expect(error).toBeDefined();
    expect(error?.constraints?.isIn).toBeDefined();
  });

  it('should reject invalid warrantyDuration enum value', async () => {
    const dto = plainToInstance(UpdatePartDto, { warrantyDuration: 'FIVE_YEARS' });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'warrantyDuration');
    expect(error).toBeDefined();
    expect(error?.constraints?.isIn).toBeDefined();
  });
});
