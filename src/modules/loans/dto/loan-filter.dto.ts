import { IsOptional, IsEnum, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LoanStatus } from '../enums/loan-status.enum';

export class LoanFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by loan status',
    enum: LoanStatus,
    example: LoanStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  customerId?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum principal amount',
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  principalAmountGte?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum principal amount',
    example: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  principalAmountLte?: number;

  @ApiPropertyOptional({
    description: 'Filter by start date (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  createdAtGte?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  createdAtLte?: string;
}
