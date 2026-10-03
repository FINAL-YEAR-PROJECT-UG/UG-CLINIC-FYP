-- =============================================================================
-- Migration: 20261003000000_create_profiles_table
-- Creates public.profiles as the authorization source of truth for user roles.
-- Safe to re-run (idempotent via IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'STUDENT'
                  CHECK (role IN ('STUDENT', 'ADMIN', 'DOCTOR', 'RECEPTIONIST')),
  first_name    TEXT,
  last_name     TEXT,
  phone         TEXT,
  student_id    TEXT,
  doctor_status TEXT CHECK (doctor_status IN ('AVAILABLE', 'BUSY', 'ON_LEAVE')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_lower_email
  ON public.profiles (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles (role);

CREATE INDEX IF NOT EXISTS idx_profiles_student_id
  ON public.profiles (student_id)
  WHERE student_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_doctor_status
  ON public.profiles (doctor_status)
  WHERE doctor_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_is_active
  ON public.profiles (is_active);

-- ---------------------------------------------------------------------------
-- 2. UPDATED_AT TRIGGER
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profiles_updated_at();

-- ---------------------------------------------------------------------------
-- 3. ONE-TIME BACKFILL from auth.users -> public.profiles
--    Reads app_metadata.role as the authoritative role source.
--    Idempotent: ON CONFLICT (id) DO NOTHING.
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (
  id,
  email,
  role,
  first_name,
  last_name,
  phone,
  student_id,
  is_active,
  created_at
)
SELECT
  au.id,
  au.email,
  COALESCE(
    NULLIF(UPPER(au.raw_app_meta_data->>'role'), ''),
    NULLIF(UPPER(au.raw_user_meta_data->>'role'), ''),
    'STUDENT'
  ),
  NULLIF(TRIM(au.raw_user_meta_data->>'firstName'), ''),
  NULLIF(TRIM(au.raw_user_meta_data->>'lastName'), ''),
  NULLIF(TRIM(au.raw_user_meta_data->>'phone'), ''),
  NULLIF(TRIM(au.raw_user_meta_data->>'studentId'), ''),
  true,
  au.created_at
FROM auth.users au
WHERE au.email IS NOT NULL
  AND COALESCE(
        NULLIF(UPPER(au.raw_app_meta_data->>'role'), ''),
        NULLIF(UPPER(au.raw_user_meta_data->>'role'), ''),
        'STUDENT'
      ) IN ('STUDENT', 'ADMIN', 'DOCTOR', 'RECEPTIONIST')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles read policy"    ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy"   ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete policy"   ON public.profiles;

CREATE POLICY "Profiles read policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR (auth.jwt()->'app_metadata'->>'role') IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
  );

CREATE POLICY "Users insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND role = 'STUDENT'
  );

CREATE POLICY "Profiles update policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->'app_metadata'->>'role') = 'ADMIN'
    OR (
      (auth.jwt()->'app_metadata'->>'role') IN ('DOCTOR', 'RECEPTIONIST')
      AND role = 'STUDENT'
    )
    OR id = auth.uid()
  )
  WITH CHECK (
    (auth.jwt()->'app_metadata'->>'role') = 'ADMIN'
    OR (
      (auth.jwt()->'app_metadata'->>'role') IN ('DOCTOR', 'RECEPTIONIST')
      AND role = 'STUDENT'
    )
    OR (
      id = auth.uid()
      AND role = (SELECT role FROM public.profiles p2 WHERE p2.id = auth.uid())
    )
  );

CREATE POLICY "Profiles delete policy"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- 5. COLUMN-LEVEL GRANTS (defense-in-depth)
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT (id, email, role, first_name, last_name, phone, student_id, is_active)
  ON public.profiles TO authenticated;
GRANT UPDATE (first_name, last_name, phone, student_id)
  ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ---------------------------------------------------------------------------
-- 6. DB-LEVEL SYNC TRIGGER (OPTIONAL / COMMENTED OUT)
--    Route handlers do the upsert in application code instead.
-- ---------------------------------------------------------------------------
-- CREATE OR REPLACE FUNCTION public.sync_profile_on_auth_user_change()
-- RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, email, role, first_name, last_name)
--   VALUES (
--     NEW.id,
--     NEW.email,
--     COALESCE(NULLIF(UPPER(NEW.raw_app_meta_data->>'role'),''), 'STUDENT'),
--     NULLIF(TRIM(NEW.raw_user_meta_data->>'firstName'), ''),
--     NULLIF(TRIM(NEW.raw_user_meta_data->>'lastName'), '')
--   )
--   ON CONFLICT (id) DO UPDATE SET
--     email      = EXCLUDED.email,
--     role       = EXCLUDED.role,
--     first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
--     last_name  = COALESCE(EXCLUDED.last_name,  profiles.last_name),
--     updated_at = now();
--   RETURN NEW;
-- END;
-- $$;
-- DROP TRIGGER IF EXISTS trg_sync_profile ON auth.users;
-- CREATE TRIGGER trg_sync_profile
--   AFTER INSERT OR UPDATE ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.sync_profile_on_auth_user_change();

-- ---------------------------------------------------------------------------
-- 7. CANARY VERIFICATION
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  col_count INT;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles'
    AND column_name IN ('id','email','role','doctor_status','is_active');
  IF col_count < 5 THEN
    RAISE EXCEPTION 'profiles table schema verification failed: expected 5 key columns, found %', col_count;
  END IF;
  RAISE NOTICE 'public.profiles migration verified OK (% key columns present)', col_count;
END;
$$;

NOTIFY pgrst, 'reload schema';
