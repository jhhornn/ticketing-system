/**
 * OpenTelemetry Instrumentation
 *
 * IMPORTANT: This file MUST be the first import in main.ts so that OTel
 * can patch Node.js modules (HTTP, Express, pg, Redis) before they load.
 *
 * Every signal (traces, metrics, logs) fans out to each enabled destination:
 *
 *   1. Generic OTLP endpoint (Jaeger locally, or any collector/vendor)
 *        OTEL_EXPORTER_OTLP_ENDPOINT/v1/{traces,metrics,logs}
 *      Enabled when OTEL_EXPORTER_OTLP_ENDPOINT (or a per-signal endpoint) is
 *      set, and by default outside production (http://localhost:4318).
 *
 *   2. PostHog (Logs, Metrics, Tracing)
 *        POSTHOG_HOST/i/v1/{traces,metrics,logs}  (Bearer POSTHOG_API_KEY)
 *      Enabled when POSTHOG_API_KEY is set. Choose signals with
 *      POSTHOG_OTEL_SIGNALS (default "traces,metrics,logs"; "none" disables).
 *
 * Run Jaeger locally: docker compose -f docker-compose.observability.yml up
 * View traces at:    http://localhost:16686
 */

// Load .env BEFORE anything reads process.env.
// NestJS ConfigModule loads .env lazily during bootstrap — too late for OTel,
// which reads env vars the moment this module is imported.
import { resolve } from 'node:path';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: resolve(process.cwd(), '../../.env'), override: false });

import { NodeSDK, tracing } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { getDeploymentInfo } from './common/config/deployment-info.js';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

type Signal = 'traces' | 'metrics' | 'logs';
const ALL_SIGNALS: Signal[] = ['traces', 'metrics', 'logs'];

interface TelemetryDestination {
  name: string;
  signals: Signal[];
  url: (signal: Signal) => string;
  headers: (signal: Signal) => Record<string, string> | undefined;
}

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

function parseSignals(raw: string | undefined): Signal[] {
  if (raw === undefined) return ALL_SIGNALS;
  const requested = raw.split(',').map((item) => item.trim().toLowerCase());
  return ALL_SIGNALS.filter((signal) => requested.includes(signal));
}

// ── Destination 1: generic OTLP endpoint (Jaeger / collector) ───────────────
const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';

const perSignalEndpoints: Record<Signal, string | undefined> = {
  traces: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  metrics: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
  logs: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
};

const defaultHeaders = parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);
const perSignalHeaders: Record<Signal, Record<string, string> | undefined> = {
  traces: parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS),
  metrics: parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_METRICS_HEADERS),
  logs: parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_LOGS_HEADERS),
};

function resolveSignalUrl(signal: Signal): string {
  const perSignal = perSignalEndpoints[signal];
  if (perSignal) return perSignal;
  const normalized = otlpEndpoint.replace(/\/$/, '');

  if (/\/v1\/(traces|metrics|logs)$/.test(normalized)) {
    return normalized;
  }

  return `${normalized}/v1/${signal}`;
}

// In production, only export to a generic endpoint that was configured on
// purpose — otherwise every export would fail against localhost.
const genericOtlpConfigured =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT !== undefined ||
  Object.values(perSignalEndpoints).some(Boolean) ||
  process.env.NODE_ENV !== 'production';

// ── Destination 2: PostHog ─────────────────────────────────────────────────
const posthogApiKey = process.env.POSTHOG_API_KEY;
const posthogHost = (
  process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com'
).replace(/\/$/, '');
const posthogSignals = parseSignals(process.env.POSTHOG_OTEL_SIGNALS);

const destinations: TelemetryDestination[] = [];

if (genericOtlpConfigured) {
  destinations.push({
    name: 'otlp',
    signals: ALL_SIGNALS,
    url: resolveSignalUrl,
    headers: (signal) => perSignalHeaders[signal] ?? defaultHeaders,
  });
}

if (posthogApiKey && posthogSignals.length > 0) {
  destinations.push({
    name: 'posthog',
    signals: posthogSignals,
    url: (signal) => `${posthogHost}/i/v1/${signal}`,
    headers: () => ({ Authorization: `Bearer ${posthogApiKey}` }),
  });
}

function destinationsFor(signal: Signal): TelemetryDestination[] {
  return destinations.filter((destination) =>
    destination.signals.includes(signal),
  );
}

// Optional extra log backends (generic OTLP headers apply)
const additionalLogsUrls = parseEndpointList(
  process.env.OTEL_EXPORTER_OTLP_LOGS_ADDITIONAL_ENDPOINTS,
);

/**
 * Resource attributes attached to every span, metric, and log record.
 * These are environment / deployment facts — not per-request data.
 *
 * WHY: Correlate issues with a specific service version, commit, or region
 * when querying traces in Jaeger.
 */
const deployment = getDeploymentInfo();
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'ticketing-api',
  [ATTR_SERVICE_VERSION]: deployment.version,
  'deployment.environment': deployment.environment,
  'service.commit_hash': deployment.commitHash,
  'service.region': deployment.region,
  'host.name': deployment.hostname,
});

const logExports = [
  ...destinationsFor('logs').map((destination) => ({
    url: destination.url('logs'),
    headers: destination.headers('logs'),
  })),
  ...additionalLogsUrls.map((url) => ({
    url,
    headers: perSignalHeaders.logs ?? defaultHeaders,
  })),
].filter(
  (target, index, all) =>
    all.findIndex((other) => other.url === target.url) === index,
);

const sdk = new NodeSDK({
  resource,

  // ── Traces ────────────────────────────────────────────────────────────────
  // Auto-traces every HTTP request, DB query, Redis call, etc.
  // Sample with the standard env vars if volume gets high, e.g.
  //   OTEL_TRACES_SAMPLER=parentbased_traceidratio OTEL_TRACES_SAMPLER_ARG=0.2
  spanProcessors: destinationsFor('traces').map(
    (destination) =>
      new tracing.BatchSpanProcessor(
        new OTLPTraceExporter({
          url: destination.url('traces'),
          headers: destination.headers('traces'),
        }),
      ),
  ),

  // ── Metrics ───────────────────────────────────────────────────────────────
  // HTTP request counts/durations, DB pool stats, etc. Exported every 15 s.
  metricReaders: destinationsFor('metrics').map(
    (destination) =>
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: destination.url('metrics'),
          headers: destination.headers('metrics'),
        }),
        exportIntervalMillis: 15_000,
      }),
  ),

  // ── Logs ──────────────────────────────────────────────────────────────────
  // LoggerService bridges every pino wide event into an OTel LogRecord
  // (with trace_id / span_id), so logs link to their traces. Batched so a
  // remote backend isn't hit with one HTTP request per log line.
  logRecordProcessors: logExports.map(
    ({ url, headers }) =>
      new BatchLogRecordProcessor(new OTLPLogExporter({ url, headers })),
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

let shutdownPromise: Promise<void> | undefined;

/**
 * Flush and stop the OTel SDK. Called from Nest's shutdown lifecycle
 * (TelemetryShutdownService) after app modules have flushed, so nothing
 * logged during shutdown is lost. Safe to call more than once.
 */
export function shutdownTelemetry(): Promise<void> {
  shutdownPromise ??= sdk.shutdown().catch((error: unknown) => {
    console.error('OpenTelemetry shutdown failed:', error);
  });
  return shutdownPromise;
}
