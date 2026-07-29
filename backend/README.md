# UG Clinic Backend

RESTful API service for the University of Ghana Clinic Management System. Built with Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL.

## Features

### Authentication & Authorization
- **JWT Token System**: Secure access and refresh token generation
- **Role-Based Access Control**: Admin, Doctor, Receptionist, and Student roles
- **Two-Factor Authentication**: OTP support for staff accounts
- **Account Security**: Failed login tracking, account lockout, and password strength validation

### User Management
- **Student Registration**: Full registration with student ID validation
- **Staff Management**: Admin, Doctor, and Receptionist account creation
- **Profile Management**: User profile updates and information retrieval
- **Password Recovery**: Multiple recovery methods including security questions and OTP

### Appointment System
- **Booking Management**: Create, update, cancel, and view appointments
- **Time Slot Management**: Configure available appointment slots
- **Doctor Assignment**: Automatic and manual doctor assignment to appointments
- **Status Tracking**: Pending, confirmed, completed, cancelled, and no-show statuses

### Clinic Operations
- **Service Management**: Medical services catalog
- **Resource Management**: Health resources and guides
- **Doctor Availability**: Real-time doctor status tracking (Available/Busy/On Leave)
- **Analytics Dashboard**: Appointment trends and clinic statistics

### Security Features
- **Refresh Token Revocation**: Secure token invalidation on logout
- **Session Management**: Multiple session limits per user
- **Request Validation**: Comprehensive input validation using express-validator
- **CORS Protection**: Configurable cross-origin resource sharing

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **TypeScript**: Type-safe development
- **Prisma ORM**: Database ORM and migrations
- **PostgreSQL**: Relational database
- **JWT**: Token-based authentication
- **Bcrypt**: Password hashing
- **Multer**: File upload handling
- **Nodemailer**: Email sending (OTP notifications)

## Project Structure

```
backend/
├── src/
│   ├── app.ts              # Main Express application entry point
│   ├── config/             # Configuration helpers
│   ├── controllers/        # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── staff.controller.ts
│   │   ├── appointment.controller.ts
│   │   └── passwordRecovery.controller.ts
│   ├── middleware/         # Custom middleware
│   │   ├── auth.ts         # Authentication middleware
│   │   └── errorHandler.ts
│   ├── routes/             # API route definitions
│   │   ├── auth.routes.ts
│   │   ├── staff.routes.ts
│   │   ├── appointment.routes.ts
│   │   └── admin.routes.ts
│   ├── services/           # Business logic
│   │   └── otp.service.ts
│   ├── utils/              # Utility functions
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── studentValidation.ts
│   └── validators/         # Input validation schemas
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seeders/            # Database seeding scripts
│   └── migrations/         # Database migrations
├── uploads/                # File upload directories
└── tests/                  # Test files
```

## Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```env
PORT=3005
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
DATABASE_URL=postgresql://user:password@localhost:5432/ug_clinic
SMTP_USER=your-email
SMTP_PASS=your-password
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Seed database with initial data:
```bash
npm run prisma:seed
```

7. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3005/api`

## Available Scripts

```bash
npm run dev              # Start development server with nodemon
npm run build            # Compile TypeScript to JavaScript
npm run start            # Start production server
npm run test             # Run Jest tests
npm run test:watch       # Run Jest in watch mode
npm run test:coverage    # Run Jest with coverage report
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run Prisma migrations
npm run prisma:studio    # Open Prisma Studio (GUI)
npm run prisma:seed      # Seed database with initial data
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues automatically
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/check-account` - Check if account exists

### Staff Portal
- `POST /api/staff/register` - Register staff member
- `POST /api/staff/login` - Staff login
- `POST /api/staff/verify-2fa` - Verify two-factor authentication
- `POST /api/staff/resend-2fa` - Resend OTP code
- `GET /api/staff/dashboard` - Get staff dashboard data
- `GET /api/staff/doctors` - Get list of doctors
- `PATCH /api/staff/doctors/:id/status` - Update doctor availability
- `POST /api/staff/auto-assign` - Auto-assign doctors to appointments
- `POST /api/staff/auto-confirm` - Batch confirm pending appointments

### Appointments
- `GET /api/appointments` - Get appointments (with filters)
- `POST /api/appointments` - Create new appointment
- `PATCH /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `GET /api/appointments/:id` - Get single appointment

### Admin
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## Database Schema

### User Model
- **id**: Unique identifier
- **email**: User email (unique)
- **studentId**: Student ID (for students)
- **firstName**: First name
- **lastName**: Last name
- **passwordHash**: Hashed password
- **role**: User role (STUDENT, ADMIN, DOCTOR, RECEPTIONIST)
- **isActive**: Account status
- **twoFactorEnabled**: 2FA enabled flag
- **failedLoginAttempts**: Failed login counter
- **lockedUntil**: Account lockout timestamp

### Appointment Model
- **id**: Unique identifier
- **userId**: Reference to user
- **serviceId**: Reference to service
- **doctorId**: Assigned doctor (nullable)
- **date**: Appointment date
- **timeSlot**: Time slot
- **status**: Appointment status
- **reason**: Visit reason

### Doctor Model
- **id**: Unique identifier
- **userId**: Reference to user
- **specialization**: Medical specialization
- **doctorStatus**: Current status (AVAILABLE, BUSY, ON_LEAVE)

## Seeded Data

The seed script creates the following default accounts:

### Admin Account
- **Email**: `emmanueloteng.k@gmail.com`
- **Password**: `Password123!`
- **Role**: ADMIN
- **2FA**: Enabled

### Student Account
- **Email**: `student@st.ug.edu.gh`
- **Student ID**: `20240001`
- **Password**: `Password123!`
- **Role**: STUDENT

### Doctor Account
- **Email**: `Gabriel@gmail.com`
- **Password**: `Password123!`
- **Role**: DOCTOR
- **2FA**: Enabled

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3005 |
| NODE_ENV | Environment | development |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:3000 |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRES_IN | Token expiration | 1h |
| DATABASE_URL | PostgreSQL connection string | - |
| SMTP_USER | SMTP email user | - |
| SMTP_PASS | SMTP email password | - |
| SESSION_TIMEOUT_MINUTES | Session timeout | 30 |

## Recent Updates

### Security Enhancements
- Implemented refresh token revocation system
- Added account lockout after failed login attempts
- Enhanced password strength validation
- Implemented two-factor authentication for staff

### API Improvements
- Added automatic doctor assignment feature
- Implemented batch appointment confirmation
- Enhanced appointment status tracking
- Added doctor availability management

### Database Updates
- Updated seed script with new admin credentials
- Added doctor status tracking
- Enhanced user model with security fields
- Improved appointment relationships

## Development Notes

- The API runs on port 3005 by default
- CORS is configured to allow requests from the frontend
- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Refresh tokens are stored in the database for revocation
- File uploads are handled via Multer with size limits

## Support

For issues or questions, please contact the development team.
