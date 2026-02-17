import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { Loan } from './entities/loan.entity';
import { LoanInstallment } from './entities/loan-installment.entity';

interface CurrentUserType {
  userId: number;
  email: string;
  role: Role;
  customer?: { id: number } | null;
}

@ApiTags('My Loans')
@ApiBearerAuth()
@Controller('my-loans')
@UseGuards(JwtAuthGuard)
export class MyLoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  @ApiOperation({ summary: 'Get my loans (customer only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns customer loans',
    type: [Loan],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Customer profile not found' })
  findMyLoans(@CurrentUser() user: CurrentUserType) {
    if (!user.customer?.id) {
      throw new NotFoundException('Customer profile not found');
    }
    return this.loansService.findByCustomer(user.customer.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get my loan by ID (customer only)' })
  @ApiParam({ name: 'id', description: 'Loan ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns loan by ID', type: Loan })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only view own loans',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    const userForService = {
      userId: user.userId,
      role: user.role,
      customerId: user.customer?.id,
    };
    return this.loansService.findOne(id, userForService);
  }

  @Get(':id/installments')
  @ApiOperation({ summary: 'Get installments for my loan (customer only)' })
  @ApiParam({ name: 'id', description: 'Loan ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns loan installments',
    type: [LoanInstallment],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only view own loans',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  async findInstallments(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    const userForService = {
      userId: user.userId,
      role: user.role,
      customerId: user.customer?.id,
    };
    const loan = await this.loansService.findOne(id, userForService);
    return loan.installments;
  }
}
