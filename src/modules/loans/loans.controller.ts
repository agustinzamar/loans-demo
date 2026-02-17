import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL, CacheKey } from '@nestjs/cache-manager';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dto';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { Loan } from './entities/loan.entity';

interface CurrentUserType {
  userId: number;
  email: string;
  role: Role;
  customerId?: number;
}

@ApiTags('Loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(CacheInterceptor)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new loan or simulate a loan' })
  @ApiResponse({
    status: 201,
    description: 'Loan created or simulated successfully',
    type: Loan,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  create(@Body() createLoanDto: CreateLoanDto) {
    return this.loansService.create(createLoanDto);
  }

  @Get()
  @CacheTTL(3600)
  @ApiOperation({ summary: 'Get all loans with pagination and filtering' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  @ApiQuery({
    name: 'filter[status]',
    required: false,
    enum: ['simulated', 'active', 'overdue', 'paid', 'defaulted', 'cancelled'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'filter[customerId]',
    required: false,
    type: Number,
    description: 'Filter by customer ID',
  })
  @ApiQuery({
    name: 'filter[principalAmount][gte]',
    required: false,
    type: Number,
    description: 'Min amount',
  })
  @ApiQuery({
    name: 'filter[principalAmount][lte]',
    required: false,
    type: Number,
    description: 'Max amount',
  })
  @ApiResponse({ status: 200, description: 'Returns paginated loans' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @Query('search') search?: string,
    @Query('filter') filter?: Record<string, any>,
  ): Promise<PaginatedResponseDto<Loan>> {
    return this.loansService.findAll({
      ...paginationQuery,
      search,
      filter,
    });
  }

  @Get(':id')
  @CacheTTL(1800)
  @ApiOperation({ summary: 'Get loan by ID' })
  @ApiParam({ name: 'id', description: 'Loan ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns loan by ID', type: Loan })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.loansService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update loan' })
  @ApiParam({ name: 'id', description: 'Loan ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Loan updated successfully',
    type: Loan,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLoanDto: UpdateLoanDto,
  ) {
    return this.loansService.update(id, updateLoanDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete loan (soft delete)' })
  @ApiParam({ name: 'id', description: 'Loan ID', type: Number })
  @ApiResponse({ status: 200, description: 'Loan deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.remove(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a simulated loan' })
  @ApiParam({ name: 'id', description: 'Loan ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Loan activated successfully',
    type: Loan,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 400, description: 'Loan is not in simulated status' })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.activate(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a loan' })
  @ApiParam({ name: 'id', description: 'Loan ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Loan cancelled successfully',
    type: Loan,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel loan in current status',
  })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.cancel(id);
  }

  @Post(':id/default')
  @ApiOperation({ summary: 'Mark loan as defaulted' })
  @ApiParam({ name: 'id', description: 'Loan ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Loan marked as defaulted',
    type: Loan,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot mark loan as defaulted in current status',
  })
  markAsDefaulted(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.markAsDefaulted(id);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Record a payment for a loan' })
  @ApiParam({ name: 'id', description: 'Loan ID', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Payment recorded successfully',
    type: Loan,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or loan not active',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() recordPaymentDto: RecordPaymentDto,
  ) {
    return this.loansService.recordPayment(id, recordPaymentDto);
  }

  @Get(':id/schedule')
  @CacheKey('loans:schedule')
  @CacheTTL(7200)
  @ApiOperation({ summary: 'Calculate amortization schedule for a loan' })
  @ApiParam({ name: 'id', description: 'Loan ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns amortization schedule' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  calculateSchedule(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.loansService.calculateSchedule(id, user);
  }
}
