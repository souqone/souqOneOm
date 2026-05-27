import { IsInt, Min, Max, IsString, IsOptional, IsIn } from 'class-validator';

const ENTITY_TYPES = ['LISTING', 'BUS_LISTING', 'EQUIPMENT_LISTING', 'OPERATOR_LISTING', 'DRIVER_PROFILE', 'EMPLOYER_PROFILE', 'CARRIER_PROFILE'] as const;

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsIn(ENTITY_TYPES)
  entityType!: string;

  @IsString()
  entityId!: string;

  @IsString()
  revieweeId!: string;
}
