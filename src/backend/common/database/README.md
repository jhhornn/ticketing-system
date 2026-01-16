# Database Module

This module provides database access using Prisma ORM with NestJS integration.

## Architecture

```
src/database/
├── prisma.service.ts      # Prisma service with lifecycle hooks
├── database.module.ts     # Global database module
└── index.ts              # Barrel exports
```

## Features

### PrismaService

The `PrismaService` extends `PrismaClient` and provides:

- **Lifecycle Management**: Automatic connection/disconnection with NestJS modules
- **Query Logging**: Development-mode query logging with timing
- **Error Handling**: Colorless error formatting for better readability
- **Testing Utilities**: `cleanDatabase()` method for test cleanup
- **Configuration**: Optimized connection settings

### Global Module

The `DatabaseModule` is marked as `@Global()`, making `PrismaService` available throughout the application without repeated imports.

## Usage

### Basic Queries

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './database';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.event.findMany({
      include: {
        seats: true,
      },
    });
  }

  async create(data: CreateEventDto) {
    return this.prisma.event.create({
      data,
    });
  }
}
```

### Transactions

```typescript
async bookSeats(userId: string, eventId: bigint, seatIds: bigint[]) {
  return this.prisma.$transaction(async (tx) => {
    // Create booking
    const booking = await tx.booking.create({
      data: {
        userId,
        eventId,
        bookingReference: generateReference(),
        totalAmount: 0, // Calculate from seats
        status: 'PENDING',
      },
    });

    // Update seats
    await tx.seat.updateMany({
      where: {
        id: { in: seatIds },
        status: 'AVAILABLE',
      },
      data: {
        status: 'BOOKED',
        bookingId: booking.id,
      },
    });

    // Create booking seats
    const seats = await tx.seat.findMany({
      where: { id: { in: seatIds } },
    });

    await tx.bookingSeat.createMany({
      data: seats.map((seat) => ({
        bookingId: booking.id,
        seatId: seat.id,
        price: seat.price,
      })),
    });

    return booking;
  });
}
```

### Optimistic Locking

```typescript
async reserveSeat(seatId: bigint, userId: string) {
  const seat = await this.prisma.seat.findUnique({
    where: { id: seatId },
  });

  if (!seat || seat.status !== 'AVAILABLE') {
    throw new Error('Seat not available');
  }

  try {
    // Update with version check
    return await this.prisma.seat.update({
      where: {
        id: seatId,
        version: seat.version, // Optimistic lock
      },
      data: {
        status: 'RESERVED',
        reservedBy: userId,
        reservedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        version: { increment: 1 },
      },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error('Seat was already reserved by someone else');
    }
    throw error;
  }
}
```

### Pagination

```typescript
async findEvents(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    this.prisma.event.findMany({
      skip,
      take: limit,
      orderBy: { eventDate: 'asc' },
      where: { status: 'ON_SALE' },
    }),
    this.prisma.event.count({
      where: { status: 'ON_SALE' },
    }),
  ]);

  return {
    data: events,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### Aggregations

```typescript
async getEventStatistics(eventId: bigint) {
  const stats = await this.prisma.seat.groupBy({
    by: ['status', 'seatType'],
    where: { eventId },
    _count: true,
    _avg: { price: true },
  });

  return stats;
}
```

### Raw Queries (when needed)

```typescript
async getExpiredReservations() {
  return this.prisma.$queryRaw`
    SELECT * FROM reservations
    WHERE expires_at < NOW()
    AND status = 'ACTIVE'
  `;
}
```

## Error Handling

Prisma throws specific error codes. Handle them appropriately:

```typescript
import { Prisma } from '@prisma/client';

try {
  await this.prisma.event.create({ data });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new ConflictException('Record already exists');
      case 'P2025':
        throw new NotFoundException('Record not found');
      default:
        throw new InternalServerErrorException('Database error');
    }
  }
  throw error;
}
```

## Testing

```typescript
import { Test } from '@nestjs/testing';
import { PrismaService } from './database';

describe('EventService', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaService, EventService],
    }).compile();

    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create event', async () => {
    const event = await prisma.event.create({
      data: {
        eventName: 'Test Event',
        eventDate: new Date(),
        totalSeats: 100,
        availableSeats: 100,
      },
    });

    expect(event).toBeDefined();
    expect(event.eventName).toBe('Test Event');
  });
});
```

## Performance Tips

1. **Use Select**: Only fetch fields you need
   ```typescript
   await prisma.event.findMany({
     select: { id: true, eventName: true }
   });
   ```

2. **Batch Operations**: Use `createMany`, `updateMany`, `deleteMany`
   ```typescript
   await prisma.seat.createMany({
     data: seats,
     skipDuplicates: true,
   });
   ```

3. **Include Relations Wisely**: Avoid deep nesting
   ```typescript
   // Good
   await prisma.booking.findMany({
     include: { bookingSeats: true }
   });
   
   // Avoid
   await prisma.booking.findMany({
     include: {
       bookingSeats: {
         include: {
           seat: {
             include: { event: true }
           }
         }
       }
     }
   });
   ```

4. **Use Indexes**: Already configured in schema for common queries

5. **Connection Pooling**: Configure in DATABASE_URL
   ```
   mysql://user:pass@host:3306/db?connection_limit=10&pool_timeout=20
   ```

## Common Prisma Error Codes

| Code | Description |
|------|-------------|
| P2000 | Value too long for column |
| P2001 | Record not found |
| P2002 | Unique constraint violation |
| P2003 | Foreign key constraint violation |
| P2025 | Record to update/delete not found |
| P2034 | Transaction failed due to conflict |

## Resources

- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)
- [NestJS + Prisma](https://docs.nestjs.com/recipes/prisma)
