# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📱 Project Overview

**Financial Control System** - Sistema web para controlar despesas e investimentos pessoais entre duas pessoas (casal). Permite lançar gastos mensais, organizar por categorias e acompanhar investimentos.

- **Tech Stack**: Next.js 15 + TypeScript + Tailwind CSS + Prisma 7 + SQLite
- **Frontend**: React components, client-side state management
- **Backend**: Next.js API routes (Route Handlers)
- **Database**: SQLite with Prisma ORM

## 🏗️ Project Structure

```
.
├── app/
│   ├── api/                          # API routes
│   │   ├── users/route.ts            # User CRUD
│   │   ├── categories/route.ts       # Category CRUD
│   │   ├── expenses/route.ts         # Expense CRUD (with filters)
│   │   └── investments/route.ts      # Investment CRUD
│   ├── components/                   # React components
│   │   ├── Dashboard.tsx             # Main layout with tabs
│   │   ├── ExpensesTab.tsx           # Expense management
│   │   ├── InvestmentsTab.tsx        # Investment management
│   │   └── SettingsTab.tsx           # Users and categories setup
│   ├── lib/
│   │   └── prisma.ts                 # Prisma client singleton
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Home page
├── prisma/
│   ├── schema.prisma                 # Database schema
│   ├── dev.db                        # SQLite database
│   └── migrations/                   # Database migrations
├── .env                              # Environment variables
└── package.json
```

## 🗄️ Database Schema

### Models:
- **User**: `id`, `name`, `email` (unique), `color`, `createdAt`
- **Category**: `id`, `name` (unique), `icon`, `color` + relation to Expense
- **Expense**: `id`, `amount`, `title`, `date`, `createdAt` + relations to User and Category
- **Investment**: `id`, `name`, `amount`, `type`, `date`, `notes`, `createdAt` + relation to User

Key constraints:
- Expenses and Investments cascade delete with User
- Category-Expense relationship is one-to-many

## 🚀 Common Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Generate Prisma client
npx prisma generate

# Create/apply migrations
npx prisma migrate dev --name <migration-name>

# Open database UI
npx prisma studio

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 📋 Key API Routes

All routes return JSON and handle errors gracefully.

### Users
- `POST /api/users` → Create user (email must be unique)
- `GET /api/users` → List all users

### Categories
- `POST /api/categories` → Create category (name must be unique)
- `GET /api/categories` → List all categories

### Expenses
- `POST /api/expenses` → Create expense (include userId, categoryId)
- `GET /api/expenses?month=X&year=Y&userId=Z` → List with optional filters
- `PUT /api/expenses` → Update expense
- `DELETE /api/expenses?id=Z` → Delete expense

### Investments
- `POST /api/investments` → Create investment (include userId, type)
- `GET /api/investments?userId=Z` → List with optional user filter
- `PUT /api/investments` → Update investment
- `DELETE /api/investments?id=Z` → Delete investment

## 🎨 Frontend Architecture

**Components are "use client"** - All interactive components use Client Components.

- **Dashboard**: Main container with tab navigation
- **ExpensesTab**: Monthly expense view with filters, charts showing totals by user/category
- **InvestmentsTab**: Investment tracker with type distribution
- **SettingsTab**: User and category management (create only, no edit/delete UI yet)

UI uses **Tailwind CSS** with:
- Dark mode support via `dark:` classes
- Gradient backgrounds and shadows
- Responsive grid layouts
- Color coding by user (stored in User.color)

## 🔄 Data Flow

1. **Component loads** → Calls `loadUsers()`, `loadExpenses()`, etc.
2. **API fetches from DB** → Prisma query with relations included
3. **State updates** → Component re-renders
4. **Forms submit** → POST/PUT/DELETE to API, then reload data

No real-time sync or WebSockets currently implemented.

## 🛠️ Development Workflow

When adding features:

1. **Backend first**: Add route handler in `app/api/*/route.ts`
2. **Update schema if needed**: Edit `prisma/schema.prisma`, then run `npx prisma migrate dev`
3. **Frontend**: Create/update component in `app/components/`
4. **Test**: Run dev server, interact in browser

Keep components simple - fetch on mount, state for form inputs, refetch after mutations.

## 📝 Notes for Future Development

- **No auth yet** - Anyone can create/view all data. Consider session-based auth before production.
- **No edit UI for users/categories** - Only create is exposed in SettingsTab
- **Filters only for expenses** - Investments could use similar month/year filtering
- **No validation** - Frontend has basic checks; consider Zod schemas for API validation
- **No tests** - Add jest/vitest tests as needed
