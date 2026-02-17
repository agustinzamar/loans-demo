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
  customerId?: number;
}

@Controller('my-loans')
@UseGuards(JwtAuthGuard)
export class MyLoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  findMyLoans(@CurrentUser() user: CurrentUserType) {
    if (!user.customerId) {
      throw new NotFoundException('Customer profile not found');
    }
    return this.loansService.findByCustomer(user.customerId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.loansService.findOne(id, user);
  }

  @Get(':id/installments')
  async findInstallments(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    const loan = await this.loansService.findOne(id, user);
    return loan.installments;
  }
}
