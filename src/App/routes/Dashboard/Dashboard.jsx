import { Calendar, Users, MapPin, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/App/context/userStore';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getRoleLabel(roleId) {
  if (roleId === 1) return 'Administrador';
  return 'Colaborador';
}

const FEATURES = [
  {
    icon: Calendar,
    title: 'Gestión de eventos',
    description: 'Organiza y supervisa eventos en tiempo real.',
  },
  {
    icon: MapPin,
    title: 'Zonas y acopios',
    description: 'Controla zonas generales y centros de acopio.',
  },
  {
    icon: Users,
    title: 'Personal',
    description: 'Asigna supervisores, coordinadores y colaboradores.',
  },
  {
    icon: ClipboardList,
    title: 'Incidencias y basuras',
    description: 'Registra novedades y conteo de residuos por zona.',
  },
];

function Dashboard() {
  const { user } = useUserStore();
  const navigate = useNavigate();

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Usuario';
  const cedula = user?.username ?? '—';
  const role = getRoleLabel(user?.roleId);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Saludo */}
        <section className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#DD7419]">
            {getGreeting()}
          </p>
          <h1 className="text-2xl font-black text-[#234465] leading-tight">
            {fullName}
          </h1>
        </section>

        {/* Tarjeta de usuario */}
        <section className="rounded-2xl bg-[#234465] px-5 py-5 text-white shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <span className="text-xl font-black leading-none">
                {fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-base leading-tight truncate">{fullName}</p>
              <p className="text-white/60 text-xs mt-0.5">CC {cedula}</p>
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-semibold">
                {role}
              </span>
            </div>
          </div>
        </section>

        {/* Mensaje de bienvenida */}
        <section className="rounded-2xl border border-border bg-white px-5 py-5 space-y-1.5 shadow-sm">
          <p className="text-sm font-bold text-foreground">
            Bienvenido a LUUP
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Plataforma de gestión operativa para eventos. Desde aquí puedes
            coordinar zonas, registrar personal, hacer seguimiento de incidencias
            y controlar el ingreso de residuos en centros de acopio.
          </p>
        </section>

        {/* Funcionalidades */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
            Qué puedes hacer
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-white px-4 py-4 space-y-2 shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-[#DD7419]/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#DD7419]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-tight">{title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section>
          <button
            type="button"
            onClick={() => navigate('/eventos/listado')}
            className="w-full h-12 rounded-xl bg-[#DD7419] text-white font-bold text-sm hover:bg-[#DD7419]/90 active:scale-[0.98] transition-all shadow-sm"
          >
            Ir a eventos
          </button>
        </section>

      </main>
    </div>
  );
}

export default Dashboard;
