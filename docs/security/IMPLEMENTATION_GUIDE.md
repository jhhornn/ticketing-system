# Security Implementation Guide

## 🚀 Deployment Steps

### 1. Database Migration

Run the Prisma migration to add the AuditLog table:

```bash
cd src/backend
npx prisma migrate dev --name add_audit_log_table
```

### 2. Regenerate Prisma Client

```bash
npx prisma generate
```

### 3. Build Backend

```bash
pnpm run build
```

### 4. Restart Services

```bash
# Development
pnpm run start:dev

# Production
pnpm run start:prod
```

---

## ✅ Implemented Security Features

### 1. Section Capacity Validation

**What it does:**
- Prevents sections from exceeding event's total capacity
- Validates on both create and update operations
- Provides clear error messages with available capacity

**Example:**
```
Event has 300 seats
Sections: VIP (100) + GA (150) = 250 used
Trying to add: Premium (100)
❌ Error: "Total section capacity (350) would exceed event capacity (300). You can only add 50 more seats."
```

### 2. Event Update Protection

**What it does:**
- Prevents dangerous changes after bookings exist
- Cannot reduce capacity below allocated
- Cannot change venue (invalidates sections)
- Cannot change pricing model (free/paid)
- Limits date changes to ±48 hours

**Protected when bookings exist:**
- ❌ Cannot reduce `totalSeats` below allocated capacity
- ❌ Cannot change `venueId` (invalidates venue sections)
- ❌ Cannot change event date by more than 48 hours
- ❌ Cannot toggle `isFree` status
- ✅ Can update event name
- ✅ Can adjust date within 48 hours
- ✅ Can update description/details

### 3. Audit Logging System

**What it logs:**
- All event updates (what changed, who changed it, when)
- All section creates/updates/deletes
- Includes before/after values
- Tracks user ID and IP address
- Stores metadata for context

**Query audit logs:**
```typescript
// Get event history
const history = await auditLogService.getHistory('Event', eventId);

// Get user activity
const activity = await auditLogService.getUserActivity(userId);

// Search with filters
const logs = await auditLogService.search({
  entityType: 'EventSection',
  action: 'DELETE',
  startDate: new Date('2026-01-01'),
  limit: 100
});
```

### 4. Section Deletion Protection

**What it does:**
- Cannot delete sections after any bookings exist for the event
- Cannot delete sections with allocated tickets
- Cannot delete venue-inherited sections (only manually created)
- Automatically deletes associated seats

---

## 🎯 Usage Examples

### Creating Sections (Capacity Validation)

```typescript
// ✅ Valid - within capacity
POST /sections
{
  "eventId": 1,         // Event has 300 total seats
  "name": "VIP",
  "type": "ASSIGNED",
  "totalCapacity": 100, // OK: 100 ≤ 300
  "price": 150.00
}

// ❌ Invalid - exceeds capacity
POST /sections
{
  "eventId": 1,         // Event has 300 total seats, 250 already allocated
  "name": "Premium",
  "totalCapacity": 100, // ERROR: 250 + 100 = 350 > 300
  "price": 200.00
}
```

### Updating Events (Booking Protection)

```typescript
// Event has 2 confirmed bookings

// ✅ Safe updates
PATCH /events/1
{
  "eventName": "Updated Festival Name",  // OK
  "eventDate": "2026-07-16T18:00:00Z"   // OK (< 48 hours change)
}

// ❌ Dangerous updates
PATCH /events/1
{
  "totalSeats": 100,     // ERROR: Cannot reduce (bookings exist)
  "venueId": 5,          // ERROR: Cannot change venue
  "isFree": true,        // ERROR: Cannot change pricing model
  "eventDate": "2026-09-01" // ERROR: > 48 hours change
}
```

---

## 🔍 Testing the Security Features

### Test 1: Capacity Validation

```bash
# Create event with 300 seats
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "eventName": "Test Event",
    "eventDate": "2026-12-01T18:00:00Z",
    "totalSeats": 300
  }'

# Add section 1 (100 seats) - should succeed
curl -X POST http://localhost:3000/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "eventId": 1,
    "name": "VIP",
    "type": "GENERAL",
    "totalCapacity": 100,
    "price": 150.00
  }'

# Add section 2 (150 seats) - should succeed (total: 250)
curl -X POST http://localhost:3000/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "eventId": 1,
    "name": "General",
    "type": "GENERAL",
    "totalCapacity": 150,
    "price": 50.00
  }'

# Try to add section 3 (100 seats) - should FAIL (total would be 350)
curl -X POST http://localhost:3000/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "eventId": 1,
    "name": "Premium",
    "type": "GENERAL",
    "totalCapacity": 100,
    "price": 100.00
  }'
# Expected: 400 Bad Request - "You can only add 50 more seats"
```

