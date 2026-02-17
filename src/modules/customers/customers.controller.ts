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
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Customer } from './entities/customer.entity';
import { CustomerContact } from './entities/customer-contact.entity';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(CacheInterceptor)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    type: Customer,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @CacheTTL(3600)
  @ApiOperation({ summary: 'Get all customers with pagination and filtering' })
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
    name: 'filter[documentType]',
    required: false,
    enum: ['DNI', 'PASSPORT', 'CUIT'],
    description: 'Filter by document type',
  })
  @ApiQuery({
    name: 'filter[hasOverdueLoans]',
    required: false,
    type: Boolean,
    description: 'Filter by overdue loans',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated customers',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @Query('search') search?: string,
    @Query('filter') filter?: Record<string, any>,
  ): Promise<PaginatedResponseDto<Customer>> {
    return this.customersService.findAll({
      ...paginationQuery,
      search,
      filter,
    });
  }

  @Get(':id')
  @CacheTTL(1800)
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns customer by ID',
    type: Customer,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Customer updated successfully',
    type: Customer,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer by ID (soft delete)' })
  @ApiParam({ name: 'id', description: 'Customer ID', type: Number })
  @ApiResponse({ status: 204, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(id);
  }

  @Get(':id/contacts')
  @CacheTTL(1800)
  @ApiOperation({ summary: 'Get customer contacts' })
  @ApiParam({ name: 'id', description: 'Customer ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns customer contacts',
    type: [CustomerContact],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  findContacts(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findContacts(id);
  }

  @Post(':id/contacts')
  @ApiOperation({ summary: 'Add contact to customer' })
  @ApiParam({ name: 'id', description: 'Customer ID', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Contact added successfully',
    type: CustomerContact,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  addContact(
    @Param('id', ParseIntPipe) id: number,
    @Body() createContactDto: CreateContactDto,
  ) {
    return this.customersService.addContact(id, createContactDto);
  }

  @Patch(':id/contacts/:contactId')
  @ApiOperation({ summary: 'Update customer contact' })
  @ApiParam({ name: 'id', description: 'Customer ID', type: Number })
  @ApiParam({ name: 'contactId', description: 'Contact ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Contact updated successfully',
    type: CustomerContact,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Customer or contact not found' })
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
  @ApiOperation({ summary: 'Remove customer contact' })
  @ApiParam({ name: 'id', description: 'Customer ID', type: Number })
  @ApiParam({ name: 'contactId', description: 'Contact ID', type: Number })
  @ApiResponse({ status: 204, description: 'Contact removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Customer or contact not found' })
  removeContact(
    @Param('id', ParseIntPipe) customerId: number,
    @Param('contactId', ParseIntPipe) contactId: number,
  ) {
    return this.customersService.removeContact(customerId, contactId);
  }
}
