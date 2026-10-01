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
- 📅 **Interactive Appointment Booking Wizard (`/demo-booking`)**: Multi-step booking workflow with real-time service selection, dynamic doctor assignment, live date and time slot availability checks (weekdays 8:30 AM – 12:00 PM & 1:30 PM – 4:00 PM), patient reason/notes entry, and instant printable confirmation slips.
- 🔄 **Student Appointment Self-Service & Rescheduling**: Full reschedule and cancellation workflows directly from the student dashboard (`/dashboard`) with real-time appointment status updates and double-booking prevention.
- 🏥 **Staff Clinical & Administrative Portal (`/staff/*`)**: 
  - **Executive KPI Dashboard (`/staff/overview`)**: Real-time operational statistics on clinic visits, pending bookings, active doctors, daily trend analytics, automated batch actions (`auto-assign-doctors`, `auto-confirm-pending`), and doctor availability toggle (`AVAILABLE`, `BUSY`, `ON_LEAVE`).
  - **Queue Management (`/staff/appointments`)**: Dynamic queue sorting, status transitions (`CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`, `RESCHEDULED`), time slot capacity management, and automated or manual doctor assignment.
  - **Student Medical Registry (`/staff/students`)**: Searchable student directory with comprehensive visit histories and demographic profiles.
  - **Health Resource Management (`/staff/resources`)**: Health article and wellness document publisher with automated malware/XSS security scanning, status filtering (`APPROVED`, `PENDING_REVIEW`, `FLAGGED`, `REJECTED`), and review moderation workflows.
  - **Staff Security & Settings (`/staff/settings`)**: Profile settings and security management.
- 🔐 **Enhanced Authentication & 2-Factor Gate**: Multi-layer security featuring student ID validation, password recovery (Email/SMS OTP, security questions, emergency backup recovery codes), account lockout protection after consecutive failed attempts, and mandatory 2FA gateway for clinic staff (`/staff-portal-access`).
- ⏱️ **Automatic Session Timeout & Inactivity Guards**: Idle detection prompt (`Are you still there?`) active strictly for logged-in users on protected student (`/dashboard/*`) and staff (`/staff/*`) dashboard routes. Features 2-minute countdown warnings, activity listeners, immediate reset when navigating to public pages, and automated backend session cleanup jobs.
- 📱 **Mobile & Responsive Refinements**: Fully optimized responsive touch targets, mobile input scaling, and responsive modal dialogues across booking, dashboards, and authentication forms.
- 🎥 **Campus Ambient Motion Design**: Subtle background banners and atmospheric University of Ghana campus visual motifs across public pages.
- 📚 **Public Health Knowledge Base & Support**: Categorized health literature repository (`/resources`) with public document submission for review (`/resources/submit-public`), interactive contact directory (`/contact`), emergency hotline lookup, and compliance documentation (`/privacy`, `/terms`, `/accessibility`).

### 🗑️ Removed & Streamlined Features
- 🚫 **Redundant Service Link Icons**: Removed cluttered icon wrappers from the medical services page (`/services`) to deliver a cleaner, distraction-free typography and card presentation.
- 🚫 **Unused Submodule Dependencies**: Purged legacy external Git submodules to eliminate repo bloat and prevent deployment synchronization issues.
- 🚫 **Heavyweight Dynamic Imports**: Replaced redundant lazy-import wrappers in `DynamicImports.tsx` with standard tree-shakeable modular imports, reducing initial bundle overhead.
- 🚫 **Deprecated Token & Session Revocation Endpoints**: Replaced legacy JWT token-refresh and manual session revocation endpoints with unified server-side Postgres session management (`connect-pg-simple`), session cookies (`connect.sid`), and staff 2FA verification.
- 🚫 **Static Appointment Mockups**: Phased out static mock data across booking and overview pages in favor of live, reactive state and synchronized backend endpoints.

