# Venue Sections Guide

## Overview
Registered venues can now have predefined sections and seating layouts that are automatically inherited when creating events at those venues.

## Creating a Venue with Sections

### API Endpoint: `POST /venues`

### Request Body Example:

```json
{
  "name": "Madison Square Garden",
  "address": "4 Pennsylvania Plaza, New York, NY 10001",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "capacity": 20000,
  "sections": [
    {
      "name": "Floor Seating",
      "type": "ASSIGNED",
      "totalCapacity": 2500,
      "rows": 50,
      "seatsPerRow": 50
    },
    {
      "name": "Lower Bowl",
      "type": "ASSIGNED",
      "totalCapacity": 8000,
      "rows": 80,
      "seatsPerRow": 100
    },
    {
      "name": "Upper Bowl",
      "type": "ASSIGNED",
      "totalCapacity": 7000,
      "rows": 70,
      "seatsPerRow": 100
    },
    {
      "name": "General Admission",
      "type": "GENERAL",
      "totalCapacity": 2500
    }
  ]
}
```

### Section Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Name of the section (e.g., "VIP", "Balcony") |
| `type` | enum | Yes | Either "ASSIGNED" or "GENERAL" |
| `totalCapacity` | number | Yes | Total capacity for this section |
| `rows` | number | No* | Number of rows (*Required for ASSIGNED seating) |
| `seatsPerRow` | number | No* | Seats per row (*Required for ASSIGNED seating) |

### Section Types:

**ASSIGNED Seating:**
- Individual numbered seats
- Requires `rows` and `seatsPerRow`
- Seats are auto-generated (A1, A2, ..., B1, B2, etc.)

**GENERAL Admission:**
- No specific seat assignments
- First-come, first-served
- No `rows` or `seatsPerRow` needed

## How Venue Sections Work with Events

### When Creating an Event:

1. **Select a Registered Venue** during event creation
2. **Sections are Automatically Copied**:
   - All venue sections are duplicated for the event
   - Each section is marked with `venueId` (inherited sections)
   - Seats are auto-generated for ASSIGNED sections
   - Default price is set to $0 (can be updated later)

3. **Section Protection**:
   - ✅ **Manually added sections** can be deleted
   - ❌ **Venue-inherited sections** cannot be deleted
   - This protects the venue's standard configuration

### Example Workflow:

```
1. Create Venue "Concert Hall" with sections:
   - VIP (100 seats, ASSIGNED)
   - Orchestra (500 seats, ASSIGNED)
   - General Admission (200 seats, GENERAL)

2. Create Event "Rock Concert" at "Concert Hall"
   → Automatically inherits all 3 sections
   → 600 seats auto-generated for VIP + Orchestra
   → Ready to set prices and start selling

3. Add Custom Section "Backstage Pass" (50 seats)
   → This section can be deleted later if needed
   → VIP, Orchestra, General sections cannot be deleted
```

## Managing Venue Sections

### View Venue with Sections:

**GET** `/venues/:id`

Response includes all sections:
```json
{
  "id": 1,
  "name": "Madison Square Garden",
  "capacity": 20000,
  "sections": [
    {
      "id": 1,
      "name": "Floor Seating",
      "type": "ASSIGNED",
      "totalCapacity": 2500,
      "rows": 50,
      "seatsPerRow": 50
    },
    ...
  ]
}
```

### List All Venues:

**GET** `/venues`

Returns all venues with their sections.

## Event Section Inheritance

### Automatic Inheritance Process:

```
Event Creation with Venue
    ↓
Fetch Venue + Sections
    ↓
Copy Each Section to Event
    ↓
    ├─ Set eventId
    ├─ Set venueId (marks as inherited)
    ├─ Set default price ($0)
    ├─ Copy capacity, type, name
    ↓
For ASSIGNED Sections:
    ↓
Generate Individual Seats
    ↓
    ├─ Create rows (A, B, C, ...)
    ├─ Create seat numbers (1, 2, 3, ...)
    ├─ Set all as AVAILABLE
    ├─ Assign default price
```

### Console Logs:

When an event is created with a venue, you'll see:
```
[EventsService] Copying 4 sections from venue Madison Square Garden to event Rock Concert
```

## Benefits

