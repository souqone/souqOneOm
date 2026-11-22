import { IsInt, Min, Max, IsString, IsOptional, IsIn } from 'class-validator';
import { ENTITY_TYPES } from '../../common/constants/entity-types.constants';

export const REVIEW_ENTITY_TYPES = [
  ENTITY_TYPES.LISTING,
  ENTITY_TYPES.BUS_LISTING,
  ENTITY_TYPES.EQUIPMENT_LISTING,
  ENTITY_TYPES.OPERATOR_LISTING,
  ENTITY_TYPES.SPARE_PART,
  ENTITY_TYPES.CAR_SERVICE,
  ENTITY_TYPES.USER,
  ENTITY_TYPES.DRIVER_PROFILE,
  ENTITY_TYPES.EMPLOYER_PROFILE,
  ENTITY_TYPES.CARRIER_PROFILE,
] as const;

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsIn(REVIEW_ENTITY_TYPES)
  entityType!: string;

  @IsString()
  entityId!: string;

  @IsOptional()
  @IsString()
  revieweeId?: string;
}
