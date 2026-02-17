import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

interface CurrentUserType {
  userId: number;
  email: string;
  role: Role;
  customer?: { id: number } | null;
}

@Controller('my-loans')
@UseGuards(JwtAuthGuard)
export class MyLoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  findMyLoans(@CurrentUser() user: CurrentUserType) {
    if (!user.customer?.id) {
      throw new NotFoundException('Customer profile not found');
    }
    return this.loansService.findByCustomer(user.customer.id);
  }

  @Get(':id')
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
