import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserToken } from '../../auth/entities/user-token.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Role } from '../../../common/enums/role.enum';

@Entity('users')
export class User {
  @ApiProperty({ description: 'User unique identifier', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @ApiProperty({ description: 'User password (not returned in API responses)' })
  @Column({ type: 'varchar', length: 255, nullable: false, select: false })
  password: string;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.ADMIN,
    nullable: true,
  })
  @Column({
    type: 'enum',
    enum: Role,
    nullable: true,
  })
  role: Role | null;

  @OneToMany(() => UserToken, (token) => token.user)
  tokens: UserToken[];

  @OneToOne(() => Customer, (customer) => customer.user)
  customer: Customer | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;

  @ApiProperty({ description: 'Soft deletion timestamp', nullable: true })
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}
