import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { LoanInstallment } from './loan-installment.entity';

@Entity('loan_payments')
@Index(['installmentId'])
@Index(['paymentDate'])
export class LoanPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'installment_id', type: 'int', nullable: false })
  installmentId: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  amount: number;

  @Column({ name: 'payment_date', type: 'date', nullable: false })
  paymentDate: Date;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentMethod: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => LoanInstallment, (installment) => installment.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'installment_id' })
  installment: LoanInstallment;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
