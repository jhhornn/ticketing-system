# Ticket Purchase Experience - Complete Architecture

## Overview
Complete integration logic for the ticket purchase flow: Event View → Seat Selection → Reservation → Checkout → Confirmation.

**Core Features:**
- ✅ Real-time seat map with optimistic locking
- ✅ Auto-expiring reservations (10 min default)
- ✅ Partial success handling (reserve what you can)
- ✅ Idempotency-protected payments
- ✅ Progressive UX with 7 edge case handlers

---

## 1. API Contracts

### 1.1 GET /events/:eventId/seats

**Purpose:** Fetch real-time seat map grouped by sections for efficient rendering.

**Request:**
```http
GET /events/123/seats HTTP/1.1
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Seat map retrieved successfully",
  "data": {
    "eventId": 123,
    "sections": [
      {
        "name": "Orchestra",
        "seats": [
          {
            "id": 1,
            "seatNumber": "A1",
            "rowNumber": "A",
            "seatType": "PREMIUM",
            "price": "75.00",
            "status": "AVAILABLE",
            "version": 5,
            "reservedUntil": null
          },
          {
            "id": 2,
            "seatNumber": "A2",
            "rowNumber": "A",
            "seatType": "PREMIUM",
            "price": "75.00",
            "status": "RESERVED",
            "version": 8,
            "reservedUntil": "2026-01-09T12:10:00Z"
          }
        ],
        "totalSeats": 100,
        "availableSeats": 45,
        "minPrice": "50.00",
        "maxPrice": "100.00"
      },
      {
        "name": "Balcony",
        "seats": [...],
        "totalSeats": 200,
        "availableSeats": 150,
        "minPrice": "30.00",
        "maxPrice": "50.00"
      }
    ],
    "totalSeats": 500,
    "availableSeats": 234,
    "timestamp": "2026-01-09T12:00:00Z"
  }
}
```

**Frontend Usage:**
```typescript
// Poll every 10 seconds for real-time updates
const seatMap = await SeatsService.getSeatMapForEvent(eventId);

// sections can be rendered progressively
seatMap.sections.forEach(section => {
  renderSection(section); // Virtual scrolling supported
});
```

---

### 1.2 POST /events/:eventId/reservations

**Purpose:** Reserve selected seats with optimistic locking. Returns partial success.

**Request:**
```http
POST /events/123/reservations HTTP/1.1
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "seats": [
    { "seatId": 1, "version": 5 },
    { "seatId": 2, "version": 8 },
    { "seatId": 3, "version": 12 }
  ],
  "sessionId": "session-1704805200000"
}
```

**Response (201 Created) - Full Success:**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Successfully reserved 3 seats",
  "data": {
    "id": 789,
    "reservedSeatIds": [1, 2, 3],
    "expiresAt": "2026-01-09T12:10:00Z",
    "expiresInSeconds": 600
  }
}
```

**Response (201 Created) - Partial Success:**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Reserved 2 seats, 1 failed",
  "data": {
    "id": 789,
    "reservedSeatIds": [1, 2],
    "expiresAt": "2026-01-09T12:10:00Z",
    "expiresInSeconds": 600,
    "failedSeats": [
      {
        "seatId": 3,
        "reason": "Seat was modified by another user (stale version)"
      }
    ]
  }
}
```

**Response (409 Conflict) - Complete Failure:**
```json
{
  "statusCode": 409,
  "success": false,
  "message": "No seats could be reserved",
  "data": {
    "failedSeats": [
      { "seatId": 1, "reason": "Seat is reserved" },
      { "seatId": 2, "reason": "Seat is booked" },
      { "seatId": 3, "reason": "Seat was modified by another user (stale version)" }
    ]
  }
}
```

