# Getting Started with Observability

This guide walks you through setting up observability for the ticketing system from scratch.

## 🎯 What You'll Learn

- How to run the local observability stack (Loki + Promtail)
- How to view and query logs
- How to add business context to your code
- How to create alerts

## 📋 Prerequisites

- Docker and Docker Compose installed
- Your ticketing API running

## Step 1: Start the Observability Stack (5 minutes)

### Start Loki + Promtail

```bash
# From the project root
docker-compose -f docker-compose.observability.yml up -d

# Verify containers are running
docker ps | grep -E "loki|promtail"
```

You should see two containers:
- `ticketing-loki` (port 3100)
- `ticketing-promtail`

## Step 2: Start Your API (2 minutes)

```bash
cd apps/backend
pnpm run dev
```

Your API will start logging structured JSON events. Example:
```json
{
  "level": 30,
  "timestamp": "2026-02-04T10:30:45.123Z",
  "service": "ticketing-api",
  "version": "dev",
  "commit_hash": "unknown",
  "request_id": "abc-123-xyz",
  "method": "POST",
  "path": "/bookings/confirm",
  "status_code": 201,
  "outcome": "success",
  "duration_ms": 245
}
```

## Step 3: View Logs from Loki (5 minutes)

### Run Your First Query (Loki HTTP API)

Use this query via API:
```bash
curl -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={container="ticketing-api"} | json' \
  --data-urlencode 'limit=200'
```

You should see your API logs. Try these LogQL expressions:
```logql
{container="ticketing-api"} | json
```

**Show only errors:**
```logql
{container="ticketing-api"} | json | outcome="error"
```

**Show slow requests:**
```logql
{container="ticketing-api"} | json | duration_ms > 1000
```

**Show logs for a specific user:**
```logql
{container="ticketing-api"} | json | user_id="1"
```

## Step 4: Open Jaeger for Traces (2 minutes)

1. Open http://localhost:16686
2. Select your service (for example: `ticketing-api`)
3. Inspect request traces and span timings

## Step 5: Generate Some Traffic (5 minutes)

Let's create logs to visualize!

### Test the booking flow:

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"password123"}'

# Save the JWT token
export TOKEN="your_jwt_token_here"

# 2. Create a reservation
curl -X POST http://localhost:3000/events/1/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"seatIds":[1,2]}'

# 3. Query logs in Loki (same query as Step 3)
```

Query to see your reservations:
```logql
{container="ticketing-api"} | json | path=~"/reservations.*"
```

## Step 6: Add Business Context (10 minutes)

Now let's add custom business context to your logs!

### Example: Add context in a service

Open any service file (e.g., `apps/backend/api/booking/booking.service.ts`):

```typescript
import { RequestContextService } from '@/common/logger';

@Injectable()
export class BookingService {
  constructor(
    private readonly requestContext: RequestContextService,
  ) {}

  async confirmBooking(dto: ConfirmBookingDto) {
    // Add business context - will appear in logs automatically!
    this.requestContext.addBusinessContext({
      booking_event_id: dto.eventId,
      booking_seat_count: dto.seatIds.length,
      booking_payment_method: dto.paymentMethod,
      booking_total_cents: dto.totalAmount,
    });

    // Your business logic here...
    const booking = await this.createBooking(dto);

    // Add more context after creation
    this.requestContext.addBusinessContext({
      booking_id: booking.id,
      booking_reference: booking.reference,
    });

    return booking;
  }
}
```

### View the enriched logs

Query for bookings with business context:
```logql
{container="ticketing-api"} | json | booking_id != ""
```

You'll now see fields like:
- `booking_id`
- `booking_event_id`
- `booking_seat_count`
- `booking_total_cents`

## Step 7: Query Business Data (10 minutes)

Now you can answer business questions with LogQL!

### High-value bookings (>$500)
```logql
{container="ticketing-api"} | json | booking_total_cents > 50000
```

### Failed bookings
```logql
{container="ticketing-api"} | json | path="/bookings/confirm" | outcome="error"
```

### Bookings by payment method
```logql
sum by (booking_payment_method) (
  count_over_time({container="ticketing-api"} | json | booking_payment_method != "" [1h])
)
```

### Average booking value
```logql
avg_over_time({container="ticketing-api"} | json | booking_total_cents > 0 | unwrap booking_total_cents [1h])
```

## Step 8: Create Your First Alert (10 minutes)

Let's create an alert for high error rates!

### 1. Create Alert Rule

1. Open your alerting system and create a rule from this query.

2. **Set query:**
   - Query: 
   ```logql
   sum(rate({container="ticketing-api"} | json | outcome="error" [5m]))
   ```
   - Alert condition: `WHEN last() OF query(A) IS ABOVE 5`

3. **Configure:**
   - Name: `High Error Rate`
   - Evaluate every: `1m`
   - For: `5m`

4. **Add annotation:**
   - Description: `Error rate is above 5 per minute`

5. **Save**

### 2. Test the Alert

Generate some errors:
```bash
# Make some bad requests
curl http://localhost:3000/bookings/99999
curl http://localhost:3000/events/invalid
```

Wait 5 minutes, then verify the rule evaluates and fires correctly.

## Step 9: Remote Loki Setup (Optional - 10 minutes)

If you use a managed Loki provider, configure your API with remote credentials.

Add to your `.env`:
```bash
LOKI_URL=https://your-managed-loki-endpoint
LOKI_AUTH=true
LOKI_USERNAME=123456
LOKI_PASSWORD=glc_xxx_your_api_key
```

Restart API:

```bash
pnpm run dev
```

Logs now go to your managed Loki endpoint.

## 🎓 Next Steps

### Learn LogQL

- Read: [LogQL Cheat Sheet](./logql-cheatsheet.md)
- Practice queries with the Loki API or your preferred log UI
- Start with simple queries, build complexity

### Build Dashboards

1. Create panels from the LogQL queries above
2. Add panels for your specific metrics
3. Share with your team

### Add More Context

Enrich your logs with:
- User subscription tier
- Event categories
- Cart values
- Feature flags
- Geographic regions

### Set Up Monitoring

Create alerts for:
- Error rate spikes
- Slow response times
- Payment failures
- Database connection issues

### Advanced Topics

- [Full Observability Guide](./observability.md)
- [Wide Events Pattern](../.claude/skills/logging-best-practices/SKILL.md)
- [Loki Docs](https://grafana.com/docs/loki/latest/)

## 🐛 Troubleshooting

### Logs not appearing?

**Check containers are running:**
```bash
docker ps | grep -E "loki|promtail"
```

**Check Loki health:**
```bash
curl http://localhost:3100/ready
```

**Check Promtail logs:**
```bash
docker logs ticketing-promtail
```

**Verify API is logging:**
```bash
# Make a request
curl http://localhost:3000/events

# Check logs (should be JSON)
docker logs <your-api-container>
```

### Loki query returns no data?

1. Check time range (top right) - try "Last 15 minutes"
2. Try simple query: `{container="ticketing-api"}`
3. Check container label in query matches your actual container name

### High memory usage?

1. Stop unused containers
2. Reduce retention in `observability/loki-config.yaml`
3. Restart: `docker-compose -f docker-compose.observability.yml restart`

## 📚 Resources

- [Observability Guide](./observability.md) - Full documentation
- [LogQL Cheat Sheet](./logql-cheatsheet.md) - Query reference
- [Logging Best Practices](../.claude/skills/logging-best-practices/SKILL.md)
- [Loki Docs](https://grafana.com/docs/loki/latest/)

---

**Questions?** Check the full [Observability Guide](./observability.md) or the logging skill documentation.
