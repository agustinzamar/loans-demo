import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { FinancialReportsService } from '../services/financial-reports.service';
import { ReportFiltersDto } from '../dto/report-filters.dto';
import { DelinquencyReportDto } from '../dto/delinquency-report.dto';
import { RevenueReportDto } from '../dto/revenue-report.dto';

@ApiTags('Reports - Financial')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, AdminGuard)
export class FinancialReportsController {
  constructor(
    private readonly financialReportsService: FinancialReportsService,
  ) {}

  @Get('delinquency')
  @ApiOperation({ summary: 'Get delinquency report with aging analysis' })
  @ApiResponse({
    status: 200,
    description: 'Delinquency report retrieved successfully',
    type: DelinquencyReportDto,
  })
  async getDelinquencyReport(
    @Query() filters?: ReportFiltersDto,
  ): Promise<DelinquencyReportDto> {
    return this.financialReportsService.getDelinquencyReport(filters);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analysis report' })
  @ApiResponse({
    status: 200,
    description: 'Revenue report retrieved successfully',
    type: RevenueReportDto,
  })
  async getRevenueReport(
    @Query() filters?: ReportFiltersDto,
  ): Promise<RevenueReportDto> {
    return this.financialReportsService.getRevenueReport(filters);
  }
}
