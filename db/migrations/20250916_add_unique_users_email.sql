-- Migration: Add UNIQUE constraint/index for public.users(email) and optional users(auth_id)
-- Date: 2025-09-16
-- Instructions:
-- 1) Open Supabase SQL editor (or psql) and run the 'check duplicates' query below.
-- 2) If no duplicates are returned, run the 'create indexes' statements.
-- 3) If duplicates exist, decide how to dedupe (example dedupe provided).

-- CHECK FOR DUPLICATE EMAILS
SELECT email, COUNT(*) AS cnt
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1;

-- If the previous query returns zero rows, it's safe to create the unique index.
-- CREATE UNIQUE INDEX ON email (this will enforce uniqueness for future UPSERT ON CONFLICT (email)).
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON public.users (email);

-- OPTIONAL: create unique index on auth_id if you want to enforce one-to-one mapping
-- (only run if `auth_id` column exists and you have no duplicates)
-- Check for duplicates on auth_id
SELECT auth_id, COUNT(*) AS cnt
FROM public.users
WHERE auth_id IS NOT NULL
GROUP BY auth_id
HAVING COUNT(*) > 1;

-- If the previous query returns zero rows and the column exists, run:
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_id_unique_idx ON public.users (auth_id);

-- Example DEDUPE strategy (BE CAREFUL: run only after verifying results and backup your data).
-- This example keeps the lowest id for each email and removes other duplicates.
-- Preview which rows would be deleted:
-- SELECT id, email, rn FROM (
--   SELECT id, email, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
--   FROM public.users
-- ) t WHERE rn > 1;

-- To delete duplicates (run only after manual verification):
-- WITH duplicates AS (
--   SELECT id FROM (
--     SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
--     FROM public.users
--   ) t WHERE rn > 1
-- ) DELETE FROM public.users WHERE id IN (SELECT id FROM duplicates);

-- END OF MIGRATION
