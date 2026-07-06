# Error Translation System

## Overview

The Error Translation Layer provides a centralized system for converting technical errors (HTTP status codes, backend error reasons) into user-friendly messages with clear next actions and recovery strategies.

## Key Features

- ✅ **Unified Error Handling**: Single source of truth for all error messages
- ✅ **User-Friendly Messages**: Clear, actionable error descriptions
- ✅ **Recovery Strategies**: Automatic retry, restart, or manual intervention
- ✅ **Context-Aware**: Different messages for reservation, payment, and timer flows
- ✅ **Auto-Retry Logic**: Configurable automatic retry with backoff
- ✅ **TypeScript Support**: Full type safety

---

## Architecture

```
┌─────────────────┐
│   API Error     │
│ (HTTP + Reason) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│   translateError()          │
│   - Maps HTTP status        │
│   - Maps backend reason     │
│   - Selects recovery        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   TranslatedError           │
│   - Title                   │
│   - Message                 │
│   - Category                │
│   - Severity                │
│   - Primary Action          │
│   - Secondary Action        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   ErrorDisplay Component    │
│   - Shows message           │
│   - Action buttons          │
│   - Auto-retry UI           │
└─────────────────────────────┘
```

---

## Error Mapping Tables

### HTTP Status Code Mappings

| Status Code | Title | Category | Severity | Primary Action | Auto-Retry | Retry Delay | Retry Limit |
|------------|-------|----------|----------|----------------|------------|-------------|-------------|
| **0** (No Response) | Connection Lost | Network | Error | Retry | ✅ | 2s | 3 |
| **400** Bad Request | Invalid Request | Validation | Warning | Manual | ❌ | - | - |
| **401** Unauthorized | Session Expired | Authentication | Warning | Restart | ❌ | - | - |
| **403** Forbidden | Access Denied | Authorization | Error | Contact Support | ❌ | - | - |
| **404** Not Found | Not Found | Business Logic | Error | Restart | ❌ | - | - |
| **409** Conflict | Conflict Detected | Conflict | Warning | Retry Modified | ❌ | - | - |
| **422** Unprocessable | Cannot Process | Validation | Warning | Manual | ❌ | - | - |
| **429** Rate Limited | Too Many Requests | System | Warning | Wait | ✅ | 5s | 2 |
| **500** Server Error | Server Error | System | Error | Retry | ✅ | 3s | 2 |
| **502** Bad Gateway | Service Unavailable | Network | Error | Retry | ✅ | 5s | 2 |
| **503** Unavailable | Service Maintenance | System | Error | Wait | ❌ | - | - |
| **504** Timeout | Request Timeout | Network | Warning | Retry | ✅ | 3s | 2 |

### Backend Error Reason Mappings

#### Seat/Reservation Errors

| Reason | Title | User Message | Primary Action | Secondary Action | Auto-Retry |
|--------|-------|-------------|----------------|------------------|------------|
| **seat_already_reserved** | Seat Already Reserved | This seat was just reserved by another customer. Please select a different seat. | Retry Modified | Restart | ❌ |
| **seat_already_booked** | Seat No Longer Available | This seat has been booked and is no longer available. Please choose another seat. | Retry Modified | Restart | ❌ |
| **seat_not_available** | Seat Unavailable | This seat is not available for booking. Please select a different seat. | Retry Modified | - | ❌ |
| **seat_locked** | Seat Temporarily Locked | This seat is being processed by another customer. It may become available in a moment. | Wait | - | ✅ (3s, 3x) |
| **stale_version** | Information Out of Date | Seat availability has changed. Refreshing the latest information... | Retry | - | ✅ (1s, 2x) |
| **reservation_expired** | Reservation Expired | Your 10-minute reservation window has expired. Please select your seats again. | Restart | - | ❌ |
| **reservation_not_found** | Reservation Not Found | We couldn't find your reservation. It may have expired. Please start over. | Restart | - | ❌ |

#### Event Errors

| Reason | Title | User Message | Primary Action | Auto-Retry |
|--------|-------|-------------|----------------|------------|
| **event_not_found** | Event Not Found | This event could not be found. It may have been cancelled or removed. | Restart | ❌ |
| **event_sold_out** | Event Sold Out | All tickets for this event have been sold. Check back for returns or cancellations. | Restart | ❌ |
| **event_not_started** | Sales Not Started | Ticket sales for this event haven't started yet. Please check back later. | Wait | ❌ |
| **event_ended** | Event Ended | This event has already ended. Tickets are no longer available. | Restart | ❌ |

