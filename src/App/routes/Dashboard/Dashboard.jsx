import { useEffect, useState } from 'react';
import { Calendar, Users, MapPin, ClipboardList, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/App/context/userStore';
import { getWorkerCurrentEventService } from '@/App/routes/Eventos/services/eventServices';

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

// Etiqueta legible del rol asignado en el evento activo
function getEventRoleLabel(eventRole) {
  if (eventRole === 'coordinator') return 'Coordinador';
  if (eventRole === 'supervisor') return 'Supervisor';
  if (eventRole === 'worker') return 'Colaborador';
  return null;
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

// Ruta destino según el rol en el evento activo
const ROLE_PATH = {
  coordinator: (eventId) => `/eventos/${eventId}/zonas`,
  supervisor:  (eventId) => `/eventos/${eventId}/zonas`,
  worker:      (eventId) => `/eventos/${eventId}/worker`,
};

// Label del botón según el rol en el evento activo
const ROLE_LABEL = {
  coordinator: 'Ir a mis zonas',
  supervisor:  'Ir a mis zonas',
  worker:      'Ver mi estado en el evento',
};

function Dashboard() {
  const { user } = useUserStore();
  const navigate = useNavigate();

  const isAdmin = user?.roleId === 1;

  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventRole, setEventRole] = useState(null); // 'coordinator' | 'supervisor' | 'worker'
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [navigating, setNavigating] = useState(false);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Usuario';
  const cedula = user?.username ?? '—';
  const role = getRoleLabel(user?.roleId);

  // Solo los no-admins necesitan consultar su evento activo
  useEffect(() => {
    if (isAdmin) {
      setLoadingEvent(false);
      return;
    }
    getWorkerCurrentEventService().then((res) => {
      if (res.status && res.currentEvent) {
        setCurrentEvent(res.currentEvent);
        setEventRole(res.currentEvent.role);
      }
      setLoadingEvent(false);
    });
  }, [isAdmin]);

  const handleNavigate = async (path) => {
    setNavigating(true);
    await new Promise((r) => setTimeout(r, 250));
    navigate(path);
  };

  // Decide ruta y label del botón según el contexto del usuario
  const getButtonProps = () => {
    if (isAdmin) {
      return { label: 'Ir a eventos', path: '/eventos/listado' };
    }
    if (!loadingEvent && !currentEvent) {
      return { label: 'Ver mis eventos', path: '/eventos/mis-eventos' };
    }
    const eventId = currentEvent?.eventId ?? currentEvent?.id;
    return {
      label: ROLE_LABEL[eventRole] ?? 'Ir al evento',
      path: eventId ? ROLE_PATH[eventRole]?.(eventId) : null,
    };
  };

  const { label: btnLabel, path: btnPath } = getButtonProps();

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Saludo */}
        <section className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#DD7419]">
            {getGreeting()}
          </p>
          <h1 className="text-2xl font-black text-[#234465] dark:text-foreground leading-tight">
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
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {/* Rol base del sistema */}
                <span className="inline-block px-2 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-semibold">
                  {role}
                </span>
                {/* Rol en el evento activo — aparece solo cuando está asignado */}
                {!loadingEvent && eventRole && !isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DD7419] text-white text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                    {getEventRoleLabel(eventRole)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Mensaje de bienvenida */}
        <section className="rounded-2xl border border-border bg-card px-5 py-5 space-y-1.5 shadow-sm">
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
                className="rounded-xl border border-border bg-card px-4 py-4 space-y-2 shadow-sm"
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

        {/* CTA — botón naranja original, label cambia según rol */}
        <section>
          <button
            type="button"
            onClick={() => btnPath && handleNavigate(btnPath)}
            disabled={navigating || loadingEvent || !btnPath}
            className="w-full h-12 rounded-xl bg-[#DD7419] text-white font-bold text-sm hover:bg-[#DD7419]/90 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {navigating || loadingEvent ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              btnLabel
            )}
          </button>
        </section>

      </main>
    </div>
  );
}

export default Dashboard;
