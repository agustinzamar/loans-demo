import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../../loans/entities/loan.entity';
import { LoanStatus } from '../../loans/enums/loan-status.enum';
import { LoanInstallment } from '../../loans/entities/loan-installment.entity';
import { InstallmentStatus } from '../../loans/enums/installment-status.enum';
import { LoanPayment } from '../../loans/entities/loan-payment.entity';

import {
  AgingBucketDto,
  DelinquencyReportDto,
  DelinquencyTrendDto,
} from '../dto/delinquency-report.dto';
import {
  RevenueByLoanDto,
  RevenuePeriodDto,
  RevenueReportDto,
} from '../dto/revenue-report.dto';
import { ReportFiltersDto, ReportPeriod } from '../dto/report-filters.dto';

type QueryResult = Record<string, any>;

@Injectable()
export class FinancialReportsService {
  private readonly logger = new Logger(FinancialReportsService.name);

  constructor(
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(LoanInstallment)
    private installmentRepository: Repository<LoanInstallment>,
    @InjectRepository(LoanPayment)
    private paymentRepository: Repository<LoanPayment>,
  ) {}

  async getDelinquencyReport(
    filters?: ReportFiltersDto,
  ): Promise<DelinquencyReportDto> {
    this.logger.debug('Generating delinquency report');

    const outstandingResult: QueryResult | undefined =
      await this.installmentRepository
        .createQueryBuilder('installment')
        .select('COALESCE(SUM(installment.remaining_amount), 0)', 'total')
        .where('installment.status IN (:...statuses)', {
          statuses: [
            InstallmentStatus.PENDING,
            InstallmentStatus.PARTIAL,
            InstallmentStatus.OVERDUE,
          ],
        })
        .getRawOne();

    const overdueResult: QueryResult | undefined =
      await this.installmentRepository
        .createQueryBuilder('installment')
        .select('COALESCE(SUM(installment.remaining_amount), 0)', 'total')
        .addSelect('COUNT(*)', 'count')
        .where('installment.status = :status', {
          status: InstallmentStatus.OVERDUE,
        })
        .getRawOne();

    const totalOutstanding = parseFloat(
      String(outstandingResult?.total ?? '0'),
    );
    const totalOverdue = parseFloat(String(overdueResult?.total ?? '0'));
    const overallDelinquencyRate =
      totalOutstanding > 0 ? (totalOverdue / totalOutstanding) * 100 : 0;

    const overdueLoanIds: QueryResult[] = await this.installmentRepository
      .createQueryBuilder('installment')
      .select('DISTINCT installment.loan_id', 'loanId')
      .where('installment.status = :status', {
        status: InstallmentStatus.OVERDUE,
      })
      .getRawMany();

    const overdueLoanCount = overdueLoanIds.length;
    const overdueInstallmentCount = parseInt(
      String(overdueResult?.count ?? '0'),
      10,
    );

    const agingDistribution = await this.calculateAgingDistribution();
    const trends = await this.calculateDelinquencyTrends(
      filters?.period ?? ReportPeriod.MONTHLY,
    );

    return {
      overallDelinquencyRate: Math.round(overallDelinquencyRate * 100) / 100,
      totalOverdueAmount: totalOverdue,
      overdueLoanCount,
      overdueInstallmentCount,
      agingDistribution,
      trends,
    };
  }

