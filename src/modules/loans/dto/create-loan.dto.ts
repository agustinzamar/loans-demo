import {
  IsNumber,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentFrequency } from '../enums/payment-frequency.enum';

export class CreateLoanDto {
  @ApiProperty({
    description: 'Customer ID to associate with the loan',
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  customerId: number;

  @ApiProperty({
    description: 'Principal loan amount',
    example: 10000,
    minimum: 1,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Type(() => Number)
  principalAmount: number;

  @ApiProperty({
    description: 'Annual interest rate as percentage (10 = 10%)',
    example: 15,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  annualInterestRate: number;

  @ApiProperty({
    description: 'Payment frequency',
    enum: PaymentFrequency,
    example: PaymentFrequency.MONTHLY,
  })
  @IsEnum(PaymentFrequency)
  paymentFrequency: PaymentFrequency;

  @ApiProperty({
    description: 'Total number of payment periods',
    example: 12,
    minimum: 1,
    maximum: 520,
  })
  @IsInt()
  @Min(1)
  @Max(520)
  @Type(() => Number)
  totalPeriods: number;

  @ApiPropertyOptional({
    description: 'Daily overdue interest rate as percentage (1 = 1%)',
    example: 1,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  overdueInterestRate?: number;

  @ApiPropertyOptional({
    description: 'Whether to simulate the loan without creating it',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  simulate?: boolean = true;
}
