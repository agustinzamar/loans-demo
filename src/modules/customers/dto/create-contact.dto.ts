import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ContactType } from '../enums/contact-type.enum';

export class CreateContactDto {
  @IsEnum(ContactType)
  type: ContactType;

  @IsString()
  value: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
