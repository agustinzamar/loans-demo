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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
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
@Controller('loans')
@UseGuards(JwtAuthGuard, AdminGuard)
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
  @ApiOperation({ summary: 'Get all loans' })
  @ApiResponse({ status: 200, description: 'Returns all loans', type: [Loan] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  findAll() {
    return this.loansService.findAll();
  }

  @Get(':id')
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
