import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './env.validation';

@Injectable()
export class ConfigService extends NestConfigService<EnvironmentVariables> {
  get<T extends keyof EnvironmentVariables>(key: T): EnvironmentVariables[T] {
    return super.get(key)!;
  }
}
