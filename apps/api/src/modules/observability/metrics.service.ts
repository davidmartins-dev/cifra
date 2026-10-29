import { Injectable, OnModuleInit } from '@nestjs/common';
import client, { Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;
  private readonly requestsTotal: Counter<'method' | 'route' | 'status'>;
  private readonly requestDuration: Histogram<'method' | 'route' | 'status'>;
  private readonly financialTransactionsTotal: Counter<'type'>;

  constructor() {
    this.registry = new Registry();

    this.requestsTotal = new Counter({
      name: 'cifra_http_requests_total',
      help: 'Total de requisições HTTP recebidas na API do Cifra',
      labelNames: ['method', 'route', 'status'] as const,
      registers: [this.registry],
    });

    this.requestDuration = new Histogram({
      name: 'cifra_http_request_duration_seconds',
      help: 'Duração em segundos das requisições HTTP na API do Cifra',
      labelNames: ['method', 'route', 'status'] as const,
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.financialTransactionsTotal = new Counter({
      name: 'cifra_financial_transactions_total',
      help: 'Total de transações financeiras registradas por tipo',
      labelNames: ['type'] as const,
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    client.collectDefaultMetrics({
      register: this.registry,
      prefix: 'cifra_api_',
    });
  }

  recordRequest(method: string, route: string, status: number, durationSeconds: number): void {
    const labels = {
      method: method.toUpperCase(),
      route: route || 'unknown',
      status: String(status),
    };

    this.requestsTotal.inc(labels);
    this.requestDuration.observe(labels, durationSeconds);
  }

  incrementFinancialTransaction(type: string): void {
    this.financialTransactionsTotal.inc({ type });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
