import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(id);
  }

  @Get(':id/contacts')
  findContacts(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findContacts(id);
  }

  @Post(':id/contacts')
  addContact(
    @Param('id', ParseIntPipe) id: number,
    @Body() createContactDto: CreateContactDto,
  ) {
    return this.customersService.addContact(id, createContactDto);
  }

  @Patch(':id/contacts/:contactId')
  updateContact(
    @Param('id', ParseIntPipe) customerId: number,
    @Param('contactId', ParseIntPipe) contactId: number,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.customersService.updateContact(
      customerId,
      contactId,
      updateContactDto,
    );
  }

  @Delete(':id/contacts/:contactId')
  removeContact(
    @Param('id', ParseIntPipe) customerId: number,
    @Param('contactId', ParseIntPipe) contactId: number,
  ) {
    return this.customersService.removeContact(customerId, contactId);
  }
}
