# Observability & Logging Guide

## 📊 Overview

This ticketing system implements **wide events** logging pattern for powerful observability. This means:
- **One context-rich log per request** instead of scattered logs
- **High cardinality fields** (user_id, request_id) for precise querying
- **Business context** included in every log (user tier, cart value, etc.)
- **Environment context** automatically added (commit hash, version, region)

## 🎯 Why Wide Events?

Traditional logging scattered across your codebase makes debugging hard:
```typescript
// ❌ OLD WAY - Multiple scattered logs
console.log('User logged in');
console.log('Cart total:', total);
console.log('Checkout started');
console.log('Payment processed');
```

Wide events collect everything in ONE structured log:
```typescript
// ✅ NEW WAY - One context-rich event
logger.info({
  request_id: '123',
  user_id: '456',
  user_tier: 'premium',
  cart_total_cents: 249900,
  outcome: 'success',
  duration_ms: 523,
  // + automatic environment context
}, 'Checkout completed');
```

### Benefits:
1. **Query by anything**: "Show all errors for user_123" or "Show slow requests in us-west-2"
2. **No guessing**: You don't need to anticipate what questions you'll ask
3. **Context always available**: Every log includes who, what, where, when
4. **Correlation**: Track a request across all logs with request_id

## 🏗️ Architecture

```
┌─────────────────┐
│   Your API      │
│  (NestJS App)   │
└────────┬────────┘
         │ JSON logs
         ↓
┌─────────────────┐     ┌─────────────────┐
│   Promtail      │ ──→ │      Loki       │
│ (Log Collector) │     │ (Log Storage)   │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ↓
                        ┌─────────────────┐
                        │  Loki API/CLI   │
                        │  (Log Queries)  │
                        └─────────────────┘
```

### Components:

1. **LoggerService**: Centralized logger using Pino (5x faster than Winston)
2. **RequestContextService**: Maintains context throughout request using AsyncLocalStorage
3. **LoggingMiddleware**: Automatically creates wide events for every request
4. **Loki**: Stores logs with indexing for fast queries
5. **Jaeger**: Visualizes distributed traces and spans

## 🚀 Quick Start

### Local Development (Docker Compose)

1. **Start the observability stack:**
```bash
docker-compose -f docker-compose.observability.yml up -d
```

2. **Start your API:**
```bash
cd apps/backend
pnpm run dev
```

3. **Query logs with Loki API:**
```bash
# List labels
curl -G "http://localhost:3100/loki/api/v1/labels"

# Query recent error logs
curl -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={container="ticketing-api"} | json | outcome="error"' \
  --data-urlencode 'limit=200'
```

4. **Access traces in Jaeger:**
- URL: http://localhost:16686
- Filter by service name (for example: `ticketing-api`)

### Remote Loki (Optional)

If you ship logs to a managed Loki endpoint, configure:
```bash
# .env
LOKI_URL=https://your-managed-loki-endpoint
LOKI_USERNAME=your-username
LOKI_PASSWORD=your-api-key
LOKI_AUTH=true
```

Then restart your API so logs flow to the remote endpoint.

## 📝 Usage Examples

### In Your Services

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService, RequestContextService } from '@/common/logger';

@Injectable()
export class BookingService {
  constructor(
    private readonly logger: LoggerService,
    private readonly requestContext: RequestContextService,
  ) {}

  async createBooking(dto: CreateBookingDto) {
    // Add business context to the request
    // WHY: This will be included in the wide event automatically
    this.requestContext.addBusinessContext({
      booking_event_id: dto.eventId,
      booking_seat_count: dto.seatIds.length,
      booking_total_cents: dto.totalAmount,
    });

    try {
      const booking = await this.processBooking(dto);
      
      // More context as you go
      this.requestContext.addBusinessContext({
        booking_id: booking.id,
        booking_reference: booking.reference,
        payment_method: dto.paymentMethod,
      });

      return booking;
    } catch (error) {
      // Errors are automatically logged by exception filter
      // with full context (user, booking details, etc.)
      throw error;
    }
  }
}
```

### Manual Logging (when needed)

```typescript
// Log important business events
this.logger.info({
  event: 'high_value_booking',
  booking_id: booking.id,
  user_id: user.id,
  amount_cents: 500000, // $5,000
  vip_tier: true,
}, 'High value booking created');

