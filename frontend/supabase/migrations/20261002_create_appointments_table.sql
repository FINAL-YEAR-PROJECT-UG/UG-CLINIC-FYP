-- =============================================================================
-- UG Student Clinic — public.appointments table
-- =============================================================================
-- Safe to run on an empty schema (CREATE TABLE IF NOT EXISTS) and also safe
-- to re-run on an existing schema (all DDL is idempotent).
--
-- Columns derived from every API route that touches this table:
--
--  Route                                    Columns read / written
--  ──────────────────────────────────────── ──────────────────────────────────
--  POST /api/backend/appointments           user_id, student_id, patient_name,
--                                           patient_email, service_id,
--                                           service_name, doctor_id,
--                                           doctor_name, date, time_slot,
--                                           reason, notes, status,
--                                           booking_email_sent,
--                                           approval_email_sent
--  GET  /api/backend/appointments           all cols (SELECT *)
--  PATCH /api/backend/appointments/[id]/    id, user_id, patient_email,
--        cancel                             status, notes, updated_at
--  PATCH /api/backend/appointments/[id]/    date, time_slot, status, updated_at
--        reschedule
--  PATCH /api/backend/appointments/[id]/    status, updated_at,
--        status                             approval_email_sent, patient_email,
--                                           patient_name, service_name,
--                                           service_id
--  GET  /api/backend/appointments/          time_slot, date, status
--        availability
--  GET  /api/backend/appointments/staff/all all cols (SELECT *)
--  appointmentNotifications.ts              notification_logs,
--                                           booking_email_sent,
--                                           approval_email_sent, updated_at
-- =============================================================================

-- ── 1. Table ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.appointments (
    -- Identity
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Patient identity (populated from NextAuth JWT at booking time)
    user_id             TEXT,           -- auth.uid() as text; nullable for legacy rows
    student_id          TEXT,           -- UG student index number
    patient_name        TEXT,           -- "firstName lastName" concatenated
    patient_email       TEXT        NOT NULL,

    -- Service / doctor
    service_id          TEXT        NOT NULL,
    service_name        TEXT,           -- human-readable label stored at insert time
    doctor_id           TEXT,           -- optional; chosen during booking
    doctor_name         TEXT,           -- snapshot at insert time

    -- Scheduling
    date                DATE        NOT NULL,
    time_slot           TEXT        NOT NULL,   -- e.g. "09:00 AM"

    -- Clinical notes
    reason              TEXT        NOT NULL,
    notes               TEXT,           -- updated by cancel / staff

    -- Lifecycle
    status              TEXT        NOT NULL DEFAULT 'PENDING'
        CONSTRAINT appointments_status_check
        CHECK (status IN ('PENDING','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW','RESCHEDULED')),

    -- Email delivery tracking
    booking_email_sent  BOOLEAN     NOT NULL DEFAULT FALSE,
    approval_email_sent BOOLEAN     NOT NULL DEFAULT FALSE,
    notification_logs   JSONB       NOT NULL DEFAULT '[]'::JSONB,

    -- Audit timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Indexes ────────────────────────────────────────────────────────────────

-- Patient look-ups (GET /appointments filters by user_id OR patient_email OR student_id)
CREATE INDEX IF NOT EXISTS idx_appointments_user_id
    ON public.appointments (user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_email
    ON public.appointments (patient_email);

CREATE INDEX IF NOT EXISTS idx_appointments_student_id
    ON public.appointments (student_id);

-- Availability check: date + time_slot for slot-conflict queries
CREATE INDEX IF NOT EXISTS idx_appointments_date_time_slot
    ON public.appointments (date, time_slot);

-- Status filtering (staff list, availability exclusion of CANCELLED/NO_SHOW)
CREATE INDEX IF NOT EXISTS idx_appointments_status
    ON public.appointments (status);

-- Doctor schedule look-ups
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id
    ON public.appointments (doctor_id);

-- ── 3. updated_at trigger ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_appointments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_appointments_updated_at();

-- ── 4. Row-Level Security ─────────────────────────────────────────────────────
-- The API routes use the service-role key (bypasses RLS), so these policies
-- guard direct client access only. They use app_metadata.role (set by the
-- backend) rather than user_metadata (which users can edit themselves).

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Students: read their own appointments (by user_id OR email)
DROP POLICY IF EXISTS "Students can view own appointments" ON public.appointments;
CREATE POLICY "Students can view own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
    (SELECT auth.uid())::TEXT = user_id
    OR (SELECT auth.jwt() ->> 'email') = patient_email
    OR UPPER(COALESCE((SELECT auth.jwt() -> 'app_metadata' ->> 'role'), ''))
        IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
);

-- Students: insert only rows that belong to themselves
DROP POLICY IF EXISTS "Students can create appointments" ON public.appointments;
CREATE POLICY "Students can create appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.uid())::TEXT = user_id
    OR (SELECT auth.jwt() ->> 'email') = patient_email
);

-- Students: cancel their own; staff: update any
DROP POLICY IF EXISTS "Staff can update appointments" ON public.appointments;
CREATE POLICY "Staff can update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
    UPPER(COALESCE((SELECT auth.jwt() -> 'app_metadata' ->> 'role'), ''))
        IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
    OR (SELECT auth.uid())::TEXT = user_id
    OR (SELECT auth.jwt() ->> 'email') = patient_email
)
WITH CHECK (
    UPPER(COALESCE((SELECT auth.jwt() -> 'app_metadata' ->> 'role'), ''))
        IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
    OR (SELECT auth.uid())::TEXT = user_id
    OR (SELECT auth.jwt() ->> 'email') = patient_email
);

-- ── 5. Grants ─────────────────────────────────────────────────────────────────
-- authenticated: for any future direct-client access path
-- service_role:  for the Next.js API routes (uses SUPABASE_SERVICE_ROLE_KEY)

GRANT SELECT, INSERT, UPDATE
    ON TABLE public.appointments
    TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.appointments
    TO service_role;

-- ── 6. Verify insert + read-back (canary) ────────────────────────────────────
-- Inserts a test row, reads it back with STRICT, then deletes it.
-- If any step fails the whole block raises an exception — you will NOT see
-- "Migration verification PASSED" and must fix the error before deploying.

DO $$
DECLARE
    v_id   UUID;
    v_row  public.appointments%ROWTYPE;
BEGIN
    INSERT INTO public.appointments (
        patient_email, service_id, date, time_slot, reason, status
    )
    VALUES (
        'migration-canary@ug.edu.gh',
        'migration-test',
        CURRENT_DATE,
        '00:00 AM',
        'Migration verification — safe to delete',
        'PENDING'
    )
    RETURNING id INTO v_id;

    SELECT * INTO STRICT v_row
    FROM public.appointments
    WHERE id = v_id;

    DELETE FROM public.appointments WHERE id = v_id;

    RAISE NOTICE 'appointments table verification PASSED (canary id=%)', v_id;
END;
$$;

-- ── 7. Reload PostgREST schema cache ─────────────────────────────────────────
-- Tells PostgREST to re-introspect public.appointments immediately so the
-- Data API resolves the table without a server restart.

NOTIFY pgrst, 'reload schema';

