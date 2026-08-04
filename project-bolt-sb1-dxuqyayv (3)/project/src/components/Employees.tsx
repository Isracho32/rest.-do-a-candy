import { useEffect, useState } from 'react';
import { supabase, type Employee, type Category, type ContractType, CATEGORY_LABELS, CONTRACT_LABELS } from '../lib/supabase';
import { Plus, Search, Pencil, Trash2, Users, X } from 'lucide-react';

interface FormData {
  name: string;
  category: Category;
  contract_type: ContractType;
  monthly_salary: string;
  hourly_rate: string;
  fixed_block_start: string;
  fixed_block_end: string;
  fixed_block_pay: string;
  monthly_entry: string;
  monthly_exit: string;
  monthly_overtime_rate: string;
  daily_transport: string;
  active: boolean;
}

const empty: FormData = {
  name: '',
  category: 'ayudante_cocina',
  contract_type: 'hora',
  monthly_salary: '',
  hourly_rate: '',
  fixed_block_start: '11:30',
  fixed_block_end: '15:00',
  fixed_block_pay: '',
  monthly_entry: '09:00',
  monthly_exit: '18:00',
  monthly_overtime_rate: '',
  daily_transport: '',
  active: true,
};

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('employees').select('*').order('name');
    setEmployees(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setShowForm(true);
  }

  function openEdit(e: Employee) {
    setEditing(e);
    setForm({
      name: e.name,
      category: e.category,
      contract_type: e.contract_type,
      monthly_salary: e.monthly_salary?.toString() ?? '',
      hourly_rate: e.hourly_rate?.toString() ?? '',
      fixed_block_start: e.fixed_block_start ?? '11:30',
      fixed_block_end: e.fixed_block_end ?? '15:00',
      fixed_block_pay: e.fixed_block_pay?.toString() ?? '',
      monthly_entry: e.monthly_entry ?? '09:00',
      monthly_exit: e.monthly_exit ?? '18:00',
      monthly_overtime_rate: e.monthly_overtime_rate?.toString() ?? '',
      daily_transport: e.daily_transport?.toString() ?? '',
      active: e.active,
    });
    setShowForm(true);
  }

  async function save() {
    setSaving(true);
    const payload = {
      name: form.name,
      category: form.category,
      contract_type: form.contract_type,
      monthly_salary: form.monthly_salary ? parseFloat(form.monthly_salary) : null,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      fixed_block_start: form.fixed_block_start || null,
      fixed_block_end: form.fixed_block_end || null,
      fixed_block_pay: form.fixed_block_pay ? parseFloat(form.fixed_block_pay) : null,
      monthly_entry: form.monthly_entry || null,
      monthly_exit: form.monthly_exit || null,
      monthly_overtime_rate: form.monthly_overtime_rate ? parseFloat(form.monthly_overtime_rate) : null,
      daily_transport: form.daily_transport ? parseFloat(form.daily_transport) : null,
      active: form.active,
    };
    if (editing) {
      await supabase.from('employees').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('employees').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function remove(e: Employee) {
    if (!confirm(`¿Eliminar a ${e.name}?`)) return;
    await supabase.from('employees').delete().eq('id', e.id);
    load();
  }

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    CATEGORY_LABELS[e.category].toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="section-title">Empleados</h2>
          <p className="text-wood-500 text-sm mt-1">{employees.length} registrados</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={18} /> Nuevo Empleado
        </button>
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

      {loading ? (
        <div className="text-center py-12 text-wood-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-wood-400">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p>No hay empleados registrados</p>
        </div>
      ) : (
        <div className="grid gap-3 xs:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <div key={e.id} className="card p-4 sm:p-5 hover:shadow-md hover:border-wood-300 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-wood-100 text-wood-700 flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-wood-900 leading-tight truncate">{e.name}</h3>
                    <p className="text-xs text-wood-500 mt-0.5">{CATEGORY_LABELS[e.category]}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-wood-50 text-wood-500">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => remove(e)} className="p-1.5 rounded-lg hover:bg-ember-50 text-ember-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${e.contract_type === 'mensual' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {CONTRACT_LABELS[e.contract_type]}
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${e.active ? 'bg-emerald-50 text-emerald-700' : 'bg-wood-100 text-wood-500'}`}>
                  {e.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-wood-100 text-xs text-wood-500 space-y-1">
                {e.contract_type === 'mensual' && e.monthly_salary != null && (
                  <p className="font-medium text-wood-700">Bs {e.monthly_salary.toLocaleString('es-BO')} / mes</p>
                )}
                {e.contract_type === 'mensual' && e.monthly_overtime_rate != null && (
                  <p>Horas extra: Bs {e.monthly_overtime_rate}/h</p>
                )}
                {e.contract_type === 'hora' && e.fixed_block_pay != null && (
                  <p className="font-medium text-wood-700">Bs {e.fixed_block_pay.toLocaleString('es-BO')} por bloque · Bs {e.hourly_rate}/h extra</p>
                )}
                {e.daily_transport != null && (
                  <p>Pasajes: Bs {e.daily_transport}/día</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-wood-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-cream-50 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-wood-100 sticky top-0 bg-cream-50 rounded-t-2xl z-10">
              <h3 className="font-serif text-xl font-bold text-wood-900">{editing ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-wood-50 text-wood-500"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); save(); }} className="p-5 space-y-4">
              <Field label="Nombre">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Categoría">
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })} className="input">
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Contrato">
                  <select value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value as ContractType })} className="input">
                    {Object.entries(CONTRACT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
              </div>

              {form.contract_type === 'mensual' ? (
                <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Contrato Mensual</p>
                  <Field label="Salario mensual (Bs)">
                    <input type="number" min="0" value={form.monthly_salary} onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })} className="input" placeholder="3500" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Hora de entrada">
                      <input type="time" value={form.monthly_entry} onChange={(e) => setForm({ ...form, monthly_entry: e.target.value })} className="input" />
                    </Field>
                    <Field label="Hora de salida">
                      <input type="time" value={form.monthly_exit} onChange={(e) => setForm({ ...form, monthly_exit: e.target.value })} className="input" />
                    </Field>
                  </div>
                  <Field label="Valor hora extra (Bs/h)">
                    <input type="number" min="0" step="0.5" value={form.monthly_overtime_rate} onChange={(e) => setForm({ ...form, monthly_overtime_rate: e.target.value })} className="input" placeholder="25" />
                  </Field>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Contrato por Hora</p>
                  <Field label="Pago por bloque (Bs)">
                    <input type="number" min="0" value={form.fixed_block_pay} onChange={(e) => setForm({ ...form, fixed_block_pay: e.target.value })} className="input" placeholder="50" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Inicio bloque">
                      <input type="time" value={form.fixed_block_start} onChange={(e) => setForm({ ...form, fixed_block_start: e.target.value })} className="input" />
                    </Field>
                    <Field label="Fin bloque">
                      <input type="time" value={form.fixed_block_end} onChange={(e) => setForm({ ...form, fixed_block_end: e.target.value })} className="input" />
                    </Field>
                  </div>
                  <Field label="Valor hora extra (Bs/h)">
                    <input type="number" min="0" step="0.5" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} className="input" placeholder="20" />
                  </Field>
                </div>
              )}

              <Field label="Pasajes diarios (Bs)">
                <input type="number" min="0" step="0.5" value={form.daily_transport} onChange={(e) => setForm({ ...form, daily_transport: e.target.value })} className="input" placeholder="10" />
              </Field>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 rounded accent-ember-600" />
                <span className="text-sm text-wood-700">Empleado activo</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-wood-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
