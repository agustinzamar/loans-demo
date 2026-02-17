import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { LoansModule } from './modules/loans/loans.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    DatabaseModule,
    CommonModule,
    UsersModule,
    AuthModule,
    CustomersModule,
    LoansModule,
    MailModule,
  ],
})
export class AppModule {}
