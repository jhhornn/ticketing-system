# Testing Guide: Venue Section Inheritance

## Test Scenarios

### ✅ Scenario 1: Manually Created Section (Can Delete)

**Steps:**
1. Create an event without a registered venue (custom venue)
2. Go to "Manage Sections" and add a section (e.g., "General Admission")
3. Try to delete the section
   
**Expected Result:** ✅ Section should delete successfully

**Database State:**
```sql
-- The section will have venueId = NULL
SELECT section_id, name, venue_id FROM event_sections 
WHERE event_id = <your_event_id>;
-- venue_id should be NULL for manually created sections
```

---

### ✅ Scenario 2: Manual Section on Venue Event (Can Delete)

**Steps:**
1. Create an event WITH a registered venue (e.g., "Madison Square Garden")
2. System auto-creates venue sections (if venue has pre-configured sections)
3. Go to "Manage Sections" and add ANOTHER section (e.g., "VIP Lounge")
4. Try to delete the "VIP Lounge" section

**Expected Result:** ✅ The manually-added "VIP Lounge" should delete successfully
**Expected Result:** ❌ The auto-created venue sections should NOT be deletable

---

### ❌ Scenario 3: Venue-Inherited Section (Cannot Delete)

**Steps:**
1. Create a venue with pre-configured sections:
   ```json
   POST /venues
   {
     "name": "Test Arena",
     "capacity": 10000,
     "sections": [
       {"name": "Floor", "capacity": 2000, "type": "GENERAL"},
       {"name": "Lower Bowl", "capacity": 5000, "type": "ASSIGNED"}
     ]
   }
   ```
2. Create an event and select "Test Arena" as the venue
3. System automatically inherits "Floor" and "Lower Bowl" sections
4. Try to delete "Floor" or "Lower Bowl"

**Expected Result:** ❌ Error: "Cannot delete sections inherited from registered venues"

**Database State:**
```sql
-- These sections will have venueId = <venue_id>
SELECT section_id, name, venue_id FROM event_sections 
WHERE event_id = <your_event_id>;
-- venue_id should match the venue's ID for inherited sections
```

---

### ❌ Scenario 4: Section with Bookings (Cannot Delete)

**Steps:**
1. Create any event with any section
2. Make at least one booking for the event
3. Try to delete the section

**Expected Result:** ❌ Error: "Cannot delete sections after bookings have been made"

---

### ❌ Scenario 5: Section with Allocated Tickets (Cannot Delete)

**Steps:**
1. Create an event with a section
2. Start a reservation (adds to cart but not confirmed)
3. Try to delete the section while reservation is active

**Expected Result:** ❌ Error: "Cannot delete section with allocated tickets"

---

## Testing from UI

### Test 1: Check Info Banner
1. Open any event
2. Click "Manage Sections"
3. Verify the info banner shows:
   - ✅ "Sections cannot be deleted after bookings have been made"
   - ✅ "Sections inherited from registered venues (auto-created) cannot be deleted"
   - ✅ "Manually created sections can be deleted even if the event uses a registered venue"

### Test 2: Delete Button Behavior
1. For venue-inherited section: Should show appropriate error message
2. For manual section (no bookings): Should delete successfully
3. For any section with bookings: Should show "Cannot delete - tickets already allocated"

---

## API Testing with cURL

### Test Manual Section Creation and Deletion

```bash
# 1. Create an event (no venue)
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventName": "Test Event",
    "eventDate": "2026-06-01T19:00:00Z",
    "customVenue": "My Custom Venue",
    "totalSeats": 100
  }'

# 2. Create a section manually
curl -X POST http://localhost:3000/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": 1,
    "name": "General Admission",
    "type": "GENERAL",
    "price": 50,
    "totalCapacity": 100
  }'

# 3. Try to delete it (should succeed)
curl -X DELETE http://localhost:3000/sections/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:** `200 OK`

---

### Test Venue-Inherited Section Protection

```bash
# Assuming you have a venue with ID 1 and event with inherited sections

# Try to delete a venue-inherited section
curl -X DELETE http://localhost:3000/sections/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": "Cannot delete sections inherited from registered venues. Only manually created sections can be deleted.",
  "error": "Bad Request"
}
```

---

## Database Verification Queries

### Check Section Venue Association

```sql
-- List all sections with their venue association
SELECT 
  es.section_id,
  es.name AS section_name,
  es.event_id,
  e.event_name,
  es.venue_id,
  v.name AS venue_name,
  CASE 
    WHEN es.venue_id IS NULL THEN 'Manually Created'
    ELSE 'Venue-Inherited'
  END AS section_type