### For Venue Owners:
- ✅ Define section layout once
- ✅ Reuse across multiple events
- ✅ Maintain consistent venue structure
- ✅ Protect standard sections from deletion

### For Event Creators:
- ✅ No need to manually create sections
- ✅ Seats auto-generated instantly
- ✅ Focus on pricing and promotion
- ✅ Can add custom sections if needed

### For System Integrity:
- ✅ Venue configurations protected
- ✅ Clear distinction between inherited and custom sections
- ✅ Prevents accidental deletion of venue sections
- ✅ Maintains venue's standard layout

## Best Practices

### 1. Venue Setup:
- Define all standard sections during venue creation
- Use realistic capacities (rows × seatsPerRow = totalCapacity)
- Name sections clearly (e.g., "Lower Balcony Left", "VIP Section A")

### 2. Section Types:
- Use **ASSIGNED** for:
  - Theater seating
  - Stadium seats
  - Reserved tables
  - VIP areas
- Use **GENERAL** for:
  - Standing areas
  - Festival grounds
  - Dance floors
  - First-come sections

### 3. Capacity Planning:
- Venue capacity = sum of all section capacities
- Leave buffer for walkways/facilities (reduce actual capacity by ~10%)
- For ASSIGNED: totalCapacity must equal (rows × seatsPerRow)

### 4. Event Customization:
- Inherit venue sections for consistency
- Add temporary sections for special events (e.g., "VIP Meet & Greet")
- Update prices per section based on event type
- Mark sections as unavailable if needed (close sections)

## Troubleshooting

### Issue: Sections not appearing on event
**Solution:** Ensure venue has sections defined. Check venue API response.

### Issue: Cannot delete section
**Solution:** Check if section has `venueId` set (inherited section). Only manually created sections can be deleted.

### Issue: Wrong seat count
**Solution:** For ASSIGNED sections, verify: totalCapacity = rows × seatsPerRow

### Issue: Seats not generated
**Solution:** Ensure section type is "ASSIGNED" and both `rows` and `seatsPerRow` are provided.

## Migration Notes

**Migration:** `20260116225345_add_venue_sections`

**Changes:**
- Added `venue_sections` table
- Fields: id, venueId, name, type, totalCapacity, rows, seatsPerRow
- Cascade delete: deleting venue removes all its sections
- Index on venueId for query performance

**Backward Compatibility:**
- ✅ Existing venues work without sections
- ✅ Events can still be created without venues
- ✅ Manual section creation still works as before
- ✅ No data migration required

## API Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/venues` | POST | Create venue with sections |
| `/venues` | GET | List all venues (with sections) |
| `/venues/:id` | GET | Get venue details (with sections) |
| `/events` | POST | Create event (auto-inherits venue sections) |
| `/sections` | POST | Add custom section to event |
| `/sections/:id` | DELETE | Delete section (only if not venue-inherited) |

## Examples

### Example 1: Small Theater
```json
{
  "name": "Community Theater",
  "capacity": 200,
  "sections": [
    {
      "name": "Orchestra",
      "type": "ASSIGNED",
      "totalCapacity": 120,
      "rows": 12,
      "seatsPerRow": 10
    },
    {
      "name": "Balcony",
      "type": "ASSIGNED",
      "totalCapacity": 80,
      "rows": 8,
      "seatsPerRow": 10
    }
  ]
}
```

### Example 2: Festival Venue
```json
{
  "name": "Summer Festival Grounds",
  "capacity": 5000,
  "sections": [
    {
      "name": "VIP Area",
      "type": "ASSIGNED",
      "totalCapacity": 500,
      "rows": 20,
      "seatsPerRow": 25
    },
    {
      "name": "General Standing",
      "type": "GENERAL",
      "totalCapacity": 4500
    }
  ]
}
```

### Example 3: Conference Center
```json
{
  "name": "Tech Convention Center",
  "capacity": 1000,
  "sections": [
    {
      "name": "Main Hall - Front",
      "type": "ASSIGNED",
      "totalCapacity": 300,
      "rows": 15,
      "seatsPerRow": 20
    },
    {
      "name": "Main Hall - Rear",
      "type": "ASSIGNED",
      "totalCapacity": 400,
      "rows": 20,
      "seatsPerRow": 20
    },
    {
      "name": "Standing Room",
      "type": "GENERAL",
      "totalCapacity": 300
    }
  ]
}
```
