import { useState } from 'react';
import { Users, CalendarDays, Clock as ClockIcon, BarChart3, AlertOctagon, CalendarHeart } from 'lucide-react';
import Clock from './components/Clock';
import Employees from './components/Employees';
import Schedules from './components/Schedules';
import Reports from './components/Reports';
import Fines from './components/Fines';
import Holidays from './components/Holidays';

type Tab = 'clock' | 'employees' | 'schedules' | 'fines' | 'holidays' | 'reports';

const tabs: { id: Tab; label: string; icon: typeof Users; short: string }[] = [
  { id: 'clock',     label: 'Tiqueo',     short: 'Tiqueo',    icon: ClockIcon },
  { id: 'employees', label: 'Empleados',  short: 'Personal',  icon: Users },
  { id: 'schedules', label: 'Horarios',   short: 'Horarios',  icon: CalendarDays },
  { id: 'fines',     label: 'Multas',     short: 'Multas',    icon: AlertOctagon },
  { id: 'holidays',  label: 'Feriados',   short: 'Feriados',  icon: CalendarHeart },
  { id: 'reports',   label: 'Reportes',   short: 'Pagos',     icon: BarChart3 },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('clock');

  return (
    <div className="flex min-h-dvh bg-cream-100">

      {/* ── Sidebar (md+) ─────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-40 w-64 lg:w-72 overflow-hidden shadow-2xl">
        {/* Wood texture layer */}
        <div className="absolute inset-0 wood-panel" />
        <div className="absolute inset-0 wood-overlay" />

        {/* Logo area */}
        <div className="relative z-10 flex flex-col items-center px-6 pt-8 pb-6 border-b border-white/10">
          <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 border-gold-400 shadow-xl ring-2 ring-gold-600/30">
            <img
              src="/images/WhatsApp_Image_2026-03-28_at_9.39.05_PM.jpeg"
              alt="Restaurante Doña Candy"
              className="w-full h-full object-cover object-top"
              style={{ objectPosition: '13% 5%', transform: 'scale(2.2)', transformOrigin: '20% 10%' }}
            />
          </div>
          <h1 className="mt-4 font-serif text-xl lg:text-2xl font-bold text-cream-100 leading-tight text-center">
            Doña Candy
          </h1>
          <p className="text-xs text-gold-400 font-medium tracking-wider uppercase mt-0.5">Control de Personal</p>
        </div>

        {/* Nav links */}
        <nav className="relative z-10 flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-ember-600 text-white shadow-lg shadow-ember-900/40'
                  : 'text-cream-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <t.icon size={18} className={tab === t.id ? 'text-white' : 'text-gold-400'} />
              {t.label}
            </button>
          ))}
        </nav>

        {/* Footer brand */}
        <div className="relative z-10 px-5 pb-5 pt-2 border-t border-white/10">
          <p className="text-[10px] text-cream-300/60 text-center">"Lo hacemos como en casa"</p>
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 overflow-hidden shadow-md h-16">
        <div className="absolute inset-0 wood-panel" />
        <div className="absolute inset-0 wood-overlay" />
        <div className="relative z-10 flex items-center gap-3 px-4 h-full">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold-400 shadow-md flex-shrink-0">
            <img
              src="/images/WhatsApp_Image_2026-03-28_at_9.39.05_PM.jpeg"
              alt="Logo"
              className="w-full h-full object-cover"
              style={{ objectPosition: '13% 5%', transform: 'scale(2.2)', transformOrigin: '20% 10%' }}
            />
          </div>
          <div>
            <h1 className="font-serif text-base font-bold text-cream-100 leading-tight">Doña Candy</h1>
            <p className="text-[10px] text-gold-400 font-medium leading-none">Control de Personal</p>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-medium text-cream-300 bg-white/10 px-3 py-1 rounded-full">
              {tabs.find((t) => t.id === tab)?.label}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 lg:ml-72 mt-16 md:mt-0 pb-24 md:pb-0 min-h-dvh">
        {/* Page header stripe (desktop) */}
        <div className="hidden md:block h-2 wood-panel opacity-60" />

        <div className="max-w-5xl mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {tab === 'clock'     && <Clock />}
          {tab === 'employees' && <Employees />}
          {tab === 'schedules' && <Schedules />}
          {tab === 'fines'     && <Fines />}
          {tab === 'holidays'  && <Holidays />}
          {tab === 'reports'   && <Reports />}
        </div>
      </main>

      {/* ── Bottom nav (mobile only) ─────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-wood-800 border-t-2 border-gold-500/30 shadow-2xl">
        <div className="grid grid-cols-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center justify-center py-2.5 gap-1 transition-all ${
                tab === t.id ? 'text-gold-400' : 'text-cream-300/50'
              }`}
            >
              <t.icon
                size={tab === t.id ? 22 : 20}
                className={`transition-all ${tab === t.id ? 'drop-shadow-[0_0_4px_rgba(245,204,94,0.6)]' : ''}`}
              />
              <span className="text-[9px] font-semibold leading-none tracking-tight">{t.short}</span>
            </button>
          ))}
        </div>
        <div className="h-[env(safe-area-inset-bottom)] bg-wood-800" />
      </nav>
    </div>
  );
}
