# Prisma Database Setup

This directory contains all Prisma-related files for database management.

## Structure

```
prisma/
├── schema.prisma    # Database schema definition
├── seed.ts          # Database seeding script
└── migrations/      # Migration history (auto-generated)
```

## Setup Instructions

### 1. Configure Database Connection

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ticketing_system?schema=public"
```

### 2. Create Database

```bash
# Using PostgreSQL CLI
createdb ticketing_system

# Or using psql
psql -U postgres -c "CREATE DATABASE ticketing_system;"
```

### 3. Run Migrations

```bash
# Create and apply migrations
pnpm prisma migrate dev --name init

# Or for production
pnpm prisma migrate deploy
```

### 4. Generate Prisma Client

```bash
pnpm prisma generate
```

### 5. Seed Database (Optional)

```bash
pnpm prisma db seed
```

## Common Commands

### Development

```bash
# Create a new migration
pnpm prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# Open Prisma Studio (GUI for database)
pnpm prisma studio

# Format schema file
pnpm prisma format

# Validate schema
pnpm prisma validate
```

### Production

```bash
# Deploy pending migrations
pnpm prisma migrate deploy

# Generate Prisma Client
pnpm prisma generate
```

## Schema Features

This schema leverages advanced Prisma features:

### 1. **Optimistic Locking**
- `version` field in `Seat` model for concurrent access control
- Prevents double-booking scenarios

### 2. **Enums**
- Type-safe status fields
- Better query performance
- Clear documentation of allowed values

### 3. **Indexes**
- Optimized query performance for common access patterns
- Compound indexes for multi-column queries

### 4. **Cascade Operations**
- Automatic cleanup of related records
- Maintains referential integrity

### 5. **Custom Field Mappings**
- Snake_case database columns
- CamelCase TypeScript properties

### 6. **Decimal Types**
- Precise monetary calculations
- Prevents floating-point errors

### 7. **BigInt IDs**
- Supports large-scale applications
- Auto-incrementing primary keys

## Database Models

### Event
Stores event information including dates, venue, and availability.

### Seat
Individual seats with pricing, status, and reservation tracking.

### Booking
Confirmed bookings with payment information.

### BookingSeat
Junction table linking bookings to specific seats.

### Reservation
Temporary seat holds with expiration times.

## Best Practices

1. **Always use transactions** for operations affecting multiple tables
2. **Use optimistic locking** for seat reservations
3. **Set reservation expiration times** to prevent indefinite holds
4. **Index frequently queried fields** for performance
5. **Use enums** for status fields to ensure data consistency

## Troubleshooting

### Connection Issues

```bash
# Test database connection
pnpm prisma db pull
```

### Schema Drift

```bash
# Check for schema differences
pnpm prisma migrate diff

# Resolve drift
pnpm prisma db push
```

### Reset Everything

```bash
# WARNING: This deletes all data
pnpm prisma migrate reset --force
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
