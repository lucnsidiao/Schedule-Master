# White-Label Appointment SaaS

## Overview

This is a white-label appointment scheduling SaaS application built as a monorepo with a React frontend and Node.js/Express backend. The system allows business owners to manage appointments, services, working hours, and clients through a modern dashboard interface. It's designed to be white-labeled, meaning businesses can customize it with their own branding.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled using Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state and caching
- **Styling**: Tailwind CSS with a custom design system based on shadcn/ui components
- **UI Components**: Radix UI primitives wrapped with shadcn/ui styling conventions
- **Design Pattern**: Modern SaaS dashboard (Linear + Notion inspired) with glass-card effects and professional neutral palette

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schema validation
- **Authentication**: Passport.js with local strategy, session-based auth using express-session
- **Password Security**: Scrypt hashing with timing-safe comparison

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: `shared/schema.ts` serves as single source of truth
- **Migrations**: Managed via drizzle-kit with `db:push` command

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components (shadcn/ui)
│       ├── hooks/        # Custom React hooks for data fetching
│       ├── pages/        # Page components (dashboard, calendar, services, settings)
│       └── lib/          # Utilities and query client setup
├── server/           # Express backend
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database operations interface
│   ├── auth.ts       # Authentication setup
│   └── db.ts         # Database connection
├── shared/           # Shared code between frontend and backend
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route definitions with Zod schemas
└── migrations/       # Database migration files
```

### Key Design Decisions

1. **Monorepo with Shared Types**: The `shared/` directory contains both database schema and API route definitions, ensuring type safety across the full stack without duplication.

2. **Storage Interface Pattern**: The `IStorage` interface in `server/storage.ts` abstracts database operations, making it easier to test or swap implementations.

3. **API Route Contracts**: Routes are defined as typed objects in `shared/routes.ts` with input/output Zod schemas, enabling automatic validation and type inference.

4. **Component-First UI**: Using shadcn/ui pattern where components are copied into the project rather than imported from a package, allowing full customization.

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage in PostgreSQL

### Authentication
- **passport**: Authentication middleware
- **passport-local**: Username/password authentication strategy
- **express-session**: Session management

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **date-fns**: Date manipulation for calendar features
- **recharts**: Dashboard analytics charts
- **framer-motion**: Page transitions and animations
- **embla-carousel-react**: Carousel functionality

### UI Framework
- **@radix-ui/***: Accessible UI primitives (dialog, dropdown, select, etc.)
- **class-variance-authority**: Component variant management
- **tailwind-merge**: Tailwind class merging utility
- **lucide-react**: Icon library

### Build Tools
- **Vite**: Frontend bundler with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption (optional, has default for dev)