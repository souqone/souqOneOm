import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { EquipmentType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { createAppValidationPipe } from '../../common/pipes/validation-field-errors';
import { CreateOperatorListingDto } from './create-operator-listing.dto';
import { UpdateOperatorListingDto } from './update-operator-listing.dto';

const ALL_15_EQUIPMENT_TYPES = Object.values(EquipmentType);

const VALID_CREATE_BASE = {
  title: 'مشغل حفار معتمد في مسقط',
  description: 'خبرة 7 سنوات في تشغيل الحفارات والمعدات الثقيلة في المشاريع الإنشائية.',
  operatorType: 'OPERATOR',
  experienceYears: 7,
  equipmentTypes: ['EXCAVATOR', 'CRANE'],
  certifications: ['رخصة قيادة معدات ثقيلة'],
  dailyRate: 60,
  governorateId: 1,
  wilayaId: 1,
};

describe('OperatorListing DTO equipmentTypes validation (P1-01 / D-319)', () => {
  const pipe = createAppValidationPipe([CreateOperatorListingDto, UpdateOperatorListingDto]);

  it('accepts all 15 Prisma EquipmentType enum codes in CreateOperatorListingDto', async () => {
    expect(ALL_15_EQUIPMENT_TYPES).toHaveLength(15);

    const dto = plainToInstance(CreateOperatorListingDto, {
      ...VALID_CREATE_BASE,
      equipmentTypes: ALL_15_EQUIPMENT_TYPES,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects Arabic equipmentTypes (e.g. ["حفار"]) via validate and throws 400 via ValidationPipe', async () => {
    const dto = plainToInstance(CreateOperatorListingDto, {
      ...VALID_CREATE_BASE,
      equipmentTypes: ['حفار'],
    });
    const errors = await validate(dto);
    const eqError = errors.find((e) => e.property === 'equipmentTypes');
    expect(eqError).toBeDefined();
    expect(eqError?.constraints?.isEnum).toBe('نوع المعدة غير صالح');

    await expect(
      pipe.transform(
        {
          ...VALID_CREATE_BASE,
          equipmentTypes: ['حفار'],
        },
        { type: 'body', metatype: CreateOperatorListingDto },
      ),
    ).rejects.toThrow(BadRequestException);

    try {
      await pipe.transform(
        {
          ...VALID_CREATE_BASE,
          equipmentTypes: ['حفار'],
        },
        { type: 'body', metatype: CreateOperatorListingDto },
      );
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      const response = (err as BadRequestException).getResponse() as {
        fieldErrors?: Array<{ field: string; code: string }>;
      };
      expect(response.fieldErrors).toContainEqual({
        field: 'equipmentTypes',
        code: 'INVALID_CHOICE',
      });
    }
  });

  it('rejects removed client-only strings (جريدر / BOBCAT) in CreateOperatorListingDto', async () => {
    const dto = plainToInstance(CreateOperatorListingDto, {
      ...VALID_CREATE_BASE,
      equipmentTypes: ['جريدر', 'BOBCAT'],
    });
    const errors = await validate(dto);
    const eqError = errors.find((e) => e.property === 'equipmentTypes');
    expect(eqError?.constraints?.isEnum).toBe('نوع المعدة غير صالح');
  });

  it('rejects Arabic equipmentTypes in UpdateOperatorListingDto while allowing omitted or valid enum arrays', async () => {
    const emptyUpdate = plainToInstance(UpdateOperatorListingDto, { title: 'تحديث عنوان المشغل' });
    expect(await validate(emptyUpdate)).toHaveLength(0);

    const validUpdate = plainToInstance(UpdateOperatorListingDto, {
      equipmentTypes: ['SCAFFOLDING', 'WELDING_MACHINE'],
    });
    expect(await validate(validUpdate)).toHaveLength(0);

    const invalidUpdate = plainToInstance(UpdateOperatorListingDto, {
      equipmentTypes: ['حفار'],
    });
    const errors = await validate(invalidUpdate);
    const eqError = errors.find((e) => e.property === 'equipmentTypes');
    expect(eqError).toBeDefined();
    expect(eqError?.constraints?.isEnum).toBe('نوع المعدة غير صالح');

    await expect(
      pipe.transform(
        { equipmentTypes: ['حفار'] },
        { type: 'body', metatype: UpdateOperatorListingDto },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
