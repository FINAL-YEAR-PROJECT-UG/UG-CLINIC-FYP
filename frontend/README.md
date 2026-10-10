# UG Clinic Frontend

This is the Next.js frontend for the UG-CLINIC-FYP project. It provides the public site, student portal, and staff dashboard for the University of Ghana student clinic system.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query
- React Hook Form
- Zod
- Radix UI
- Framer Motion
- Supabase client setup

## Features

### Student Portal

- Appointment booking workflow
- Dashboard for upcoming appointments and management
- Reschedule / cancellation flows
- Access to health resources and public information

### Staff Portal

- Admin and staff dashboards
- Queue management and doctor assignment tools
- KPI and clinic operation insights
- Student records and resource moderation
- 2FA access support for staff workflows

### Public Pages

- Landing page, services, contact, health resources, privacy, terms, and accessibility pages
- Resource submission and support flows

## Project Structure

```text
frontend/
├── src/
│   ├── app/                 # App Router pages and route groups
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── (public)/
│   │   ├── (staff)/
│   │   ├── api/
│   │   ├── demo-booking/
│   │   └── verify-otp/
│   ├── components/          # Shared and feature components
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # API and utility helpers
│   ├── stores/              # Zustand stores
│   ├── types/               # Type definitions
│   └── styles/              # Global styling
├── public/                  # Static assets
├── .env.example             # Example frontend environment file
├── package.json
├── next.config.js
├── tsconfig.json
├── Dockerfile
├── README.md
└── test/
```

## Prerequisites

- Node.js 18+
- Access to the backend API running locally or deployed
- Supabase project for auth and related client configuration

## Install and Run

### 1) Install dependencies

```bash
cd frontend
npm install
```

### 2) Create environment file

```bash
cp .env.example .env.local
```

Update `.env.local` with your values:

```env
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_API_URL=http://localhost:3005/api
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Note: `SUPABASE_SERVICE_ROLE_KEY` is server-side only and must never be exposed in the browser.

### 3) Run the app

```bash
npm run dev
```

Open the app in the browser at:

```text
http://localhost:3001
```

## Scripts

```bash
npm run dev            # Start dev server on port 3001
npm run dev:webpack    # Start using webpack mode
npm run build          # Production build
npm run start          # Start production server
npm run lint           # ESLint
npm run lint:fix       # Auto-fix lint issues
npm run type-check     # TypeScript type-check
npm run test           # Run test suite
npm run format         # Prettier format all files
npm run format:check   # Check formatting
```

## Demo / Development Accounts

### Student

- Email: `student@st.ug.edu.gh`
- Password: `Password123!`

### Staff / Admin

- Email: `emmanueloteng.k@gmail.com`
- Password: `Password123!`

## Local Development Notes

- Ensure the backend is running before testing login, booking, and issue-related flows.
- The frontend normally points to the backend at `http://localhost:3005/api`.
- If environment values change, restart the Next.js dev server.

## Security Notes

- Do not expose server-side secrets in client code.
- Keep Supabase service-role credentials on the server only.
- Authentication and route protections are enforced by both client routing and backend API checks.

## Production Build

```bash
npm run build
npm run start
```

## Docker / Deployment

The project includes a root Docker Compose configuration that spins up related services for development. For frontend-only deployment, Vercel is a common option, while the backend is often hosted separately with PostgreSQL and Redis configured.

## License

This project is licensed under the ISC License.
