# Discount Management System

## Overview

The discount management system allows event organizers to create, activate, and deactivate discounts for their events. It supports both time-based and usage-based (early-bird) discount criteria.

## Features

### For Event Organizers

1. **Create Discounts**
   - Generate unique discount codes (e.g., `SUMMER2025`, `EARLYBIRD50`)
   - Set discount type: Percentage or Fixed Amount
   - Configure validity periods (start/end dates)
   - Set usage limits for early-bird discounts
   - Specify minimum order amounts (optional)

2. **Manage Discounts**
   - Activate/deactivate discounts manually
   - View usage statistics (current usage vs. limit)
   - Track discount status (active, expired, limit reached)
   - Delete discounts when no longer needed

3. **Access via MyEventsPage**
   - Click "Manage Discounts" button on any event card
   - View all discounts for a specific event
   - Real-time status indicators

### For Customers

1. **Apply Discounts**
   - Enter discount code on EventDetailsPage during booking
   - Instant validation with clear feedback
   - See original price, discount amount, and final price
   - Visual confirmation when discount is applied

2. **Automatic Validation**
   - Checks if discount is active
   - Validates time period (must be within valid dates)
   - Verifies usage limit hasn't been reached
   - Ensures discount applies to the specific event

## Database Schema

### Discount Model

```prisma
model Discount {
  id             BigInt       @id @default(autoincrement())
  code           String       @unique @db.VarChar(50)
  amount         Decimal      @db.Decimal(10, 2)
  type           DiscountType @default(PERCENTAGE)
  isActive       Boolean      @default(true)        // NEW
  validFrom      DateTime     @default(now())
  validUntil     DateTime?
  usageLimit     Int?
  usageCount     Int          @default(0)
  minOrderAmount Decimal?
  eventId        BigInt?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  event Event? @relation(fields: [eventId], references: [id])
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}
```

## API Endpoints

### Discount Management

```
POST   /discounts                     - Create new discount (Admin only)
GET    /discounts                     - List all discounts
GET    /discounts/:id                 - Get discount by ID
GET    /discounts/event/:eventId      - Get all discounts for an event
GET    /discounts/validate/:code      - Validate discount code
PATCH  /discounts/:id                 - Update discount (Admin only)
PATCH  /discounts/:id/activate        - Activate discount
PATCH  /discounts/:id/deactivate      - Deactivate discount
DELETE /discounts/:id                 - Delete discount (Admin only)
```

### Booking Integration

```
POST   /bookings/confirm
Body: {
  reservationId: string
  userId: string
  paymentMethod: string
  idempotencyKey: string
  discountCode?: string      // NEW - optional discount code
  metadata?: object
}
```

## Validation Rules

A discount is valid when ALL of the following conditions are met:

1. **Active Status**: `isActive === true`
2. **Time Period**: Current date is between `validFrom` and `validUntil` (if set)
3. **Usage Limit**: `usageCount < usageLimit` (if limit is set)
4. **Event Specific**: Discount applies to the current event (if `eventId` is set)
5. **Minimum Order**: Order total meets `minOrderAmount` (if set)

## Discount Calculation

### Percentage Discount
```typescript
discountAmount = (totalPrice * discountPercentage) / 100
finalPrice = totalPrice - discountAmount
```

### Fixed Amount Discount
```typescript
discountAmount = min(fixedAmount, totalPrice)
finalPrice = totalPrice - discountAmount
```

### Example Scenarios

1. **Early Bird Discount**
   - Code: `EARLYBIRD50`
   - Type: `PERCENTAGE`
   - Amount: `20%`
   - Usage Limit: `50`
   - Valid Until: Event date - 7 days
   - Auto-deactivates after 50 bookings

2. **Time-Limited Flash Sale**
   - Code: `FLASH24HR`
   - Type: `FIXED_AMOUNT`
   - Amount: `$10`
   - Valid From: 2025-01-20 00:00
   - Valid Until: 2025-01-21 00:00
   - Auto-expires after 24 hours

