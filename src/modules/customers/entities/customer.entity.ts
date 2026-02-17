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
import { ApiProperty } from '@nestjs/swagger';
import { CustomerContact } from './customer-contact.entity';
import { User } from '../../users/entities/user.entity';
import { DocumentType } from '../enums/document-type.enum';

@Entity('customers')
@Index(['documentType', 'documentNumber'], { unique: true })
export class Customer {
  @ApiProperty({ description: 'Customer unique identifier', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Customer first name', example: 'John' })
  @Column({ name: 'first_name', type: 'varchar', length: 255, nullable: false })
  firstName: string;

  @ApiProperty({ description: 'Customer last name', example: 'Doe' })
  @Column({ name: 'last_name', type: 'varchar', length: 255, nullable: false })
  lastName: string;

  @ApiProperty({
    description: 'Document type',
    enum: DocumentType,
    example: DocumentType.DNI,
  })
  @Column({
    name: 'document_type',
    type: 'enum',
    enum: DocumentType,
    nullable: false,
  })
  documentType: DocumentType;

  @ApiProperty({ description: 'Document number', example: '12345678' })
  @Column({
    name: 'document_number',
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  documentNumber: string;

  @ApiProperty({
    description: 'Associated user ID',
    example: 1,
    nullable: true,
  })
  @Column({ name: 'user_id', type: 'int', nullable: true, unique: true })
  userId: number | null;

  @OneToOne(() => User, (user) => user.customer, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @ApiProperty({ description: 'Customer contacts', type: [CustomerContact] })
  @OneToMany(() => CustomerContact, (contact) => contact.customer, {
    cascade: true,
  })
  contacts: CustomerContact[];

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Soft deletion timestamp', nullable: true })
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
