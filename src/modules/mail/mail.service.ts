import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendMailDto } from './dto/send-mail.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendMail(dto: SendMailDto): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: dto.to,
        subject: dto.subject,
        text: dto.text,
      });
      this.logger.log(`Email sent successfully to ${dto.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${dto.to}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
