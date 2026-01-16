# Distributed Ticketing System

A high-performance, scalable ticketing system built with NestJS and React. Features distributed locking, real-time seat management, and robust booking workflows with automatic rollback on failures.

## 🚀 Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment (REQUIRED)
cp .env.example .env
# Edit .env and set JWT_SECRET:
# JWT_SECRET="$(openssl rand -base64 32)"

# 3. Start infrastructure
docker-compose up -d

# 4. Run database migrations
cd src/backend
npx prisma migrate dev
cd ../..

# 5. Start development servers
pnpm dev
```

**🌐 Access Points:**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Docs:** http://localhost:3000/api

> ⚠️ **Important:** Application will not start without `JWT_SECRET` in `.env` file

## 📖 Documentation

**→ [Complete Documentation Index](docs/README.md)** - Start here for guided navigation

### Quick Links

| Category | Documentation | Description |
|----------|--------------|-------------|
| **🚀 Getting Started** | [Setup Guide](docs/setup.md) | Local development environment |
| **🏗️ Architecture** | [System Design](docs/architecture.md) | Technical overview & patterns |
| **🔌 API** | [API Reference](docs/api-reference.md) | Integration guide & endpoints |
| **🎯 Features** | [Feature Guides](docs/features/) | Venue sections, business rules |
| **🚢 Deployment** | [Deploy Guide](docs/deployment.md) | Production setup & scaling |
| **🔐 Security** | [Security Audit](docs/security.md) | Security review & hardening |

## ✨ Key Features

### For Event Organizers
- **Event Management** - Create and manage events with custom or registered venues
- **Flexible Seating** - Support for assigned seating and general admission
- **Venue Templates** - Reusable section configurations for registered venues
- **Real-time Inventory** - Track seat availability and reservations
- **Automatic Status Updates** - Events automatically transition between statuses

### For Customers
- **Browse Events** - Filter by status (On Sale, Upcoming, Past, Free)
- **Interactive Seat Selection** - Visual seat map for assigned seating
- **Secure Reservations** - Time-limited seat holds (10 minutes default)
- **Booking History** - View all past and upcoming bookings

### Technical Highlights
- **Distributed Locking** - Redlock algorithm prevents double bookings
- **Idempotency** - Safe retries for payment operations
- **Saga Pattern** - Atomic booking with automatic compensation
- **Optimistic Locking** - Database-level concurrency control
- **Auto-expiring Reservations** - Automatic cleanup of expired holds
- **Role-Based Access Control** - ADMIN, ORGANIZER, CUSTOMER roles

## 🛠️ Tech Stack

**Backend:**
- NestJS 10.x (Node.js framework)
- Prisma ORM (Database toolkit)
- PostgreSQL (Primary database)
- Redis (Caching & distributed locks)
- JWT Authentication
- Swagger/OpenAPI docs

**Frontend:**
- React 19.2.3
- TypeScript 5.x
- React Router v6
- Axios (HTTP client)
- date-fns (Date utilities)
- Tailwind CSS

## 🏗️ Project Structure

```
ticketing-system/
├── src/
│   ├── backend/          # NestJS backend application
│   │   ├── api/          # Feature modules (auth, events, booking)
│   │   ├── common/       # Shared utilities (database, redis, locks)
│   │   └── main.ts       # Application entry point
│   │
│   └── frontend/         # React frontend application
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route components
│       ├── services/     # API client services
│       └── context/      # React context providers
│
├── docs/                 # Comprehensive documentation
├── .env.example          # Environment variables template
└── pnpm-workspace.yaml   # Monorepo configuration
```

## 🔑 Core Workflows

### Booking Flow
1. User browses events and selects seats
2. **Reservation Created** - Seats locked for 10 minutes
3. **Payment Processed** - Via configured provider (Stripe/Mock)
4. **Booking Confirmed** - Seats marked as sold
5. **Idempotency Check** - Duplicate requests return same booking

*On failure: Automatic refund + seat release*

### Event Status Lifecycle
```
UPCOMING → ON_SALE → SOLD_OUT/COMPLETED
         ↓
      CANCELLED
