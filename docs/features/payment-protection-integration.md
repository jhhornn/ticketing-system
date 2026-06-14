# Payment Protection UX - Integration Guide

Quick reference for integrating payment protection features into any payment flow.

---

## Quick Start (3 Steps)

### 1. Import Components and Hook

```typescript
import {
  PaymentProtectionBadge,
  SlowNetworkIndicator,
  IdempotencyReplayNotification
} from '../../components/PaymentProtection';
import { usePaymentProtection } from '../../hooks/usePaymentProtection';
import { PaymentProtectionCopy } from '../../utils/uiCopy';
```

### 2. Initialize Hook

```typescript
const {
  isSlowNetwork,
  isReplay,
  replayBookingReference,
  startPaymentTracking,
  endPaymentTracking,
  trackEvent,
} = usePaymentProtection();
```

### 3. Wrap Payment Logic

```typescript
const handlePayment = async () => {
  // Start tracking
  startPaymentTracking();
  
  try {
    const response = await BookingsService.confirmBooking({
      // ... payment data
    });
    
    // Detect replay (HTTP 200 vs 201, or check header)
    const wasReplay = response.status === 200 || 
                      response.headers['idempotency-replay'] === 'true';
    
    // End tracking
    endPaymentTracking(wasReplay, response.bookingReference);
    
    // Track success
    trackEvent(PaymentProtectionCopy.analyticsEvents.retryAttempted, {
      success: true,
      wasReplay,
    });
    
    // Handle success...
  } catch (error) {
    // End tracking on error
    endPaymentTracking(false);
    
    // Track failure
    trackEvent(PaymentProtectionCopy.analyticsEvents.retryAttempted, {
      success: false,
      error: error.message,
    });
    
    // Show error...
  }
};
```

---

## Component Placement

### Badge (Always Visible)

Place near the checkout heading to establish trust early:

```tsx
<div className="checkout-header">
  <h1>Review Your Booking</h1>
  <PaymentProtectionBadge 
    onBadgeClick={() => trackEvent('payment_protection_badge_clicked')}
  />
</div>
```

### Replay Notification (Conditional)

Show at top of content area when replay detected:

```tsx
{isReplay && (
  <IdempotencyReplayNotification
    isReplay={isReplay}
    bookingReference={replayBookingReference}
    onDisplay={() => trackEvent('idempotency_replay_surfaced')}
  />
)}
```

### Slow Network Indicator (Conditional)

Show during payment processing when slow network detected:

```tsx
{isProcessing && isSlowNetwork && (
  <SlowNetworkIndicator
    isSlowNetwork={isSlowNetwork}
    onDisplay={() => trackEvent('slow_network_detected')}
  />
)}
```

### Error Messages (Enhanced)

Add retry safety note to error displays:

```tsx
{error && (
  <div className="error-message">
    <p className="font-semibold">Payment Failed</p>
    <p>{error}</p>
    {!isProcessing && (
      <p className="text-xs mt-2">
        {PaymentProtectionCopy.retry.safeRetryNote}
      </p>
    )}
  </div>
)}
```

---

## Analytics Events Reference

### Available Events

```typescript
// Badge interactions
PaymentProtectionCopy.analyticsEvents.badgeClicked
PaymentProtectionCopy.analyticsEvents.modalOpened

// Network conditions
PaymentProtectionCopy.analyticsEvents.slowNetworkDetected

// Idempotency
PaymentProtectionCopy.analyticsEvents.replayEventSurfaced

// Payment attempts
PaymentProtectionCopy.analyticsEvents.retryAttempted
PaymentProtectionCopy.analyticsEvents.timeoutOccurred
```

### Usage Pattern

```typescript
// Simple event
trackEvent('payment_protection_badge_clicked');

// Event with metadata
trackEvent('payment_retry_attempted', {
  success: true,
  wasReplay: false,
  attemptNumber: 2,
  paymentMethod: 'stripe',
});
```

**Note:** Request duration, slow network status, and replay status are automatically attached to all events.

---

## Copy Customization

All user-facing text is in `PaymentProtectionCopy` object:

```typescript
// In uiCopy.ts
export const PaymentProtectionCopy = {
  badge: {
    text: 'Payment Protected',  // Customize this
    icon: '🛡️',
  },
  
  modal: {
    title: 'Your Payment is Protected',  // Customize this
    sections: {
      noDoubleCharge: {
        heading: 'No Double Charges',  // Customize this
        message: '...',  // Customize this
      },
      // ... more sections
    },
  },
  
  // ... more copy
};
```

---

## Backend Requirements

### Idempotency Response Headers

For optimal UX, backend should return:

```
HTTP/1.1 200 OK
Idempotency-Replay: true
Content-Type: application/json
```

### Status Codes

- **201 Created:** New booking (first attempt)
- **200 OK:** Existing booking (idempotency replay)
- **400 Bad Request:** Invalid payment data
- **402 Payment Required:** Payment declined
- **409 Conflict:** Seats no longer available

