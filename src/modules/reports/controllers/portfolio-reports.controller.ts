import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { PortfolioReportsService } from '../services/portfolio-reports.service';
import { ReportFiltersDto } from '../dto/report-filters.dto';
import { PortfolioSummaryDto } from '../dto/portfolio-summary.dto';

@ApiTags('Reports - Portfolio')
@ApiBearerAuth()
@Controller('reports/portfolio')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PortfolioReportsController {
  constructor(
    private readonly portfolioReportsService: PortfolioReportsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get portfolio performance summary' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio summary retrieved successfully',
    type: PortfolioSummaryDto,
  })
  async getPortfolioSummary(
    @Query() filters?: ReportFiltersDto,
  ): Promise<PortfolioSummaryDto> {
    return this.portfolioReportsService.getPortfolioSummary(filters);
  }
}
