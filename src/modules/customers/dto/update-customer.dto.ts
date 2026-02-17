import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../enums/document-type.enum';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ description: 'Customer first name', example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Customer last name', example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Document type',
    enum: DocumentType,
    example: DocumentType.DNI,
  })
  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @ApiPropertyOptional({ description: 'Document number', example: '12345678' })
  @IsString()
  @IsOptional()
  documentNumber?: string;
}
