# Developer Setup Guide

Welcome to the Ticketing System! This guide will help you set up the project locally for development.

## Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher) - `npm install -g pnpm`
- **PostgreSQL** (v14 or higher)

## Project Structure

This is a **pnpm workspace monorepo** with the following structure:

```
ticketing-system/
├── src/
│   ├── backend/          # NestJS API
│   └── frontend/         # React + Vite app
├── pnpm-workspace.yaml  # Workspace configuration
├── package.json         # Root workspace scripts
└── DEVELOPER_SETUP.md
```

## Quick Start

### 1. Install All Dependencies

From the **root directory**, run:

```bash
pnpm install
```

This will install dependencies for both backend and frontend.

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ticketing_system"

# JWT
JWT_SECRET="your-secret-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000

# Reservation Settings
RESERVATION_TIMEOUT_MINUTES=10
```

### 3. Setup Database

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# (Optional) Seed the database
pnpm --filter backend prisma:seed
```

### 4. Start Development Servers

**Option 1: Start both backend and frontend together**

```bash
pnpm dev
```

**Option 2: Start individually**

```bash
# Backend only
pnpm dev:backend

# Frontend only
pnpm dev:frontend
```

The backend will be available at `http://localhost:3000`.
The frontend will be available at `http://localhost:5173`.
API documentation is at `http://localhost:3000/api`.

## Workspace Commands

The root `package.json` provides convenient workspace scripts:

```bash
# Development
pnpm dev              # Start both apps in parallel
pnpm dev:backend      # Start backend only
pnpm dev:frontend     # Start frontend only

# Build
pnpm build            # Build both apps
pnpm build:backend    # Build backend only
pnpm build:frontend   # Build frontend only

# Production
pnpm start            # Start backend in production mode
pnpm start:prod       # Start backend with node dist/main

# Database
pnpm prisma:generate  # Generate Prisma Client
pnpm prisma:migrate   # Run migrations
pnpm prisma:studio    # Open Prisma Studio
```

## Working with Individual Packages

You can run package-specific commands using pnpm's `--filter` flag:

```bash
# Backend commands
pnpm --filter backend <command>

# Frontend commands
pnpm --filter frontend <command>

# Examples:
pnpm --filter backend test
pnpm --filter frontend lint
```

## MCP Server Setup

The MCP (Model Context Protocol) server runs alongside the main application and exposes ticketing system tools to AI agents.

### Starting the MCP Server

The MCP server starts automatically when you run the backend. It communicates via **stdio**, making it compatible with tools like Claude Desktop and Cursor.

### Connecting an AI Agent

To connect your local AI agent to the MCP server, add this configuration to your agent's MCP config file:

**For Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "ticketing-system": {
      "command": "node",
      "args": ["/absolute/path/to/ticketing-system/dist/main.js"],
      "env": {
        "DATABASE_URL": "postgresql://username:password@localhost:5432/ticketing_system",
        "PORT": "3000"
      }
    }
  }
}
```

**Note**: Replace `/absolute/path/to/ticketing-system` with the actual path to your project.

### Available MCP Tools

Once connected, the following tools are available:

- `list_events` - List upcoming events for a tenant
- `get_event_details` - Get detailed information about a specific event
- `list_available_seats` - List available seats for an event (capped at 50)
- `get_seat_availability_summary` - Get a summary of seat availability by type and status

You can view these tools in the frontend at `http://localhost:5173/mcp`.

## Detailed Project Structure

```
ticketing-system/
├── src/
│   ├── backend/           # NestJS Backend
│   │   ├── src/
│   │   │   ├── api/      # API modules (events, bookings, etc.)
│   │   │   ├── common/   # Shared utilities, database, guards
│   │   │   ├── mcp/      # MCP server implementation
│   │   │   └── main.ts   # Application entry point
│   │   ├── dist/         # Build output
│   │   └── package.json
│   └── frontend/          # React Frontend
│       ├── src/
│       │   ├── pages/    # Page components
│       │   ├── components/ # Reusable components
│       │   ├── services/ # API service clients
│       │   └── context/  # React contexts
│       └── package.json
├── pnpm-workspace.yaml   # Workspace configuration
├── package.json          # Root workspace scripts
└── DEVELOPER_SETUP.md
```

## Common Tasks

### View Database

```bash
pnpm prisma:studio
```

### Reset Database

```bash
pnpm --filter backend prisma:migrate:reset
```

### Format Code

```bash
pnpm --filter backend format
pnpm --filter frontend format
```

### Run Tests

```bash
pnpm --filter backend test
```

### Clean Install (if needed)

```bash
# Remove all node_modules
rm -rf node_modules src/*/node_modules

# Clean pnpm store (optional)
pnpm store prune

# Reinstall
pnpm install
```

## Troubleshooting

### CORS Issues

If you encounter CORS errors, ensure the frontend URL (`http://localhost:5173`) is listed in `src/main.ts`.

### Database Connection Issues

- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists: `CREATE DATABASE ticketing_system;`

### MCP Connection Issues

- Ensure the backend is running before connecting your agent
- Verify the absolute path in the MCP config
- Check that `dist/main.js` exists (run `npm run build` if needed)

## Need Help?

- Check the API documentation: `http://localhost:3000/api`
- Review the MCP tools: `http://localhost:5173/mcp`
- Open an issue on the repository

Happy coding! 🚀