#### Payment Errors

| Reason | Title | User Message | Primary Action | Secondary Action | Auto-Retry |
|--------|-------|-------------|----------------|------------------|------------|
| **payment_failed** | Payment Failed | We couldn't process your payment. Please check your payment details and try again. | Retry | Manual | ❌ |
| **payment_declined** | Payment Declined | Your payment was declined by your bank. Please use a different payment method or contact your bank. | Retry Modified | Contact Support | ❌ |
| **payment_timeout** | Payment Timeout | The payment request timed out. Your card has not been charged. Please try again. | Retry | - | ✅ (3s, 2x) |
| **insufficient_funds** | Insufficient Funds | Your payment method has insufficient funds. Please use a different payment method. | Retry Modified | - | ❌ |
| **invalid_card** | Invalid Card | The card information provided is invalid. Please check and try again. | Manual | - | ❌ |
| **payment_duplicate** | Duplicate Payment | This payment has already been processed. Please check your booking confirmation. | Restart | - | ❌ |

#### System Errors

| Reason | Title | User Message | Primary Action | Secondary Action | Auto-Retry |
|--------|-------|-------------|----------------|------------------|------------|
| **internal_error** | System Error | An unexpected error occurred. Our team has been notified. Please try again. | Retry | Contact Support | ✅ (3s, 2x) |
| **service_unavailable** | Service Temporarily Unavailable | The service is temporarily unavailable. Please try again in a few moments. | Wait | - | ❌ |
| **rate_limited** | Too Many Requests | Please wait a moment before trying again. | Wait | - | ✅ (5s, 2x) |
| **maintenance** | Scheduled Maintenance | We're currently performing scheduled maintenance. Please check back soon. | Wait | - | ❌ |

---

## Recovery Strategies

### Strategy Types

| Strategy | Description | User Action Required | Auto-Executable |
|----------|-------------|---------------------|-----------------|
| **retry** | Try the same action again | Optional | ✅ |
| **retry_modified** | Try again with different parameters | Required | ❌ |
| **restart** | Start the flow over from beginning | Optional | Partial |
| **manual** | User must review and fix input | Required | ❌ |
| **wait** | Wait and try later | Optional | ✅ |
| **contact_support** | Escalate to support team | Required | ❌ |

### Strategy Selection Logic

```typescript
// Prioritize backend reason over HTTP status
if (backendReason in BACKEND_REASON_MAPPINGS) {
  return BACKEND_REASON_MAPPINGS[backendReason];
}

// Fall back to HTTP status
if (httpStatus in HTTP_STATUS_MAPPINGS) {
  return HTTP_STATUS_MAPPINGS[httpStatus];
}

// Ultimate fallback
return defaultErrorMapping;
```

---

## Integration Guide

### 1. Reservation Flow Integration

```typescript
import { useReservationErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorDisplay } from '@/components/ErrorDisplay';

function SeatReservation() {
  const navigate = useNavigate();
  const { error, handleError, clearError } = useReservationErrorHandler(() => {
    navigate('/events/123/seats'); // Restart flow
  });

  const reserveSeats = async (seatIds: string[]) => {
    try {
      await api.reserveSeats(seatIds);
    } catch (err) {
      handleError(err, {
        context: { affectedResource: seatIds.join(', ') }
      });
    }
  };

  return (
    <>
      {error && (
        <ErrorDisplay
          error={error}
          onPrimaryAction={() => {
            if (error.primaryAction.action === 'retry') {
              reserveSeats(selectedSeats);
            } else if (error.primaryAction.action === 'retry_modified') {
              clearError(); // Let user select different seats
            }
          }}
          onDismiss={clearError}
        />
      )}
      {/* Rest of UI */}
    </>
  );
}
```

### 2. Payment Flow Integration