### 🚀 Recent Enhancements
- 📰 **News & Announcements System**: Added news management system (`/api/news`) with category-based organization, priority levels, and staff publishing capabilities (`GET`, `POST`, `PUT`, `DELETE`).
- 🔒 **Automated Security & Malware Scanning**: Implemented payload security scanning (`securityScanner.ts`) for resource uploads with malicious script (XSS), remote code execution (RCE), SQL injection, and dangerous file extension detection with automatic threat scoring and flagging.
- 🤖 **AI Operations Console (`StaffAiSidebar`)**: Introduced natural language and quick-action interface for clinic operations enabling automated doctor status updates, batch slot capacity management (`SYNC_DOCTORS`, `EXPAND`, `REDUCE`, `LOCK_MORNING`, `LOCK_AFTERNOON`), and instant queue automation.
- 📊 **Advanced Analytics & Operational Trends**: Enhanced staff dashboard with 7-day trend analysis, slot utilization indicators, and comprehensive clinic KPI metrics.
- 🎯 **Intelligent Service Resolution**: Implemented robust service ID resolution supporting UUIDs, frontend slug aliases (`general`, `mental`, `eye-care`, `dental`, `hiv`, `nutrition`, `screening`, `vaccination`, `prescription`), case-insensitive name matching, and automated fallback service creation to prevent booking disruptions.
- 🛡️ **PostgreSQL Persistent Session Architecture**: Backed by `connect-pg-simple` with automated daily scheduled cleanup (`node-cron` at 02:00 AM UTC/Ghana time) preventing session bloat and securing active logins.

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
| Prisma | Type-safe ORM and PostgreSQL client (`@prisma/adapter-pg`) |
| express-session | Session management middleware backed by PostgreSQL (`connect-pg-simple`) |
| Zod / express-validator | Request body, query parameter, and data validation |
| bcrypt | Salted password hashing (12 rounds) |
| Helmet | Secure HTTP header protection |
| express-rate-limit | IP-based request rate limiting |
| express-slow-down | Gradual delay on high request frequencies |
| ioredis | Redis client for caching and auxiliary storage |
| node-cron | Scheduled cron tasks (daily session cleanup at 02:00 AM) |
| multer | Multipart file and asset upload processing |
| sharp | High-performance image transformation |
| nodemailer | Transactional email delivery (SMTP) |
| twilio | SMS OTP gateway integration |
| winston | Structured application logging |
| morgan | HTTP request logging |

### Database & Infrastructure

| Technology | Purpose |
|---|---|
| PostgreSQL | Primary ACID-compliant relational database & persistent session store |
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

SESSION_SECRET=change-me-to-a-secret-with-at-least-32-characters
JWT_SECRET=change-me-to-a-secret-with-at-least-32-characters
JWT_EXPIRES_IN=15m
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
SESSION_SECRET=change-me-to-a-secret-with-at-least-32-characters
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
│   │   ├── schema.prisma           # Prisma database schema & relations
│   │   ├── migrations/             # SQL migration history
│   │   └── seeders/                # Seed scripts for default users & services
│   ├── scripts/
│   │   └── create-staff.ts         # CLI tool to provision staff members
│   ├── src/
│   │   ├── config/                 # Redis client and logger configs
│   │   ├── controllers/            # Handlers (Auth, Appointments, Staff, Resources, News, Admin)
│   │   ├── jobs/                   # Scheduled tasks (daily Postgres session cleanup)
│   │   ├── middleware/             # sessionAuth, rate limiting, error middleware
│   │   ├── routes/                 # Express API routes (auth, appointments, staff, resources, news, services, admin)
│   │   ├── services/               # Security scanner, email, SMS, OTP services
│   │   ├── utils/                  # Helper utilities (password, student validation, JWT)
│   │   └── validators/             # Request schema validators
│   ├── Dockerfile
│   ├── nodemon.json
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # Next.js Web Application (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/             # Login, Register, Forgot Password, Reset Password
│   │   │   ├── (public)/           # Home, About, Services, Resources, Contact, Privacy, Terms, Accessibility
│   │   │   ├── (dashboard)/        # Student Dashboard, Security Questions
│   │   │   ├── (staff)/            # Staff 2FA Gate & Portal (Overview, Appointments, Students, Resources, Settings)
│   │   │   ├── demo-booking/       # Booking & Rescheduling wizard flow
│   │   │   ├── todos/              # Health todo manager
│   │   │   ├── verify-otp/         # OTP verification page
│   │   │   └── api/                # Next.js API routes (proxies, auth callbacks)
│   │   ├── components/
│   │   │   ├── shared/             # Header, Footer, StaffNav, StaffAiSidebar, UGLogo, Spinners
│   │   │   ├── ui/                 # Accessible primitives (Button, Card, Input, Select, Dialog)
│   │   │   └── providers/          # SessionTimeoutProvider, Query, Theme providers
│   │   ├── hooks/                  # Inactivity timeout & custom lifecycle hooks
│   │   ├── lib/                    # API clients (appointmentApi, staffApi, authApi, utils)
│   │   ├── stores/                 # Zustand global client stores (authStore)
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
- `/` — Main Homepage (Hero banner, medical services overview, core values, health updates)
- `/about` — About the Clinic (Staff details, facilities, historical milestones)
- `/services` — Medical Services catalogue, consultation hours, step-by-step guides, FAQs
- `/resources` — Public Health Library, articles, downloads, and community submission form
- `/contact` — Contact directory, campus map, emergency phone numbers, and enquiry form
- `/accessibility` — Accessibility statement and standards compliance
- `/privacy` — Student health data privacy policy
- `/terms` — Terms of use and clinic appointment guidelines

