# Event Sections Management

## Adding Sections to Newly Created Events

When you create a new event through the UI, it doesn't automatically have ticket sections. You need to add sections to make the event bookable.

### Option 1: Using Database Seed Script (Recommended for Development)

Update the seed script at `src/backend/common/database/seed/seed.ts` to add sections for your event:

```typescript
// Example: Add sections for event ID 3
const event3GASection = await prisma.eventSection.upsert({
  where: { id: 3 },
  update: {},
  create: {
    eventId: 3, // Your event ID
    name: 'General Admission',
    type: 'GENERAL',
    price: 50.00,
    totalCapacity: 500,
    allocated: 0,
  }
});

const event3VIPSection = await prisma.eventSection.upsert({
  where: { id: 4 },
  update: {},
  create: {
    eventId: 3,
    name: 'VIP Section',
    type: 'ASSIGNED',
    price: 150.00,
    totalCapacity: 100,
    allocated: 0,
  }
});
```

Then run: `pnpm prisma:seed`

### Option 2: Direct Database Insertion

Connect to your database and run:

```sql
-- Add General Admission section
INSERT INTO event_sections (event_id, name, type, price, total_capacity, allocated, created_at, updated_at)
VALUES (YOUR_EVENT_ID, 'General Admission', 'GENERAL', 50.00, 500, 0, NOW(), NOW());

-- Add VIP section with assigned seating
INSERT INTO event_sections (event_id, name, type, price, total_capacity, allocated, created_at, updated_at)
VALUES (YOUR_EVENT_ID, 'VIP Lounge', 'ASSIGNED', 150.00, 100, 0, NOW(), NOW());
```

### Option 3: API Endpoint (Coming Soon)

We'll add a UI and API endpoint to manage event sections directly from the application.

## Section Types

- **GENERAL**: General admission - first come, first served
  - Users select quantity
  - No specific seat assignment
  
- **ASSIGNED**: Reserved seating - specific seat selection
  - Requires seat records in the `seats` table
  - Users select specific seats from seat map

## Creating Seats for ASSIGNED Sections

For ASSIGNED sections, you also need to create seat records:

```typescript
const seatsData = [];
const rows = ['A', 'B', 'C'];
const seatsPerRow = 10;

for (const row of rows) {
  for (let i = 1; i <= seatsPerRow; i++) {
    seatsData.push({
      eventId: YOUR_EVENT_ID,
      sectionId: YOUR_SECTION_ID,
      seatNumber: `${row}${i}`,
      rowNumber: row,
      seatType: 'VIP',
      price: 150.00,
      status: 'AVAILABLE',
      version: 0,
    });
  }
}

await prisma.seat.createMany({ data: seatsData });
```

## Future Improvements

- [ ] Add section management UI in event edit page
- [ ] Create sections automatically when event is created
- [ ] Seat map generator for ASSIGNED sections
- [ ] Batch import seats from CSV
