import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './controllers/reports.controller';
import { PortfolioReportsController } from './controllers/portfolio-reports.controller';
import { FinancialReportsController } from './controllers/financial-reports.controller';
import { ReportsService } from './services/reports.service';
import { PortfolioReportsService } from './services/portfolio-reports.service';
import { FinancialReportsService } from './services/financial-reports.service';
import { Loan } from '../loans/entities/loan.entity';
import { LoanInstallment } from '../loans/entities/loan-installment.entity';
import { LoanPayment } from '../loans/entities/loan-payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, LoanInstallment, LoanPayment])],
  controllers: [
    ReportsController,
    PortfolioReportsController,
    FinancialReportsController,
  ],
  providers: [ReportsService, PortfolioReportsService, FinancialReportsService],
  exports: [ReportsService, PortfolioReportsService, FinancialReportsService],
})
export class ReportsModule {}
