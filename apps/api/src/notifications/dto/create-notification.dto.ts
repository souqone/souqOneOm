import { IsString, IsOptional, IsEnum } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsString()
  userId!: string;

  @IsOptional()
  data?: Record<string, unknown>;

  /** Runtime-only actor ID (never persisted to DB); suppresses self-action notifications when equal to userId. */
  @IsOptional()
  @IsString()
  actorId?: string;
}
