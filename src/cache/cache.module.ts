import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isEnabled = configService.get('CACHE_ENABLED');

        if (!isEnabled) {
          return {
            store: 'memory' as const,
            ttl: 0,
          };
        }

        const host = configService.get('REDIS_HOST');
        const port = configService.get('REDIS_PORT');
        const password = configService.get('REDIS_PASSWORD');
        const ttl = configService.get('REDIS_TTL');

        return {
          store: await redisStore({
            socket: {
              host,
              port,
            },
            password: password || undefined,
            ttl: ttl * 1000,
          }),
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheModule, CacheService],
})
export class AppCacheModule {}
