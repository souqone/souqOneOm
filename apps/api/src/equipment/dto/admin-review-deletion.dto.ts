import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum AdminDeletionDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class AdminReviewDeletionDto {
  @IsEnum(AdminDeletionDecision, { message: 'القرار يجب أن يكون إما APPROVED أو REJECTED' })
  decision!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString({ message: 'سبب الرفض يجب أن يكون نصاً' })
  @MaxLength(500, { message: 'سبب الرفض يجب ألا يتجاوز 500 حرف' })
  rejectionReason?: string;
}