  async getRevenueReport(
    filters?: ReportFiltersDto,
  ): Promise<RevenueReportDto> {
    this.logger.debug('Generating revenue report');

    const interestRevenueResult: QueryResult | undefined =
      await this.paymentRepository
        .createQueryBuilder('payment')
        .leftJoin('payment.installment', 'installment')
        .select(
          'COALESCE(SUM(payment.amount - installment.principal_amount), 0)',
          'total',
        )
        .where('payment.amount > installment.principal_amount')
        .getRawOne();

    const penaltyRevenueResult: QueryResult | undefined =
      await this.installmentRepository
        .createQueryBuilder('installment')
        .select('COALESCE(SUM(installment.penalty_amount), 0)', 'total')
        .where('installment.status IN (:...statuses)', {
          statuses: [InstallmentStatus.PAID, InstallmentStatus.PARTIAL],
        })
        .getRawOne();

    const interestRevenue = parseFloat(
      String(interestRevenueResult?.total ?? '0'),
    );
    const penaltyRevenue = parseFloat(
      String(penaltyRevenueResult?.total ?? '0'),
    );
    const totalRevenue = interestRevenue + penaltyRevenue;

    const projectedResult: QueryResult | undefined = await this.loanRepository
      .createQueryBuilder('loan')
      .leftJoin('loan.installments', 'installment')
      .select('COALESCE(SUM(installment.interest_amount), 0)', 'total')
      .where('loan.status IN (:...statuses)', {
        statuses: [LoanStatus.ACTIVE, LoanStatus.OVERDUE],
      })
      .getRawOne();

    const projectedTotalRevenue =
      totalRevenue + parseFloat(String(projectedResult?.total ?? '0'));

    const revenueByPeriod = await this.calculateRevenueByPeriod(
      filters?.period ?? ReportPeriod.MONTHLY,
    );
    const topRevenueLoans = await this.calculateTopRevenueLoans(10);

    return {
      totalInterestRevenue: Math.round(interestRevenue * 100) / 100,
      totalPenaltyRevenue: Math.round(penaltyRevenue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      projectedTotalRevenue: Math.round(projectedTotalRevenue * 100) / 100,
      revenueByPeriod,
      topRevenueLoans,
    };
  }

  private async calculateAgingDistribution(): Promise<AgingBucketDto[]> {
    const buckets = [
      { label: '1-30 days', min: 1, max: 30 },
      { label: '31-60 days', min: 31, max: 60 },
      { label: '61-90 days', min: 61, max: 90 },
      { label: '91+ days', min: 91, max: null },
    ];

    const distribution: AgingBucketDto[] = [];

    for (const bucket of buckets) {
      let query = this.installmentRepository
        .createQueryBuilder('installment')
        .select('COUNT(DISTINCT installment.loan_id)', 'loanCount')
        .addSelect('COUNT(*)', 'installmentCount')
        .addSelect('COALESCE(SUM(installment.remaining_amount), 0)', 'amount')
        .where('installment.status = :status', {
          status: InstallmentStatus.OVERDUE,
        })
        .andWhere('installment.overdue_days >= :min', { min: bucket.min });

      if (bucket.max) {
        query = query.andWhere('installment.overdue_days <= :max', {
          max: bucket.max,
        });
      }

      const result: QueryResult | undefined = await query.getRawOne();

      distribution.push({
        bucket: bucket.label,
        minDays: bucket.min,
        maxDays: bucket.max ?? 9999,
        loanCount: parseInt(String(result?.loanCount ?? '0'), 10),
        installmentCount: parseInt(String(result?.installmentCount ?? '0'), 10),
        amount: parseFloat(String(result?.amount ?? '0')),
        percentage: 0,
      });
    }

    const totalAmount = distribution.reduce((sum, d) => sum + d.amount, 0);

    return distribution.map((d) => ({
      ...d,
      percentage:
        totalAmount > 0
          ? Math.round((d.amount / totalAmount) * 10000) / 100
          : 0,
    }));
  }

  private async calculateDelinquencyTrends(
    period: ReportPeriod,
  ): Promise<DelinquencyTrendDto[]> {
    // period parameter reserved for future implementation
    void period;

    const months = 6;
    const trends: DelinquencyTrendDto[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const outstandingResult: QueryResult | undefined =
        await this.installmentRepository
          .createQueryBuilder('installment')
          .select('COALESCE(SUM(installment.remaining_amount), 0)', 'total')
          .where('installment.created_at <= :end', { end: monthEnd })
          .getRawOne();

      const overdueResult: QueryResult | undefined =
        await this.installmentRepository
          .createQueryBuilder('installment')
          .select('COALESCE(SUM(installment.remaining_amount), 0)', 'total')
          .where('installment.status = :status', {
            status: InstallmentStatus.OVERDUE,
          })
          .andWhere('installment.due_date <= :end', { end: monthEnd })
          .getRawOne();

      const newOverdue = await this.loanRepository
        .createQueryBuilder('loan')
        .where('loan.status = :status', { status: LoanStatus.OVERDUE })
        .andWhere('loan.updated_at BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd,
        })
        .getCount();

      const resolved = await this.loanRepository
        .createQueryBuilder('loan')
        .where('loan.status IN (:...statuses)', {
          statuses: [LoanStatus.ACTIVE, LoanStatus.PAID],
        })
        .andWhere('loan.updated_at BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd,
        })
        .getCount();

      const totalOutstanding = parseFloat(
        String(outstandingResult?.total ?? '0'),
      );
      const overdueAmount = parseFloat(String(overdueResult?.total ?? '0'));
      const delinquencyRate =
        totalOutstanding > 0 ? (overdueAmount / totalOutstanding) * 100 : 0;

      trends.push({
        period: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
        delinquencyRate: Math.round(delinquencyRate * 100) / 100,
        overdueAmount,
        newOverdueLoans: newOverdue,
        resolvedOverdueLoans: resolved,
      });
    }

