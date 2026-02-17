import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoansService } from './loans.service';
import { LoansCronService } from './loans.cron';
import { LoansController } from './loans.controller';
import { MyLoansController } from './my-loans.controller';
import { Loan } from './entities/loan.entity';
import { LoanInstallment } from './entities/loan-installment.entity';
import { LoanPayment } from './entities/loan-payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, LoanInstallment, LoanPayment])],
  controllers: [LoansController, MyLoansController],
  providers: [LoansService, LoansCronService],
  exports: [LoansService],
})
export class LoansModule {}
