import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterQueryDto {
  @ApiPropertyOptional({
    description: 'Global search term (searches across multiple fields)',
    example: 'john smith',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      'Nested filters object (e.g., filter[status]=ACTIVE&filter[amount][gte]=1000)',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  filter?: Record<string, any>;
}
