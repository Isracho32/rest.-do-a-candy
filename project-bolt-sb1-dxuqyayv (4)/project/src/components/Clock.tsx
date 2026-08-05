import { useEffect, useState, useCallback } from 'react';
import { supabase, type Employee, type TimeLog, type Schedule, CONTRACT_LABELS } from '../lib/supabase';
import { calcSanction, lateMinutes, fmtTime, todayStr } from '../lib/payroll';
import { Search, Clock as ClockIcon, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

export default function Clock() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [search, setSearch] = useState('');
  const [today, setToday] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ name: string; action: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const date = todayStr();
    setToday(date);
    const [{ data: emps }, { data: lgs }, { data: schs }] = await Promise.all([
      supabase.from('employees').select('*').eq('active', true).order('name'),
      supabase.from('time_logs').select('*').eq('work_date', date),
      supabase.from('schedules').select('*').eq('work_date', date),
    ]);
    setEmployees(emps ?? []);
    setLogs(lgs ?? []);
    setSchedules(schs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Midnight reset: reload data when the date changes
  useEffect(() => {
    function checkMidnight() {
      const now = todayStr();
      if (now !== today) {
        load();
      }
    }
    const interval = setInterval(checkMidnight, 30000);
    return () => clearInterval(interval);
  }, [today, load]);

  // Also reload when the tab becomes visible again
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') load();
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  function getLog(empId: string): TimeLog | undefined {
    return logs.find((l) => l.employee_id === empId);
  }

  function getScheduledStart(emp: Employee): string | null {
    const sch = schedules.find((s) => s.employee_id === emp.id);
    if (sch) return sch.scheduled_start;
    if (emp.contract_type === 'mensual') return emp.monthly_entry;
    return emp.fixed_block_start ?? '11:30';
  }

  async function clockIn(emp: Employee) {
    const now = new Date();
    const scheduled = getScheduledStart(emp);
    const late = scheduled ? lateMinutes(now, scheduled) : 0;
    const sanction = calcSanction(late);
    const { error } = await supabase.from('time_logs').insert({
      employee_id: emp.id,
      work_date: todayStr(),
      clock_in: now.toISOString(),
      late_minutes: late,
      sanction_minutes: sanction,
    });
    if (error) { alert('Error: ' + error.message); return; }
    setActionMsg({ name: emp.name, action: 'entrada' });
    setTimeout(() => setActionMsg(null), 3000);
    load();
  }

  async function clockOut(emp: Employee) {
    const log = getLog(emp.id);
    if (!log) return;
    const { error } = await supabase.from('time_logs')
      .update({ clock_out: new Date().toISOString() })
      .eq('id', log.id);
    if (error) { alert('Error: ' + error.message); return; }
    setActionMsg({ name: emp.name, action: 'salida' });
    setTimeout(() => setActionMsg(null), 3000);
    load();
  }

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="section-title">Tiqueo</h2>
        <p className="text-wood-500 text-sm mt-1">
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })} · {fmtTime(new Date())}
        </p>
      </div>

      <div className="relative mb-5">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-wood-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar empleado..."
          className="input pl-10 text-base"
        />
      </div>

      {actionMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 size={18} />
          {actionMsg.name} registró {actionMsg.action}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-wood-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-wood-400">
          <ClockIcon size={40} className="mx-auto mb-3 opacity-40" />
          <p>No hay empleados activos</p>
        </div>
      ) : (
        <div className="grid gap-3 xs:grid-cols-2 lg:grid-cols-3">
          {filtered.map((emp) => {
            const log = getLog(emp.id);
            const isActive = !!log && !log.clock_out;
            const isDone = !!log && !!log.clock_out;
            return (
              <div
                key={emp.id}
                className={`card p-4 transition-all ${
                  isActive ? 'border-emerald-300 shadow-md ring-2 ring-emerald-300/30' : isDone ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-emerald-100 text-emerald-700' : isDone ? 'bg-wood-100 text-wood-400' : 'bg-wood-100 text-wood-700'
                    }`}>
                      <ClockIcon size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-wood-900 truncate">{emp.name}</p>
                      <p className="text-xs text-wood-500">{CONTRACT_LABELS[emp.contract_type]}</p>
                    </div>
                  </div>
                  {log && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-wood-400">Entrada</p>
                      <p className="text-sm font-medium text-wood-700">{fmtTime(new Date(log.clock_in))}</p>
                      {log.late_minutes && log.late_minutes > 0 && (
                        <p className="text-[10px] text-amber-600 font-medium">{log.late_minutes}m tarde</p>
                      )}
                      {log.clock_out && (
                        <>
                          <p className="text-xs text-wood-400 mt-0.5">Salida</p>
                          <p className="text-sm font-medium text-wood-700">{fmtTime(new Date(log.clock_out))}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => (isActive ? clockOut(emp) : isDone ? null : clockIn(emp))}
                  disabled={isDone}
                  className={`mt-3 w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-ember-600 hover:bg-ember-700 text-white shadow-md shadow-ember-700/30'
                      : isDone
                        ? 'bg-wood-100 text-wood-400 cursor-not-allowed'
                        : 'bg-wood-700 hover:bg-wood-800 text-white shadow-md shadow-wood-900/30'
                  }`}
                >
                  {isActive ? <><LogOut size={16} /> Registrar Salida</> : isDone ? <><CheckCircle2 size={16} /> Completado</> : <><LogIn size={16} /> Registrar Entrada</>}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-wood-400">
        Los tiqueos se reinician automáticamente a medianoche para el día siguiente.
      </p>
    </div>
  );
}
