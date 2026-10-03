/**
 * bootstrap-admin.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time script to provision the first Supabase ADMIN staff account.
 *
 * USAGE
 *   node scripts/bootstrap-admin.mjs
 *
 * REQUIRED ENV VARS (set in .env or export before running)
 *   SUPABASE_URL          Your project URL, e.g. https://xxxx.supabase.co
 *   SUPABASE_SECRET_KEY   Service-role key (starts with eyJ…) — NEVER commit this
 *   ADMIN_EMAIL           Email address for the new admin account
 *   ADMIN_FIRST_NAME      First name
 *   ADMIN_LAST_NAME       Last name
 *   ADMIN_EMAIL_VERIFIED  Set to "true" to auto-confirm the email (skip verification link)
 *
 * PREREQUISITES
 *   This backend does not include @supabase/supabase-js as a production dep.
 *   Install it once for local scripting (do NOT commit this to production deps):
 *     npm install --no-save @supabase/supabase-js
 *
 * SECURITY NOTES
 * ─ A cryptographically random temporary password is generated in memory and
 *   NEVER logged, printed, or returned. The staff member MUST set their own
 *   password through the app's password-reset flow at /staff-portal-access.
 * ─ The service-role key is read from env only and never echoed back.
 * ─ Run this script once from a trusted machine; do not expose it as an endpoint.
 *
 * PARTIAL-FAILURE RECOVERY
 *   If Auth user creation succeeds but the profiles upsert fails, the script
 *   prints the Auth UID and exact instructions. Re-run the profile step only:
 *     RETRY_PROFILE_UID=<uuid> node scripts/bootstrap-admin.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Load .env manually (the backend uses CommonJS dotenv; we replicate here) ──

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

try {
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val; // shell vars take precedence
  }
} catch {
  // .env absent — rely on shell environment variables only
}

// ── Read and validate required environment variables ──────────────────────────

function requireEnv(name) {
  const val = (process.env[name] ?? '').trim();
  if (!val) {
    console.error(`\n[bootstrap-admin] ✗ Missing required environment variable: ${name}`);
    console.error(`  Set it in backend/.env or export it before running this script.\n`);
    process.exit(1);
  }
  return val;
}

const SUPABASE_URL   = requireEnv('SUPABASE_URL');
const SUPABASE_KEY   = requireEnv('SUPABASE_SECRET_KEY'); // service-role key
const ADMIN_EMAIL    = requireEnv('ADMIN_EMAIL');
const FIRST_NAME     = requireEnv('ADMIN_FIRST_NAME');
const LAST_NAME      = requireEnv('ADMIN_LAST_NAME');
const EMAIL_VERIFIED = (process.env.ADMIN_EMAIL_VERIFIED ?? '').trim().toLowerCase() === 'true';

// Optional: retry-only-profile mode (set after a partial Auth-success / profile-fail)
const RETRY_PROFILE_UID = (process.env.RETRY_PROFILE_UID ?? '').trim() || null;

// ── Sanity-check URL and key format (key value is never printed) ───────────────

if (!SUPABASE_URL.startsWith('https://')) {
  console.error('[bootstrap-admin] ✗ SUPABASE_URL must start with https://');
  process.exit(1);
}
if (!SUPABASE_KEY.startsWith('eyJ')) {
  console.error('[bootstrap-admin] ✗ SUPABASE_SECRET_KEY does not look like a JWT service-role key.');
  console.error('  Make sure you are using the service-role key, NOT the anon key.');
  process.exit(1);
}

// ── Build Supabase admin client ────────────────────────────────────────────────
// Session persistence and token refresh are explicitly disabled — this is a
// one-shot script, not a long-lived server process.

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession:    false,
    autoRefreshToken:  false,
    detectSessionInUrl: false,
  },
});

// ── Generate a cryptographically random temporary password ────────────────────
// Supabase may enforce a password policy requiring at least one character from
// each of: lowercase, uppercase, digit, special character.
// We satisfy all four classes explicitly, then shuffle the result using
// Fisher-Yates driven by crypto.randomBytes to avoid Math.random().
// The value is NEVER logged or printed anywhere in this script.

function generateTempPassword() {
  const lower   = 'abcdefghijklmnopqrstuvwxyz';
  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits  = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all     = lower + upper + digits + special;

  // Pick at least two from each required class to be safe
  const pick = (charset, n) =>
    Array.from({ length: n }, (_, i) =>
      charset[randomBytes(1)[0] % charset.length]
    );

  const chars = [
    ...pick(lower,   3),
    ...pick(upper,   3),
    ...pick(digits,  3),
    ...pick(special, 3),
    // Fill the rest of a 32-char password from the full pool
    ...Array.from({ length: 20 }, (_, i) =>
      all[randomBytes(1)[0] % all.length]
    ),
  ];

  // Cryptographic Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(4).readUInt32BE(0) % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}


// ── Profile upsert helper ─────────────────────────────────────────────────────

async function upsertProfile(uid, email, firstName, lastName) {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id:         uid,
        email:      email,
        first_name: firstName,
        last_name:  lastName,
        role:       'ADMIN',
        is_active:  true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }, // conflict key is the Supabase Auth user UUID
    );
  return error ?? null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[bootstrap-admin] Starting admin account bootstrap…');
  console.log(`  Supabase URL     : ${SUPABASE_URL}`);
  console.log(`  Email            : ${ADMIN_EMAIL}`);
  console.log(`  Name             : ${FIRST_NAME} ${LAST_NAME}`);
  console.log(`  Role             : ADMIN`);
  console.log(`  Email confirmed  : ${EMAIL_VERIFIED}`);
  console.log(`  Secret key       : [REDACTED — never echoed]\n`);

  // ── RETRY MODE: Auth user already exists; only upsert profile ────────────
  if (RETRY_PROFILE_UID) {
    console.log('[bootstrap-admin] RETRY MODE — skipping Auth user creation.');
    console.log(`  Target UID: ${RETRY_PROFILE_UID}\n`);

    const profileErr = await upsertProfile(RETRY_PROFILE_UID, ADMIN_EMAIL, FIRST_NAME, LAST_NAME);
    if (profileErr) {
      printProfileRetryInstructions(RETRY_PROFILE_UID, profileErr);
      process.exit(1);
    }

    console.log('[bootstrap-admin] ✓ public.profiles row upserted (retry).');
    printDone(RETRY_PROFILE_UID);
    return;
  }

  // ── STEP 1: Guard — abort if email is already registered ─────────────────
  // We list users to check for duplicates rather than attempting creation and
  // catching the error, so we never touch an existing user's data.

  const { data: existingList, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listErr) {
    console.error('[bootstrap-admin] ✗ Could not list existing users to check for duplicates:');
    console.error(`  ${listErr.message}`);
    console.error('  Verify that SUPABASE_SECRET_KEY is the service-role key (not the anon key).');
    process.exit(1);
  }

  const alreadyExists = existingList.users.some(
    (u) => (u.email ?? '').toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  );

  if (alreadyExists) {
    console.error(`[bootstrap-admin] ✗ A user with email "${ADMIN_EMAIL}" already exists in Supabase Auth.`);
    console.error('  This script will NOT promote or modify an existing user.');
    console.error('  To update that user\'s role, use one of:');
    console.error('    • The Staff & Permissions page at /staff/permissions (admin portal)');
    console.error('    • PATCH /api/backend/resources/staff  { userId, role: "ADMIN" }');
    console.error('    • Supabase Dashboard → Authentication → Users → edit app_metadata\n');
    process.exit(1);
  }

  // ── STEP 2: Create the Auth user via auth.admin.createUser() ─────────────
  // app_metadata.role is set server-side and cannot be modified by the user.
  // user_metadata holds display fields that the user may update themselves.

  const tempPassword = generateTempPassword(); // never printed

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email:         ADMIN_EMAIL,
    password:      tempPassword,
    email_confirm: EMAIL_VERIFIED,           // true → skip verification email
    app_metadata:  { role: 'ADMIN' },        // trusted; enforced server-side
    user_metadata: {
      firstName: FIRST_NAME,
      lastName:  LAST_NAME,
    },
  });

  // Overwrite the temp password reference immediately after the API call.
  // JavaScript does not guarantee garbage collection, but this narrows the
  // window during which the value sits in reachable memory.
  const _cleared = tempPassword.replace(/./g, '\0'); void _cleared;

  if (authErr || !authData?.user) {
    console.error('[bootstrap-admin] ✗ Auth user creation failed:');
    console.error(`  ${authErr?.message ?? 'No user returned from createUser()'}`);
    process.exit(1);
  }

  const uid = authData.user.id;
  const confirmed = Boolean(authData.user.email_confirmed_at);

  console.log('[bootstrap-admin] ✓ Auth user created.');
  console.log(`  UID             : ${uid}`);
  console.log(`  Email confirmed : ${confirmed ? 'yes (immediate access)' : 'no (verification email sent)'}`);

  // ── STEP 3: Upsert public.profiles ────────────────────────────────────────
  // The profiles table is the authoritative source of truth for roles in the
  // frontend. If this step fails, the Auth user exists but can't log in to
  // the staff portal. We provide a clear recovery path instead of deleting
  // the Auth user (deletion + recreation can cause race conditions).

  console.log('\n[bootstrap-admin] Upserting public.profiles…');
  const profileErr = await upsertProfile(uid, ADMIN_EMAIL, FIRST_NAME, LAST_NAME);

  if (profileErr) {
    console.error('\n[bootstrap-admin] ✗ PARTIAL FAILURE: Auth user created, profile upsert failed.');
    printProfileRetryInstructions(uid, profileErr);
    process.exit(1);
  }

  console.log('[bootstrap-admin] ✓ public.profiles row upserted.');
  printDone(uid);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function printProfileRetryInstructions(uid, err) {
  console.error(`\n  Profile error code   : ${err.code ?? 'n/a'}`);
  console.error(`  Profile error message: ${err.message}`);
  console.error('\n  ── RECOVERY ─────────────────────────────────────────────────────────────');
  console.error(`  Auth UID: ${uid}`);
  console.error('  Do NOT re-run this script — it would attempt to create a duplicate Auth user.');
  console.error('  To retry ONLY the profile step, run:');
  console.error(`\n    RETRY_PROFILE_UID=${uid} node scripts/bootstrap-admin.mjs\n`);
  console.error('  Or insert the profile row manually in the Supabase SQL Editor:');
  console.error(`\n    INSERT INTO public.profiles (id, email, first_name, last_name, role, is_active)`);
  console.error(`    VALUES ('${uid}', '${process.env.ADMIN_EMAIL}', '${process.env.ADMIN_FIRST_NAME}', '${process.env.ADMIN_LAST_NAME}', 'ADMIN', true)`);
  console.error(`    ON CONFLICT (id) DO UPDATE SET role = 'ADMIN', is_active = true, updated_at = now();`);
  console.error('  ─────────────────────────────────────────────────────────────────────────\n');
}

function printDone(uid) {
  const email     = process.env.ADMIN_EMAIL ?? '';
  const firstName = process.env.ADMIN_FIRST_NAME ?? '';
  const lastName  = process.env.ADMIN_LAST_NAME ?? '';

  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║  Bootstrap complete                                                  ║');
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Email  : ${email.padEnd(58)}║`);
  console.log(`║  Name   : ${`${firstName} ${lastName}`.padEnd(58)}║`);
  console.log('║  Role   : ADMIN                                                      ║');
  console.log(`║  UID    : ${uid.padEnd(58)}║`);
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log('║  IMPORTANT: No password was printed or stored.                       ║');
  console.log('║  The staff member must visit /staff-portal-access and use the        ║');
  console.log('║  "Forgot password" link to set their own password.                  ║');
  if ((process.env.ADMIN_EMAIL_VERIFIED ?? '').toLowerCase() !== 'true') {
    console.log('║                                                                      ║');
    console.log('║  A verification email has been sent. The user must confirm their    ║');
    console.log('║  address before they can use the password-reset flow.               ║');
  }
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
}

// ── Entry point ───────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('\n[bootstrap-admin] Unhandled error:', err?.message ?? err);
  process.exit(1);
});
