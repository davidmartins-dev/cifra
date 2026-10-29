import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { MetricsController } from './metrics.controller.js';
import type { MetricsService } from './metrics.service.js';

describe('MetricsController', () => {
  it('deve retornar texto de métricas e definir Content-Type apropriado', async () => {
    const mockMetricsService = {
      getMetrics: vi.fn().mockResolvedValue('# HELP cifra_http_requests_total\n# TYPE cifra_http_requests_total counter\n'),
      getContentType: vi.fn().mockReturnValue('text/plain; version=0.0.4; charset=utf-8'),
    } as unknown as MetricsService;

    const controller = new MetricsController(mockMetricsService);

    const mockResponse = {
      setHeader: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getMetrics(mockResponse);

    expect(mockMetricsService.getMetrics).toHaveBeenCalled();
    expect(mockMetricsService.getContentType).toHaveBeenCalled();
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/plain; version=0.0.4; charset=utf-8',
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalledWith(
      expect.stringContaining('cifra_http_requests_total'),
    );
  });
});
