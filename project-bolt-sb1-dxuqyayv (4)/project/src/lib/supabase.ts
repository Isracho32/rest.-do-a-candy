import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

export type Category = 'chef' | 'ayudante_cocina' | 'cocinera_encargada' | 'garzon';
export type ContractType = 'mensual' | 'hora';

export interface Employee {
  id: string;
  name: string;
  category: Category;
  contract_type: ContractType;
  monthly_salary: number | null;
  hourly_rate: number | null;
  fixed_block_start: string | null;
  fixed_block_end: string | null;
  fixed_block_pay: number | null;
  monthly_entry: string | null;
  monthly_exit: string | null;
  monthly_overtime_rate: number | null;
  daily_transport: number | null;
  active: boolean;
  created_at: string;
}

export interface Schedule {
  id: string;
  employee_id: string;
  work_date: string;
  scheduled_start: string;
  scheduled_end: string | null;
  notes: string | null;
  created_at: string;
}

export interface TimeLog {
  id: string;
  employee_id: string;
  work_date: string;
  clock_in: string;
  clock_out: string | null;
  schedule_id: string | null;
  late_minutes: number | null;
  sanction_minutes: number | null;
  notes: string | null;
  created_at: string;
}

export interface Fine {
  id: string;
  employee_id: string;
  work_date: string;
  reason: string;
  amount: number;
  created_at: string;
}

export interface Holiday {
  id: string;
  holiday_date: string;
  name: string;
  created_at: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  chef: 'Chef',
  ayudante_cocina: 'Ayudante de Cocina',
  cocinera_encargada: 'Cocinera Encargada',
  garzon: 'Garzón',
};

export const CONTRACT_LABELS: Record<ContractType, string> = {
  mensual: 'Mensual',
  hora: 'Por Hora',
};
