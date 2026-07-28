# UG Clinic Backend

This is the backend service for the UG Clinic project. It is built with Node.js, Express, TypeScript, Prisma, and PostgreSQL-ready configuration.

## Tech Stack

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication support
- File upload support via Multer

## Project Structure

- src/app.ts - Main Express application entry point
- src/routes - API route modules
- src/controllers - Request handlers
- src/services - Business logic
- src/middleware - Error handling and route middleware
- src/config - Configuration helpers
- src/utils - Utility functions
- prisma - Prisma schema and migrations
- tests - Unit, integration, and end-to-end tests
- uploads - Upload storage directories

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```

2. Create your environment file
   ```bash
   cp .env.example .env
   ```

3. Update the database connection string in `.env`

4. Generate Prisma client
   ```bash
   npm run prisma:generate
   ```

5. Run database migrations
   ```bash
   npm run prisma:migrate
   ```

6. Start the development server
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start the development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start the compiled application
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run Jest in watch mode
- `npm run test:coverage` - Run Jest with coverage report
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run Prisma migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Run database seeder
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

## Environment Variables

The default values are defined in `.env.example`:

- `PORT`
- `NODE_ENV`
- `CORS_ORIGIN`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `DATABASE_URL`

## Notes

This backend is currently scaffolded and ready for further API and database development.
