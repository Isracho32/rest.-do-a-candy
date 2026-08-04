import { useEffect, useState } from 'react';
import { supabase, type Employee, type Schedule, CATEGORY_LABELS } from '../lib/supabase';
import { todayStr, fmtDate } from '../lib/payroll';
import { Plus, Trash2, CalendarDays, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Schedules() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayStr());
  const [showForm, setShowForm] = useState(false);
  const [selEmp, setSelEmp] = useState('');
  const [startTime, setStartTime] = useState('11:30');
  const [endTime, setEndTime] = useState('15:00');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: emps }, { data: schs }] = await Promise.all([
      supabase.from('employees').select('*').eq('active', true).order('name'),
      supabase.from('schedules').select('*').eq('work_date', date),
    ]);
    setEmployees(emps ?? []);
    setSchedules(schs ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [date]);

  async function save() {
    if (!selEmp) { alert('Selecciona un empleado.'); return; }
    setSaving(true);
    const { error } = await supabase.from('schedules').upsert({
      employee_id: selEmp,
      work_date: date,
      scheduled_start: startTime,
      scheduled_end: endTime || null,
    }, { onConflict: 'employee_id,work_date' });
    setSaving(false);
    if (error) { alert('Error: ' + error.message); return; }
    setShowForm(false);
    load();
  }

  async function remove(s: Schedule) {
    await supabase.from('schedules').delete().eq('id', s.id);
    load();
  }

  function shiftDate(days: number) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="section-title">Horarios</h2>
        <p className="text-wood-500 text-sm mt-1">Programar horarios de empleados por hora</p>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => shiftDate(-1)} className="p-2.5 rounded-xl border border-wood-200 bg-white hover:bg-wood-50 transition"><ChevronLeft size={18} /></button>
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-wood-200 bg-white">
          <CalendarDays size={16} className="text-wood-400" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 text-sm focus:outline-none bg-transparent" />
        </div>
        <button onClick={() => shiftDate(1)} className="p-2.5 rounded-xl border border-wood-200 bg-white hover:bg-wood-50 transition"><ChevronRight size={18} /></button>
      </div>

      <button
        onClick={() => { setSelEmp(''); setStartTime('11:30'); setEndTime('15:00'); setShowForm(true); }}
        className="btn-primary mb-5"
      >
        <Plus size={18} /> Asignar Horario
      </button>

      {loading ? (
        <div className="text-center py-12 text-wood-400">Cargando...</div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16 text-wood-400">
          <CalendarDays size={40} className="mx-auto mb-3 opacity-40" />
          <p>Sin horarios programados para {fmtDate(date)}</p>
        </div>
      ) : (
        <div className="grid gap-3 xs:grid-cols-2 lg:grid-cols-3">
          {schedules.map((s) => {
            const emp = employees.find((e) => e.id === s.employee_id);
            if (!emp) return null;
            return (
              <div key={s.id} className="card p-4 flex items-center justify-between hover:shadow-md transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-wood-100 text-wood-700 flex items-center justify-center shrink-0">
                    <CalendarDays size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-wood-900 truncate">{emp.name}</p>
                    <p className="text-xs text-wood-500">{CATEGORY_LABELS[emp.category]} · {s.scheduled_start}{s.scheduled_end ? ` a ${s.scheduled_end}` : ''}</p>
                  </div>
                </div>
                <button onClick={() => remove(s)} className="p-1.5 rounded-lg hover:bg-ember-50 text-ember-500 shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-wood-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-cream-50 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-wood-100">
              <h3 className="font-serif text-xl font-bold text-wood-900">Asignar Horario</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-wood-50 text-wood-500"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-wood-700 mb-1.5">Empleado</label>
                <select value={selEmp} onChange={(e) => setSelEmp(e.target.value)} className="input">
                  <option value="">Seleccionar...</option>
                  {employees.filter((e) => e.contract_type === 'hora').map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-wood-700 mb-1.5">Hora inicio</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-700 mb-1.5">Hora fin</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={save} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