3. **VIP Pre-Sale**
   - Code: `VIPSALE`
   - Type: `PERCENTAGE`
   - Amount: `15%`
   - Valid From: Now
   - Valid Until: Public sale start date
   - No usage limit

## Frontend Components

### DiscountManagementModal
- Full-featured discount management UI
- Create, activate, deactivate, delete discounts
- Real-time status indicators
- Usage statistics display

### EventDetailsPage
- Discount code input field
- Live validation
- Price breakdown with discount applied
- Visual confirmation of applied discount

### EventCard (MyEventsPage)
- "Manage Discounts" button for event owners
- Opens DiscountManagementModal

## Usage Flow

### Event Organizer Creates Discount

1. Navigate to MyEventsPage
2. Click "Manage Discounts" on event card
3. Click "Create New Discount"
4. Fill in discount details:
   - Unique code
   - Type (percentage/fixed)
   - Amount
   - Validity period (optional)
   - Usage limit (optional for early-bird)
5. Submit - discount is created and active by default

### Customer Applies Discount

1. Browse to event details page
2. Select seats/tickets
3. Enter discount code in "Have a discount code?" field
4. Click "Apply" or press Enter
5. System validates discount:
   - ✅ Valid: Shows green success message with discount details
   - ❌ Invalid: Shows red error message with reason
6. Price updates to show:
   - Original price (struck through)
   - Discount amount (in green)
   - Final price (bold)
7. Click "Book" to proceed to checkout
8. Discount is applied during payment processing
9. Usage count increments on successful booking

### Event Organizer Manages Discounts

**Deactivate a discount:**
1. Open discount management modal
2. Click toggle button on discount card
3. Discount deactivated immediately
4. Customers can no longer apply this code

**Reactivate a discount:**
1. Click toggle button again
2. Discount becomes active (if not expired or limit reached)

**Monitor usage:**
- View "X / Y used" counter on discount card
- See real-time status indicators:
  - 🟢 Active and valid
  - 🔴 Expired or limit reached
  - ⚪ Manually deactivated

## Error Handling

### Validation Errors

- **"Discount code not found"**: Invalid or non-existent code
- **"Discount is not active"**: Manually deactivated by organizer
- **"Discount is not yet valid"**: Start date is in the future
- **"Discount has expired"**: End date has passed
- **"Discount usage limit reached"**: All available uses consumed
- **"Discount is not valid for this event"**: Code is for a different event
- **"Minimum order amount not met"**: Order total too low

### Backend Integration

The booking service automatically:
1. Validates discount code
2. Calculates discount amount
3. Applies discount to total
4. Increments usage count
5. Records discount in payment metadata

## Security Considerations

1. **Authorization**
   - Only admins can create/delete discounts
   - Event owners can activate/deactivate their event discounts
   - Anyone can validate codes (public endpoint)

2. **Validation**
   - All checks performed server-side
   - Frontend validation is for UX only
   - Usage count incremented in transaction

3. **Idempotency**
   - Booking confirmation uses idempotency keys
   - Prevents duplicate discount applications

## Testing

### Manual Testing Checklist

- [ ] Create discount with percentage
- [ ] Create discount with fixed amount
- [ ] Create early-bird discount with usage limit
- [ ] Apply valid discount code
- [ ] Try to apply expired discount
- [ ] Try to apply inactive discount
- [ ] Try to apply discount after limit reached
- [ ] Activate/deactivate discount
- [ ] Verify usage count increments
- [ ] Verify price calculations
- [ ] Test minimum order amount validation
- [ ] Test event-specific discounts

## Future Enhancements

1. **Bulk discount operations**
   - Create multiple discount codes at once
   - Export discount codes as CSV

2. **Advanced conditions**
   - Day-of-week restrictions
   - Time-of-day restrictions
   - User-specific discounts

3. **Analytics**
   - Discount performance reports
   - Revenue impact analysis
   - Popular discount codes

4. **Notifications**
   - Alert organizers when discounts are expiring
   - Notify when usage limits are approaching

5. **Automatic discount application**
   - Auto-apply best available discount
   - Discount stacking rules

---

Last Updated: January 17, 2025