FROM event_sections es
JOIN events e ON es.event_id = e.event_id
LEFT JOIN venues v ON es.venue_id = v.venue_id
ORDER BY es.event_id, es.section_id;
```

### Check Sections with Bookings

```sql
-- Sections that have bookings (cannot be deleted)
SELECT 
  es.section_id,
  es.name,
  COUNT(DISTINCT b.booking_id) AS booking_count,
  es.allocated AS allocated_tickets
FROM event_sections es
LEFT JOIN booking_seats bs ON bs.section_id = es.section_id
LEFT JOIN bookings b ON b.booking_id = bs.booking_id 
  AND b.status IN ('CONFIRMED', 'PENDING')
GROUP BY es.section_id, es.name, es.allocated
HAVING COUNT(DISTINCT b.booking_id) > 0
ORDER BY booking_count DESC;
```

---

## Automated Test Cases

### Unit Test Example (Jest)

```typescript
describe('SectionsService - Delete Protection', () => {
  it('should allow deletion of manually created section', async () => {
    // Arrange: Create section with venueId = null
    const section = await createTestSection({ venueId: null });
    
    // Act
    await sectionsService.remove(section.id);
    
    // Assert
    const deleted = await prisma.eventSection.findUnique({
      where: { id: section.id }
    });
    expect(deleted).toBeNull();
  });

  it('should prevent deletion of venue-inherited section', async () => {
    // Arrange: Create section with venueId set
    const section = await createTestSection({ venueId: 1 });
    
    // Act & Assert
    await expect(sectionsService.remove(section.id))
      .rejects
      .toThrow('Cannot delete sections inherited from registered venues');
  });

  it('should prevent deletion when bookings exist', async () => {
    // Arrange: Create section and booking
    const section = await createTestSection({ venueId: null });
    await createTestBooking({ eventId: section.eventId });
    
    // Act & Assert
    await expect(sectionsService.remove(section.id))
      .rejects
      .toThrow('Cannot delete sections after bookings have been made');
  });
});
```

---

## Common Issues & Solutions

### Issue 1: All sections show as deletable
**Cause:** venueId not being set when venue sections are copied
**Solution:** Ensure venue section creation logic sets venueId:
```typescript
venueId: BigInt(venue.id) // ← Must be set!
```

### Issue 2: Cannot delete any sections on venue events
**Cause:** Old logic checked `event.venue` instead of `section.venueId`
**Solution:** ✅ Already fixed - now checks `section.venueId`

### Issue 3: Migration not applied
**Symptoms:** TypeScript errors about missing venueId property
**Solution:**
```bash
cd src/backend
npx prisma generate
npx prisma migrate deploy
```

---

## Success Criteria

✅ **Functionality:**
- [ ] Manual sections can be deleted (before bookings)
- [ ] Venue-inherited sections cannot be deleted
- [ ] Sections with bookings cannot be deleted
- [ ] Clear error messages for each restriction

✅ **Database:**
- [ ] Migration applied successfully
- [ ] venueId column exists in event_sections
- [ ] Foreign key constraint working
- [ ] Index on venueId created

✅ **UI/UX:**
- [ ] Info banner shows correct information
- [ ] Error messages are user-friendly
- [ ] Delete button behaves appropriately
- [ ] No console errors

✅ **Code Quality:**
- [ ] TypeScript compilation successful
- [ ] No runtime errors
- [ ] Proper error handling
- [ ] Documentation updated

---

## Rollback Plan (if needed)

If issues arise, rollback the migration:

```bash
cd src/backend

# Revert the migration
npx prisma migrate resolve --rolled-back 20260116221550_add_venue_id_to_sections

# Drop the column manually if needed
npx prisma db execute --stdin <<< "ALTER TABLE event_sections DROP COLUMN IF EXISTS venue_id;"

# Regenerate client
npx prisma generate
```

Then restore the previous version of:
- `src/backend/api/sections/sections.service.ts`
- `src/frontend/src/components/EventSectionsModal.tsx`
- `src/backend/common/database/prisma/schema.prisma`