**Frontend Handling:**
```typescript
try {
  const result = await ReservationsService.createReservation(eventId, {
    seats: payload,
    sessionId: `session-${Date.now()}`,
  });

  if (result.failedSeats && result.failedSeats.length > 0) {
    // Partial success
    const staleVersions = result.failedSeats.filter(f =>
      f.reason.includes('stale version')
    );

    if (staleVersions.length > 0) {
      showToast('warning', '🔄 Some seats just taken. Refreshing...');
      refreshSeatMap(); // Get new versions
    } else {
      showToast('warning', `⚠️ Reserved ${result.reservedSeatIds.length} seats`);
    }
  }

  if (result.reservedSeatIds.length > 0) {
    startTimer(result.expiresAt);
    navigateToCheckout();
  }
} catch (error) {
  if (error.response?.status === 409) {
    showToast('error', '❌ All seats unavailable. Please select different seats.');
    refreshSeatMap();
  }
}
```

---

### 1.3 POST /bookings

**Purpose:** Create booking with payment processing. Uses idempotency key.

**Request:**
```http
POST /bookings HTTP/1.1
Authorization: Bearer <jwt_token>
Idempotency-Key: booking-a1b2c3d4-e5f6-7890-abcd-ef1234567890
Content-Type: application/json

{
  "eventId": 123,
  "seatIds": [1, 2, 3],
  "paymentMethod": "stripe",
  "discountCode": "SUMMER10"
}
```

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Booking confirmed successfully",
  "data": {
    "bookingId": "456",
    "bookingReference": "BK-2026-001234",
    "eventId": 123,
    "userId": "user-abc",
    "totalAmount": 202.50,
    "status": "CONFIRMED",
    "paymentStatus": "SUCCESS",
    "paymentTransactionId": "pi_1234567890",
    "seatNumbers": ["A1", "A2", "A3"],
    "createdAt": "2026-01-09T12:05:00Z",
    "confirmedAt": "2026-01-09T12:05:15Z"
  }
}
```

**Response (200 OK) - Idempotency Replay:**
```http
HTTP/1.1 200 OK
Idempotency-Replay: true
Content-Type: application/json

{
  "statusCode": 200,
  "success": true,
  "message": "Booking already exists (duplicate request prevented)",
  "data": { ...same booking data... }
}
```

**Frontend Handling:**
```typescript
const idempotencyKey = generateIdempotencyKey(); // uuid-v4

try {
  const booking = await BookingsService.createBooking({
    eventId,
    seatIds: reservedSeatIds,
    paymentMethod: 'stripe',
    discountCode,
  }, idempotencyKey);

  // Check for replay
  if (response.headers['idempotency-replay']) {
    showToast('success', '✅ Booking already confirmed (duplicate prevented)');
  }

  navigateToConfirmation(booking.bookingReference);
} catch (error) {
  if (error.response?.status === 402) {
    // Payment failed - safe to retry with SAME key
    showToast('error', '💳 Payment declined. Please try again.');
  } else if (error.response?.status === 409) {
    // Seats no longer available
    showToast('error', '❌ Seats no longer available. Reservation expired.');
    redirectToSeatMap();
  }
}
```

---

## 2. Frontend State Management

### 2.1 useSeatSelection Hook

**Purpose:** Manage local seat selection before reservation.

**State:**
```typescript
interface SelectedSeatInfo {
  id: number;
  seatNumber: string;
  price: string;
  version: number; // For optimistic locking
  section: string;
}
```

**Actions:**
```typescript
const {
  selectedSeats,
  totalPrice,
  seatCount,
  toggleSeat,        // Add/remove seat
  clearSelection,
  isSeatSelected,
  getReservationPayload, // Returns [{ seatId, version }]
} = useSeatSelection(maxSeats = 10);
```

**Pseudo-code:**
```typescript
function toggleSeat(seat: Seat, section: string) {
  if (seat.status !== 'AVAILABLE') return;
  
  const isSelected = selectedSeats.some(s => s.id === seat.id);
  
  if (isSelected) {
    // Remove
    setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
  } else {
    // Add (check max limit)
    if (selectedSeats.length >= maxSeats) {
      showToast('warning', `Max ${maxSeats} seats allowed`);
      return;
    }
    
    setSelectedSeats(prev => [...prev, {
      id: seat.id,
      seatNumber: seat.seatNumber,
      price: seat.price,
      version: seat.version, // CRITICAL: Store version
      section,
    }]);
  }
}