### Authentication & Account Security
- `/login` — Student account login (Email / Student ID)
- `/register` — Student self-registration with 8-digit student ID validation
- `/forgot-password` — Password recovery trigger (Email or SMS OTP)
- `/reset-password` — Secure password reset form with token
- `/verify-otp` — One-time-pin verification screen
- `/security-questions` — Security questions setup and verification (`/dashboard/security-questions`)

### Student Dashboard & Appointment Booking
- `/dashboard` — Student Dashboard (Upcoming clinic visits, appointment history, quick actions, reschedule/cancel)
- `/demo-booking` — Interactive 4-step appointment booking wizard with printable confirmation slip
- `/todos` — Personal health & clinic reminders task checklist

### Staff Portal
- `/staff-portal-access` — Secure staff access point with mandatory 2-step verification (2FA via Email/SMS)
- `/staff/overview` — Executive KPI overview, live doctor availability toggle, and quick operational automation
- `/staff/appointments` — Clinic queue management, doctor assignments, and status updates
- `/staff/students` — Student medical records directory and historical appointments
- `/staff/resources` — Resource publisher, security review moderation, and medical bulletin editor
- `/staff/settings` — Staff profile settings and security management

---

## API Reference

All backend API routes are organized under the `/api` base route (with proxy support under `/api/backend/*`).

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/register` | Register new student account (8-digit ID check) | Public |
| `POST` | `/check-account` | Verify whether student account exists before login/recovery | Public |
| `POST` | `/login` | Authenticate student/staff user & initialize Postgres session | Public |
| `POST` | `/logout` | Destroy active session and clear session cookie | Public |
| `GET` | `/profile` | Get current logged-in user profile | Authenticated (Session) |
| `POST` | `/login-otp` | Authenticate using OTP | Public |
| `POST` | `/forgot-password` | Send password reset link or token (Email/SMS) | Public |
| `POST` | `/reset-password` | Reset password using verified token | Public |
| `POST` | `/send-otp` | Request 6-digit OTP generation | Public |
| `POST` | `/verify-otp` | Verify 6-digit OTP code | Public |
| `POST` | `/reset-password-otp` | Reset password directly using OTP | Public |
| `POST` | `/security-questions` | Set or update recovery questions | Authenticated (Session) |
| `POST` | `/verify-security-questions` | Verify answers for password recovery | Public |
| `POST` | `/generate-backup-codes` | Generate emergency 8-character recovery codes | Authenticated (Session) |
| `POST` | `/verify-backup-code` | Verify recovery code during login | Public |
| `POST` | `/change-password` | Change account password (requires current password) | Authenticated (Session) |

### 📅 Appointments (`/api/appointments`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | List appointments for authenticated user | Authenticated |
| `POST` | `/` | Create a new clinic appointment (weekday slot check & double-booking protection) | Authenticated |
| `GET` | `/availability` | Check available date & time slots for chosen service | Authenticated |
| `PATCH` | `/:id/cancel` | Cancel an upcoming appointment | Authenticated (Owner) |
| `GET` | `/staff/dashboard` | Get operational clinic statistics and daily trends | Staff (`RECEPTIONIST`, `DOCTOR`, `ADMIN`) |
| `GET` | `/staff/all` | Query all appointments across the clinic with search & filters | Staff |
| `PATCH` | `/:id/assign` | Assign a doctor to a booked appointment | Staff (`RECEPTIONIST`, `ADMIN`) |
| `PATCH` | `/:id/assign-doctor` | Alias for doctor assignment | Staff (`RECEPTIONIST`, `ADMIN`) |
| `PATCH` | `/:id/reschedule` | Move appointment to a new date/slot (staff or owner student) | Authenticated |
| `PATCH` | `/:id/status` | Update visit status (`CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`, `RESCHEDULED`) | Staff |
| `POST` | `/:id/staff-cancel` | Cancel an appointment with a clinic cancellation reason | Staff (`RECEPTIONIST`, `ADMIN`) |
| `GET` | `/timeslots` | Retrieve slot schedule configurations & auto-seed weekday slots | Staff (`RECEPTIONIST`, `ADMIN`) |
| `PATCH` | `/timeslots/batch` | Batch enable, lock, expand, or reduce time slots | Staff |
| `PATCH` | `/timeslot/:id` | Update individual time slot availability and booking capacity | Staff (`RECEPTIONIST`, `ADMIN`) |

### 👨‍⚕️ Staff Management (`/api/staff`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/register` | Register new staff member (`RECEPTIONIST`, `DOCTOR`, `ADMIN`) | Public / Admin |
| `POST` | `/login` | Staff initial login (triggers 2FA challenge via SMS/Email) | Public |
| `POST` | `/verify-2fa` | Verify staff 2FA code & establish session | Public |
| `POST` | `/resend-2fa` | Resend staff 2FA verification code | Public |
| `GET` | `/students` | Search and filter registered students with pagination | Staff (`RECEPTIONIST`, `ADMIN`) |
| `GET` | `/students/:id` | View specific student demographic profile | Staff (`RECEPTIONIST`, `ADMIN`) |
| `GET` | `/students/:id/history` | View student's historical clinic visits and consultations | Staff (`RECEPTIONIST`, `ADMIN`) |
| `PATCH` | `/students/:id` | Update student profile fields (with immutable name/ID protection) | Staff (`RECEPTIONIST`, `ADMIN`) |
| `GET` | `/doctors` | List doctors and their current active status and caseload | Staff |
| `PATCH` | `/doctors/status` | Update doctor availability status (`AVAILABLE`, `BUSY`, `ON_LEAVE`) | Staff |
| `PATCH` | `/doctors/batch-status` | Batch update multiple doctor availability statuses | Staff |
| `POST` | `/auto-assign-doctors` | Automated round-robin assignment of pending appointments to available doctors | Staff (`RECEPTIONIST`, `ADMIN`) |
| `POST` | `/auto-confirm-pending` | Batch auto-confirm all pending appointments | Staff (`RECEPTIONIST`, `ADMIN`) |

### 📖 Resources & Health Library (`/api/resources`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | List approved public health articles & downloads | Public |
| `POST` | `/submit-public` | Submit an article or resource document for clinic staff review | Public |
| `GET` | `/staff` | List all resources with status, category, and security filter | Staff |
| `POST` | `/` | Upload new health resource document (with automated security scan) | Staff |
| `PATCH` | `/:id` | Update metadata, category, or status of a resource | Staff |
| `PATCH` | `/:id/review` | Moderate resource submission (`APPROVE`, `REJECT`, `FLAG`) | Staff |
| `DELETE` | `/:id` | Remove a resource item | Staff |

### 📰 News & Announcements (`/api/news`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | List news announcements with category, priority, and pagination | Public |
| `POST` | `/` | Create new clinic news announcement | Staff |
| `PUT` | `/:id` | Update news post content and visibility | Staff |
| `DELETE` | `/:id` | Remove news announcement | Staff |

### 🏥 Medical Services (`/api/services`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | List active clinic services, durations, and categories | Public |

### ⚙️ System Administration (`/api/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/health` | Check overall database, system status, and timestamp | Admin |
| `POST` | `/cleanup-sessions` | Manually trigger purge of expired PostgreSQL sessions | Admin |

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
