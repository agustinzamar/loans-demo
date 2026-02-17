import { Module, Global } from '@nestjs/common';
import { PaginationService } from './services/pagination.service';
import { LoggerModule } from './logger/logger.module';

@Global()
@Module({
  imports: [LoggerModule],
  providers: [PaginationService],
  exports: [PaginationService, LoggerModule],
})
export class CommonModule {}
