import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../../loans/entities/loan.entity';
import { LoanStatus } from '../../loans/enums/loan-status.enum';
import { LoanInstallment } from '../../loans/entities/loan-installment.entity';
import { InstallmentStatus } from '../../loans/enums/installment-status.enum';
import {
  LoanPerformanceMetricsDto,
  PortfolioSummaryDto,
  SizeDistributionDto,
} from '../dto/portfolio-summary.dto';
import { ReportFiltersDto } from '../dto/report-filters.dto';

type QueryResult = Record<string, any>;

@Injectable()
export class PortfolioReportsService {
  private readonly logger = new Logger(PortfolioReportsService.name);

  constructor(
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(LoanInstallment)
    private installmentRepository: Repository<LoanInstallment>,
  ) {}

  async getPortfolioSummary(
    filters?: ReportFiltersDto,
  ): Promise<PortfolioSummaryDto> {
    // filters parameter reserved for future implementation
    void filters;

    this.logger.debug('Generating portfolio summary report');

    const outstandingResult: QueryResult | undefined = await this.loanRepository
      .createQueryBuilder('loan')
      .leftJoin('loan.installments', 'installment')
      .select('COALESCE(SUM(installment.remaining_amount), 0)', 'total')
      .addSelect('COUNT(DISTINCT loan.id)', 'count')
      .where('loan.status IN (:...statuses)', {
        statuses: [LoanStatus.ACTIVE, LoanStatus.OVERDUE],
      })
      .getRawOne();

    const totalPortfolioValue = parseFloat(
      String(outstandingResult?.total ?? '0'),
    );
    const activeLoanCount = parseInt(
      String(outstandingResult?.count ?? '0'),
      10,
    );

    const avgLoanResult: QueryResult | undefined = await this.loanRepository
      .createQueryBuilder('loan')
      .select('AVG(loan.principal_amount)', 'avg')
      .where('loan.status != :status', { status: LoanStatus.SIMULATED })
      .getRawOne();

    const overdueResult: QueryResult | undefined =
      await this.installmentRepository
        .createQueryBuilder('installment')
        .select('COALESCE(SUM(installment.remaining_amount), 0)', 'total')
        .where('installment.status = :status', {
          status: InstallmentStatus.OVERDUE,
        })
        .getRawOne();

    const totalOverdue = parseFloat(String(overdueResult?.total ?? '0'));
    const portfolioAtRisk =
      totalPortfolioValue > 0 ? (totalOverdue / totalPortfolioValue) * 100 : 0;

    const expectedIncomeResult: QueryResult | undefined =
      await this.loanRepository
        .createQueryBuilder('loan')
        .leftJoin('loan.installments', 'installment')
        .select('COALESCE(SUM(installment.interest_amount), 0)', 'total')
        .where('loan.status IN (:...statuses)', {
          statuses: [LoanStatus.ACTIVE, LoanStatus.OVERDUE],
        })
        .andWhere('installment.status IN (:...installmentStatuses)', {
          installmentStatuses: [
            InstallmentStatus.PENDING,
            InstallmentStatus.PARTIAL,
          ],
        })
        .getRawOne();

    const interestRateResult: QueryResult | undefined =
      await this.loanRepository
        .createQueryBuilder('loan')
        .select('AVG(loan.annual_interest_rate)', 'avg')
        .where('loan.status IN (:...statuses)', {
          statuses: [LoanStatus.ACTIVE, LoanStatus.OVERDUE, LoanStatus.PAID],
        })
        .getRawOne();

    const performanceMetrics = await this.calculatePerformanceMetrics();
    const sizeDistribution = await this.calculateSizeDistribution();

    return {
      totalPortfolioValue,
      activeLoanCount,
      averageLoanSize:
        Math.round(parseFloat(String(avgLoanResult?.avg ?? '0')) * 100) / 100,
      portfolioAtRisk: Math.round(portfolioAtRisk * 100) / 100,
      expectedMonthlyIncome:
        Math.round(
          parseFloat(String(expectedIncomeResult?.total ?? '0')) * 100,
        ) / 100,
      averageInterestRate:
        Math.round(parseFloat(String(interestRateResult?.avg ?? '0')) * 100) /
        100,
      performanceMetrics,
      sizeDistribution,
    };
  }

