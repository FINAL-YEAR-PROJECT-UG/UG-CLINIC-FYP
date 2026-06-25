# UG Clinic FYP - Complete Setup Guide

## Current Status
- ✅ Backend: Running on port 3005 (development)
- ✅ Frontend: Running on port 3001 (development)
- ❌ Database: NOT RUNNING (PostgreSQL container missing)
- ❌ Redis: NOT RUNNING (Redis container missing)

**Problem:** You're getting "Network Error" because database is not available.

---

## Quick Fix (5 minutes)

### Step 1: Start Database Containers
```bash
# Navigate to project root
cd C:\Users\Oteng\Desktop\Github\UG-CLINIC-FYP

# Start PostgreSQL and Redis
docker-compose up -d postgres redis
```

### Step 2: Verify Containers
```bash
docker ps
```

Should show:
```
CONTAINER ID   IMAGE                STATUS
xxx            postgres:16-alpine   Up 1 minute
xxx            redis:7-alpine       Up 1 minute
```

### Step 3: Test Backend Connection
```bash
curl http://localhost:3005/health
```

Should return:
```json
{"status":"ok","service":"ug-clinic-api"}
```

### Step 4: Reload Frontend
- Open http://localhost:3001/register
- Try creating account again
- ✅ Should work now!

---

## Development Setup (Current)

Your current local development setup:

```
Frontend: http://localhost:3001 (npm run dev)
Backend:  http://localhost:3005 (npm run dev)
Database: postgresql://postgres:postgres@localhost:5432/ug_clinic
Redis:    redis://localhost:6379
```

**Environment Files:**
- Frontend: `frontend/.env.local` ✅ (already fixed)
- Backend: `backend/.env` ✅ (configured for localhost)
- Root: `.env` (for docker-compose)

---

## Full Local Development Workflow

### Terminal 1: Start Docker Containers
```bash
cd C:\Users\Oteng\Desktop\Github\UG-CLINIC-FYP
docker-compose up -d postgres redis
```

Wait for containers to be healthy (~10-15 seconds):
```bash
docker ps
# Check STATUS column - should say "Up X seconds (healthy)"
```

### Terminal 2: Start Backend
```bash
cd C:\Users\Oteng\Desktop\Github\UG-CLINIC-FYP\backend
npm run dev
```

Should show:
```
[nodemon] watching path(s): src\**\*
Server listening on port 3005
```

### Terminal 3: Start Frontend
```bash
cd C:\Users\Oteng\Desktop\Github\UG-CLINIC-FYP\frontend
npm run dev
```

Should show:
```
✓ Ready in XXXms
```

### Browser: Test Application
Open: http://localhost:3001/register

Test with:
```
Full Name: Ray Mensah
Student ID: 78451236
Email: y@st.ug.edu.gh
Phone: +2330451236
Program: Computer Science
```

Click "Create Account" → ✅ Should work!

---

## Environment Configuration

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3005/api
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Backend (.env)
```env
NODE_ENV=development
PORT=3005
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ug_clinic?schema=public
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3001
```

### Root (.env) - For Docker Compose
```env
POSTGRES_DB=ug_clinic
POSTGRES_USER=postgres
DB_PASSWORD=postgres
```

---

## Docker Containers

### PostgreSQL (Database)
```bash
# Start
docker-compose up -d postgres

# View logs
docker logs ugclinic-postgres

# Connect to database
docker exec -it ugclinic-postgres psql -U postgres -d ug_clinic

# Stop
docker-compose stop postgres
```

### Redis (Cache)
```bash
# Start
docker-compose up -d redis

# View logs
docker logs ugclinic-redis

# Test connection
docker exec ugclinic-redis redis-cli ping

# Stop
docker-compose stop redis
```

### Stop All Containers
```bash
docker-compose down
```

### View All Containers
```bash
docker ps -a
```

---

## Troubleshooting

### "Network Error" in Frontend

**Checklist:**
1. ✅ Containers running: `docker ps`
2. ✅ Backend health: `curl http://localhost:3005/health`
3. ✅ Frontend env: Check `NEXT_PUBLIC_API_URL=http://localhost:3005/api`
4. ✅ Browser cache: Hard refresh (Ctrl+Shift+Delete)

**Fix:**
```bash
# Start containers
docker-compose up -d postgres redis

# Wait 15 seconds
sleep 15

# Test backend
curl http://localhost:3005/health

# If still failing, check logs
docker logs ugclinic-postgres
```

### Database Connection Refused

```bash
# Check if container is running
docker ps | grep postgres

# If not running, start it
docker-compose up -d postgres

# If showing "Restarting", give it more time
docker logs ugclinic-postgres

# If corrupted, reset it
docker-compose down -v postgres
docker-compose up -d postgres
```

### Port Already in Use

```bash
# Check what's using port 3005
netstat -ano | findstr :3005

# Kill the process
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3006
```

### Containers Not Healthy

```bash
# Check health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# If unhealthy, restart
docker-compose restart postgres redis

# Wait 15 seconds then check again
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## Database Schema

The database is automatically initialized with Prisma migrations:

```bash
# Run migrations
npx prisma migrate deploy

# View schema
npx prisma studio
```

---

## Common Tasks

### Clear Database
```bash
# Remove and recreate containers
docker-compose down -v postgres
docker-compose up -d postgres
```

### View Database Logs
```bash
docker logs ugclinic-postgres -f
```

### Connect to Database Directly
```bash
docker exec -it ugclinic-postgres psql -U postgres -d ug_clinic
```

Then in psql:
```sql
\dt                    -- Show all tables
SELECT * FROM "User";  -- View users
SELECT * FROM "Appointment";  -- View appointments
```

### Backup Database
```bash
docker exec ugclinic-postgres pg_dump -U postgres -d ug_clinic > backup.sql
```

### Restore Database
```bash
docker exec -i ugclinic-postgres psql -U postgres -d ug_clinic < backup.sql
```

---

## Testing Checklist

- [ ] Docker containers running (`docker ps`)
- [ ] PostgreSQL healthy and listening on 5432
- [ ] Redis healthy and listening on 6379
- [ ] Backend running on port 3005
- [ ] Frontend running on port 3001
- [ ] Backend health check returns 200: `curl http://localhost:3005/health`
- [ ] Frontend loads: `http://localhost:3001`
- [ ] Registration page visible
- [ ] Can create account without "Network Error"
- [ ] Can login with new account

---

## Performance Tips

1. **Use docker-compose up -d**: Runs containers in background
2. **Don't rebuild images in dev**: Use `docker-compose up -d` not `--build`
3. **Mount volumes for hot reload**: Already configured in docker-compose
4. **Monitor logs in separate terminal**: `docker logs -f <container>`

---

## Next Steps

1. ✅ Start containers: `docker-compose up -d postgres redis`
2. ✅ Verify: `docker ps`
3. ✅ Backend: Already running on port 3005
4. ✅ Frontend: Already running on port 3001
5. ✅ Test: http://localhost:3001/register

**That's it! The "Network Error" should be gone.**

For detailed documentation, see:
- `SECURITY.md` - Security features
- `TIMEOUT_FIX.md` - Timeout fixes
- `EXECUTIVE_SUMMARY.md` - Full security audit
