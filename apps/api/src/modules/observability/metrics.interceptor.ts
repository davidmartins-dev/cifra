import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service.js';

function extractRoutePath(req: Request): string {
  if (
    req.route &&
    typeof req.route === 'object' &&
    'path' in req.route &&
    typeof req.route.path === 'string'
  ) {
    return req.route.path;
  }
  return req.baseUrl || req.path || 'unknown';
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const start = performance.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.record(req, res, start);
        },
        error: () => {
          this.record(req, res, start);
        },
      }),
    );
  }

  private record(req: Request, res: Response, start: number): void {
    const durationSeconds = (performance.now() - start) / 1000;
    const method = req.method ?? 'GET';
    const route = extractRoutePath(req);
    const status = res.statusCode ?? 200;

    // Ignora endpoint do próprio scraping de métricas para não poluir
    if (route.includes('/metrics')) {
      return;
    }

    this.metricsService.recordRequest(method, route, status, durationSeconds);
  }
}
