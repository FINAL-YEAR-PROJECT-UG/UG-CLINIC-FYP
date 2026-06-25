# Quick Start Guide - Fix "Network Error"

## Problem
You're getting "Network Error" when trying to create an account or sign in.

**Reason:** The database (PostgreSQL) and Redis containers aren't running.

## Solution

### Step 1: Start Database & Redis Containers
```bash
# From the project root directory
cd C:\Users\Oteng\Desktop\Github\UG-CLINIC-FYP

# Start Docker containers
docker-compose up -d postgres redis
```

This starts:
- ✅ PostgreSQL database (port 5432)
- ✅ Redis cache (port 6379)

### Step 2: Verify Containers Are Running
```bash
docker ps
```

You should see:
```
CONTAINER ID   IMAGE                COMMAND             STATUS          PORTS
xxx            postgres:16-alpine    postgres            Up 2 minutes    5432/tcp
xxx            redis:7-alpine       redis-server        Up 2 minutes    6379/tcp
```

### Step 3: Wait for Database Ready
Wait ~15 seconds for the database to be fully initialized.

### Step 4: Run Backend (if not already running)
```bash
cd backend
npm run dev
```

Should show:
```
Server listening on port 3005
```

### Step 5: Run Frontend (in another terminal)
```bash
cd frontend
npm run dev
```

Should show:
```
✓ Ready in XXXms
```

### Step 6: Test the App
Open browser to: `http://localhost:3001/register`

Try creating an account with:
```
Full Name: Test User
Student ID: 12345678
Email: test@st.ug.edu.gh
Phone: +233501234567
Program: Computer Science
Password: TestPassword123!
```

✅ Should now work without "Network Error"!

---

## Troubleshooting

### Still getting "Network Error"?

1. **Check if containers are running:**
   ```bash
   docker ps
   ```
   Should show postgres and redis

2. **Check if backend is listening:**
   ```bash
   curl http://localhost:3005/health
   ```
   Should return: `{"status":"ok","service":"ug-clinic-api"}`

3. **Check backend logs:**
   ```bash
   docker logs ugclinic-postgres  # Database logs
   docker logs ugclinic-redis     # Redis logs
   ```

4. **Check frontend environment:**
   ```bash
   # Check frontend/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:3005/api
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   ```

5. **Clear browser cache and reload:**
   - Press F12 (DevTools)
   - Right-click refresh button → Empty cache and hard refresh
   - Or use Ctrl+Shift+Delete

### Database connection refused?

If you get "database connection refused", the PostgreSQL container may need more time to initialize:

```bash
# Wait and check status
docker ps
# Look at STATUS column - should say "Up X seconds (healthy)"

# If not healthy, restart it
docker-compose restart postgres

# Wait 15 seconds and try again
```

### Port already in use?

If you get "port 3005 already in use":

```bash
# Kill existing process
# On Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 3005).OwningProcess | Stop-Process

# Or just use a different port
npm run dev -- -p 3006
```

---

## Full Setup Checklist

- [ ] Docker is installed and running
- [ ] PostgreSQL container is running (port 5432)
- [ ] Redis container is running (port 6379)
- [ ] Backend is running (port 3005, `npm run dev`)
- [ ] Frontend is running (port 3001, `npm run dev`)
- [ ] Browser can access http://localhost:3001
- [ ] .env.local has correct API URL (http://localhost:3005/api)

---

## Current Setup

**Backend:** Running on port 3005 (development)
**Frontend:** Running on port 3001 (development)
**Database:** Not running (ISSUE - needs to be started)
**Redis:** Not running (ISSUE - needs to be started)

---

## Next Steps

1. ✅ Start containers: `docker-compose up -d postgres redis`
2. ✅ Verify running: `docker ps`
3. ✅ Backend running: `npm run dev` in backend folder
4. ✅ Frontend running: `npm run dev` in frontend folder
5. ✅ Test: Open http://localhost:3001/register

---

**Status:** READY TO FIX - Just need to start Docker containers!

After starting the containers, the "Network Error" should be gone and you should be able to create accounts and sign in.
