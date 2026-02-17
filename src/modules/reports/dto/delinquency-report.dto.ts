import { ApiProperty } from '@nestjs/swagger';

export class DelinquencyReportDto {
  @ApiProperty({ description: 'Overall delinquency rate' })
  overallDelinquencyRate: number;

  @ApiProperty({ description: 'Total amount overdue' })
  totalOverdueAmount: number;

  @ApiProperty({ description: 'Number of overdue loans' })
  overdueLoanCount: number;

  @ApiProperty({ description: 'Number of overdue installments' })
  overdueInstallmentCount: number;

  @ApiProperty({ description: 'Aging distribution of overdue amounts' })
  agingDistribution: AgingBucketDto[];

  @ApiProperty({ description: 'Delinquency trends over time' })
  trends: DelinquencyTrendDto[];
}

export class AgingBucketDto {
  @ApiProperty({ description: 'Aging bucket label' })
  bucket: string;

  @ApiProperty({ description: 'Minimum days overdue' })
  minDays: number;

  @ApiProperty({ description: 'Maximum days overdue' })
  maxDays: number;

  @ApiProperty({ description: 'Number of loans in this bucket' })
  loanCount: number;

  @ApiProperty({ description: 'Number of installments in this bucket' })
  installmentCount: number;

  @ApiProperty({ description: 'Total amount in this bucket' })
  amount: number;

  @ApiProperty({ description: 'Percentage of total overdue' })
  percentage: number;
}

export class DelinquencyTrendDto {
  @ApiProperty()
  period: string;

  @ApiProperty()
  delinquencyRate: number;

  @ApiProperty()
  overdueAmount: number;

  @ApiProperty()
  newOverdueLoans: number;

  @ApiProperty()
  resolvedOverdueLoans: number;
}
