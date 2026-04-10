import { AlertCondition } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAlertDto {
  @IsString()
  @MaxLength(32)
  symbol!: string;

  @IsEnum(AlertCondition)
  condition!: AlertCondition;

  @IsNumber()
  @Min(0)
  targetPrice!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
