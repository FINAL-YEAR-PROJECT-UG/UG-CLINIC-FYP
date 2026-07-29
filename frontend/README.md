# UG Clinic Frontend

A modern, responsive web application for the University of Ghana Clinic Management System. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

### Student Portal
- **Appointment Booking**: Book clinic appointments with real-time availability
- **Dashboard**: View upcoming appointments, cancel bookings, and manage health records
- **Health Resources**: Access clinic guides and medical information
- **Secure Authentication**: Direct API-based login with JWT tokens

### Staff Portal
- **Role-Based Access**: Separate portals for Admin, Doctors, and Receptionists
- **Dashboard Analytics**: View appointment trends, doctor availability, and clinic statistics
- **Appointment Management**: Assign doctors, manage time slots, and handle bookings
- **Student Records**: View and manage student information (Admin/Receptionist only)
- **2FA Support**: Two-factor authentication for enhanced security

### Security Features
- **Session Timeout**: Automatic logout after 10 minutes of inactivity with warning popup
- **Role-Based Access Control**: Strict permission separation between user roles
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Route Guards**: Protected routes with middleware-based access control

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Backend server running on `http://localhost:3005`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3005/api
NEXTAUTH_SECRET=your-secret-key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Credentials

### Student Login
- **Email**: `student@st.ug.edu.gh`
- **Password**: `Password123!`

### Staff Login
- **Email**: `emmanueloteng.k@gmail.com` (Admin)
- **Password**: `Password123!`

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/      # Student dashboard
│   │   ├── (public)/         # Public pages
│   │   ├── (staff)/          # Staff portal
│   │   └── api/              # API routes
│   ├── components/           # Reusable components
│   │   ├── shared/          # Shared UI components
│   │   └── providers/       # Context providers
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions and API clients
│   ├── stores/              # Zustand state management
│   └── types/               # TypeScript type definitions
└── public/                  # Static assets
```

## Key Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Lightweight state management
- **React Hook Form**: Form validation with Zod
- **Axios**: HTTP client for API calls
- **Lucide React**: Icon library

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Recent Updates

### Security Enhancements
- Implemented session timeout with inactivity detection (10 minutes warning, 2 minutes logout)
- Added role-based access control for staff portal features
- Doctors cannot access admin-only features (student records, automation tools)

### Authentication Improvements
- Migrated from NextAuth to direct API calls for student login
- Pre-filled development credentials for easier testing
- Enhanced error handling and user feedback

### Navigation Fixes
- Eliminated navigation flashes on authentication state changes
- Simplified routing logic for unauthenticated users
- Fixed student login routing to dashboard instead of booking screen

### Code Quality
- Updated `.gitignore` files for cleaner repository
- Removed unused dependencies and files
- Improved component organization and reusability

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com/new):

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

For other platforms, build the project:
```bash
npm run build
```

The output will be in the `.next` directory.

## Support

For issues or questions, please contact the development team.
