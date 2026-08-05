/*
# Add monthly overtime rate and holidays table

1. Modified Tables
- `employees`: add column `monthly_overtime_rate` (numeric, nullable)
  - For monthly employees, the value per hour for overtime worked outside
    their regular entry/exit schedule.
- `employees`: add column `monthly_exit` already exists — no change needed.

2. New Tables
- `holidays`: stores national/departmental holidays for the restaurant.
  - `id` (uuid, primary key)
  - `holiday_date` (date, not null, unique) — the date of the holiday
  - `name` (text, not null) — descriptive name (e.g. "Día del Trabajo")
  - `created_at` (timestamptz)

3. Security
- RLS enabled on `holidays`.
- Policies allow anon + authenticated full CRUD (single-tenant, no auth).

4. Business Rules
- Monthly employees: same 10-minute late rule as hourly. When late 10+ min,
  30 minutes of sanction are added to their exit time (they leave 30 min later).
- If a monthly employee works beyond their scheduled exit (adjusted for late
  sanction extension), those extra minutes are paid as overtime at
  `monthly_overtime_rate` per hour.
- On holidays, monthly employees who work receive double pay for the day
  (an additional day's worth of pay: monthly_salary / 30).
- Holidays are respected: the owner registers them in the Holidays tab.
*/

-- Add monthly_overtime_rate to employees
DO $$ BEGIN
  ALTER TABLE employees ADD COLUMN monthly_overtime_rate numeric(12,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ===== holidays =====
CREATE TABLE IF NOT EXISTS holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date date NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_holidays" ON holidays;
CREATE POLICY "anon_select_holidays" ON holidays FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_holidays" ON holidays;
CREATE POLICY "anon_insert_holidays" ON holidays FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_holidays" ON holidays;
CREATE POLICY "anon_update_holidays" ON holidays FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_holidays" ON holidays;
CREATE POLICY "anon_delete_holidays" ON holidays FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(holiday_date);