// Log errors with context
this.logger.error({
  error_type: 'PaymentFailure',
  error_message: error.message,
  payment_provider: 'stripe',
  amount_cents: 100000,
  user_id: user.id,
  retry_count: 3,
}, 'Payment processing failed after retries');
```

## 🔍 Example Queries (LogQL)

### 1. All errors in the last hour
```logql
{container="ticketing-api"} | json | outcome="error"
```

### 2. Show errors for specific user
```logql
{container="ticketing-api"} | json | user_id="123" | outcome="error"
```

### 3. Slow requests (>1 second)
```logql
{container="ticketing-api"} | json | duration_ms > 1000
```

### 4. Payment-related errors
```logql
{container="ticketing-api"} | json | path=~"/payment.*" | status_code >= 500
```

### 5. Requests per second (rate)
```logql
sum(rate({container="ticketing-api"} |= "request_id" | json [1m]))
```

### 6. Average response time
```logql
avg_over_time({container="ticketing-api"} | json | unwrap duration_ms [5m])
```

### 7. P95 response time
```logql
quantile_over_time(0.95, {container="ticketing-api"} | json | unwrap duration_ms [5m])
```

### 8. Error rate by endpoint
```logql
sum by (path) (rate({container="ticketing-api"} | json | outcome="error" [5m]))
```

### 9. Premium user errors
```logql
{container="ticketing-api"} | json | user_tier="premium" | outcome="error"
```

### 10. Trace a specific request
```logql
{container="ticketing-api"} | json | request_id="abc-123-xyz"
```

## 📊 Key Metrics to Monitor

### Golden Signals

1. **Latency** (Response Time)
```logql
histogram_quantile(0.99, 
  sum(rate({container="ticketing-api"} | json | unwrap duration_ms [5m])) by (le)
)
```

2. **Traffic** (Requests per second)
```logql
sum(rate({container="ticketing-api"} | json [1m]))
```

3. **Errors** (Error rate)
```logql
sum(rate({container="ticketing-api"} | json | outcome="error" [5m])) 
/ 
sum(rate({container="ticketing-api"} | json [5m]))
```

4. **Saturation** (Look for slow requests)
```logql
sum(rate({container="ticketing-api"} | json | is_very_slow="true" [5m]))
```

### Business Metrics

1. **Bookings per minute**
```logql
sum(rate({container="ticketing-api"} | json | path="/bookings" | method="POST" [1m]))
```

2. **Failed payments**
```logql
sum(rate({container="ticketing-api"} | json | path=~"/payment.*" | outcome="error" [5m]))
```

3. **High-value transactions**
```logql
{container="ticketing-api"} | json | booking_total_cents > 500000
```

## 📈 Building Dashboards (Jaeger + Logs)

Use Jaeger for traces and build log-derived metrics from Loki queries in your preferred visualization tool.

Common panels to build:
- Requests per second
- Success rate
- Average response time
- Recent errors
- Status code distribution
- Top endpoints

## 🔔 Setting Up Alerts

### Example: High Error Rate Alert

1. Create an alert in your monitoring tool based on the query below.
2. Use this threshold baseline:

```yaml
Query: sum(rate({container="ticketing-api"} | json | outcome="error" [5m]))
Condition: WHEN last() OF query(A) IS ABOVE 10
Evaluate every: 1m
For: 5m
```

3. Add notification channels (Slack, Email, PagerDuty).

### Recommended Alerts

1. **High error rate** (>5% errors)
2. **High latency** (P95 > 2 seconds)
3. **Low success rate** (<95%)
4. **Payment failures** (any payment error)
5. **Database connection errors**

## 🔐 Security & Privacy

### Sensitive Data

**NEVER log:**
- Passwords
- Credit card numbers
- Personal identification numbers
- API keys/tokens
- Full request bodies (may contain sensitive data)

**DO log:**
- User IDs (anonymized if needed)
- Amounts (cents)
- Event IDs
- Status codes
- Error types

### PII Handling

If you need to log PII:
1. Hash it: `user_email_hash: hash(user.email)`
2. Redact it: `user_email: "***@domain.com"`
3. Tokenize it: `user_token: tokenize(user.id)`

## 📈 Best Practices

### 1. Wide Events Over Scattered Logs

✅ **DO**: Build context, emit once
```typescript
const event = { request_id, user_id, ... };
// ... add context throughout handler
finally {
  logger.info(event);
}
```

❌ **DON'T**: Multiple console.log calls
```typescript
console.log('Starting');
console.log('Processing');
console.log('Done');
```

### 2. High Cardinality Fields

✅ **DO**: Include unique identifiers
- request_id
- user_id
- session_id
- booking_id

❌ **DON'T**: Only generic messages

### 3. Business Context

✅ **DO**: Include business data
```typescript
{
  user_tier: 'premium',
  cart_value_cents: 249900,
  event_type: 'concert',
  seats_purchased: 4
}
```

❌ **DON'T**: Only technical data

### 4. Use RequestContextService

✅ **DO**: Add context as you learn
```typescript
this.requestContext.addBusinessContext({
  booking_id: 123,
  payment_method: 'stripe',
});
```

❌ **DON'T**: Pass context through every function parameter

### 5. Consistent Field Names

✅ **DO**: Use snake_case, consistent naming
- user_id (not userId, not user, not id)
- duration_ms (not time, not responseTime)
- status_code (not status, not code)

## 🐛 Troubleshooting

### Logs not appearing in Loki

1. **Check Docker containers:**
```bash
docker ps
# Should see: loki, promtail
```

2. **Check Loki is receiving logs:**
```bash
curl http://localhost:3100/ready
# Should return: ready
```

3. **Check Promtail is scraping:**
```bash
docker logs ticketing-promtail
```

4. **Verify app is logging:**
```bash
# Should see JSON logs in console
docker logs <your-app-container>
```

### Loki query returns no data

1. Check time range (top right) - try "Last 15 minutes"
2. Try simple query: `{container="ticketing-api"}`
3. Check container name matches labels in promtail config

### High Loki memory usage

1. Reduce retention period in `loki-config.yaml`
2. Limit ingestion rate
3. Reduce max_query_series

## 📚 Further Reading

- [Wide Events 101](https://boristane.com/blog/observability-wide-events-101/)
- [Stripe: Canonical Log Lines](https://stripe.com/blog/canonical-log-lines)
- [LoggingSucks.com](https://loggingsucks.com)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [LogQL Query Language](https://grafana.com/docs/loki/latest/logql/)

## 🤝 Contributing

When adding new features:
1. Use RequestContextService to add business context
2. Never use console.log - use the logger
3. Include relevant business fields in context
4. Update Jaeger/Loki runbooks if adding important new metrics
5. Document new LogQL queries for your feature

---

**Questions?** Check the logging-best-practices skill in `.claude/skills/logging-best-practices/`
