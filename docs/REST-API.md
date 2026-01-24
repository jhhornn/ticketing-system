# REST API Reference

Complete API reference for the Distributed Ticketing System.

**Base URL:** `http://localhost:3000`  
**API Documentation:** `http://localhost:3000/api` (Swagger UI)

## Table of Contents

- [Authentication](#authentication)
- [Events](#events)
- [Event Sections](#event-sections)
- [Reservations](#reservations)
- [Bookings](#bookings)
- [Seats](#seats)
- [Discounts](#discounts)
- [Venues](#venues)
- [Statistics](#statistics)
- [Advertisements](#advertisements)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)

---

## Authentication

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER"
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "userId": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "userId": "uuid",
      "email": "user@example.com",
      "role": "CUSTOMER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Profile
```http
GET /auth/profile
Authorization: Bearer {token}
```

**Roles:**
- `ADMIN` - Full system access
- `ORGANIZER` - Create and manage events
- `CUSTOMER` - Browse and book tickets

---

## Events

### Create Event
```http
POST /events
Authorization: Bearer {token}
Content-Type: application/json

{
  "eventName": "Summer Music Festival 2026",
  "eventDate": "2026-07-15T18:00:00Z",
  "venueId": 1,
  "customVenue": null,
  "totalSeats": 5000,
  "isFree": false,
  "saleStartTime": "2026-06-01T00:00:00Z"
}
```

**Response:**
```json
{
  "data": {
    "id": 123,
    "eventName": "Summer Music Festival 2026",
    "eventDate": "2026-07-15T18:00:00.000Z",
    "venueId": 1,
    "totalSeats": 5000,
    "availableSeats": 5000,
    "status": "DRAFT",
    "isFree": false,
    "createdBy": "user-uuid",
    "createdAt": "2026-01-24T10:00:00.000Z"
  }
}
```

### Get All Events
```http
GET /events?status=ON_SALE&limit=20&offset=0
```

**Query Parameters:**
- `status` - Filter by status: `DRAFT`, `ON_SALE`, `SOLD_OUT`, `CANCELLED`, `COMPLETED`
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

### Get Event by ID
```http
GET /events/{eventId}
```

### Get Event Inventory
```http
GET /events/{eventId}/inventory
```

**Response:**
```json
{
  "data": {
    "eventId": 123,
    "eventName": "Summer Music Festival 2026",
    "totalSeats": 5000,
    "availableSeats": 3500,
    "sections": [
      {
        "id": 1,
        "name": "VIP Section",
        "type": "ASSIGNED",
        "price": 150.00,
        "totalCapacity": 100,
        "available": 75,
        "seats": [...]
      },
      {
        "id": 2,
        "name": "General Admission",
        "type": "GENERAL",
        "price": 50.00,
        "totalCapacity": 4900,
        "available": 3425
      }
    ]
  }
}
```

### Check Purchase Eligibility
```http
GET /events/{eventId}/can-purchase
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "canPurchase": true,
    "reasons": []
  }
}
```

**Validation Reasons:**
- Event not on sale yet
- Event sold out
- Event cancelled
- User already has pending reservations
- Max tickets per user exceeded

### Update Event
```http
PATCH /events/{eventId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "eventName": "Updated Event Name",
  "status": "ON_SALE"
}
```

### Delete Event
```http
DELETE /events/{eventId}
Authorization: Bearer {token}
```

---

## Event Sections

Sections define pricing zones and seating arrangements within an event.

### Create Section
```http
POST /sections
Authorization: Bearer {token}
Content-Type: application/json

{
  "eventId": 123,
  "name": "VIP Section",
  "type": "ASSIGNED",
  "price": 150.00,
  "totalCapacity": 100,
  "generateSeats": true,
  "rows": 10,
  "seatsPerRow": 10
}
```

**Section Types:**
- `GENERAL` - General admission (no assigned seats)
- `ASSIGNED` - Assigned seating with seat numbers

**Response:**
```json
{
  "data": {
    "id": 1,
    "eventId": 123,
    "name": "VIP Section",
    "type": "ASSIGNED",
    "price": 150.00,
    "totalCapacity": 100,
    "allocated": 0,
    "createdAt": "2026-01-24T10:00:00.000Z"
  }
}
```

### Get Event Sections
```http
GET /sections/event/{eventId}
```

### Update Section
```http
PATCH /sections/{sectionId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Premium VIP",
  "price": 175.00,
  "totalCapacity": 120
}
```

**Notes:**
- Cannot reduce capacity below allocated seats
- Price changes don't affect existing bookings

### Delete Section
```http
DELETE /sections/{sectionId}
Authorization: Bearer {token}
```

**Restrictions:**
- Cannot delete section with allocated seats
- Cannot delete section with active reservations

---

## Reservations

Time-limited seat holds (default: 10 minutes).

### Create Reservation
```http
POST /events/{eventId}/reservations
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "ASSIGNED",
  "sectionId": 1,
  "seats": [
    { "seatId": 101, "version": 1 },
    { "seatId": 102, "version": 1 }
  ]
}
```

**For General Admission:**
```json
{
  "type": "GENERAL",
  "sectionId": 2,
  "quantity": 4
}
```

**Response:**
```json
{
  "data": {
    "id": 456,
    "reservedSeatIds": [101, 102],
    "expiresAt": "2026-01-24T10:10:00.000Z",
    "expiresInSeconds": 600
  }
}
```

**Optimistic Locking:**
- Each seat has a `version` number
- Version must match for reservation to succeed
- Prevents race conditions during concurrent bookings

### Cancel Reservation
```http
DELETE /events/{eventId}/reservations/{reservationId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user-uuid"
}
```

### Get User Reservations
```http
GET /events/{eventId}/reservations/user/{userId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": [
    {
      "id": 456,
      "eventId": 123,
      "reservedSeatIds": [101, 102],
      "expiresAt": "2026-01-24T10:10:00.000Z",
      "expiresInSeconds": 245,
      "status": "ACTIVE"
    }
  ]
}
```

---

## Bookings

Convert reservations into confirmed bookings with payment.

### Confirm Booking
```http
POST /bookings/confirm
Authorization: Bearer {token}
Content-Type: application/json

{
  "reservationId": "456",
  "userId": "user-uuid",
  "paymentMethod": "mock",
  "idempotencyKey": "booking-456-1737720000",
  "discountCode": "SUMMER25",
  "metadata": {
    "eventName": "Summer Music Festival",
    "source": "web"
  }
}
```

**Payment Methods:**
- `mock` - Test mode (always succeeds)
- `stripe` - Stripe integration
- `paystack` - Paystack integration
- `flutterwave` - Flutterwave integration

**Response:**
```json
{
  "data": {
    "id": 789,
    "bookingReference": "BK-ABCD1234-EF567890",
    "eventId": 123,
    "userId": "user-uuid",
    "totalAmount": 262.50,
    "originalAmount": 300.00,
    "discountAmount": 37.50,
    "discountCode": "SUMMER25",
    "status": "CONFIRMED",
    "paymentStatus": "SUCCESS",
    "paymentId": "mock_xyz123",
    "seats": [
      {
        "seatId": 101,
        "seatNumber": "A1",
        "sectionName": "VIP Section",
        "price": 150.00
      }
    ],
    "createdAt": "2026-01-24T10:05:00.000Z",
    "confirmedAt": "2026-01-24T10:05:01.000Z"
  }
}
```

**Idempotency:**
- Use unique `idempotencyKey` per booking attempt
- Duplicate keys return existing booking (prevents double charges)
- Keys expire after 24 hours

### Get My Bookings
```http
GET /bookings/me
Authorization: Bearer {token}
```

### Get Booking by Reference
```http
GET /bookings/reference/{bookingReference}
Authorization: Bearer {token}
```

### Get Event Bookings (Organizer)
```http
GET /bookings/event/{eventId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": [
    {
      "id": 789,
      "bookingReference": "BK-ABCD1234-EF567890",
      "user": {
        "email": "customer@example.com",
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "totalAmount": 262.50,
      "status": "CONFIRMED",
      "seats": [...],
      "createdAt": "2026-01-24T10:05:00.000Z"
    }
  ]
}
```

---

## Seats

### Get Event Seats
```http
GET /events/{eventId}/seats
```

**Response:**
```json
{
  "data": [
    {
      "id": 101,
      "sectionId": 1,
      "seatNumber": "A1",
      "rowNumber": "A",
      "seatType": "REGULAR",
      "price": 150.00,
      "status": "AVAILABLE",
      "version": 1
    },
    {
      "id": 102,
      "seatNumber": "A2",
      "status": "RESERVED",
      "reservedUntil": "2026-01-24T10:10:00.000Z"
    }
  ]
}
```

**Seat Statuses:**
- `AVAILABLE` - Can be reserved
- `RESERVED` - Temporarily held (expires soon)
- `BOOKED` - Permanently sold

---

## Discounts

### Create Discount
```http
POST /discounts
Authorization: Bearer {token}
Content-Type: application/json

{
  "eventId": 123,
  "code": "SUMMER25",
  "type": "PERCENTAGE",
  "amount": 25,
  "maxUses": 100,
  "validFrom": "2026-06-01T00:00:00Z",
  "validUntil": "2026-07-15T23:59:59Z",
  "isActive": true
}
```

**Discount Types:**
- `PERCENTAGE` - Percentage off (amount: 1-100)
- `FIXED` - Fixed amount off (amount: dollar value)

### Validate Discount
```http
GET /discounts/validate/{code}?eventId=123
```

**Response:**
```json
{
  "data": {
    "id": 10,
    "code": "SUMMER25",
    "type": "PERCENTAGE",
    "amount": 25,
    "isValid": true,
    "remainingUses": 75
  }
}
```

### Get Event Discounts
```http
GET /discounts/event/{eventId}
Authorization: Bearer {token}
```

### Update Discount
```http
PATCH /discounts/{discountId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "maxUses": 200,
  "isActive": false
}
```

### Activate/Deactivate Discount
```http
PATCH /discounts/{discountId}/activate
PATCH /discounts/{discountId}/deactivate
Authorization: Bearer {token}
```

---

## Venues

### Create Venue
```http
POST /venues
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Madison Square Garden",
  "address": "4 Pennsylvania Plaza",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "capacity": 20000
}
```

### Get All Venues
```http
GET /venues
```

### Get Venue by ID
```http
GET /venues/{venueId}
```

---

## Statistics

### Get User Stats
```http
GET /stats/user
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "userId": "user-uuid",
    "totalEvents": 15,
    "activeEvents": 8,
    "totalBookings": 247,
    "totalRevenue": 125750.00
  }
}
```

**Metrics:**
- `totalEvents` - Events created by organizer
- `activeEvents` - Events currently on sale
- `totalBookings` - Confirmed bookings for organizer's events
- `totalRevenue` - Total sales revenue

---

## Advertisements

### Create Advertisement
```http
POST /advertisements
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Summer Sale!",
  "content": "Get 25% off all summer events",
  "imageUrl": "https://example.com/banner.jpg",
  "link": "https://example.com/summer-sale",
  "startDate": "2026-06-01T00:00:00Z",
  "endDate": "2026-08-31T23:59:59Z",
  "isActive": true
}
```

### Get Active Advertisements
```http
GET /advertisements/active
```

### Track Advertisement Stats
```http
POST /advertisements/{adId}/stats
Content-Type: application/json

{
  "type": "click",
  "metadata": {
    "source": "homepage",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Tracking Types:**
- `impression` - Ad displayed
- `click` - Ad clicked

---

## Common Patterns

### Pagination
All list endpoints support pagination:
```http
GET /events?limit=20&offset=40
```

### Filtering
Many endpoints support query filters:
```http
GET /events?status=ON_SALE&isFree=false
```

### Response Format
All responses follow this structure:
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-24T10:00:00.000Z"
  }
}
```

### Timestamps
- All dates in ISO 8601 format
- Timezone: UTC
- Example: `2026-07-15T18:00:00.000Z`

---

## Error Handling

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate booking)
- `422` - Unprocessable Entity (business logic error)
- `500` - Internal Server Error

### Common Error Scenarios

**Reservation Expired:**
```json
{
  "statusCode": 400,
  "message": "Reservation has expired. Please reserve seats again."
}
```

**Seat Already Taken:**
```json
{
  "statusCode": 409,
  "message": "One or more seats are no longer available",
  "failedSeats": [
    {
      "seatId": 101,
      "reason": "Seat was modified by another user (stale version)"
    }
  ]
}
```

**Insufficient Capacity:**
```json
{
  "statusCode": 400,
  "message": "Not enough available capacity in this section"
}
```

---

## Rate Limiting

- **Default:** 100 requests per minute per IP
- **Authenticated:** 500 requests per minute per user
- **Headers:**
  - `X-RateLimit-Limit` - Maximum requests
  - `X-RateLimit-Remaining` - Remaining requests
  - `X-RateLimit-Reset` - Reset timestamp

---

## Webhooks (Coming Soon)

Receive real-time notifications for booking events:
- `booking.created`
- `booking.confirmed`
- `booking.cancelled`
- `reservation.expired`

---

## Best Practices

### 1. Use Idempotency Keys
Always include unique idempotency keys for booking operations:
```typescript
const idempotencyKey = `booking-${reservationId}-${Date.now()}`;
```

### 2. Handle Optimistic Locking
When reserving seats, always include the current version:
```typescript
const seats = await getSeats(eventId);
const seatsToReserve = selectedSeats.map(seat => ({
  seatId: seat.id,
  version: seat.version // IMPORTANT!
}));
```

### 3. Check Reservation Expiry
Display countdown timer to users:
```typescript
const expiresIn = (new Date(reservation.expiresAt) - Date.now()) / 1000;
if (expiresIn <= 0) {
  // Redirect to event page
}
```

### 4. Validate Before Payment
Always check purchase eligibility before showing payment form:
```typescript
const { canPurchase, reasons } = await checkPurchaseEligibility(eventId);
if (!canPurchase) {
  showErrors(reasons);
  return;
}
```

### 5. Handle Network Errors
Implement retry logic with exponential backoff:
```typescript
const booking = await retryWithBackoff(
  () => BookingsService.confirmBooking(dto),
  { maxRetries: 3, initialDelay: 1000 }
);
```

---

## Support

- **API Issues:** Check [GitHub Issues](https://github.com/your-org/ticketing-system/issues)
- **Documentation:** See [docs/](../docs/)
- **Swagger UI:** http://localhost:3000/api
