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
    url: `${otlpEndpoint}/v1/traces`,
  }),

  // ── Metrics ───────────────────────────────────────────────────────────────
  // Exports HTTP request counts, durations, DB pool stats, etc.
  // Exported every 15 s; visible in Jaeger as metrics (v2+).
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${otlpEndpoint}/v1/metrics`,
    }),
    exportIntervalMillis: 15_000,
  }),

  // ── Logs ──────────────────────────────────────────────────────────────────
  // Forwards OTel LogRecords to Jaeger.
  // Wide-event pino logs are written to stdout and enriched with trace_id /
  // span_id so they can be correlated with Jaeger traces.
  logRecordProcessors: [
    new SimpleLogRecordProcessor(
      new OTLPLogExporter({
        url: `${otlpEndpoint}/v1/logs`,
      }),
    ),
  ],

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
