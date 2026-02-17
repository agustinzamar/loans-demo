import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType } from '../enums/contact-type.enum';

export class UpdateContactDto {
  @ApiPropertyOptional({
    description: 'Contact type',
    enum: ContactType,
    example: ContactType.PHONE,
  })
  @IsEnum(ContactType)
  @IsOptional()
  type?: ContactType;

  @ApiPropertyOptional({
    description: 'Contact value',
    example: '+54 11 1234-5678',
  })
  @IsString()
  @IsOptional()
  value?: string;

  @ApiPropertyOptional({
    description: 'Contact label',
    example: 'Mobile phone',
  })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({
    description: 'Whether this is the primary contact',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
