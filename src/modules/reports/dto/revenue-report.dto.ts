import { ApiProperty } from '@nestjs/swagger';

export class RevenueReportDto {
  @ApiProperty({ description: 'Total interest revenue earned' })
  totalInterestRevenue: number;

  @ApiProperty({ description: 'Total penalty revenue from late payments' })
  totalPenaltyRevenue: number;

  @ApiProperty({ description: 'Total revenue (interest + penalties)' })
  totalRevenue: number;

  @ApiProperty({ description: 'Projected total revenue for active loans' })
  projectedTotalRevenue: number;

  @ApiProperty({ description: 'Revenue by period' })
  revenueByPeriod: RevenuePeriodDto[];

  @ApiProperty({ description: 'Revenue breakdown by loan' })
  topRevenueLoans: RevenueByLoanDto[];
}

export class RevenuePeriodDto {
  @ApiProperty()
  period: string;

  @ApiProperty()
  interestRevenue: number;

  @ApiProperty()
  penaltyRevenue: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  growthRate: number;
}

export class RevenueByLoanDto {
  @ApiProperty()
  loanId: number;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  principalAmount: number;

  @ApiProperty()
  interestRevenue: number;

  @ApiProperty()
  penaltyRevenue: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  yieldPercentage: number;
}
