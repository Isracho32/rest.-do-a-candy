/*
# Enforce one time log per employee per day

## Purpose
An employee can only have a single tiqueo (time_log) per day. The app
prevents duplicate entries in the UI, but we add a DB-level unique constraint
to guarantee integrity even with concurrent requests.

## Changes
- Add UNIQUE constraint on time_logs (employee_id, work_date).
- Idempotent: uses DO block to check before creating.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_time_log_employee_day'
  ) THEN
    ALTER TABLE time_logs
      ADD CONSTRAINT uniq_time_log_employee_day UNIQUE (employee_id, work_date);
  END IF;
END $$;
