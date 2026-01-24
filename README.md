# Distributed Ticketing System

A high-performance, production-ready ticketing system built with NestJS and React. Features distributed locking, real-time seat management, optimistic booking workflows with automatic rollback, countdown timers, comprehensive seat inventory tracking, and enterprise-grade security.

## 🔒 Security Features

- ✅ **Rate Limiting**: 100 requests/minute per IP (DDoS protection)
- ✅ **Security Headers**: Helmet.js with CSP, XSS, clickjacking protection
- ✅ **Input Sanitization**: Automatic trimming and validation of all user inputs
- ✅ **Error Handling**: Stack traces hidden in production
- ✅ **Password Security**: bcrypt hashing with 10 salt rounds
- ✅ **JWT Authentication**: Mandatory secret validation on startup
- ✅ **SQL Injection Prevention**: Prisma ORM with prepared statements
- ✅ **HttpOnly Cookie Support**: Infrastructure ready for secure token storage

📖 **Full Security Audit**: See [docs/SECURITY-AUDIT-FIXES.md](docs/SECURITY-AUDIT-FIXES.md) for complete details.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment (REQUIRED)
cp .env.example .env
# Edit .env and set JWT_SECRET:
# JWT_SECRET="$(openssl rand -base64 32)"

# 3. Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# 4. Run database migrations
cd src/backend
npx prisma migrate dev
npx prisma generate
cd ../..

# 5. Start development servers (Frontend + Backend)
pnpm dev
```

**🌐 Access Points:**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Docs (Swagger):** http://localhost:3000/api

> ⚠️ **Important:** Application will not start without `JWT_SECRET` in `.env` file

## ⚡ What's New (Latest Updates)

### Real-Time Reservation Management
- ✨ **Live Countdown Timer** - Visual countdown on checkout page with color-coded urgency
- ⏱️ **Auto-Expiration** - Reservations automatically expire and redirect users with clear messaging
- 🔴 **Urgency Indicators** - Color changes (orange → yellow → red) as time runs out
- 🎯 **Smart Redirect** - Automatic navigation back to event page on expiration

### Enhanced Event Management
- 🎫 **Dynamic Pricing Display** - Shows "Ticketed Event" label with section-specific pricing
- 💰 **Mixed Pricing Support** - Events can have both free ($0) and paid sections
- 📊 **Improved Capacity Validation** - Only restricts editing when seats are actually sold
- ✅ **Better UX** - Clearer error messages and validation feedback

### Code Optimizations
- 🚀 **Performance Improvements** - Optimized database queries and caching strategies
- 📚 **Comprehensive Documentation** - REST API reference, performance guide, frontend optimization guide
- 🔐 **Security Enhancements** - Updated security audit with production recommendations
- 🏗️ **Architecture Improvements** - Better code organization and service layer patterns

## 📖 Documentation

**→ [Complete Documentation Index](docs/README.md)** - Start here for guided navigation

### Core Documentation

| Category | Documentation | Description |
|----------|--------------|-------------|
| **🚀 Getting Started** | [Setup Guide](docs/setup.md) | Local development environment setup |
| **🏗️ Architecture** | [System Design](docs/architecture.md) | Technical overview & design patterns |
| **🔌 API** | [REST API Reference](docs/REST-API.md) | Complete backend API documentation |
| | [Frontend API Reference](docs/api-reference.md) | Frontend service integration guide |
| **🎯 Features** | [Feature Guides](docs/features/) | Venue sections, discounts, business rules |
| **🚢 Deployment** | [Deploy Guide](docs/deployment.md) | Production setup & scaling |
| **🔐 Security** | [Security Audit](docs/security.md) | Security review & production hardening |

### Optimization Guides

| Guide | File | Description |
|-------|------|-------------|
| **⚡ Performance** | [Performance Guide](docs/PERFORMANCE.md) | Database optimization, caching, monitoring |
| **🎨 Frontend** | [Frontend Optimization](docs/FRONTEND-OPTIMIZATION.md) | React optimization, code splitting, bundle size |
| **🧪 Testing** | [Testing Guide](docs/testing-booking-flow.md) | E2E testing & booking flow validation |

## ✨ Key Features

### For Event Organizers
- **🎭 Event Management** - Create and manage events with custom or registered venues
- **🪑 Flexible Seating** - Support for assigned seating and general admission (GA)
- **🏢 Venue Templates** - Reusable section configurations for registered venues
- **📊 Real-time Inventory** - Track seat availability and reservations with live updates
- **🔄 Automatic Status Updates** - Events transition between statuses (UPCOMING → ON_SALE → COMPLETED)
- **📈 Analytics Dashboard** - Track ticket sales, revenue, and booking patterns
- **💸 Discount Management** - Create percentage or fixed-amount discount codes
- **🎫 Section Management** - Dynamic section creation with capacity and pricing

### For Customers
- **🔍 Browse Events** - Filter by status (On Sale, Upcoming, Past, Free)
- **🖱️ Interactive Seat Selection** - Visual seat map for assigned seating
- **⏱️ Time-Limited Reservations** - Countdown timer shows exact time remaining (default: 10 minutes)
- **🔄 Auto-Expiration Handling** - Clear messaging and automatic redirect when reservation expires
- **💳 Secure Checkout** - Confirmation page with visual urgency indicators
- **📜 Booking History** - View all past and upcoming bookings with detailed information
- **🎟️ Booking Details Modal** - Complete booking breakdown with seat assignments
- **🎨 Visual Seat Status** - Color-coded seats (available, reserved, booked)

### Technical Highlights
- **🔒 Distributed Locking** - Redlock algorithm prevents double bookings
- **🔁 Idempotency** - Safe retries for payment operations (prevents duplicate charges)
- **🎯 Saga Pattern** - Atomic booking with automatic compensation on failure
- **⚡ Optimistic Locking** - Database-level concurrency control with version fields
- **⏰ Auto-expiring Reservations** - Background job automatically cleans up expired holds
- **👥 Role-Based Access Control** - ADMIN, ORGANIZER, CUSTOMER roles with granular permissions
- **📝 Comprehensive Logging** - Structured logging for debugging and monitoring
- **🔄 Multi-Reservation Support** - Book multiple seats in a single transaction

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

### Booking Flow (Enhanced)
1. **Event Discovery** - User browses events and views available sections
2. **Seat Selection** - Interactive seat map for assigned seating or quantity for GA
3. **🆕 Reservation with Countdown** - Seats locked with real-time countdown timer
   - Visual urgency indicators (orange → yellow → red)
   - Automatic expiration handling with clear messaging
4. **Checkout Page** - Review booking details with remaining time displayed
5. **Payment Processing** - Via configured provider (Stripe/Mock)
6. **Booking Confirmation** - Seats marked as sold, confirmation email sent
7. **Idempotency Check** - Duplicate requests return same booking (prevents double charges)

*On failure: Automatic compensation via saga pattern:*
- Payment refunded
- Seats released back to inventory
- Reservation status updated
- User notified of failure reason

### Reservation Lifecycle (Detailed)
```
ACTIVE (10 min) → [User completes checkout] → CONFIRMED
       ↓
   [Timeout] → EXPIRED → Seats released
       ↓
 [User cancels] → CANCELLED → Seats released immediately
