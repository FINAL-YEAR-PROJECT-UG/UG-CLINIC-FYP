-- Staff-managed appointment slots used by the Supabase-backed API routes.
CREATE TABLE IF NOT EXISTS public.time_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  doctor_id    TEXT NOT NULL,
  doctor_name  TEXT,
  service_id   TEXT,
  service_name TEXT,
  capacity     INTEGER NOT NULL DEFAULT 1 CHECK (capacity >= 0),
  booked_count INTEGER NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
  status       TEXT NOT NULL DEFAULT 'AVAILABLE'
                 CHECK (status IN ('AVAILABLE', 'UNAVAILABLE', 'BOOKED')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_time_slots_date_start
  ON public.time_slots (date, start_time);

CREATE INDEX IF NOT EXISTS idx_time_slots_doctor_date
  ON public.time_slots (doctor_id, date);

CREATE INDEX IF NOT EXISTS idx_time_slots_status
  ON public.time_slots (status);

CREATE OR REPLACE FUNCTION public.set_time_slots_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_time_slots_updated_at ON public.time_slots;
CREATE TRIGGER trg_time_slots_updated_at
  BEFORE UPDATE ON public.time_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_time_slots_updated_at();

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.time_slots TO service_role;

NOTIFY pgrst, 'reload schema';
