import { useEffect, useState } from 'react';
import { supabase, type Holiday } from '../lib/supabase';
import { fmtDate, todayStr } from '../lib/payroll';
import { Plus, Trash2, CalendarHeart, X } from 'lucide-react';

export default function Holidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('holidays').select('*').order('holiday_date');
    setHolidays(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!date || !name) { alert('Completa la fecha y el nombre del feriado.'); return; }
    setSaving(true);
    const { error } = await supabase.from('holidays').insert({ holiday_date: date, name });
    setSaving(false);
    if (error) { alert('Error: ' + error.message); return; }
    setShowForm(false);
    setDate(todayStr());
    setName('');
    load();
  }

  async function remove(h: Holiday) {
    if (!confirm(`¿Eliminar el feriado "${h.name}"?`)) return;
    await supabase.from('holidays').delete().eq('id', h.id);
    load();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="section-title">Feriados</h2>
          <p className="text-wood-500 text-sm mt-1">Días feriados — los empleados mensuales que trabajan reciben pago doble</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={18} /> Agregar Feriado
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-wood-400">Cargando...</div>
      ) : holidays.length === 0 ? (
        <div className="text-center py-16 text-wood-400">
          <CalendarHeart size={40} className="mx-auto mb-3 opacity-40" />
          <p>No hay feriados registrados</p>
        </div>
      ) : (
        <div className="grid gap-3 xs:grid-cols-2 lg:grid-cols-3">
          {holidays.map((h) => (
            <div key={h.id} className="card p-4 flex items-center justify-between hover:shadow-md hover:border-wood-300 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-ember-50 text-ember-600 flex items-center justify-center shrink-0">
                  <CalendarHeart size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-wood-900 truncate">{h.name}</p>
                  <p className="text-xs text-wood-500">{fmtDate(h.holiday_date)}</p>
                </div>
              </div>
              <button onClick={() => remove(h)} className="p-1.5 rounded-lg hover:bg-ember-50 text-ember-500 transition shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-wood-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-cream-50 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-wood-100">
              <h3 className="font-serif text-xl font-bold text-wood-900">Nuevo Feriado</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-wood-50 text-wood-500"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-wood-700 mb-1.5">Fecha</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-wood-700 mb-1.5">Nombre del feriado</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Día del Trabajo" className="input" />
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
