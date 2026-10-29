import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

let otelSdk: NodeSDK | null = null;

export function initTelemetry(): NodeSDK | null {
  if (process.env.NODE_ENV === 'test' || process.env.ENABLE_TELEMETRY === 'false') {
    return null;
  }

  if (process.env.OTEL_LOG_LEVEL === 'debug') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

  const traceExporter = new OTLPTraceExporter({
    url: endpoint,
  });

  otelSdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || 'cifra-api',
    traceExporter,
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
    ],
  });

  try {
    otelSdk.start();
    // eslint-disable-next-line no-console
    console.log(`[OpenTelemetry] Tracing iniciado com sucesso enviando para ${endpoint}`);
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('[OpenTelemetry] Falha ao iniciar SDK de rastreamento:', error);
  }

  return otelSdk;
}

export async function shutdownTelemetry(): Promise<void> {
  if (otelSdk) {
    await otelSdk.shutdown();
    otelSdk = null;
  }
}