### Test 2: Event Update Protection

```bash
# Create booking first
curl -X POST http://localhost:3000/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "eventId": 1, "sectionId": 1, "quantity": 2 }'

curl -X POST http://localhost:3000/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "reservationId": 1 }'

# Try to change venue - should FAIL
curl -X PATCH http://localhost:3000/events/1 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "venueId": 2 }'
# Expected: 400 - "Cannot change venue after bookings exist"

# Try to reduce capacity - should FAIL
curl -X PATCH http://localhost:3000/events/1 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "totalSeats": 100 }'
# Expected: 400 - "Cannot reduce capacity. 2 seats are already booked."
```

### Test 3: Audit Log Verification

```typescript
// Check what was logged
const history = await prisma.auditLog.findMany({
  where: { entityType: 'Event', entityId: BigInt(1) },
  orderBy: { timestamp: 'desc' }
});

console.log(history);
// Should show CREATE and attempted UPDATE operations
```

---

## 🛠️ Next Steps (Phase 2)

### Venue Section Selection Feature

Will allow event creators to:
1. Select specific sections from a registered venue
2. Limit capacity for selected sections (e.g., use 300 of 1000 seats)
3. Override prices for the event

**Implementation:**
- Update `CreateEventDto` to include `selectedSections` array
- Modify event creation logic to copy only selected sections
- Add UI for section selection during event creation

### Frontend Updates Needed

1. **Event Creation Form:**
   - Show realtime capacity tracking
   - Display remaining capacity as sections are added
   - Show warning when approaching limit

2. **Section Management:**
   - Show capacity utilization (e.g., "250/300 seats allocated")
   - Disable "Add Section" when at capacity
   - Show capacity bar/progress indicator

3. **Event Editing:**
   - Show warnings for restricted fields when bookings exist
   - Disable dangerous fields
   - Display booking count and allocated capacity

---

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

1. **Capacity Violations Attempted**
   - Count of 400 errors from capacity validation
   - Could indicate user confusion or attempted fraud

2. **Event Update Rejections**
   - Track how often booking protection blocks updates
   - May indicate need for better UI guidance

3. **Audit Log Growth**
   - Monitor audit_logs table size
   - Implement archiving strategy for old logs

### Recommended Alerts

```typescript
// Alert if user attempts multiple capacity violations
if (capacityViolations > 5 in 10 minutes) {
  alert('Possible fraud attempt or UX issue');
}

// Alert on critical event changes
if (eventUpdate.hasBookings && eventUpdate.action === 'DELETE') {
  alert('Attempted deletion of event with bookings');
}
```

---

## 🔐 Security Checklist

- [✅] Section capacity validation implemented
- [✅] Event update protection with booking checks
- [✅] Audit logging for all critical operations
- [✅] Section deletion protection
- [✅] Database schema updated with AuditLog table
- [⏳] Frontend capacity tracking (Phase 2)
- [⏳] Venue section selection (Phase 2)
- [⏳] Admin audit log viewer (Phase 2)
- [⏳] Fraud detection patterns (Phase 3)
- [⏳] Automated capacity monitoring (Phase 3)

---

## 🆘 Troubleshooting

### Issue: "AuditLog table not found"

**Solution:**
```bash
# Run migration
cd src/backend
npx prisma migrate dev
npx prisma generate
```

### Issue: Capacity validation too strict

**Solution:**
Check event's `totalSeats` vs sum of all section capacities:
```sql
SELECT 
  e.event_name,
  e.total_seats,
  SUM(es.total_capacity) as sections_total,
  e.total_seats - SUM(es.total_capacity) as available
FROM events e
LEFT JOIN event_sections es ON es.event_id = e.event_id
WHERE e.event_id = ?
GROUP BY e.event_id;
```

### Issue: Cannot update event after bookings

**Solution:**
This is intentional protection. Options:
1. Cancel bookings first (not recommended)
2. Create new event for major changes
3. Contact support to manually adjust (with audit trail)

---

## 📝 Documentation Updates Needed

1. Update API documentation with new validation errors
2. Add capacity planning guide for event creators
3. Document audit log schema and querying
4. Create admin guide for reviewing audit logs
5. Add troubleshooting section for common capacity errors
