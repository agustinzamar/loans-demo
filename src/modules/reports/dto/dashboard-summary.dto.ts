import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryDto {
  @ApiProperty({ description: 'Total number of loans' })
  totalLoans: number;

  @ApiProperty({ description: 'Number of active loans' })
  activeLoans: number;

  @ApiProperty({ description: 'Number of paid loans' })
  paidLoans: number;

  @ApiProperty({ description: 'Number of overdue loans' })
  overdueLoans: number;

  @ApiProperty({ description: 'Number of defaulted loans' })
  defaultedLoans: number;

  @ApiProperty({ description: 'Total principal amount across all loans' })
  totalPrincipalAmount: number;

  @ApiProperty({ description: 'Total amount currently outstanding' })
  totalOutstandingAmount: number;

  @ApiProperty({ description: 'Total amount paid to date' })
  totalPaidAmount: number;

  @ApiProperty({ description: 'Total revenue (interest + penalties)' })
  totalRevenue: number;

  @ApiProperty({ description: 'Current delinquency rate (percentage)' })
  delinquencyRate: number;

  @ApiProperty({ description: 'Average loan amount' })
  averageLoanAmount: number;

  @ApiProperty({ description: 'Average loan duration in days' })
  averageLoanDuration: number;

  @ApiProperty({ description: 'Number of new loans this month' })
  newLoansThisMonth: number;

  @ApiProperty({ description: 'Total amount collected this month' })
  collectedThisMonth: number;
}

export class LoanStatusDistributionDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  percentage: number;
}

export class MonthlyTrendDto {
  @ApiProperty()
  month: string;

  @ApiProperty()
  newLoans: number;

  @ApiProperty()
  newLoanAmount: number;

  @ApiProperty()
  paymentsReceived: number;

  @ApiProperty()
  amountCollected: number;

  @ApiProperty()
  activeLoans: number;
}
