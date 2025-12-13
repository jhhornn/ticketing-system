# Distributed Ticketing System

A high-performance, scalable backend for a ticketing system built with NestJS. This system handles high-concurrency booking scenarios with distributed locking, idempotency, and a robust microservices-ready architecture.

## 🚀 Features

### Core Modules
- **Authentication**: JWT-based authentication with Role-Based Access Control (RBAC).
- **Events**: Event management with seat inventory.
- **Reservations**: Distributed lock-based seat reservations with TTL and deadlock prevention.
- **Bookings**: Saga pattern implementation for atomic booking confirmation with payment integration.
- **Payments**: Strategy pattern for pluggable payment providers (Stripe, Mock, etc.).

### Key Technical Implementations
- **Distributed Locking**: Uses Redlock algorithm (Redis) to prevent race conditions and double bookings.
- **Idempotency**: Ensures operations are processed only once, even with network retries.
- **Saga Pattern**: Manages distributed transactions (Reservation -> Payment -> Booking) with automatic rollback/compensation.
- **Strategy Pattern**: Allows switching payment providers dynamically.
- **Database**: Prisma ORM with PostgreSQL, supporting optimistic locking.
- **Caching**: Redis for caching and distributed locks.

## 🏗️ Architecture

The system follows a modular, feature-based architecture:

```
src/
├── api/
│   ├── auth/           # Authentication & Authorization
│   ├── booking/        # Booking management (Saga)
│   ├── events/         # Event & Seat management
│   ├── payment/        # Payment processing (Strategy)
│   └── reservation/    # Temporary seat holding (Locks)
├── common/
│   ├── database/       # Prisma & Seeding
│   ├── redis/          # Redis client
│   └── locks/          # Distributed locking service
└── main.ts
```

### Booking Flow (Saga)
1.  **Validate Reservation**: Check if seats are reserved by the user.
2.  **Acquire Locks**: Lock all seats to prevent concurrent modifications.
3.  **Process Payment**: Charge the user via the selected payment provider.
4.  **Create Booking**: Persist booking record.
5.  **Link Seats**: Assign seats to the booking.
6.  **Update Status**: Mark seats as sold.
7.  **Idempotency**: Store result to handle retries.

*If any step fails, the system automatically refunds the payment and releases the seats.*

## 🛠️ Tech Stack

-   **Framework**: [NestJS](https://nestjs.com/)
-   **Language**: TypeScript
-   **Database**: PostgreSQL
-   **ORM**: Prisma
-   **Cache/Locks**: Redis (ioredis)
-   **Documentation**: Swagger / OpenAPI

## 🏁 Getting Started

### Prerequisites
-   Node.js (v18+)
-   pnpm
-   Docker (for Redis/Postgres)

### Installation

```bash
$ pnpm install
```

### Environment Setup

1.  Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
2.  Update `.env` with your configuration (Database URL, Redis host, Stripe keys).

### Database Setup

```bash
# Start infrastructure (if using Docker)
docker-compose up -d

# Run migrations
pnpm prisma migrate dev

# Seed the database
pnpm prisma db seed
```

## 🏃 Running the Application

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## 📚 API Documentation

The API is documented using Swagger UI.

1.  Start the application: `pnpm run start:dev`
2.  Visit: **http://localhost:3000/api**

### Available Endpoints

**Auth**
-   `POST /auth/login`
-   `POST /auth/register`

**Reservations**
-   `POST /reservations` - Reserve seats
-   `DELETE /reservations/:id` - Cancel reservation
-   `GET /reservations/user/:userId` - Get user reservations

**Bookings**
-   `POST /bookings/confirm` - Confirm booking with payment
-   `GET /bookings/reference/:ref` - Get booking by reference
-   `GET /bookings/user/:userId` - Get user bookings

## 🗺️ Roadmap

- [x] Core Modules (Auth, Events, Booking, Payment)
- [x] Distributed Locking (Redlock)
- [x] Idempotency & Sagas
- [ ] Advanced Search & Filtering
- [ ] Email Notifications
- [ ] WebSocket Real-time Updates
- [ ] Comprehensive E2E Tests

## 📄 License

This project is [MIT licensed](LICENSE).
