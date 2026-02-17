import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Customer } from './customer.entity';
import { ContactType } from '../enums/contact-type.enum';

@Entity('customer_contacts')
export class CustomerContact {
  @ApiProperty({ description: 'Contact unique identifier', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Contact type',
    enum: ContactType,
    example: ContactType.EMAIL,
  })
  @Column({
    type: 'enum',
    enum: ContactType,
    nullable: false,
  })
  type: ContactType;

  @ApiProperty({
    description: 'Contact value',
    example: 'john.doe@example.com',
  })
  @Column({ type: 'varchar', length: 500, nullable: false })
  value: string;

  @ApiProperty({
    description: 'Contact label',
    example: 'Work email',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  label: string | null;

  @ApiProperty({
    description: 'Whether this is the primary contact',
    example: true,
  })
  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @ApiProperty({ description: 'Customer ID', example: 1 })
  @Column({ name: 'customer_id', type: 'int', nullable: false })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.contacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
