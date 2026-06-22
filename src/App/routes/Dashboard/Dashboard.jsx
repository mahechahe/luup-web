import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  ClipboardList,
  Loader2,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/App/context/userStore';
import { getWorkerCurrentEventService } from '@/App/routes/Eventos/services/eventServices';
import { hasAdminAccess, getRoleLabel } from '@/App/utils/roles';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// Etiqueta legible del rol asignado en el evento activo
function getEventRoleLabel(eventRole) {
  if (eventRole === 'coordinator') return 'Coordinador';
  if (eventRole === 'supervisor') return 'Supervisor';
  if (eventRole === 'responsable_acopio') return 'Resp. Acopio';
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
  supervisor: (eventId) => `/eventos/${eventId}/zonas`,
  responsable_acopio: (eventId) => `/eventos/${eventId}/zonas`,
  worker: (eventId) => `/eventos/${eventId}/worker`,
};

// Label del botón según el rol en el evento activo
const ROLE_LABEL = {
  coordinator: 'Ir a mis zonas',
  supervisor: 'Ir a mis zonas',
  responsable_acopio: 'Ir a mis zonas',
  worker: 'Ver mi estado en el evento',
};

function Dashboard() {
  const { user } = useUserStore();
  const navigate = useNavigate();

  const isAdmin = hasAdminAccess(user?.roleId);

  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventRole, setEventRole] = useState(null); // 'coordinator' | 'supervisor' | 'worker'
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [navigating, setNavigating] = useState(false);

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Usuario';
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
    <div className="min-h-[calc(100dvh-3rem)] bg-background px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-8">
      <main className="mx-auto max-w-6xl space-y-6">
        {/* Bienvenida + identidad */}
        <section className="relative isolate overflow-hidden rounded-3xl bg-luup-blue-dark px-5 py-6 text-white shadow-[0_20px_50px_rgba(35,68,101,0.2)] sm:px-8 sm:py-8 lg:px-10 lg:py-9">
          <div className="pointer-events-none absolute -right-16 -top-32 -z-10 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-2 -top-16 -z-10 h-52 w-52 rounded-full border border-dashed border-white/10" />
          <div className="pointer-events-none absolute inset-y-0 left-[58%] -z-10 hidden w-px bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block" />

          <div className="grid items-center gap-7 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-muted">
                <Sparkles className="h-3.5 w-3.5" />
                {getGreeting()}
              </p>
              <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                Hola, {user?.firstName || fullName}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
                Todo lo que necesitas para coordinar la operación está reunido
                aquí. Revisa tu actividad y continúa donde la dejaste.
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm sm:p-5">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-brand text-xl font-black shadow-[0_8px_20px_rgba(221,116,25,0.3)]">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{fullName}</p>
                <p className="mt-0.5 text-xs text-white/50">C.C. {cedula}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/85">
                    {role}
                  </span>
                  {!loadingEvent && eventRole && !isAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold text-white">
                      <BadgeCheck className="h-3 w-3" />
                      {getEventRoleLabel(eventRole)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Acción principal */}
        <section className="relative overflow-hidden rounded-2xl border border-brand/25 bg-gradient-to-br from-brand/[0.09] via-card to-card p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -bottom-16 -right-10 h-40 w-40 rounded-full border border-brand/10" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand">
                  {isAdmin
                    ? 'Gestión operativa'
                    : currentEvent
                      ? 'Tu evento actual'
                      : 'Agenda de eventos'}
                </p>
                <h2 className="mt-1 truncate text-xl font-bold tracking-tight text-foreground">
                  {isAdmin
                    ? 'Administra los eventos de LUUP'
                    : currentEvent?.name || 'Consulta tus asignaciones'}
                </h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {isAdmin
                    ? 'Crea eventos, asigna personal y da seguimiento a cada operación desde un solo lugar.'
                    : currentEvent
                      ? currentEvent.location ||
                        'Continúa con la operación de tu evento asignado.'
                      : 'Cuando recibas una nueva asignación aparecerá aquí para que puedas acceder rápidamente.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => btnPath && handleNavigate(btnPath)}
              disabled={navigating || loadingEvent || !btnPath}
              className="group flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(221,116,25,0.22)] transition-all hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_12px_24px_rgba(221,116,25,0.3)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {navigating || loadingEvent ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {btnLabel}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </section>

        {/* Funcionalidades */}
        <section>
          <div className="mb-3 flex items-end justify-between gap-4 px-0.5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                Herramientas LUUP
              </p>
              <h2 className="mt-1 text-lg font-bold text-foreground">
                Tu operación, de un vistazo
              </h2>
            </div>
            <p className="hidden text-xs text-muted-foreground sm:block">
              4 áreas de gestión
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description }, index) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-md"
              >
                <span className="absolute right-4 top-3 text-4xl font-black text-muted/50">
                  0{index + 1}
                </span>
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 transition-colors group-hover:bg-brand group-hover:text-white">
                  <Icon className="h-4.5 w-4.5 text-brand transition-colors group-hover:text-white" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-foreground">
                  {title}
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
