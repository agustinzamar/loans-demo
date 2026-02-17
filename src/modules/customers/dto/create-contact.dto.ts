import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType } from '../enums/contact-type.enum';

export class CreateContactDto {
  @ApiProperty({
    description: 'Contact type',
    enum: ContactType,
    example: ContactType.EMAIL,
  })
  @IsEnum(ContactType)
  type: ContactType;

  @ApiProperty({
    description: 'Contact value',
    example: 'john.doe@example.com',
  })
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: 'Contact label', example: 'Work email' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({
    description: 'Whether this is the primary contact',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
