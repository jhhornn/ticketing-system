# Jaeger Query and Search Cheat Sheet

This sheet provides Jaeger-focused search patterns for trace investigation.

## Basic Trace Search

In Jaeger UI (<http://localhost:16686>):

1. Choose service: `ticketing-api`
2. Narrow by operation when needed
3. Filter by tags for precise debugging

## Useful Tag Filters

Use these common tags when searching traces:

- `request_id=<value>`
- `user_id=<value>`
- `outcome=error`
- `status_code=500`
- `method=POST`
- `path=/bookings/confirm`

## Debugging Playbooks

### Find failed booking requests

- Service: `ticketing-api`
- Operation contains: `bookings`
- Tags: `outcome=error`

### Find slow requests

- Service: `ticketing-api`
- Set a minimum duration in the UI
- Sort by longest duration first

### Trace one customer issue end-to-end

- Filter by `request_id` (preferred)
- Open the trace and inspect child spans
- Check DB/Redis latency and retries

### Investigate 5xx spikes

- Filter: `status_code=500`
- Compare operations that fail most often
- Inspect shared failing dependencies

## Correlation Tips

1. Ensure logs include `trace_id` and `span_id`.
2. Keep `OTEL_SERVICE_NAME` stable across deployments.
3. Add `GIT_COMMIT`, `APP_VERSION`, and `REGION` for release correlation.

## Common Tags to Emit from App Code

- Request: `method`, `path`, `status_code`, `duration_ms`
- User context: `user_id`, `user_tier`
- Business context: `booking_id`, `event_id`, `payment_method`
- Outcome: `outcome`, `error_type`

## Verification Commands

```bash
# Jaeger container is running
docker ps | grep ticketing-jaeger

# Backend emits logs while handling requests
curl http://localhost:3000/events
```
