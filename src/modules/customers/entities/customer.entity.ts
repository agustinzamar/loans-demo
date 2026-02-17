import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CustomerContact } from './customer-contact.entity';
import { User } from '../../users/entities/user.entity';
import { DocumentType } from '../enums/document-type.enum';

@Entity('customers')
@Index(['documentType', 'documentNumber'], { unique: true })
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'first_name', type: 'varchar', length: 255, nullable: false })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 255, nullable: false })
  lastName: string;

  @Column({
    name: 'document_type',
    type: 'enum',
    enum: DocumentType,
    nullable: false,
  })
  documentType: DocumentType;

  @Column({
    name: 'document_number',
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  documentNumber: string;

  @Column({ name: 'user_id', type: 'int', nullable: true, unique: true })
  userId: number | null;

  @OneToOne(() => User, (user) => user.customer, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @OneToMany(() => CustomerContact, (contact) => contact.customer, {
    cascade: true,
  })
  contacts: CustomerContact[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
