Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        UG CLINIC MANAGEMENT SYSTEM - DEMO LAUNCHER               ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND = Join-Path $ROOT "backend"
$FRONTEND = Join-Path $ROOT "frontend"
$PG_BIN = "C:\Program Files\PostgreSQL\18\bin"
$PG_CTL = Join-Path $PG_BIN "pg_ctl.exe"
$PGDATA = "C:\Program Files\PostgreSQL\18\data"

function Write-Step($msg) { Write-Host "`n▶ $msg" -ForegroundColor Yellow }
function Write-Ok($msg)   { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "  ❌ $msg" -ForegroundColor Red }

Write-Step "1/5  Starting PostgreSQL Database Server..."
$env:PGDATA = $PGDATA
$pgStatus = & $PG_CTL status 2>&1
if ($pgStatus -match "no server running") {
    & $PG_CTL start -w 2>&1 | Out-Null
    Start-Sleep -Seconds 2
    Write-Ok "PostgreSQL started successfully"
} else {
    Write-Ok "PostgreSQL is already running"
}

Write-Step "2/5  Verifying database connection and demo accounts..."
Push-Location $BACKEND
$setupResult = node scripts\setup-demo.js 2>&1
Write-Ok "Demo accounts verified / created"
Pop-Location

Write-Step "3/5  Starting Backend API Server (port 3005)..."
$backendRunning = Get-NetTCPConnection -LocalPort 3005 -ErrorAction SilentlyContinue
if (-not $backendRunning) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "
        Set-Location '$BACKEND'
        `$env:PORT='3005'
        `$env:NODE_ENV='development'
        Write-Host 'Backend API starting on port 3005...' -ForegroundColor Magenta
        & .\node_modules\.bin\nodemon.cmd --watch src --ext ts --exec .\node_modules\.bin\ts-node.cmd src/app.ts
    " -WindowStyle Minimized
    Start-Sleep -Seconds 8
    Write-Ok "Backend started (nodemon with auto-reload)"
} else {
    Write-Ok "Backend is already running on port 3005"
}

Write-Step "4/5  Running login verification on all accounts..."
Push-Location $BACKEND
$verifyResult = node scripts\verify-login.js 2>&1
$verifyOut = ($verifyResult | Out-String)
if ($verifyOut -match "ALL ACCOUNTS CAN LOGIN SUCCESSFULLY") {
    Write-Ok "Login verification: ALL 8/8 TESTS PASSED"
} else {
    Write-Host $verifyOut
    Write-Fail "Some login tests failed (see above)"
}
Pop-Location

Write-Step "5/5  Starting Frontend Dev Server (port 3001)..."
$frontendRunning = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if (-not $frontendRunning) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "
        Set-Location '$FRONTEND'
        Write-Host 'Next.js Frontend starting on port 3001...' -ForegroundColor Magenta
        npm.cmd run dev
    " -WindowStyle Normal
    Write-Ok "Frontend start initiated (window opened)"
    Write-Host "   ⏳ Please allow 10-15 seconds for Next.js Turbopack compilation..." -ForegroundColor DarkGray
} else {
    Write-Ok "Frontend is already running on port 3001"
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    🎉 DEMO ENVIRONMENT READY                     ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 FRONTEND:   http://localhost:3001/login" -ForegroundColor White
Write-Host "🔧 HEALTH:     http://localhost:3005/health" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════ LOGIN CREDENTIALS ══════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "  👨‍💼  ADMIN" -ForegroundColor Cyan
Write-Host "      Email:    admin@ugclinic-fyp.edu.gh"
Write-Host "      Password: Password123!"
Write-Host ""
Write-Host "  👨‍⚕️  DOCTOR" -ForegroundColor Cyan
Write-Host "      Email:    doctor@ugclinic-fyp.edu.gh"
Write-Host "      Password: Password123!"
Write-Host ""
Write-Host "  💁  RECEPTIONIST" -ForegroundColor Cyan
Write-Host "      Email:    receptionist@ugclinic-fyp.edu.gh"
Write-Host "      Password: Password123!"
Write-Host ""
Write-Host "  🎓  STUDENT (Default)" -ForegroundColor Cyan
Write-Host "      ID/Email: 20240001  |  student@st.ug.edu.gh"
Write-Host "      Password: Password123!"
Write-Host ""
Write-Host "  🎓  STUDENT (Demo #2 - you can use this one)" -ForegroundColor Cyan
Write-Host "      ID/Email: 11011482  |  11011482@st.ug.edu.gh"
Write-Host "      Password: Testitnow@123"
Write-Host ""
Write-Host "  🎓  STUDENT (Demo #3 - Female student)" -ForegroundColor Cyan
Write-Host "      ID/Email: 20240002  |  akua@st.ug.edu.gh"
Write-Host "      Password: Password123!"
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 TIPS FOR DEMO:" -ForegroundColor Magenta
Write-Host "   • Login with student 11011482 / Testitnow@123 to create appointments"
Write-Host "   • Login as RECEPTIONIST to manage appointments"
Write-Host "   • Login as DOCTOR to view & confirm scheduled appointments"
Write-Host "   • Login as ADMIN for full system access"
Write-Host "   • Backend auto-reloads on code changes (nodemon)"
Write-Host ""
Read-Host "Press ENTER to open http://localhost:3001/login in your browser..."

Start-Process "http://localhost:3001/login"
Write-Host "`n✅ Browser should be opening now. Good luck with your demo! 🏆" -ForegroundColor Green
