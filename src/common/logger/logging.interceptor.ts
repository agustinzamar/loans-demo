import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggingService } from './logging.service';
import { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, headers, ip } = request;
    const userAgent = String(headers['user-agent'] ?? 'unknown');
    const userId = request.user?.id;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.logRequest(
            method,
            url,
            response.statusCode,
            duration,
            userAgent,
            ip ?? 'unknown',
            userId,
          );
        },
        error: (error: Error | HttpException) => {
          const duration = Date.now() - startTime;
          const statusCode =
            error instanceof HttpException
              ? error.getStatus()
              : 'status' in error && typeof error.status === 'number'
                ? error.status
                : 500;

          this.logger.logRequest(
            method,
            url,
            statusCode,
            duration,
            userAgent,
            ip ?? 'unknown',
            userId,
          );
        },
      }),
    );
  }
}