function getReservationPayload() {
  // Backend expects: { seatId, version }[]
  return selectedSeats.map(seat => ({
    seatId: seat.id,
    version: seat.version,
  }));
}
```

---

### 2.2 useReservationTimer Hook

**Purpose:** Countdown timer with auto-expiry callback.

**State:**
```typescript
const {
  timeRemaining,           // seconds (e.g., 567)
  timeRemainingFormatted,  // "MM:SS" (e.g., "09:27")
  isExpired,               // true when hits 0
  isWarning,               // true when < 60s
  progressPercentage,      // 0-100 for progress bar
  reset,
  clear,
} = useReservationTimer({
  expiresAt: reservationData.expiresAt,
  onExpire: () => {
    showToast('error', '⏱️ Reservation expired');
    navigateToSeatMap();
  },
  warningThresholdSeconds: 60,
});
```

**Pseudo-code:**
```typescript
function useReservationTimer({ expiresAt, onExpire, warningThreshold = 60 }) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  
  useEffect(() => {
    if (!expiresAt) return;
    
    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        setIsExpired(true);
        onExpire?.();
        clearInterval(interval);
      }
    };
    
    updateTimer(); // Initial
    const interval = setInterval(updateTimer, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  const formatted = `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`;
  const isWarning = timeRemaining > 0 && timeRemaining <= warningThreshold;
  
  return { timeRemaining, timeRemainingFormatted: formatted, isExpired, isWarning };
}
```

**UI Integration:**
```tsx
<div className={`timer ${isWarning ? 'warning' : ''}`}>
  <span>⏱️ {timeRemainingFormatted}</span>
  <div className="progress-bar">
    <div style={{ width: `${progressPercentage}%` }} />
  </div>
</div>
```

---

### 2.3 useCheckoutStateMachine Hook

**Purpose:** Manage complete checkout flow with idempotency.

**State Machine:**
```
IDLE → RESERVING → RESERVED → PROCESSING_PAYMENT → CONFIRMING → CONFIRMED
   ↓                  ↓              ↓                    ↓
 FAILED ←─────────────┴──────────────┴────────────────────┘
   ↓
EXPIRED (timer runs out)
```

**Usage:**
```typescript
const {
  state,                    // Current state
  reservationData,          // { reservedSeatIds, expiresAt, ... }
  bookingData,              // { bookingReference, ... }
  error,                    // { message, retryable, ... }
  idempotencyKey,           // Generated UUID for payment
  
  startReservation,
  reservationSuccess,
  reservationFailed,
  startPayment,
  paymentSuccess,
  paymentFailed,
  confirmationSuccess,
  confirmationFailed,
  reservationExpired,
  reset,
  
  canRetry,
  isLoading,
  generateNewIdempotencyKey,
} = useCheckoutStateMachine();
```

**Pseudo-code:**
```typescript
// Step 1: Reserve seats
const handleReserve = async () => {
  startReservation(); // state = RESERVING
  
  try {
    const result = await reserveSeats(eventId, selectedSeats);
    reservationSuccess(result); // state = RESERVED
  } catch (err) {
    reservationFailed({ message: err.message, retryable: true }); // state = FAILED
  }
};

