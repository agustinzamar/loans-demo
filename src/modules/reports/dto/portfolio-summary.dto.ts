import { ApiProperty } from '@nestjs/swagger';

export class LoanPerformanceMetricsDto {
  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  defaultRate: number;

  @ApiProperty()
  averageDaysToRepay: number;

  @ApiProperty()
  collectionEfficiency: number;
}

export class PortfolioSummaryDto {
  @ApiProperty({ description: 'Total portfolio value (outstanding principal)' })
  totalPortfolioValue: number;

  @ApiProperty({ description: 'Number of active loans in portfolio' })
  activeLoanCount: number;

  @ApiProperty({ description: 'Average loan size in portfolio' })
  averageLoanSize: number;

  @ApiProperty({
    description:
      'Portfolio at risk percentage (overdue amount / total outstanding)',
  })
  portfolioAtRisk: number;

  @ApiProperty({ description: 'Expected monthly income from active loans' })
  expectedMonthlyIncome: number;

  @ApiProperty({ description: 'Weighted average interest rate' })
  averageInterestRate: number;

  @ApiProperty({ description: 'Loan performance metrics' })
  performanceMetrics: LoanPerformanceMetricsDto;

  @ApiProperty({ description: 'Portfolio distribution by loan size' })
  sizeDistribution: SizeDistributionDto[];
}

export class SizeDistributionDto {
  @ApiProperty()
  range: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  percentage: number;
}
