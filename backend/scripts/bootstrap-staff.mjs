/**
 * bootstrap-staff.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates one or more staff accounts in Supabase Auth + public.profiles.
 * Roles accepted: ADMIN | DOCTOR | RECEPTIONIST
 *
 * USAGE
 *   # Create ALL demo staff at once (recommended for testing):
 *   node scripts/bootstrap-staff.mjs demo
 *
 *   # Create a single account via env vars:
 *   STAFF_EMAIL=name@ug.edu.gh STAFF_PASSWORD=Pass123! \
 *   STAFF_FIRST_NAME=Kwame STAFF_LAST_NAME=Mensah STAFF_ROLE=DOCTOR \
 *   node scripts/bootstrap-staff.mjs
 *
 * REQUIRED ENV VARS (already in backend/.env):
 *   SUPABASE_URL          https://xoyljehlfwodywoqfade.supabase.co
 *   SUPABASE_SECRET_KEY   service-role key
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env ──────────────────────────────────────────────────────────────
try {
  const raw = readFileSync(resolve(__dirname, '../.env'), 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(k in process.env)) process.env[k] = v;
  }
} catch { /* rely on shell env */ }

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').trim();
const SUPABASE_KEY = (process.env.SUPABASE_SECRET_KEY ?? '').trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\n[bootstrap-staff] ✗ SUPABASE_URL and SUPABASE_SECRET_KEY must be set in backend/.env\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const VALID_ROLES = ['ADMIN', 'DOCTOR', 'RECEPTIONIST'];

// ── Create a single staff account ─────────────────────────────────────────
async function createStaff({ email, password, firstName, lastName, role }) {
  role = role.toUpperCase();

  if (!VALID_ROLES.includes(role)) {
    console.error(`\n[bootstrap-staff] ✗ Invalid role "${role}". Must be: ${VALID_ROLES.join(' | ')}\n`);
    return false;
  }

  console.log(`\n[bootstrap-staff] Creating ${role}: ${email}…`);

  // Guard against duplicates
  const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (existing?.users?.some(u => (u.email ?? '').toLowerCase() === email.toLowerCase())) {
    console.warn(`[bootstrap-staff] ⚠  "${email}" already exists — skipping.`);
    return false;
  }

  // Create Auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,           // auto-confirm; no verification email needed for staff
    app_metadata:  { role },      // used by /staff-portal-access role check
    user_metadata: { firstName, lastName },
  });

  if (authErr || !authData?.user) {
    console.error(`[bootstrap-staff] ✗ Auth creation failed: ${authErr?.message ?? 'no user returned'}`);
    return false;
  }

  const uid = authData.user.id;
  console.log(`[bootstrap-staff] ✓ Auth user created — UID: ${uid}`);

  // Upsert public.profiles
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert(
      { id: uid, email, first_name: firstName, last_name: lastName, role, is_active: true, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );

  if (profileErr) {
    console.error(`[bootstrap-staff] ✗ Profile upsert failed: ${profileErr.message}`);
    console.error(`  Retry with: RETRY_PROFILE_UID=${uid} node scripts/bootstrap-staff.mjs`);
    return false;
  }

  console.log(`[bootstrap-staff] ✓ public.profiles row created.`);
  printSuccess({ email, firstName, lastName, role, uid, password });
  return true;
}

function printSuccess({ email, firstName, lastName, role, uid, password }) {
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`\n╔${'═'.repeat(68)}╗`);
  console.log(`║  ✅ Staff account ready                                            ║`);
  console.log(`╠${'═'.repeat(68)}╣`);
  console.log(`║  Role      : ${pad(role, 54)}║`);
  console.log(`║  Name      : ${pad(`${firstName} ${lastName}`, 54)}║`);
  console.log(`║  Email     : ${pad(email, 54)}║`);
  console.log(`║  Password  : ${pad(password, 54)}║`);
  console.log(`║  UID       : ${pad(uid, 54)}║`);
  console.log(`╠${'═'.repeat(68)}╣`);
  console.log(`║  Login → http://localhost:3001/staff-portal-access               ║`);
  console.log(`╚${'═'.repeat(68)}╝\n`);
}

// ── Demo mode ──────────────────────────────────────────────────────────────
async function createDemo() {
  console.log('\n[bootstrap-staff] 🔧 Creating demo staff accounts…');

  const accounts = [
    { email: 'admin@clinic.ug.edu.gh',     password: 'Admin123!@#',      firstName: 'System', lastName: 'Administrator', role: 'ADMIN' },
    { email: 'doctor@clinic.ug.edu.gh',    password: 'Doctor123!@#',     firstName: 'Dr. Kwame', lastName: 'Mensah',    role: 'DOCTOR' },
    { email: 'reception@clinic.ug.edu.gh', password: 'Reception123!@#',  firstName: 'Ama',    lastName: 'Asante',       role: 'RECEPTIONIST' },
  ];

  let created = 0;
  for (const acc of accounts) {
    if (await createStaff(acc)) created++;
  }

  console.log(`\n[bootstrap-staff] Done — ${created}/${accounts.length} created.\n`);
  if (created > 0) {
    console.log('📋 Demo Credentials:');
    console.log('   ADMIN        → admin@clinic.ug.edu.gh      / Admin123!@#');
    console.log('   DOCTOR       → doctor@clinic.ug.edu.gh     / Doctor123!@#');
    console.log('   RECEPTIONIST → reception@clinic.ug.edu.gh  / Reception123!@#');
    console.log('\n   🔗 http://localhost:3001/staff-portal-access\n');
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const command = (process.argv[2] ?? '').trim();

  if (command === 'demo') { await createDemo(); return; }

  // Retry-profile mode
  if (process.env.RETRY_PROFILE_UID) {
    const uid = process.env.RETRY_PROFILE_UID.trim();
    const { error } = await supabase.from('profiles').upsert(
      { id: uid, email: process.env.STAFF_EMAIL, first_name: process.env.STAFF_FIRST_NAME,
        last_name: process.env.STAFF_LAST_NAME, role: (process.env.STAFF_ROLE ?? '').toUpperCase(),
        is_active: true, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
    if (error) { console.error(`✗ Still failing: ${error.message}`); process.exit(1); }
    console.log('✓ Profile upserted.');
    return;
  }

  // Single-user mode via env vars
  const email     = (process.env.STAFF_EMAIL      ?? '').trim();
  const password  = (process.env.STAFF_PASSWORD   ?? '').trim();
  const firstName = (process.env.STAFF_FIRST_NAME ?? '').trim();
  const lastName  = (process.env.STAFF_LAST_NAME  ?? '').trim();
  const role      = (process.env.STAFF_ROLE       ?? '').trim();

  if (!email || !password || !firstName || !lastName || !role) {
    console.log('\nUsage:\n');
    console.log('  node scripts/bootstrap-staff.mjs demo\n');
    console.log('  STAFF_EMAIL=x@ug.edu.gh STAFF_PASSWORD=Pass123! STAFF_FIRST_NAME=Kwame \\');
    console.log('  STAFF_LAST_NAME=Mensah STAFF_ROLE=DOCTOR node scripts/bootstrap-staff.mjs\n');
    console.log('  Roles: ADMIN | DOCTOR | RECEPTIONIST\n');
    process.exit(0);
  }

  await createStaff({ email, password, firstName, lastName, role });
}

main().catch(err => {
  console.error('\n[bootstrap-staff] Unhandled error:', err?.message ?? err);
  process.exit(1);
});
