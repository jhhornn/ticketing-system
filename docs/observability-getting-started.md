# Getting Started with Observability

This guide walks you through setting up observability for the ticketing system from scratch.

## 🎯 What You'll Learn

- How to run the local observability stack (Grafana + Loki)
- How to view and query logs
- How to add business context to your code
- How to create alerts

## 📋 Prerequisites

- Docker and Docker Compose installed
- Your ticketing API running

## Step 1: Start the Observability Stack (5 minutes)

### Start Loki + Grafana

```bash
# From the project root
docker-compose -f docker-compose.observability.yml up -d

# Verify containers are running
docker ps | grep -E "loki|grafana|promtail"
```

You should see three containers:
- `ticketing-loki` (port 3100)
- `ticketing-grafana` (port 3001)
- `ticketing-promtail`

### Access Grafana

1. Open http://localhost:3001
2. Login with:
   - Username: `admin`
   - Password: `admin`
3. Skip password change (or set a new one)

## Step 2: Start Your API (2 minutes)

```bash
cd src/backend
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

## Step 3: View Logs in Grafana (5 minutes)

### Open Explore

1. Click the **Explore** icon (compass) in the left sidebar
2. Select **Loki** from the datasource dropdown (top)

### Run Your First Query

Paste this query and click "Run query":
```logql
{container="ticketing-api"} | json
```

You should see your API logs! Try these:

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

## Step 4: Open the Pre-built Dashboard (2 minutes)

1. Click **Dashboards** (four squares icon) in the left sidebar
2. Navigate to: **Ticketing System** → **API Observability**

You'll see:
- 📊 Requests per second
- ✅ Success rate
- ⏱️ Average response time
- ❌ Recent errors
- 📈 Status code distribution
- 🔝 Top endpoints

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

# 3. View in Grafana
# Go back to Grafana → Explore → Run:
```

Query to see your reservations:
```logql
{container="ticketing-api"} | json | path=~"/reservations.*"
```

## Step 6: Add Business Context (10 minutes)

Now let's add custom business context to your logs!

### Example: Add context in a service

Open any service file (e.g., `src/backend/api/booking/booking.service.ts`):

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

1. Go to **Alerting** → **Alert rules** → **Create alert rule**

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

Wait 5 minutes, then check **Alerting** → **Alert rules**

## Step 9: Grafana Cloud Setup (Optional - 10 minutes)

For production, use Grafana Cloud (free tier available).

### 1. Sign Up

1. Go to https://grafana.com/auth/sign-up/create-user
2. Create account
3. Create a stack (e.g., "ticketing-prod")

### 2. Get Loki Credentials

1. In Grafana Cloud Portal → **Loki** → **Details**
2. Copy:
   - URL (e.g., `https://logs-prod-xxx.grafana.net`)
   - Username (numeric ID)
3. Generate API key → Copy password

### 3. Configure Your API

Add to your `.env`:
```bash
LOKI_URL=https://logs-prod-xxx.grafana.net
LOKI_AUTH=true
LOKI_USERNAME=123456
LOKI_PASSWORD=glc_xxx_your_api_key
```

### 4. Restart API

```bash
pnpm run dev
```

Logs now go to Grafana Cloud! View at `https://your-org.grafana.net`

## 🎓 Next Steps

### Learn LogQL

- Read: [LogQL Cheat Sheet](./logql-cheatsheet.md)
- Practice queries in Grafana Explore
- Start with simple queries, build complexity

### Customize Dashboards

1. Clone the default dashboard
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
- [Grafana Loki Docs](https://grafana.com/docs/loki/latest/)

## 🐛 Troubleshooting

### Logs not appearing?

**Check containers are running:**
```bash
docker ps | grep -E "loki|grafana|promtail"
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

### Grafana shows "No data"?

1. Check time range (top right) - try "Last 15 minutes"
2. Try simple query: `{container="ticketing-api"}`
3. Verify datasource: **Settings** → **Data Sources** → **Loki**
4. Check container label in query matches your actual container name

### High memory usage?

1. Stop unused containers
2. Reduce retention in `observability/loki-config.yaml`
3. Restart: `docker-compose -f docker-compose.observability.yml restart`

## 📚 Resources

- [Observability Guide](./observability.md) - Full documentation
- [LogQL Cheat Sheet](./logql-cheatsheet.md) - Query reference
- [Logging Best Practices](../.claude/skills/logging-best-practices/SKILL.md)
- [Grafana Docs](https://grafana.com/docs/)

---

**Questions?** Check the full [Observability Guide](./observability.md) or the logging skill documentation.
