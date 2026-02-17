import { IsNumber, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentFrequency } from '../enums/payment-frequency.enum';

export class UpdateLoanDto {
  @ApiPropertyOptional({
    description: 'Principal loan amount',
    example: 15000,
    minimum: 1,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  principalAmount?: number;

  @ApiPropertyOptional({
    description: 'Annual interest rate as percentage (10 = 10%)',
    example: 12,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  annualInterestRate?: number;

  @ApiPropertyOptional({
    description: 'Payment frequency',
    enum: PaymentFrequency,
    example: PaymentFrequency.BIWEEKLY,
  })
  @IsEnum(PaymentFrequency)
  @IsOptional()
  paymentFrequency?: PaymentFrequency;

  @ApiPropertyOptional({
    description: 'Total number of payment periods',
    example: 24,
    minimum: 1,
    maximum: 520,
  })
  @IsInt()
  @Min(1)
  @Max(520)
  @IsOptional()
  @Type(() => Number)
  totalPeriods?: number;

  @ApiPropertyOptional({
    description: 'Daily overdue interest rate as percentage (1 = 1%)',
    example: 2,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  overdueInterestRate?: number;
}
