# UG Clinic Backend

This is the backend service for the UG-CLINIC-FYP project. It exposes the API for authentication, appointment workflows, staff operations, clinic resources, patient records, and administrative tools that power the university clinic platform.

## Stack

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- JWT
- bcrypt
- Helmet and security middleware
- Rate limiting and input sanitization

## Features

- Student registration and login
- Staff authentication and 2FA verification
- Role-based access control for students, admins, doctors, and receptionists
- Appointment creation, updates, cancellation, and tracking
- Doctor availability and assignment logic
- Health resource management
- News and announcement endpoints
- Notification and email support
- Session persistence and cleanup strategies
- Security headers, request logging, and protection against abuse

## Project Structure

```text
backend/
├── src/
│   ├── app.ts                  # Express application entry point
│   ├── config/                 # Environment and config helpers
│   ├── controllers/            # Route handlers
│   ├── jobs/                   # Scheduled/background jobs
│   ├── lib/                    # Shared libraries
│   ├── middleware/             # Auth, sanitization, logging, and error handlers
│   ├── routes/                 # API endpoints
│   ├── services/               # Business logic and integrations
│   ├── types/                  # Type definitions
│   ├── utils/                  # Utility functions
│   └── validators/             # Schema validation
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration history
│   └── seeders/                # Seed scripts
├── scripts/                    # Utility scripts
├── uploads/                    # Uploaded files
├── .env.example                # Example backend environment file
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## Prerequisites

- Node.js 18+
- PostgreSQL running locally or in Docker
- Redis running locally or in Docker
- npm

## Install and Run

### 1) Install dependencies

```bash
cd backend
npm install
```

### 2) Configure environment

```bash
cp .env.example .env
```

Update `.env` with your local values, especially:

```env
PORT=3005
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ug_clinic
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:3001
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3) Generate Prisma client

```bash
npm run prisma:generate
```

### 4) Run database migrations

```bash
npm run prisma:migrate
```

### 5) Start backend

```bash
npm run dev
```

The backend runs at:

```text
http://localhost:3005
```

Health check:

```text
http://localhost:3005/health
```

## Available Scripts

```bash
npm run dev                # Start the API in dev mode
npm run build              # Compile TypeScript
npm run start              # Run compiled app
npm run test               # Run Jest tests
npm run test:watch         # Watch tests
npm run test:coverage      # Coverage report
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate      # Apply Prisma migrations
npm run prisma:studio       # Open Prisma Studio
npm run prisma:seed         # Run seed script
npm run lint               # Run ESLint
npm run lint:fix           # Fix lint issues
npm run create-staff       # Create staff account
npm run test:mail          # Test email transport connectivity
```

## API Base URL

```text
http://localhost:3005/api
```

## Main API Areas

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/profile`
- `POST /api/auth/check-account`

### Staff

- `POST /api/staff/register`
- `POST /api/staff/login`
- `POST /api/staff/verify-2fa`
- `POST /api/staff/resend-2fa`
- `GET /api/staff/dashboard`
- `GET /api/staff/doctors`
- `PATCH /api/staff/doctors/:id/status`
- `POST /api/staff/auto-assign`
- `POST /api/staff/auto-confirm`

### Appointments

- `GET /api/appointments`
- `GET /api/appointments/:id`
- `POST /api/appointments`
- `PATCH /api/appointments/:id`
- `DELETE /api/appointments/:id`

### Admin / Operations

- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `DELETE /api/admin/users/:id`

## Database Setup

This project uses PostgreSQL with Prisma. Make sure your `DATABASE_URL` points to a working database before starting the app.

```bash
npm run prisma:migrate
npm run prisma:seed
```

## Security Notes

- All server secrets should stay in `.env` and never be committed.
- CORS is restricted to configured frontend origins.
- Rate limiting and slow-down middleware are enabled.
- Session tables are stored in PostgreSQL.
- Input sanitization and suspicious request logging are applied globally.

## Local Development Notes

If you are running the full app locally, start PostgreSQL and Redis first, then launch the backend. The frontend depends on the backend API at `http://localhost:3005/api`.

## Docker

From the project root, you can run the full stack in containers with:

```bash
docker compose up --build
```

## License

This project is licensed under the ISC License.
