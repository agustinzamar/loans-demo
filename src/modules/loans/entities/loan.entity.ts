import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../../customers/entities/customer.entity';
import { LoanInstallment } from './loan-installment.entity';
import { LoanStatus } from '../enums/loan-status.enum';
import { PaymentFrequency } from '../enums/payment-frequency.enum';

@Entity('loans')
@Index(['customerId'])
@Index(['status'])
export class Loan {
  @ApiProperty({ description: 'Loan unique identifier', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Customer ID associated with the loan',
    example: 1,
  })
  @Column({ name: 'customer_id', type: 'int', nullable: false })
  customerId: number;

  @ApiProperty({ description: 'Principal loan amount', example: 10000.0 })
  @Column({
    name: 'principal_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  principalAmount: number;

  @ApiProperty({
    description: 'Annual interest rate as percentage (10 = 10%)',
    example: 15,
  })
  @Column({
    name: 'annual_interest_rate',
    type: 'int',
    nullable: false,
    comment: 'Annual interest rate as percentage (10 = 10%)',
  })
  annualInterestRate: number;

  @ApiProperty({
    description: 'Payment frequency',
    enum: PaymentFrequency,
    example: PaymentFrequency.MONTHLY,
  })
  @Column({
    name: 'payment_frequency',
    type: 'enum',
    enum: PaymentFrequency,
    nullable: false,
  })
  paymentFrequency: PaymentFrequency;

  @ApiProperty({ description: 'Total number of payment periods', example: 12 })
  @Column({ name: 'total_periods', type: 'int', nullable: false })
  totalPeriods: number;

  @ApiProperty({
    description: 'Total amount to be paid (principal + interest)',
    example: 11500.0,
  })
  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Loan status',
    enum: LoanStatus,
    example: LoanStatus.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: LoanStatus,
    default: LoanStatus.SIMULATED,
    nullable: false,
  })
  status: LoanStatus;

  @ApiProperty({
    description: 'Daily overdue interest rate as percentage (1 = 1%)',
    example: 1,
  })
  @Column({
    name: 'overdue_interest_rate',
    type: 'int',
    nullable: false,
    default: 1,
    comment: 'Daily overdue interest rate as percentage (1 = 1%)',
  })
  overdueInterestRate: number;

  @ApiProperty({
    description: 'Loan start date',
    example: '2026-02-17',
    nullable: true,
  })
  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date | null;

  @ApiProperty({
    description: 'Loan end date',
    example: '2027-02-17',
    nullable: true,
  })
  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @ApiProperty({
    description: 'Date when the loan was simulated',
    example: '2026-02-17T10:00:00.000Z',
  })
  @Column({ name: 'simulated_at', type: 'timestamp', nullable: false })
  simulatedAt: Date;

  @ApiProperty({
    description: 'Date when the loan was activated',
    example: '2026-02-17T10:30:00.000Z',
    nullable: true,
  })
  @Column({ name: 'activated_at', type: 'timestamp', nullable: true })
  activatedAt: Date | null;

  @ApiProperty({
    description: 'Date when the loan was fully paid',
    example: '2027-02-17T10:00:00.000Z',
    nullable: true,
  })
  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @ApiProperty({
    description: 'Date when the loan was marked as defaulted',
    example: '2027-03-17T10:00:00.000Z',
    nullable: true,
  })
  @Column({ name: 'defaulted_at', type: 'timestamp', nullable: true })
  defaultedAt: Date | null;

  @ApiProperty({
    description: 'Customer associated with the loan',
    type: () => Customer,
  })
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ApiProperty({
    description: 'Loan installments',
    type: () => [LoanInstallment],
  })
  @OneToMany(() => LoanInstallment, (installment) => installment.loan, {
    cascade: true,
  })
  installments: LoanInstallment[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-02-17T10:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-02-17T10:00:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Soft deletion timestamp',
    example: null,
    nullable: true,
  })
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
