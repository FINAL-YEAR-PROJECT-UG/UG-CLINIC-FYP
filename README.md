# UG-CLINIC-FYP

A full-stack student clinic management platform for the University of Ghana. The system combines a Next.js frontend, an Express + Prisma backend, PostgreSQL persistence, Redis-backed session support, and role-based access for students, staff, doctors, receptionists, and admins.

## Overview

UG-CLINIC-FYP streamlines appointment booking, clinic operations, student records, health resource publishing, and secure staff administration in one product. It is designed for a university healthcare setting and includes account registration, login flows, 2FA for staff, queue management, document moderation, and operational analytics.

## Key Features

- Student appointment booking and rescheduling
- Staff dashboard for clinic operations and queue management
- Doctor availability tracking and assignment workflows
- Secure authentication with password recovery and staff 2FA
- Health resource publishing and moderation
- News and announcements management
- Session timeout and inactivity protection
- Responsive mobile-friendly UI across public, student, and staff experiences

## Architecture

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Node.js, Express.js, TypeScript, Prisma ORM
- Database: PostgreSQL
- Cache / session store: Redis + PostgreSQL session tables
- Auth: JWT and Express session-based security patterns
- Utilities: Zod validation, email/SMS flows, rate limiting, security middleware

## Repository Structure

```text
UG-CLINIC-FYP/
├── README.md                  # Project-level setup and overview
├── QUICKSTART.md              # Quick issue-specific troubleshooting guide
├── docker-compose.yml         # Postgres, Redis, backend, and frontend containers
├── backend/                   # Express API and Prisma project
│   ├── README.md
│   ├── .env.example
│   ├── src/
│   ├── prisma/
│   ├── scripts/
│   └── uploads/
├── frontend/                  # Next.js app
│   ├── README.md
│   ├── .env.example
│   ├── src/
│   └── public/
├── .env                       # Root environment file (if used locally)
├── package.json               # Root convenience scripts
├── LICENSE
└── ...
```

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query
- React Hook Form + Zod
- Radix UI primitives
- Sonner toasts
- Framer Motion

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- JWT
- Bcrypt
- Nodemailer / Twilio integrations
- Helmet, rate limiting, input sanitization, session management

## Prerequisites

Before running the project, make sure you have:

- Node.js 18+ or newer
- npm
- PostgreSQL running locally or via Docker
- Redis running locally or via Docker
- Docker Desktop (optional, for containerized setup)

## Quick Start

### 1) Install dependencies

From the project root:

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 2) Configure environment files

Create or copy the example environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Then update values for your local environment. The main values you need are:

- Backend: `DATABASE_URL`, `SESSION_SECRET`, `JWT_SECRET`, `CORS_ORIGIN`
- Frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_SECRET`, Supabase keys

### 3) Start infrastructure services

The easiest local setup is via Docker Compose:

```bash
docker compose up -d postgres redis
```

This starts PostgreSQL and Redis on their default ports.

### 4) Run backend

```bash
cd backend
npm run dev
```

Expected API base URL:

```text
http://localhost:3005/api
```

### 5) Run frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Expected app URL:

```text
http://localhost:3001
```

## Docker Setup

The repository includes a Docker Compose setup for the full stack.

```bash
docker compose up --build
```

This runs:

- PostgreSQL on `5432`
- Redis on `6379`
- Backend on `3005`
- Frontend on `3001`

## Default Local Access

- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:3005/api`
- Health check: `http://localhost:3005/health`

## Default Demo Accounts

The app ships with seeded or development accounts for testing.

### Student

- Email: `student@st.ug.edu.gh`
- Password: `Password123!`

### Staff / Admin

- Email: `emmanueloteng.k@gmail.com`
- Password: `Password123!`

## Core User Flows

- Student registration and login
- Appointment booking and cancellation
- Student dashboard management
- Staff dashboard overview and KPI monitoring
- Queue operations and doctor assignment
- Student records and resource management
- Two-factor verification for staff accounts
- Public health resource browsing and contact pages

## Important Notes

- Use the backend-only `.env` for server secrets and database credentials.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only; do not expose it to the browser.
- The frontend expects `NEXT_PUBLIC_API_URL` to point to the backend API root.
- If you are seeing backend connection issues, ensure PostgreSQL and Redis are running first.

## Useful Scripts

From the root:

```bash
npm run dev --prefix frontend
npm run build --prefix frontend
npm run dev --prefix backend
npm run build --prefix backend
```

From each app directory, use the scripts defined in that app's `package.json`.

## Documentation

Additional project documentation is available in:

- `QUICKSTART.md`
- `backend/README.md`
- `frontend/README.md`
- `SETUP.md`
- `SESSION_AUTH_IMPLEMENTATION_GUIDE.md`

## License

This project is licensed under the ISC License.
