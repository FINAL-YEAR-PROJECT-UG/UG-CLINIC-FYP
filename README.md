# UG-CLINIC-FYP

**A secure, scalable, and accessible web platform for the University of Ghana Student Clinic.**  
Students can book medical appointments, access health resources, and communicate with clinic staff — all from one place.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Quick Start (Local Development)](#quick-start-local-development)
5. [Environment Configuration](#environment-configuration)
6. [Project Structure](#project-structure)
7. [Application Routes](#application-routes)
8. [API Reference](#api-reference)
9. [User Roles & Access Control](#user-roles--access-control)
10. [Testing & QA](#testing--qa)
11. [Docker Deployment](#docker-deployment)
12. [Development Workflow](#development-workflow)
13. [Troubleshooting](#troubleshooting)
14. [License](#license)

---

## Project Overview

UG-CLINIC-FYP is a full-stack web application built for the University of Ghana Student Clinic. It streamlines the healthcare experience for students and clinic staff.

### ✨ Key Added Features
- 📅 **Interactive Appointment Booking Wizard (`/demo-booking`)**: Multi-step booking workflow with real-time service selection, dynamic doctor assignment, live date and time slot availability checks, patient reason/notes entry, and instant printable confirmation slips.
- 🔄 **Student Appointment Self-Service & Rescheduling**: Full reschedule and cancellation workflows directly from the student dashboard (`/dashboard`) with real-time appointment status updates.
- 🏥 **Staff Clinical & Administrative Portal (`/staff/*`)**: 
  - **Executive KPI Dashboard (`/staff/overview`)**: Real-time operational statistics on clinic visits, pending bookings, active doctors, and rapid doctor availability toggle (`AVAILABLE` / `BUSY`).
  - **Queue Management (`/staff/appointments`)**: Dynamic queue sorting, status transitions (`CONFIRMED`, `COMPLETED`, `CANCELLED`), and automated or manual doctor assignment.
  - **Student Medical Registry (`/staff/students`)**: Searchable student directory with comprehensive visit histories.
  - **Health Resource Management (`/staff/resources`)**: Health article and wellness document publisher.
- 🔐 **Enhanced Authentication & 2-Factor Gate**: Multi-layer security featuring student ID validation, password recovery (Email/SMS OTP, security questions, emergency backup recovery codes), and mandatory 2FA gateway for clinic staff (`/staff-portal-access`).
- ⏱️ **Automatic Session Timeout & Inactivity Guards**: Proactive idle detection warnings (`InactivityWarning`) and session cleanup protecting student medical data on shared campus computers.
- 📱 **Mobile & Responsive Refinements**: Fully optimized responsive touch targets, mobile input scaling, and responsive modal dialogues across booking, dashboards, and authentication forms.
- 🎥 **Campus Ambient Motion Design**: Subtle, low-opacity background video banners and atmospheric University of Ghana campus visual motifs across public pages.
- 📚 **Public Health Knowledge Base & Support**: Categorized health literature repository (`/resources`), interactive contact directory (`/contact`), emergency hotline lookup, and compliance documentation (`/privacy`, `/terms`, `/accessibility`).

### 🗑️ Removed & Streamlined Features
- 🚫 **Redundant Service Link Icons**: Removed cluttered icon wrappers from the medical services page (`/services`) to deliver a cleaner, distraction-free typography and card presentation.
- 🚫 **Unused Submodule Dependencies**: Purged legacy external Git submodules to eliminate repo bloat and prevent deployment synchronization issues.
- 🚫 **Heavyweight Dynamic Imports**: Replaced redundant lazy-import wrappers in `DynamicImports.tsx` with standard tree-shakeable modular imports, reducing initial bundle overhead.
- 🚫 **Deprecated Staff & Session API Endpoints**: Trimmed obsolete session revocation and redundant placeholder requests from Postman collections and routing in favor of unified JWT refresh rotation and 2FA verification.
- 🚫 **Static Appointment Mockups**: Phased out static mock data across booking and overview pages in favor of live, reactive state and synchronized backend endpoints.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| Next.js | React framework with App Router (Turbopack) |
| React | Core UI component library |
| TypeScript | Strict type safety and autocompletion |
| Tailwind CSS | Utility-first styling with PostCSS integration |
| Zustand | Client state management (auth store, sidebar state) |
| TanStack Query | Asynchronous server state caching and synchronisation |
| React Hook Form | Form state management and submission lifecycle |
| Zod | Type-safe form validation and runtime schema assertion |
| Framer Motion | Micro-animations and page transitions |
| Radix UI | Accessible, unstyled UI primitives (Dialogs, Select, Tabs, etc.) |
| Lucide React | Clean, accessible iconography |
| Axios | HTTP request client with interceptor support |
| date-fns | Date manipulation, slot calculations, and formatting |
| Sonner | Modern toast alert system |
| next-themes | Light / dark theme support |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript / TypeScript runtime |
| Express.js | HTTP web framework and REST API routing |
| TypeScript | Static typing and interfaces |
| Prisma | Type-safe ORM and PostgreSQL client |
| Zod | Request body and query parameter validation |
| jsonwebtoken | Signed JWT access and refresh tokens |
| bcrypt | Salted password hashing (12 rounds) |
| Helmet | Secure HTTP header protection |
| express-rate-limit | IP-based request rate limiting |
| express-slow-down | Gradual delay on high request frequencies |
| ioredis | Redis client for caching and session invalidation |
| Bull | Asynchronous job queue processing |
| node-cron | Scheduled cron tasks (reminder dispatches, session cleanups) |
| multer | Multipart file and asset upload processing |
| sharp | High-performance image transformation |
| nodemailer | Transactional email delivery (SMTP) |
| twilio | SMS OTP gateway integration |
| winston | Structured application logging |
| morgan | HTTP request logging |

### Database & Infrastructure

| Technology | Purpose |
|---|---|
| PostgreSQL | Primary ACID-compliant relational database |
| Redis | High-throughput in-memory cache and queue storage |
| Docker | Multi-service container packaging |
| Docker Compose | Local and staging orchestration |

---

## Prerequisites

Ensure you have the following installed on your development machine:

- **Node.js**: Active LTS recommended (`node --version`)
- **npm** (`npm --version`)
- **PostgreSQL** (`psql --version`)
- **Redis** (`redis-cli --version`)
- **Git** (`git --version`)
- **Docker & Docker Compose**: *(Optional, for containerized run)* (`docker compose version`)

---

## Quick Start (Local Development)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/UG-CLINIC-FYP.git
cd UG-CLINIC-FYP
```

### 2. Configure Environment Files

```bash
# Root-level configuration (Docker Compose orchestration)
cp .env.example .env

# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration
cp frontend/.env.local.example frontend/.env.local  # or create manually
```

### 3. Install Dependencies

```bash
# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
```

### 4. Database Setup & Seeding

```bash
cd backend

# Run Prisma migrations
npx prisma migrate dev

# Generate the Prisma Client
npx prisma generate

# Seed sample database (Admin, Doctors, Default Services, Slots)
npm run prisma:seed
```

### 5. Launch Development Servers

Start services in separate terminal windows:

```bash
# Terminal 1 — Redis
redis-server

# Terminal 2 — Backend API (http://localhost:3000)
cd backend
npm run dev

# Terminal 3 — Frontend UI (http://localhost:3001)
cd frontend
npm run dev
```

Visit **http://localhost:3001** to interact with the platform.  
Health check endpoint: **http://localhost:3000/health**.

---

## Environment Configuration

### Root `.env` (Docker Compose / System)

```env
POSTGRES_DB=ug_clinic
POSTGRES_USER=ugclinic_user
DB_PASSWORD=your_secure_password
POSTGRES_PORT=5432

REDIS_PORT=6379

API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001
BACKEND_PORT=3000
FRONTEND_PORT=3001

NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=UG-CLINIC-FYP
NEXT_PUBLIC_APP_URL=http://localhost:3001

JWT_SECRET=change-me-to-a-secret-with-at-least-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

LOG_LEVEL=info
MAX_FILE_SIZE=10485760
MAX_VIDEO_SIZE=104857600

# Optional services:
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_pass
FROM_EMAIL=noreply@ugclinic-fyp.edu.gh
FROM_NAME=UG Student Clinic

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Backend `.env`

```env
DATABASE_URL=postgresql://ugclinic_user:your_secure_password@localhost:5432/ug_clinic
REDIS_URL=redis://localhost:6379
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=UG-CLINIC-FYP
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

---

## Project Structure

```
UG-CLINIC-FYP/
├── backend/                        # Express.js REST API
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma Database schema & relationships
│   │   ├── migrations/             # SQL migration history
│   │   └── seeders/                # Seed script for default users & services
│   ├── scripts/
│   │   └── create-staff.ts         # CLI tool to provision staff members
│   ├── src/
│   │   ├── config/                 # Database, Redis, Logger configs
│   │   ├── controllers/            # Request handlers (Auth, Appointments, Staff, etc.)
│   │   ├── middleware/             # Auth guards, Rate limiters, Error middleware
│   │   ├── routes/                 # Express route definitions
│   │   ├── services/               # Core business logic
│   │   ├── utils/                  # Helper utilities (JWT, Crypto, Responses)
│   │   └── validators/             # Zod schema validators
│   ├── Dockerfile
│   ├── nodemon.json
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # Next.js Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/             # Login, Register, Forgot Password, Reset Password
│   │   │   ├── (public)/           # Home, About, Services, Resources, Contact, Legal
│   │   │   ├── (dashboard)/        # Student Dashboard, Security Question flows
│   │   │   ├── (staff)/            # Staff 2FA Gate & Portal (Overview, Appointments, Students, Settings)
│   │   │   ├── demo-booking/       # Booking & Rescheduling wizard flow
│   │   │   └── verify-otp/         # OTP verification page
│   │   ├── components/
│   │   │   ├── shared/             # Header, Footer, StaffNav, StaffAiSidebar, UGLogo, Spinners
│   │   │   ├── ui/                 # Accessible primitives
│   │   │   └── providers/          # Query, Theme & Auth context providers
│   │   ├── hooks/                  # Inactivity timeout & custom lifecycle hooks
│   │   ├── lib/                    # API clients (appointmentApi, staffApi, utils)
│   │   ├── stores/                 # Zustand global client stores
│   │   └── types/                  # TypeScript interface definitions
│   ├── public/                     # Static media & hero video
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── postman/                        # Postman API Collections & Environment definitions
├── docker-compose.yml              # Multi-container orchestration
├── QA_CHECKLIST.md                 # Pre-release QA checklist & test plan
├── CHANGELOG.md                    # Project release notes & changelog
├── QUICKSTART.md                   # 5-minute setup cheatsheet
├── SETUP.md                        # In-depth architectural setup guide
└── README.md                       # Main project documentation
```

---

## Application Routes

### Public Pages
- `/` — Main Homepage (Interactive Hero Video, Services Grid, Mission, Testimonials)
- `/about` — About the Clinic (Staff details, facilities, historical milestones)
- `/services` — Medical Services catalogue & outpatient consultation hours
- `/resources` — Public Health Library, articles, and downloadable resources
- `/contact` — Contact directory, campus map, emergency phone numbers, and enquiry form
- `/accessibility` — Accessibility statement and standards compliance
- `/privacy` — Student health data privacy policy
- `/terms` — Terms of use and clinic appointment guidelines

### Authentication & Account Security
- `/login` — Student account login
- `/register` — Student self-registration
- `/forgot-password` — Password recovery trigger
- `/reset-password` — Secure password reset form with token
- `/verify-otp` — One-time-pin verification screen
- `/security-questions` — Security questions configuration and verification

### Student Dashboard & Appointment Booking
- `/dashboard` — Student Dashboard (Upcoming clinic visits, appointment history, quick actions)
- `/demo-booking` — Interactive 4-step appointment booking wizard with printable confirmation

### Staff Portal
- `/staff-portal-access` — Secure staff access point with mandatory 2-step verification (2FA)
- `/staff/overview` — Executive KPI overview & live doctor availability toggle
- `/staff/appointments` — Clinic queue management, doctor assignments, and status updates
- `/staff/students` — Student medical records directory and historical appointments
- `/staff/resources` — Resource publisher and medical bulletin editor
- `/staff/settings` — Staff profile settings and security management

---

## API Reference

All backend API routes are organized under the `/api/v1` base route.

### 🔑 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/register` | Register new student account | Public |
| `POST` | `/login` | Authenticate user & issue tokens | Public |
| `POST` | `/logout` | Invalidate active refresh token | Public |
| `POST` | `/refresh` | Exchange refresh token for new access token | Public |
| `GET` | `/profile` | Get current user's profile | Authenticated |
| `POST` | `/forgot-password` | Send password reset email/SMS | Public |
| `POST` | `/reset-password` | Reset password using verified token | Public |
| `POST` | `/send-otp` | Request OTP code generation | Public |
| `POST` | `/verify-otp` | Verify 6-digit OTP code | Public |
| `POST` | `/security-questions` | Set or update recovery questions | Authenticated |
| `POST` | `/verify-security-questions` | Verify answers for password recovery | Public |
| `POST` | `/generate-backup-codes` | Generate emergency recovery codes | Authenticated |
| `POST` | `/verify-backup-code` | Verify recovery code during login | Public |

### 📅 Appointments (`/api/v1/appointments`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | List appointments for authenticated user | Authenticated |
| `POST` | `/` | Create a new clinic appointment | Authenticated |
| `GET` | `/availability` | Check available date & time slots | Authenticated |
| `PATCH` | `/:id/cancel` | Cancel an upcoming appointment | Authenticated (Owner) |
| `GET` | `/staff/dashboard` | Get operational clinic statistics | Staff (Receptionist/Admin) |
| `GET` | `/staff/all` | Query all appointments across the clinic | Staff |
| `PATCH` | `/:id/assign` | Assign a doctor to a booked appointment | Staff (Receptionist/Admin) |
| `PATCH` | `/:id/reschedule` | Move appointment to a new date/slot | Staff (Receptionist/Admin) |
| `PATCH` | `/:id/status` | Update visit status (`COMPLETED`, `NO_SHOW`, etc.) | Staff |
| `POST` | `/:id/staff-cancel` | Cancel an appointment with a clinic reason | Staff (Receptionist/Admin) |
| `GET` | `/timeslots` | Retrieve slot schedule configurations | Staff (Receptionist/Admin) |
| `PATCH` | `/timeslots/batch` | Batch enable/disable time slots | Staff |

### 👨‍⚕️ Staff Management (`/api/v1/staff`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/login` | Staff initial login (triggers 2FA challenge) | Public |
| `POST` | `/verify-2fa` | Verify staff 2FA code & complete login | Public |
| `GET` | `/students` | Search and filter registered students | Staff (Receptionist/Admin) |
| `GET` | `/students/:id` | View specific student demographic profile | Staff (Receptionist/Admin) |
| `GET` | `/students/:id/history` | View student's historical clinic visits | Staff (Receptionist/Admin) |
| `GET` | `/doctors` | List doctors and their current active status | Staff |
| `PATCH` | `/doctors/status` | Update own/specified doctor availability | Staff |
| `POST` | `/auto-assign-doctors` | Trigger auto-assignment of pending visits | Staff (Receptionist/Admin) |
| `POST` | `/auto-confirm-pending` | Auto-confirm eligible appointments | Staff (Receptionist/Admin) |

### 📖 Resources (`/api/v1/resources`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | List published health articles & downloads | Public |
| `POST` | `/` | Upload new health resource document | Staff |
| `PATCH` | `/:id` | Update metadata or category of a resource | Staff |
| `DELETE` | `/:id` | Remove a resource item | Staff |

---

## User Roles & Access Control

| Role | Target Users | Permissions |
|---|---|---|
| `STUDENT` | UG Students | View public pages, book/reschedule visits, download health guides, manage security settings. |
| `RECEPTIONIST` | Clinic Front Desk | Manage clinic queue, assign doctors, reschedule/cancel student appointments, manage time slots, register walk-ins. |
| `DOCTOR` | Medical Officers | Toggle live availability (`AVAILABLE`/`BUSY`), view assigned consultations, update consultation status. |
| `ADMIN` | IT & Clinic Directors | Complete operational control, staff user creation, system health monitoring, audit logs. |

---

## Testing & QA

For the complete testing matrix, test cases, and release criteria, consult [`QA_CHECKLIST.md`](./QA_CHECKLIST.md).

### Frontend Type Safety & Build Verification
```bash
cd frontend

# Verify full static TypeScript safety
npm run type-check

# Production build bundle check
npm run build
```

### Backend Unit & Integration Tests
```bash
cd backend

# Run Jest test suite
npm run test

# Run tests with test coverage analysis
npm run test:coverage
```

### API Smoke Testing (Postman)
1. Open Postman and import collections from `/postman/collections/`.
2. Import the environment from `/postman/environments/`.
3. Set your active environment URL to `http://localhost:3000`.
4. Run the automated collection runner against the auth and appointment test suites.

---

## Docker Deployment

To launch the full containerized environment (PostgreSQL, Redis, Backend, and Frontend):

```bash
# Build and run containers in detached mode
docker compose up -d --build

# Inspect running containers
docker compose ps

# Follow application logs
docker compose logs -f backend
docker compose logs -f frontend

# Gracefully tear down containers and networks
docker compose down
```

---

## Troubleshooting

### 1. `Cannot find module '@prisma/client'`
**Fix:** Run `npx prisma generate` in the `backend` folder.

### 2. `Database connection refused`
**Fix:** Verify PostgreSQL service is running and `DATABASE_URL` in `backend/.env` matches your credentials.

### 3. `Redis connection failed`
**Fix:** Start Redis server (`redis-server` or `docker compose up -d redis`) and ensure port `6379` is reachable.

### 4. Port Conflict (`3000` or `3001` already in use)
**Fix:** On Windows:
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 5. CORS Errors in Browser
**Fix:** Ensure `FRONTEND_URL` and `CORS_ORIGIN` in `backend/.env` match the frontend port (`http://localhost:3001`).

---

## License

This project is licensed under the **MIT License** — see the [`LICENSE`](./LICENSE) file for details.

---

*University of Ghana Student Clinic — Final Year Project (FYP)*
