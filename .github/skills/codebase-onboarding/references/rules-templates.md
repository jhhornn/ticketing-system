# Rules of Thumb Templates by Architecture Style

Use these as prompts when deriving rules from the actual codebase. Replace generic text with specific file paths, class names, and patterns you find.

---

## How to Derive Good Rules

1. Find a repeated pattern in 3+ places → it's a convention → write a rule
2. Find a comment that says "don't do X" → it's a hard-won lesson → write a rule
3. Find a base class or utility that all similar components extend/use → write a rule about always using it
4. Find a place where someone clearly violated the pattern (and it looks messy) → write a rule about what to do instead

**Bad rule** (generic): "Write clean code and use meaningful variable names."
**Good rule** (specific): "All database queries live in `src/repositories/` — never call `prisma.*` directly from a route handler or service."

---

## Rule Templates by Category

### Layered Architecture (MVC / Clean / Hexagonal)

- "New business logic goes in `services/`, not in `controllers/` — controllers only validate input and call services"
- "The repository layer (`repositories/`) is the only place that touches the ORM — services call repositories, not models directly"
- "Domain objects (`domain/`) must have zero imports from infrastructure (`infra/`) — dependencies only flow inward"
- "Add shared types to `types/index.ts` — never define a type inline in a route file if it'll be reused"

### Microservices

- "Inter-service communication happens only through the message bus or the typed SDK in `clients/` — no direct HTTP calls between services"
- "Every service owns its own database — service B must not query service A's DB directly"
- "New events must be defined in the shared schema registry before publishing — see `schemas/events/`"
- "All services must emit a `service.started` and `service.stopped` lifecycle event for observability"

### Node.js / TypeScript

- "Always use the shared `logger` from `lib/logger.ts` — `console.log` is banned in production paths (ESLint rule enforces this)"
- "Async errors in Express must be passed to `next(err)` — unhandled promise rejections will silently swallow errors"
- "Use `zod` schemas in `schemas/` to validate all external input — never trust `req.body` directly"
- "Environment variables are accessed only via `config/index.ts` — never call `process.env` inline"

### Python / Django / FastAPI

- "New API endpoints go in `routers/` — never add routes directly to `main.py`"
- "Use `get_db()` dependency injection for DB sessions — never create a session manually in a route"
- "Settings are read from `config.py` using `pydantic.BaseSettings` — never read `os.environ` directly"
- "Background tasks use Celery (`tasks/`) — never run slow work synchronously in a request handler"

### Ruby on Rails

- "Fat models, skinny controllers — but move domain logic to `app/services/` once a model exceeds ~150 lines"
- "Use `ActiveJob` for all background work — never spin up threads manually"
- "Scopes on models must be named for the business concept, not the SQL (`published`, not `where_status_eq_published`)"
- "All external API calls go through service objects in `app/services/integrations/`"

### Go

- "Errors are returned, never panicked — `panic` is reserved for programmer errors, not user-facing failures"
- "Interfaces are defined in the consuming package, not the providing package — keep them small (1–3 methods)"
- "Context must be threaded through all functions that do I/O — never store context in a struct"
- "New handlers are registered in `cmd/<service>/main.go` — keep `main.go` as the composition root"

### Frontend (React / Next.js)

- "Server state (API data) uses React Query / SWR — `useState` is only for local UI state"
- "Shared UI components go in `components/ui/` — page-specific components stay in `app/(routes)/`"
- "All API calls are wrapped in hooks in `hooks/` — no `fetch()` calls inside components"
- "Feature flags are read from `lib/flags.ts` — never hardcode conditional behavior inline"

---

## Adding a "Common Tasks" Section

Always include this. Derive it from the actual patterns in the codebase. Template:

### Add a new API endpoint
1. Create handler in `src/handlers/<resource>.ts`
2. Add route in `src/routes/index.ts`
3. Add input schema in `src/schemas/<resource>.ts`
4. Write integration test in `tests/routes/<resource>.test.ts`

### Add a background job
1. Define job class in `src/jobs/<JobName>.ts` extending `BaseJob`
2. Register in `src/jobs/index.ts`
3. Enqueue with `queue.add('<job-name>', payload)`
4. Write unit test covering both success and idempotency

### Add a database migration
1. Run `npm run migration:create -- --name <description>`
2. Edit the generated file in `migrations/`
3. Run `npm run migration:run` locally to verify
4. Migration will auto-run on deploy via `npm run migration:run` in the deploy script

### Add a new environment variable
1. Add to `.env.example` with a placeholder value and comment
2. Add to `src/config/index.ts` with validation (zod / joi)
3. Add to the CI/CD secrets and deployment environment
4. Document in `docs/configuration.md`