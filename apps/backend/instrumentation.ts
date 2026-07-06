/**
 * OpenTelemetry Instrumentation
 *
 * IMPORTANT: This file MUST be the first import in main.ts so that OTel
 * can patch Node.js modules (HTTP, Express, pg, Redis, etc.) before they load.
 *
 * Telemetry destination: Jaeger (via OTLP HTTP)
 *   Traces  → OTEL_EXPORTER_OTLP_ENDPOINT/v1/traces
 *   Metrics → OTEL_EXPORTER_OTLP_ENDPOINT/v1/metrics
 *   Logs    → OTEL_EXPORTER_OTLP_ENDPOINT/v1/logs
 *
 * Default endpoint: http://localhost:4318 (Jaeger OTLP HTTP port)
 * Run Jaeger locally: docker run -p 16686:16686 -p 4317:4317 -p 4318:4318 jaegertracing/all-in-one:latest
 * View traces at:    http://localhost:16686
 */

// Load .env BEFORE anything reads process.env.
// NestJS ConfigModule loads .env lazily during bootstrap — too late for OTel,
// which reads env vars the moment this module is imported.
import { resolve } from 'node:path';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: resolve(process.cwd(), '../../.env'), override: false });

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';

function parseOtlpHeaders(
  rawHeaders?: string,
): Record<string, string> | undefined {
  if (!rawHeaders) return undefined;

  const entries = rawHeaders
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const idx = item.indexOf('=');
      if (idx <= 0) return null;
      const key = item.slice(0, idx).trim();
      const value = item.slice(idx + 1).trim();
      if (!key || !value) return null;
      return [key, value] as const;
    })
    .filter((item): item is readonly [string, string] => item !== null);

  if (!entries.length) return undefined;
  return Object.fromEntries(entries);
}

function parseEndpointList(rawEndpoints?: string): string[] {
  if (!rawEndpoints) return [];

  return rawEndpoints
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveSignalUrl(
  signal: 'traces' | 'metrics' | 'logs',
  perSignalEndpointEnv?: string,
): string {
  if (perSignalEndpointEnv) return perSignalEndpointEnv;
  const normalized = otlpEndpoint.replace(/\/$/, '');

  if (/\/v1\/(traces|metrics|logs)$/.test(normalized)) {
    return normalized;
  }

  return `${normalized}/v1/${signal}`;
}

const defaultHeaders = parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);
const tracesHeaders =
  parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS) ??
  defaultHeaders;
const metricsHeaders =
  parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_METRICS_HEADERS) ??
  defaultHeaders;
const logsHeaders =
  parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_LOGS_HEADERS) ??
  defaultHeaders;

const tracesUrl = resolveSignalUrl(
  'traces',
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
);
const metricsUrl = resolveSignalUrl(
  'metrics',
  process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
);
const logsUrl = resolveSignalUrl(
  'logs',
  process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
);
const additionalLogsUrls = parseEndpointList(
  process.env.OTEL_EXPORTER_OTLP_LOGS_ADDITIONAL_ENDPOINTS,
);
const allLogsExportUrls = Array.from(new Set([logsUrl, ...additionalLogsUrls]));

/**
 * Resource attributes attached to every span, metric, and log record.
 * These are environment / deployment facts — not per-request data.
 *
 * WHY: Correlate issues with a specific service version, commit, or region
 * when querying traces in Jaeger.
 */
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'ticketing-api',
  [ATTR_SERVICE_VERSION]: process.env.APP_VERSION ?? 'dev',
  'deployment.environment': process.env.NODE_ENV ?? 'development',
  'service.commit_hash': process.env.GIT_COMMIT ?? 'unknown',
  'service.region': process.env.REGION ?? 'local',
  'host.name': process.env.HOSTNAME ?? 'localhost',
});

const sdk = new NodeSDK({
  resource,

  // ── Traces ────────────────────────────────────────────────────────────────
  // Auto-traces every HTTP request, DB query, Redis call, etc.
  // Visible in Jaeger UI under the "ticketing-api" service.
  traceExporter: new OTLPTraceExporter({
    url: tracesUrl,
    headers: tracesHeaders,
  }),

  // ── Metrics ───────────────────────────────────────────────────────────────
  // Exports HTTP request counts, durations, DB pool stats, etc.
  // Exported every 15 s; visible in Jaeger as metrics (v2+).
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: metricsUrl,
      headers: metricsHeaders,
    }),
    exportIntervalMillis: 15_000,
  }),

  // ── Logs ──────────────────────────────────────────────────────────────────
  // Forwards OTel LogRecords to configured OTLP backends.
  // Supports fan-out with OTEL_EXPORTER_OTLP_LOGS_ADDITIONAL_ENDPOINTS.
  // Wide-event pino logs are written to stdout and enriched with trace_id /
  // span_id so they can be correlated with Jaeger traces.
  logRecordProcessors: allLogsExportUrls.map(
    (url) =>
      new SimpleLogRecordProcessor(
        new OTLPLogExporter({
          url,
          headers: logsHeaders,
        }),
      ),
  ),

  // ── Auto-instrumentation ──────────────────────────────────────────────────
  // Instruments: @nestjs/core, express, http, https, pg, ioredis, etc.
  // FS instrumentation is disabled — it generates thousands of noisy spans.
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

// Flush and shut down the SDK cleanly on SIGTERM (Docker / k8s stop signal)
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
});
