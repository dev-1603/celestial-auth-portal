-- Add SSO to AuthMethodType enum (no-op if already present, e.g. from updated initial migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'AuthMethodType' AND e.enumlabel = 'SSO'
  ) THEN
    ALTER TYPE "AuthMethodType" ADD VALUE 'SSO';
  END IF;
END
$$;
