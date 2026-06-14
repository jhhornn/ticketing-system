# Code Refactoring: Enums and Interfaces

This document outlines the refactoring done to eliminate hardcoded strings and provide a single source of truth for types and constants throughout the system.

## New Files Created

### Common Interfaces

#### `/src/backend/common/interfaces/user.interface.ts`
- **IAuthenticatedUser**: Standardized interface for authenticated users
- **IAuthenticatedRequest**: Request object with authenticated user

#### `/src/backend/common/interfaces/audit.interface.ts`
- **AuditAction**: Enum for audit actions (CREATE, UPDATE, DELETE, RESERVE, BOOK, CANCEL)
- **AuditEntityType**: Enum for entity types being audited
- **IAuditLogEntry**: Interface for audit log entries

### Common Enums

#### `/src/backend/common/enums/advertisement.enum.ts`
- **AdInteractionType**: IMPRESSION | CLICK

#### `/src/backend/common/enums/booking.enum.ts`
- **BookingStatus**: Re-exported from Prisma
- **PaymentStatus**: Re-exported from Prisma
- **ReservationStatus**: Re-exported from Prisma
- **CONFIRMED_BOOKING_STATUSES**: Constant array for filtering

#### `/src/backend/common/enums/seat.enum.ts`
- **SeatStatus**: Re-exported from Prisma
- **SeatType**: Re-exported from Prisma

#### `/src/backend/common/enums/section.enum.ts`
- **SectionType**: Re-exported from Prisma

## Changes Made

### 1. Replaced Hardcoded User Types
**Before:**
```typescript
@CurrentUser() user: { id: string }
```

**After:**
```typescript
@CurrentUser() user: IAuthenticatedUser
```

**Files Updated:**
- `sections.controller.ts`
- `events.controller.ts`
- `advertisements.controller.ts`
- `stats.controller.ts`
- `booking.controller.ts`

### 2. Replaced Hardcoded Audit Strings

**Before:**
```typescript
await this.auditLog.log({
  entityType: 'EventSection',
  action: 'CREATE',
  // ...
});
```

**After:**
```typescript
await this.auditLog.log({
  entityType: AuditEntityType.EVENT_SECTION,
  action: AuditAction.CREATE,
  // ...
});
```

**Files Updated:**
- `sections.service.ts`
- `events.service.ts`
- `audit-log.service.ts`

### 3. Replaced Hardcoded Status Strings

**Before:**
```typescript
status: { in: ['CONFIRMED', 'PENDING'] }
s.status === 'AVAILABLE'
```

**After:**
```typescript
status: { in: CONFIRMED_BOOKING_STATUSES }
s.status === SeatStatus.AVAILABLE
```

**Files Updated:**
- `sections.service.ts`
- `events.service.ts`
- `seats.service.ts`
- `reservation.service.ts`

### 4. Replaced Hardcoded Advertisement Interaction Types

**Before:**
```typescript
type: 'impression' | 'click'
if (dto.type === 'impression')
```

**After:**
```typescript
type: AdInteractionType
if (dto.type === AdInteractionType.IMPRESSION)
```

**Files Updated:**
- `advertisement.dto.ts`
- `advertisements.controller.ts`

## Benefits

1. **Single Source of Truth**: All enums and interfaces are centrally defined
2. **Type Safety**: TypeScript can catch typos and invalid values at compile time
3. **Easier Refactoring**: Changing a value only requires updating it in one place
4. **Better IDE Support**: Autocomplete and intellisense work better with proper types
5. **Reduced Errors**: No risk of typos in string literals
6. **Documentation**: Enums serve as self-documenting code

## Usage Guidelines

### Importing Interfaces
```typescript
import { IAuthenticatedUser, IAuthenticatedRequest } from '../../common/interfaces/index.js';
```

### Importing Enums
```typescript
import { 
  AuditAction, 
  AuditEntityType, 
  SeatStatus,
  BookingStatus,
  CONFIRMED_BOOKING_STATUSES 
} from '../../common/enums/index.js';
```

### Using in Controllers
```typescript
@Post()
async create(
  @Body() dto: CreateDto,
  @CurrentUser() user: IAuthenticatedUser,
) {
  return this.service.create(dto, user.id);
}
```

### Using in Services
```typescript
async create(dto: CreateDto, userId: string) {
  // ... logic
  
  await this.auditLog.log({
    entityType: AuditEntityType.EVENT_SECTION,
    entityId: section.id,
    action: AuditAction.CREATE,
    performedBy: userId,
  });
}
```

## Future Improvements

1. **Frontend Alignment**: Create matching TypeScript enums in the frontend
2. **Validation**: Add runtime validation using class-validator with enum constraints
3. **API Documentation**: Swagger will automatically document enum values
4. **Database Constraints**: Prisma schema already uses enums, ensuring database-level consistency

## Migration Guide

If you need to add new enum values:

1. Update the Prisma schema if it's a database enum
2. Run migrations: `pnpm prisma migrate dev`
3. The enum will automatically be available in `@prisma/client`
4. Re-export it from the appropriate enum file in `/common/enums/`

For application-level enums (non-database):
1. Add to the appropriate enum file in `/common/enums/`
2. Export from `/common/enums/index.ts`
3. Use throughout the codebase
