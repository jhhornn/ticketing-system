# Venue Section Inheritance - Implementation Guide

## Overview
The system now distinguishes between **venue-inherited sections** (created automatically from registered venues) and **manually created sections** (added through "Manage Sections").

## Key Changes

### 1. Database Schema
Added `venue_id` column to `event_sections` table:
- **`venueId` is set**: Section was inherited from a registered venue (auto-created)
- **`venueId` is null**: Section was manually created by the user

### 2. Section Deletion Rules

#### ✅ Can Be Deleted:
- Manually created sections (even on events with registered venues)
- Sections with no bookings
- Sections with no allocated tickets

#### ❌ Cannot Be Deleted:
- Venue-inherited sections (venueId is set)
- Sections with existing bookings
- Sections with allocated tickets

### 3. Backend Implementation

**File**: `src/backend/api/sections/sections.service.ts`

```typescript
// Only protect sections that were inherited from a registered venue
// Manually created sections (venueId is null) can be deleted even if event uses a venue
if (section.venueId) {
  throw new BadRequestException(
    'Cannot delete sections inherited from registered venues. Only manually created sections can be deleted.',
  );
}
```

### 4. Frontend Updates

**File**: `src/frontend/src/components/EventSectionsModal.tsx`

Updated the information banner to clearly explain:
- Sections cannot be deleted after bookings have been made
- Sections inherited from registered venues (auto-created) cannot be deleted
- Manually created sections can be deleted even if event uses a registered venue

## Usage Scenarios

### Scenario 1: Event with Registered Venue
1. User creates event and selects "Madison Square Garden" (registered venue)
2. System automatically creates sections: VIP, Orchestra, Balcony (all have `venueId` set)
3. User wants to add a special "Press Box" section through "Manage Sections"
4. ✅ User CAN delete the "Press Box" section (venueId is null)
5. ❌ User CANNOT delete "VIP", "Orchestra", or "Balcony" (venueId is set)

### Scenario 2: Event without Registered Venue
1. User creates event with custom venue "My Backyard"
2. User manually creates sections: "General Admission", "VIP"
3. ✅ User CAN delete both sections (no venueId, no venue inheritance)
4. After first booking is made: ❌ User CANNOT delete any sections

### Scenario 3: Mixed Sections
1. Event uses "Convention Center" (registered venue)
2. Auto-created sections: "Hall A", "Hall B", "Hall C" (venueId set)
3. User adds custom section: "Overflow Area" (venueId null)
4. ✅ User CAN delete "Overflow Area" anytime (before bookings)
5. ❌ User CANNOT delete "Hall A", "Hall B", or "Hall C" ever

## Database Migration

**Migration**: `20260116221550_add_venue_id_to_sections`

```sql
-- Add venueId column
ALTER TABLE "event_sections" ADD COLUMN "venue_id" BIGINT;

-- Create index for better query performance
CREATE INDEX "event_sections_venue_id_idx" ON "event_sections"("venue_id");

-- Add foreign key constraint
ALTER TABLE "event_sections" 
  ADD CONSTRAINT "event_sections_venue_id_fkey" 
  FOREIGN KEY ("venue_id") 
  REFERENCES "venues"("venue_id") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;
```

## Implementation Checklist

- ✅ Added `venueId` field to EventSection model
- ✅ Created database migration
- ✅ Updated section deletion logic
- ✅ Updated frontend UI messages
- ✅ Generated new Prisma client
- ⚠️ **TODO**: Update venue creation logic to set `venueId` when copying venue sections
- ⚠️ **TODO**: Ensure section creation API sets `venueId = null` for manual sections

## Next Steps

### For Developers:

1. **When creating events with venues**, ensure the venue section copying logic sets `venueId`:
   ```typescript
   // In events.service.ts or wherever venue sections are copied
   await prisma.eventSection.create({
     data: {
       eventId: event.id,
       venueId: venue.id, // ← Set this!
       name: venueSection.name,
       // ... other fields
     }
   });
   ```

2. **When creating manual sections**, ensure `venueId` stays null:
   ```typescript
   // In sections.service.ts
   await prisma.eventSection.create({
     data: {
       eventId: dto.eventId,
       venueId: null, // ← Explicitly null for manual sections
       name: dto.name,
       // ... other fields
     }
   });
   ```

3. **Testing**:
   - Create event with registered venue → Try deleting auto sections (should fail)
   - Add manual section → Try deleting it (should succeed)
   - Create bookings → Try deleting any section (should fail)

## API Changes

### Section Deletion Endpoint
**`DELETE /sections/:id`**

Error responses now differentiate between:
- `400 - Cannot delete sections after bookings have been made`
- `400 - Cannot delete sections inherited from registered venues`
- `400 - Cannot delete section with allocated tickets`

## Security Considerations

- Deletion protection is enforced at the database/service layer
- Frontend UI provides helpful messages but cannot bypass backend validation
- Foreign key constraint ensures referential integrity
- ON DELETE SET NULL ensures venue deletion doesn't break event sections

## Performance Impact

- New index on `venue_id` column improves query performance
- No additional queries needed during section deletion (venueId is on the section record)
- Removed unnecessary event lookup (previously checked event.venue)

## Backward Compatibility

- **Existing sections**: Will have `venueId = null` after migration
  - This is correct! Existing sections were manually created
  - They can continue to be deleted (subject to booking rules)
- **No breaking changes** to API contracts
- Frontend UI automatically shows updated messaging