  private async calculatePerformanceMetrics(): Promise<LoanPerformanceMetricsDto> {
    const totalLoans = await this.loanRepository.count({
      where: { status: LoanStatus.PAID },
    });

    const defaultedLoans = await this.loanRepository.count({
      where: { status: LoanStatus.DEFAULTED },
    });

    const completedOrDefaulted = totalLoans + defaultedLoans;

    const completionRate =
      completedOrDefaulted > 0 ? (totalLoans / completedOrDefaulted) * 100 : 0;

    const defaultRate =
      completedOrDefaulted > 0
        ? (defaultedLoans / completedOrDefaulted) * 100
        : 0;

    const avgDaysResult: QueryResult | undefined = await this.loanRepository
      .createQueryBuilder('loan')
      .select(
        'AVG(EXTRACT(EPOCH FROM (loan.paid_at - loan.activated_at)) / 86400)',
        'avg',
      )
      .where('loan.status = :status', { status: LoanStatus.PAID })
      .getRawOne();

    const expectedResult: QueryResult | undefined =
      await this.installmentRepository
        .createQueryBuilder('installment')
        .select('COALESCE(SUM(installment.total_amount), 0)', 'expected')
        .getRawOne();

    const collectedResult: QueryResult | undefined = await this.loanRepository
      .createQueryBuilder('loan')
      .leftJoin('loan.installments', 'installment')
      .select('COALESCE(SUM(installment.paid_amount), 0)', 'collected')
      .getRawOne();

    const expected = parseFloat(String(expectedResult?.expected ?? '0'));
    const collected = parseFloat(String(collectedResult?.collected ?? '0'));
    const collectionEfficiency =
      expected > 0 ? (collected / expected) * 100 : 0;

    return {
      completionRate: Math.round(completionRate * 100) / 100,
      defaultRate: Math.round(defaultRate * 100) / 100,
      averageDaysToRepay: Math.round(
        parseFloat(String(avgDaysResult?.avg ?? '0')),
      ),
      collectionEfficiency: Math.round(collectionEfficiency * 100) / 100,
    };
  }

  private async calculateSizeDistribution(): Promise<SizeDistributionDto[]> {
    const ranges = [
      { label: 'Small ($0 - $1,000)', min: 0, max: 1000 },
      { label: 'Medium ($1,001 - $5,000)', min: 1001, max: 5000 },
      { label: 'Large ($5,001 - $10,000)', min: 5001, max: 10000 },
      { label: 'Very Large ($10,000+)', min: 10001, max: null },
    ];

    const distribution: SizeDistributionDto[] = [];

    for (const range of ranges) {
      let query = this.loanRepository
        .createQueryBuilder('loan')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(loan.principal_amount), 0)', 'total')
        .where('loan.status != :status', { status: LoanStatus.SIMULATED })
        .andWhere('loan.principal_amount >= :min', { min: range.min });

      if (range.max) {
        query = query.andWhere('loan.principal_amount <= :max', {
          max: range.max,
        });
      }

      const result: QueryResult | undefined = await query.getRawOne();

      distribution.push({
        range: range.label,
        count: parseInt(String(result?.count ?? '0'), 10),
        totalAmount: parseFloat(String(result?.total ?? '0')),
        percentage: 0,
      });
    }

    const totalCount = distribution.reduce((sum, d) => sum + d.count, 0);

    return distribution.map((d) => ({
      ...d,
      percentage:
        totalCount > 0 ? Math.round((d.count / totalCount) * 10000) / 100 : 0,
    }));
  }
}
