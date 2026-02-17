import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { LoanInstallment } from './loan-installment.entity';

@Entity('loan_payments')
@Index(['installmentId'])
@Index(['paymentDate'])
export class LoanPayment {
  @ApiProperty({ description: 'Payment unique identifier', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Installment ID associated with the payment',
    example: 1,
  })
  @Column({ name: 'installment_id', type: 'int', nullable: false })
  installmentId: number;

  @ApiProperty({ description: 'Payment amount', example: 500.0 })
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  amount: number;

  @ApiProperty({ description: 'Payment date', example: '2026-02-17' })
  @Column({ name: 'payment_date', type: 'date', nullable: false })
  paymentDate: Date;

  @ApiProperty({
    description: 'Payment method',
    example: 'cash',
    nullable: true,
  })
  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentMethod: string | null;

  @ApiProperty({
    description: 'Payment notes or comments',
    example: 'Partial payment',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({
    description: 'Installment associated with this payment',
    type: () => LoanInstallment,
  })
  @ManyToOne(() => LoanInstallment, (installment) => installment.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'installment_id' })
  installment: LoanInstallment;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-02-17T10:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
