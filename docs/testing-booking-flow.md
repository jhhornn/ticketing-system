# Testing Booking Flow - Guide

## Overview
This guide helps you test the complete booking flow with the improved MOCK payment handling.

## What Was Fixed

### 1. **MOCK Payment Strategy** 
- ✅ **Previously**: 95% random success rate (could fail randomly)
- ✅ **Now**: Always succeeds by default
- ✅ **New Features**:
  - Supports `simulateFailure` flag for testing error handling
  - Supports `simulatePending` flag for testing async payment flows
  - No more random failures during development/testing

### 2. **Booking Service**
- ✅ **Removed**: Development mode bypass that created non-standard payment IDs
- ✅ **Improved**: Proper handling of `PENDING` payment status
- ✅ **New**: Bookings can be created with `PENDING` status when payment is pending
- ✅ **Better Logging**: Clear logs showing payment status at each step

## Payment Status States

| Status | Description | Booking Status | Use Case |
|--------|-------------|----------------|----------|
| `SUCCESS` | Payment completed | `CONFIRMED` | Default for MOCK payments |
| `PENDING` | Payment initiated, awaiting confirmation | `PENDING` | Testing async payment flows |
| `FAILED` | Payment failed | N/A (throws error) | Testing error handling |
| `REFUNDED` | Payment was refunded | `CANCELLED` | Testing refund flows |

## Testing Scenarios

### Scenario 1: Basic MOCK Payment (Default)
**Expected**: Always succeeds with `SUCCESS` status

```bash
# Frontend: Complete normal booking flow
1. Browse Events → Select Event → Reserve Seats → Checkout
2. CheckoutPage auto-confirms with MOCK payment
3. Should see "Booking Confirmed!" with booking reference
```

```typescript
// Backend API call
POST /bookings/confirm
{
  "reservationId": "123",
  "userId": "user_abc",
  "paymentMethod": "mock",
  "idempotencyKey": "unique_key_123"
}

// Response
{
  "bookingReference": "BK12345678",
  "status": "CONFIRMED",
  "paymentStatus": "SUCCESS"
}
```

### Scenario 2: Testing PENDING Payment Flow
**Expected**: Booking created with `PENDING` status

```typescript
// Backend API call with metadata flag
POST /bookings/confirm
{
  "reservationId": "123",
  "userId": "user_abc",
  "paymentMethod": "mock",
  "idempotencyKey": "unique_key_123",
  "metadata": {
    "simulatePending": true  // ⭐ This flag triggers PENDING status
  }
}

// Response
{
  "bookingReference": "BK12345678",
  "status": "PENDING",          // ⭐ Booking is PENDING
  "paymentStatus": "PENDING",    // ⭐ Payment is PENDING
  "confirmedAt": null            // ⭐ Not confirmed yet
}
```

**Use Case**: Testing webhook handlers or async payment confirmation flows

### Scenario 3: Testing Payment Failure
**Expected**: Booking fails, error is thrown, no booking created

```typescript
// Backend API call with failure flag
POST /bookings/confirm
{
  "reservationId": "123",
  "userId": "user_abc",
  "paymentMethod": "mock",
  "idempotencyKey": "unique_key_123",
  "metadata": {
    "simulateFailure": true  // ⭐ This flag triggers FAILURE
  }
}

// Response: 400 Bad Request
{
  "message": "Payment failed: Mock payment failed for testing (simulated)",
  "statusCode": 400
}
```

## Step-by-Step Testing Guide

### Prerequisites
1. Backend server running: `pnpm dev`
2. Frontend dev server running: `cd src/frontend && pnpm dev`
3. User account created and logged in

### Test Flow

#### Step 1: Create an Event
```
1. Login as event organizer
2. Navigate to "My Events" → Click "Create Event"
3. Fill in event details:
   - Event Name: "Test Concert"
   - Date: Future date
   - Venue: Select or enter venue
   - Sale Start Time: Current time (to make it on sale immediately)
4. Click "Create Event"
```

#### Step 2: Add Sections
```
1. Click "Sections" button on the event card
2. Add a section:
   - Name: "General Admission"
   - Type: "GENERAL"
   - Price: $50
   - Capacity: 100
3. Click "Add Section"
```

#### Step 3: Make a Reservation (As Customer)
```
1. Logout and login as a different user (or use incognito)
2. Navigate to "Events" page
3. Find your test event
4. Click "Book Now"
5. Select seats/quantity
6. Click "Reserve"
```

