import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoansService } from './loans.service';

@Injectable()
export class LoansCronService {
  private readonly logger = new Logger(LoansCronService.name);

  constructor(private readonly loansService: LoansService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverdueCheck(): Promise<void> {
    this.logger.log('Starting daily overdue check job...');
    await this.loansService.checkOverdueInstallments();
    this.logger.log('Daily overdue check job completed');
  }
}
