# LogQL Query Cheat Sheet

Quick reference for common Grafana Loki queries for the ticketing system.

## Basic Queries

### All logs from the API
```logql
{container="ticketing-api"}
```

### Only JSON logs
```logql
{container="ticketing-api"} | json
```

### Filter by text
```logql
{container="ticketing-api"} |= "booking"
```

### Exclude text
```logql
{container="ticketing-api"} != "health_check"
```

## Error Queries

### All errors
```logql
{container="ticketing-api"} | json | outcome="error"
```

### Server errors (5xx)
```logql
{container="ticketing-api"} | json | status_code >= 500
```

### Specific error type
```logql
{container="ticketing-api"} | json | error_type="PaymentError"
```

### Errors with stack trace
```logql
{container="ticketing-api"} | json | error_stack != ""
```

## Performance Queries

### Slow requests (>1 second)
```logql
{container="ticketing-api"} | json | duration_ms > 1000
```

### Very slow requests (>5 seconds)
```logql
{container="ticketing-api"} | json | is_very_slow="true"
```

### Average response time (5min window)
```logql
avg_over_time({container="ticketing-api"} | json | unwrap duration_ms [5m])
```

### P95 response time
```logql
quantile_over_time(0.95, {container="ticketing-api"} | json | unwrap duration_ms [5m])
```

### P99 response time
```logql
quantile_over_time(0.99, {container="ticketing-api"} | json | unwrap duration_ms [5m])
```

## User-Specific Queries

### All logs for a user
```logql
{container="ticketing-api"} | json | user_id="123"
```

### Premium user activity
```logql
{container="ticketing-api"} | json | user_tier="premium"
```

### Premium user errors
```logql
{container="ticketing-api"} | json | user_tier="premium" | outcome="error"
```

### User's bookings
```logql
{container="ticketing-api"} | json | user_id="123" | path=~"/bookings.*"
```

## Request Tracking

### Track specific request
```logql
{container="ticketing-api"} | json | request_id="abc-123-xyz"
```

### Requests from specific IP
```logql
{container="ticketing-api"} | json | ip_address="192.168.1.1"
```

### Requests from specific user agent
```logql
{container="ticketing-api"} | json | user_agent=~".*Chrome.*"
```

## Endpoint Analysis

### Specific endpoint
```logql
{container="ticketing-api"} | json | path="/bookings/confirm"
```

### All booking endpoints
```logql
{container="ticketing-api"} | json | path=~"/bookings.*"
```

### All POST requests
```logql
{container="ticketing-api"} | json | method="POST"
```

### Failed POST requests
```logql
{container="ticketing-api"} | json | method="POST" | outcome="error"
```

## Business Queries

### High-value bookings (>$500)
```logql
{container="ticketing-api"} | json | booking_total_cents > 50000
```

### Payment failures
```logql
{container="ticketing-api"} | json | path=~"/payment.*" | outcome="error"
```

### Successful bookings
```logql
{container="ticketing-api"} | json | path="/bookings/confirm" | outcome="success"
```

### Reservation timeouts
```logql
{container="ticketing-api"} | json | error_message=~".*reservation expired.*"
```

## Rate & Count Queries

### Requests per second
```logql
sum(rate({container="ticketing-api"} | json [1m]))
```

### Errors per minute
```logql
sum(rate({container="ticketing-api"} | json | outcome="error" [1m]))
```

### Error rate percentage
```logql
(sum(rate({container="ticketing-api"} | json | outcome="error" [5m])) 
/ 
sum(rate({container="ticketing-api"} | json [5m]))) * 100
```

### Requests by endpoint
```logql
sum by (path) (count_over_time({container="ticketing-api"} | json [1h]))
```

### Errors by type
```logql
sum by (error_type) (count_over_time({container="ticketing-api"} | json | outcome="error" [1h]))
```

## Status Code Analysis

### 2xx responses
```logql
{container="ticketing-api"} | json | status_code >= 200 | status_code < 300
```

### 4xx responses (client errors)
```logql
{container="ticketing-api"} | json | status_code >= 400 | status_code < 500
```

### 5xx responses (server errors)
```logql
{container="ticketing-api"} | json | status_code >= 500
```

### Status code distribution
```logql
sum by (status_code) (count_over_time({container="ticketing-api"} | json [1h]))
```

## Environment & Deployment

### Logs from specific commit
```logql
{container="ticketing-api"} | json | commit_hash="abc123"
```

### Logs from specific version
```logql
{container="ticketing-api"} | json | version="1.2.3"
```

### Logs from specific region
```logql
{container="ticketing-api"} | json | region="us-west-2"
```

### Errors after deployment
```logql
{container="ticketing-api"} | json | commit_hash="abc123" | outcome="error"
```

## Advanced Patterns

### Pattern matching in logs
```logql
{container="ticketing-api"} |= "payment" |~ "stripe|paypal"
```

### Regex in JSON field
```logql
{container="ticketing-api"} | json | user_email=~".*@gmail.com"
```

### Multiple conditions
```logql
{container="ticketing-api"} 
| json 
| method="POST" 
| status_code >= 500 
| duration_ms > 1000
```

### Unwrap and aggregate
```logql
sum(rate({container="ticketing-api"} | json | unwrap booking_total_cents [5m]))
```

## Dashboard Queries

### Success rate gauge
```logql
(sum(rate({container="ticketing-api"} | json | outcome="success" [5m])) 
/ 
sum(rate({container="ticketing-api"} | json [5m]))) * 100
```

### Request duration histogram
```logql
histogram_quantile(0.95, 
  sum(rate({container="ticketing-api"} | json | unwrap duration_ms [5m])) by (le)
)
```

### Top slowest endpoints
```logql
topk(10, 
  avg by (path) (avg_over_time({container="ticketing-api"} | json | unwrap duration_ms [5m]))
)
```

### Errors over time
```logql
sum by (error_type) (rate({container="ticketing-api"} | json | outcome="error" [5m]))
```

## Tips & Tricks

### 1. Use range vectors for aggregations
```logql
# Good - uses 5 minute window
avg_over_time({...} | json | unwrap duration_ms [5m])

# Bad - instant query (less useful)
{...} | json | unwrap duration_ms
```

### 2. Filter early for performance
```logql
# Good - filter first
{container="ticketing-api"} |= "error" | json | user_id="123"

# Bad - parse all logs first
{container="ticketing-api"} | json | user_id="123" |= "error"
```

### 3. Use labels for high-cardinality fields
```logql
# Good - fast
{container="ticketing-api", outcome="error"}

# Slower - has to parse JSON
{container="ticketing-api"} | json | outcome="error"
```

### 4. Combine filters for precision
```logql
{container="ticketing-api"} 
| json 
| user_tier="premium"
| path=~"/bookings.*"
| status_code >= 500
| duration_ms > 2000
```

---

## Testing Queries

Use Grafana's **Explore** page to test queries:
1. Click "Explore" (compass icon)
2. Select "Loki" datasource
3. Paste query
4. Click "Run query"
5. Adjust time range if needed
