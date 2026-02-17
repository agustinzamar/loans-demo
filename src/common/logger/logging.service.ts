import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

export interface LogContext {
  [key: string]: unknown;
}

interface LogInfo {
  level: string;
  message: unknown;
  timestamp?: string;
  context?: string;
  service?: string;
  environment?: string;
  [key: string]: unknown;
}

@Injectable()
export class LoggingService implements LoggerService {
  private logger: winston.Logger;
  private context: string = 'Application';

  constructor(private configService: ConfigService) {
    this.initializeLogger();
  }

  private initializeLogger(): void {
    const logLevel = this.configService.get<string>('LOG_LEVEL', 'info');
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    const customFormat = winston.format.printf((info: LogInfo) => {
      const logEntry = {
        timestamp: info.timestamp,
        level: info.level.toUpperCase(),
        message: String(info.message),
        context: info.context || this.context,
        service: info.service,
        environment: info.environment,
      };

      // Add any additional metadata (except internal winston fields)
      const internalFields = [
        'level',
        'message',
        'timestamp',
        'context',
        'service',
        'environment',
        'splat',
      ];
      Object.keys(info).forEach((key) => {
        if (!internalFields.includes(key)) {
          (logEntry as Record<string, unknown>)[key] = info[key];
        }
      });

      return JSON.stringify(logEntry);
    });

    this.logger = winston.createLogger({
      level: logLevel,
      defaultMeta: {
        service: 'loans-api',
        environment: nodeEnv,
      },
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        customFormat,
      ),
      transports: [new winston.transports.Console()],
      exitOnError: false,
    });
  }

  setContext(context: string): void {
    this.context = context;
  }

  private logWithContext(
    level: string,
    message: string,
    context?: string,
    meta?: LogContext,
  ): void {
    this.logger.log(level, message, {
      context: context || this.context,
      ...meta,
    });
  }

  log(message: string, context?: string, meta?: LogContext): void {
    this.logWithContext('info', message, context, meta);
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    meta?: LogContext,
  ): void {
    this.logWithContext('error', message, context, { trace, ...meta });
  }

  warn(message: string, context?: string, meta?: LogContext): void {
    this.logWithContext('warn', message, context, meta);
  }

  debug(message: string, context?: string, meta?: LogContext): void {
    this.logWithContext('debug', message, context, meta);
  }

  verbose(message: string, context?: string, meta?: LogContext): void {
    this.logWithContext('verbose', message, context, meta);
  }

  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userAgent?: string,
    ip?: string,
    userId?: string,
  ): void {
    this.logWithContext('info', `${method} ${url} - ${statusCode}`, 'HTTP', {
      httpMethod: method,
      url,
      statusCode,
      durationMs: duration,
      userAgent,
      ip,
      userId,
    });
  }

  logError(error: Error, context?: string, meta?: LogContext): void {
    this.logWithContext('error', error.message, context, {
      stack: error.stack,
      ...meta,
    });
  }
}
