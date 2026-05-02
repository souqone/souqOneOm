import { IsString, IsOptional, IsIn } from 'class-validator';

export const ENTITY_TYPES = ['LISTING', 'BUS_LISTING', 'SPARE_PART', 'CAR_SERVICE', 'TRANSPORT', 'JOB', 'EQUIPMENT_LISTING', 'EQUIPMENT_REQUEST', 'OPERATOR_LISTING'] as const;
export type EntityType = typeof ENTITY_TYPES[number];

export class CreateConversationDto {
  @IsIn(ENTITY_TYPES, { message: 'نوع الكيان غير صالح' })
  entityType!: EntityType;

  @IsString({ message: 'معرف الكيان مطلوب' })
  entityId!: string;

  // Backward compat — old clients may still send listingId
  @IsOptional()
  @IsString()
  listingId?: string;
}
