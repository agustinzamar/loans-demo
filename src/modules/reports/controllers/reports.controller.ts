import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { ReportsService } from '../services/reports.service';
import { ReportFiltersDto } from '../dto/report-filters.dto';
import {
  DashboardSummaryDto,
  LoanStatusDistributionDto,
  MonthlyTrendDto,
} from '../dto/dashboard-summary.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary with key metrics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary retrieved successfully',
    type: DashboardSummaryDto,
  })
  async getDashboardSummary(
    @Query() filters?: ReportFiltersDto,
  ): Promise<DashboardSummaryDto> {
    return this.reportsService.getDashboardSummary(filters);
  }

  @Get('status-distribution')
  @ApiOperation({ summary: 'Get loan distribution by status' })
  @ApiResponse({
    status: 200,
    description: 'Loan status distribution retrieved successfully',
    type: [LoanStatusDistributionDto],
  })
  async getStatusDistribution(): Promise<LoanStatusDistributionDto[]> {
    return this.reportsService.getLoanStatusDistribution();
  }

  @Get('monthly-trends')
  @ApiOperation({ summary: 'Get monthly trends for the last 6 months' })
  @ApiResponse({
    status: 200,
    description: 'Monthly trends retrieved successfully',
    type: [MonthlyTrendDto],
  })
  async getMonthlyTrends(): Promise<MonthlyTrendDto[]> {
    return this.reportsService.getMonthlyTrends(6);
  }
}