    return trends;
  }

  private async calculateRevenueByPeriod(
    period: ReportPeriod,
  ): Promise<RevenuePeriodDto[]> {
    // period parameter reserved for future implementation
    void period;

    const periods = 6;
    const revenueByPeriod: RevenuePeriodDto[] = [];

    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const interestResult: QueryResult | undefined =
        await this.paymentRepository
          .createQueryBuilder('payment')
          .leftJoin('payment.installment', 'installment')
          .select(
            'COALESCE(SUM(payment.amount - installment.principal_amount), 0)',
            'total',
          )
          .where('payment.payment_date BETWEEN :start AND :end', {
            start: monthStart,
            end: monthEnd,
          })
          .andWhere('payment.amount > installment.principal_amount')
          .getRawOne();

      const penaltyResult: QueryResult | undefined =
        await this.paymentRepository
          .createQueryBuilder('payment')
          .leftJoin('payment.installment', 'installment')
          .select('COALESCE(SUM(installment.penalty_amount), 0)', 'total')
          .where('payment.payment_date BETWEEN :start AND :end', {
            start: monthStart,
            end: monthEnd,
          })
          .getRawOne();

      const interestRevenue = parseFloat(String(interestResult?.total ?? '0'));
      const penaltyRevenue = parseFloat(String(penaltyResult?.total ?? '0'));
      const totalRevenue = interestRevenue + penaltyRevenue;

      revenueByPeriod.push({
        period: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
        interestRevenue: Math.round(interestRevenue * 100) / 100,
        penaltyRevenue: Math.round(penaltyRevenue * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        growthRate: 0,
      });
    }

    for (let i = 1; i < revenueByPeriod.length; i++) {
      const current = revenueByPeriod[i].totalRevenue;
      const previous = revenueByPeriod[i - 1].totalRevenue;
      revenueByPeriod[i].growthRate =
        previous > 0
          ? Math.round(((current - previous) / previous) * 10000) / 100
          : 0;
    }

    return revenueByPeriod;
  }

  private async calculateTopRevenueLoans(
    limit: number,
  ): Promise<RevenueByLoanDto[]> {
    const loans: QueryResult[] = await this.loanRepository
      .createQueryBuilder('loan')
      .leftJoin('loan.customer', 'customer')
      .leftJoin('loan.installments', 'installment')
      .leftJoin('installment.payments', 'payment')
      .select('loan.id', 'loanId')
      .addSelect(
        "CONCAT(customer.first_name, ' ', customer.last_name)",
        'customerName',
      )
      .addSelect('loan.principal_amount', 'principalAmount')
      .addSelect(
        'COALESCE(SUM(payment.amount - installment.principal_amount), 0)',
        'interestRevenue',
      )
      .addSelect(
        'COALESCE(SUM(installment.penalty_amount), 0)',
        'penaltyRevenue',
      )
      .groupBy('loan.id')
      .addGroupBy('customer.first_name')
      .addGroupBy('customer.last_name')
      .orderBy(
        'COALESCE(SUM(payment.amount - installment.principal_amount), 0)',
        'DESC',
      )
      .limit(limit)
      .getRawMany();

    return loans.map((loan) => {
      const interestRevenue = parseFloat(String(loan?.interestRevenue ?? '0'));
      const penaltyRevenue = parseFloat(String(loan?.penaltyRevenue ?? '0'));
      const totalRevenue = interestRevenue + penaltyRevenue;
      const principal = parseFloat(String(loan?.principalAmount ?? '0'));
      const yieldPercentage =
        principal > 0 ? (totalRevenue / principal) * 100 : 0;

      return {
        loanId: parseInt(String(loan?.loanId), 10),

        customerName: String(loan?.customerName ?? ''),
        principalAmount: principal,
        interestRevenue: Math.round(interestRevenue * 100) / 100,
        penaltyRevenue: Math.round(penaltyRevenue * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        yieldPercentage: Math.round(yieldPercentage * 100) / 100,
      };
    });
  }
}
