import { IsNumber, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentFrequency } from '../enums/payment-frequency.enum';

export class UpdateLoanDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  principalAmount?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  annualInterestRate?: number;

  @IsEnum(PaymentFrequency)
  @IsOptional()
  paymentFrequency?: PaymentFrequency;

  @IsInt()
  @Min(1)
  @Max(520)
  @IsOptional()
  @Type(() => Number)
  totalPeriods?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  overdueInterestRate?: number;
}
