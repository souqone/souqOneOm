import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OperatorDeletionStatus } from '@prisma/client';
import { AdminListDeletionRequestsDto } from './admin-list-deletion-requests.dto';

describe('AdminListDeletionRequestsDto validation', () => {
  it('should accept valid query params', async () => {
    const dto = plainToInstance(AdminListDeletionRequestsDto, {
      page: '2',
      limit: '25',
      status: OperatorDeletionStatus.PENDING,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(25);
    expect(dto.status).toBe('PENDING');
  });

  it('should accept empty query params (all optional)', async () => {
    const dto = plainToInstance(AdminListDeletionRequestsDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject malformed non-numeric page string', async () => {
    const dto = plainToInstance(AdminListDeletionRequestsDto, { page: 'abc' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const pageError = errors.find((e) => e.property === 'page');
    expect(pageError).toBeDefined();
  });

  it('should reject page less than 1', async () => {
    const dto = plainToInstance(AdminListDeletionRequestsDto, { page: '0' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const pageError = errors.find((e) => e.property === 'page');
    expect(pageError).toBeDefined();
  });

  it('should reject limit greater than 50', async () => {
    const dto = plainToInstance(AdminListDeletionRequestsDto, { limit: '100' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const limitError = errors.find((e) => e.property === 'limit');
    expect(limitError).toBeDefined();
  });

  it('should reject invalid status enum value', async () => {
    const dto = plainToInstance(AdminListDeletionRequestsDto, { status: 'UNKNOWN_STATUS' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const statusError = errors.find((e) => e.property === 'status');
    expect(statusError).toBeDefined();
  });
});
