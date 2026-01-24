# Frontend API Services - Quick Reference

All API services are now available and ready to be consumed by the frontend.

## Available Services

### 1. **AuthService** (`services/auth.ts`)
```typescript
import { AuthService } from './services';

// Login
await AuthService.login({ email, password });

// Register
await AuthService.register({ email, password, name });

// Logout
AuthService.logout();

// Check authentication
AuthService.isAuthenticated();
```

### 2. **EventsService** (`services/events.ts`)
```typescript
import { EventsService, EventStatus } from './services';

// Get all events
await EventsService.getAll(onlyOwned?: boolean);

// Get event by ID
await EventsService.getById(id);

// Create event
await EventsService.create({
  eventName: string,
  eventDate: string, // ISO 8601
  venueName?: string,
  totalSeats: number,
  saleStartTime?: string // ISO 8601
});

// Update event
await EventsService.update(id, { ...updateData });

// Delete event
await EventsService.delete(id);
```

### 3. **ReservationsService** (`services/reservations.ts`)
```typescript
import { ReservationsService } from './services';

// Create reservation
await ReservationsService.create({
  eventId: number,
  seatNumbers: string[],
  userId: string
});

// Cancel reservation
await ReservationsService.cancel(id, userId);

// Get user reservations
await ReservationsService.getUserReservations(userId);
```

### 4. **BookingsService** (`services/bookings.ts`)
```typescript
import { BookingsService, PaymentMethod } from './services';

// Confirm booking
await BookingsService.confirmBooking({
  reservationId: string,
  userId: string,
  paymentMethod: PaymentMethod.MOCK,
  idempotencyKey: string,
  metadata?: {}
});

// Get booking by reference
await BookingsService.getByReference(bookingReference);

// Get user bookings
await BookingsService.getMyBookings(userId);
```

### 5. **SeatsService** (`services/seats.ts`)
```typescript
import { SeatsService } from './services';

// Get seats for an event
await SeatsService.getEventSeats(eventId);
```

### 6. **DiscountsService** (`services/discounts.ts`)
```typescript
import { DiscountsService, DiscountType } from './services';

// Get all discounts
await DiscountsService.getAll();

// Get discount by ID
await DiscountsService.getById(id);

// Create discount (Admin only)
await DiscountsService.create({
  code: string,
  type: DiscountType.PERCENTAGE | DiscountType.FIXED,
  value: number,
  maxUses?: number,
  validFrom?: string,
  validUntil?: string
});

// Update discount (Admin only)
await DiscountsService.update(id, { ...updateData });

// Delete discount (Admin only)
await DiscountsService.delete(id);
```

### 7. **StatsService** (`services/stats.ts`)
```typescript
import { StatsService } from './services';

// Get organization statistics
await StatsService.getOrgStats();
```

## Enums

### EventStatus
- `DRAFT`
- `ON_SALE`
- `SOLD_OUT`
- `CANCELLED`
- `COMPLETED`

### SeatStatus
- `AVAILABLE`
- `RESERVED`
- `BOOKED`

### BookingStatus
- `PENDING`
- `CONFIRMED`
- `CANCELLED`

### PaymentStatus
- `PENDING`
- `SUCCESS`
- `FAILED`
- `REFUNDED`

### PaymentMethod
- `stripe`
- `paystack`
- `flutterwave`
- `mock`

### DiscountType
- `PERCENTAGE`
- `FIXED`

## Authentication

All services use the axios instance from `services/api.ts` which automatically:
- Adds the JWT token from localStorage to all requests
- Handles 401 errors by removing the token
- Sets the base URL to `http://localhost:3000`

## Usage in Components

```typescript
import { EventsService, BookingsService } from '../services';

const MyComponent = () => {
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await EventsService.getAll();
        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };
    
    fetchEvents();
  }, []);
  
  // ... rest of component
};
```

## Notes

1. All services handle errors through axios interceptors
2. Authentication token is automatically included in requests
3. Date/time fields should be in ISO 8601 format
4. The CreateEventModal component handles datetime conversion automatically
5. CORS is configured for `http://localhost:5173`
6. Backend API documentation available at: `http://localhost:3000/api`
