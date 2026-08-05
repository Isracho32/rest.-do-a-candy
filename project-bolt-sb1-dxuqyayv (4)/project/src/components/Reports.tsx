import { useEffect, useState, useMemo } from 'react';
import { supabase, type Employee, type TimeLog, type Fine, type Holiday, CATEGORY_LABELS, CONTRACT_LABELS } from '../lib/supabase';
import { workedMinutes, minutesBetween, fmtBs, fmtDate, timeToMinutes, timeToMinutesFromTs, addMinutesToTime } from '../lib/payroll';
import { Download, Calendar, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';

type Period = 'week' | 'month' | 'year';

interface DayDetail {
  date: string;
  log: TimeLog | null;
  worked: number;
  overtime: number;
  pay: number;
  transport: number;
  sanction: number;
  late: number;
  fines: number;
  fineList: Fine[];
  isHoliday: boolean;
  holidayPay: number;
}

interface RowData {
  employee: Employee;
  days: DayDetail[];
  totalMinutes: number;
  totalOvertime: number;
  totalPay: number;
  totalTransport: number;
  totalSanction: number;
  totalLate: number;
  totalFines: number;
  totalHolidayPay: number;
  daysWorked: number;
}

export default function Reports() {
  const [period, setPeriod] = useState<Period>('week');
  const [refDate, setRefDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { from, to, label } = useMemo(() => rangeFor(period, refDate), [period, refDate]);

  async function load() {
    setLoading(true);
    const [{ data: emps }, { data: lgs }, { data: fns }, { data: hols }] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('time_logs').select('*').gte('work_date', from).lte('work_date', to),
      supabase.from('fines').select('*').gte('work_date', from).lte('work_date', to),
      supabase.from('holidays').select('*').gte('holiday_date', from).lte('holiday_date', to),
    ]);
    setEmployees(emps ?? []);
    setLogs(lgs ?? []);
    setFines(fns ?? []);
    setHolidays(hols ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [from, to]);

  function shiftRef(days: number) {
    const d = new Date(refDate);
    if (period === 'week') d.setDate(d.getDate() + days * 7);
    else if (period === 'month') d.setMonth(d.getMonth() + days);
    else d.setFullYear(d.getFullYear() + days);
    setRefDate(d.toISOString().slice(0, 10));
  }

  const rows = useMemo(() => buildRows(employees, logs, fines, holidays), [employees, logs, fines, holidays]);
  const totalPay = rows.reduce((s, r) => s + r.totalPay, 0);
  const totalTransport = rows.reduce((s, r) => s + r.totalTransport, 0);
  const totalFines = rows.reduce((s, r) => s + r.totalFines, 0);
  const totalHolidayPay = rows.reduce((s, r) => s + r.totalHolidayPay, 0);
  const grandTotal = totalPay + totalTransport + totalHolidayPay - totalFines;

  function shareWhatsApp(r: RowData) {
    const emp = r.employee;
    const net = Math.floor(r.totalPay + r.totalTransport + r.totalHolidayPay - r.totalFines);
    const lines: string[] = [];
    lines.push(`*Detalle de Pago*`);
    lines.push(`Empleada: ${emp.name}`);
    lines.push(`Período: ${label}`);
    lines.push('');
    lines.push(`Días trabajados: ${r.daysWorked}`);
    lines.push(`Horas totales: ${(r.totalMinutes / 60).toFixed(1)}h`);
    if (r.totalOvertime > 0) lines.push(`Horas extra: ${(r.totalOvertime / 60).toFixed(1)}h`);
    if (r.totalLate > 0) lines.push(`Minutos tarde: ${r.totalLate}m`);
    if (r.totalSanction > 0) lines.push(`Sanciones: ${r.totalSanction}m`);
    lines.push('');
    lines.push(`Sueldo: Bs ${Math.floor(r.totalPay)}`);
    lines.push(`Pasajes: Bs ${Math.floor(r.totalTransport)}`);
    if (r.totalHolidayPay > 0) lines.push(`Feriados: Bs ${Math.floor(r.totalHolidayPay)}`);
    if (r.totalFines > 0) lines.push(`Multas: -Bs ${Math.floor(r.totalFines)}`);
    lines.push('');
    lines.push(`*Total a pagar: Bs ${net}*`);
    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  function shareAllWhatsApp() {
    const lines: string[] = [];
    lines.push(`*Detalle de Pagos*`);
    lines.push(`Período: ${label}`);
    lines.push('');
    rows.forEach((r) => {
      const net = Math.floor(r.totalPay + r.totalTransport + r.totalHolidayPay - r.totalFines);
      lines.push(`${r.employee.name}: Bs ${net} (${r.daysWorked} días)`);
    });
    lines.push('');
    lines.push(`*Total general: Bs ${Math.floor(grandTotal)}*`);
    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  function exportCSV() {
    const headers = ['Nombre', 'Categoría', 'Contrato', 'Días', 'Horas', 'Horas extra', 'Min tarde', 'Min sanción', 'Pago', 'Pasajes', 'Feriados', 'Multas', 'Total'];
    const lines = rows.map((r) => [
      r.employee.name,
      CATEGORY_LABELS[r.employee.category],
      CONTRACT_LABELS[r.employee.contract_type],
      r.daysWorked,
      (r.totalMinutes / 60).toFixed(1),
      (r.totalOvertime / 60).toFixed(1),
      r.totalLate,
      r.totalSanction,
      Math.round(r.totalPay),
      Math.round(r.totalTransport),
      Math.round(r.totalHolidayPay),
      Math.round(r.totalFines),
      Math.round(r.totalPay + r.totalTransport + r.totalHolidayPay - r.totalFines),
    ]);
    const csv = [headers, ...lines].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${from}_a_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="section-title">Reportes y Pago</h2>
          <p className="text-wood-500 text-sm mt-1">{label}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={shareAllWhatsApp} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition">
            <Share2 size={16} /> WhatsApp
          </button>
          <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-wood-800 hover:bg-wood-900 text-white text-sm font-medium transition">
            <Download size={16} /> CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="inline-flex rounded-xl border border-wood-200 bg-white p-1">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${period === p ? 'bg-ember-600 text-white shadow-sm' : 'text-wood-600 hover:bg-wood-50'}`}
            >
              {p === 'week' ? 'Semanal' : p === 'month' ? 'Mensual' : 'Anual'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shiftRef(-1)} className="p-2.5 rounded-xl border border-wood-200 bg-white hover:bg-wood-50 transition"><ChevronLeft size={18} /></button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-wood-200 bg-white">
            <Calendar size={16} className="text-wood-400" />
            <input type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} className="text-sm focus:outline-none bg-transparent" />
          </div>
          <button onClick={() => shiftRef(1)} className="p-2.5 rounded-xl border border-wood-200 bg-white hover:bg-wood-50 transition"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total a pagar" value={fmtBs(grandTotal)} accent="ember" />
        <StatCard label="Sueldos" value={fmtBs(totalPay)} accent="emerald" />
        <StatCard label="Pasajes" value={fmtBs(totalTransport)} accent="blue" />
        <StatCard label="Multas" value={fmtBs(totalFines)} accent="ember" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-wood-400">Cargando...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-wood-400">Sin datos para este período</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.employee.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === r.employee.id ? null : r.employee.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-wood-50/50 transition text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-wood-200 text-wood-800 flex items-center justify-center text-sm font-semibold shrink-0">
                    {r.employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-wood-900 truncate">{r.employee.name}</p>
                    <p className="text-xs text-wood-500">{CATEGORY_LABELS[r.employee.category]} · {CONTRACT_LABELS[r.employee.contract_type]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-wood-400">{r.daysWorked} días · {(r.totalMinutes / 60).toFixed(1)}h</p>
                    <p className="text-xs text-wood-400">Pasajes {fmtBs(r.totalTransport)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-wood-900">{fmtBs(r.totalPay + r.totalTransport + r.totalHolidayPay - r.totalFines)}</p>
                    <p className="text-[10px] sm:text-xs text-wood-400">{fmtBs(r.totalPay)} + {fmtBs(r.totalTransport)}{r.totalHolidayPay > 0 ? ` +${fmtBs(r.totalHolidayPay)}` : ''}{r.totalFines > 0 ? ` -${fmtBs(r.totalFines)}` : ''}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); shareWhatsApp(r); }}
                    className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                    title="Enviar por WhatsApp"
                  >
                    <Share2 size={16} />
                  </button>
                  <ChevronRight size={18} className={`text-wood-400 transition-transform ${expanded === r.employee.id ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {expanded === r.employee.id && (
                <div className="border-t border-wood-100 overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="bg-wood-50 text-wood-500 text-xs uppercase tracking-wide">
                        <th className="text-left px-4 py-2.5 font-semibold">Día</th>
                        <th className="text-center px-4 py-2.5 font-semibold">Entrada</th>
                        <th className="text-center px-4 py-2.5 font-semibold">Salida</th>
                        <th className="text-center px-4 py-2.5 font-semibold">Horas</th>
                        <th className="text-center px-4 py-2.5 font-semibold">Extra</th>
                        <th className="text-center px-4 py-2.5 font-semibold">Tarde</th>
                        <th className="text-center px-4 py-2.5 font-semibold">Sanción</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Pago</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Pasajes</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Multas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-wood-100">
                      {r.days.map((d) => (
                        <tr key={d.date} className={d.log ? '' : 'opacity-40'}>
                          <td className="px-4 py-2.5 text-wood-700 whitespace-nowrap">
                            {fmtDate(d.date)}
                            {d.isHoliday && <span className="ml-1.5 text-[10px] font-semibold text-ember-600 bg-ember-50 px-1.5 py-0.5 rounded">FERIADO</span>}
                          </td>
                          <td className="px-4 py-2.5 text-center text-wood-600">{d.log ? fmtTimeShort(d.log.clock_in) : '—'}</td>
                          <td className="px-4 py-2.5 text-center text-wood-600">{d.log?.clock_out ? fmtTimeShort(d.log.clock_out) : '—'}</td>
                          <td className="px-4 py-2.5 text-center text-wood-700">{d.log ? (d.worked / 60).toFixed(1) : '—'}</td>
                          <td className="px-4 py-2.5 text-center">{d.overtime > 0 ? <span className="text-gold-600 font-medium">{(d.overtime / 60).toFixed(1)}h</span> : '—'}</td>
                          <td className="px-4 py-2.5 text-center">{d.late > 0 ? <span className="text-gold-600">{d.late}m</span> : '—'}</td>
                          <td className="px-4 py-2.5 text-center">{d.sanction > 0 ? <span className="text-ember-500">{d.sanction}m</span> : '—'}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-wood-900 whitespace-nowrap">
                            {d.log ? fmtBs(d.pay) : '—'}
                            {d.holidayPay > 0 && <div className="text-[10px] text-ember-600">+{fmtBs(d.holidayPay)} feriado</div>}
                          </td>
                          <td className="px-4 py-2.5 text-right text-wood-600">{d.log ? fmtBs(d.transport) : '—'}</td>
                          <td className="px-4 py-2.5 text-right">
                            {d.fines > 0 ? <span className="text-ember-600 font-medium">{fmtBs(d.fines)}</span> : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-wood-50 font-semibold text-wood-900">
                        <td className="px-4 py-2.5" colSpan={3}>Total</td>
                        <td className="px-4 py-2.5 text-center">{(r.totalMinutes / 60).toFixed(1)}h</td>
                        <td className="px-4 py-2.5 text-center">{(r.totalOvertime / 60).toFixed(1)}h</td>
                        <td className="px-4 py-2.5 text-center">{r.totalLate}m</td>
                        <td className="px-4 py-2.5 text-center">{r.totalSanction}m</td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">{fmtBs(r.totalPay)}{r.totalHolidayPay > 0 && <div className="text-[10px] text-ember-600">+{fmtBs(r.totalHolidayPay)}</div>}</td>
                        <td className="px-4 py-2.5 text-right">{fmtBs(r.totalTransport)}</td>
                        <td className="px-4 py-2.5 text-right">{r.totalFines > 0 ? fmtBs(r.totalFines) : '—'}</td>
                      </tr>
                    </tfoot>
                  </table>
                  {r.days.some((d) => d.fineList.length > 0) && (
                    <div className="p-4 bg-ember-50/30 border-t border-wood-100 space-y-1.5">
                      <p className="text-xs font-semibold text-ember-700 uppercase tracking-wide">Detalle de multas</p>
                      {r.days.flatMap((d) => d.fineList.map((f) => (
                        <div key={f.id} className="flex items-center justify-between text-sm">
                          <span className="text-wood-600"><span className="text-wood-400">{fmtDate(f.work_date)}:</span> {f.reason}</span>
                          <span className="text-ember-600 font-medium">{fmtBs(f.amount)}</span>
                        </div>
                      )))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
          <h4 className="font-semibold text-blue-900 text-sm mb-1">Empleados Mensuales</h4>
          <p className="text-sm text-blue-800/80">Salario fijo mensual. Al llegar 10+ min tarde, 30 min se adicionan a su hora de salida. Las horas fuera del horario se pagan como extra al valor designado. En feriados reciben pago doble. Las multas se descuentan.</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <h4 className="font-semibold text-emerald-900 text-sm mb-1">Empleados por Hora</h4>
          <p className="text-sm text-emerald-800/80">Si cumplen el bloque fijo cobran el pago fijo. Si no, se paga por horas efectivas a valor de hora extra, descontando sanciones. No reciben doble pago por feriados.</p>
        </div>
      </div>
    </div>
  );
}

function fmtTimeShort(ts: string): string {
  return new Date(ts).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function rangeFor(period: Period, ref: string): { from: string; to: string; label: string } {
  const d = new Date(ref + 'T00:00:00');
  if (period === 'week') {
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const from = monday.toISOString().slice(0, 10);
    const to = sunday.toISOString().slice(0, 10);
    return { from, to, label: `Semana del ${fmtDate(from)} al ${fmtDate(to)}` };
  }
  if (period === 'month') {
    const from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { from, to, label: d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }) };
  }
  const from = new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const to = new Date(d.getFullYear(), 11, 31).toISOString().slice(0, 10);
  return { from, to, label: `Año ${d.getFullYear()}` };
}

function buildRows(employees: Employee[], logs: TimeLog[], fines: Fine[], holidays: Holiday[]): RowData[] {
  const holidayDates = new Set(holidays.map((h) => h.holiday_date));

  return employees.map((emp) => {
    const empLogs = logs.filter((l) => l.employee_id === emp.id);
    const empFines = fines.filter((f) => f.employee_id === emp.id);
    const blockMins = minutesBetween(emp.fixed_block_start ?? '11:30', emp.fixed_block_end ?? '15:00');
    const transportPerDay = emp.daily_transport ?? 0;
    const monthlyDailyRate = emp.contract_type === 'mensual' ? (emp.monthly_salary ?? 0) / 30 : 0;

    const allDates = [...new Set([...empLogs.map((l) => l.work_date), ...empFines.map((f) => f.work_date)])].sort();
    const days: DayDetail[] = allDates.map((date) => {
      const log = empLogs.find((l) => l.work_date === date) ?? null;
      const dayFines = empFines.filter((f) => f.work_date === date);
      const dayFineTotal = dayFines.reduce((s, f) => s + f.amount, 0);
      const isHoliday = holidayDates.has(date);

      if (!log || !log.clock_out) {
        return { date, log, worked: 0, overtime: 0, pay: 0, transport: 0, sanction: 0, late: 0, fines: dayFineTotal, fineList: dayFines, isHoliday, holidayPay: 0 };
      }
      const worked = workedMinutes(log.clock_in, log.clock_out);
      const sanction = log.sanction_minutes ?? 0;
      const late = log.late_minutes ?? 0;
      const effective = worked - sanction;

      let pay = 0;
      let overtime = 0;
      let holidayPay = 0;

      if (emp.contract_type === 'mensual') {
        const exitTime = emp.monthly_exit ?? '18:00';
        const extendedExit = late >= 10 ? addMinutesToTime(exitTime, 30) : exitTime;
        const scheduledExitMins = timeToMinutes(extendedExit);
        const clockOutMins = timeToMinutesFromTs(log.clock_out);
        if (clockOutMins > scheduledExitMins) {
          overtime = clockOutMins - scheduledExitMins;
          pay = (overtime / 60) * (emp.monthly_overtime_rate ?? 0);
        }
        if (isHoliday) {
          holidayPay = monthlyDailyRate;
        }
      } else {
        const fulfilled = effective >= blockMins;
        if (fulfilled) {
          pay = emp.fixed_block_pay ?? 0;
          if (effective > blockMins) overtime = effective - blockMins;
        } else {
          pay = (effective / 60) * (emp.hourly_rate ?? 0);
          overtime = Math.max(0, worked - blockMins);
        }
      }
      return { date, log, worked, overtime, pay, transport: transportPerDay, sanction, late, fines: dayFineTotal, fineList: dayFines, isHoliday, holidayPay };
    });

    const totalMinutes = days.reduce((s, d) => s + d.worked, 0);
    const totalOvertime = days.reduce((s, d) => s + d.overtime, 0);
    const totalPay = emp.contract_type === 'mensual'
      ? (emp.monthly_salary ?? 0) + days.reduce((s, d) => s + d.pay, 0)
      : days.reduce((s, d) => s + d.pay, 0);
    const totalTransport = days.filter((d) => d.log && d.log.clock_out).length * transportPerDay;
    const totalSanction = days.reduce((s, d) => s + d.sanction, 0);
    const totalLate = days.reduce((s, d) => s + d.late, 0);
    const totalFines = empFines.reduce((s, f) => s + f.amount, 0);
    const totalHolidayPay = days.reduce((s, d) => s + d.holidayPay, 0);
    const daysWorked = days.filter((d) => d.log && d.log.clock_out).length;

    return { employee: emp, days, totalMinutes, totalOvertime, totalPay, totalTransport, totalSanction, totalLate, totalFines, totalHolidayPay, daysWorked };
  });
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: 'ember' | 'emerald' | 'wood' | 'blue' }) {
  const colors = {
    ember: 'from-ember-500 to-ember-700',
    emerald: 'from-emerald-500 to-teal-500',
    wood: 'from-wood-600 to-wood-800',
    blue: 'from-blue-500 to-sky-500',
  };
  return (
    <div className={`rounded-2xl p-4 bg-gradient-to-br ${colors[accent]} text-white shadow-sm`}>
      <p className="text-white/80 text-xs">{label}</p>
      <p className="text-lg sm:text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
