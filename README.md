# UG-CLINIC-FYP

UG-CLINIC-FYP: A secure, scalable, and accessible web platform for the University of Ghana Student Clinic, enabling students to book medical appointments, access health resources, and communicate with clinic staff.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Project Setup](#project-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Database Setup](#database-setup)
7. [Environment Configuration](#environment-configuration)
8. [Running the Application](#running-the-application)
9. [Development Workflow](#development-workflow)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Project Structure](#project-structure)
13. [Contributing](#contributing)
14. [Troubleshooting](#troubleshooting)

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework with SSR/SSG/App Router |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first CSS framework |
| shadcn/ui | Latest | Accessible UI component library |
| React Hook Form | 7.x | Form handling and validation |
| Zod | 3.x | Schema validation |
| TanStack Query | 5.x | Server state management |
| Zustand | 4.x | Client state management |
| Framer Motion | 10.x | Animations and transitions |
| Axios | 1.x | HTTP client |
| date-fns | 2.x | Date manipulation |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | JavaScript runtime |
| Express.js | 4.x | Web framework |
| TypeScript | 5.x | Type safety |
| Prisma | 5.x | ORM and database toolkit |
| Zod | 3.x | Runtime validation |
| JWT (jsonwebtoken) | 9.x | Authentication tokens |
| bcrypt | 5.x | Password hashing |
| Helmet | 7.x | Security headers |
| express-rate-limit | 7.x | Rate limiting |
| cors | 2.x | Cross-origin resource sharing |
| Bull | 4.x | Queue processing (Redis-backed) |
| node-cron | 3.x | Scheduled tasks |
| multer | 1.x | File upload handling |
| sharp | 0.x | Image processing |
| nodemailer | 6.x | Email sending |
| twilio | 4.x | SMS gateway |
| express-validator | 7.x | Input validation |
| compression | 1.x | Response compression |
| Winston | 3.x | Application logging |
| morgan | 1.x | HTTP request logging |

### Database and Infrastructure
| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 16.x | Primary relational database |
| Redis | 7.x | Cache, session store, job queue |
| AWS S3 / MinIO | Latest | File storage for resources |
| CloudFront / Cloudflare | Latest | CDN for static assets |
| Docker | 24.x | Containerization |
| Docker Compose | 2.x | Multi-container orchestration |

### External Services
| Service | Purpose |
|---------|---------|
| SendGrid / AWS SES | Transactional email |
| Twilio / Arkesel | SMS notifications |
| Cloudflare | DDoS protection and WAF |

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:

1. **Node.js** (version 20.x LTS or higher)
   - Download from: https://nodejs.org/en/download/
   - Verify: run `node --version` in your terminal

2. **npm** (version 10.x or higher, comes with Node.js)
   - Verify: run `npm --version` in your terminal

3. **PostgreSQL** (version 16.x)
   - Download from: https://www.postgresql.org/download/
   - Verify: run `psql --version` in your terminal

4. **Redis** (version 7.x)
   - Download from: https://redis.io/download/
   - Verify: run `redis-cli --version` in your terminal

5. **Git**
   - Download from: https://git-scm.com/downloads
   - Verify: run `git --version` in your terminal

6. **Docker** (optional, for containerized deployment)
   - Download from: https://docs.docker.com/get-docker/
   - Verify: run `docker --version` and `docker-compose --version` in your terminal

7. **A code editor** (VS Code recommended)
   - Download from: https://code.visualstudio.com/

---

## Project Setup

### Step 1: Create Project Directory

Open your terminal and create the root project folder.

### Step 2: Initialize Git Repository

Run `git init` in the project root. Create a `.gitignore` file to exclude node_modules, environment files, build outputs, logs, IDE files, OS files, database files, uploads, and Prisma migrations.

### Step 3: Create Project Structure

Create three main directories: `backend`, `frontend`, and `docker`.

Your project structure should now look like this:

```
UG-CLINIC-FYP/
├── backend/
├── frontend/
├── docker/
├── .gitignore
└── .git/
```

---

## Backend Setup

### Step 1: Initialize Backend Project

Navigate to the backend directory and run `npm init -y` to create a package.json file.

### Step 2: Install Backend Dependencies

Install production dependencies: express, cors, helmet, compression, morgan, winston, bcrypt, jsonwebtoken, express-rate-limit, express-slow-down, express-validator, multer, sharp, nodemailer, twilio, bull, node-cron, and dotenv.

Install development dependencies: typescript, ts-node, nodemon, @types/express, @types/cors, @types/bcrypt, @types/jsonwebtoken, @types/multer, @types/node, @types/morgan, prisma, and tsconfig-paths.

### Step 3: Initialize TypeScript

Run `npx tsc --init` to generate a tsconfig.json file. Replace the generated file with a production-ready configuration that includes:
- Target ES2022 with CommonJS modules
- Strict type checking enabled
- Path aliases for clean imports (e.g., @/*, @config/*, @controllers/*, @middleware/*, @models/*, @routes/*, @services/*, @utils/*, @validators/*)
- Source maps and declarations enabled
- Root directory set to ./src and output directory set to ./dist

### Step 4: Initialize Prisma

Run `npx prisma init` to create a prisma directory with schema.prisma and a .env file.

### Step 5: Create Backend Directory Structure

Create the following directories:
- src/config, src/controllers, src/middleware, src/models, src/routes, src/services, src/utils, src/validators, src/types
- prisma/seeders
- tests/unit, tests/integration, tests/e2e
- uploads/documents, uploads/images, uploads/videos, uploads/temp

### Step 6: Create Core Backend Files

Create the following essential files:
- `nodemon.json`: Configuration for auto-reloading during development
- `.env.example`: Template for all environment variables
- `src/app.ts`: Main Express application entry point with security middleware (Helmet, CORS, rate limiting, compression), body parsing, logging, health check endpoint, API route mounting, and error handling
- `src/middleware/errorHandler.ts`: Centralized error handling middleware with standardized JSON error responses
- `src/middleware/notFound.ts`: 404 handler for undefined routes
- Route files in src/routes/: auth.routes.ts, appointment.routes.ts, service.routes.ts, resource.routes.ts, admin.routes.ts, notification.routes.ts

### Step 7: Add Scripts to package.json

Add the following scripts to backend/package.json:
- dev: Start development server with nodemon
- build: Compile TypeScript to JavaScript
- start: Run compiled application in production
- test: Run Jest tests
- test:watch: Run Jest in watch mode
- test:coverage: Run Jest with coverage report
- prisma:generate: Generate Prisma client
- prisma:migrate: Run database migrations
- prisma:studio: Open Prisma Studio GUI
- prisma:seed: Run database seeder
- lint: Run ESLint
- lint:fix: Run ESLint with auto-fix

---

## Frontend Setup

### Step 1: Initialize Next.js Project

From the root project directory, run the Next.js create command with the following options:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- src directory: Yes
- App Router: Yes
- Default import alias: No (use @/*)

### Step 2: Install Frontend Dependencies

Install shadcn/ui components using the CLI init command. Select Default style, Slate base color, and CSS variables for theming.

Install the following shadcn components: button, card, input, label, badge, avatar, dialog, dropdown-menu, sheet, toast, tabs, table, select, textarea, calendar, popover, separator, skeleton, scroll-area.

Install additional libraries: react-hook-form, @hookform/resolvers, zod, axios, tanstack-query, @tanstack/react-query, zustand, framer-motion, date-fns, react-aria, react-stately, clsx, tailwind-merge, class-variance-authority, lucide-react.

Install development dependencies: @types/node, @types/react, @types/react-dom, prettier, eslint-config-prettier.

### Step 3: Configure Tailwind CSS

Update tailwind.config.ts to include shadcn/ui theme variables (colors for border, input, ring, background, foreground, primary, secondary, destructive, muted, accent, popover, card), border radius settings, and accordion animations.

### Step 4: Create Frontend Directory Structure

Create the following directories:
- src/app/(auth)/ with login, register, forgot-password, and reset-password subdirectories
- src/app/(public)/ with about, services, and contact subdirectories
- src/app/(dashboard)/ with student and admin subdirectories
- src/components/ui, src/components/forms, src/components/layout, src/components/shared
- src/hooks/api, src/hooks/ui
- src/stores, src/types, src/lib, src/utils
- public/images, public/icons, public/fonts

### Step 5: Create Core Frontend Files

Create the following essential files:
- `src/lib/utils.ts`: Utility function for merging Tailwind classes using clsx and tailwind-merge
- `src/lib/api.ts`: Axios instance configuration with base URL, request interceptor for JWT tokens, and response interceptor for automatic token refresh on 401 errors
- `src/types/index.ts`: TypeScript interfaces for User, Appointment, Service, Resource, ApiResponse, and PaginatedResponse

### Step 6: Update Frontend package.json Scripts

Add the following scripts to frontend/package.json:
- dev: Start Next.js development server
- build: Build production application
- start: Start production server
- lint: Run Next.js ESLint
- lint:fix: Run ESLint with auto-fix
- format: Format code with Prettier
- format:check: Check code formatting with Prettier

---

## Database Setup

### Step 1: Create PostgreSQL Database

Open PostgreSQL command line and create a new database named ug_clinic. Create a dedicated user with a secure password and grant all privileges on the database to that user.

### Step 2: Configure Prisma Schema

Open backend/prisma/schema.prisma and define the following models:

**User Model**: id (UUID, primary key), studentId (optional, unique), email (unique), passwordHash, firstName, lastName, phone (optional), role (enum: STUDENT, RECEPTIONIST, DOCTOR, ADMIN), isActive, emailVerified, phoneVerified, createdAt, updatedAt, lastLoginAt. Relations: appointments, resources, notifications, auditLogs.

**Appointment Model**: id (UUID, primary key), userId, doctorId (optional), serviceId, date, timeSlot, status (enum: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED), notes (optional), reason, cancelledBy (optional), cancelledAt (optional), createdAt, updatedAt. Unique constraint on userId and date. Indexes on userId+date, status, and date+timeSlot.

**Service Model**: id (UUID, primary key), name, description, duration (in minutes), category, isActive, createdAt. Relations: appointments, timeSlots.

**TimeSlot Model**: id (UUID, primary key), serviceId, date, startTime, endTime, isAvailable, maxBookings, currentBookings, createdAt. Unique constraint on serviceId, date, and startTime. Index on date and isAvailable.

**Resource Model**: id (UUID, primary key), title, description (optional), fileUrl, fileType, fileSize, category, tags (array), isPublic, uploadedBy, downloadCount, createdAt, updatedAt. Indexes on category and isPublic.

**Notification Model**: id (UUID, primary key), userId, type (enum: APPOINTMENT_CONFIRMED, APPOINTMENT_REMINDER, APPOINTMENT_CANCELLED, APPOINTMENT_RESCHEDULED, RESOURCE_UPLOADED, SYSTEM_ANNOUNCEMENT, PASSWORD_RESET), title, message, isRead, sentVia (enum: EMAIL, SMS, IN_APP), createdAt. Index on userId and isRead.

**AuditLog Model**: id (UUID, primary key), userId (optional), action, entity, entityId (optional), oldValue (JSON, optional), newValue (JSON, optional), ipAddress (optional), userAgent (optional), createdAt. Indexes on userId, action, and createdAt.

### Step 3: Run Prisma Migrations

Run `npx prisma migrate dev --name init` in the backend directory to create the database tables.

### Step 4: Generate Prisma Client

Run `npx prisma generate` to generate the TypeScript client for database operations.

### Step 5: Create Database Seeder

Create a seeder file at backend/prisma/seeders/seed.ts that:
- Clears existing data in the correct order (audit logs, notifications, appointments, time slots, resources, services, users)
- Creates a default admin user with email admin@ugclinic-fyp.edu.gh
- Creates a default doctor user with email doctor@ugclinic-fyp.edu.gh
- Creates a default receptionist user with email receptionist@ugclinic-fyp.edu.gh
- Creates a default student user with student ID 20240001 and email student@st.ug.edu.gh
- Creates sample services: General Consultation (30 min), Dental Checkup (45 min), Eye Examination (30 min)
- Creates time slots for tomorrow across all services
- All passwords should be hashed with bcrypt using 12 rounds

### Step 6: Run the Seeder

Execute the seeder using ts-node to populate the database with initial data.

---

## Environment Configuration

### Step 1: Backend Environment File

Create a `.env` file in the backend directory. Copy from `.env.example` and update with your actual values. The file must include:

**Application**: NODE_ENV, PORT, API_URL, FRONTEND_URL

**Database**: DATABASE_URL with your PostgreSQL credentials

**Redis**: REDIS_URL pointing to your Redis instance

**JWT**: JWT_SECRET (minimum 32 characters), JWT_EXPIRES_IN (15 minutes), JWT_REFRESH_EXPIRES_IN (7 days)

**Security**: BCRYPT_ROUNDS (12), RATE_LIMIT_WINDOW_MS (15 minutes in milliseconds), RATE_LIMIT_MAX_REQUESTS (100), AUTH_RATE_LIMIT_MAX (5)

**Email**: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL, FROM_NAME

**SMS**: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

**File Upload**: MAX_FILE_SIZE (10MB in bytes), MAX_VIDEO_SIZE (100MB in bytes), UPLOAD_PATH

**Logging**: LOG_LEVEL (debug for development)

### Step 2: Frontend Environment File

Create a `.env.local` file in the frontend directory with:
- NEXT_PUBLIC_API_URL pointing to your backend API
- NEXT_PUBLIC_APP_NAME set to UG-CLINIC-FYP
- NEXT_PUBLIC_APP_URL pointing to your frontend URL

---

## Running the Application

### Step 1: Start Redis

Open a new terminal and start the Redis server using the `redis-server` command.

### Step 2: Start Backend Server

Navigate to the backend directory and run `npm run dev`. The backend server will start on port 3000. Verify it is running by visiting the health endpoint at http://localhost:3000/health. You should receive a JSON response with status "ok" and a timestamp.

### Step 3: Start Frontend Development Server

Navigate to the frontend directory and run `npm run dev`. The frontend will start on port 3001. Open your browser and visit http://localhost:3001.

---

## Development Workflow

### Daily Development Steps

1. Start Redis if it is not running as a system service
2. Start the backend server in one terminal
3. Start the frontend development server in another terminal
4. Access Prisma Studio for database management by running `npx prisma studio` in the backend directory and opening http://localhost:5555 in your browser

### Git Workflow

1. Create a feature branch from the main branch using the naming convention `feature/your-feature-name`
2. Make your changes and commit using conventional commit messages
3. Push the feature branch to the remote repository
4. Open a Pull Request for code review

### Commit Message Convention

Use the following prefixes for commit messages:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes (formatting only)
- refactor: Code refactoring without changing functionality
- test: Adding or updating tests
- chore: Build process or auxiliary tool changes

---

## Testing

### Backend Testing

Install Jest, ts-jest, supertest, and their type definitions. Create a jest.config.js file with TypeScript preset, path aliases matching tsconfig, and coverage collection settings. Run tests using `npm run test`, `npm run test:watch`, or `npm run test:coverage`.

### Frontend Testing

Next.js includes Jest configuration by default. Run tests using `npm run test` in the frontend directory.

### End-to-End Testing

Install Playwright and its browser binaries. Create E2E tests in the frontend/e2e directory. Run tests using `npx playwright test`.

---

## Deployment

### Docker Deployment

Create a `docker-compose.yml` file in the root directory with the following services:

**postgres**: PostgreSQL 16 Alpine with persistent volume, port 5432, health checks, and environment variables for database name, user, and password.

**redis**: Redis 7 Alpine with persistent volume, port 6379, and health checks.

**backend**: Node.js 20 Alpine build with environment variables for NODE_ENV, DATABASE_URL, REDIS_URL, and JWT_SECRET. Exposes port 3000. Depends on postgres and redis being healthy.

**frontend**: Node.js 20 Alpine build with NEXT_PUBLIC_API_URL environment variable. Exposes port 3001. Depends on backend.

Create a `Dockerfile` in the backend directory using Node.js 20 Alpine, installing production dependencies only, copying source code, building the TypeScript project, exposing port 3000, and running the compiled app.js.

Create a `Dockerfile` in the frontend directory using Node.js 20 Alpine, installing all dependencies, copying source code, building the Next.js project, exposing port 3000, and running the production start command.

Deploy by running `docker-compose up -d` in the root directory.

### Production Environment Variables

Create a `.env.production` file for production deployment containing secure values for DB_PASSWORD, JWT_SECRET, SENDGRID_API_KEY, TWILIO_ACCOUNT_SID, and TWILIO_AUTH_TOKEN. Never commit this file to version control.

---

## Project Structure

### Complete Project Structure

```
UG-CLINIC-FYP/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seeders/
│   │       └── seed.ts
│   ├── src/
│   │   ├── app.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── logger.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── appointment.controller.ts
│   │   │   ├── service.controller.ts
│   │   │   ├── resource.controller.ts
│   │   │   ├── admin.controller.ts
│   │   │   └── notification.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── notFound.ts
│   │   │   ├── rateLimiter.ts
│   │   │   ├── upload.ts
│   │   │   └── validate.ts
│   │   ├── models/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── appointment.routes.ts
│   │   │   ├── service.routes.ts
│   │   │   ├── resource.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   └── notification.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── appointment.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── sms.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── upload.service.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   ├── password.ts
│   │   │   ├── response.ts
│   │   │   └── validators.ts
│   │   ├── validators/
│   │   │   ├── auth.validator.ts
│   │   │   ├── appointment.validator.ts
│   │   │   └── resource.validator.ts
│   │   └── types/
│   │       └── index.ts
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── uploads/
│   │   ├── documents/
│   │   ├── images/
│   │   ├── videos/
│   │   └── temp/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── nodemon.json
│   ├── package.json
│   ├── tsconfig.json
│   └── tsconfig-paths-bootstrap.js
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── forgot-password/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── reset-password/
│   │   │   │       └── page.tsx
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── about/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── services/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── contact/
│   │   │   │       └── page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── student/
│   │   │   │   │   ├── appointments/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── resources/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── profile/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── admin/
│   │   │   │   │   ├── appointments/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── users/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── resources/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── reports/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── forms/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   ├── AppointmentForm.tsx
│   │   │   │   └── ContactForm.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── LayoutWrapper.tsx
│   │   │   └── shared/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       ├── Pagination.tsx
│   │   │       └── DataTable.tsx
│   │   ├── hooks/
│   │   │   ├── api/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useAppointments.ts
│   │   │   │   ├── useServices.ts
│   │   │   │   └── useResources.ts
│   │   │   └── ui/
│   │   │       ├── useToast.ts
│   │   │       └── useMediaQuery.ts
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   └── api.ts
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   └── uiStore.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       └── helpers.ts
│   ├── public/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   ├── .env.local
│   ├── .eslintrc.json
│   ├── .gitignore
│   ├── components.json
│   ├── Dockerfile
│   ├── next.config.js
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── docker/
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Contributing

### Getting Started

1. Fork the repository on GitHub
2. Clone your fork to your local machine
3. Create a feature branch from the main branch
4. Make your changes following the code standards
5. Commit using conventional commit messages
6. Push your feature branch to your fork
7. Open a Pull Request on the original repository

### Code Standards

- Use TypeScript for all new code
- Follow the ESLint and Prettier configurations
- Write unit tests for new features and bug fixes
- Update API documentation for any endpoint changes
- Ensure accessibility compliance with WCAG 2.1 Level AA
- Use semantic HTML and proper ARIA labels
- Maintain responsive design across all breakpoints

### Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the API documentation for any endpoint changes
3. Ensure all tests pass locally before submitting
4. Request review from at least one team member
5. Address all review comments promptly
6. Merge only after receiving approval from reviewers

---

## Troubleshooting

### Issue: Cannot find module '@prisma/client'

**Solution**: Run `npx prisma generate` in the backend directory to regenerate the Prisma client.

### Issue: Database connection refused

**Solution**: Ensure PostgreSQL is running. On Linux, use `sudo service postgresql start`. Verify your database credentials in the `.env` file match the PostgreSQL user and database you created. Check if the database exists by listing all databases in psql.

### Issue: Redis connection failed

**Solution**: Ensure Redis is running by executing `redis-cli ping` which should return PONG. If Redis is not running, start it with `redis-server`. Verify the REDIS_URL in your `.env` file is correct.

### Issue: Port 3000 already in use

**Solution**: Find the process using port 3000 and terminate it, or set a different port by modifying the PORT environment variable in your `.env` file.

### Issue: CORS error in browser

**Solution**: Ensure the FRONTEND_URL in the backend `.env` file matches your frontend URL exactly, including the protocol and port.

### Issue: JWT token expired

**Solution**: The application should auto-refresh tokens. If token refresh fails, log out and log in again to obtain new tokens.

### Issue: npm install fails

**Solution**: Clear the npm cache, delete the node_modules directory and package-lock.json file, then reinstall dependencies.

### Getting Help

If you encounter an issue not listed above:

1. Check the terminal logs for detailed error messages
2. Review the error message carefully for clues
3. Search existing issues on the project GitHub repository
4. Create a new issue including: a description of the problem, steps to reproduce, expected versus actual behavior, your environment details (operating system, Node.js version, npm version), and relevant error logs

---

## License

This project is licensed under the MIT License.

## Support

For support, contact the development team.

## Acknowledgments

- University of Ghana Student Clinic
- Development Team
- Open Source Community

---

**End of README**
