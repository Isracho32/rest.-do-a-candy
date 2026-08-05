/*
# Create fines (multas) table

## Purpose
The employer can register fines per employee per day for infractions such as
breaking things, burning food, or not wearing uniform. Fines are deducted from
pay in reports.

## New Table: fines
- id (uuid pk)
- employee_id (uuid fk -> employees, cascade delete)
- work_date (date, not null) — the day the fine was issued
- reason (text, not null) — description of the infraction
- amount (numeric(12,2), not null) — fine amount in Bs
- created_at (timestamptz)

## Security
- Single-tenant, no auth. RLS enabled, anon + authenticated full CRUD.
*/

CREATE TABLE IF NOT EXISTS fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  reason text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_fines" ON fines;
CREATE POLICY "anon_select_fines" ON fines FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_fines" ON fines;
CREATE POLICY "anon_insert_fines" ON fines FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_fines" ON fines;
CREATE POLICY "anon_update_fines" ON fines FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_fines" ON fines;
CREATE POLICY "anon_delete_fines" ON fines FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_fines_employee_date ON fines(employee_id, work_date);
CREATE INDEX IF NOT EXISTS idx_fines_date ON fines(work_date);