```

**Key Features:**
- Real-time countdown on checkout page
- Color-coded urgency (orange > 3min, yellow ≤ 3min, red < 1min)
- Pulse animation when under 1 minute
- Auto-redirect with 3-second warning on expiration
- Background job cleanup every minute

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

### Authentication
- `POST /auth/register` - Create new account (customer role by default)
- `POST /auth/login` - Get JWT access token
- `GET /auth/profile` - Get authenticated user profile (protected)

### Events Management
- `GET /events` - List all events (with optional status filter)
- `GET /events/:id` - Get detailed event information
- `POST /events` - Create new event (organizer/admin only)
- `PATCH /events/:id` - Update event details (organizer/admin only)
- `DELETE /events/:id` - Delete event (admin only)
- `GET /events/:id/inventory` - Get real-time seat availability
- `GET /events/:id/purchase-eligibility` - Check if user can purchase tickets

### Reservations (Time-Limited)
- `POST /events/:eventId/reservations` - Reserve seats with expiration timer
- `DELETE /events/:eventId/reservations/:id` - Cancel active reservation
- `GET /events/:eventId/reservations/user/:userId` - Get user's reservations for event
- `GET /reservations/:id` - Get specific reservation details

### Bookings (Confirmed Purchases)
- `POST /bookings/confirm` - Confirm booking with payment (idempotent)
- `GET /bookings/reference/:ref` - Get booking by reference number
- `GET /bookings/me` - Get authenticated user's bookings
- `GET /bookings/:id` - Get detailed booking information

### Event Sections
- `POST /events/:eventId/sections` - Create section with seat generation
- `PATCH /events/:eventId/sections/:id` - Update section details
- `DELETE /events/:eventId/sections/:id` - Delete section (if no sales)
- `GET /events/:eventId/sections` - List all sections for event

### Discounts & Promotions
- `POST /discounts` - Create discount code (organizer/admin)
- `GET /discounts` - List all discounts
- `GET /discounts/validate` - Validate discount code for booking
- `DELETE /discounts/:id` - Deactivate discount

### Venues (Registered)
- `GET /venues` - List registered venues with section templates
- `POST /venues` - Create venue with reusable sections (admin only)
- `GET /venues/:id` - Get venue details with sections
- `PATCH /venues/:id` - Update venue information

### Seats Management
- `GET /events/:eventId/seats` - Get all seats for event
- `GET /events/:eventId/sections/:sectionId/seats` - Get seats by section
- `PATCH /seats/:id` - Update seat status (admin only)

### Statistics & Analytics
- `GET /stats/events/:eventId` - Event-specific stats (sales, revenue, attendance)
- `GET /stats/organizer` - Organizer dashboard statistics

### Advertisements (Promotions)
- `GET /advertisements` - List active advertisements
- `POST /advertisements` - Create ad campaign (admin only)

**📚 Complete API Documentation:** 
- **REST API Reference:** [docs/REST-API.md](docs/REST-API.md) - Full endpoint documentation with examples
- **Swagger UI:** http://localhost:3000/api (interactive API testing when running)

**🔑 Authentication:**
All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov

# Load testing (Artillery)
cd docs
artillery run load-test.yml
```

