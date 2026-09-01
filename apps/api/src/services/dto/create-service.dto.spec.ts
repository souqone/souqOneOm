import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateServiceDto } from './create-service.dto';
import { ServiceType, ProviderType } from '@prisma/client';

describe('CreateServiceDto Validation', () => {
  const validBasePayload = {
    title: 'خدمة غسيل وتلميع',
    description: 'تنظيف شامل للسيارة من الداخل والخارج',
    serviceType: ServiceType.CLEANING,
    providerType: ProviderType.WORKSHOP,
    providerName: 'مغسلة الخليج',
    priceFrom: 10,
    priceTo: 25,
    governorateId: 1,
    wilayaId: 101,
    images: ['https://example.com/img1.jpg'],
  };

  it('should validate a valid DTO successfully', async () => {
    const dto = plainToInstance(CreateServiceDto, validBasePayload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if priceFrom is missing', async () => {
    const payload = { ...validBasePayload };
    delete (payload as any).priceFrom;
    const dto = plainToInstance(CreateServiceDto, payload);
    const errors = await validate(dto);
    const priceFromError = errors.find((e) => e.property === 'priceFrom');
    expect(priceFromError).toBeDefined();
  });

  it('should fail if priceFrom is negative', async () => {
    const payload = { ...validBasePayload, priceFrom: -5 };
    const dto = plainToInstance(CreateServiceDto, payload);
    const errors = await validate(dto);
    const priceFromError = errors.find((e) => e.property === 'priceFrom');
    expect(priceFromError).toBeDefined();
  });

  it('should succeed if priceTo is omitted (priceTo is optional)', async () => {
    const payload = { ...validBasePayload };
    delete (payload as any).priceTo;
    const dto = plainToInstance(CreateServiceDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should succeed if priceTo is equal to priceFrom', async () => {
    const payload = { ...validBasePayload, priceFrom: 15, priceTo: 15 };
    const dto = plainToInstance(CreateServiceDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if priceTo is less than priceFrom', async () => {
    const payload = { ...validBasePayload, priceFrom: 20, priceTo: 10 };
    const dto = plainToInstance(CreateServiceDto, payload);
    const errors = await validate(dto);
    const priceToError = errors.find((e) => e.property === 'priceTo');
    expect(priceToError).toBeDefined();
    expect(priceToError?.constraints?.isGreaterThanOrEqualTo).toContain('priceTo must be >= priceFrom');
  });

  it('should fail if images is empty', async () => {
    const payload = { ...validBasePayload, images: [] };
    const dto = plainToInstance(CreateServiceDto, payload);
    const errors = await validate(dto);
    const imagesError = errors.find((e) => e.property === 'images');
    expect(imagesError).toBeDefined();
    expect(imagesError?.constraints?.arrayMinSize).toBeDefined();
  });

  it('should fail if images is missing', async () => {
    const payload = { ...validBasePayload };
    delete (payload as any).images;
    const dto = plainToInstance(CreateServiceDto, payload);
    const errors = await validate(dto);
    const imagesError = errors.find((e) => e.property === 'images');
    expect(imagesError).toBeDefined();
  });
});
