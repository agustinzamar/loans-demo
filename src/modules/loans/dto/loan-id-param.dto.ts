import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LoanIdParamDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  id: number;
}
