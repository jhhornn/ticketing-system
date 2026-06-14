# Observability and Logging Guide

## Overview

This ticketing system uses a Jaeger-first observability model:

- Structured wide-event logs from the app logger
- Distributed traces from OpenTelemetry auto-instrumentation
- OTLP export pipeline for traces, metrics, and logs

The backend emits structured logs to stdout and exports telemetry to Jaeger via OTLP.

## Architecture

```text
NestJS API
  |- pino wide events -> stdout
  |- OpenTelemetry SDK -> OTLP HTTP/gRPC
                        -> Jaeger all-in-one

Jaeger UI
  |- Trace search and span details
  |- Service and operation filtering
  |- Tag-based debugging and correlation
```

## Components

1. LoggerService (`apps/backend/common/logger/logger.service.ts`)
2. RequestContextService (`apps/backend/common/logger/request-context.service.ts`)
3. LoggingMiddleware (`apps/backend/common/logger/logging.middleware.ts`)
4. OpenTelemetry bootstrap (`apps/backend/instrumentation.ts`)
5. Jaeger backend (`docker-compose.observability.yml`)

## Local Setup

1. Start Jaeger:

```bash
docker-compose -f docker-compose.observability.yml up -d
```

1. Start backend:

```bash
cd apps/backend
pnpm run dev
```

1. Open Jaeger UI:

- <http://localhost:16686>

1. Verify OTLP endpoint in `.env`:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=ticketing-api
```

## What to Look For in Jaeger

- Service: `ticketing-api`
- Operations: HTTP routes like `/bookings/confirm`, `/events/:id`
- Tags: `request_id`, `user_id`, `status_code`, `outcome`
- Timing: slow spans and repeated DB/Redis calls

## Logging Pattern

Use wide events: one rich, structured event per request outcome.

Good fields to include:

- `request_id`
- `user_id`
- `method`
- `path`
- `status_code`
- `outcome`
- `duration_ms`
- business context (`booking_id`, `payment_method`, `booking_total_cents`)

## Troubleshooting

### No traces in Jaeger

1. Confirm Jaeger is running:

```bash
docker ps | grep ticketing-jaeger
```

1. Confirm OTLP endpoint is reachable:

```bash
curl http://localhost:4318
```

1. Confirm backend is using instrumentation:

- Production entrypoint should preload `dist/instrumentation.js`.
- Development should import instrumentation before app bootstrap.

### Logs visible in terminal but not correlated in Jaeger

1. Ensure traces are active for incoming requests.
2. Confirm `trace_id` and `span_id` are present in structured logs.
3. Confirm `OTEL_SERVICE_NAME` is stable and matches UI filters.

## Best Practices

1. Keep `OTEL_SERVICE_NAME` stable by service.
2. Keep `GIT_COMMIT`, `APP_VERSION`, and `REGION` populated.
3. Add business context through `RequestContextService` close to domain logic.
4. Prefer structured fields over free-form log strings.
5. Avoid logging sensitive values (passwords, tokens, card data).

## References

- `apps/backend/instrumentation.ts`
- `apps/backend/common/logger/logger.service.ts`
- `docs/observability-getting-started.md`
