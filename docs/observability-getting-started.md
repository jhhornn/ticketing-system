# Getting Started with Observability

This guide sets up Jaeger-only observability for local development.

## What You Will Set Up

- Jaeger all-in-one backend
- OTLP telemetry export from the backend
- Trace-driven debugging in Jaeger UI

## Prerequisites

- Docker and Docker Compose
- Backend dependencies installed

## Step 1: Start Jaeger

```bash
# From repo root
docker-compose -f docker-compose.observability.yml up -d
```

Verify:

```bash
docker ps | grep ticketing-jaeger
```

Expected:

- `ticketing-jaeger`

## Step 2: Confirm Environment Variables

In `.env`:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=ticketing-api
```

Optional but recommended:

```bash
APP_VERSION=1.0.0
GIT_COMMIT=local
REGION=local
```

## Step 3: Start Backend

```bash
cd apps/backend
pnpm run dev
```

## Step 4: Generate Traffic

```bash
curl http://localhost:3000/events
curl http://localhost:3000/api
```

## Step 5: Inspect in Jaeger

Open <http://localhost:16686>

1. Select service: `ticketing-api`
2. Search recent traces
3. Open a trace and inspect:
   - Root request span
   - DB/Redis child spans
   - Request tags and duration

## Step 6: Add Business Context

In a service, enrich request context:

```typescript
this.requestContext.addBusinessContext({
  booking_id: booking.id,
  booking_total_cents: booking.total,
  payment_method: dto.paymentMethod,
});
```

These fields improve debugging and trace/log correlation.

## Common Checks

### Jaeger UI is up but no data

- Ensure backend is running.
- Ensure `OTEL_EXPORTER_OTLP_ENDPOINT` is `http://localhost:4318`.
- Make at least one API request after startup.

### Wrong service name in UI

- Check `OTEL_SERVICE_NAME` in `.env`.
- Restart backend after changing env vars.

### Missing commit/region metadata

- Set `GIT_COMMIT` and `REGION` in environment.

## Next Steps

- Read `docs/observability.md` for architecture and best practices.
- Build dashboards/alerts on top of your central telemetry backend.