**Testing Documentation:**
- [Testing Booking Flow](docs/testing-booking-flow.md) - E2E booking test scenarios
- [Performance Testing](docs/PERFORMANCE.md#load-testing) - Load testing configuration

## 🐛 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Error: JWT_SECRET not configured
# Solution: Set JWT_SECRET in .env
echo 'JWT_SECRET="'$(openssl rand -base64 32)'"' >> .env
```

#### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database
docker-compose restart postgres

# Check DATABASE_URL in .env
echo $DATABASE_URL
```

#### Redis Connection Error
```bash
# Check if Redis is running
docker ps | grep redis

# Restart Redis
docker-compose restart redis

# Test connection
redis-cli ping  # Should return "PONG"
```

#### Frontend Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Vite cache
rm -rf src/frontend/.vite

# Rebuild
pnpm build
```

#### Prisma Migration Issues
```bash
# Reset database (WARNING: deletes all data)
cd src/backend
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# View migration status
npx prisma migrate status
```

### Performance Issues

If experiencing slow response times:

1. **Check database indexes** - See [Performance Guide](docs/PERFORMANCE.md#index-optimization)
2. **Enable Redis caching** - See [Caching Strategy](docs/PERFORMANCE.md#caching-strategy)
3. **Monitor slow queries** - Check logs for queries > 100ms
4. **Review connection pool** - Adjust `connection_limit` in DATABASE_URL

### Memory Leaks

If backend memory usage grows continuously:

```bash
# Profile with Node.js inspector
node --inspect src/backend/main.ts

# Monitor memory
node --max-old-space-size=4096 src/backend/main.ts

# Check for leaked intervals/timeouts
```

See [Performance Guide](docs/PERFORMANCE.md#monitoring--profiling) for detailed monitoring setup.

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork & Clone**
   ```bash
   git clone https://github.com/your-username/ticketing-system.git
   cd ticketing-system
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Changes**
   - Follow existing code style
   - Add tests for new features
   - Update documentation
   - Run linter: `pnpm lint`

4. **Test Your Changes**
   ```bash
   pnpm test              # Unit tests
   pnpm test:e2e          # E2E tests
   pnpm build             # Verify build works
   ```

5. **Commit with Meaningful Message**
   ```bash
   git commit -m 'feat: add countdown timer to checkout page'
   ```
   
   **Commit Convention:**
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `perf:` - Performance improvement
   - `refactor:` - Code refactoring
   - `test:` - Test additions/changes
   - `chore:` - Build/tooling changes

6. **Push & Create PR**
   ```bash
   git push origin feature/amazing-feature
   ```
   Then open a Pull Request on GitHub

### Code Style Guidelines

**Backend (NestJS):**
- Use dependency injection
- Follow service-repository pattern
- Add Swagger documentation (@ApiTags, @ApiOperation)
- Validate inputs with DTOs
- Handle errors with custom exceptions

**Frontend (React):**
- Use functional components with hooks
- Extract reusable components
- Keep components under 300 lines
- Use TypeScript strictly (no `any`)
- Follow Tailwind CSS utility-first approach

**General:**
- Write self-documenting code
- Add comments for complex logic
- Update docs when adding features
- Keep functions focused (single responsibility)

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added for new features
- [ ] All tests pass (`pnpm test`)
- [ ] Documentation updated
- [ ] No console.log statements (use logger)
- [ ] TypeScript compilation successful
- [ ] PR description explains changes clearly

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

### Production Readiness Checklist

#### Security ✅
- [ ] Generate strong `JWT_SECRET` (32+ characters)
- [ ] Enable database SSL (`sslmode=require`)
- [ ] Configure Redis authentication (`REDIS_PASSWORD`)
- [ ] Set `CORS_ORIGINS` to production domain(s)
- [ ] Install rate limiting (@nestjs/throttler)
- [ ] Add Helmet.js security headers
- [ ] Enable HTTPS/TLS encryption
- [ ] Disable or protect Swagger docs

#### Environment ⚙️
- [ ] Set `NODE_ENV=production`
- [ ] Configure error tracking (Sentry)
- [ ] Set up logging service (CloudWatch, LogDNA)
- [ ] Configure APM monitoring (New Relic, DataDog)
- [ ] Set up backup strategy
- [ ] Configure CDN for static assets

#### Database 🗄️
- [ ] Run all migrations
- [ ] Set up automated backups
- [ ] Configure connection pooling (PgBouncer)
- [ ] Enable query performance monitoring
- [ ] Set up read replicas (if needed)

#### Performance ⚡
- [ ] Enable Redis caching
- [ ] Configure appropriate cache TTLs
- [ ] Set database connection limits
- [ ] Enable gzip compression
- [ ] Optimize images and assets
- [ ] Configure CDN

### Deployment Options

**Option 1: Docker Compose (Simple)**
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs -f backend
```

**Option 2: Kubernetes (Scalable)**
```bash
# Apply configurations
kubectl apply -f k8s/

# Check pods
kubectl get pods

# Scale replicas
kubectl scale deployment/backend --replicas=3
```

**Option 3: Cloud Platforms**
- **AWS:** ECS/EKS + RDS + ElastiCache
- **Azure:** App Service + Azure Database + Redis Cache
- **GCP:** Cloud Run + Cloud SQL + Memorystore
- **Railway/Render:** Simple deployment with managed services

### Monitoring & Logging

**Recommended Tools:**
- **APM:** New Relic, DataDog, Dynatrace
- **Logging:** ELK Stack, Splunk, CloudWatch
- **Error Tracking:** Sentry, Rollbar
- **Uptime Monitoring:** Pingdom, UptimeRobot

**Key Metrics to Monitor:**
- Response times (p50, p95, p99)
- Error rates and types
- Database query performance
- Redis hit/miss ratio
- Memory and CPU usage
- Active connections count

**📚 Complete Deployment Guide:** [docs/deployment.md](docs/deployment.md)

## 📄 License

This project is [MIT licensed](LICENSE).

## 🙏 Acknowledgments

Built with:
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [React](https://react.dev/) - UI library
- [Redis](https://redis.io/) - In-memory data store

## 📞 Support & Resources

### Documentation
- **📚 Main Docs:** [docs/README.md](docs/README.md) - Complete documentation index
- **🔌 REST API:** [docs/REST-API.md](docs/REST-API.md) - Backend API reference
- **⚡ Performance:** [docs/PERFORMANCE.md](docs/PERFORMANCE.md) - Optimization guide
- **🎨 Frontend:** [docs/FRONTEND-OPTIMIZATION.md](docs/FRONTEND-OPTIMIZATION.md) - React optimization
- **🔐 Security:** [docs/security.md](docs/security.md) - Security guidelines
- **🚀 Deployment:** [docs/deployment.md](docs/deployment.md) - Production setup

### Community & Support
- **🐛 Bug Reports:** [GitHub Issues](https://github.com/your-org/ticketing-system/issues)
- **💡 Feature Requests:** [GitHub Discussions](https://github.com/your-org/ticketing-system/discussions)
- **💬 Q&A:** [Stack Overflow](https://stackoverflow.com/questions/tagged/ticketing-system)
- **📧 Email:** support@ticketing-system.com

### Useful Links
- **NestJS Docs:** https://docs.nestjs.com/
- **Prisma Docs:** https://www.prisma.io/docs
- **React Docs:** https://react.dev/
- **Redis Docs:** https://redis.io/docs/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

**Built with ❤️ using NestJS, React, Prisma, PostgreSQL, and Redis**  
**Last Updated:** January 2026  
**Version:** 2.0.0
