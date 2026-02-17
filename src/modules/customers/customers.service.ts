import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { Customer } from './entities/customer.entity';
import { CustomerContact } from './entities/customer-contact.entity';
import { User } from '../users/entities/user.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Role } from '../../common/enums/role.enum';
import {
  PaginationService,
  PaginationOptions,
} from '../../common/services/pagination.service';
import { PaginatedResponseDto } from '../../common/dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerContact)
    private readonly contactRepository: Repository<CustomerContact>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly paginationService: PaginationService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const { email, password, contacts, ...customerData } = createCustomerDto;

    return await this.dataSource.transaction(async (manager) => {
      const customerRepository = manager.getRepository(Customer);
      const contactRepository = manager.getRepository(CustomerContact);
      const userRepository = manager.getRepository(User);

      // Check if customer with same document already exists
      const existingCustomer = await customerRepository.findOne({
        where: {
          documentType: customerData.documentType,
          documentNumber: customerData.documentNumber,
        },
      });

      if (existingCustomer) {
        throw new ConflictException(
          'Customer with this document already exists',
        );
      }

      let userId: number | null = null;

      // If email is provided, create user
      if (email) {
        const existingUser = await userRepository.findOne({
          where: { email },
        });

        if (existingUser) {
          throw new ConflictException('User with this email already exists');
        }

        // Use provided password or generate random one
        const userPassword = password || Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(userPassword, 10);

        const newUser = userRepository.create({
          name: `${customerData.firstName} ${customerData.lastName}`,
          email,
          password: hashedPassword,
          role: Role.CUSTOMER,
        });

        const savedUser = await userRepository.save(newUser);
        userId = savedUser.id;
      }

      const customer = customerRepository.create({
        ...customerData,
        userId,
      });

      const savedCustomer = await customerRepository.save(customer);

      // Create contacts if provided
      if (contacts && contacts.length > 0) {
        const contactEntities = contacts.map((contact) =>
          contactRepository.create({
            ...contact,
            customerId: savedCustomer.id,
          }),
        );
        await contactRepository.save(contactEntities);
      }

      // Return customer with contacts
      const result = (await customerRepository.findOne({
        where: { id: savedCustomer.id },
        relations: ['contacts'],
      })) as Customer;

      // Invalidate customers list cache
      await this.cacheManager.del('customers:list');

      return result;
    });
  }

  async findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponseDto<Customer>> {
    return this.paginationService.paginate(this.customerRepository, options, {
      relations: ['contacts'],
      filterableFields: [
        'documentType',
        'documentNumber',
        'firstName',
        'lastName',
        'createdAt',
      ],
      searchFields: ['firstName', 'lastName', 'documentNumber', 'email'],
    });
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['contacts'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);

    if (updateCustomerDto.documentType || updateCustomerDto.documentNumber) {
      const existingCustomer = await this.customerRepository.findOne({
        where: {
          documentType: updateCustomerDto.documentType || customer.documentType,
          documentNumber:
            updateCustomerDto.documentNumber || customer.documentNumber,
        },
      });

      if (existingCustomer && existingCustomer.id !== id) {
        throw new ConflictException(
          'Customer with this document already exists',
        );
      }
    }

    Object.assign(customer, updateCustomerDto);
    const updatedCustomer = await this.customerRepository.save(customer);

    // Invalidate caches
    await this.cacheManager.del(`customers:${id}`);
    await this.cacheManager.del('customers:list');
    await this.cacheManager.del(`customers:${id}:contacts`);

    return updatedCustomer;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.customerRepository.softDelete(id);

    // Invalidate caches
    await this.cacheManager.del(`customers:${id}`);
    await this.cacheManager.del('customers:list');
    await this.cacheManager.del(`customers:${id}:contacts`);
  }

  async addContact(
    customerId: number,
    createContactDto: CreateContactDto,
  ): Promise<CustomerContact> {
    await this.findOne(customerId);

    const contact = this.contactRepository.create({
      ...createContactDto,
      customerId,
    });
    const savedContact = await this.contactRepository.save(contact);

    // Invalidate customer and contacts caches
    await this.cacheManager.del(`customers:${customerId}`);
    await this.cacheManager.del(`customers:${customerId}:contacts`);
    await this.cacheManager.del('customers:list');

    return savedContact;
  }

  async updateContact(
    customerId: number,
    contactId: number,
    updateContactDto: UpdateContactDto,
  ): Promise<CustomerContact> {
    const contact = await this.contactRepository.findOne({
      where: { id: contactId, customerId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    Object.assign(contact, updateContactDto);
    const updatedContact = await this.contactRepository.save(contact);

    // Invalidate customer and contacts caches
    await this.cacheManager.del(`customers:${customerId}`);
    await this.cacheManager.del(`customers:${customerId}:contacts`);

    return updatedContact;
  }

  async removeContact(customerId: number, contactId: number): Promise<void> {
    const contact = await this.contactRepository.findOne({
      where: { id: contactId, customerId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.contactRepository.remove(contact);

    // Invalidate customer and contacts caches
    await this.cacheManager.del(`customers:${customerId}`);
    await this.cacheManager.del(`customers:${customerId}:contacts`);
  }

  async findContacts(customerId: number): Promise<CustomerContact[]> {
    await this.findOne(customerId);

    return this.contactRepository.find({
      where: { customerId },
    });
  }

  async findContactsByUserId(userId: number): Promise<CustomerContact[]> {
    const customer = await this.customerRepository.findOne({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found for this user');
    }

    return this.contactRepository.find({
      where: { customerId: customer.id },
    });
  }
}