// Step 2: Process payment
const handlePayment = async (paymentInfo) => {
  startPayment(); // state = PROCESSING_PAYMENT, generates idempotencyKey
  
  try {
    const booking = await createBooking({
      ...paymentInfo,
      idempotencyKey, // MUST include for safety
    });
    
    confirmationSuccess(booking); // state = CONFIRMED
  } catch (err) {
    if (err.status === 402) {
      // Payment declined - RETRY WITH SAME KEY
      paymentFailed({ message: 'Payment declined', retryable: true });
    } else if (err.status === 409) {
      // Seats no longer available - CANNOT RETRY
      paymentFailed({ message: 'Reservation expired', retryable: false });
    } else {
      // Network error - RETRY WITH SAME KEY
      paymentFailed({ message: 'Network error', retryable: true });
    }
  }
};

// Timer expiry
useReservationTimer({
  expiresAt: reservationData?.expiresAt,
  onExpire: () => {
    reservationExpired(); // state = EXPIRED
    showModal('Reservation expired. Please select seats again.');
  },
});
```

---

## 3. Idempotency Key Strategy

### 3.1 Generation

```typescript
import { v4 as uuidv4 } from 'uuid';

function generateIdempotencyKey(): string {
  return `booking-${uuidv4()}`;
  // Example: "booking-a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### 3.2 Lifecycle

**When to Generate:**
- Generate ONCE when entering `PROCESSING_PAYMENT` state
- Store in state machine
- Reuse on retry if `retryable: true`

**When to Reset:**
- After `CONFIRMED` state
- After user clicks "Start Over" (reset state machine)
- Never reset on retryable failures

**Backend Behavior:**
```sql
-- Backend stores in idempotency_keys table
CREATE TABLE idempotency_keys (
  key VARCHAR(255) PRIMARY KEY,
  request TEXT,           -- JSON of original request
  response TEXT,          -- JSON of response
  status_code INT,        -- 201, 200, etc.
  created_at TIMESTAMP,
  expires_at TIMESTAMP    -- TTL 24 hours
);

-- On request with Idempotency-Key:
-- 1. Check if key exists
--    YES → Return cached response with 200 OK, header: Idempotency-Replay: true
--    NO  → Process request, store response, return 201 Created
```

### 3.3 Error Scenarios

| Error | Status | Retryable | Action | Same Key? |
|-------|--------|-----------|--------|-----------|
| Network timeout | - | ✅ Yes | Retry payment | ✅ Yes |
| Payment declined | 402 | ✅ Yes | Update payment info, retry | ✅ Yes |
| Validation error | 400 | ❌ No | Fix input, start over | ❌ No (reset) |
| Seat conflict | 409 | ❌ No | Go back to seat selection | ❌ No (reset) |
| Server error | 500 | ✅ Yes | Retry after delay | ✅ Yes |
| Reservation expired | 409 | ❌ No | Start over | ❌ No (reset) |

---

## 4. UX Edge Cases

### 4.1 Reservation Expired (During Checkout)

**Trigger:** Timer reaches 0:00

**UI Feedback:**
```tsx
// Modal overlay (blocking)
<Modal isOpen={state === 'EXPIRED'}>
  <div className="modal-content error">
    <span className="icon">⏱️</span>
    <h2>Reservation Expired</h2>
    <p>Your seat reservation has expired after 10 minutes.</p>
    <p>The seats have been released back to availability.</p>
    <button onClick={handleGoBack}>
      Select Seats Again
    </button>
  </div>
</Modal>

// Action
function handleGoBack() {
  reset(); // Clear state machine
  clearSelection(); // Clear selected seats
  navigate(`/events/${eventId}`); // Return to seat map
}
```

**Backend:** Cron job runs every minute to release expired reservations:
```typescript
@Cron('* * * * *') // Every minute
async releaseExpiredReservations() {
  const expired = await this.prisma.reservation.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lte: new Date() },
    },
  });

  for (const res of expired) {
    await this.prisma.$transaction([
      this.prisma.seat.update({
        where: { id: res.seatId },
        data: {
          status: 'AVAILABLE',
          reservedBy: null,
          reservedUntil: null,
          version: { increment: 1 }, // Bump version
        },
      }),
      this.prisma.reservation.update({
        where: { id: res.id },
        data: { status: 'EXPIRED' },
      }),
    ]);
  }
}
```

---

### 4.2 Seat Stolen (Optimistic Lock Failure)

**Trigger:** Backend returns `failedSeats` with `"stale version"` reason

**UI Feedback:**
```tsx
// Toast notification (non-blocking)
showToast('warning', '🔄 Some seats were just reserved by another user. Refreshing seat map...', 6000);

// Immediate action
await refreshSeatMap(); // GET /events/:id/seats

// Update UI
// - Remove failed seats from selection
// - Highlight newly available seats (if any)
// - Show updated versions for retry
```

**Code:**
```typescript
const result = await ReservationsService.createReservation(eventId, payload);

if (result.failedSeats) {
  const staleSeats = result.failedSeats.filter(f =>
    f.reason.includes('stale version')
  );

  if (staleSeats.length > 0) {
    // Remove failed seats from selection
    const failedIds = staleSeats.map(f => f.seatId);
    setSelectedSeats(prev => prev.filter(s => !failedIds.includes(s.id)));

    // Refresh to get new versions
    showToast('warning', '🔄 Refreshing seat map with latest data...');
    const newSeatMap = await SeatsService.getSeatMapForEvent(eventId);
    setSeatMap(newSeatMap);
  }
}
```

---

### 4.3 Payment Declined

**Trigger:** Payment gateway returns decline (HTTP 402 or gateway error)

**UI Feedback:**
```tsx
// Error message (persistent, not toast)
<div className="payment-error">
  <span className="icon">💳</span>
  <h3>Payment Declined</h3>
  <p>{error.message}</p>
  <p className="help-text">
    Please check your payment details and try again.
    Your seat reservation is still active for {timeRemainingFormatted}.
  </p>
  <button onClick={handleRetryPayment}>
    Update Payment & Retry
  </button>
  <button onClick={handleCancel} className="secondary">
    Cancel & Release Seats
  </button>
</div>

// Retry with SAME idempotency key
function handleRetryPayment() {
  // User updates card details in form
  // Click submit → calls payment API with SAME idempotencyKey
  startPayment(); // Reuses existing idempotencyKey
  
  try {
    await createBooking({ ...paymentInfo }, idempotencyKey);
  } catch (err) {
    // If still declined, show error again
  }
}
```

---

### 4.4 Network Error (During Payment)

**Trigger:** Request timeout, connection lost, 503 Service Unavailable

**UI Feedback:**
```tsx
// Auto-retry with exponential backoff
showToast('error', '📡 Connection lost. Retrying in 3 seconds...', 3000);

// Retry logic
async function retryWithBackoff(attempt = 1) {
  const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
  
  await sleep(delay);
  
  try {
    return await createBooking({ ...paymentInfo }, idempotencyKey);
  } catch (err) {
    if (attempt < 3) {
      showToast('warning', `Retry attempt ${attempt + 1}...`);
      return retryWithBackoff(attempt + 1);
    } else {
      throw new Error('Maximum retry attempts reached');
    }
  }
}
```

**Idempotency Safety:** Using the same key ensures:
- If payment succeeded but response was lost → backend returns cached success (200 OK)
- If payment failed → backend retries payment with new attempt
- No duplicate charges

---

### 4.5 Partial Reservation Success

**Trigger:** POST /reservations returns `{ reservedSeatIds: [1, 2], failedSeats: [{ seatId: 3, ... }] }`

**UI Feedback:**
```tsx
// Warning toast
showToast('warning', `⚠️ Reserved 2 of 3 seats. 1 seat unavailable.`, 0);

// Modal with details
<Modal>
  <h3>Partial Reservation</h3>
  <div className="success-section">
    <h4>✅ Reserved (2 seats)</h4>
    <ul>
      <li>A1 - $50.00</li>
      <li>A2 - $50.00</li>
    </ul>
  </div>
  <div className="failed-section">
    <h4>❌ Unavailable (1 seat)</h4>
    <ul>
      <li>A3 - Seat is reserved</li>
    </ul>
  </div>
  <div className="actions">
    <button onClick={handleProceed}>
      Proceed with 2 Seats ($100.00)
    </button>
    <button onClick={handleSelectMore} className="secondary">
      Select More Seats
    </button>
    <button onClick={handleCancel} className="tertiary">
      Cancel & Start Over
    </button>
  </div>
</Modal>
```

---

### 4.6 Session Warning (1 Minute Remaining)

**Trigger:** `timeRemaining === 60` (1 minute left)

**UI Feedback:**
```tsx
// Hook watches timer
useEffect(() => {
  if (timeRemaining === 60) {
    showToast('warning', '⏰ 1 minute remaining! Complete checkout to secure your seats.', 0);
    
    // Optional: Play sound alert
    playNotificationSound();
    
    // Optional: Browser notification (if permitted)
    if (Notification.permission === 'granted') {
      new Notification('Ticketing System', {
        body: '1 minute left on your reservation!',
        icon: '/logo.png',
      });
    }
  }
}, [timeRemaining]);

// Visual pulsing effect
<div className={`timer ${timeRemaining <= 60 ? 'pulse-warning' : ''}`}>
  {timeRemainingFormatted}
</div>
```

---

### 4.7 Duplicate Booking Prevention (Idempotency Replay)

**Trigger:** Backend returns `200 OK` with `Idempotency-Replay: true` header

**UI Feedback:**
```tsx
// Detect replay
const response = await createBooking(...);

if (response.headers['idempotency-replay'] === 'true') {
  showToast('success', '✅ Booking already confirmed (duplicate request prevented).', 5000);
  
  // Still navigate to confirmation (booking exists)
  navigate(`/bookings/${response.data.bookingReference}`);
}

// Log for analytics
analytics.track('idempotency_replay_detected', {
  bookingReference: response.data.bookingReference,
  timestamp: new Date().toISOString(),
});
```

**Why This Matters:**
- User double-clicks "Confirm" button
- Network issue causes retry
- Browser back button → forward → resubmit
- All these scenarios are handled safely

---

## 5. Complete User Flow (Step by Step)

### Step 1: Event Details Page

```tsx
<EventDetailsPage>
  <EventInfo />
  <button onClick={() => navigate(`/events/${eventId}/seats`)}>
    Select Seats
  </button>
</EventDetailsPage>
```

### Step 2: Seat Selection

```tsx
<SeatSelectionPage>
  <EnhancedSeatMap
    eventId={eventId}
    onReservationComplete={(data) => {
      // Navigate to checkout with reservation data
      navigate(`/events/${eventId}/checkout`, { state: { reservation: data } });
    }}
  />
</SeatSelectionPage>
```

**User Actions:**
- Click available seats (green) → turns blue (selected)
- See total price update in real-time
- Click "Reserve Seats" → POST /events/:id/reservations

**Backend Response:**
- Success → Start 10-minute timer
- Partial success → Show modal, let user decide
- Complete failure → Show error, keep on page

### Step 3: Checkout (Reservation Active)

```tsx
<CheckoutPage>
  {/* Timer at top */}
  <ReservationTimer expiresAt={reservation.expiresAt} />
  
  {/* Order summary */}
  <OrderSummary
    seats={reservation.reservedSeatIds}
    total={totalAmount}
  />
  
  {/* Payment form */}
  <PaymentForm
    onSubmit={(paymentInfo) => handlePayment(paymentInfo)}
  />
  
  {/* Discount code */}
  <DiscountCodeInput />
</CheckoutPage>
```

**User Actions:**
- Enter payment details (card, billing)
- Optional: Apply discount code
- Click "Confirm Booking"

**Frontend:**
```typescript
const handlePayment = async (paymentInfo) => {
  startPayment(); // Generates idempotencyKey
  
  try {
    const booking = await BookingsService.createBooking({
      eventId,
      seatIds: reservation.reservedSeatIds,
      paymentMethod: 'stripe',
      discountCode: discountCode || undefined,
    }, idempotencyKey);
    
    confirmationSuccess(booking);
    navigate(`/bookings/${booking.bookingReference}`);
  } catch (error) {
    handlePaymentError(error);
  }
};
```

### Step 4: Confirmation Page

```tsx
<ConfirmationPage>
  <div className="success-banner">
    <span className="icon">🎉</span>
    <h1>Booking Confirmed!</h1>
    <p>Your tickets have been secured.</p>
  </div>
  
  <BookingDetails
    reference={booking.bookingReference}
    seats={booking.seatNumbers}
    event={eventDetails}
    qrCode={booking.qrCode}
  />
  
  <button onClick={() => navigate(`/bookings`)}>
    View My Bookings
  </button>
  
  <button onClick={handleDownloadPDF}>
    Download Tickets (PDF)
  </button>
  
  <button onClick={handleEmailTickets}>
    Email Tickets
  </button>
</ConfirmationPage>
```

---

## 6. Performance Optimizations

### 6.1 Seat Map Polling Strategy

**Problem:** Polling every 10s for 500 seats = high bandwidth

**Solution: Conditional requests**
```typescript
let lastTimestamp: Date | null = null;

async function pollSeatMap() {
  const response = await api.get(`/events/${eventId}/seats`, {
    headers: {
      'If-Modified-Since': lastTimestamp?.toISOString(),
    },
  });
  
  if (response.status === 304) {
    // Not modified, skip update
    return;
  }
  
  // Update UI
  const newSeatMap = response.data.data;
  lastTimestamp = newSeatMap.timestamp;
  setSeatMap(newSeatMap);
}
```

### 6.2 Seat Grouping by Section

**Why:** Rendering 500 individual seats is slow

**Solution:** Virtual scrolling + section grouping
```tsx
<VirtualizedList
  data={seatMap.sections}
  renderItem={(section) => (
    <SectionView
      key={section.name}
      section={section}
      onSeatClick={handleSeatClick}
    />
  )}
  height={600}
  itemHeight={200}
/>
```

### 6.3 Optimistic UI Updates

**Before reservation:**
```typescript
function handleReserve() {
  // Optimistic: Mark seats as "reserving"
  setSelectedSeats(prev => prev.map(s => ({ ...s, status: 'RESERVING' })));
  
  reserveSeats()
    .then(() => {
      // Success: Update to "reserved"
      setSelectedSeats(prev => prev.map(s => ({ ...s, status: 'RESERVED' })));
    })
    .catch(() => {
      // Rollback: Revert to "available"
      setSelectedSeats(prev => prev.map(s => ({ ...s, status: 'AVAILABLE' })));
    });
}
```

---

## 7. Testing Scenarios

### 7.1 Happy Path

1. Load event → seat map appears
2. Select 3 seats → total price updates
3. Click "Reserve" → success, timer starts
4. Enter payment → click "Confirm"
5. Payment succeeds → confirmation page
6. **Expected:** Booking created, seats marked BOOKED

### 7.2 Optimistic Lock Conflict

1. User A selects seat 1 (version 5)
2. User B selects seat 1 (version 5)
3. User A reserves → Success (version → 6)
4. User B reserves → Fail (version mismatch)
5. **Expected:** User B sees toast, seat map refreshes

### 7.3 Reservation Expiry

1. Reserve seats → timer starts (10 min)
2. Wait 10 minutes (or mock timer)
3. **Expected:** Modal appears, seats released, navigate to seat map

### 7.4 Payment Retry (Idempotency)

1. Reserve seats
2. Enter payment, submit
3. Network fails (mock with delay)
4. Retry with same idempotency key
5. **Expected:** Payment processed once, no duplicate booking

### 7.5 Partial Reservation

1. Select seats 1, 2, 3
2. Another user reserves seat 2
3. Submit reservation
4. **Expected:** Seats 1, 3 reserved, seat 2 failed, modal shows options

---

## 8. Monitoring & Analytics

### Key Metrics to Track

```typescript
// Analytics events
analytics.track('seat_selected', { seatId, eventId, price });
analytics.track('reservation_started', { eventId, seatCount, totalPrice });
analytics.track('reservation_success', { eventId, reservedSeats, failedSeats });
analytics.track('reservation_expired', { eventId, seatCount, timeElapsed });
analytics.track('payment_started', { eventId, amount, paymentMethod });
analytics.track('payment_success', { eventId, bookingReference, amount });
analytics.track('payment_failed', { eventId, reason, retryable });
analytics.track('optimistic_lock_conflict', { eventId, seatIds });
analytics.track('idempotency_replay', { bookingReference });
```

### Backend Logging

```typescript
this.logger.log(`Reservation created: ${reservationId}, seats: ${reservedSeatIds}, expires: ${expiresAt}`);
this.logger.warn(`Optimistic lock conflict: seat ${seatId}, expected version ${version}, actual ${seat.version}`);
this.logger.error(`Payment failed: ${error.message}, bookingRef: ${bookingRef}, retryable: ${retryable}`);
this.logger.log(`Idempotency replay: key ${idempotencyKey}, cached response returned`);
```

---

## 9. Security Considerations

### 9.1 Authorization

- All endpoints require JWT authentication
- Users can only reserve/book for themselves (userId from token)
- Admin can cancel any booking

### 9.2 Rate Limiting

```typescript
// Prevent spam reservations
@Throttle(5, 60) // 5 requests per minute
@Post('/events/:eventId/reservations')
async reserve() { ... }
```

### 9.3 Idempotency Key Validation

```typescript
// Backend validates key format
if (!/^booking-[0-9a-f-]{36}$/.test(idempotencyKey)) {
  throw new BadRequestException('Invalid idempotency key format');
}

// Check expiry (24 hours)
const existing = await this.prisma.idempotencyKey.findUnique({
  where: { key: idempotencyKey },
});

if (existing && existing.expiresAt < new Date()) {
  await this.prisma.idempotencyKey.delete({ where: { key: idempotencyKey } });
  // Process as new request
}
```

---

## 10. Summary

✅ **Implemented:**
- Real-time seat map with section grouping
- Optimistic locking with version tracking
- Partial success handling (reserve what you can)
- Auto-expiring reservations with countdown timer
- Idempotency-protected payments
- 7 comprehensive UX edge cases
- State machine for checkout flow
- Complete API contracts with examples

🔑 **Key Takeaways:**
1. **Optimistic Locking:** Prevents race conditions, gracefully handles conflicts
2. **Idempotency:** Ensures payment safety, prevents duplicate bookings
3. **Partial Success:** Better UX than all-or-nothing failures
4. **Timer-Driven Flow:** Keeps seats available, prevents stale reservations
5. **Progressive Enhancement:** Works even if some features fail (polling, notifications)

🚀 **Next Steps:**
1. Run `pnpm dev` to start both frontend/backend
2. Test seat selection flow end-to-end
3. Simulate conflicts with multiple browser windows
4. Test idempotency with network delays
5. Load test with 100+ concurrent users

---

**Files Modified:**
- Backend: 5 files (seats.controller, seats.service, dto, reservation.service, reservation.controller)
- Frontend: 8 files (3 hooks, EnhancedSeatMap, 2 services, types)
- Documentation: 1 file (this document)

**Total Lines of Code Added:** ~1,500 lines
