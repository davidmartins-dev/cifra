import { describe, expect, it } from 'vitest';
import { MetricsService } from './metrics.service.js';

describe('MetricsService', () => {
  it('deve instanciar MetricsService e coletar métricas padrão', async () => {
    const service = new MetricsService();
    service.onModuleInit();

    const contentType = service.getContentType();
    expect(contentType).toContain('text/plain');

    const metricsOutput = await service.getMetrics();
    expect(metricsOutput).toContain('cifra_api_');
  });

  it('deve registrar requisições HTTP e observar histograma de duração', async () => {
    const service = new MetricsService();

    service.recordRequest('GET', '/api/v1/accounts', 200, 0.045);
    service.recordRequest('POST', '/api/v1/transactions', 201, 0.12);

    const metricsOutput = await service.getMetrics();
    expect(metricsOutput).toContain('cifra_http_requests_total{method="GET",route="/api/v1/accounts",status="200"} 1');
    expect(metricsOutput).toContain('cifra_http_requests_total{method="POST",route="/api/v1/transactions",status="201"} 1');
    expect(metricsOutput).toContain('cifra_http_request_duration_seconds');
  });

  it('deve incrementar métrica de negócio para transações financeiras', async () => {
    const service = new MetricsService();

    service.incrementFinancialTransaction('INCOME');
    service.incrementFinancialTransaction('EXPENSE');
    service.incrementFinancialTransaction('EXPENSE');

    const metricsOutput = await service.getMetrics();
    expect(metricsOutput).toContain('cifra_financial_transactions_total{type="INCOME"} 1');
    expect(metricsOutput).toContain('cifra_financial_transactions_total{type="EXPENSE"} 2');
  });
});