#### Step 4: Complete Booking (Checkout)
```
1. You'll be redirected to CheckoutPage
2. Automatically processes MOCK payment
3. Should see:
   ✅ "Booking Confirmed!"
   ✅ Booking Reference (e.g., BK12345678)
   ✅ Option to view bookings or browse more events
```

#### Step 5: Verify Booking
```
1. Click "View My Bookings" or navigate to /bookings
2. Verify booking appears with:
   - Status: CONFIRMED
   - Payment Status: SUCCESS
   - Seat numbers
   - Event details
```

## API Testing with Postman/cURL

### Example 1: Successful MOCK Payment
```bash
curl -X POST http://localhost:3000/bookings/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "reservationId": "123",
    "userId": "user_abc",
    "paymentMethod": "mock",
    "idempotencyKey": "test_key_1"
  }'
```

### Example 2: Simulate PENDING Payment
```bash
curl -X POST http://localhost:3000/bookings/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "reservationId": "123",
    "userId": "user_abc",
    "paymentMethod": "mock",
    "idempotencyKey": "test_key_2",
    "metadata": {
      "simulatePending": true
    }
  }'
```

### Example 3: Simulate Payment Failure
```bash
curl -X POST http://localhost:3000/bookings/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "reservationId": "123",
    "userId": "user_abc",
    "paymentMethod": "mock",
    "idempotencyKey": "test_key_3",
    "metadata": {
      "simulateFailure": true
    }
  }'
```

## Checking Logs

### Backend Logs to Look For

**Successful Payment:**
```
[PaymentService] Processing payment with mock strategy
[MockPaymentStrategy] Processing mock payment for 50 USD
[MockPaymentStrategy] Mock payment: SUCCESS
[BookingService] Payment processed: mock_abc123, Status: SUCCESS
[BookingService] Booking created: BK12345678, Status: CONFIRMED, Payment: SUCCESS
```

**Pending Payment:**
```
[MockPaymentStrategy] Mock payment: Simulating PENDING status
[BookingService] Payment processed: mock_abc123, Status: PENDING
[BookingService] Booking created: BK12345678, Status: PENDING, Payment: PENDING
```

**Failed Payment:**
```
[MockPaymentStrategy] Mock payment: Simulating FAILURE
[BookingService] Booking failed: Payment failed: Mock payment failed for testing (simulated)
```

## Troubleshooting

### Issue: "Reservation not found"
**Solution**: Ensure you have an active reservation before confirming booking. Reservations expire after a set time.

### Issue: "Reservation has expired"
**Solution**: Create a new reservation. The reservation system has timeout logic.

### Issue: Booking always fails
**Check**:
1. Is `simulateFailure: true` in metadata? Remove it.
2. Check backend logs for actual error message
3. Verify payment method is "mock" (lowercase)

### Issue: Cannot see bookings
**Solution**: 
1. Verify you're logged in as the user who made the booking
2. Check `/bookings/me` API endpoint
3. Verify JWT token is valid

## Database Verification

### Check Booking in Database
```sql
-- View recent bookings
SELECT 
  booking_reference,
  status,
  payment_status,
  total_amount,
  created_at,
  confirmed_at
FROM bookings
ORDER BY created_at DESC
LIMIT 10;

-- View booking with details
SELECT 
  b.booking_reference,
  b.status as booking_status,
  b.payment_status,
  e.event_name,
  bi.quantity,
  es.name as section_name,
  s.seat_number
FROM bookings b
JOIN events e ON e.event_id = b.event_id
JOIN booking_items bi ON bi.booking_id = b.booking_id
LEFT JOIN event_sections es ON es.section_id = bi.section_id
LEFT JOIN seats s ON s.seat_id = bi.seat_id
WHERE b.booking_reference = 'BK12345678';
```

## Integration with Real Payment Providers

When you're ready to integrate real payment providers (Stripe, Paystack, etc.):

1. Payment will initially return `PENDING` status
2. Webhook handler will update booking to `CONFIRMED` when payment succeeds
3. MOCK payment helps you test this flow without actual payment API calls

## Summary

✅ **MOCK payments now always succeed by default**  
✅ **No more random failures during testing**  
✅ **Support for PENDING status to test async flows**  
✅ **Support for FAILURE simulation to test error handling**  
✅ **Proper logging throughout the payment flow**  
✅ **Booking status correctly reflects payment status**  

You can now reliably test the booking flow without worrying about random payment failures!
