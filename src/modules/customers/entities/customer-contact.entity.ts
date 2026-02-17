import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { ContactType } from '../enums/contact-type.enum';

@Entity('customer_contacts')
export class CustomerContact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ContactType,
    nullable: false,
  })
  type: ContactType;

  @Column({ type: 'varchar', length: 500, nullable: false })
  value: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  label: string | null;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ name: 'customer_id', type: 'int', nullable: false })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.contacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
