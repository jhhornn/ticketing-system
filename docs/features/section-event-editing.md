# Section and Event Editing Features

## Overview
Added comprehensive editing capabilities for both event sections and events, allowing administrators to modify properties after creation while respecting business rules and booking constraints.

## Section Editing

### Features
- **Inline Editing**: Edit button on each section card opens the same form used for creation
- **Editable Fields**:
  - Section name
  - Price
  - Total capacity (with constraints)
  
### Business Rules
- **Section type** cannot be changed after creation (GENERAL vs ASSIGNED)
- **Capacity constraints**:
  - Cannot reduce capacity below the number of allocated (sold) tickets
  - Form shows warning when tickets are already sold
  - Input is disabled if all seats are sold
- **Seat generation** options only available during creation for ASSIGNED sections

### Implementation
- **Component**: `EventSectionsModal.tsx`
- **New State**: `editingSection` tracks which section is being edited
- **Methods**:
  - `handleEdit()`: Loads section data into form
  - `handleUpdate()`: Calls API to update section
  - Backend validation prevents capacity violations

### UI Enhancements
- Edit button (blue) with pencil icon next to delete button
- Form title changes to "Edit Section" when editing
- Minimum capacity enforced in input field
- Warning text shows minimum capacity when tickets are sold
- Success/error modals for user feedback

## Event Editing

### Features
- **Edit Modal**: New `EditEventModal` component for updating events
- **Editable Fields**:
  - Event name
  - Event date & time
  - Sale start time
  - Event status (DRAFT, ON_SALE, SOLD_OUT, COMPLETED, CANCELLED)

### Business Rules
- **Read-only fields** (cannot be changed after creation):
  - Venue (registered or custom)
  - Total capacity
- **Booking protection**:
  - Backend prevents dangerous changes when bookings exist
  - Modal shows warning when event has bookings
  - Displays current booking count
  
### Implementation
- **Component**: `EditEventModal.tsx`
- **Props**: Takes event object, calls back on success
- **Integration**: 
  - Added to `MyEventsPage.tsx`
  - Edit button on `EventCard` and `EventListItem` components
  - State: `editModalEvent` tracks which event is being edited

### UI Enhancements
- Edit button (blue gradient) next to Sections and Discounts buttons
- Warning banner when event has bookings
- Read-only section showing venue and capacity
- Booking count display
- Success/error modals for user feedback

## Component Updates

### EventSectionsModal.tsx
- Added `editingSection` state
- Added `handleEdit()` and `handleUpdate()` methods
- Conditional rendering for edit vs create mode
- Capacity validation with allocated seats check
- Import `Edit` icon from lucide-react

### EditEventModal.tsx (NEW)
- Full-featured event editing modal
- Uses `EventStatus` type from services
- Booking-aware warnings and constraints
- Read-only display of immutable fields

### EventCard.tsx
- Added `onEditEvent` prop
- Added Edit button to management actions section
- Imported `Edit` icon from lucide-react
- Dynamic grid layout (1-3 columns based on available buttons)

### EventListItem.tsx
- Added `onEditEvent` prop
- Added Edit button to actions section
- Imported `Edit` icon from lucide-react

### MyEventsPage.tsx
- Imported `EditEventModal`
- Added `editModalEvent` state
- Wired up `onEditEvent` callback to all event cards/list items
- Calls `loadMyEvents()` after successful edit

## API Integration

### Section Update Endpoint
- **Service**: `EventSectionsService.update()`
- **Method**: PUT `/api/sections/:id`
- **Validation**: Backend prevents reducing capacity below allocated seats
- **Audit**: All changes logged in audit trail

### Event Update Endpoint
- **Service**: `EventsService.update()`
- **Method**: PUT `/api/events/:id`
- **Validation**: Backend restricts dangerous changes when bookings exist
- **Audit**: All changes logged in audit trail

## Security & Validation

### Backend Protection
1. **Capacity Validation**: Prevents overselling by checking allocated seats
2. **Booking Checks**: Restricts event changes that would invalidate tickets
3. **Audit Logging**: Tracks all modifications for accountability
4. **Type Safety**: TypeScript ensures correct status values

### Frontend Validation
1. **Minimum Capacity**: Form enforces minimum based on allocated seats
2. **Disabled Inputs**: Capacity input disabled when all seats sold
3. **Warning Messages**: Clear feedback about constraints
4. **Type Safety**: EventStatus enum prevents invalid status values

## User Experience

### Success Flows
1. User clicks Edit button on section or event
2. Form pre-populates with current values
3. User modifies editable fields
4. Form shows constraints (min capacity, read-only fields)
5. Submit triggers API call
6. Success modal confirms change
7. List refreshes to show updated data

### Error Handling
1. Validation errors shown in form
2. Backend errors displayed in modal
3. User can retry or cancel
4. No partial updates (transaction safety)

## Testing Scenarios

### Section Editing
- [ ] Edit section name
- [ ] Change price (including to 0 for free)
- [ ] Increase capacity
- [ ] Attempt to reduce capacity below allocated seats (should fail)
- [ ] Edit section with no bookings
- [ ] Edit section with some bookings
- [ ] Edit section with all seats sold (capacity should be disabled)

### Event Editing
- [ ] Edit event name
- [ ] Change event date
- [ ] Modify sale start time
- [ ] Change status between all valid states
- [ ] Edit event with no bookings
- [ ] Edit event with bookings (should show warning)
- [ ] Verify venue and capacity are read-only

## Future Enhancements

### Potential Improvements
1. **Bulk Operations**: Edit multiple sections at once
2. **Version History**: View previous values
3. **Change Preview**: Show what will change before submitting
4. **Notification**: Email event organizers when changes occur
5. **Permission Levels**: Different edit permissions for different roles
6. **Advanced Validation**: Check for date conflicts, venue availability
7. **Rollback**: Undo recent changes
8. **Draft Changes**: Save edits without publishing

## Related Documentation
- [Business Rules](./business-rules.md)
- [Section Management](./venue-sections.md)
- [Security](../security.md)
- [Audit Logging](../architecture.md#audit-logging)
