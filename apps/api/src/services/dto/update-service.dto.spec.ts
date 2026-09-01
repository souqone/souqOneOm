import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateServiceDto } from './update-service.dto';

describe('UpdateServiceDto Validation', () => {
  it('should allow valid partial update (e.g. only title or providerName)', async () => {
    const dto = plainToInstance(UpdateServiceDto, { providerName: 'ورشة جديدة' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should allow valid price range in partial update', async () => {
    const dto = plainToInstance(UpdateServiceDto, { priceFrom: 10, priceTo: 20 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject negative priceFrom', async () => {
    const dto = plainToInstance(UpdateServiceDto, { priceFrom: -5 });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'priceFrom');
    expect(error).toBeDefined();
  });

  it('should reject negative priceTo', async () => {
    const dto = plainToInstance(UpdateServiceDto, { priceTo: -5 });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'priceTo');
    expect(error).toBeDefined();
  });

  it('should reject priceTo < priceFrom when both provided', async () => {
    const dto = plainToInstance(UpdateServiceDto, { priceFrom: 30, priceTo: 10 });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'priceTo');
    expect(error).toBeDefined();
    expect(error?.constraints?.isGreaterThanOrEqualTo).toBeDefined();
  });

  it('should reject empty images array if images provided in patch', async () => {
    const dto = plainToInstance(UpdateServiceDto, { images: [] });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'images');
    expect(error).toBeDefined();
    expect(error?.constraints?.arrayMinSize).toBeDefined();
  });
});
