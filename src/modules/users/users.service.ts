import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../common/enums/role.enum';
import {
  PaginationService,
  PaginationOptions,
} from '../../common/services/pagination.service';
import { PaginatedResponseDto } from '../../common/dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly paginationService: PaginationService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: Role.ADMIN,
    });
    const savedUser = await this.userRepository.save(user);

    // Invalidate users list cache
    await this.cacheManager.del('users:list');

    return savedUser;
  }

  async findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponseDto<User>> {
    return this.paginationService.paginate(this.userRepository, options, {
      filterableFields: ['role', 'name', 'email', 'createdAt', 'updatedAt'],
      searchFields: ['name', 'email'],
    });
  }

  async findAllWithDeleted(includeDeleted = false): Promise<User[]> {
    return this.userRepository.find({
      withDeleted: includeDeleted,
    });
  }

  async findOne(id: number, includeDeleted = false): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      withDeleted: includeDeleted,
    });
  }

  async findByEmail(
    email: string,
    includeDeleted = false,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      withDeleted: includeDeleted,
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User | null> {
    const user = await this.findOne(id);
    if (!user) {
      return null;
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    // Invalidate caches
    await this.cacheManager.del(`users:${id}`);
    await this.cacheManager.del('users:list');
    await this.cacheManager.del('users:me');

    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.softDelete(id);

    // Invalidate caches
    await this.cacheManager.del(`users:${id}`);
    await this.cacheManager.del('users:list');
    await this.cacheManager.del('users:me');
  }
}
