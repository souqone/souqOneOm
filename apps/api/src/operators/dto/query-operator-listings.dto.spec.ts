import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryOperatorListingsDto } from './query-operator-listings.dto';

describe('QueryOperatorListingsDto validation', () => {
  it('should accept valid sortBy and sortOrder values', async () => {
    const validFields = ['createdAt', 'dailyRate', 'hourlyRate', 'experienceYears', 'viewCount'];
    for (const field of validFields) {
      const dto = plainToInstance(QueryOperatorListingsDto, { sortBy: field, sortOrder: 'asc' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should reject invalid sortBy value (e.g. hacked) with validation error', async () => {
    const dto = plainToInstance(QueryOperatorListingsDto, { sortBy: 'hacked' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const sortByError = errors.find((e) => e.property === 'sortBy');
    expect(sortByError).toBeDefined();
  });

  it('should reject invalid sortOrder value with validation error', async () => {
    const dto = plainToInstance(QueryOperatorListingsDto, { sortOrder: 'sideways' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const sortOrderError = errors.find((e) => e.property === 'sortOrder');
    expect(sortOrderError).toBeDefined();
  });
});