```typescript
import { usePaymentErrorHandler } from '@/hooks/useErrorHandler';

function PaymentPage() {
  const { error, handleError, clearError } = usePaymentErrorHandler(() => {
    navigate('/events/123/seats'); // Restart on failure
  });

  const processPayment = async (paymentData: PaymentData) => {
    try {
      await api.processPayment(paymentData);
    } catch (err) {
      handleError(err, {
        context: { affectedResource: `Booking #${bookingId}` }
      });
    }
  };

  return (
    <>
      {error && (
        <ErrorDisplay
          error={error}
          onPrimaryAction={() => {
            if (error.primaryAction.action === 'retry') {
              processPayment(currentPaymentData);
            } else if (error.primaryAction.action === 'retry_modified') {
              clearError(); // Let user enter different payment
            }
          }}
          onSecondaryAction={() => {
            if (error.secondaryAction?.action === 'contact_support') {
              window.location.href = 'mailto:support@example.com';
            }
          }}
        />
      )}
      {/* Payment form */}
    </>
  );
}
```

### 3. Timer Expiry Integration

```typescript
import { useTimerErrorHandler } from '@/hooks/useErrorHandler';
import { translateTimerError } from '@/utils/errorTranslation';

function ReservationTimer() {
  const navigate = useNavigate();
  const { error, handleError } = useTimerErrorHandler(() => {
    navigate('/events/123/seats'); // Restart on expiry
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          const timerError = translateTimerError(true);
          handleError(timerError);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [handleError]);

  return (
    <>
      {error && (
        <ErrorDisplay
          error={error}
          onPrimaryAction={() => navigate('/events/123/seats')}
        />
      )}
      <div>Time: {formatTime(timeRemaining)}</div>
    </>
  );
}
```

---

## Auto-Retry Configuration

### Retry Parameters

- **retryDelay**: Milliseconds to wait before retry (default: 3000)
- **retryLimit**: Maximum retry attempts (default: 3)
- **autoRetryable**: Whether error can be retried automatically

### Exponential Backoff (Optional Enhancement)

```typescript
const getRetryDelay = (attempt: number, baseDelay: number): number => {
  return Math.min(baseDelay * Math.pow(2, attempt - 1), 30000);
};
```

---

## Error Categories

| Category | Description | Typical Severity | Examples |
|----------|-------------|------------------|----------|
| **network** | Connection/timeout issues | Error/Warning | Lost connection, timeout, gateway errors |
| **validation** | Input validation failures | Warning | Invalid email, missing fields |
| **business_logic** | Business rule violations | Warning/Error | Seat taken, event sold out, expired |
| **authentication** | Auth failures | Warning | Session expired, unauthorized |
| **authorization** | Permission issues | Error | Forbidden, access denied |
| **system** | Server errors | Error/Critical | Internal error, maintenance |
| **conflict** | Race conditions | Warning | Version conflict, optimistic locking |

---

## Error Severity Levels

| Severity | Visual Treatment | User Impact | Examples |
|----------|-----------------|-------------|----------|
| **info** | Blue | Informational only | Sales not started, maintenance scheduled |
| **warning** | Amber | Requires user action | Seat unavailable, validation error |
| **error** | Red | Operation failed | Payment declined, server error |
| **critical** | Red (emphasized) | System failure | Data loss, critical system failure |

---

## Component Reference

### ErrorDisplay Component

```typescript
interface ErrorDisplayProps {
  error: TranslatedError;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}
```

**Features:**
- Color-coded by severity
- Primary and secondary action buttons
- Dismissible
- Shows technical details (collapsible)
- Displays affected resource
- Responsive design

### InlineError Component

```typescript
interface InlineErrorProps {
  error: TranslatedError;
  className?: string;
}
```

**Use Cases:**
- Form field errors
- Compact error displays
- List item errors

---

## Testing Strategy

### Unit Tests

```typescript
describe('translateError', () => {
  it('prioritizes backend reason over HTTP status', () => {
    const error = translateError(500, 'seat_already_reserved');
    expect(error.title).toBe('Seat Already Reserved');
  });

  it('falls back to HTTP status when no backend reason', () => {
    const error = translateError(404);
    expect(error.title).toBe('Not Found');
  });

  it('provides default for unknown errors', () => {
    const error = translateError(undefined, undefined);
    expect(error.title).toBe('Unexpected Error');
  });
});
```

### Integration Tests

- Test auto-retry with mock API
- Test restart navigation
- Test manual intervention flows
- Test timer expiry handling

---

## Best Practices

### ✅ Do

- Use specialized hooks (`useReservationErrorHandler`, `usePaymentErrorHandler`)
- Provide context (affected resource, flow type)
- Clear errors before new operations
- Log errors for monitoring
- Show dismissible error displays
- Test all error scenarios

### ❌ Don't

- Don't auto-retry payment operations (can cause duplicate charges)
- Don't show technical error messages to users
- Don't retry indefinitely (set retry limits)
- Don't ignore error categories (affects UX)
- Don't hardcode error messages (use translation layer)

---

## Monitoring & Logging

### Error Metrics to Track

1. **Error Rate by Category**
   - Network errors
   - Validation errors
   - Business logic errors
   - System errors

2. **Recovery Success Rate**
   - Auto-retry success rate
   - Manual recovery success rate
   - Restart completion rate

3. **User Behavior**
   - Error dismissal rate
   - Support contact rate
   - Flow abandonment after error

### Logging Format

```typescript
console.error('[Error Handler]', {
  title: translatedError.title,
  category: translatedError.category,
  severity: translatedError.severity,
  originalError: {
    httpStatus: error.status,
    backendReason: error.reason,
  },
  context: {
    flow: 'reservation',
    affectedResource: 'A12, A13',
  },
  timestamp: new Date().toISOString(),
  userId: currentUser?.id,
});
```

---

## Future Enhancements

1. **Internationalization (i18n)**
   - Multi-language error messages
   - Locale-specific action labels

2. **Error Analytics Dashboard**
   - Real-time error monitoring
   - Error trend analysis
   - User impact metrics

3. **Smart Retry Logic**
   - Circuit breaker pattern
   - Exponential backoff
   - Jitter for retry timing

4. **Contextual Help**
   - Link to help articles
   - In-app tutorials
   - Video guides

5. **Error Recovery Suggestions**
   - AI-powered recommendations
   - Historical success patterns
   - Alternative action paths

---

## API Reference

### Core Functions

#### `translateError(httpStatus?, backendReason?, context?)`
Translates HTTP status and backend reason to user-friendly error.

#### `translateApiError(error, context?)`
Translates API error response object.

#### `translateReservationError(error, seatNumbers?)`
Specialized translator for reservation flow.

#### `translatePaymentError(error, bookingId?)`
Specialized translator for payment flow.

#### `translateTimerError(reservationExpired?)`
Specialized translator for timer expiry.

### Utility Functions

#### `isRetryable(translatedError)`
Checks if error can be retried.

#### `requiresRestart(translatedError)`
Checks if error requires flow restart.

#### `getRetryConfig(translatedError)`
Gets retry delay and max attempts.

---

## Migration Guide

### Replacing Existing Error Handling

**Before:**
```typescript
catch (error) {
  toast.error('Failed to reserve seats');
}
```

**After:**
```typescript
catch (error) {
  const { error: translatedError, handleError } = useReservationErrorHandler();
  handleError(error, {
    context: { affectedResource: selectedSeats.join(', ') }
  });
}
```

### Gradual Rollout

1. ✅ Phase 1: Add error translation layer (non-breaking)
2. ✅ Phase 2: Integrate into new features
3. ⏳ Phase 3: Migrate existing error handling
4. ⏳ Phase 4: Remove legacy error handling
5. ⏳ Phase 5: Add monitoring and analytics

---

## Support & Troubleshooting

### Common Issues

**Issue:** Auto-retry not working
- **Solution:** Check `enableAutoRetry` flag in hook options

**Issue:** Wrong error message displayed
- **Solution:** Verify backend is returning correct `reason` field

**Issue:** Error display not showing
- **Solution:** Ensure `error` state is not null and ErrorDisplay is rendered

### Debug Mode

Enable verbose logging:
```typescript
const { error, handleError } = useErrorHandler({
  context: { flow: 'reservation' },
  enableDebugLogging: true, // Add this option
});
```

---

## Conclusion

The Error Translation System provides a robust, user-friendly approach to error handling across the entire ticketing application. By centralizing error translation and recovery strategies, it ensures consistent UX and reduces development complexity.

**Key Benefits:**
- ✅ Consistent error messaging
- ✅ Clear recovery paths
- ✅ Reduced user frustration
- ✅ Easier maintenance
- ✅ Better error monitoring
- ✅ Improved user retention
