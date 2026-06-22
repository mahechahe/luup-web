import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MapIcon,
  ListChecks,
  UserCheck,
  BarChart2,
  Users,
  ArrowRight,
} from 'lucide-react';
import { getEventoDetailService } from './services/eventServices';
import { EventoHeader } from './Canvas/components/EventoHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess } from '@/App/utils/roles';

const MODULES = [
  {
    id: 'canvas',
    title: 'Layout',
    description:
      'Diseña y gestiona las zonas del evento sobre el plano del recinto. Asigna colaboradores y coordinadores.',
    icon: MapIcon,
    color: '#234465',
    index: '01',
  },
  {
    id: 'zonas',
    title: 'Zonas',
    description:
      'Visualiza y administra todas las zonas en formato lista. Gestiona personal asignado y capacidades.',
    icon: ListChecks,
    color: '#DD7419',
    index: '02',
  },
  {
    id: 'checkin',
    title: 'Check-in',
    description:
      'Controla asistencia y registros de entrada y salida del personal asignado a las zonas.',
    icon: UserCheck,
    color: '#7493B2',
    index: '03',
  },
  {
    id: 'reporte',
    title: 'Reporte',
    description:
      'Consulta asistencias, ingresos de residuos, salidas de camiones y galería fotográfica.',
    icon: BarChart2,
    color: '#4f6d44',
    index: '04',
    adminOnly: false,
  },
  {
    id: 'clientes',
    title: 'Clientes',
    description:
      'Gestiona accesos de cliente y asigna el tipo de servicio para este evento.',
    icon: Users,
    color: '#0f766e',
    index: '05',
    adminOnly: true,
  },
];

export default function EventoModulesPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const { user } = useUserStore();
  const isAdmin = hasAdminAccess(user?.roleId);

  useEffect(() => {
    getEventoDetailService(eventId).then((res) => {
      if (res.status) setEvent(res.event);
      setLoading(false);
    });
  }, [eventId]);

  const modules = MODULES.filter((m) => !m.adminOnly || isAdmin).map((m) => ({
    ...m,
    path:
      m.id === 'reporte'
        ? `/reportes/${eventId}`
        : `/eventos/${eventId}/${m.id}`,
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <EventoHeader
        loading={loading}
        event={event}
        onBack={() => navigate('/eventos/listado')}
      />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Section heading */}
        <div className="mb-10">
          {loading ? (
            <>
              <Skeleton className="h-3.5 w-40 mb-3" />
              <Skeleton className="h-7 w-56" />
            </>
          ) : (
            <>
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-2">
                {event?.name}
              </p>
              <h2 className="text-[22px] font-bold text-foreground leading-tight">
                Selecciona un módulo
              </h2>
            </>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden border border-border bg-card"
                >
                  <div className="h-1 w-full bg-muted" />
                  <div className="p-6">
                    <Skeleton className="w-11 h-11 rounded-xl mb-5" />
                    <Skeleton className="h-5 w-1/2 mb-3" />
                    <Skeleton className="h-4 w-full mb-1.5" />
                    <Skeleton className="h-4 w-4/5 mb-1.5" />
                    <Skeleton className="h-4 w-3/5 mb-6" />
                    <Skeleton className="h-px w-full mb-4" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                </div>
              ))
            : modules.map((module, idx) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  idx={idx}
                  onClick={() =>
                    navigate(module.path, {
                      state:
                        module.id === 'reporte'
                          ? { backTo: `/eventos/${eventId}` }
                          : undefined,
                    })
                  }
                />
              ))}
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ module, idx, onClick }) {
  const hex = module.color;

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col text-left rounded-2xl overflow-hidden border border-border bg-card transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${idx * 55}ms`, animationFillMode: 'both' }}
    >
      {/* Top accent bar */}
      <div
        className="h-[3px] w-full shrink-0 transition-all duration-300 group-hover:h-[5px]"
        style={{ backgroundColor: hex }}
      />

      {/* Subtle hover gradient wash */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{
          background: `linear-gradient(145deg, ${hex}0d 0%, transparent 55%)`,
        }}
      />

      <div className="flex-1 flex flex-col p-6 relative overflow-hidden">
        {/* Ghost index number */}
        <span
          className="absolute -right-2 -top-3 text-[76px] font-black leading-none select-none transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-1"
          style={{ color: hex, opacity: 0.07 }}
          aria-hidden
        >
          {module.index}
        </span>

        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${hex}18` }}
        >
          <module.icon className="w-[22px] h-[22px]" style={{ color: hex }} />
        </div>

        {/* Text */}
        <h3 className="text-[15px] font-bold text-foreground mb-2 tracking-tight">
          {module.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          {module.description}
        </p>

        {/* Footer */}
        <div className="flex items-center mt-6 pt-4 border-t border-border">
          <span
            className="text-[11px] font-semibold tracking-[0.15em] uppercase"
            style={{ color: hex }}
          >
            Abrir módulo
          </span>
          <ArrowRight
            className="w-3.5 h-3.5 ml-2 transition-transform duration-300 group-hover:translate-x-1.5"
            style={{ color: hex }}
          />
        </div>
      </div>
    </button>
  );
}
