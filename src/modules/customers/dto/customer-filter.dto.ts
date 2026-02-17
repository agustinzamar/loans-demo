import { IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../enums/document-type.enum';

export class CustomerFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by document type',
    enum: DocumentType,
    example: DocumentType.DNI,
  })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @ApiPropertyOptional({
    description: 'Filter by start date (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  createdAtGte?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  createdAtLte?: string;

  @ApiPropertyOptional({
    description: 'Filter customers with overdue loans',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasOverdueLoans?: boolean;
}
