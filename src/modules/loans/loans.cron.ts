import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoansService } from './loans.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class LoansCronService {
  private readonly logger = new Logger(LoansCronService.name);

  constructor(
    private readonly loansService: LoansService,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverdueCheck(): Promise<void> {
    this.logger.log('Starting daily overdue check job...');
    const results = await this.loansService.checkOverdueInstallments(
      this.mailService,
    );
    this.logger.log('Daily overdue check job completed');
    this.logger.log(
      `Processed: ${results.processed}, Failed: ${results.failed}, Emails sent: ${results.emailsSent}`,
    );
  }
}
