import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOperator,
  LessThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Loan } from '../../loans/entities/loan.entity';
import { LoanStatus } from '../../loans/enums/loan-status.enum';
import { LoanInstallment } from '../../loans/entities/loan-installment.entity';
import { InstallmentStatus } from '../../loans/enums/installment-status.enum';
import { LoanPayment } from '../../loans/entities/loan-payment.entity';
import {
  DashboardSummaryDto,
  LoanStatusDistributionDto,
  MonthlyTrendDto,
} from '../dto/dashboard-summary.dto';
import { ReportFiltersDto } from '../dto/report-filters.dto';

type QueryResult = Record<string, any>;

interface StatusDistributionResult {
  status: string;
  count: string;
  amount: string;
}

interface WhereClause {
  activatedAt?: Date | FindOperator<Date>;
  status?: LoanStatus;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(LoanInstallment)
    private installmentRepository: Repository<LoanInstallment>,
    @InjectRepository(LoanPayment)
    private paymentRepository: Repository<LoanPayment>,
  ) {}

  async getDashboardSummary(
    filters?: ReportFiltersDto,
  ): Promise<DashboardSummaryDto> {
    return this.calculateDashboardSummary(filters);
  }

  async getLoanStatusDistribution(): Promise<LoanStatusDistributionDto[]> {
    const result: StatusDistributionResult[] = await this.loanRepository
      .createQueryBuilder('loan')
      .select('loan.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(loan.principal_amount)', 'amount')
      .groupBy('loan.status')
      .getRawMany();

    const totalCount = result.reduce(
      (sum, r) => sum + parseInt(r.count, 10),
      0,
    );

    return result.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
      amount: parseFloat(r.amount || '0'),
      percentage:
        totalCount > 0 ? (parseInt(r.count, 10) / totalCount) * 100 : 0,
    }));
  }

  async getMonthlyTrends(months: number = 6): Promise<MonthlyTrendDto[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const monthsList: MonthlyTrendDto[] = [];
    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);

      const newLoans = await this.loanRepository
        .createQueryBuilder('loan')
        .where('loan.activated_at BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd,
        })
        .getCount();

      const newLoanAmount: QueryResult | undefined = await this.loanRepository
        .createQueryBuilder('loan')
        .select('COALESCE(SUM(loan.principal_amount), 0)', 'total')
        .where('loan.activated_at BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd,
        })
        .getRawOne();

      const payments = await this.paymentRepository
        .createQueryBuilder('payment')
        .where('payment.payment_date BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd,
        })
        .getCount();

      const amountCollected: QueryResult | undefined =
        await this.paymentRepository
          .createQueryBuilder('payment')
          .select('COALESCE(SUM(payment.amount), 0)', 'total')
          .where('payment.payment_date BETWEEN :start AND :end', {
            start: monthStart,
            end: monthEnd,
          })
          .getRawOne();

      const activeLoans = await this.loanRepository.count({
        where: {
          status: LoanStatus.ACTIVE,
          activatedAt: LessThan(monthEnd),
        },
      });

      monthsList.push({
        month: `${year}-${month.toString().padStart(2, '0')}`,
        newLoans,

        newLoanAmount: parseFloat(String(newLoanAmount?.total ?? '0')),
        paymentsReceived: payments,

        amountCollected: parseFloat(String(amountCollected?.total ?? '0')),
        activeLoans,
      });
    }

    return monthsList;
  }

  private async calculateDashboardSummary(
    filters?: ReportFiltersDto,
  ): Promise<DashboardSummaryDto> {
    const whereClause: WhereClause = {};

    if (filters?.startDate && filters?.endDate) {
      whereClause.activatedAt = Between(
        new Date(filters.startDate),
        new Date(filters.endDate),
      );
    }

    const totalLoans = await this.loanRepository.count({ where: whereClause });

    const activeLoans = await this.loanRepository.count({
      where: { ...whereClause, status: LoanStatus.ACTIVE },
    });

    const paidLoans = await this.loanRepository.count({
      where: { ...whereClause, status: LoanStatus.PAID },
    });

    const overdueLoans = await this.loanRepository.count({
      where: { ...whereClause, status: LoanStatus.OVERDUE },
    });

    const defaultedLoans = await this.loanRepository.count({
      where: { ...whereClause, status: LoanStatus.DEFAULTED },
    });

    const principalResult: QueryResult | undefined = await this.loanRepository
      .createQueryBuilder('loan')
      .select('COALESCE(SUM(loan.principal_amount), 0)', 'total')
      .where(
        whereClause.activatedAt
          ? 'loan.activated_at BETWEEN :start AND :end'
          : '1=1',
        {
          start: filters?.startDate,
          end: filters?.endDate,
        },
      )
      .getRawOne();

    const outstandingResult: QueryResult | undefined = await this.loanRepository
      .createQueryBuilder('loan')
      .leftJoin('loan.installments', 'installment')
      .select('COALESCE(SUM(installment.remaining_amount), 0)', 'total')
      .where('loan.status IN (:...statuses)', {
        statuses: [LoanStatus.ACTIVE, LoanStatus.OVERDUE],
      })
      .getRawOne();

    const paidResult: QueryResult | undefined = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .getRawOne();

    const revenueResult: QueryResult | undefined = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.installment', 'installment')
      .select(
        'COALESCE(SUM(payment.amount - installment.principal_amount), 0)',
        'total',
      )
      .getRawOne();

    const totalOverdueResult: QueryResult | undefined =
      await this.installmentRepository
        .createQueryBuilder('installment')
        .select('COALESCE(SUM(installment.remaining_amount), 0)', 'total')
        .where('installment.status = :status', {
          status: InstallmentStatus.OVERDUE,
        })
        .getRawOne();

    const totalOutstanding = parseFloat(
      String(outstandingResult?.total ?? '0'),
    );

    const totalOverdue = parseFloat(String(totalOverdueResult?.total ?? '0'));
    const delinquencyRate =
      totalOutstanding > 0 ? (totalOverdue / totalOutstanding) * 100 : 0;

    const avgLoanResult: QueryResult | undefined = await this.loanRepository
      .createQueryBuilder('loan')
      .select('AVG(loan.principal_amount)', 'avg')
      .getRawOne();

    const avgDurationResult: QueryResult | undefined = await this.loanRepository
      .createQueryBuilder('loan')
      .select(
        'AVG(EXTRACT(EPOCH FROM (loan.paid_at - loan.activated_at)) / 86400)',
        'avg',
      )
      .where('loan.status = :status', { status: LoanStatus.PAID })
      .getRawOne();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const newLoansThisMonth = await this.loanRepository.count({
      where: {
        activatedAt: MoreThanOrEqual(monthStart),
      },
    });

    const collectedThisMonth: QueryResult | undefined =
      await this.paymentRepository
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'total')
        .where('payment.payment_date >= :date', { date: monthStart })
        .getRawOne();

    return {
      totalLoans,
      activeLoans,
      paidLoans,
      overdueLoans,
      defaultedLoans,

      totalPrincipalAmount: parseFloat(String(principalResult?.total ?? '0')),
      totalOutstandingAmount: totalOutstanding,

      totalPaidAmount: parseFloat(String(paidResult?.total ?? '0')),

      totalRevenue: parseFloat(String(revenueResult?.total ?? '0')),
      delinquencyRate: Math.round(delinquencyRate * 100) / 100,
      averageLoanAmount:
        Math.round(parseFloat(String(avgLoanResult?.avg ?? '0')) * 100) / 100,
      averageLoanDuration: Math.round(
        parseFloat(String(avgDurationResult?.avg ?? '0')),
      ),
      newLoansThisMonth,

      collectedThisMonth: parseFloat(String(collectedThisMonth?.total ?? '0')),
    };
  }
}
