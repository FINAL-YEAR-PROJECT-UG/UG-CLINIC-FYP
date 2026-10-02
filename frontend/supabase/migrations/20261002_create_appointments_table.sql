-- Non-destructive: creates appointments storage for the Vercel app.
-- Run in the Supabase SQL Editor of the live project.

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    student_id TEXT,
    patient_name TEXT,
    patient_email TEXT NOT NULL,
    service_id TEXT NOT NULL,
    service_name TEXT,
    doctor_id TEXT,
    doctor_name TEXT,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    booking_email_sent BOOLEAN NOT NULL DEFAULT false,
    approval_email_sent BOOLEAN NOT NULL DEFAULT false,
    notification_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT appointments_status_check CHECK (
        status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED')
    )
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_email ON public.appointments(patient_email);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time_slot ON public.appointments(date, time_slot);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);

CREATE OR REPLACE FUNCTION public.set_appointments_updated_at()
RETURNS trigger
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

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Authorization uses app_metadata.role only (user_metadata is user-editable).
DROP POLICY IF EXISTS "Students can view own appointments" ON public.appointments;
CREATE POLICY "Students can view own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
    (select auth.uid())::text = user_id
    OR (select auth.jwt() ->> 'email') = patient_email
    OR upper(coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), ''))
        IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
);

DROP POLICY IF EXISTS "Students can create appointments" ON public.appointments;
CREATE POLICY "Students can create appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
    (select auth.uid())::text = user_id
    OR (select auth.jwt() ->> 'email') = patient_email
);

DROP POLICY IF EXISTS "Staff can update appointments" ON public.appointments;
CREATE POLICY "Staff can update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
    upper(coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), ''))
        IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
    OR (select auth.uid())::text = user_id
    OR (select auth.jwt() ->> 'email') = patient_email
)
WITH CHECK (
    upper(coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), ''))
        IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
    OR (select auth.uid())::text = user_id
    OR (select auth.jwt() ->> 'email') = patient_email
);

GRANT SELECT, INSERT, UPDATE ON TABLE public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.appointments TO service_role;
