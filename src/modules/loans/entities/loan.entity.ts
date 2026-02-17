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
import { Customer } from '../../customers/entities/customer.entity';
import { LoanInstallment } from './loan-installment.entity';
import { LoanStatus } from '../enums/loan-status.enum';
import { PaymentFrequency } from '../enums/payment-frequency.enum';

@Entity('loans')
@Index(['customerId'])
@Index(['status'])
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_id', type: 'int', nullable: false })
  customerId: number;

  @Column({
    name: 'principal_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  principalAmount: number;

  @Column({
    name: 'annual_interest_rate',
    type: 'int',
    nullable: false,
    comment: 'Annual interest rate as percentage (10 = 10%)',
  })
  annualInterestRate: number;

  @Column({
    name: 'payment_frequency',
    type: 'enum',
    enum: PaymentFrequency,
    nullable: false,
  })
  paymentFrequency: PaymentFrequency;

  @Column({ name: 'total_periods', type: 'int', nullable: false })
  totalPeriods: number;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: LoanStatus,
    default: LoanStatus.SIMULATED,
    nullable: false,
  })
  status: LoanStatus;

  @Column({
    name: 'overdue_interest_rate',
    type: 'int',
    nullable: false,
    default: 1,
    comment: 'Daily overdue interest rate as percentage (1 = 1%)',
  })
  overdueInterestRate: number;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ name: 'simulated_at', type: 'timestamp', nullable: false })
  simulatedAt: Date;

  @Column({ name: 'activated_at', type: 'timestamp', nullable: true })
  activatedAt: Date | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'defaulted_at', type: 'timestamp', nullable: true })
  defaultedAt: Date | null;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => LoanInstallment, (installment) => installment.loan, {
    cascade: true,
  })
  installments: LoanInstallment[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
