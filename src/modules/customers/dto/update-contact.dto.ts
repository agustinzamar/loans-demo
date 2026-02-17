import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ContactType } from '../enums/contact-type.enum';

export class UpdateContactDto {
  @IsEnum(ContactType)
  @IsOptional()
  type?: ContactType;

  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
