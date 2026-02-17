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
import { PaymentFrequency } from '../enums/payment-frequency.enum';

export class CreateLoanDto {
  @IsInt()
  @Type(() => Number)
  customerId: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Type(() => Number)
  principalAmount: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  annualInterestRate: number;

  @IsEnum(PaymentFrequency)
  paymentFrequency: PaymentFrequency;

  @IsInt()
  @Min(1)
  @Max(520)
  @Type(() => Number)
  totalPeriods: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  overdueInterestRate?: number;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  simulate?: boolean = true;
}
