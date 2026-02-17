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
import { Loan } from './loan.entity';
import { LoanPayment } from './loan-payment.entity';
import { InstallmentStatus } from '../enums/installment-status.enum';

@Entity('loan_installments')
@Index(['loanId'])
@Index(['status'])
@Index(['dueDate'])
export class LoanInstallment {
  @ApiProperty({ description: 'Installment unique identifier', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Loan ID associated with the installment',
    example: 1,
  })
  @Column({ name: 'loan_id', type: 'int', nullable: false })
  loanId: number;

  @ApiProperty({ description: 'Installment number (1-based)', example: 1 })
  @Column({ name: 'installment_number', type: 'int', nullable: false })
  installmentNumber: number;

  @ApiProperty({
    description: 'Due date for the installment',
    example: '2026-03-17',
  })
  @Column({ name: 'due_date', type: 'date', nullable: false })
  dueDate: Date;

  @ApiProperty({
    description: 'Principal amount for this installment',
    example: 833.33,
  })
  @Column({
    name: 'principal_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  principalAmount: number;

  @ApiProperty({
    description: 'Interest amount for this installment',
    example: 125.0,
  })
  @Column({
    name: 'interest_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  interestAmount: number;

  @ApiProperty({
    description: 'Total amount due for this installment (principal + interest)',
    example: 958.33,
  })
  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  totalAmount: number;

  @ApiProperty({ description: 'Amount already paid', example: 0 })
  @Column({
    name: 'paid_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
    default: 0,
  })
  paidAmount: number;

  @ApiProperty({ description: 'Remaining amount to be paid', example: 958.33 })
  @Column({
    name: 'remaining_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  remainingAmount: number;

  @ApiProperty({
    description: 'Installment status',
    enum: InstallmentStatus,
    example: InstallmentStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: InstallmentStatus,
    default: InstallmentStatus.PENDING,
    nullable: false,
  })
  status: InstallmentStatus;

  @ApiProperty({ description: 'Number of days overdue', example: 0 })
  @Column({ name: 'overdue_days', type: 'int', nullable: false, default: 0 })
  overdueDays: number;

  @ApiProperty({
    description: 'Penalty amount for overdue installment',
    example: 0,
  })
  @Column({
    name: 'penalty_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
    default: 0,
  })
  penaltyAmount: number;

  @ApiProperty({
    description: 'Date when the installment was paid',
    example: null,
    nullable: true,
  })
  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @ApiProperty({
    description: 'Loan associated with this installment',
    type: () => Loan,
  })
  @ManyToOne(() => Loan, (loan) => loan.installments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  @ApiProperty({
    description: 'Payments made for this installment',
    type: () => [LoanPayment],
  })
  @OneToMany(() => LoanPayment, (payment) => payment.installment, {
    cascade: true,
  })
  payments: LoanPayment[];

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
