/*
# Add daily transport allowance (pasajes) to employees

## Purpose
The employer sets a fixed daily transport value (pasajes) per employee.
This is paid per day worked and shown in detailed weekly reports.

## Changes
- ALTER TABLE employees: add column `daily_transport` numeric(12,2) DEFAULT 0
  (Bs per day worked).
- Non-destructive: new column only, no data loss.
*/

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS daily_transport numeric(12,2) DEFAULT 0;