### Response Structure

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Booking already exists (duplicate request prevented)",
  "data": {
    "bookingReference": "BK-2026-ABC123",
    // ... other booking data
  }
}
```

---

## Testing Checklist

### Manual Testing

- [ ] Badge visible in checkout header
- [ ] Badge opens modal on click
- [ ] Modal displays all 3 sections correctly
- [ ] Modal closes on "Got it" button
- [ ] Slow network indicator appears after 5s delay
- [ ] Replay notification shows when idempotency replay detected
- [ ] Replay notification auto-dismisses after 8s
- [ ] Error messages include retry safety note
- [ ] Analytics events logged to console

### Automated Testing

```typescript
// Example: Testing slow network detection
test('shows slow network indicator after 5 seconds', async () => {
  const { result } = renderHook(() => usePaymentProtection());
  
  act(() => {
    result.current.startPaymentTracking();
  });
  
  await waitFor(() => {
    expect(result.current.isSlowNetwork).toBe(true);
  }, { timeout: 6000 });
});

// Example: Testing replay detection
test('detects idempotency replay', () => {
  const { result } = renderHook(() => usePaymentProtection());
  
  act(() => {
    result.current.startPaymentTracking();
  });
  
  act(() => {
    result.current.endPaymentTracking(true, 'BK-2026-ABC123');
  });
  
  expect(result.current.isReplay).toBe(true);
  expect(result.current.replayBookingReference).toBe('BK-2026-ABC123');
});
```

---

## Troubleshooting

### Badge Not Appearing
- Check import path: `'../../components/PaymentProtection'`
- Verify component is rendered in JSX
- Check for CSS conflicts hiding the badge

### Slow Network Not Triggering
- Verify `startPaymentTracking()` called before request
- Check console for timer initialization
- Test with 6+ second delays

### Replay Not Detected
- Verify backend returns `Idempotency-Replay: true` header
- Check response status code (200 for replays)
- Add logging: `console.log('Response:', response.status, response.headers)`

### Analytics Not Firing
- Check console for `[Payment Protection Analytics]` logs
- Verify `trackEvent()` called with correct event names
- Ensure analytics service integration completed

---

## Example: Full Integration

```typescript
import React, { useState } from 'react';
import {
  PaymentProtectionBadge,
  SlowNetworkIndicator,
  IdempotencyReplayNotification
} from '../../components/PaymentProtection';
import { usePaymentProtection } from '../../hooks/usePaymentProtection';
import { PaymentProtectionCopy } from '../../utils/uiCopy';
import { BookingsService } from '../../services/bookings';

export const CheckoutPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    isSlowNetwork,
    isReplay,
    replayBookingReference,
    startPaymentTracking,
    endPaymentTracking,
    trackEvent,
  } = usePaymentProtection();
  
  const handlePayment = async (paymentData) => {
    setIsProcessing(true);
    setError(null);
    startPaymentTracking();
    
    try {
      const response = await BookingsService.confirmBooking(paymentData);
      
      const wasReplay = response.status === 200;
      endPaymentTracking(wasReplay, response.bookingReference);
      
      trackEvent(PaymentProtectionCopy.analyticsEvents.retryAttempted, {
        success: true,
        wasReplay,
      });
      
      // Navigate to success page...
    } catch (err) {
      endPaymentTracking(false);
      setError(err.message);
      
      trackEvent(PaymentProtectionCopy.analyticsEvents.retryAttempted, {
        success: false,
        error: err.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="checkout-page">
      <header>
        <h1>Review Your Booking</h1>
        <PaymentProtectionBadge 
          onBadgeClick={() => trackEvent('payment_protection_badge_clicked')}
        />
      </header>
      
      <main>
        {isReplay && (
          <IdempotencyReplayNotification
            isReplay={isReplay}
            bookingReference={replayBookingReference}
            onDisplay={() => trackEvent('idempotency_replay_surfaced')}
          />
        )}
        
        {isProcessing && isSlowNetwork && (
          <SlowNetworkIndicator
            isSlowNetwork={isSlowNetwork}
            onDisplay={() => trackEvent('slow_network_detected')}
          />
        )}
        
        {error && (
          <div className="error-message">
            <p className="font-semibold">Payment Failed</p>
            <p>{error}</p>
            {!isProcessing && (
              <p className="text-xs">
                {PaymentProtectionCopy.retry.safeRetryNote}
              </p>
            )}
          </div>
        )}
        
        {/* Booking details... */}
        
        <button onClick={handlePayment} disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Confirm & Pay'}
        </button>
      </main>
    </div>
  );
};
```

---

## Support

For questions or issues:
- Review full documentation: [payment-protection-ux.md](./payment-protection-ux.md)
- Check component code: `apps/frontend/src/components/PaymentProtection/`
- Test hook behavior: `apps/frontend/src/hooks/usePaymentProtection.ts`

---

**Last Updated:** January 30, 2026