```

- **UPCOMING** - Before sale starts
- **ON_SALE** - Currently selling tickets
- **SOLD_OUT** - All seats sold
- **COMPLETED** - Event date passed
- **CANCELLED** - Manually cancelled

Auto-updates run hourly + on application startup

## 🔐 Security

**Implemented:**
- ✅ JWT authentication with required secrets
- ✅ Password hashing (bcrypt, salt rounds: 10)
- ✅ Role-based access control (RBAC)
- ✅ Input validation (class-validator)
- ✅ SQL injection protection (Prisma ORM)
- ✅ Distributed locking (race condition prevention)
- ✅ Configurable CORS origins

**Recommended for Production:**
- Rate limiting (@nestjs/throttler)
- Helmet.js security headers
- SSL/TLS encryption
- Redis authentication
- Database SSL mode
- Error tracking (Sentry)
- APM monitoring

See [Security Audit](docs/security.md) for detailed recommendations.

## 📊 API Endpoints

**Authentication:**
- `POST /auth/register` - Create new account
- `POST /auth/login` - Get JWT token
- `GET /auth/profile` - Get user profile (protected)

**Events:**
- `GET /events` - List all events
- `GET /events/:id` - Get event details
- `POST /events` - Create event (organizer)
- `GET /events/:id/inventory` - Get seat availability

**Reservations:**
- `POST /events/:eventId/reservations` - Reserve seats
- `DELETE /events/:eventId/reservations/:id` - Cancel reservation
- `GET /events/:eventId/reservations/user/:userId` - User reservations

**Bookings:**
- `POST /bookings/confirm` - Confirm booking with payment
- `GET /bookings/reference/:ref` - Get booking details
- `GET /bookings/me` - Get my bookings (protected)

**Venues:**
- `GET /venues` - List registered venues
- `POST /venues` - Create venue with section templates (admin)
- `GET /venues/:id` - Get venue details

Full API docs: http://localhost:3000/api (when running)

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 Environment Variables

**Quick setup:** Copy `.env.example` to `.env` and configure:

```bash
# REQUIRED - Generate strong secret (app won't start without this!)
JWT_SECRET="$(openssl rand -base64 32)"

# Database (use SSL in production)
DATABASE_URL="postgresql://user:pass@localhost:5432/ticketing_system"

# Redis (enable auth in production)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# CORS (comma-separated origins)
CORS_ORIGINS="http://localhost:5173"

# Environment
NODE_ENV="development"
```

**📖 See:** [.env.example](.env.example) for all configuration options

## 🚀 Deployment

**Production Ready Checklist:**
- ✅ Generate production `JWT_SECRET`
- ✅ Enable database SSL
- ✅ Configure Redis authentication
- ✅ Set `CORS_ORIGINS` to your domain
- ✅ Review [Security Audit](docs/security.md)

**Deployment Options:**
- 🐳 Docker & Docker Compose
- ☁️ Cloud Platforms (AWS, Azure, GCP)
- 🌐 Traditional VPS/Dedicated Servers
- 📦 Platform-as-a-Service (Heroku, Railway)

**📖 Complete Guide:** [docs/deployment.md](docs/deployment.md)

## 📄 License

This project is [MIT licensed](LICENSE).

## 🙏 Acknowledgments

Built with:
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [React](https://react.dev/) - UI library
- [Redis](https://redis.io/) - In-memory data store

## 📞 Support & Resources

- **📚 Documentation:** [docs/README.md](docs/README.md) - Complete documentation index
- **🔐 Security:** [docs/security.md](docs/security.md) - Security guidelines
- **🚀 Deployment:** [docs/deployment.md](docs/deployment.md) - Production setup
- **🐛 Issues:** [GitHub Issues](https://github.com/your-org/ticketing-system/issues)
- **💬 Discussions:** [GitHub Discussions](https://github.com/your-org/ticketing-system/discussions)

---

**Built with ❤️ using NestJS, React, Prisma, and Redis**  
**Last Updated:** January 17, 2026
