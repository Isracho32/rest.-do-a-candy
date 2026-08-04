import { useEffect, useState } from 'react';
import { supabase, type Employee, type Fine } from '../lib/supabase';
import { todayStr, fmtDate, fmtBs } from '../lib/payroll';
import { Plus, Trash2, AlertOctagon, X } from 'lucide-react';

export default function Fines() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selEmp, setSelEmp] = useState('');
  const [date, setDate] = useState(todayStr());
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: emps }, { data: fns }] = await Promise.all([
      supabase.from('employees').select('*').eq('active', true).order('name'),
      supabase.from('fines').select('*').order('work_date', { ascending: false }),
    ]);
    setEmployees(emps ?? []);
    setFines(fns ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!selEmp || !reason || !amount) { alert('Completa todos los campos.'); return; }
    setSaving(true);
    const { error } = await supabase.from('fines').insert({
      employee_id: selEmp,
      work_date: date,
      reason,
      amount: parseFloat(amount),
    });
    setSaving(false);
    if (error) { alert('Error: ' + error.message); return; }
    setShowForm(false);
    setSelEmp(''); setReason(''); setAmount('');
    load();
  }

  async function remove(f: Fine) {
    if (!confirm('¿Eliminar esta multa?')) return;
    await supabase.from('fines').delete().eq('id', f.id);
    load();
  }

  function empName(id: string) {
    return employees.find((e) => e.id === id)?.name ?? 'Desconocido';
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="section-title">Multas</h2>
          <p className="text-wood-500 text-sm mt-1">Descuentos aplicados a empleados</p>
        </div>
        <button
          onClick={() => { setSelEmp(''); setReason(''); setAmount(''); setShowForm(true); }}
          className="btn-primary"
        >
          <Plus size={18} /> Nueva Multa
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-wood-400">Cargando...</div>
      ) : fines.length === 0 ? (
        <div className="text-center py-16 text-wood-400">
          <AlertOctagon size={40} className="mx-auto mb-3 opacity-40" />
          <p>No hay multas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fines.map((f) => (
            <div key={f.id} className="card p-4 flex items-center justify-between hover:shadow-md transition">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-ember-50 text-ember-600 flex items-center justify-center shrink-0">
                  <AlertOctagon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-wood-900 truncate">{empName(f.employee_id)}</p>
                  <p className="text-xs text-wood-500 truncate">{f.reason} · {fmtDate(f.work_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-ember-600 font-bold text-sm">{fmtBs(f.amount)}</span>
                <button onClick={() => remove(f)} className="p-1.5 rounded-lg hover:bg-ember-50 text-ember-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-wood-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-cream-50 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-wood-100">
              <h3 className="font-serif text-xl font-bold text-wood-900">Nueva Multa</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-wood-50 text-wood-500"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-wood-700 mb-1.5">Empleado</label>
                <select value={selEmp} onChange={(e) => setSelEmp(e.target.value)} className="input">
                  <option value="">Seleccionar...</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-wood-700 mb-1.5">Fecha</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-wood-700 mb-1.5">Motivo</label>
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: Llegada tarde" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-wood-700 mb-1.5">Monto (Bs)</label>
                <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="20" className="input" />
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
