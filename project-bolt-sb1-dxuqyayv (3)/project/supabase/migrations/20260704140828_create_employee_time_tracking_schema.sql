/*
# Restaurant Employee Time Tracking Schema

## Purpose
Single-tenant app for a restaurant owner to control entry/exit of employees,
track hours, calculate pay (monthly fixed vs hourly), program daily schedules
for hourly employees, and apply sanctions for lateness.

## Business Rules
- Categories: Chef, Ayudante de Cocina, Cocinera Encargada, Garzón.
- Contract types:
  - "mensual" (monthly): fixed entry/exit time, fixed monthly pay.
  - "hora" (hourly): must work a fixed block (default 11:30–15:00) for a fixed pay.
    If they don't fulfill that block, pay is calculated as overtime value per hour
    for hours worked outside the block.
- Hourly employees have a daily schedule (programmed per day) with a fixed
  arrival time. Arriving 10+ minutes late = 30 minute sanction deducted from
  their clocked time. Passing 30 minutes late = +5 extra minutes added to the
  30 minute sanction.

## New Tables

### employees
- id (uuid pk)
- name (text, not null)
- category (text, not null) — chef | ayudante_cocina | cocinera_encargada | garzon
- contract_type (text, not null) — mensual | hora
- monthly_salary (numeric) — for mensual employees, fixed pay per month
- hourly_rate (numeric) — for hora employees, value per hour (used for overtime
  and for when the fixed block isn't fulfilled)
- fixed_block_start (time) — default 11:30, fixed block start for hourly
- fixed_block_end (time) — default 15:00, fixed block end for hourly
- fixed_block_pay (numeric) — fixed pay when the hourly employee fulfills the block
- monthly_entry (time) — fixed entry time for monthly employees
- monthly_exit (time) — fixed exit time for monthly employees
- active (boolean, default true)
- created_at (timestamptz)

### schedules  (daily programmed schedule for hourly employees)
- id (uuid pk)
- employee_id (uuid fk -> employees)
- work_date (date, not null)
- scheduled_start (time, not null) — the time they are expected to arrive
- scheduled_end (time) — expected end (optional)
- notes (text)
- created_at (timestamptz)
- unique (employee_id, work_date)

### time_logs  (tiqueo — clock in / clock out)
- id (uuid pk)
- employee_id (uuid fk -> employees)
- work_date (date, not null)
- clock_in (timestamptz, not null)
- clock_out (timestamptz, nullable)
- schedule_id (uuid fk -> schedules, nullable) — link to the programmed schedule
- late_minutes (numeric) — minutes late vs scheduled start (hourly) or monthly entry
- sanction_minutes (numeric) — sanction minutes applied
- notes (text)
- created_at (timestamptz)

## Security
- Single-tenant, no auth. RLS enabled on all tables.
- Policies allow anon + authenticated full CRUD (data is intentionally shared
  by the single restaurant owner using the anon key).
*/

-- ===== employees =====
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('chef','ayudante_cocina','cocinera_encargada','garzon')),
  contract_type text NOT NULL CHECK (contract_type IN ('mensual','hora')),
  monthly_salary numeric(12,2),
  hourly_rate numeric(12,2),
  fixed_block_start time DEFAULT '11:30',
  fixed_block_end time DEFAULT '15:00',
  fixed_block_pay numeric(12,2),
  monthly_entry time,
  monthly_exit time,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_employees" ON employees;
CREATE POLICY "anon_select_employees" ON employees FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_employees" ON employees;
CREATE POLICY "anon_insert_employees" ON employees FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_employees" ON employees;
CREATE POLICY "anon_update_employees" ON employees FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_employees" ON employees;
CREATE POLICY "anon_delete_employees" ON employees FOR DELETE
  TO anon, authenticated USING (true);

-- ===== schedules =====
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  scheduled_start time NOT NULL,
  scheduled_end time,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (employee_id, work_date)
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_schedules" ON schedules;
CREATE POLICY "anon_select_schedules" ON schedules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_schedules" ON schedules;
CREATE POLICY "anon_insert_schedules" ON schedules FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_schedules" ON schedules;
CREATE POLICY "anon_update_schedules" ON schedules FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_schedules" ON schedules;
CREATE POLICY "anon_delete_schedules" ON schedules FOR DELETE
  TO anon, authenticated USING (true);

-- ===== time_logs =====
CREATE TABLE IF NOT EXISTS time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  clock_in timestamptz NOT NULL,
  clock_out timestamptz,
  schedule_id uuid REFERENCES schedules(id) ON DELETE SET NULL,
  late_minutes numeric(6,2) DEFAULT 0,
  sanction_minutes numeric(6,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_time_logs" ON time_logs;
CREATE POLICY "anon_select_time_logs" ON time_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_time_logs" ON time_logs;
CREATE POLICY "anon_insert_time_logs" ON time_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_time_logs" ON time_logs;
CREATE POLICY "anon_update_time_logs" ON time_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_time_logs" ON time_logs;
CREATE POLICY "anon_delete_time_logs" ON time_logs FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_time_logs_employee_date ON time_logs(employee_id, work_date);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(work_date);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active);
