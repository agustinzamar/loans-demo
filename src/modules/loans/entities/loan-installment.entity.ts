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
import { Loan } from './loan.entity';
import { LoanPayment } from './loan-payment.entity';
import { InstallmentStatus } from '../enums/installment-status.enum';

@Entity('loan_installments')
@Index(['loanId'])
@Index(['status'])
@Index(['dueDate'])
export class LoanInstallment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'loan_id', type: 'int', nullable: false })
  loanId: number;

  @Column({ name: 'installment_number', type: 'int', nullable: false })
  installmentNumber: number;

  @Column({ name: 'due_date', type: 'date', nullable: false })
  dueDate: Date;

  @Column({
    name: 'principal_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  principalAmount: number;

  @Column({
    name: 'interest_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  interestAmount: number;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  totalAmount: number;

  @Column({
    name: 'paid_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
    default: 0,
  })
  paidAmount: number;

  @Column({
    name: 'remaining_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  remainingAmount: number;

  @Column({
    type: 'enum',
    enum: InstallmentStatus,
    default: InstallmentStatus.PENDING,
    nullable: false,
  })
  status: InstallmentStatus;

  @Column({ name: 'overdue_days', type: 'int', nullable: false, default: 0 })
  overdueDays: number;

  @Column({
    name: 'penalty_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
    default: 0,
  })
  penaltyAmount: number;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @ManyToOne(() => Loan, (loan) => loan.installments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  @OneToMany(() => LoanPayment, (payment) => payment.installment, {
    cascade: true,
  })
  payments: LoanPayment[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
