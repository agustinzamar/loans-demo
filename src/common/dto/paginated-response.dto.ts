import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total: number;

  @ApiProperty({ description: 'Total number of pages', example: 10 })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPreviousPage: boolean;

  @ApiProperty({
    description: 'Field sorted by',
    example: 'createdAt',
    required: false,
  })
  sortBy?: string;

  @ApiProperty({ description: 'Sort order', example: 'DESC', required: false })
  sortOrder?: string;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of data items', isArray: true })
  data: T[];

  @ApiProperty({ description: 'Pagination metadata', type: PaginationMetaDto })
  meta: PaginationMetaDto;

  constructor(
    data: T[],
    total: number,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: string,
  ) {
    const totalPages = Math.ceil(total / limit);

    this.data = data;
    this.meta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      sortBy,
      sortOrder,
    };
  }
}
