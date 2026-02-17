import { Injectable, Logger } from '@nestjs/common';
import {
  Repository,
  SelectQueryBuilder,
  Brackets,
  ObjectLiteral,
} from 'typeorm';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

export interface FilterOptions {
  searchFields?: string[];
  filterableFields?: string[];
  relations?: string[];
}

export interface PaginationOptions extends PaginationQueryDto {
  search?: string;
  filter?: Record<string, any>;
}

@Injectable()
export class PaginationService {
  private readonly logger = new Logger(PaginationService.name);

  async paginate<T extends ObjectLiteral>(
    repository: Repository<T>,
    options: PaginationOptions,
    filterOptions: FilterOptions = {},
  ): Promise<PaginatedResponseDto<T>> {
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortOrder = 'DESC',
      search,
      filter,
    } = options;
    const skip = (page - 1) * limit;

    // Build base query
    let queryBuilder = repository.createQueryBuilder('entity');

    // Add relations if specified
    if (filterOptions.relations?.length) {
      filterOptions.relations.forEach((relation) => {
        queryBuilder = queryBuilder.leftJoinAndSelect(
          `entity.${relation}`,
          relation,
        );
      });
    }

    // Apply search
    if (search && filterOptions.searchFields?.length) {
      queryBuilder = this.applySearch(
        queryBuilder,
        search,
        filterOptions.searchFields,
      );
    }

    // Apply filters
    if (filter && filterOptions.filterableFields?.length) {
      queryBuilder = this.applyFilters(
        queryBuilder,
        filter,
        filterOptions.filterableFields,
      );
    }

    // Get total count
    const totalQuery = queryBuilder.clone();
    const total = await totalQuery.getCount();

    // Apply sorting
    if (sortBy) {
      queryBuilder = queryBuilder.orderBy(`entity.${sortBy}`, sortOrder);
    } else {
      queryBuilder = queryBuilder.orderBy('entity.createdAt', 'DESC');
    }

    // Apply pagination
    queryBuilder = queryBuilder.skip(skip).take(limit);

    // Execute query
    const data = await queryBuilder.getMany();

    return new PaginatedResponseDto(
      data,
      total,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  private applySearch<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    search: string,
    searchFields: string[],
  ): SelectQueryBuilder<T> {
    const searchTerm = `%${search}%`;

    return queryBuilder.andWhere(
      new Brackets((qb) => {
        searchFields.forEach((field, index) => {
          const paramName = `search${index}`;
          if (index === 0) {
            qb.where(`entity.${field} ILIKE :${paramName}`, {
              [paramName]: searchTerm,
            });
          } else {
            qb.orWhere(`entity.${field} ILIKE :${paramName}`, {
              [paramName]: searchTerm,
            });
          }
        });
      }),
    );
  }

  private applyFilters<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    filter: Record<string, any>,
    filterableFields: string[],
  ): SelectQueryBuilder<T> {
    Object.entries(filter).forEach(([key, value]) => {
      if (!filterableFields.includes(key)) {
        // Lenient: log unknown filters but don't throw
        this.logger.debug(`Ignoring unknown filter field: ${key}`);
        return;
      }

      if (value === null || value === undefined) {
        return;
      }

      // Handle nested operators (e.g., { amount: { gte: 1000 } })
      if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        value !== null
      ) {
        const filterObj = value as Record<string, unknown>;
        Object.entries(filterObj).forEach(([operator, operatorValue]) => {
          queryBuilder = this.applyOperator(
            queryBuilder,
            key,
            operator,
            operatorValue,
          );
        });
      } else {
        // Simple equality
        const paramName = `filter_${key}`;
        const params: Record<string, unknown> = {};
        params[paramName] = value;
        queryBuilder = queryBuilder.andWhere(
          `entity.${key} = :${paramName}`,
          params,
        );
      }
    });

    return queryBuilder;
  }

  private applyOperator<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    field: string,
    operator: string,
    value: unknown,
  ): SelectQueryBuilder<T> {
    const paramName = `filter_${field}_${operator}`;
    const params: Record<string, unknown> = {};

    switch (operator) {
      case 'eq':
        params[paramName] = value;
        return queryBuilder.andWhere(`entity.${field} = :${paramName}`, params);
      case 'neq':
        params[paramName] = value;
        return queryBuilder.andWhere(
          `entity.${field} != :${paramName}`,
          params,
        );
      case 'gt':
        params[paramName] = value;
        return queryBuilder.andWhere(`entity.${field} > :${paramName}`, params);
      case 'gte':
        params[paramName] = value;
        return queryBuilder.andWhere(
          `entity.${field} >= :${paramName}`,
          params,
        );
      case 'lt':
        params[paramName] = value;
        return queryBuilder.andWhere(`entity.${field} < :${paramName}`, params);
      case 'lte':
        params[paramName] = value;
        return queryBuilder.andWhere(
          `entity.${field} <= :${paramName}`,
          params,
        );
      case 'like':
        params[paramName] = `%${String(value)}%`;
        return queryBuilder.andWhere(
          `entity.${field} ILIKE :${paramName}`,
          params,
        );
      case 'in':
        params[paramName] = Array.isArray(value) ? value : [value];
        return queryBuilder.andWhere(
          `entity.${field} IN (:...${paramName})`,
          params,
        );
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          const betweenParams: Record<string, unknown> = {};
          betweenParams[`${paramName}_start`] = value[0];
          betweenParams[`${paramName}_end`] = value[1];
          return queryBuilder.andWhere(
            `entity.${field} BETWEEN :${paramName}_start AND :${paramName}_end`,
            betweenParams,
          );
        }
        return queryBuilder;
      default:
        this.logger.debug(`Unknown operator: ${operator}`);
        return queryBuilder;
    }
  }
}
