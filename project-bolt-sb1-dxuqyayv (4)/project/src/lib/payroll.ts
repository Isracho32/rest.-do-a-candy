export function calcSanction(lateMinutes: number): number {
  if (lateMinutes < 10) return 0;
  if (lateMinutes < 30) return 30;
  return 35;
}

export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export function lateMinutes(clockIn: Date, scheduledStart: string): number {
  const [sh, sm] = scheduledStart.split(':').map(Number);
  const scheduled = new Date(clockIn);
  scheduled.setHours(sh, sm, 0, 0);
  const diff = (clockIn.getTime() - scheduled.getTime()) / 60000;
  return diff > 0 ? Math.round(diff) : 0;
}

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

export function fmtDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fmtBs(n: number): string {
  return `Bs ${Math.floor(n).toLocaleString('es-BO')}`;
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function workedMinutes(clockIn: string, clockOut: string | null): number {
  if (!clockOut) return 0;
  const start = new Date(clockIn).getTime();
  const end = new Date(clockOut).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function timeToMinutesFromTs(ts: string): number {
  const d = new Date(ts);
  return d.getHours() * 60 + d.getMinutes();
}

export function addMinutesToTime(t: string, mins: number): string {
  const [h, m] = t.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}
