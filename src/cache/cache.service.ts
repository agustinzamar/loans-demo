import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.clear();
  }

  /**
   * Invalidate cache for a specific entity
   * Clears both the individual item and the list cache
   */
  async invalidateEntity(entity: string, id?: string | number): Promise<void> {
    if (id !== undefined) {
      await this.cacheManager.del(`${entity}:${id}`);
    }
    await this.cacheManager.del(`${entity}:list`);
  }

  /**
   * Invalidate cache for nested resources
   * Also invalidates the parent entity cache
   */
  async invalidateNested(
    parentEntity: string,
    parentId: string | number,
    childEntity: string,
    childId?: string | number,
  ): Promise<void> {
    // Invalidate child
    if (childId !== undefined) {
      await this.cacheManager.del(
        `${parentEntity}:${parentId}:${childEntity}:${childId}`,
      );
    }
    await this.cacheManager.del(`${parentEntity}:${parentId}:${childEntity}`);

    // Also invalidate parent
    await this.invalidateEntity(parentEntity, parentId);
  }

  generateKey(entity: string, id: string | number): string {
    return `${entity}:${id}`;
  }

  generateListKey(entity: string): string {
    return `${entity}:list`;
  }

  generateNestedKey(
    parentEntity: string,
    parentId: string | number,
    childEntity: string,
    childId?: string | number,
  ): string {
    if (childId !== undefined) {
      return `${parentEntity}:${parentId}:${childEntity}:${childId}`;
    }
    return `${parentEntity}:${parentId}:${childEntity}`;
  }
}
