import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateListingDto } from './create-listing.dto';
import { UpdateListingDto } from './update-listing.dto';

describe('Listing DTOs - whatsappEnabled validation', () => {
  const validCreatePayload = {
    title: 'تويوتا كامري 2024',
    description: 'سيارة بحالة ممتازة',
    year: 2024,
    price: 12000,
    governorateId: 1,
    wilayaId: 1,
    brandId: 'brand-1',
    carModelId: 'model-1',
  };

  describe('CreateListingDto', () => {
    it('should validate successfully when whatsappEnabled is true', async () => {
      const dto = plainToInstance(CreateListingDto, {
        ...validCreatePayload,
        whatsappEnabled: true,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.whatsappEnabled).toBe(true);
    });

    it('should validate successfully when whatsappEnabled is false', async () => {
      const dto = plainToInstance(CreateListingDto, {
        ...validCreatePayload,
        whatsappEnabled: false,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.whatsappEnabled).toBe(false);
    });

    it('should validate successfully when whatsappEnabled is omitted', async () => {
      const dto = plainToInstance(CreateListingDto, {
        ...validCreatePayload,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.whatsappEnabled).toBeUndefined();
    });

    it('should fail validation when whatsappEnabled is not a boolean', async () => {
      const dto = plainToInstance(CreateListingDto, {
        ...validCreatePayload,
        whatsappEnabled: 'invalid-string',
      });
      const errors = await validate(dto);
      const whatsappError = errors.find((e) => e.property === 'whatsappEnabled');
      expect(whatsappError).toBeDefined();
    });
  });

  describe('UpdateListingDto', () => {
    it('should validate successfully when whatsappEnabled is true', async () => {
      const dto = plainToInstance(UpdateListingDto, {
        version: 1,
        whatsappEnabled: true,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.whatsappEnabled).toBe(true);
    });

    it('should validate successfully when whatsappEnabled is false', async () => {
      const dto = plainToInstance(UpdateListingDto, {
        version: 1,
        whatsappEnabled: false,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.whatsappEnabled).toBe(false);
    });

    it('should validate successfully when whatsappEnabled is omitted', async () => {
      const dto = plainToInstance(UpdateListingDto, {
        version: 1,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.whatsappEnabled).toBeUndefined();
    });

    it('should fail validation when whatsappEnabled is not a boolean', async () => {
      const dto = plainToInstance(UpdateListingDto, {
        version: 1,
        whatsappEnabled: 123,
      });
      const errors = await validate(dto);
      const whatsappError = errors.find((e) => e.property === 'whatsappEnabled');
      expect(whatsappError).toBeDefined();
    });
  });
});
